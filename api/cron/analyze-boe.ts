/**
 * =============================================================================
 * ANALIZADOR BOE - Extractor de Gasto Público
 * =============================================================================
 * 
 * FILOSOFÍA: "El filtro tacaño" - Solo usar IA cuando hay dinero de verdad
 * 
 * FLUJO:
 * 1. Descargar sumario BOE del día (GRATIS - fetch)
 * 2. Extraer textos de Secciones III y V (GRATIS - regex)
 * 3. Filtrar por palabras clave de dinero (GRATIS - includes)
 * 4. Solo los que pasan el filtro → LLM barato (PAGO - solo lo necesario)
 * 5. Guardar JSON estructurado en Supabase
 * 
 * CONFIGURACIÓN:
 * - GEMINI_API_KEY: Ya configurada en Vercel
 * - SUPABASE_SERVICE_ROLE_KEY: Ya configurada
 * - VITE_SUPABASE_URL: Ya configurada
 * - CRON_SECRET: Para autenticación del cron
 * 
 * PERIODICIDAD: Añadir a vercel.json:
 * { "path": "/api/cron/analyze-boe", "schedule": "0 9 * * 1-5" }
 * (9 AM UTC, Lunes a Viernes - el BOE no sale fines de semana)
 */

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// =============================================================================
// CONFIGURACIÓN
// =============================================================================

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

// Palabras clave que indican DINERO (el filtro tacaño)
const MONEY_KEYWORDS = [
    // Monedas
    'euro', 'euros', '€', 'eur',
    // Tipos de gasto
    'subvención', 'subvenciones', 'subvencion',
    'licitación', 'licitaciones', 'licitacion',
    'adjudicación', 'adjudicaciones', 'adjudicacion',
    'contrato', 'contratos',
    'ayuda', 'ayudas',
    'financiación', 'financiacion',
    'presupuesto', 'presupuestos',
    // Cantidades
    'millón', 'millones', 'millon',
    'mil euros',
    // Tipos específicos
    'convenio', 'convenios',
    'beca', 'becas',
    'premio', 'premios',
    'indemnización', 'indemnizacion'
];

// Secciones del BOE a analizar
const BOE_SECTIONS = {
    'III': 'Otras Disposiciones', // Subvenciones, ayudas
    'V-A': 'Anuncios - Licitaciones', // Contratos públicos
    'V-B': 'Anuncios - Otros' // Convocatorias
};

// =============================================================================
// UTILIDADES
// =============================================================================

/**
 * Obtiene la fecha de hoy en formato BOE (YYYY/MM/DD para URL)
 */
function getTodayBOEDate(): { year: string; month: string; day: string; formatted: string } {
    const today = new Date();
    return {
        year: today.getFullYear().toString(),
        month: String(today.getMonth() + 1).padStart(2, '0'),
        day: String(today.getDate()).padStart(2, '0'),
        formatted: today.toISOString().split('T')[0]
    };
}

/**
 * EL FILTRO TACAÑO: ¿Este texto contiene dinero?
 * Coste: CERO (solo operaciones de string)
 */
function containsMoney(text: string): boolean {
    const lowerText = text.toLowerCase();
    return MONEY_KEYWORDS.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Extrae importes del texto usando regex
 * Coste: CERO
 */
function extractAmounts(text: string): number[] {
    const amounts: number[] = [];

    // Patrones comunes de importes en el BOE
    const patterns = [
        /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*(?:euros?|€|EUR)/gi,
        /(\d+(?:\.\d{3})*(?:,\d+)?)\s*(?:euros?|€|EUR)/gi,
        /importe[:\s]+(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/gi,
        /(\d+(?:,\d+)?)\s*millon(?:es)?/gi
    ];

    patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            // Convertir formato español (1.234,56) a número
            const numStr = match[1]
                .replace(/\./g, '')  // Quitar puntos de miles
                .replace(',', '.');   // Cambiar coma decimal por punto
            const num = parseFloat(numStr);
            if (!isNaN(num) && num > 0) {
                // Si mencionó millones, multiplicar
                if (match[0].toLowerCase().includes('millon')) {
                    amounts.push(num * 1000000);
                } else {
                    amounts.push(num);
                }
            }
        }
    });

    return [...new Set(amounts)]; // Eliminar duplicados
}

// =============================================================================
// EXTRACCIÓN DEL BOE (GRATIS)
// =============================================================================

interface BOEEntry {
    titulo: string;
    texto: string;
    seccion: string;
    url: string;
}

/**
 * Descarga y parsea el sumario del BOE del día
 * Coste: GRATIS (solo fetch + regex)
 */
async function fetchBOESummary(date: ReturnType<typeof getTodayBOEDate>): Promise<BOEEntry[]> {
    const entries: BOEEntry[] = [];

    try {
        // URL del sumario del BOE (formato XML)
        const summaryUrl = `https://www.boe.es/diario_boe/xml.php?id=BOE-S-${date.year}${date.month}${date.day}`;
        console.log(`📥 Descargando sumario BOE: ${summaryUrl}`);

        const response = await fetch(summaryUrl, {
            headers: {
                'User-Agent': 'Veridian-BOE-Analyzer/1.0 (periodismo de datos)'
            }
        });

        if (!response.ok) {
            console.log(`⚠️ BOE no disponible para ${date.formatted} (${response.status})`);
            return entries;
        }

        const xmlText = await response.text();

        // Extraer entradas del XML
        // El BOE usa un formato XML específico con <item> tags
        const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
        const titleRegex = /<titulo[^>]*>([\s\S]*?)<\/titulo>/i;
        const urlRegex = /<urlPdf[^>]*>([\s\S]*?)<\/urlPdf>/i;
        const textRegex = /<texto[^>]*>([\s\S]*?)<\/texto>/i;
        const sectionRegex = /<seccion[^>]*>([\s\S]*?)<\/seccion>/i;

        let match;
        while ((match = itemRegex.exec(xmlText)) !== null) {
            const itemContent = match[1];

            const titleMatch = titleRegex.exec(itemContent);
            const urlMatch = urlRegex.exec(itemContent);
            const textMatch = textRegex.exec(itemContent);
            const sectionMatch = sectionRegex.exec(itemContent);

            if (titleMatch) {
                entries.push({
                    titulo: titleMatch[1].trim().replace(/<[^>]*>/g, ''),
                    texto: textMatch ? textMatch[1].trim().replace(/<[^>]*>/g, '') : '',
                    seccion: sectionMatch ? sectionMatch[1].trim() : 'Desconocida',
                    url: urlMatch ? urlMatch[1].trim() : ''
                });
            }
        }

        // Parseo HTML directo - más confiable que el XML
        console.log('📄 Parseando HTML del BOE...');

        const htmlUrl = `https://www.boe.es/boe/dias/${date.year}/${date.month}/${date.day}/`;
        const htmlResponse = await fetch(htmlUrl, {
            headers: {
                'User-Agent': 'Veridian-BOE-Analyzer/1.0 (periodismo de datos)'
            }
        });

        if (htmlResponse.ok) {
            const htmlText = await htmlResponse.text();

            // Extraer todos los párrafos con contenido (dentro de <li> o <p>)
            const paragraphRegex = /<(?:li|p)[^>]*>([\s\S]*?)<\/(?:li|p)>/gi;
            let pMatch;

            while ((pMatch = paragraphRegex.exec(htmlText)) !== null) {
                const content = pMatch[1]
                    .replace(/<[^>]*>/g, ' ') // Quitar HTML tags
                    .replace(/\s+/g, ' ')     // Normalizar espacios
                    .trim();

                // Solo incluir si tiene contenido sustancial (más de 50 caracteres)
                if (content.length > 50) {
                    // Buscar link asociado
                    const linkMatch = pMatch[0].match(/href="([^"]+)"/i);
                    const url = linkMatch ?
                        (linkMatch[1].startsWith('http') ? linkMatch[1] : `https://www.boe.es${linkMatch[1]}`)
                        : '';

                    entries.push({
                        titulo: content.substring(0, 200),
                        texto: content,
                        seccion: 'HTML',
                        url
                    });
                }
            }
        }

        console.log(`✅ Encontradas ${entries.length} entradas en el BOE`);
        return entries;

    } catch (error) {
        console.error('❌ Error descargando BOE:', error);
        return entries;
    }
}

// =============================================================================
// ANÁLISIS CON IA (SOLO CUANDO PASA EL FILTRO TACAÑO)
// =============================================================================

interface ExpenseAnalysis {
    beneficiario: string;
    importe_total: number;
    moneda: string;
    organismo_pagador: string;
    tipo_adjudicacion: string;
    resumen_veridian: string;
    contexto_detallado: string; // Explicación más larga del qué y por qué
}

/**
 * Analiza un texto con IA - SOLO SE LLAMA SI PASA EL FILTRO
 * Usa Gemini Flash (modelo barato y rápido)
 */
async function analyzeWithAI(entry: BOEEntry): Promise<ExpenseAnalysis | null> {
    // Detectar tipo de anuncio
    const textoLower = entry.texto.toLowerCase();
    const esLicitacion = textoLower.includes('anuncio de licitación');
    const esFormalizacion = textoLower.includes('formalización de contrato');
    const esAdjudicacion = textoLower.includes('adjudicación');
    const esSubvencion = textoLower.includes('subvención') || textoLower.includes('subvencion');

    let tipoDetectado = 'Desconocido';
    if (esLicitacion) tipoDetectado = 'Licitación';
    else if (esFormalizacion) tipoDetectado = 'Contrato formalizado';
    else if (esAdjudicacion) tipoDetectado = 'Adjudicación';
    else if (esSubvencion) tipoDetectado = 'Subvención';

    const systemPrompt = `Eres un periodista de investigación especializado en gasto público español. 
Tu tarea es extraer datos clave de anuncios del BOE y explicarlos en lenguaje ciudadano.

CONTEXTO: Este es un ${tipoDetectado} del BOE.

EXTRACCIÓN DE DATOS:
1. IMPORTE: Busca números seguidos de "euros", "€", o "millones". CRÍTICO: Si no hay importe claro, devuelve 0 y se descartará.
2. BENEFICIARIO: ¿Quién recibe el dinero? (empresa, entidad, persona)
3. ORGANISMO: ¿Quién paga? (Ministerio, Ayuntamiento, empresa pública)
4. TIPO: "Licitación" | "Contrato" | "Subvención" | "A dedo"

RESUMEN VERIDIAN (titular):
- MÁXIMO 15 palabras
- Incluye el importe si existe
- Directo, sin jerga burocrática
- Ejemplo: "300M€ a AXIS para el fondo europeo de startups tecnológicas"

CONTEXTO DETALLADO (explicación):
- 2-3 frases que expliquen:
  * ¿Qué es exactamente?
  * ¿Para qué sirve?
  * ¿Por qué es relevante para el ciudadano?
- Lenguaje claro, como si lo explicaras a un amigo
- NO copies jerga del BOE, tradúcela
- Ejemplo: "El Estado destina 300 millones de euros a un fondo de inversión para startups europeas de tecnología. Este fondo busca competir con las inversiones de capital riesgo de EEUU y China. En la práctica, es dinero público que irá a empresas tecnológicas que el gobierno considera estratégicas."

RESPONDE SOLO EN JSON:
{
  "beneficiario": "Nombre de empresa/entidad",
  "importe_total": 123456.78,
  "moneda": "EUR",
  "organismo_pagador": "Quién paga",
  "tipo_adjudicacion": "Licitación | Contrato | Subvención | A dedo",
  "resumen_veridian": "Titular corto con importe",
  "contexto_detallado": "Explicación de 2-3 frases sobre qué es, para qué sirve y por qué importa"
}`;

    const prompt = `Analiza este anuncio del BOE y extrae los datos:

TEXTO COMPLETO:
${entry.texto}

Genera el JSON con los datos extraídos.`;

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
                        maxOutputTokens: 800 // Aumentado para contexto detallado
                    }
                })
            }
        );

        if (!response.ok) {
            console.error(`❌ Error Gemini: ${response.status}`);
            return null;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) return null;

        // Parsear JSON de la respuesta
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        const analysis = JSON.parse(jsonMatch[0]) as ExpenseAnalysis;

        // Validación básica
        if (!analysis.beneficiario) return null;

        return analysis;

    } catch (error) {
        console.error('❌ Error análisis IA:', error);
        return null;
    }
}

// =============================================================================
// HANDLER PRINCIPAL
// =============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers para todas las peticiones
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ==========================================================================
    // GET: Consulta pública de gastos (sin autenticación)
    // ==========================================================================
    if (req.method === 'GET') {
        try {
            const { date, limit = '50', min_amount, tipo } = req.query;

            let query = supabase
                .from('boe_expenses')
                .select('*')
                .order('importe_total', { ascending: false });

            if (date && typeof date === 'string') {
                query = query.eq('boe_date', date);
            }

            if (min_amount && typeof min_amount === 'string') {
                const minNum = parseFloat(min_amount);
                if (!isNaN(minNum)) {
                    query = query.gte('importe_total', minNum);
                }
            }

            if (tipo && typeof tipo === 'string') {
                query = query.eq('tipo_adjudicacion', tipo);
            }

            const limitNum = Math.min(parseInt(limit as string) || 50, 100);
            query = query.limit(limitNum);

            const { data, error } = await query;

            if (error) throw error;

            const stats = {
                total_registros: data?.length || 0,
                gasto_total: data?.reduce((sum, item) => sum + (item.importe_total || 0), 0) || 0,
                gasto_promedio: 0,
                gasto_maximo: 0
            };

            if (data && data.length > 0) {
                stats.gasto_promedio = stats.gasto_total / data.length;
                stats.gasto_maximo = Math.max(...data.map(d => d.importe_total || 0));
            }

            return res.status(200).json({ expenses: data || [], stats });

        } catch (error: any) {
            console.error('❌ Error consulta BOE:', error);
            return res.status(500).json({ error: error.message });
        }
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

    // Permitir fecha personalizada para testing (ej: ?boe_date=2026-02-06)
    const customDate = req.query.boe_date as string | undefined;
    let date: { year: string; month: string; day: string; formatted: string };

    if (customDate && /^\d{4}-\d{2}-\d{2}$/.test(customDate)) {
        const [year, month, day] = customDate.split('-');
        date = { year, month, day, formatted: customDate };
    } else {
        date = getTodayBOEDate();
    }

    console.log(`\n${'='.repeat(60)} `);
    console.log(`🏛️ ANALIZADOR BOE - ${date.formatted} `);
    console.log(`${'='.repeat(60)} \n`);

    try {
        // 1. EXTRACCIÓN GRATUITA: Descargar sumario
        const entries = await fetchBOESummary(date);

        if (entries.length === 0) {
            return res.status(200).json({
                message: 'No BOE entries found for today',
                date: date.formatted,
                analyzed: 0
            });
        }

        // 2. FILTRO INTELIGENTE: Priorizar licitaciones y contratos
        const priorityKeywords = ['licitación', 'formalización de contrato', 'adjudicación', 'importe'];

        const moneyEntries = entries
            .filter(entry => {
                const fullText = `${entry.titulo} ${entry.texto} `;
                return containsMoney(fullText);
            })
            .sort((a, b) => {
                // Priorizar los que tienen palabras clave de contratos
                const textA = a.texto.toLowerCase();
                const textB = b.texto.toLowerCase();
                const priorityA = priorityKeywords.filter(k => textA.includes(k)).length;
                const priorityB = priorityKeywords.filter(k => textB.includes(k)).length;
                return priorityB - priorityA;
            });

        console.log(`💰 Filtro tacaño: ${moneyEntries.length}/${entries.length} entradas contienen dinero`);

        if (moneyEntries.length === 0) {
            return res.status(200).json({
                message: 'No money-related entries found',
                date: date.formatted,
                total_entries: entries.length,
                analyzed: 0
            });
        }

        // 3. ANÁLISIS CON IA: Solo los que pasaron el filtro
        const results: any[] = [];
        let aiCalls = 0;
        let saved = 0;

        for (const entry of moneyEntries.slice(0, 20)) { // Límite de 20 por día (control de costes)
            console.log(`\n📝 Analizando: ${entry.titulo.substring(0, 60)}...`);

            const analysis = await analyzeWithAI(entry);
            aiCalls++;

            console.log(`   IA respondió:`, analysis ? `${analysis.beneficiario} - ${analysis.importe_total}€` : 'null');

            // Filtro de calidad: guardar si tiene información útil
            // - Debe tener beneficiario real (no "No aplica", "Pendiente", etc)
            // - Debe tener contexto detallado (explicación informativa)
            // - O debe tener importe > 0
            const tieneImporte = analysis && analysis.importe_total > 0;
            const tieneBeneficiarioReal = analysis &&
                analysis.beneficiario &&
                analysis.beneficiario !== 'No aplica' &&
                !analysis.beneficiario.toLowerCase().includes('pendiente') &&
                !analysis.beneficiario.toLowerCase().includes('nadie');
            const tieneContexto = analysis && analysis.contexto_detallado && analysis.contexto_detallado.length > 50;

            if (analysis && tieneBeneficiarioReal && (tieneImporte || tieneContexto)) {
                // 4. GUARDAR EN DB
                const { error } = await supabase
                    .from('boe_expenses')
                    .insert({
                        boe_date: date.formatted,
                        boe_section: entry.seccion,
                        boe_url: entry.url,
                        beneficiario: analysis.beneficiario,
                        importe_total: analysis.importe_total,
                        moneda: analysis.moneda || 'EUR',
                        organismo_pagador: analysis.organismo_pagador,
                        tipo_adjudicacion: analysis.tipo_adjudicacion,
                        resumen_veridian: analysis.resumen_veridian,
                        contexto_detallado: analysis.contexto_detallado || '',
                        texto_original: entry.texto.substring(0, 2000),
                        titulo_original: entry.titulo
                    });

                if (error) {
                    console.error('❌ Error guardando:', error);
                } else {
                    saved++;
                    results.push({
                        beneficiario: analysis.beneficiario,
                        importe: analysis.importe_total,
                        resumen: analysis.resumen_veridian
                    });
                    console.log(`   ✅ ${analysis.beneficiario}: ${analysis.importe_total}€`);
                    console.log(`   💬 "${analysis.resumen_veridian}"`);
                }
            }

            // Rate limiting: pequeña pausa entre llamadas
            await new Promise(r => setTimeout(r, 200));
        }

        // 5. RESUMEN FINAL
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📊 RESUMEN DEL DÍA`);
        console.log(`   - Entradas totales BOE: ${entries.length}`);
        console.log(`   - Pasaron filtro dinero: ${moneyEntries.length}`);
        console.log(`   - Llamadas a IA: ${aiCalls}`);
        console.log(`   - Guardadas en DB: ${saved}`);
        console.log(`${'='.repeat(60)}\n`);

        return res.status(200).json({
            success: true,
            date: date.formatted,
            stats: {
                total_entries: entries.length,
                money_entries: moneyEntries.length,
                ai_calls: aiCalls,
                saved: saved
            },
            results
        });

    } catch (error: any) {
        console.error('❌ Error general:', error);
        return res.status(500).json({ error: error.message });
    }
}
