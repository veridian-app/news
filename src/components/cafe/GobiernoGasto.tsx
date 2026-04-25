import { useState, useEffect } from "react";
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

const formatMoney = (amount: number | undefined | null): string => {
    if (amount == null) return "0€";
    if (amount >= 1000000) {
        const millions = amount / 1000000;
        return millions.toFixed(1).replace(".0", "") + "M€";
    }
    if (amount >= 1000) {
        const thousands = amount / 1000;
        return thousands.toFixed(0) + "K€";
    }
    return amount.toFixed(0) + "€";
};

const getTypeEmoji = (tipo: string): string => {
    if (!tipo) return "💰";
    const t = tipo.toLowerCase();
    if (t.includes("dedo")) return "👉";
    if (t.includes("concurso") || t.includes("licitación")) return "🏆";
    if (t.includes("subvención") || t.includes("beca")) return "🎁";
    if (t.includes("contrato")) return "📄";
    return "💰";
};

const getTypeColor = (tipo: string): string => {
    if (!tipo) return "text-orange-400 bg-orange-950 border-orange-900";
    const t = tipo.toLowerCase();
    if (t.includes("dedo")) return "text-red-400 bg-red-950 border-red-900";
    if (t.includes("concurso") || t.includes("licitación")) return "text-emerald-400 bg-emerald-950 border-emerald-900";
    if (t.includes("subvención") || t.includes("beca")) return "text-blue-400 bg-blue-950 border-blue-900";
    if (t.includes("contrato")) return "text-purple-400 bg-purple-950 border-purple-900";
    return "text-orange-400 bg-orange-950 border-orange-900";
};

export const GobiernoGasto = ({ className }: { className?: string }) => {
    const [expenses, setExpenses] = useState<PublicExpense[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [totalToday, setTotalToday] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const results = await Promise.all([
                    fetch("/api/public-expenses?source=boe&limit=10").then(r => r.ok ? r.json() : null),
                    fetch("/api/public-expenses?source=bdns&limit=10").then(r => r.ok ? r.json() : null).catch(() => null),
                    fetch("/api/public-expenses?source=placsp&limit=10").then(r => r.ok ? r.json() : null).catch(() => null)
                ]);

                let all: PublicExpense[] = [];
                let total = 0;

                if (results[0]) {
                    const data = results[0];
                    const items = (data.expenses || []).map((item: any) => ({
                        id: item.id,
                        date: item.boe_date,
                        beneficiario: item.beneficiario,
                        importe: item.importe_total,
                        moneda: item.moneda,
                        organismo: item.organismo_pagador,
                        tipo: item.tipo_adjudicacion,
                        resumen: item.resumen_veridian,
                        contexto: item.contexto_detallado,
                        url: item.boe_url,
                        source: "BOE"
                    }));
                    all = [...all, ...items];
                    total += data.stats?.gasto_total || 0;
                }

                if (results[1]) {
                    const data = results[1];
                    const items = (data.subvenciones || []).map((item: any) => ({
                        id: item.id,
                        date: item.fecha_concesion,
                        beneficiario: item.beneficiario,
                        importe: item.importe,
                        moneda: "EUR",
                        organismo: item.administracion + (item.departamento ? " - " + item.departamento : ""),
                        tipo: "Subvención",
                        resumen: item.resumen_veridian,
                        contexto: item.contexto_detallado,
                        url: null,
                        source: "BDNS"
                    }));
                    all = [...all, ...items];
                    total += data.stats?.importe_total || 0;
                }

                if (results[2]) {
                    const data = results[2];
                    const items = (data.contratos || []).map((item: any) => ({
                        id: item.id,
                        date: item.fecha_publicacion,
                        beneficiario: "Licitación Pública",
                        importe: item.importe,
                        moneda: "EUR",
                        organismo: item.organo_contratacion,
                        tipo: "Licitación",
                        resumen: item.resumen_veridian,
                        contexto: item.contexto_detallado,
                        url: item.link_licitacion,
                        source: "PLACSP"
                    }));
                    all = [...all, ...items];
                    total += data.stats?.importe_total || 0;
                }

                all.sort((a, b) => b.importe - a.importe);
                setExpenses(all);
                setTotalToday(total);
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const next = () => { setCurrentIndex(prev => (prev + 1) % expenses.length); setIsExpanded(false); };
    const prev = () => { setCurrentIndex(prev => (prev - 1 + expenses.length) % expenses.length); setIsExpanded(false); };

    const current = expenses[currentIndex];

    if (isLoading) return <div className="h-48 flex items-center justify-center text-zinc-500">Cargando datos...</div>;
    if (expenses.length === 0) return <div className="p-8 text-center text-zinc-500">No hay datos hoy</div>;

    return (
        <div className={cn("py-8", className)}>
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🏛️</span>
                    <h2 className="text-lg font-bold text-white">Tu dinero, su gasto</h2>
                </div>
                {totalToday > 0 && (
                    <div className="flex items-center gap-2 bg-orange-500/10 p-2 rounded-full w-fit">
                        <TrendingUp className="w-4 h-4 text-orange-400" />
                        <span className="text-orange-300 font-bold text-sm">{formatMoney(totalToday)} hoy</span>
                    </div>
                )}
            </div>

            {current && (
                <div className="bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-8 border-b border-white/5 bg-gradient-to-br from-orange-500/5 to-transparent">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-[10px] font-black bg-white/5 px-2 py-1 rounded text-white/50 uppercase tracking-widest border border-white/10">
                                    {current.source} | INTEL
                                </span>
                                <div className="mt-4 flex items-baseline gap-2">
                                    <span className="text-6xl font-black text-white">{formatMoney(current.importe)}</span>
                                    <span className="text-xl font-mono text-white/20">{current.moneda}</span>
                                </div>
                            </div>
                            <div className={cn("px-4 py-2 rounded-xl border text-[10px] font-black uppercase", getTypeColor(current.tipo))}>
                                {getTypeEmoji(current.tipo)} {current.tipo}
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        <p className="text-white text-xl font-bold leading-tight">"{current.resumen}"</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase text-zinc-500 font-bold">Beneficiario</span>
                                <p className="text-white font-medium text-sm">{current.beneficiario}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase text-zinc-500 font-bold">Organismo</span>
                                <p className="text-white font-medium text-sm">{current.organismo}</p>
                            </div>
                        </div>

                        {current.url && (
                            <a href={current.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-orange-400 text-xs font-bold hover:underline">
                                Ver en BOE oficial <ExternalLink className="w-3 h-3" />
                            </a>
                        )}

                        {current.contexto && (
                            <div className="pt-4 border-t border-white/5">
                                <button onClick={() => setIsExpanded(!isExpanded)} className="text-zinc-500 text-xs font-bold flex items-center gap-2">
                                    {isExpanded ? "Ocultar" : "¿Por qué es relevante?"} <ChevronDown className={cn("w-3 h-3", isExpanded && "rotate-180")} />
                                </button>
                                {isExpanded && <p className="mt-2 text-zinc-400 text-sm leading-relaxed">{current.contexto}</p>}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center p-4 bg-white/5 border-t border-white/5">
                        <button onClick={prev} className="p-2 hover:bg-white/5 rounded-full"><ChevronLeft className="text-white" /></button>
                        <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Partida {currentIndex + 1} de {expenses.length}</div>
                        <button onClick={next} className="p-2 hover:bg-white/5 rounded-full"><ChevronRight className="text-white" /></button>
                    </div>
                </div>
            )}
        </div>
    );
};
