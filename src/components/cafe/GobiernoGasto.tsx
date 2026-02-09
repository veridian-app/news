/**
 * GobiernoGasto - Sección "¿En qué se ha gastado el gobierno tu dinero hoy?"
 * 
 * Muestra los gastos públicos extraídos del BOE en formato de carrusel
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [boeRes, bdnsRes, placspRes] = await Promise.all([
                    fetch('/api/public-expenses?source=boe&limit=10'),
                    fetch('/api/public-expenses?source=bdns&limit=10').catch(() => null),
                    fetch('/api/public-expenses?source=placsp&limit=10').catch(() => null)
                ]);

                let allExpenses: PublicExpense[] = [];
                let total = 0;

                // Procesar BOE
                if (boeRes.ok) {
                    const data = await boeRes.json();
                    const boeItems = (data.expenses || []).map((item: any) => ({
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
                        source: 'BOE' as const
                    }));
                    allExpenses = [...allExpenses, ...boeItems];
                    total += data.stats?.gasto_total || 0;
                }

                // Procesar BDNS
                if (bdnsRes && bdnsRes.ok) {
                    const data = await bdnsRes.json();
                    const bdnsItems = (data.subvenciones || []).map((item: any) => ({
                        id: item.id,
                        date: item.fecha_concesion,
                        beneficiario: item.beneficiario,
                        importe: item.importe,
                        moneda: 'EUR',
                        organismo: item.administracion + (item.departamento ? ` - ${item.departamento}` : ''),
                        tipo: 'Subvención',
                        resumen: item.resumen_veridian,
                        contexto: item.contexto_detallado,
                        url: null,
                        source: 'BDNS' as const
                    }));
                    allExpenses = [...allExpenses, ...bdnsItems];
                    total += data.stats?.importe_total || 0;
                }

                // Procesar PLACSP
                if (placspRes && placspRes.ok) {
                    const data = await placspRes.json();
                    const placspItems = (data.contratos || []).map((item: any) => ({
                        id: item.id,
                        date: item.fecha_publicacion,
                        beneficiario: 'Licitación Pública', // En fase de anuncio no siempre hay beneficiario
                        importe: item.importe,
                        moneda: 'EUR',
                        organismo: item.organo_contratacion,
                        tipo: 'Licitación',
                        resumen: item.resumen_veridian,
                        contexto: item.contexto_detallado,
                        url: item.link_licitacion,
                        source: 'PLACSP' as const
                    }));
                    allExpenses = [...allExpenses, ...placspItems];
                    total += data.stats?.importe_total || 0;
                }

                // Ordenar por importe descendente
                allExpenses.sort((a, b) => b.importe - a.importe);

                setExpenses(allExpenses);
                setTotalToday(total);
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
                    <div className="mt-3 flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full">
                            <TrendingUp className="w-4 h-4 text-orange-400" />
                            <span className="text-orange-300 font-semibold text-sm">
                                {formatMoney(totalToday)} hoy
                            </span>
                        </div>
                        <span className="text-zinc-500 text-xs">
                            en {expenses.length} partidas
                        </span>
                    </div>
                )}
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="h-48 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-zinc-500 text-sm">Cargando gastos del BOE...</span>
                    </div>
                </div>
            )}

            {/* Empty State - No hay datos aún */}
            {!isLoading && expenses.length === 0 && (
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 text-center">
                    <span className="text-4xl block mb-3">📋</span>
                    <p className="text-zinc-400 text-sm mb-2">
                        Aún no hay datos del BOE de hoy
                    </p>
                    <p className="text-zinc-600 text-xs">
                        El análisis se actualiza cada día laborable a las 10:00h
                    </p>
                </div>
            )}

            {/* Expense Card */}
            {!isLoading && currentExpense && (
                <div className="relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentExpense.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden"
                        >
                            {/* Importe destacado */}
                            <div className="bg-gradient-to-r from-orange-500/20 via-red-500/10 to-transparent px-5 py-4 border-b border-white/5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={cn(
                                                "text-[10px] font-bold px-1.5 py-0.5 rounded border",
                                                currentExpense.source === 'BOE'
                                                    ? "bg-zinc-800 text-zinc-300 border-zinc-700"
                                                    : "bg-blue-900/30 text-blue-300 border-blue-500/30"
                                            )}>
                                                {currentExpense.source}
                                            </span>
                                        </div>
                                        <span className="text-4xl font-bold text-white">
                                            {formatMoney(currentExpense.importe)}
                                        </span>
                                        <span className="ml-2 text-zinc-400 text-sm">{currentExpense.moneda}</span>
                                    </div>
                                    <div className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium",
                                        getTypeColor(currentExpense.tipo)
                                    )}>
                                        <span>{getTypeEmoji(currentExpense.tipo)}</span>
                                        <span>{currentExpense.tipo}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Contenido */}
                            <div className="p-5 space-y-4">
                                {/* Resumen Veridian - La frase irónica */}
                                <p className="text-white text-lg font-medium leading-relaxed">
                                    "{currentExpense.resumen}"
                                </p>

                                {/* Detalles */}
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <Banknote className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <span className="text-zinc-500 text-xs block">Beneficiario</span>
                                            <span className="text-zinc-200 text-sm">{currentExpense.beneficiario}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <Building2 className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <span className="text-zinc-500 text-xs block">Organismo pagador</span>
                                            <span className="text-zinc-200 text-sm">{currentExpense.organismo}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Link BOE / Fuente */}
                                {currentExpense.url ? (
                                    <a
                                        href={currentExpense.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-orange-400 transition-colors"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        <span>Ver en BOE oficial</span>
                                    </a>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                        <Info className="w-3.5 h-3.5" />
                                        <span>Fuente: {currentExpense.source === 'BDNS' ? 'Base de Datos Nacional de Subvenciones' : currentExpense.source === 'PLACSP' ? 'Plataforma de Contratación' : 'Boletín Oficial del Estado'}</span>
                                    </div>
                                )}

                                {/* Botón Expandir - Solo si hay contexto detallado */}
                                {currentExpense.contexto && (
                                    <button
                                        onClick={() => setIsExpanded(!isExpanded)}
                                        className="flex items-center gap-2 w-full py-3 px-4 mt-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5"
                                    >
                                        <Info className="w-4 h-4 text-blue-400" />
                                        <span className="text-zinc-300 text-sm font-medium flex-1 text-left">
                                            {isExpanded ? 'Ocultar explicación' : '¿Por qué es relevante?'}
                                        </span>
                                        <ChevronDown
                                            className={cn(
                                                "w-4 h-4 text-zinc-500 transition-transform duration-200",
                                                isExpanded && "rotate-180"
                                            )}
                                        />
                                    </button>
                                )}

                                {/* Contexto Detallado Expandible */}
                                <AnimatePresence>
                                    {isExpanded && currentExpense.contexto && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pt-3 mt-3 border-t border-white/5">
                                                <p className="text-zinc-300 text-sm leading-relaxed">
                                                    {currentExpense.contexto}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Navegación */}
                            {expenses.length > 1 && (
                                <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 bg-black/30">
                                    <button
                                        onClick={prevExpense}
                                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-white/60" />
                                    </button>

                                    <div className="flex items-center gap-1.5">
                                        {expenses.slice(0, 5).map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentIndex(idx)}
                                                className={cn(
                                                    "w-2 h-2 rounded-full transition-all",
                                                    idx === currentIndex
                                                        ? "bg-orange-500 w-4"
                                                        : "bg-white/20 hover:bg-white/40"
                                                )}
                                            />
                                        ))}
                                        {expenses.length > 5 && (
                                            <span className="text-zinc-500 text-xs ml-1">+{expenses.length - 5}</span>
                                        )}
                                    </div>

                                    <button
                                        onClick={nextExpense}
                                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5 text-white/60" />
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            )}

            {/* Footer con fecha */}
            {!isLoading && expenses.length > 0 && (
                <p className="text-center text-zinc-600 text-xs mt-4">
                    Fuente: {currentExpense?.source === 'BOE' ? 'BOE' : 'BDNS'} {currentExpense?.date ? new Date(currentExpense.date).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    }) : 'hoy'}
                </p>
            )}
        </div>
    );
};
