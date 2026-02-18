import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ─── Featured News Logic ──────────────────────────────────────────

async function getFeaturedNews(supabase: any) {
    const today = new Date().toISOString().split('T')[0];

    // First, try to get curated news for today (only with valid images)
    let { data: featuredNews, error } = await supabase
        .from('daily_news')
        .select('id, title, summary, content, image, published_at, source, url, cafe_featured_date')
        .eq('cafe_featured_date', today)
        .not('image', 'is', null)
        .neq('image', '')
        .neq('image', 'GENERATION_FAILED')
        .order('published_at', { ascending: false });

    // If no curated news, fall back to recent news with images
    if (!featuredNews || featuredNews.length === 0) {
        console.log('No curated news for today, falling back to recent');
        const result = await supabase
            .from('daily_news')
            .select('id, title, summary, content, image, published_at, source, url, cafe_featured_date')
            .not('image', 'is', null)
            .neq('image', '')
            .neq('image', 'GENERATION_FAILED')
            .order('published_at', { ascending: false })
            .limit(6);

        featuredNews = result.data;
        error = result.error;
    }

    if (error) throw error;

    if (!featuredNews || featuredNews.length === 0) {
        return { news: [], message: 'No featured news available' };
    }

    // Transform to Café format
    const cafeNews = featuredNews.map((item: any, index: number) => {
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
                type: 'standard',
                title: item.title,
                summary: item.summary?.substring(0, 80) + '...',
                category: 'Breve',
                readTime: '1 min',
                content: item.content || item.summary || 'Noticia breve sin contenido adicional.',
                imageUrl: item.image
            };
        }
    });

    return {
        news: cafeNews,
        curated: featuredNews.some((n: any) => n.cafe_featured_date === today)
    };
}

// ─── Polls Logic ──────────────────────────────────────────

async function getPolls(supabase: any) {
    // Get today's polls with vote counts
    const today = new Date().toISOString().split('T')[0];

    let { data: polls, error: pollsError } = await supabase
        .from('daily_polls')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: false });

    if (pollsError) throw pollsError;

    // Si no hay polls de hoy, obtener los más recientes
    if (!polls || polls.length === 0) {
        const { data: recentPolls, error: recentError } = await supabase
            .from('daily_polls')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(2);

        if (recentError) throw recentError;
        polls = recentPolls;
    }

    if (!polls || polls.length === 0) {
        return { polls: [], message: 'No polls available' };
    }

    // Get vote counts for each poll
    const pollsWithVotes = await Promise.all(
        polls.map(async (poll: any) => {
            const { data: votes, error: votesError } = await supabase
                .from('poll_votes')
                .select('option_id')
                .eq('poll_id', poll.id);

            if (votesError) {
                console.error('Error fetching votes:', votesError);
                return { ...poll, voteCounts: {}, totalVotes: 0 };
            }

            // Count votes per option
            const voteCounts: Record<string, number> = {};
            (votes || []).forEach((vote: any) => {
                voteCounts[vote.option_id] = (voteCounts[vote.option_id] || 0) + 1;
            });

            const totalVotes = votes?.length || 0;

            return { ...poll, voteCounts, totalVotes };
        })
    );

    return { polls: pollsWithVotes };
}

async function votePoll(supabase: any, body: any) {
    const { pollId, optionId, fingerprint, userId } = body;

    if (!pollId || !optionId || (!fingerprint && !userId)) {
        throw new Error('Missing pollId, optionId, or identifier (fingerprint/userId)');
    }

    // Check if user already voted
    let existingVote = null;

    if (userId) {
        const { data } = await supabase
            .from('poll_votes')
            .select('id')
            .eq('poll_id', pollId)
            .eq('auth_user_id', userId)
            .single();
        existingVote = data;
    }

    if (!existingVote && fingerprint) {
        const { data } = await supabase
            .from('poll_votes')
            .select('id')
            .eq('poll_id', pollId)
            .eq('user_fingerprint', fingerprint)
            .single();
        existingVote = data;
    }

    if (existingVote) {
        return { error: 'Already voted', voted: true, status: 409 };
    }

    // Insert vote
    const { error: voteError } = await supabase
        .from('poll_votes')
        .insert({
            poll_id: pollId,
            option_id: optionId,
            user_fingerprint: fingerprint || null,
            auth_user_id: userId || null
        });

    if (voteError) throw voteError;

    // Get updated vote counts
    const { data: allVotes } = await supabase
        .from('poll_votes')
        .select('option_id')
        .eq('poll_id', pollId);

    const voteCounts: Record<string, number> = {};
    (allVotes || []).forEach((vote: any) => {
        voteCounts[vote.option_id] = (voteCounts[vote.option_id] || 0) + 1;
    });

    return {
        success: true,
        voteCounts,
        totalVotes: allVotes?.length || 0
    };
}

// ─── Main Handler ─────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { type } = req.query; // For GET requests
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        if (req.method === 'GET') {
            switch (type) {
                case 'featured':
                    const news = await getFeaturedNews(supabase);
                    return res.status(200).json(news);
                case 'polls':
                    const polls = await getPolls(supabase);
                    return res.status(200).json(polls);
                default:
                    return res.status(400).json({ error: 'Invalid or missing type parameter' });
            }
        } else if (req.method === 'POST') {
            // Check body for type if not in query, but voting is a distinct action
            // Simplest is to check if type=vote in query or body, or infer from body
            const bodyType = req.body.type || req.query.type;

            if (bodyType === 'vote') {
                const result = await votePoll(supabase, req.body);
                if (result.status === 409) return res.status(409).json(result);
                return res.status(200).json(result);
            }

            return res.status(400).json({ error: 'Invalid POST action' });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error: any) {
        console.error('API Error:', error);
        // Clean error message to avoid leaking internals
        const message = error.message === 'Missing pollId, optionId, or identifier (fingerprint/userId)'
            ? error.message
            : 'Internal server error';
        return res.status(500).json({ error: message });
    }
}
