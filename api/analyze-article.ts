import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export const config = {
    maxDuration: 60, // Allow up to 60 seconds for AI analysis
};

// ─── Helpers ───────────────────────────────────────────────────

function extractDomain(url: string): string | null {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch {
        return null;
    }
}

async function saveAnonymousStats(
    supabaseUrl: string,
    supabaseServiceKey: string,
    articleUrl: string | undefined,
    analysisResult: any
) {
    try {
        if (!analysisResult || !analysisResult.summary) return;

        const biasMapping: Record<string, string> = {
            selectionBias: 'has_selection_bias',
            misrepresentation: 'has_misrepresentation',
            loadedLanguage: 'has_loaded_language',
            falseExperts: 'has_false_experts',
            confirmationBias: 'has_confirmation_bias',
            framing: 'has_framing',
            omission: 'has_omission',
            appealToEmotion: 'has_appeal_to_emotion',
            sensationalism: 'has_sensationalism',
            falseEquivalence: 'has_false_equivalence',
            agendaSetting: 'has_agenda_setting',
            hastyGeneralization: 'has_hasty_generalization',
        };

        const stats: any = {
            objectivity_score: analysisResult.summary?.objectivityScore ?? null,
            sources_count: Array.isArray(analysisResult.sources) ? analysisResult.sources.length : 0,
            biases_detected_count: 0,
            avg_source_confidence: null,
            sources_with_high_confidence: 0,
            sources_with_medium_confidence: 0,
            sources_with_low_confidence: 0,
            analysis_date: new Date().toISOString().split('T')[0],
            has_selection_bias: false,
            has_misrepresentation: false,
            has_loaded_language: false,
            has_false_experts: false,
            has_confirmation_bias: false,
            has_framing: false,
            has_omission: false,
            has_appeal_to_emotion: false,
            has_sensationalism: false,
            has_false_equivalence: false,
            has_agenda_setting: false,
            has_hasty_generalization: false,
        };

        if (articleUrl) {
            const domain = extractDomain(articleUrl);
            if (domain) {
                stats.article_domain = domain;
                stats.article_url = articleUrl;
            }
        }

        const biasAnalysis = analysisResult.biasAnalysis || {};
        let biasCount = 0;
        Object.entries(biasAnalysis).forEach(([key, value]: [string, any]) => {
            if (value && value.severity && value.severity !== 'Nula' && value.severity !== 'None') {
                biasCount++;
                const dbCol = biasMapping[key];
                if (dbCol) stats[dbCol] = true;
            }
        });
        stats.biases_detected_count = biasCount;

        if (analysisResult.sources && analysisResult.sources.length > 0) {
            const confidences = analysisResult.sources
                .map((s: any) => s.confidenceScore)
                .filter((c: any) => c !== undefined && c !== null);
            if (confidences.length > 0) {
                const sum = confidences.reduce((a: number, b: number) => a + b, 0);
                stats.avg_source_confidence = Math.round((sum / confidences.length) * 100) / 100;
                confidences.forEach((conf: number) => {
                    if (conf >= 80) stats.sources_with_high_confidence++;
                    else if (conf >= 60) stats.sources_with_medium_confidence++;
                    else stats.sources_with_low_confidence++;
                });
            }
        }

        if (!supabaseServiceKey) {
            console.log('SUPABASE_SERVICE_ROLE_KEY not configured, skipping stats');
            return;
        }

        const response = await fetch(`${supabaseUrl}/rest/v1/anonymous_analyses_stats`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: supabaseServiceKey,
                Authorization: `Bearer ${supabaseServiceKey}`,
                Prefer: 'return=minimal',
            },
            body: JSON.stringify(stats),
        });

        if (!response.ok) {
            console.error('Error saving stats:', await response.text());
        } else {
            console.log('Anonymous stats saved successfully');
        }
    } catch (error) {
        console.error('Error saving anonymous stats:', error);
    }
}

// ─── Extract article text from URL ─────────────────────────────

async function extractTextFromUrl(url: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
            },
        });
        clearTimeout(timeout);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const html = await response.text();

        // Strip scripts/styles
        let text = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');

        // Try to extract article content
        const articleMatch =
            text.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
            text.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
            text.match(/<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
            text.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

        if (articleMatch) text = articleMatch[1];

        // Strip HTML tags
        text = text
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\s+/g, ' ')
            .trim();

        if (!text.length) throw new Error('No content extracted');
        return text;
    } catch (err: any) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') throw new Error('URL fetch timeout');
        throw err;
    }
}

// ─── Prompt builder ─────────────────────────────────────────────

function buildSystemPrompt(
    isOwnText: boolean,
    language: string,
    citationFormat: string
): string {
    const es = language === 'es';
    const format = citationFormat || 'APA';

    // ── Role & mode header
    const role = es
        ? isOwnText
            ? 'Eres Oraculus, un asistente experto que ayuda a estudiantes y escritores a mejorar la objetividad y calidad de sus propios textos. Tu objetivo es auditar el texto del usuario, detectar sesgos, identificar fuentes citadas, señalar afirmaciones sin respaldo, generar referencias bibliográficas y sugerir mejoras concretas.\n\nMODO: AUDITORÍA DE TEXTO PROPIO'
            : 'Eres Oraculus, un sistema experto en análisis de fuentes y detección de sesgos periodísticos. Tu objetivo es auditar la calidad, fiabilidad y perspectiva de las fuentes citadas en artículos.\n\nMODO: ANÁLISIS DE ARTÍCULO EXTERNO'
        : isOwnText
            ? 'You are Oraculus, an expert assistant that helps students and writers improve the objectivity and quality of their own texts. Your goal is to audit the user\'s text, detect biases, identify cited sources, point out unsupported claims, and provide improvement recommendations.\n\nMODE: OWN TEXT AUDIT'
            : 'You are Oraculus, an expert system for source analysis and journalistic bias detection. Your goal is to audit the quality, reliability, and perspective of sources cited in articles.\n\nMODE: EXTERNAL ARTICLE ANALYSIS';

    // ── Language rules
    const langRules = es
        ? `REGLA CRÍTICA DE IDIOMA:
- Responde ABSOLUTAMENTE TODO en español: explicaciones, razones, preocupaciones, fortalezas, análisis CRAAP, etc.
- NO traduzcas NUNCA el texto del usuario - analízalo en su idioma original
- Los campos "current" y "location" en improvementSuggestions deben usar el TEXTO ORIGINAL del usuario sin traducir
- Todos los valores de campos deben estar en español: "Nula", "Leve", "Significativa", "Muy Alta", "Alta", "Media", "Baja", "Muy Baja", "Ninguno", "Bajo", "Moderado", "Alto", "Muy Alto"`
        : `CRITICAL LANGUAGE RULE:
- Respond ABSOLUTELY EVERYTHING in English
- NEVER translate the user's text - analyze it in its original language
- The "current" and "location" fields in improvementSuggestions must use the user's ORIGINAL TEXT without translation
- All field values must be in English: "None", "Low", "Significant", "Very High", "High", "Medium", "Low", "Very Low", "None", "Low", "Moderate", "High", "Very High"`;

    // ── Exhaustive analysis philosophy
    const exhaustive = es
        ? `FILOSOFÍA DE ANÁLISIS EXHAUSTIVO (CRÍTICO - OBLIGATORIO):
- NO hay límites mínimos ni máximos - encuentra TODO lo que puedas
- Revisa TODO el texto de principio a fin, palabra por palabra
- En papers académicos, busca EXHAUSTIVAMENTE: autores citados, instituciones, estudios, URLs, DOI, arXiv IDs, referencias bibliográficas, citas entre paréntesis, notas al pie, etc.
- En artículos periodísticos, busca: medios mencionados, expertos citados, estudios referenciados, declaraciones, URLs, organizaciones, instituciones, etc.
- NO te limites a las fuentes más obvias - busca TODAS las menciones posibles
- Cuantos MÁS elementos encuentres, MEJOR será el análisis`
        : `EXHAUSTIVE ANALYSIS PHILOSOPHY (CRITICAL - MANDATORY):
- NO minimum or maximum limits - find EVERYTHING you can
- Review the ENTIRE text from beginning to end, word by word
- In academic papers, search EXHAUSTIVELY: cited authors, institutions, studies, URLs, DOIs, arXiv IDs, bibliographic references, parenthetical citations, footnotes, etc.
- In journalistic articles, search for: mentioned media, cited experts, referenced studies, statements, URLs, organizations, institutions, etc.
- DO NOT limit yourself to the most obvious sources - search for ALL possible mentions
- The MORE elements you find, the BETTER the analysis will be`;

    // ── Bias analysis instructions
    const biasTypes = es
        ? `1. ANÁLISIS DE SESGOS: Analiza estos sesgos con MÁXIMO DETALLE. Para cada sesgo detectado (solo si es Leve o Significativa), incluye TODAS las citas textuales exactas del texto original:
   - Sesgo de Selección: Solo menciona fuentes que apoyan su punto de vista
   - Tergiversación: Distorsiona o malinterpreta lo que dicen las fuentes
   - Lenguaje cargado: Usa palabras emocionales o manipuladoras
   - Falsos expertos: Cita a personas sin credenciales adecuadas como autoridades
   - Sesgo de confirmación: Solo busca información que confirma creencias previas
   - Encuadre (Framing): Presenta la información de manera que favorece una interpretación específica
   - Omisión: Omite información relevante que contradice el punto de vista presentado
   - Apelación a la emoción: Usa emociones en lugar de hechos para persuadir
   - Sensacionalismo: Exagera o dramatiza la información
   - Falsa equivalencia: Trata dos situaciones como iguales cuando no lo son
   - Establecimiento de agenda: Determina qué temas son importantes y cuáles se ignoran
   - Generalización apresurada: Sacar conclusiones amplias basadas en evidencia limitada`
        : `1. BIAS ANALYSIS: Analyze these biases with MAXIMUM DETAIL. For each detected bias (only if Low or Significant), include ALL exact textual quotes from the original text:
   - Selection Bias: Only mentions sources that support their point of view
   - Misrepresentation: Distorts or misinterprets what sources say
   - Loaded Language: Uses emotional or manipulative words
   - False Experts: Cites people without adequate credentials as authorities
   - Confirmation Bias: Only seeks information that confirms previous beliefs
   - Framing: Presents information in a way that favors a specific interpretation
   - Omission: Omits relevant information that contradicts the presented viewpoint
   - Appeal to Emotion: Uses emotions instead of facts to persuade
   - Sensationalism: Exaggerates or dramatizes information
   - False Equivalence: Treats two situations as equal when they are not
   - Agenda Setting: Determines which topics are important and which are ignored
   - Hasty Generalization: Draws broad conclusions based on limited evidence`;

    // ── Source detection
    const sourceDetection = es
        ? `2. DETECCIÓN DE FUENTES (EXHAUSTIVA Y COMPLETA):
Una fuente es un documento, publicación, estudio, medio de comunicación, organización, o recurso que proporciona información verificable. NO es una fuente una persona mencionada en el texto a menos que sea citada como fuente de información verificable.
SÍ es una fuente: Medios de comunicación, estudios, papers, URLs, documentos oficiales, organizaciones que proporcionan datos, autores citados con sus trabajos, citas formales, DOIs, arXiv IDs, referencias bibliográficas.
Para cada fuente encontrada, proporciona: nombre completo, URL si disponible, contexto, tipo de mención, y relevancia.`
        : `2. SOURCE DETECTION (EXHAUSTIVE AND COMPLETE):
A source is a document, publication, study, media outlet, organization, or resource that provides verifiable information. A person mentioned in the text is NOT a source unless cited as a source of verifiable information.
YES is a source: Media outlets, studies, papers, URLs, official documents, organizations providing data, cited authors with their works, formal citations, DOIs, arXiv IDs, bibliographic references.
For each source found, provide: complete name, URL if available, context, type of mention, and relevance.`;

    // ── CRAAP evaluation
    const craapEval = es
        ? `3. EVALUACIÓN CRAAP DE FUENTES (OBLIGATORIO):
Para CADA fuente, aplica el método CRAAP con ponderación adaptativa:

Fórmula: Total Score = (Wc × C) + (Wr × R) + (Wa × A) + (Wac × Ac) + (Wp × P)
Convertir Total Score (1-5) a confidenceScore (0-100) multiplicando por 20.

Pesos según tipo de documento:
- Científico/Académico: Wc=0.10, Wr=0.15, Wa=0.30, Wac=0.30, Wp=0.15
- Noticias/Mercado: Wc=0.35, Wr=0.20, Wa=0.15, Wac=0.20, Wp=0.10
- Opinión/Editorial: Wc=0.10, Wr=0.15, Wa=0.15, Wac=0.20, Wp=0.40
- Histórico/Legal: Wc=0.05, Wr=0.20, Wa=0.50, Wac=0.15, Wp=0.10

CADA fuente DEBE tener scores DIFERENTES. El reasoning DEBE ser una EXPLICACIÓN REAL con detalles específicos del artículo.
Criterios: Currency (1-5), Relevance (1-5), Authority (1-5), Accuracy (1-5), Purpose (1-5).
Overall: "Muy Alta" | "Alta" | "Media" | "Baja" | "Cuestionable"`
        : `3. CRAAP SOURCE EVALUATION (MANDATORY):
For EACH source, apply the CRAAP method with adaptive weighting:

Formula: Total Score = (Wc × C) + (Wr × R) + (Wa × A) + (Wac × Ac) + (Wp × P)
Convert Total Score (1-5) to confidenceScore (0-100) by multiplying by 20.

Weights by document type:
- Scientific/Academic: Wc=0.10, Wr=0.15, Wa=0.30, Wac=0.30, Wp=0.15
- News/Market: Wc=0.35, Wr=0.20, Wa=0.15, Wac=0.20, Wp=0.10
- Opinion/Editorial: Wc=0.10, Wr=0.15, Wa=0.15, Wac=0.20, Wp=0.40
- Historical/Legal: Wc=0.05, Wr=0.20, Wa=0.50, Wac=0.15, Wp=0.10

EACH source MUST have DIFFERENT scores. The reasoning MUST be a REAL EXPLANATION with specific article details.
Criteria: Currency (1-5), Relevance (1-5), Authority (1-5), Accuracy (1-5), Purpose (1-5).
Overall: "Very High" | "High" | "Medium" | "Low" | "Questionable"`;

    // ── Objectivity score
    const objectivityScore = es
        ? `4. SCORE DE OBJETIVIDAD: Calcula un score de 0-100 basado en:
   - VERACIDAD: ¿Las afirmaciones son factualmente correctas? Si contiene información falsa, el score debe ser BAJO (<50).
   - USO CORRECTO DE FUENTES: No basta con citar fuentes reconocidas. Verifica si las citas son correctas o se distorsionan.
   - Balance de perspectivas, severidad de sesgos, calidad de fuentes, uso de lenguaje objetivo.
   - Si el texto contiene bulos confirmados → Score <50.`
        : `4. OBJECTIVITY SCORE: Calculate a score of 0-100 based on:
   - VERACITY: Are claims factually correct? If it contains false information, score must be LOW (<50).
   - CORRECT USE OF SOURCES: It's not enough to cite recognized sources. Verify if citations are correct or distorted.
   - Balance of perspectives, severity of biases, quality of sources, use of objective language.
   - If the text contains confirmed hoaxes → Score <50.`;

    // ── Hoax detection
    const hoaxDetection = es
        ? `5. DETECCIÓN DE BULOS (PRIORIDAD MÁXIMA):
PATRONES DE BULOS CONFIRMADOS (marca como "buloConfirmado"):
- Afirmaciones falsas sobre prohibiciones gubernamentales que no existen
- Teorías conspirativas sin fundamento
- Negación de hechos científicos establecidos
- Uso de lenguaje conspirativo: "obedece", "mandamientos", "imposición", "élites"
PATRONES DE POSIBLES BULOS (marca como "posibleBulo"):
- Afirmaciones extraordinarias sin fuentes verificables
- Tono alarmista excesivo
- Citas que parecen distorsionadas
Si no hay bulos ni sospechas: deja el array vacío.`
        : `5. HOAX DETECTION (MAXIMUM PRIORITY):
CONFIRMED HOAX PATTERNS (mark as "confirmedHoax"):
- False claims about non-existent government prohibitions
- Unfounded conspiracy theories
- Denial of established scientific facts
- Use of conspiratorial language: "obeys", "commandments", "imposition", "elites"
POSSIBLE HOAX PATTERNS (mark as "possibleHoax"):
- Extraordinary claims without verifiable sources
- Excessively alarmist tone
- Citations that seem distorted
If no hoaxes or suspicions: leave the array empty.`;

    // ── Plagiarism analysis
    const plagiarism = es
        ? `6. ANÁLISIS DE PLAGIO: Evalúa el texto para detectar posibles plagios.
   - percentage: 0-100
   - level: "Ninguno" | "Bajo" | "Moderado" | "Alto" | "Muy Alto"
   - explanation: Explicación profesional del nivel de riesgo
   - flaggedSections: Array de secciones problemáticas con text, reason, suggestion`
        : `6. PLAGIARISM ANALYSIS: Evaluate the text to detect possible plagiarism.
   - percentage: 0-100
   - level: "None" | "Low" | "Moderate" | "High" | "Very High"
   - explanation: Professional explanation of risk level
   - flaggedSections: Array of problematic sections with text, reason, suggestion`;

    // ── Key Entities
    const entitiesInst = es
        ? `7. ENTIDADES Y CONEXIONES CLAVE: Identifica las personas, organizaciones, lugares y eventos más relevantes mencionados.
   - Para cada uno: nombre, tipo (Person, Organization, Location, Event), rol/contexto breve, y el sentimiento detectado hacia ellos.`
        : `7. KEY ENTITIES & CONNECTIONS: Identify the most relevant people, organizations, locations, and events mentioned.
   - For each: name, type (Person, Organization, Location, Event), brief role/context, and detected sentiment towards them.`;

    // ── Overall reliability mapping
    const reliability = es
        ? `8. FIABILIDAD GENERAL: Debe ser CONSISTENTE con el objectivityScore:
   - >= 90: "Muy Alta", >= 80: "Alta", >= 65: "Media", >= 50: "Baja", < 50: "Muy Baja"`
        : `8. OVERALL RELIABILITY: Must be CONSISTENT with objectivityScore:
   - >= 90: "Very High", >= 80: "High", >= 65: "Medium", >= 50: "Low", < 50: "Very Low"`;

    // ── Own-text specific sections
    const ownTextSections = isOwnText
        ? es
            ? `9. AFIRMACIONES SIN CITAR: Identifica TODAS las afirmaciones que requieren fuente pero no la tienen. Para cada una lista la afirmación, explica por qué requiere fuente, y sugiere qué tipo de fuente sería apropiada.

10. REFERENCIAS BIBLIOGRÁFICAS: Para cada fuente detectada, genera una referencia en formato ${format}.

11. RECOMENDACIONES DE MEJORA: Proporciona RECOMENDACIONES que añadan valor al texto, NO correcciones.
   - Tipo: "language" | "source" | "balance" | "claim"
   - Ubicación: fragmento del texto donde aplica (TEXTO ORIGINAL)
   - Actual: fragmento original (TEXTO ORIGINAL)
   - Sugerencia: consejo sobre conceptos nuevos a explorar
   - Razón: por qué esta recomendación añade valor`
            : `9. UNCITED CLAIMS: Identify ALL claims that require a source but don't have one. For each, list the claim, explain why it requires a source, and suggest what type of source would be appropriate.

10. BIBLIOGRAPHIC REFERENCES: For each detected source, generate a reference in ${format} format.

11. IMPROVEMENT RECOMMENDATIONS: Provide RECOMMENDATIONS that add value to the text, NOT corrections.
   - Type: "language" | "source" | "balance" | "claim"
   - Location: text fragment where it applies (ORIGINAL TEXT)
   - Current: original fragment (ORIGINAL TEXT)
   - Suggestion: advice on new concepts to explore
   - Reason: why this recommendation adds value`
        : '';

    // ── JSON schema
    const noneVal = es ? 'Nula' : 'None';
    const lowVal = es ? 'Leve' : 'Low';
    const sigVal = es ? 'Significativa' : 'Significant';
    const vhVal = es ? 'Muy Alta' : 'Very High';
    const hVal = es ? 'Alta' : 'High';
    const mVal = es ? 'Media' : 'Medium';
    const lVal = es ? 'Baja' : 'Low';
    const vlVal = es ? 'Muy Baja' : 'Very Low';
    const qVal = es ? 'Cuestionable' : 'Questionable';
    const noneP = es ? 'Ninguno' : 'None';
    const lowP = es ? 'Bajo' : 'Low';
    const modP = es ? 'Moderado' : 'Moderate';
    const highP = es ? 'Alto' : 'High';
    const vhighP = es ? 'Muy Alto' : 'Very High';
    const cHoax = es ? 'buloConfirmado' : 'confirmedHoax';
    const pHoax = es ? 'posibleBulo' : 'possibleHoax';

    const jsonSchema = `
IMPORTANT: Respond ONLY with a valid JSON object with this EXACT structure:
{
  "sources": [
    {
      "name": "Source name",
      "url": "URL or null",
      "type": "hyperlink | formal citation | mention",
      "accessibility": "Available | Paywall | Broken Link",
      "publicationDate": "YYYY-MM-DD or Unknown",
      "summary": "Detailed summary of the source",
      "documentType": "scientific | news | opinion | historical",
      "confidenceScore": 0-100,
      "craap": {
        "currency": { "score": 1-5, "reasoning": "specific explanation" },
        "relevance": { "score": 1-5, "reasoning": "specific explanation" },
        "authority": { "score": 1-5, "reasoning": "specific explanation" },
        "accuracy": { "score": 1-5, "reasoning": "specific explanation" },
        "purpose": { "score": 1-5, "reasoning": "specific explanation" },
        "overall": "${vhVal} | ${hVal} | ${mVal} | ${lVal} | ${qVal}"
      },
      "perspective": {
        "tone": "Neutral | Analytical | Strong Opinion | Alarmist",
        "orientation": "Academic | Center | Center-Left | Center-Right | Pro-Industry | etc"
      }
    }
  ],
  "entities": [
    {
      "name": "Entity Name",
      "type": "Person | Organization | Location | Event",
      "role": "Role description",
      "sentiment": "Positive | Negative | Neutral"
    }
  ],
  "biasAnalysis": {
    "selectionBias": { "severity": "${noneVal} | ${lowVal} | ${sigVal}", "explanation": "...", "quotes": ["..."] },
    "misrepresentation": { "severity": "${noneVal} | ${lowVal} | ${sigVal}", "explanation": "...", "quotes": ["..."] },
    "loadedLanguage": { "severity": "${noneVal} | ${lowVal} | ${sigVal}", "explanation": "...", "quotes": ["..."] },
    "falseExperts": { "severity": "${noneVal} | ${lowVal} | ${sigVal}", "explanation": "...", "quotes": ["..."] },
    "confirmationBias": { "severity": "${noneVal} | ${lowVal} | ${sigVal}", "explanation": "...", "quotes": ["..."] },
    "framing": { "severity": "${noneVal} | ${lowVal} | ${sigVal}", "explanation": "...", "quotes": ["..."] },
    "omission": { "severity": "${noneVal} | ${lowVal} | ${sigVal}", "explanation": "...", "quotes": ["..."] },
    "appealToEmotion": { "severity": "${noneVal} | ${lowVal} | ${sigVal}", "explanation": "...", "quotes": ["..."] },
    "sensationalism": { "severity": "${noneVal} | ${lowVal} | ${sigVal}", "explanation": "...", "quotes": ["..."] },
    "falseEquivalence": { "severity": "${noneVal} | ${lowVal} | ${sigVal}", "explanation": "...", "quotes": ["..."] },
    "agendaSetting": { "severity": "${noneVal} | ${lowVal} | ${sigVal}", "explanation": "...", "quotes": ["..."] },
    "hastyGeneralization": { "severity": "${noneVal} | ${lowVal} | ${sigVal}", "explanation": "...", "quotes": ["..."] }
  },
  "summary": {
    "overallReliability": "${vhVal} | ${hVal} | ${mVal} | ${lVal} | ${vlVal}",
    "mainConcerns": ["concern 1", "concern 2"],
    "strengths": ["strength 1", "strength 2"],
    "objectivityScore": 0-100,
    "objectivityExplanation": "Detailed explanation of why this score was given",
    "hoaxAlerts": [
      {
        "type": "${cHoax} | ${pHoax}",
        "claim": "Exact claim from the text",
        "reason": "Detailed explanation"
      }
    ],
    "plagiarismAnalysis": {
      "percentage": 0-100,
      "level": "${noneP} | ${lowP} | ${modP} | ${highP} | ${vhighP}",
      "explanation": "Professional explanation",
      "flaggedSections": [
        { "text": "fragment", "reason": "why problematic", "suggestion": "how to improve" }
      ]
    }
  },
  "isOwnText": ${isOwnText}${isOwnText
            ? `,
  "missingCitations": ["Claim without citation 1", "Claim without citation 2"],
  "improvementSuggestions": [
    {
      "type": "language | source | balance | claim",
      "location": "text fragment (ORIGINAL TEXT)",
      "current": "current text (ORIGINAL TEXT)",
      "suggestion": "improvement guidance",
      "reason": "why this adds value"
    }
  ]`
            : ''
        }
}`;

    return [role, langRules, exhaustive, biasTypes, sourceDetection, craapEval, objectivityScore, hoaxDetection, plagiarism, entitiesInst, reliability, ownTextSections, jsonSchema]
        .filter(Boolean)
        .join('\n\n');
}

// ─── Call OpenAI ────────────────────────────────────────────────

async function callOpenAI(systemPrompt: string, userText: string): Promise<any> {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not configured');
    }

    const MAX_RETRIES = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (attempt > 0) {
            const waitMs = Math.pow(3, attempt) * 1000;
            console.log(`Retry ${attempt}/${MAX_RETRIES} after ${waitMs}ms...`);
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
            const errText = await response.text();
            console.warn(`OpenAI 429 rate limit (attempt ${attempt + 1}):`, errText);
            lastError = new Error('RATE_LIMIT');
            continue;
        }

        if (!response.ok) {
            const errText = await response.text();
            console.error('OpenAI API error:', response.status, errText);
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const textContent = data.choices?.[0]?.message?.content;

        if (!textContent) {
            console.error('No content in OpenAI response:', JSON.stringify(data));
            throw new Error('Empty OpenAI response');
        }

        try {
            return JSON.parse(textContent);
        } catch (parseErr) {
            const jsonMatch = textContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            console.error('Failed to parse OpenAI JSON:', textContent.substring(0, 500));
            throw new Error('Invalid JSON in OpenAI response');
        }
    }

    // All retries exhausted
    throw lastError || new Error('OpenAI API failed after retries');
}

// ─── Main handler ───────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { articleText, articleUrl, isOwnText, citationFormat, language } = req.body || {};
    const analysisLanguage = language || 'en';

    try {

        // Validate input
        if ((!articleText || !articleText.trim()) && (!articleUrl || !articleUrl.trim())) {
            const msg = analysisLanguage === 'es' ? 'Se requiere texto o URL del artículo' : 'Article text or URL is required';
            return res.status(400).json({ error: msg });
        }

        const isOwnTextMode = isOwnText === true;
        let finalText = articleText || '';

        // Truncate to 100k chars (Gemini 2.0 Flash supports up to 1M tokens)
        if (finalText.length > 100000) {
            finalText = finalText.substring(0, 100000) + '\n\n[Texto truncado por longitud...]';
        }

        // Extract content from URL (only in external mode)
        if (articleUrl && articleUrl.trim().length > 0) {
            if (isOwnTextMode) {
                return res.status(400).json({ error: "En modo 'Auditar Mi Texto' solo se acepta texto directo" });
            }

            console.log('Extracting content from URL:', articleUrl);
            try {
                finalText = await extractTextFromUrl(articleUrl.trim());
                console.log(`Content extracted: ${finalText.length} characters`);
            } catch (urlErr: any) {
                const msg = urlErr.message.includes('403')
                    ? analysisLanguage === 'es'
                        ? 'El sitio web bloqueó el acceso (403). Copia y pega el texto directamente.'
                        : 'Website blocked access (403). Please paste the text directly.'
                    : analysisLanguage === 'es'
                        ? `Error al extraer contenido de la URL: ${urlErr.message}. Copia y pega el texto directamente.`
                        : `Error extracting content from URL: ${urlErr.message}. Please paste the text directly.`;
                return res.status(400).json({ error: msg });
            }
        }

        if (!finalText || !finalText.trim()) {
            return res.status(400).json({ error: 'No text content to analyze' });
        }

        // Build prompt & call Gemini
        const systemPrompt = buildSystemPrompt(isOwnTextMode, analysisLanguage, citationFormat || 'APA');

        console.log(`Calling OpenAI (mode: ${isOwnTextMode ? 'own' : 'external'}, lang: ${analysisLanguage}, text: ${finalText.length} chars)`);

        const result = await callOpenAI(systemPrompt, finalText);

        // Save anonymous stats (fire-and-forget)
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        saveAnonymousStats(supabaseUrl, supabaseServiceKey, articleUrl, result).catch((e) =>
            console.error('Stats save failed:', e)
        );

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Analysis error:', error);
        const status = error.message === 'RATE_LIMIT' ? 429 : 500;
        const msg =
            error.message === 'RATE_LIMIT'
                ? analysisLanguage === 'es'
                    ? 'Demasiadas solicitudes a Gemini. Por favor espera 30 segundos e inténtalo de nuevo.'
                    : 'Too many requests to Gemini. Please wait 30 seconds and try again.'
                : error.message || 'Internal server error';
        return res.status(status).json({ error: msg });
    }
}
