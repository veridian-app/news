/**
 * API para consultar gastos BOE
 * GET /api/boe/expenses - Lista gastos con filtros opcionales
 * 
 * Query params:
 * - date: Fecha específica (YYYY-MM-DD)
 * - limit: Número de resultados (default 50)
 * - min_amount: Importe mínimo
 * - tipo: Tipo de adjudicación (A dedo, Concurso, Subvención)
 */

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
        const { date, limit = '50', min_amount, tipo } = req.query;

        let query = supabase
            .from('boe_expenses')
            .select('*')
            .order('importe_total', { ascending: false });

        // Filtro por fecha
        if (date && typeof date === 'string') {
            query = query.eq('boe_date', date);
        }

        // Filtro por importe mínimo
        if (min_amount && typeof min_amount === 'string') {
            const minNum = parseFloat(min_amount);
            if (!isNaN(minNum)) {
                query = query.gte('importe_total', minNum);
            }
        }

        // Filtro por tipo
        if (tipo && typeof tipo === 'string') {
            query = query.eq('tipo_adjudicacion', tipo);
        }

        // Límite
        const limitNum = Math.min(parseInt(limit as string) || 50, 100);
        query = query.limit(limitNum);

        const { data, error } = await query;

        if (error) throw error;

        // Calcular estadísticas
        const stats = {
            total_registros: data?.length || 0,
            gasto_total: data?.reduce((sum, item) => sum + (item.importe_total || 0), 0) || 0,
            gasto_promedio: 0,
            gasto_maximo: 0
        };

        if (data && data.length > 0) {
            stats.gasto_promedio = stats.gasto_total / data.length;
            stats.gasto_maximo = Math.max(...data.map(d => d.importe_total || 0));
        }

        return res.status(200).json({
            expenses: data || [],
            stats,
            filters_applied: {
                date: date || 'all',
                min_amount: min_amount || 'none',
                tipo: tipo || 'all',
                limit: limitNum
            }
        });

    } catch (error: any) {
        console.error('❌ Error BOE API:', error);
        return res.status(500).json({ error: error.message });
    }
}
