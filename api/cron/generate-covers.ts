import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Security check: Verify the request is from Vercel Cron
    const authHeader = req.headers['authorization'];
    if (req.headers['user-agent'] !== 'vercel-cron/1.0' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // 1. Fetch news without images (limit to 2 per run to control costs/timeouts)
        const { data: newsItems, error: fetchError } = await supabase
            .from('daily_news')
            .select('id, title, summary')
            .is('image', null)
            .limit(5);

        if (fetchError) throw fetchError;
        if (!newsItems || newsItems.length === 0) {
            return res.status(200).json({ message: 'No news items pending image generation.' });
        }

        const results = [];

        // 2. Process each item
        for (const item of newsItems) {
            try {
                console.log(`Generating image for: ${item.title}`);

                const prompt = `Editorial magazine cover art, minimalist, modern, abstract, high quality photography style for news headline: "${item.title}". Summary: "${item.summary}". NO TEXT. Horizontal aspect ratio.`;

                // Generate Image with Gemini (Imagen 3) via REST API
                // Using REST avoids SDK version mismatches for image generation specifically
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${process.env.GEMINI_API_KEY}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            instances: [
                                { prompt: prompt }
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
