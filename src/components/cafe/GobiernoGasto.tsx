/**
 * GobiernoGasto - Sección "¿En qué se ha gastado el gobierno tu dinero hoy?"
 * 
 * Muestra los gastos públicos extraídos del BOE, BDNS y PLACSP.
 * Diseño refinado: Mantiene la estructura de 3 columnas pero recupera
 * el estilo visual de tarjeta "limpia" para el feed de hoy.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink, TrendingUp, Building2, Banknote, Info } from "lucide-react";
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

const formatMoney = (amount: number | undefined | null): string => {
    if (amount == null) return '0€';
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1).replace('.0', '')}M€`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K€`;
    return `${amount.toFixed(0)}€`;
};

const getTypeColor = (tipo: string): string => {
    if (!tipo) return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    const t = tipo.toLowerCase();
    if (t.includes('dedo')) return 'text-red-400 bg-red-400/10 border-red-400/20';
    if (t.includes('licitación') || t.includes('concurso')) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (t.includes('subvención') || t.includes('beca')) return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
};

export const GobiernoGasto = ({ className }: GobiernoGastoProps) => {
    const [expenses, setExpenses] = useState<PublicExpense[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [totalToday, setTotalToday] = useState(0);
    const [highlights, setHighlights] = useState<{ day: PublicExpense | null, week: PublicExpense | null, month: PublicExpense | null }>({ day: null, week: null, month: null });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [boeRes, bdnsRes, placspRes] = await Promise.all([
                    fetch('/api/public-expenses?source=boe&limit=30'),
                    fetch('/api/public-expenses?source=bdns&limit=30').catch(() => null),
                    fetch('/api/public-expenses?source=placsp&limit=30').catch(() => null)
                ]);

                let allExpenses: PublicExpense[] = [];
                let totalAmount = 0;
                let dailyHighlight: PublicExpense | null = null;
                let weeklyHighlight: PublicExpense | null = null;
                let monthlyHighlight: PublicExpense | null = null;

                const processSource = async (res: Response | null, sourceName: string) => {
                    if (!res || !res.ok) return;
                    const data = await res.json();

                    const items = (data.expenses || data.subvenciones || data.contratos || []).map((item: any) => ({
                        id: item.id,
                        date: item.boe_date || item.fecha_concesion || item.fecha_publicacion,
                        beneficiario: item.beneficiario || item.organo_contratacion,
                        importe: item.importe_total || item.importe || 0,
                        moneda: item.moneda || 'EUR',
                        organismo: item.organismo_pagador || item.organo_contratacion,
                        tipo: item.tipo_adjudicacion || 'Contrato',
                        resumen: item.resumen_veridian || item.titulo,
                        url: item.boe_url || item.link_licitacion,
                        source: sourceName
                    }));
                    allExpenses = [...allExpenses, ...items];

                    if (data.stats?.gasto_total) totalAmount += data.stats.gasto_total;
                    if (data.stats?.importe_total) totalAmount += data.stats.importe_total;

                    // Highlights mapping
                    if (data.highlights) {
                        const mapHighlight = (h: any) => h ? ({
                            id: h.id,
                            date: h.boe_date || h.fecha_concesion || h.fecha_publicacion,
                            beneficiario: h.beneficiario || h.organo_contratacion,
                            importe: h.importe_total || h.importe || 0,
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

    const nextExpense = () => setCurrentIndex((prev) => (prev + 1) % expenses.length);
    const prevExpense = () => setCurrentIndex((prev) => (prev - 1 + expenses.length) % expenses.length);
    const currentExpense = expenses[currentIndex];

    // Card Component for Highlights
    const HighlightCard = ({ title, data }: { title: string, data: PublicExpense | null }) => (
        <div className="space-y-3 h-full flex flex-col">
            <h3 className="text-zinc-400 text-xs uppercase tracking-wider font-semibold px-1">{title}</h3>
            {data ? (
                <div className="bg-zinc-900 border border-white/10 rounded-xl p-5 flex flex-col gap-4 shadow-sm flex-1 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        {data.source === 'BOE' ? <span className="text-4xl">🏛️</span> : <span className="text-4xl">💶</span>}
                    </div>
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider",
                                data.source === 'BOE' ? "bg-zinc-800 text-zinc-300 border-zinc-700" : "bg-blue-900/30 text-blue-300 border-blue-500/30"
                            )}>{data.source}</span>
                        </div>
                        <span className="text-3xl font-bold text-white tracking-tight">{formatMoney(data.importe)}</span>
                        <p className="text-zinc-400 text-xs mt-1 font-medium">{data.tipo}</p>
                    </div>
                    <p className="text-zinc-200 text-sm font-medium leading-snug line-clamp-3">
                        {data.resumen}
                    </p>
                    <div className="mt-auto pt-3 border-t border-white/5 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <Building2 className="w-3.5 h-3.5" /> <span className="truncate">{data.beneficiario}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <Banknote className="w-3.5 h-3.5" /> <span className="truncate">{data.organismo}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white/5 rounded-xl border border-white/5 flex items-center justify-center p-8 flex-1">
                    <span className="text-zinc-500 text-xs">Sin datos destacados</span>
                </div>
            )}
        </div>
    );

    return (
        <div className={cn("py-8", className)}>
            <div className="mb-8 px-1">
                <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-2xl">💸</span>
                    <h2 className="text-xl font-bold text-white tracking-tight">Tu dinero, su gasto</h2>
                </div>
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                    <p>Monitor de gasto público en tiempo real</p>
                    {totalToday > 0 && (
                        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded-full">
                            <TrendingUp className="w-3 h-3 text-orange-400" />
                            <span className="text-orange-300 font-semibold text-xs">{formatMoney(totalToday)} hoy</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <HighlightCard title="Destacado Mes" data={highlights.month} />
                <HighlightCard title="Destacado Semana" data={highlights.week} />

                {/* Column 3: Today Feed */}
                <div className="space-y-3 h-full flex flex-col">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Gasto de Hoy {expenses.length > 0 && `(${expenses.length})`}</h3>
                    </div>

                    {!isLoading && currentExpense ? (
                        <div className="bg-zinc-900 border border-orange-500/30 rounded-xl p-5 shadow-lg flex-1 flex flex-col relative overflow-hidden group h-full">
                            {/* Top Gradient Line */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-transparent opacity-50" />

                            <div className="mb-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex gap-2">
                                        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider",
                                            currentExpense.source === 'BOE' ? "bg-zinc-800 text-zinc-300 border-zinc-700" : "bg-blue-900/30 text-blue-300 border-blue-500/30"
                                        )}>{currentExpense.source}</span>
                                        <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded border", getTypeColor(currentExpense.tipo))}>
                                            {currentExpense.tipo}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-4xl font-black text-white tracking-tighter">
                                        {formatMoney(currentExpense.importe)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1">
                                <p className="text-base text-zinc-100 font-medium leading-relaxed mb-6">
                                    "{currentExpense.resumen}"
                                </p>

                                <div className="space-y-3 p-3 bg-white/5 rounded-lg border border-white/5">
                                    <div>
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-wide block mb-0.5">Beneficiario</span>
                                        <p className="text-sm text-zinc-300 truncate font-medium">{currentExpense.beneficiario}</p>
                                    </div>
                                    <div className="pt-2 border-t border-white/5">
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-wide block mb-0.5">Organismo</span>
                                        <p className="text-sm text-zinc-300 truncate font-medium">{currentExpense.organismo}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Controls */}
                            <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                                {currentExpense.url ? (
                                    <a href={currentExpense.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors">
                                        <ExternalLink className="w-3 h-3" /> Fuente oficial
                                    </a>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                                        <Info className="w-3 h-3" /> Fuente: {currentExpense.source}
                                    </span>
                                )}

                                {expenses.length > 1 && (
                                    <div className="flex items-center gap-2 bg-black/20 rounded-full p-1 border border-white/5">
                                        <button
                                            onClick={prevExpense}
                                            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all active:scale-95"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <span className="text-[10px] text-zinc-500 font-mono w-8 text-center">
                                            {currentIndex + 1}/{expenses.length}
                                        </span>
                                        <button
                                            onClick={nextExpense}
                                            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all active:scale-95"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-zinc-900 border border-white/10 rounded-xl p-8 flex items-center justify-center h-full text-zinc-500 text-sm">
                            {isLoading ? "Cargando..." : "Sin datos hoy"}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
