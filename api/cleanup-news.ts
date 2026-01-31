import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

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
        console.log('🗑️ Deleting news without images...');

        // First, count how many will be deleted
        const { count: countBefore } = await supabase
            .from('daily_news')
            .select('*', { count: 'exact', head: true })
            .or('image.is.null,image.eq.,image.eq.GENERATION_FAILED');

        console.log(`📊 Found ${countBefore} news items without valid images`);

        // Delete news without images
        const { error: deleteError } = await supabase
            .from('daily_news')
            .delete()
            .or('image.is.null,image.eq.,image.eq.GENERATION_FAILED');

        if (deleteError) throw deleteError;

        // Count remaining
        const { count: countAfter } = await supabase
            .from('daily_news')
            .select('*', { count: 'exact', head: true });

        console.log(`✅ Deleted ${countBefore} news. Remaining: ${countAfter}`);

        return res.status(200).json({
            message: `Deleted ${countBefore} news items without images`,
            remaining: countAfter
        });

    } catch (error: any) {
        console.error('❌ Cleanup failed:', error);
        return res.status(500).json({ error: error.message });
    }
}
