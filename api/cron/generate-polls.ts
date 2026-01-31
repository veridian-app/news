import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Security check
    const authHeader = req.headers['authorization'];
    if (req.headers['user-agent'] !== 'vercel-cron/1.0' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        console.log('🗳️ Starting daily poll generation...');

        // Get today's top news (with images) to base polls on
        const { data: todayNews, error: newsError } = await supabase
            .from('daily_news')
            .select('id, title, summary')
            .not('image', 'is', null)
            .neq('image', '')
            .neq('image', 'GENERATION_FAILED')
            .order('published_at', { ascending: false })
            .limit(5);

        if (newsError) throw newsError;

        if (!todayNews || todayNews.length === 0) {
            return res.status(200).json({ message: 'No news to generate polls from' });
        }

        // Use Gemini to generate poll questions
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY not configured');
        }

        const newsContext = todayNews.map(n => `- ${n.title}: ${n.summary?.substring(0, 100)}`).join('\n');

        const prompt = `Basándote en estas noticias del día:

${newsContext}

Genera 2 preguntas de opinión para una encuesta de lectores. Las preguntas deben:
1. Ser sobre OPINIONES, no hechos (no hay respuesta correcta o incorrecta)
2. Servir para entender mejor a la audiencia y sus preferencias
3. Tener 3-4 opciones de respuesta cortas
4. Estar relacionadas con las noticias pero ser generales

Responde SOLO en JSON válido con este formato exacto:
{
  "polls": [
    {
      "question": "¿Pregunta de opinión?",
      "options": ["Opción 1", "Opción 2", "Opción 3"],
      "relatedNewsTitle": "Título de la noticia relacionada"
    }
  ]
}`;

        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024
                    }
                })
            }
        );

        if (!geminiResponse.ok) {
            const errText = await geminiResponse.text();
            throw new Error(`Gemini API error: ${errText}`);
        }

        const geminiData = await geminiResponse.json();
        const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
            throw new Error('No response from Gemini');
        }

        // Parse JSON response (handle markdown code blocks)
        let pollsData;
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('No JSON found in response');
            pollsData = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
            console.error('Failed to parse Gemini response:', responseText);
            throw new Error('Failed to parse poll data from Gemini');
        }

        // Insert polls into database
        const results = [];
        for (const poll of pollsData.polls) {
            // Find related news ID
            const relatedNews = todayNews.find(n =>
                n.title.toLowerCase().includes(poll.relatedNewsTitle?.toLowerCase()?.substring(0, 20) || '')
            );

            const options = poll.options.map((label: string, index: number) => ({
                id: `opt${index + 1}`,
                label
            }));

            const { data: insertedPoll, error: insertError } = await supabase
                .from('daily_polls')
                .insert({
                    question: poll.question,
                    options,
                    related_news_id: relatedNews?.id || null
                })
                .select()
                .single();

            if (insertError) {
                console.error('Failed to insert poll:', insertError);
                results.push({ question: poll.question, status: 'error', error: insertError.message });
            } else {
                console.log(`✅ Created poll: ${poll.question}`);
                results.push({ question: poll.question, status: 'success', id: insertedPoll.id });
            }
        }

        return res.status(200).json({
            message: `Generated ${results.filter(r => r.status === 'success').length} polls`,
            results
        });

    } catch (error: any) {
        console.error('❌ Poll generation failed:', error);
        return res.status(500).json({ error: error.message });
    }
}
