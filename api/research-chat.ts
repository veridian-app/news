
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
    maxDuration: 60, // Allow up to 60 seconds for research answers
};

// ─── System Prompt Builder ─────────────────────────────────────────────

function buildResearchSystemPrompt(articleContext: string, articleTitle: string, language: string): string {
    const isEs = language === 'es';

    const role = isEs
        ? `Eres Oraculus Investigador, un asistente académico riguroso diseñado para analizar un texto específico y responder preguntas basándote ÚNICAMENTE en su contenido.
CONTEXTO DEL ARTÍCULO: "${articleTitle}"
CONTENIDO COMPLETO:
"""
${articleContext}
"""`
        : `You are Oraculus Researcher, a rigorous academic assistant designed to analyze a specific text and answer questions based SOLELY on its content.
ARTICLE CONTEXT: "${articleTitle}"
FULL CONTENT:
"""
${articleContext}
"""`;

    const instructions = isEs
        ? `INSTRUCCIONES CRÍTICAS (NO ALUCINAR):
1. Responde a la pregunta del usuario usando SOLO la información presente en el "CONTENIDO COMPLETO" proporcionado arriba.
2. Si la respuesta NO está en el texto, di explícitamente: "El texto proporcionado no menciona información sobre [tema]." NO inventes ni uses conocimiento externo.
3. CITA EVIDENCIA: Cuando hagas una afirmación, intenta respaldarla citando o parafraseando la sección relevante del texto.
4. MANTÉN EL IDIOMA: Responde siempre en ESPAÑOL.
5. FORMATO: Usa Markdown para estructurar tu respuesta (listas, negritas para conceptos clave).

MODOS ESPECIALES (si el usuario lo pide):
- "Datos Duros": Extrae una lista con todas las cifras, fechas y datos estadísticos del texto.
- "Abogado del Diablo": Cuestiona las tesis principales del texto y busca debilidades metodológicas o lógicas.
- "Citas Clave": Identifica las 3 citas textuales más impactantes o controvertidas y explícalas.
- "Resumen Ejecutivo": Crea un resumen estructurado de alto nivel.`
        : `CRITICAL INSTRUCTIONS (NO HALLUCINATIONS):
1. Answer the user's question using ONLY the information present in the "FULL CONTENT" provided above.
2. If the answer is NOT in the text, explicitly state: "The provided text does not contain information about [topic]." DO NOT invent or use external knowledge.
3. CITE EVIDENCE: When verifying a claim, try to back it up by citing or paraphrasing the relevant section of the text.
4. KEEP THE LANGUAGE: Always answer in ENGLISH.
5. FORMAT: Use Markdown to structure your response (lists, bold for key concepts).

SPECIAL MODES (if requested):
- "Hard Data": Extract a list of all figures, dates, and statistical data from the text.
- "Devil's Advocate": Challenge the main theses of the text and look for methodological or logical weaknesses.
- "Key Quotes": Identify the 3 most impactful or controversial verbatim quotes and explain them.
- "Executive Summary": Create a structured high-level summary.`;

    return `${role}\n\n${instructions}`;
}

// ─── Call OpenAI ────────────────────────────────────────────────

async function callOpenAIChat(messages: any[], systemPrompt: string): Promise<string> {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not configured');
    }

    // Prepare full message history with system prompt at the start
    const finalMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini', // Fast and capable enough for context-based QA
            messages: finalMessages,
            temperature: 0.3, // Lower temperature for more factual responses
            max_tokens: 4000,
            stream: false // For this version we'll use standard request/response, stream could be added later
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        if (response.status === 429) {
            throw new Error('RATE_LIMIT');
        }
        console.error('OpenAI API error:', response.status, errText);
        throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

// ─── Main handler ───────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { messages, articleContext, articleTitle, language } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        if (!articleContext) {
            return res.status(400).json({ error: 'Article context is required for research mode' });
        }

        const analysisLanguage = language || 'en';

        // 1. Build the Evidence-First System Prompt
        const systemPrompt = buildResearchSystemPrompt(articleContext, articleTitle || 'Unknown Article', analysisLanguage);

        // 2. Call AI
        const reply = await callOpenAIChat(messages, systemPrompt);

        // 3. Return response
        return res.status(200).json({
            role: 'assistant',
            content: reply
        });

    } catch (error: any) {
        console.error('Research Chat error:', error);

        if (error.message === 'RATE_LIMIT') {
            return res.status(429).json({
                error: language === 'es'
                    ? 'El sistema está ocupado. Por favor intenta de nuevo en unos segundos.'
                    : 'System is busy. Please try again in a few seconds.'
            });
        }

        return res.status(500).json({
            error: 'Internal server error processing research request'
        });
    }
}
