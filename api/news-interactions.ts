import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// =============================================================================
// CONFIGURATION & UTILS
// =============================================================================

function getSupabaseClient() {
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_PUBLISHABLE_KEY ||
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_KEY) return null;
    return createClient(SUPABASE_URL, SUPABASE_KEY);
}

// =============================================================================
// LOGIC: COMMENTS
// =============================================================================

// Comments logic removed per user request

// =============================================================================
// LOGIC: CHAT & AI GENERATION
// =============================================================================

async function getAIResponse(systemPrompt: string, userPrompt: string, maxTokens = 500): Promise<string> {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    try {
        if (OPENAI_API_KEY) {
            const resp = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
                    max_tokens: maxTokens
                })
            });
            const data = await resp.json();
            return data.choices?.[0]?.message?.content || 'Error generating response';
        } else if (GEMINI_API_KEY) {
            const resp = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }]
                    })
                }
            );
            const data = await resp.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Error generating response';
        }
    } catch (e) {
        console.error('AI Error', e);
    }
    return 'Artificial Intelligence service unavailable.';
}

async function handleChat(req: VercelRequest, res: VercelResponse, newsId: string) {
    const { question, newsData } = req.body;
    if (!question || !newsData) return res.status(400).json({ error: 'Missing question or newsData' });

    const systemPrompt = `Eres un asistente de noticias. Responde preguntas sobre: "${newsData.title}".`;
    const userPrompt = `Noticia: ${newsData.summary || newsData.content}. Pregunta: ${question}`;

    const response = await getAIResponse(systemPrompt, userPrompt, 1000);
    return res.status(200).json({ response, newsId, question });
}

// Generate comment logic removed per user request

// =============================================================================
// MAIN HANDLER
// =============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { action, newsId } = req.query; // e.g. /api/news-interactions?action=chat&newsId=123

    if (!newsId || typeof newsId !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid newsId parameters' });
    }

    try {
        switch (action) {
            case 'chat':
                if (req.method === 'POST') return await handleChat(req, res, newsId as string);
                break;
            default:
                return res.status(400).json({ error: 'Invalid action. Use action=chat' });
        }
        return res.status(405).json({ error: 'Method not allowed for this action' });
    } catch (error: any) {
        console.error('Handler Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
