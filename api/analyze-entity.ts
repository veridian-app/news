import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

export const config = {
    maxDuration: 30,
};

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { entityName, language = 'en' } = req.body;

    if (!entityName) {
        return res.status(400).json({ error: 'Entity name is required' });
    }

    try {
        const prompt = `You are an expert investigative journalist and corporate analyst.
    Analyze the organization "${entityName}".
    
    Provide a structured profile in JSON format with the following fields:
    - description: A concise 2-sentence summary of what they do.
    - type: (e.g., Non-Profit, Corporation, Think Tank, Government Agency).
    - headquarters: City, Country.
    - keyPeople: Array of strings (CEO, Founders, etc.).
    - funding: Brief explanation of their funding model or major ownership (if public info).
    - stance: Their known political or ideological alignment (if any, otherwise "Neutral").
    - controversies: Array of strings (major criticisms or scandals, if any).
    
    Output strictly valid JSON. Language: ${language}.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a helpful assistant that outputs JSON." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
        });

        const result = JSON.parse(completion.choices[0].message.content || '{}');
        return res.status(200).json(result);

    } catch (error: any) {
        console.error('Error analyzing entity:', error);
        return res.status(500).json({ error: 'Failed to analyze entity' });
    }
}
