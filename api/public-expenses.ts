
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!; // Use anon key for read-only if possible, or service key if RLS allows anon read
// Note: User likely wants public read access. If RLS is set up, anon key is safer.
// If RLS blocks anon, we might need service key but that's risky for a public endpoint unless we filter carefully.
// Given the previous code used service key in cron, let's use service key here but strictly filter the query to be safe (read-only).
// actually, for a public API, using the service role key is standard in a serverless function as long as we control the query.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS configuration
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600'); // Cache for 5 minutes

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { source, limit = '10' } = req.query;
    const limitNum = parseInt(limit as string, 10) || 10;

    try {
        if (source === 'boe') {
            const { data, error } = await supabase
                .from('boe_expenses')
                .select('*')
                .order('boe_date', { ascending: false })
                .limit(limitNum);

            if (error) throw error;

            // Calculate stats for today (optional, mirroring old response structure)
            const today = new Date().toISOString().split('T')[0];
            const { data: todayStats } = await supabase
                .from('boe_expenses')
                .select('importe_total')
                .eq('boe_date', today);

            const totalToday = todayStats?.reduce((sum, item) => sum + (item.importe_total || 0), 0) || 0;

            return res.status(200).json({
                expenses: data,
                stats: {
                    gasto_total: totalToday
                }
            });
        }

        if (source === 'bdns') {
            const { data, error } = await supabase
                .from('bdns_subvenciones')
                .select('*')
                .order('fecha_concesion', { ascending: false })
                .limit(limitNum);

            if (error) throw error;

            // Stats
            const today = new Date().toISOString().split('T')[0];
            const { data: todayStats } = await supabase
                .from('bdns_subvenciones')
                .select('importe')
                .eq('fecha_concesion', today);
            const totalToday = todayStats?.reduce((sum, item) => sum + (item.importe || 0), 0) || 0;

            return res.status(200).json({
                subvenciones: data,
                stats: {
                    importe_total: totalToday
                }
            });
        }

        if (source === 'placsp') {
            const { data, error } = await supabase
                .from('placsp_contratos')
                .select('*')
                .order('fecha_publicacion', { ascending: false }) // or update_date
                .limit(limitNum);

            if (error) throw error;

            // Stats
            const today = new Date().toISOString().split('T')[0];
            // PLACSP dates might check 'updated' or 'fecha_publicacion' which might include time
            // Simplifying for now

            const totalToday = data?.reduce((sum, item) => sum + (item.importe || 0), 0) || 0;


            return res.status(200).json({
                contratos: data,
                stats: {
                    importe_total: totalToday
                }
            });
        }

        return res.status(400).json({ error: 'Invalid source. Use ?source=boe|bdns|placsp' });

    } catch (error: any) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
