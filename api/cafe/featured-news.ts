import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // Get featured news for today's Café
        // Criteria: news with images, ordered by likes/comments or most recent
        const { data: featuredNews, error } = await supabase
            .from('daily_news')
            .select('id, title, summary, content, image, published_at, source, url')
            .not('image', 'is', null)
            .neq('image', '')
            .neq('image', 'GENERATION_FAILED')
            .order('published_at', { ascending: false })
            .limit(6);

        if (error) throw error;

        if (!featuredNews || featuredNews.length === 0) {
            return res.status(200).json({ news: [], message: 'No featured news available' });
        }

        // Transform to Café format
        const cafeNews = featuredNews.map((item, index) => {
            // First item is headline, others are standard or compact
            if (index === 0) {
                return {
                    id: item.id,
                    type: 'headline',
                    title: item.title,
                    subtitle: item.summary?.substring(0, 100) + '...',
                    category: 'Destacado',
                    readTime: '3 min',
                    content: item.content || item.summary,
                    imageUrl: item.image,
                    source: item.source
                };
            } else if (index < 4) {
                return {
                    id: item.id,
                    type: 'standard',
                    title: item.title,
                    category: 'Actualidad',
                    readTime: '2 min',
                    content: item.content || item.summary,
                    imageUrl: item.image
                };
            } else {
                return {
                    id: item.id,
                    type: 'compact-item',
                    title: item.title,
                    summary: item.summary?.substring(0, 80) + '...',
                    category: 'Breve',
                    time: 'Dato'
                };
            }
        });

        return res.status(200).json({ news: cafeNews });

    } catch (error: any) {
        console.error('Featured news API error:', error);
        return res.status(500).json({ error: error.message });
    }
}
