import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Security: require authorization
    const authHeader = req.headers['authorization'];
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        console.log('🔗 Starting image re-linking process...');

        // 1. List all files in the news-covers bucket
        const { data: files, error: listError } = await supabase
            .storage
            .from('news-covers')
            .list('', { limit: 1000 });

        if (listError) throw listError;
        if (!files || files.length === 0) {
            return res.status(200).json({ message: 'No images found in bucket' });
        }

        console.log(`📁 Found ${files.length} files in news-covers bucket`);

        const results = [];
        const linkedIds = new Set<string>();

        // 2. Process each file
        for (const file of files) {
            // Extract news ID from filename (format: newsId_timestamp.png)
            const match = file.name.match(/^(.+?)_\d+\.png$/);
            if (!match) {
                console.log(`⚠️ Skipping file with unexpected format: ${file.name}`);
                continue;
            }

            const newsId = match[1];

            // Skip if we already linked this news ID (take the most recent one)
            if (linkedIds.has(newsId)) {
                console.log(`⚠️ Already linked ${newsId}, skipping duplicate`);
                continue;
            }

            // 3. Get public URL for this file
            const { data: publicUrlData } = supabase
                .storage
                .from('news-covers')
                .getPublicUrl(file.name);

            const publicUrl = publicUrlData.publicUrl;

            // 4. Update the news record
            const { error: updateError } = await supabase
                .from('daily_news')
                .update({ image: publicUrl })
                .eq('id', newsId);

            if (updateError) {
                console.error(`❌ Failed to update ${newsId}:`, updateError.message);
                results.push({ id: newsId, status: 'error', error: updateError.message });
            } else {
                console.log(`✅ Linked image for news ${newsId}`);
                results.push({ id: newsId, status: 'success', url: publicUrl });
                linkedIds.add(newsId);
            }
        }

        console.log(`🎉 Re-linking complete! Linked ${linkedIds.size} images.`);

        return res.status(200).json({
            message: `Re-linked ${linkedIds.size} images`,
            results
        });

    } catch (error: any) {
        console.error('❌ Re-linking failed:', error);
        return res.status(500).json({ error: error.message });
    }
}
