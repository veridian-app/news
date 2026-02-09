/**
 * analyze-placsp.ts - Cron para extraer licitaciones de la Plataforma de Contratación del Sector Público
 * 
 * Consume el feed Atom diario de PLACSP.
 * Requiere saltar validación SSL (certificado autofirmado del gobierno).
 * 
 * Endpoint: https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import https from 'https';

// =============================================================================
// CONFIGURACIÓN
// =============================================================================

const PLACSP_ATOM_URL = 'https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// =============================================================================
// TIPOS
// =============================================================================

interface PLACSPEntry {
    id: string;
    link: string;
    summary: string; // Contiene Importe y Órgano
    title: string;   // Contiene Objeto del contrato
    updated: string;
    importe?: number;
    organo?: string;
    estado?: string;
}

interface AnalisisIA {
    resumen_veridian: string;
    contexto_detallado: string;
}

// =============================================================================
// FUNCIONES DE UTILIDAD
// =============================================================================

function formatearImporte(importe: number): string {
    if (importe >= 1000000) {
        return `${(importe / 1000000).toFixed(1).replace('.0', '')}M€`;
    }
    if (importe >= 1000) {
        return `${Math.round(importe / 1000)}K€`;
    }
    return `${importe.toFixed(0)}€`;
}

// Función para descargar XML ignorando SSL
function fetchXMLInsecure(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        https.get(url, { agent }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', (err) => reject(err));
    });
}

// =============================================================================
// PARSER XML (REGEX)
// =============================================================================

function parseAtomFeed(xml: string): PLACSPEntry[] {
    const entries: PLACSPEntry[] = [];

    // Regex simple para capturar bloques <entry>...</entry>
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;

    while ((match = entryRegex.exec(xml)) !== null) {
        const content = match[1];

        const id = content.match(/<id>(.*?)<\/id>/)?.[1] || '';
        const title = content.match(/<title>(.*?)<\/title>/)?.[1] || '';
        const updated = content.match(/<updated>(.*?)<\/updated>/)?.[1] || '';
        const summary = content.match(/<summary type="text">(.*?)<\/summary>/)?.[1] || '';

        // Link suele ser <link href="..." .../>
        const link = content.match(/<link href="(.*?)"/)?.[1] || '';

        // Extraer datos del summary
        // Formato típico: "Id licitación: ...; Órgano de Contratación: ...; Importe: 53845.67 EUR; Estado: RES"

        let importe = 0;
        const importeMatch = summary.match(/Importe: (\d+(\.\d+)?) EUR/);
        if (importeMatch) {
            importe = parseFloat(importeMatch[1]);
        }

        const organoMatch = summary.match(/Órgano de Contratación: (.*?);/);
        const organo = organoMatch ? organoMatch[1] : 'Desconocido';

        const estadoMatch = summary.match(/Estado: (\w+)/);
        const estado = estadoMatch ? estadoMatch[1] : 'PUB';

        entries.push({
            id,
            link,
            title,
            updated,
            summary,
            importe,
            organo,
            estado
        });
    }

    return entries;
}

// =============================================================================
// ANÁLISIS CON IA (GEMINI FLASH)
// =============================================================================

async function analizarConIA(entry: PLACSPEntry): Promise<AnalisisIA | null> {
    if (!GEMINI_API_KEY) {
        return {
            resumen_veridian: `${formatearImporte(entry.importe || 0)} para ${entry.title.substring(0, 50)}...`,
            contexto_detallado: `Contrato público de ${entry.organo}. Objeto: ${entry.title}.`
        };
    }

    const systemPrompt = `Eres un periodista de investigación especializado en contratación pública.
Tu tarea es explicar licitaciones del gobierno de forma clara y ligeramente crítica si es necesario.

RESUMEN VERIDIAN (titular):
- MÁXIMO 15 palabras
- Incluye el importe
- Ejemplo: "150.000€ de Hacienda para renovar licencias de software"

CONTEXTO DETALLADO (explicación):
- 2-3 frases explicando qué se contrata y para qué.
- Menciona quién paga (Órgano).
- Si el objeto es vago o técnico, tradúcelo a lenguaje común.

RESPONDE SOLO EN JSON:
{
  "resumen_veridian": "Titular corto...",
  "contexto_detallado": "Explicación..."
}`;

    const prompt = `Analiza esta licitación:

IMPORTE: ${entry.importe} EUR
ÓRGANO: ${entry.organo}
OBJETO: ${entry.title}
ESTADO: ${entry.estado}

Genera el JSON.`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    generationConfig: {
                        temperature: 0.3, // Más bajo para ser preciso
                        maxOutputTokens: 500
                    }
                })
            }
        );

        if (!response.ok) return null;

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        return null;
    } catch (error) {
        console.error('Error IA:', error);
        return null;
    }
}

// =============================================================================
// HANDLER
// =============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // GET: Devolver guardados
    if (req.method === 'GET') {
        const limit = parseInt(req.query.limit as string) || 10;
        const { data, error } = await supabase
            .from('placsp_contratos')
            .select('*')
            .order('importe', { ascending: false })
            .limit(limit);

        if (error) return res.status(500).json({ error: error.message });

        const total = data?.reduce((sum, s) => sum + (s.importe || 0), 0) || 0;

        return res.status(200).json({
            contratos: data,
            stats: { total_registros: data?.length || 0, importe_total: total }
        });
    }

    // POST: Cron
    const authHeader = req.headers['authorization'];
    const isVercelCron = req.headers['user-agent'] === 'vercel-cron/1.0';
    const isAuthorized = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (!isVercelCron && !isAuthorized) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        console.log('🏛️ ANALIZADOR PLACSP iniciando...');

        // 1. Descargar XML (inseguro SSL)
        const xml = await fetchXMLInsecure(PLACSP_ATOM_URL);
        console.log(`📡 XML descargado: ${xml.length} bytes`);

        // 2. Parsear
        const entries = parseAtomFeed(xml);
        console.log(`📊 Total entradas en feed: ${entries.length}`);

        // 3. Filtrar > 15.000€
        const significativas = entries.filter(e => (e.importe || 0) >= 15000);
        console.log(`💰 ${significativas.length} licitaciones > 15.000€`);

        // 4. Procesar Top 10
        let saved = 0;
        const results = [];

        for (const entry of significativas.slice(0, 10)) {
            // Verificar duplicados
            const { data: existing } = await supabase
                .from('placsp_contratos')
                .select('id')
                .eq('placsp_id', entry.id)
                .single();

            if (existing) continue;

            console.log(`\n📝 Analizando: ${entry.organo} - ${formatearImporte(entry.importe || 0)}`);

            // Analizar IA
            const analisis = await analizarConIA(entry);

            if (!analisis) continue;

            // Guardar
            const { error } = await supabase
                .from('placsp_contratos')
                .insert({
                    placsp_id: entry.id,
                    titulo: entry.title,
                    organo_contratacion: entry.organo,
                    fecha_publicacion: entry.updated,
                    importe: entry.importe,
                    estado: entry.estado,
                    link_licitacion: entry.link,
                    raw_summary: entry.summary,
                    resumen_veridian: analisis.resumen_veridian,
                    contexto_detallado: analisis.contexto_detallado
                });

            if (!error) {
                saved++;
                results.push({ resumen: analisis.resumen_veridian, importe: entry.importe });
                console.log(`   ✅ Guardado: ${analisis.resumen_veridian}`);
            }
        }

        return res.status(200).json({ success: true, saved, results });

    } catch (error) {
        console.error('❌ Error PLACSP:', error);
        return res.status(500).json({ error: 'Error procesando PLACSP', details: error instanceof Error ? error.message : 'Unknown' });
    }
}
