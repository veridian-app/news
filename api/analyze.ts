import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
    maxDuration: 60,
};

// ─── Shared Helpers ───────────────────────────────────────────────

async function callOpenAI(messages: any[], systemPrompt: string | null = null, model: string = 'gpt-4o-mini', temperature: number = 0.1, jsonMode: boolean = true): Promise<any> {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

    const finalMessages = systemPrompt ? [{ role: 'system', content: systemPrompt }, ...messages] : messages;

    const MAX_RETRIES = 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model,
                    messages: finalMessages,
                    response_format: jsonMode ? { type: 'json_object' } : undefined,
                    temperature,
                    max_tokens: 16384,
                }),
            });

            if (response.status === 429) {
                lastError = new Error('RATE_LIMIT');
                continue;
            }

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`OpenAI error: ${response.status} ${err}`);
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;
            if (!content) throw new Error('Empty response');

            return jsonMode ? JSON.parse(content) : content;
        } catch (e: any) {
            console.warn(`Attempt ${attempt + 1} failed:`, e);
            lastError = e;
        }
    }
    throw lastError || new Error('OpenAI failed after retries');
}

// ─── Article Analysis Logic (Full Fidelity) ───────────────────────

function buildArticleSystemPrompt(isOwnText: boolean, language: string, citationFormat: string): string {
    const es = language === 'es';
    const format = citationFormat || 'APA';

    const role = es
        ? isOwnText
            ? 'Eres Oraculus, un asistente experto que ayuda a estudiantes y escritores a mejorar la objetividad y calidad de sus propios textos. MODO: AUDITORÍA DE TEXTO PROPIO'
            : 'Eres Oraculus, un sistema experto en análisis de fuentes y detección de sesgos periodísticos. MODO: ANÁLISIS DE ARTÍCULO EXTERNO'
        : isOwnText
            ? 'You are Oraculus. MODE: OWN TEXT AUDIT'
            : 'You are Oraculus. MODE: EXTERNAL ARTICLE ANALYSIS';

    const langRules = es
        ? `REGLA CRÍTICA DE IDIOMA: Responde ABSOLUTAMENTE TODO en español. NO traduzcas el texto original.`
        : `CRITICAL LANGUAGE RULE: Respond ABSOLUTELY EVERYTHING in English.`;

    const instructions = es
        ? `Analiza exhaustivamente.
           1. SESGOS: Detecta sesgos (Selección, Tergiversación, Lenguaje cargado, etc.).
           2. FUENTES: Identifica todas las fuentes verificables.
           3. CRAAP: Evalúa cada fuente (Actualidad, Relevancia, Autoridad, Precisión, Propósito).
           4. OBJETIVIDAD: Score 0-100.
           5. BULOS: Detecta afirmaciones falsas o conspirativas.
           6. PLAGIO: Estima riesgo.
           7. ENTIDADES: Personas y Organizaciones clave.`
        : `Analyze exhaustively.
           1. BIASES: Detect biases.
           2. SOURCES: Identify verifiable sources.
           3. CRAAP: Evaluate sources.
           4. OBJECTIVITY: Score 0-100.
           5. HOAXES: Detect hoaxes.
           6. PLAGIARISM: Estimate risk.
           7. ENTITIES: Key entities.`;

    const jsonSchema = `
    IMPORTANT: Respond ONLY with a valid JSON object with this EXACT structure:
    {
      "sources": [
        {
          "name": "Source name",
          "url": "URL or null",
          "type": "hyperlink | citation",
          "summary": "Summary",
          "confidenceScore": 0-100,
          "craap": {
            "currency": { "score": 1-5, "reasoning": "..." },
            "relevance": { "score": 1-5, "reasoning": "..." },
            "authority": { "score": 1-5, "reasoning": "..." },
            "accuracy": { "score": 1-5, "reasoning": "..." },
            "purpose": { "score": 1-5, "reasoning": "..." },
            "overall": "High | Medium | Low"
          }
        }
      ],
      "entities": [
        { "name": "Name", "type": "Person | Organization | Location | Event", "role": "Role", "sentiment": "Positive | Negative | Neutral" }
      ],
      "biasAnalysis": {
        "selectionBias": { "severity": "None | Low | Significant", "explanation": "...", "quotes": [] },
        "misrepresentation": { "severity": "None | Low | Significant", "explanation": "...", "quotes": [] },
        "loadedLanguage": { "severity": "None | Low | Significant", "explanation": "...", "quotes": [] },
        "falseExperts": { "severity": "None | Low | Significant", "explanation": "...", "quotes": [] },
        "confirmationBias": { "severity": "None | Low | Significant", "explanation": "...", "quotes": [] },
        "framing": { "severity": "None | Low | Significant", "explanation": "...", "quotes": [] },
        "omission": { "severity": "None | Low | Significant", "explanation": "...", "quotes": [] },
        "appealToEmotion": { "severity": "None | Low | Significant", "explanation": "...", "quotes": [] },
        "sensationalism": { "severity": "None | Low | Significant", "explanation": "...", "quotes": [] },
        "falseEquivalence": { "severity": "None | Low | Significant", "explanation": "...", "quotes": [] },
        "agendaSetting": { "severity": "None | Low | Significant", "explanation": "...", "quotes": [] },
        "hastyGeneralization": { "severity": "None | Low | Significant", "explanation": "...", "quotes": [] }
      },
      "summary": {
        "overallReliability": "Very High | High | Medium | Low | Very Low",
        "mainConcerns": [],
        "strengths": [],
        "objectivityScore": 0-100,
        "objectivityExplanation": "...",
        "hoaxAlerts": [],
        "plagiarismAnalysis": { "percentage": 0, "level": "None", "explanation": "...", "flaggedSections": [] }
      },
      "isOwnText": ${isOwnText}
    }`;

    return `${role}\n\n${langRules}\n\n${instructions}\n\n${jsonSchema}`;
}

function extractLinks(html: string): Array<{ text: string; url: string }> {
    const links: Array<{ text: string; url: string }> = [];
    const linkRegex = /<a[^>]+href=["'](http[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
        if (match[1] && match[1].startsWith('http') && match[2].length > 2) {
            links.push({ text: match[2].replace(/<[^>]+>/g, '').trim().substring(0, 100), url: match[1] });
        }
    }
    return links.slice(0, 30);
}

async function extractTextFromUrl(url: string): Promise<{ text: string; links: any[] }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();
        const cleanBody = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        const links = extractLinks(cleanBody);
        const text = cleanBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        return { text, links };
    } catch (e: any) {
        clearTimeout(timeout);
        throw e;
    }
}

async function analyzeArticle(body: any) {
    let { articleText, articleUrl, text, url, isOwnText, mode, citationFormat, language = 'en' } = body;

    // Normalize inputs (Frontend sends 'text'/'url'/'mode', Backend expected 'articleText'/'articleUrl'/'isOwnText')
    let finalText = articleText || text || '';
    const finalUrl = articleUrl || url;
    const finalIsOwnText = isOwnText || mode === 'own';

    let extractedLinks: any[] = [];

    if (finalUrl && !finalIsOwnText) {
        try {
            const extraction = await extractTextFromUrl(finalUrl);
            finalText = extraction.text;
            extractedLinks = extraction.links;
        } catch (e: any) {
            throw new Error(`Failed to extract URL: ${e.message}`);
        }
    }

    if (!finalText || finalText.trim().length === 0) throw new Error('No content to analyze');

    const systemPrompt = buildArticleSystemPrompt(!!finalIsOwnText, language, citationFormat);
    const result = await callOpenAI([{ role: 'user', content: finalText.substring(0, 100000) }], systemPrompt);

    // Save anonymous stats (fire-and-forget)
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseKey) {
        fetch(`${supabaseUrl}/rest/v1/anonymous_analyses_stats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Prefer': 'return=minimal' },
            body: JSON.stringify({
                analysis_date: new Date().toISOString().split('T')[0],
                objectivity_score: result.summary?.objectivityScore,
                article_url: finalUrl
            })
        }).catch(console.error);
    }

    return { ...result, extractedLinks };
}

// ─── Entity Analysis Logic ────────────────────────────────────────

async function analyzeEntity(body: any) {
    const { entityName, language = 'en' } = body;
    if (!entityName) throw new Error('Entity name is required');

    const prompt = `You are an expert investigative journalist. Analyze the organization "${entityName}".
    Provide a structured profile in JSON:
    {
        "description": "2-sentence summ",
        "type": "Non-Profit | Corp | Gov",
        "headquarters": "City, Country",
        "keyPeople": ["CEO"],
        "funding": "Funding model",
        "stance": "Political alignment or Neutral",
        "controversies": ["Scandal 1"]
    }
    Language: ${language}.`;

    return await callOpenAI([{ role: 'user', content: prompt }], "Output JSON.", 'gpt-4o-mini', 0.3);
}

// ─── Multidoc Analysis Logic ──────────────────────────────────────

async function analyzeMultidoc(body: any) {
    const { documents, language = 'en' } = body;
    if (!documents || !Array.isArray(documents)) throw new Error('No documents provided');

    // Combine all documents into one large text
    const fullInput = documents.map((doc: any, idx: number) =>
        `--- DOCUMENT ${idx + 1}: ${doc.name} ---\n${doc.content}\n--- END DOCUMENT ${idx + 1} ---\n`
    ).join('\n\n');

    const truncatedInput = fullInput.substring(0, 100000);
    const es = language === 'es';

    // ─── Unified System Prompt ───

    // 1. Roles & Rules
    const role = es
        ? 'Eres Oraculus, un analista experto en inteligencia. Realiza una "Fusión de Inteligencia" completa de los documentos provistos.'
        : 'You are Oraculus, an expert intelligence analyst. Perform a full "Intelligence Fusion" of the provided documents.';

    const langRules = es
        ? `REGLA CRÍTICA: Responde ABSOLUTAMENTE TODO en español.`
        : `CRITICAL RULE: Respond ABSOLUTELY EVERYTHING in English.`;

    // 2. Instructions (Combined Standard + Synthesis)
    const instructions = es
        ? `Tu tarea es doble:
           A) ANÁLISIS ESTÁNDAR: Evalúa la calidad, sesgos, entidades y fiabilidad del conjunto como si fuera un solo corpus.
           B) SÍNTESIS COMPARATIVA: Identifica consensos, discrepancias y relaciones entre los documentos.

           Puntos clave a analizar:
           1. RESUMEN Y FIABILIDAD: Score de objetividad, preocupaciones principales y fortalezas.
           2. SESGOS: Detecta sesgos (selección, encuadre, etc.) en el conjunto.
           3. ENTIDADES: Actores clave (Personas/Organizaciones) mencionados.
           4. SÍNTESIS:
              - Matriz de Consenso: ¿En qué están de acuerdo todos los documentos?
              - Matriz de Discrepancia: ¿Dónde se contradicen? Cita qué documento dice qué.
              - Grafo de Conceptos: Conceptos clave y sus relaciones.`
        : `Your task is twofold:
           A) STANDARD ANALYSIS: Evaluate quality, biases, entities, and reliability of the set as a single corpus.
           B) COMPARATIVE SYNTHESIS: Identify consensus, discrepancies, and relationships between documents.

           Key points to analyze:
           1. SUMMARY & RELIABILITY: Objectivity score, main concerns, strengths.
           2. BIASES: Detect biases (selection, framing, etc.) in the set.
           3. ENTITIES: Key actors (People/Organizations).
           4. SYNTHESIS:
              - Consensus Matrix: What do all documents agree on?
              - Discrepancy Matrix: Where do they contradict? Cite which document says what.
              - Concept Graph: Key concepts and their relationships.`;

    // 3. Strict Unified JSON Schema
    const schema = `
    {
      "summary": {
        "overallReliability": "Very High | High | Medium | Low | Very Low",
        "mainConcerns": ["Concern 1", "Concern 2"],
        "strengths": ["Strength 1"],
        "objectivityScore": 0-100,
        "objectivityExplanation": "Brief explanation",
        "hoaxAlerts": [],
        "plagiarismAnalysis": { "percentage": 0, "level": "None", "explanation": "N/A", "flaggedSections": [] }
      },
      "biasAnalysis": {
         "selectionBias": { "severity": "None | Low | Significant", "explanation": "...", "quotes": [] },
         "framing": { "severity": "None | Low | Significant", "explanation": "...", "quotes": [] },
         "confirmationBias": { "severity": "None | Low | Significant", "explanation": "...", "quotes": [] }
      },
      "entities": [
        { "name": "Name", "type": "Person | Organization | Location", "role": "Role", "sentiment": "Positive | Negative | Neutral" }
      ],
      "sources": [], 
      "synthesis": {
        "syntheticSummary": "Comprehensive executive summary synthesizing all documents...",
        "consensusMatrix": [
          { "topic": "Topic A", "agreement": "All docs agree that...", "upholdingDocuments": ["Doc 1", "Doc 2"] }
        ],
        "discrepancyMatrix": [
          { 
            "topic": "Topic B", 
            "disagreement": "There is disagreement on...", 
            "perspectives": [
              { "document": "Doc 1", "viewpoint": "Says X" },
              { "document": "Doc 2", "viewpoint": "Says Y" }
            ]
          }
        ],
        "conceptGraph": [
          { "concept": "Concept X", "definition": "Brief definition", "relatedTo": ["Concept Y"] }
        ]
      }
    }`;

    // 4. Final Prompt Assembly
    const systemPrompt = `
    ${role}
    ${langRules}
    ${instructions}

    IMPORTANT: Respond ONLY with a valid JSON object following EXACTLY this structure:
    ${schema}
    
    Ensure all arrays (entities, consensusMatrix, etc.) are always present, even if empty.
    For 'biasAnalysis', include at least the 3 fields shown in schema, others are optional.
    `;

    // Single OpenAI Call (High Performance)
    const mergedResult = await callOpenAI(
        [{ role: 'user', content: truncatedInput }],
        systemPrompt,
        'gpt-4o-mini',
        0.2,
        true
    );

    return {
        ...mergedResult,
        extractedLinks: [] // No external link extraction for raw text uploads
    };
}

// ─── Research Chat Logic ──────────────────────────────────────────

async function researchChat(body: any) {
    const { messages, articleContext, articleTitle, language = 'en' } = body;
    if (!messages || !articleContext) throw new Error('Messages and context required');

    const isEs = language === 'es';
    const systemPrompt = isEs
        ? `Eres Oraculus Investigador. Analiza: "${articleTitle}". Responde SOLO basándote en: """${articleContext}""". Cita evidencia. Español.`
        : `You are Oraculus Researcher. Analyze: "${articleTitle}". Answer ONLY based on: """${articleContext}""". Cite evidence. English.`;

    const reply = await callOpenAI(messages, systemPrompt, 'gpt-4o-mini', 0.3, false); // jsonMode = false
    return { role: 'assistant', content: reply };
}

// ─── Main Handler ─────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { type, ...body } = req.body;
        let result;

        switch (type) {
            case 'entity':
                result = await analyzeEntity(body);
                break;
            case 'multidoc':
                result = await analyzeMultidoc(body);
                break;
            case 'chat':
                result = await researchChat(body);
                break;
            case 'article':
            default:
                // If type is not specified but text/url is present, assume article
                if (!type && !body.articleText && !body.articleUrl) throw new Error('Unknown analysis type');
                result = await analyzeArticle(body);
                break;
        }

        return res.status(200).json(result);

    } catch (error: any) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
