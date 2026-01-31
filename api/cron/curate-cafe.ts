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
        console.log('☕ Curating daily Café Veridian content...');

        // Get all recent news with images (last 48 hours)
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const { data: recentNews, error: newsError } = await supabase
            .from('daily_news')
            .select('id, title, summary, content')
            .not('image', 'is', null)
            .neq('image', '')
            .neq('image', 'GENERATION_FAILED')
            .gte('published_at', twoDaysAgo.toISOString())
            .order('published_at', { ascending: false })
            .limit(30);

        if (newsError) throw newsError;

        if (!recentNews || recentNews.length === 0) {
            return res.status(200).json({ message: 'No news available for curation' });
        }

        console.log(`📰 Found ${recentNews.length} recent news to curate`);

        // Use Gemini to curate the best news AND generate related polls
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY not configured');
        }

        const newsContext = recentNews.map((n, i) =>
            `[${i + 1}] ID: ${n.id}\nTítulo: ${n.title}\nResumen: ${n.summary?.substring(0, 150)}`
        ).join('\n\n');

        const prompt = `Eres el editor de Café Veridian, una sección de lectura matutina premium. 

Analiza estas noticias y selecciona las 5-6 MÁS INTERESANTES basándote en:
- Relevancia e impacto social
- Diversidad temática (no repitas temas similares)
- Potencial para generar reflexión
- Interés general

Noticias disponibles:
${newsContext}

Además, genera 2 PREGUNTAS DE OPINIÓN basadas en las noticias que selecciones. Las preguntas deben:
- Ser sobre OPINIONES (sin respuesta correcta)
- Relacionarse directamente con una noticia seleccionada
- Tener 3-4 opciones de respuesta
- Servir para entender las preferencias de la audiencia

Responde SOLO en JSON válido:
{
  "selectedNewsIds": ["uuid1", "uuid2", ...],
  "curationReason": "Breve explicación de la selección",
  "polls": [
    {
      "question": "¿Pregunta de opinión?",
      "options": ["Opción 1", "Opción 2", "Opción 3"],
      "relatedNewsId": "uuid de la noticia relacionada"
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
                        maxOutputTokens: 2048
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

        // Parse JSON response
        let curationData;
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('No JSON found');
            curationData = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
            console.error('Failed to parse Gemini response:', responseText);
            throw new Error('Failed to parse curation data');
        }

        console.log(`✅ Selected ${curationData.selectedNewsIds?.length || 0} news items`);
        console.log(`📝 Reason: ${curationData.curationReason}`);

        // Store curated selection (mark news as featured for today)
        const today = new Date().toISOString().split('T')[0];

        // First, clear previous day's featured news
        await supabase
            .from('daily_news')
            .update({ cafe_featured_date: null })
            .not('cafe_featured_date', 'is', null);

        // Mark selected news as featured for today
        if (curationData.selectedNewsIds && curationData.selectedNewsIds.length > 0) {
            const { error: updateError } = await supabase
                .from('daily_news')
                .update({ cafe_featured_date: today })
                .in('id', curationData.selectedNewsIds);

            if (updateError) {
                console.error('Error marking featured news:', updateError);
            }
        }

        // Insert polls
        const pollResults = [];
        for (const poll of (curationData.polls || [])) {
            const options = poll.options.map((label: string, index: number) => ({
                id: `opt${index + 1}`,
                label
            }));

            const { data: insertedPoll, error: insertError } = await supabase
                .from('daily_polls')
                .insert({
                    question: poll.question,
                    options,
                    related_news_id: poll.relatedNewsId || null
                })
                .select()
                .single();

            if (insertError) {
                console.error('Failed to insert poll:', insertError);
                pollResults.push({ question: poll.question, status: 'error' });
            } else {
                console.log(`✅ Created poll: ${poll.question}`);
                pollResults.push({ question: poll.question, status: 'success', id: insertedPoll.id });
            }
        }

        return res.status(200).json({
            message: 'Café content curated successfully',
            selectedNews: curationData.selectedNewsIds?.length || 0,
            reason: curationData.curationReason,
            polls: pollResults
        });

    } catch (error: any) {
        console.error('❌ Curation failed:', error);
        return res.status(500).json({ error: error.message });
    }
}
