/**
 * analyze-bdns.ts - Cron para extraer subvenciones del BDNS
 * 
 * El BDNS (Base de Datos Nacional de Subvenciones) tiene una API pública
 * que devuelve las concesiones de subvenciones con importes exactos.
 * 
 * Endpoint: https://www.pap.hacienda.gob.es/bdnstrans/api/concesiones/busqueda
 * 
 * Variables de entorno:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_KEY
 * - GEMINI_API_KEY
 * - CRON_SECRET
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// =============================================================================
// CONFIGURACIÓN
// =============================================================================

const BDNS_API_BASE = 'https://www.pap.hacienda.gob.es/bdnstrans/api/concesiones/busqueda';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// =============================================================================
// TIPOS
// =============================================================================

interface BDNSConcesion {
    id: number;
    codConcesion: string;
    fechaConcesion: string;
    beneficiario: string;
    instrumento: string;
    importe: number;
    ayudaEquivalente: number;
    convocatoria: string;
    numeroConvocatoria: string;
    nivel1: string; // LOCAL, ESTATAL, etc
    nivel2: string; // Departamento
    nivel3: string; // Órgano
}

interface BDNSResponse {
    content: BDNSConcesion[];
    totalElements: number;
    totalPages: number;
}

interface AnalisisIA {
    resumen_veridian: string;
    contexto_detallado: string;
}

// =============================================================================
// FUNCIONES DE UTILIDAD
// =============================================================================

function formatearFecha(date: Date): string {
    return date.toISOString().split('T')[0];
}

function formatearImporte(importe: number): string {
    if (importe >= 1000000) {
        return `${(importe / 1000000).toFixed(1).replace('.0', '')}M€`;
    }
    if (importe >= 1000) {
        return `${Math.round(importe / 1000)}K€`;
    }
    return `${importe.toFixed(0)}€`;
}

// =============================================================================
// LLAMADA A API BDNS
// =============================================================================

async function fetchBDNSConcesiones(fecha: string, pageSize: number = 50): Promise<BDNSConcesion[]> {
    const url = `${BDNS_API_BASE}?vpd=GE&page=0&pageSize=${pageSize}&order=importe&direccion=desc`;

    console.log(`📡 Llamando API BDNS: ${url}`);

    const response = await fetch(url, {
        headers: {
            'Accept': 'application/json',
            'User-Agent': 'Veridian/1.0 (gasto publico tracker)'
        }
    });

    if (!response.ok) {
        throw new Error(`BDNS API error: ${response.status}`);
    }

    const data: BDNSResponse = await response.json();
    console.log(`📊 BDNS devolvió ${data.content.length} concesiones (de ${data.totalElements} total)`);

    return data.content;
}

// =============================================================================
// ANÁLISIS CON IA (GEMINI FLASH)
// =============================================================================

async function analizarConIA(concesion: BDNSConcesion): Promise<AnalisisIA | null> {
    if (!GEMINI_API_KEY) {
        // Sin IA, generar resumen básico
        return {
            resumen_veridian: `${formatearImporte(concesion.importe)} a ${concesion.beneficiario.split(' ').slice(1).join(' ')}`,
            contexto_detallado: `Subvención de ${formatearImporte(concesion.importe)} concedida por ${concesion.nivel2 || concesion.nivel1} al beneficiario ${concesion.beneficiario}. Convocatoria: ${concesion.convocatoria}.`
        };
    }

    const systemPrompt = `Eres un periodista de investigación especializado en gasto público español.
Tu tarea es resumir subvenciones en lenguaje que entienda cualquier ciudadano.

RESUMEN VERIDIAN (titular):
- MÁXIMO 15 palabras
- Incluye el importe
- Directo, sin jerga burocrática
- Ejemplo: "5.000€ del Ayuntamiento de Barcelona para restaurar la fachada del Teatro Grec"

CONTEXTO DETALLADO (explicación):
- 2-3 frases que expliquen:
  * ¿Qué se subvenciona exactamente?
  * ¿Quién lo paga y quién lo recibe?
  * ¿Por qué podría interesar al ciudadano?
- Lenguaje claro, como si lo explicaras a un amigo

RESPONDE SOLO EN JSON:
{
  "resumen_veridian": "Titular corto con importe",
  "contexto_detallado": "Explicación de 2-3 frases"
}`;

    const prompt = `Analiza esta subvención:

IMPORTE: ${formatearImporte(concesion.importe)} (${concesion.importe}€)
BENEFICIARIO: ${concesion.beneficiario}
CONVOCATORIA: ${concesion.convocatoria}
ADMINISTRACIÓN: ${concesion.nivel1} > ${concesion.nivel2 || 'N/A'} > ${concesion.nivel3 || 'N/A'}
INSTRUMENTO: ${concesion.instrumento}

Genera el JSON con resumen y contexto.`;

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
                        temperature: 0.4,
                        maxOutputTokens: 500
                    }
                })
            }
        );

        if (!response.ok) {
            console.error(`❌ Error Gemini: ${response.status}`);
            return null;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Parsear JSON de la respuesta
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return null;
    } catch (error) {
        console.error('Error IA:', error);
        return null;
    }
}

// =============================================================================
// HANDLER PRINCIPAL
// =============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // ==========================================================================
    // GET: Devolver subvenciones guardadas
    // ==========================================================================
    if (req.method === 'GET') {
        const limit = parseInt(req.query.limit as string) || 10;

        const { data, error } = await supabase
            .from('bdns_subvenciones')
            .select('*')
            .order('importe', { ascending: false })
            .limit(limit);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        const total = data?.reduce((sum, s) => sum + (s.importe || 0), 0) || 0;

        return res.status(200).json({
            subvenciones: data,
            stats: {
                total_registros: data?.length || 0,
                importe_total: total
            }
        });
    }

    // ==========================================================================
    // POST: Cron de análisis (requiere autenticación)
    // ==========================================================================
    const authHeader = req.headers['authorization'];
    const isVercelCron = req.headers['user-agent'] === 'vercel-cron/1.0';
    const isAuthorized = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (!isVercelCron && !isAuthorized) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        console.log('🏛️ ANALIZADOR BDNS iniciando...');

        const hoy = formatearFecha(new Date());
        console.log(`📅 Fecha: ${hoy}`);

        // 1. OBTENER CONCESIONES (las más grandes por importe)
        const concesiones = await fetchBDNSConcesiones(hoy, 30);

        if (concesiones.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No hay concesiones nuevas',
                stats: { total: 0, saved: 0 }
            });
        }

        // 2. FILTRAR: Solo las de importe significativo (> 5.000€)
        const significativas = concesiones.filter(c => c.importe >= 5000);
        console.log(`💰 ${significativas.length} concesiones > 5.000€`);

        // 3. PROCESAR Y GUARDAR
        let saved = 0;
        const results: { beneficiario: string; importe: number; resumen: string }[] = [];

        for (const concesion of significativas.slice(0, 15)) { // Límite de 15 por ejecución
            console.log(`\n📝 Procesando: ${concesion.beneficiario.substring(0, 50)}... (${formatearImporte(concesion.importe)})`);

            // Verificar si ya existe
            const { data: existing } = await supabase
                .from('bdns_subvenciones')
                .select('id')
                .eq('bdns_id', concesion.id)
                .single();

            if (existing) {
                console.log('   ⏭️ Ya existe, saltando...');
                continue;
            }

            // Analizar con IA
            const analisis = await analizarConIA(concesion);

            if (!analisis) {
                console.log('   ⚠️ Sin análisis IA');
                continue;
            }

            // Guardar en DB
            const { error } = await supabase
                .from('bdns_subvenciones')
                .insert({
                    bdns_id: concesion.id,
                    codigo_concesion: concesion.codConcesion,
                    fecha_concesion: concesion.fechaConcesion,
                    beneficiario: concesion.beneficiario,
                    importe: concesion.importe,
                    instrumento: concesion.instrumento,
                    convocatoria: concesion.convocatoria,
                    numero_convocatoria: concesion.numeroConvocatoria,
                    administracion: concesion.nivel1,
                    departamento: concesion.nivel2,
                    organo: concesion.nivel3,
                    resumen_veridian: analisis.resumen_veridian,
                    contexto_detallado: analisis.contexto_detallado
                });

            if (error) {
                console.error('❌ Error guardando:', error);
            } else {
                saved++;
                results.push({
                    beneficiario: concesion.beneficiario,
                    importe: concesion.importe,
                    resumen: analisis.resumen_veridian
                });
                console.log(`   ✅ Guardado: ${analisis.resumen_veridian}`);
            }
        }

        console.log(`\n🏁 BDNS completado: ${saved} subvenciones guardadas`);

        return res.status(200).json({
            success: true,
            stats: {
                total_api: concesiones.length,
                significativas: significativas.length,
                saved
            },
            results
        });

    } catch (error) {
        console.error('❌ Error BDNS:', error);
        return res.status(500).json({
            error: 'Error procesando BDNS',
            details: error instanceof Error ? error.message : 'Unknown'
        });
    }
}
