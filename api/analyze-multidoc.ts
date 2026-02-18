import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
    maxDuration: 60,
};

// ─── Helpers ───────────────────────────────────────────────────

async function callOpenAI(systemPrompt: string, userText: string): Promise<any> {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not configured');
    }

    const MAX_RETRIES = 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (attempt > 0) {
            const waitMs = Math.pow(2, attempt) * 1000;
            await new Promise((r) => setTimeout(r, waitMs));
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
                    { role: 'user', content: userText },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.1,
                max_tokens: 16384,
            }),
        });

        if (response.status === 429) {
            lastError = new Error('RATE_LIMIT');
            continue;
        }

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`OpenAI API error: ${response.status} ${errText}`);
        }

        const data = await response.json();
        const textContent = data.choices?.[0]?.message?.content;

        if (!textContent) throw new Error('Empty OpenAI response');

        try {
            return JSON.parse(textContent);
        } catch (parseErr) {
            throw new Error('Invalid JSON in OpenAI response');
        }
    }

    throw lastError || new Error('OpenAI API failed after retries');
}

// ─── Prompt builder ─────────────────────────────────────────────

function buildSynthesisPrompt(language: string): string {
    const es = language === 'es';

    const role = es
        ? 'Eres Oraculus Scholar, un sistema avanzado de síntesis y comparación de investigación. Tu objetivo es analizar múltiples documentos y generar una síntesis comparativa que resalte consensos, discrepancias y relaciones conceptuales.'
        : 'You are Oraculus Scholar, an advanced research synthesis and comparison system. Your goal is to analyze multiple documents and generate a comparative synthesis highlighting consensus, discrepancies, and conceptual relationships.';

    const instruction = es
        ? `Analiza los siguientes documentos proporcionados por el usuario.
        
        Debes generar una salida JSON estructurada con:
        1. consensusMatrix: Puntos clave donde los documentos concuerdan.
        2. discrepancyMatrix: Puntos donde hay desacuerdo o perspectivas divergentes.
        3. conceptGraph: Conceptos principales y cómo se relacionan entre sí.
        4. syntheticSummary: Un resumen ejecutivo que integra la información de todas las fuentes.
        
        REGLAS CRÍTICAS:
        - Responde SIEMPRE en Español.
        - Sé conciso pero riguroso.
        - Cita qué documentos (por nombre o índice) apoyan cada punto en la matriz.`
        : `Analyze the following documents provided by the user.

        You must generate a structured JSON output with:
        1. consensusMatrix: Key points where documents agree.
        2. discrepancyMatrix: Points where there is disagreement or diverging perspectives.
        3. conceptGraph: Main concepts and how they relate to each other.
        4. syntheticSummary: An executive summary integrating information from all sources.
        
        CRITICAL RULES:
        - Respond ALWAYS in English.
        - Be concise but rigorous.
        - Cite which documents (by name or index) support each point in the matrix.`;

    const jsonSchema = `
    IMPORTANT: Respond ONLY with a valid JSON object with this EXACT structure:
    {
      "syntheticSummary": "Comprehensive executive summary...",
      "consensusMatrix": [
        {
          "topic": "Topic Name",
          "agreement": "Description of the agreement",
          "upholdingDocuments": ["Doc A", "Doc B"]
        }
      ],
      "discrepancyMatrix": [
        {
          "topic": "Topic Name",
          "disagreement": "Description of the disagreement",
          "perspectives": [
            { "document": "Doc A", "viewpoint": "Viewpoint description" },
            { "document": "Doc B", "viewpoint": "Viewpoint description" }
          ]
        }
      ],
      "conceptGraph": [
        {
            "concept": "Concept Name",
            "definition": "Brief definition",
            "relatedTo": ["Other Concept 1", "Other Concept 2"]
        }
      ]
    }`;

    return `${role}\n\n${instruction}\n\n${jsonSchema}`;
}

// ─── Main handler ───────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { documents, language } = req.body || {};
    // documents expected to be: { name: string, content: string }[]

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
        return res.status(400).json({ error: 'No documents provided' });
    }

    const analysisLanguage = language || 'en';

    try {
        // Prepare text input
        const fullInput = documents.map((doc, idx) =>
            `--- DOCUMENT ${idx + 1}: ${doc.name} ---\n${doc.content}\n--- END DOCUMENT ${idx + 1} ---\n`
        ).join('\n\n');

        if (fullInput.length > 100000) {
            // Basic truncation if too huge strategy
            // Ideally we would summarize individually, but for MVP we truncate key sections
            console.warn("Input too large, truncating...");
        }

        const systemPrompt = buildSynthesisPrompt(analysisLanguage);
        const result = await callOpenAI(systemPrompt, fullInput.substring(0, 100000));

        return res.status(200).json(result);

    } catch (error: any) {
        console.error('Multi-doc analysis error:', error);
        return res.status(500).json({ error: error.message || 'Error processing request' });
    }
}
