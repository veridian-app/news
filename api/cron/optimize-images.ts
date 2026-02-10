import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import sharp from 'sharp';

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BATCH_SIZE = 5; // Process 5 images per invocation to stay within Vercel limits

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Security check
    const authHeader = req.headers['authorization'];
    if (req.headers['user-agent'] !== 'vercel-cron/1.0' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // Find news items with PNG images (not yet optimized)
        const { data: newsItems, error: fetchError } = await supabase
            .from('daily_news')
            .select('id, image')
            .like('image', '%.png%')
            .not('image', 'is', null)
            .neq('image', '')
            .neq('image', 'GENERATION_FAILED')
            .limit(BATCH_SIZE);

        if (fetchError) throw fetchError;
        if (!newsItems || newsItems.length === 0) {
            return res.status(200).json({
                message: '✅ All images are already optimized! No PNG images found.',
                processed: 0
            });
        }

        console.log(`🖼️ Found ${newsItems.length} PNG images to optimize`);
        const results: any[] = [];

        for (const item of newsItems) {
            try {
                const imageUrl = item.image;
                if (!imageUrl) continue;

                console.log(`🔄 Processing ${item.id}: ${imageUrl}`);

                // 1. Download the existing PNG from Supabase Storage
                // Extract the file path from the public URL
                const urlParts = imageUrl.split('/news-covers/');
                if (urlParts.length < 2) {
                    console.warn(`⚠️ Could not parse URL for ${item.id}: ${imageUrl}`);
                    results.push({ id: item.id, status: 'skipped', reason: 'Could not parse URL' });
                    continue;
                }

                const oldFileName = urlParts[1].split('?')[0]; // Remove query params if any

                // Download the file
                const { data: fileData, error: downloadError } = await supabase
                    .storage
                    .from('news-covers')
                    .download(oldFileName);

                if (downloadError) {
                    console.error(`❌ Download failed for ${item.id}:`, downloadError);
                    results.push({ id: item.id, status: 'error', reason: downloadError.message });
                    continue;
                }

                // 2. Convert to WebP with sharp
                const arrayBuffer = await fileData.arrayBuffer();
                const rawBuffer = Buffer.from(arrayBuffer);
                const optimizedBuffer = await sharp(rawBuffer)
                    .resize(1200, null, { withoutEnlargement: true })
                    .webp({ quality: 80 })
                    .toBuffer();

                const newFileName = oldFileName.replace(/\.png$/i, '.webp');

                console.log(`📦 ${item.id}: ${(rawBuffer.length / 1024).toFixed(0)}KB PNG → ${(optimizedBuffer.length / 1024).toFixed(0)}KB WebP (${((1 - optimizedBuffer.length / rawBuffer.length) * 100).toFixed(0)}% reduction)`);

                // 3. Upload the optimized WebP
                const { error: uploadError } = await supabase
                    .storage
                    .from('news-covers')
                    .upload(newFileName, optimizedBuffer, {
                        contentType: 'image/webp',
                        upsert: true
                    });

                if (uploadError) {
                    console.error(`❌ Upload failed for ${item.id}:`, uploadError);
                    results.push({ id: item.id, status: 'error', reason: uploadError.message });
                    continue;
                }

                // 4. Get new public URL
                const { data: publicUrlData } = supabase
                    .storage
                    .from('news-covers')
                    .getPublicUrl(newFileName);

                const newUrl = publicUrlData.publicUrl;

                // 5. Update the database record
                const { error: updateError } = await supabase
                    .from('daily_news')
                    .update({ image: newUrl })
                    .eq('id', item.id);

                if (updateError) {
                    console.error(`❌ DB update failed for ${item.id}:`, updateError);
                    results.push({ id: item.id, status: 'error', reason: updateError.message });
                    continue;
                }

                // 6. Delete the old PNG file to save storage
                const { error: deleteError } = await supabase
                    .storage
                    .from('news-covers')
                    .remove([oldFileName]);

                if (deleteError) {
                    console.warn(`⚠️ Could not delete old PNG for ${item.id}:`, deleteError);
                    // Not a critical error, continue
                }

                results.push({
                    id: item.id,
                    status: 'success',
                    oldSize: `${(rawBuffer.length / 1024).toFixed(0)}KB`,
                    newSize: `${(optimizedBuffer.length / 1024).toFixed(0)}KB`,
                    reduction: `${((1 - optimizedBuffer.length / rawBuffer.length) * 100).toFixed(0)}%`,
                    newUrl
                });

            } catch (err: any) {
                console.error(`❌ Failed to process ${item.id}:`, err);
                results.push({ id: item.id, status: 'error', reason: err.message });
            }
        }

        // Check if there are more images to process
        const { count } = await supabase
            .from('daily_news')
            .select('id', { count: 'exact', head: true })
            .like('image', '%.png%')
            .not('image', 'is', null)
            .neq('image', '')
            .neq('image', 'GENERATION_FAILED');

        const remaining = (count || 0);

        return res.status(200).json({
            processed: results,
            summary: {
                total: results.length,
                success: results.filter(r => r.status === 'success').length,
                errors: results.filter(r => r.status === 'error').length,
                skipped: results.filter(r => r.status === 'skipped').length,
                remaining: remaining,
                message: remaining > 0
                    ? `⏳ ${remaining} images remaining. Call this endpoint again to process more.`
                    : '✅ All images have been optimized!'
            }
        });

    } catch (error: any) {
        console.error('❌ Optimize images cron failed:', error);
        return res.status(500).json({ error: error.message });
    }
}
