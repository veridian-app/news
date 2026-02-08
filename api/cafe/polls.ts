import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        if (req.method === 'GET') {
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
                return res.status(200).json({ polls: [], message: 'No polls available' });
            }

            // Get vote counts for each poll
            const pollsWithVotes = await Promise.all(
                polls.map(async (poll) => {
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

                    return {
                        ...poll,
                        voteCounts,
                        totalVotes
                    };
                })
            );

            return res.status(200).json({ polls: pollsWithVotes });

        } else if (req.method === 'POST') {
            // Register a vote
            const { pollId, optionId, fingerprint, userId } = req.body;

            if (!pollId || !optionId || (!fingerprint && !userId)) {
                return res.status(400).json({ error: 'Missing pollId, optionId, or identifier (fingerprint/userId)' });
            }

            // Check if user already voted (check both methods for backwards compatibility)
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
                return res.status(409).json({ error: 'Already voted', voted: true });
            }

            // Insert vote with both identifiers
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

            return res.status(200).json({
                success: true,
                voteCounts,
                totalVotes: allVotes?.length || 0
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error: any) {
        console.error('Polls API error:', error);
        return res.status(500).json({ error: error.message });
    }
}
