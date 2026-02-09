
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!;
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

    const { source, limit = '20' } = req.query; // Increased query limit to ensure we get enough recent items
    const limitNum = parseInt(limit as string, 10) || 20;

    // Dates calculation
    const now = new Date();

    // Last 3 days for main feed
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(now.getDate() - 3);
    const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

    // Today
    const todayStr = now.toISOString().split('T')[0];

    // Week (last 7 days)
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    // Month (last 30 days)
    const monthAgo = new Date(now);
    monthAgo.setDate(now.getDate() - 30);
    const monthAgoStr = monthAgo.toISOString().split('T')[0];

    try {
        let tableName = '';
        let dateCol = '';
        let amountCol = 'importe_total'; // default for boe
        let selectCols = '*';

        if (source === 'boe') {
            tableName = 'boe_expenses';
            dateCol = 'boe_date';
            amountCol = 'importe_total';
        } else if (source === 'bdns') {
            tableName = 'bdns_subvenciones';
            dateCol = 'fecha_concesion';
            amountCol = 'importe';
        } else if (source === 'placsp') {
            tableName = 'placsp_contratos';
            dateCol = 'fecha_publicacion'; // Note: this might be timestamp in DB, comparison works if ISO string
            amountCol = 'importe';
        } else {
            return res.status(400).json({ error: 'Invalid source. Use ?source=boe|bdns|placsp' });
        }

        // 1. Fetch Main Expenses (Last 3 days)
        const { data: expenses, error: mainError } = await supabase
            .from(tableName)
            .select(selectCols)
            .gte(dateCol, threeDaysAgoStr) // Last 3 days
            .order(amountCol, { ascending: false }) // Show highest amounts first even in feed? or date? User said "actual y relevante"
            .limit(limitNum);

        if (mainError) throw mainError;

        // 2. Fetch Highlights (Day, Week, Month)
        // We need separate queries for "max amount" in each range

        const fetchHighlight = async (sinceDate: string) => {
            const { data } = await supabase
                .from(tableName)
                .select(selectCols)
                .gte(dateCol, sinceDate)
                .order(amountCol, { ascending: false })
                .limit(1)
                .maybeSingle();
            return data;
        };

        const [dayHighlight, weekHighlight, monthHighlight] = await Promise.all([
            fetchHighlight(todayStr),
            fetchHighlight(weekAgoStr),
            fetchHighlight(monthAgoStr)
        ]);

        // Calculate stats for today (total amount)
        const { data: todayStats } = await supabase
            .from(tableName)
            .select(amountCol)
            .gte(dateCol, todayStr);

        const totalToday = todayStats?.reduce((sum, item) => sum + (item[amountCol] || 0), 0) || 0;

        // Construct response
        const response: any = {
            expenses: expenses || [],
            stats: {
                gasto_total: totalToday
            },
            highlights: {
                day: dayHighlight,
                week: weekHighlight,
                month: monthHighlight
            }
        };

        // Legacy mapping for frontend compatibility if needed (frontend uses .subvenciones / .contratos keys?)
        // The frontend currently accesses `res.subvenciones` or `res.expenses` or `res.contratos` based on logic or assumes generic?
        // Let's check GobiernoGasto.tsx logic. 
        // It maps `(data.expenses || [])`, `(data.subvenciones || [])`, `(data.contratos || [])`.
        // So we should return the correct key.

        if (source === 'boe') response.expenses = expenses || [];
        else if (source === 'bdns') {
            response.subvenciones = expenses || [];
            delete response.expenses;
        }
        else if (source === 'placsp') {
            response.contratos = expenses || [];
            delete response.expenses;
        }

        return res.status(200).json(response);

    } catch (error: any) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
