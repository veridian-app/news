/**
 * GobiernoGasto - Sección "¿En qué se ha gastado el gobierno tu dinero hoy?"
 * 
 * Muestra los gastos públicos extraídos del BOE en formato de dashboard
 * con estilo Café Veridian (cínico, irónico, pero veraz)
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink, TrendingUp, Building2, Banknote, ChevronDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface PublicExpense {
    id: string;
    date: string;
    beneficiario: string;
    importe: number;
    moneda: string;
    organismo: string;
    tipo: string;
    resumen: string;
    contexto?: string;
    url?: string;
    source: 'BOE' | 'BDNS' | 'PLACSP';
}

interface GobiernoGastoProps {
    className?: string;
}

// Formatea número a moneda española
const formatMoney = (amount: number): string => {
    if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1).replace('.0', '')}M€`;
    }
    if (amount >= 1000) {
        return `${(amount / 1000).toFixed(0)}K€`;
    }
    return `${amount.toFixed(0)}€`;
};

// Obtiene emoji según tipo de adjudicación
const getTypeEmoji = (tipo: string): string => {
    if (!tipo) return '💰';
    const t = tipo.toLowerCase();
    if (t.includes('dedo')) return '👉';
    if (t.includes('concurso') || t.includes('licitación')) return '🏆';
    if (t.includes('subvención') || t.includes('beca')) return '🎁';
    if (t.includes('contrato')) return '📄';
    return '💰';
};

// Obtiene color según tipo
const getTypeColor = (tipo: string): string => {
    if (!tipo) return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    const t = tipo.toLowerCase();
    if (t.includes('dedo')) return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (t.includes('concurso') || t.includes('licitación')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (t.includes('subvención') || t.includes('beca')) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    if (t.includes('contrato')) return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
};

export const GobiernoGasto = ({ className }: GobiernoGastoProps) => {
    const [expenses, setExpenses] = useState<PublicExpense[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [totalToday, setTotalToday] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const [highlights, setHighlights] = useState<{ day: PublicExpense | null, week: PublicExpense | null, month: PublicExpense | null }>({ day: null, week: null, month: null });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [boeRes, bdnsRes, placspRes] = await Promise.all([
                    fetch('/api/public-expenses?source=boe&limit=20'),
                    fetch('/api/public-expenses?source=bdns&limit=20').catch(() => null),
                    fetch('/api/public-expenses?source=placsp&limit=20').catch(() => null)
                ]);

                let allExpenses: PublicExpense[] = [];
                let totalAmount = 0;
                let dailyHighlight: PublicExpense | null = null;
                let weeklyHighlight: PublicExpense | null = null;
                let monthlyHighlight: PublicExpense | null = null;

                const processSource = async (res: Response | null, sourceName: string) => {
                    if (!res || !res.ok) return;
                    const data = await res.json();

                    // Add to main list
                    const items = (data.expenses || data.subvenciones || data.contratos || []).map((item: any) => ({
                        id: item.id,
                        date: item.boe_date || item.fecha_concesion || item.fecha_publicacion,
                        beneficiario: item.beneficiario || item.organo_contratacion,
                        importe: item.importe_total || item.importe,
                        moneda: item.moneda || 'EUR',
                        organismo: item.organismo_pagador || item.organo_contratacion,
                        tipo: item.tipo_adjudicacion || 'Contrato',
                        resumen: item.resumen_veridian || item.titulo,
                        contexto: item.contexto_detallado,
                        url: item.boe_url || item.link_licitacion,
                        source: sourceName
                    }));
                    allExpenses = [...allExpenses, ...items];

                    // Add to stats
                    if (data.stats?.gasto_total) totalAmount += data.stats.gasto_total;
                    if (data.stats?.importe_total) totalAmount += data.stats.importe_total;

                    // Check highlights
                    if (data.highlights) {
                        const mapHighlight = (h: any) => h ? ({
                            id: h.id,
                            date: h.boe_date || h.fecha_concesion || h.fecha_publicacion,
                            beneficiario: h.beneficiario || h.organo_contratacion,
                            importe: h.importe_total || h.importe,
                            moneda: h.moneda || 'EUR',
                            organismo: h.organismo_pagador || h.organo_contratacion,
                            tipo: h.tipo_adjudicacion || 'Contrato',
                            resumen: h.resumen_veridian || h.titulo,
                            url: h.boe_url || h.link_licitacion,
                            source: sourceName
                        }) : null;

                        const d = mapHighlight(data.highlights.day);
                        const w = mapHighlight(data.highlights.week);
                        const m = mapHighlight(data.highlights.month);

                        if (d && (!dailyHighlight || d.importe > dailyHighlight.importe)) dailyHighlight = d;
                        if (w && (!weeklyHighlight || w.importe > weeklyHighlight.importe)) weeklyHighlight = w;
                        if (m && (!monthlyHighlight || m.importe > monthlyHighlight.importe)) monthlyHighlight = m;
                    }
                };

                await processSource(boeRes, 'BOE');
                await processSource(bdnsRes, 'BDNS');
                await processSource(placspRes, 'PLACSP');

                // Sort by date desc (recent first)
                allExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                setExpenses(allExpenses);
                setTotalToday(totalAmount);
                setHighlights({ day: dailyHighlight, week: weeklyHighlight, month: monthlyHighlight });

            } catch (error) {
                console.error('Error fetching expenses:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const nextExpense = () => {
        setCurrentIndex((prev) => (prev + 1) % expenses.length);
        setIsExpanded(false);
    };

    const prevExpense = () => {
        setCurrentIndex((prev) => (prev - 1 + expenses.length) % expenses.length);
        setIsExpanded(false);
    };

    const currentExpense = expenses[currentIndex];

    return (
        <div className={cn("py-8", className)}>
            {/* Header Section */}
            <div className="mb-6 px-1">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🏛️</span>
                    <h2 className="text-lg font-bold text-white">
                        Tu dinero, su gasto
                    </h2>
                </div>
                <p className="text-zinc-400 text-sm">
                    ¿En qué se ha gastado el gobierno tu dinero hoy?
                </p>
                {/* Total del día */}
                {totalToday > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
                            <TrendingUp className="w-3 h-3 text-orange-400" />
                            <span className="text-orange-300 font-semibold text-xs">
                                {formatMoney(totalToday)} hoy
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Dashboard Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Column 1: Highlight of the Month */}
                <div className="space-y-4">
                    <h3 className="text-zinc-400 text-xs uppercase tracking-wider font-semibold px-1">Destacado del Mes</h3>
                    {highlights.month ? (
                        <div className="relative h-full">
                            <div className="bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden h-full flex flex-col">
                                <div className="bg-gradient-to-r from-purple-500/20 to-transparent px-5 py-4 border-b border-white/5">
                                    <div className="flex justify-between items-start">
                                        <span className={cn(
                                            "text-[10px] font-bold px-1.5 py-0.5 rounded border mb-2 inline-block",
                                            highlights.month.source === 'BOE' ? "bg-zinc-800 text-zinc-300 border-zinc-700" : "bg-blue-900/30 text-blue-300 border-blue-500/30"
                                        )}>{highlights.month.source}</span>
                                    </div>
                                    <span className="text-3xl font-bold text-white block truncate" title={formatMoney(highlights.month.importe)}>
                                        {formatMoney(highlights.month.importe)}
                                    </span>
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <p className="text-zinc-200 text-sm font-medium line-clamp-3 mb-4 flex-1">
                                        "{highlights.month.resumen}"
                                    </p>
                                    <div className="text-xs text-zinc-500 space-y-1">
                                        <p className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {highlights.month.beneficiario}</p>
                                        <p className="flex items-center gap-1"><Banknote className="w-3 h-3" /> {highlights.month.tipo}</p>
                                        <p className="text-[10px] mt-2 opacity-60">{new Date(highlights.month.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-48 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-500 text-xs">Sin datos del mes</div>
                    )}
                </div>

                {/* Column 2: Highlight of the Week */}
                <div className="space-y-4">
                    <h3 className="text-zinc-400 text-xs uppercase tracking-wider font-semibold px-1">Destacado de la Semana</h3>
                    {highlights.week ? (
                        <div className="relative h-full">
                            <div className="bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden h-full flex flex-col">
                                <div className="bg-gradient-to-r from-blue-500/20 to-transparent px-5 py-4 border-b border-white/5">
                                    <div className="flex justify-between items-start">
                                        <span className={cn(
                                            "text-[10px] font-bold px-1.5 py-0.5 rounded border mb-2 inline-block",
                                            highlights.week.source === 'BOE' ? "bg-zinc-800 text-zinc-300 border-zinc-700" : "bg-blue-900/30 text-blue-300 border-blue-500/30"
                                        )}>{highlights.week.source}</span>
                                    </div>
                                    <span className="text-3xl font-bold text-white block truncate" title={formatMoney(highlights.week.importe)}>
                                        {formatMoney(highlights.week.importe)}
                                    </span>
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <p className="text-zinc-200 text-sm font-medium line-clamp-3 mb-4 flex-1">
                                        "{highlights.week.resumen}"
                                    </p>
                                    <div className="text-xs text-zinc-500 space-y-1">
                                        <p className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {highlights.week.beneficiario}</p>
                                        <p className="flex items-center gap-1"><Banknote className="w-3 h-3" /> {highlights.week.tipo}</p>
                                        <p className="text-[10px] mt-2 opacity-60">{new Date(highlights.week.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-48 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-500 text-xs">Sin datos de la semana</div>
                    )}
                </div>

                {/* Column 3: Today's Feed (Browsable) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Gasto de Hoy {expenses.length > 0 && `(${expenses.length})`}</h3>
                        {expenses.length > 1 && (
                            <div className="flex items-center gap-1">
                                <button onClick={prevExpense} className="p-1 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft className="w-4 h-4 text-zinc-400" /></button>
                                <button onClick={nextExpense} className="p-1 hover:bg-white/10 rounded-full transition-colors"><ChevronRight className="w-4 h-4 text-zinc-400" /></button>
                            </div>
                        )}
                    </div>

                    {!isLoading && currentExpense && (
                        <div className="relative h-full">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentExpense.id}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="bg-zinc-900/80 backdrop-blur-sm border border-orange-500/20 rounded-2xl overflow-hidden h-full flex flex-col"
                                >
                                    <div className="bg-gradient-to-r from-orange-500/20 via-red-500/10 to-transparent px-5 py-4 border-b border-white/5">
                                        <div className="flex justify-between items-start">
                                            <span className={cn(
                                                "text-[10px] font-bold px-1.5 py-0.5 rounded border mb-2 inline-block",
                                                currentExpense.source === 'BOE' ? "bg-zinc-800 text-zinc-300 border-zinc-700" : "bg-blue-900/30 text-blue-300 border-blue-500/30"
                                            )}>{currentExpense.source}</span>
                                            <div className={cn("flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border", getTypeColor(currentExpense.tipo))}>
                                                {getTypeEmoji(currentExpense.tipo)} {currentExpense.tipo}
                                            </div>
                                        </div>
                                        <span className="text-3xl font-bold text-white block truncate">
                                            {formatMoney(currentExpense.importe)}
                                        </span>
                                    </div>

                                    <div className="p-5 flex-1 flex flex-col">
                                        <p className="text-white text-sm font-medium leading-relaxed mb-4 flex-1">
                                            "{currentExpense.resumen}"
                                        </p>

                                        <div className="space-y-2 mb-4">
                                            <div className="bg-white/5 rounded-lg p-2.5">
                                                <span className="text-[10px] text-zinc-500 block mb-0.5 uppercase tracking-wide">Beneficiario</span>
                                                <span className="text-zinc-200 text-xs font-medium block truncate">{currentExpense.beneficiario}</span>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-2.5">
                                                <span className="text-[10px] text-zinc-500 block mb-0.5 uppercase tracking-wide">Organismo</span>
                                                <span className="text-zinc-200 text-xs font-medium block truncate">{currentExpense.organismo}</span>
                                            </div>
                                        </div>

                                        {currentExpense.url ? (
                                            <a href={currentExpense.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 py-2 w-full bg-white/5 hover:bg-white/10 rounded-lg text-xs text-zinc-400 transition-colors">
                                                <ExternalLink className="w-3 h-3" /> Ver fuente oficial
                                            </a>
                                        ) : (
                                            <div className="flex items-center justify-center gap-1.5 py-2 w-full bg-white/5 rounded-lg text-xs text-zinc-500 cursor-default">
                                                <Info className="w-3 h-3" /> Fuente: {currentExpense.source}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Empty/Loading States for Today Column */}
                    {isLoading && <div className="h-64 bg-white/5 rounded-2xl flex items-center justify-center"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>}
                    {!isLoading && expenses.length === 0 && <div className="h-64 bg-white/5 rounded-2xl flex flex-col items-center justify-center text-zinc-500 text-xs p-4 text-center"><span>😴</span><p>Sin gastos registrados hoy</p></div>}
                </div>

            </div>
        </div>
    );
};
