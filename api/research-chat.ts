import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
    maxDuration: 60,
};

async function callOpenAI(systemPrompt: string, userQuery: string, articleContext: string): Promise<string> {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `CONTEXT:\n${articleContext}\n\nQUESTION: ${userQuery}` },
            ],
            temperature: 0.2, // Low temperature for factual accuracy
            max_tokens: 1000,
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response generated.";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { query, context, language } = req.body || {};

    if (!query || !context) {
        return res.status(400).json({ error: 'Query and context are required' });
    }

    // Truncate context if too long (conservaatively for 4o-mini context window)
    const MAX_CONTEXT_CHARS = 50000;
    const finalContext = context.length > MAX_CONTEXT_CHARS
        ? context.substring(0, MAX_CONTEXT_CHARS) + "\n[...Truncated]"
        : context;

    const lang = language || 'es';

    // System Prompt for "Evaluator/Researcher" persona
    const systemPrompt = lang === 'es'
        ? `Eres el Asistente de Investigación de Oraculus.
TU OBJETIVO: Responder preguntas sobre el texto proporcionado con EXTREMA RIGUROSIDAD.

REGLAS CRÍTICAS (EVIDENCE-FIRST):
1.  SOLO usa la información presente en el "CONTEXT". No uses tu conocimiento externo a menos que sea para explicar un término.
2.  Si la respuesta no está en el texto, di claramente: "No he encontrado esa información en el documento analizado."
3.  CITA TUS FUENTES: Cuando hagas una afirmación, intenta referenciar en qué parte del texto se encuentra (ej: "Según el texto...", "En la sección sobre economía...").
4.  Mantén un tono profesional, académico y objetivo.
5.  Sé conciso pero denso en información. Evita la paja.
6.  Si el usuario pide "Datos duros" o "Cifras", extrae listas con bullets.`
        : `You are the Oraculus Research Assistant.
YOUR GOAL: Answer questions about the provided text with EXTREME RIGOR.

CRITICAL RULES (EVIDENCE-FIRST):
1.  ONLY use the information present in the "CONTEXT". Do not use external knowledge unless defining a term.
2.  If the answer is not in the text, clearly state: "I did not find that information in the analyzed document."
3.  CITE SOURCES: When making a claim, try to reference where in the text it appears.
4.  Maintain a professional, academic, and objective tone.
5.  Be concise but information-dense. Avoid fluff.
6.  If asked for "Hard Data" or "Figures", extract bulleted lists.`;

    try {
        const answer = await callOpenAI(systemPrompt, query, finalContext);
        return res.status(200).json({ answer });
    } catch (error: any) {
        console.error('Research Chat Error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
