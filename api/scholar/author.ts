import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
    maxDuration: 10,
};

const SEMANTIC_SCHOLAR_API_BASE = 'https://api.semanticscholar.org/graph/v1';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const { query, authorId } = req.query;

    if (!query && !authorId) {
        return res.status(400).json({ error: 'Missing query or authorId parameter' });
    }

    const API_KEY = process.env.SEMANTIC_SCHOLAR_API_KEY; // Optional for low rate limits
    const headers: HeadersInit = {};
    if (API_KEY) {
        headers['x-api-key'] = API_KEY;
    }

    try {
        let data;

        if (authorId) {
            // Sanitize ID: remove any non-numeric characters (or just split by :)
            const cleanId = (authorId as string).split(':')[0]; // Fix for IDs like "2188760105:1"

            // Get Author Details
            // removed aliases, papers.calendarDate
            const url = `${SEMANTIC_SCHOLAR_API_BASE}/author/${cleanId}?fields=name,affiliations,homepage,paperCount,citationCount,hIndex,papers.year,papers.title,papers.venue,papers.citationCount,papers.url`;
            const response = await fetch(url, { headers });

            if (!response.ok) {
                const errText = await response.text();
                console.error(`Semantic Scholar Error (${response.status}): ${errText}`);
                throw new Error(`Semantic Scholar API Error: ${response.status} ${errText}`);
            }

            data = await response.json();
        } else {
            // Search Author
            const url = `${SEMANTIC_SCHOLAR_API_BASE}/author/search?query=${encodeURIComponent(query as string)}&limit=5&fields=name,affiliations,hIndex,citationCount,paperCount`;
            const response = await fetch(url, { headers });
            if (!response.ok) throw new Error(`Semantic Scholar API Error: ${response.status}`);
            data = await response.json();
        }

        return res.status(200).json(data);

    } catch (error: any) {
        console.error('Semantic Scholar API Error:', error);
        return res.status(500).json({ error: error.message || 'Error fetching from Semantic Scholar' });
    }
}
