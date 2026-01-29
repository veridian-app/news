import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Security check: Verify the request is from Vercel Cron
    const authHeader = req.headers['authorization'];

    // DEBUG LOGS
    console.log('🔒 Auth Debug:');
    console.log(`- User-Agent: ${req.headers['user-agent']}`);
    console.log(`- Received Auth: ${authHeader ? 'Bear *****' : 'None'}`);
    console.log(`- Expected Secret: ${process.env.CRON_SECRET ? 'Defined' : 'UNDEFINED'}`);
    console.log(`- Secret Match? ${authHeader === `Bearer ${process.env.CRON_SECRET}`}`);

    if (req.headers['user-agent'] !== 'vercel-cron/1.0' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        console.error('❌ Authorization Failed');
        return res.status(401).json({ error: 'Unauthorized', debug: 'Check Vercel logs' });
    }

    try {
        let query = supabase
            .from('daily_news')
            .select('id, title, summary');

        // Si recibimos un specific ID (ej: desde webhook/trigger), procesamos solo ese
        if (req.body && req.body.newsId) {
            console.log(`🚀 Triggered for specific news ID: ${req.body.newsId}`);
            query = query.eq('id', req.body.newsId);
        } else {
            // Modo cron normal: buscar las que faltan (limitado por lotes)
            query = query.or('image.is.null,image.eq.""').limit(5);
        }

        const { data: newsItems, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        if (!newsItems || newsItems.length === 0) {
            return res.status(200).json({ message: 'No news items pending image generation.' });
        }

        const results = [];

        // 2. Process each item
        for (const item of newsItems) {
            try {
                console.log(`Generating image for: ${item.title}`);

                // 1. Generate a Smart Prompt using Gemini 1.5 Flash
                let imagePrompt = `Editorial news photography, high quality, realistic, for: ${item.title}`; // Fallback

                try {
                    const promptGenResponse = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{
                                    parts: [{
                                        text: `You are an expert art director for a high-end news magazine.
                                        Create a detailed, creative image generation prompt for this news story:
                                        
                                        Title: "${item.title}"
                                        Summary: "${item.summary || item.title}"
                                        
                                        REQUIREMENTS:
                                        - The prompt must describe a specific, visual scene that represents the core topic.
                                        - Style: Cinematic, photorealistic, 8k resolution, dramatic lighting.
                                        - NO text in the image.
                                        - Do NOT use abstract concepts, describe physical objects, people, or settings.
                                        - Return ONLY the prompt text, nothing else.`
                                    }]
                                }]
                            })
                        }
                    );

                    const promptData = await promptGenResponse.json();
                    if (promptData.candidates?.[0]?.content?.parts?.[0]?.text) {
                        imagePrompt = promptData.candidates[0].content.parts[0].text.trim();
                        console.log(`✨ Smart Prompt generated: ${imagePrompt}`);
                    }
                } catch (e) {
                    console.error('Failed to generate smart prompt, using fallback:', e);
                }

                // 2. Generate Image with specific prompt using Imagen 4
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${process.env.GEMINI_API_KEY}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            instances: [
                                { prompt: imagePrompt }
                            ],
                            parameters: {
                                sampleCount: 1,
                                aspectRatio: "16:9"
                            }
                        })
                    }
                );

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
                }

                const data = await response.json();
                // Imagen response structure: { predictions: [ { bytesBase64Encoded: "..." } ] }
                const imageBase64 = data.predictions?.[0]?.bytesBase64Encoded;

                if (!imageBase64) throw new Error('No image data returned from Gemini');

                // Convert base64 to buffer
                const imageBuffer = Buffer.from(imageBase64, 'base64');
                const fileName = `${item.id}_${Date.now()}.png`;

                // Upload to Supabase Storage
                const { data: uploadData, error: uploadError } = await supabase
                    .storage
                    .from('news-covers')
                    .upload(fileName, imageBuffer, {
                        contentType: 'image/png',
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                // Get Public URL
                const { data: publicUrlData } = supabase
                    .storage
                    .from('news-covers')
                    .getPublicUrl(fileName);

                const publicUrl = publicUrlData.publicUrl;

                // Update database record
                const { error: updateError } = await supabase
                    .from('daily_news')
                    .update({ image: publicUrl })
                    .eq('id', item.id);

                if (updateError) throw updateError;

                results.push({ id: item.id, title: item.title, status: 'success', url: publicUrl });

            } catch (err: any) {
                console.error(`Failed to process item ${item.id}:`, err);
                results.push({ id: item.id, error: err.message });
            }
        }

        return res.status(200).json({ processed: results });

    } catch (error: any) {
        console.error('Cron job failed:', error);
        return res.status(500).json({ error: error.message });
    }
}
