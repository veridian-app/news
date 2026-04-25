import { cn } from "../../lib/utils";

interface CategoryInfo {
    name: string;
    icon: string;
    count: number;
    hasToday: boolean;
    gradient: string;
    borderColor: string;
}

interface CategoryAlbumProps {
    categories: CategoryInfo[];
    onSelectCategory: (category: string) => void;
}

const CATEGORY_STYLES: Record<string, { icon: string; gradient: string; border: string }> = {
    geopolítica: { icon: "🛰️", gradient: "from-emerald-500/40 via-emerald-600/80 to-slate-950", border: "border-emerald-500/50" },
    deportes: { icon: "🏆", gradient: "from-orange-600/60 to-zinc-950", border: "border-orange-500/30" },
    empresa: { icon: "📈", gradient: "from-amber-500/60 to-zinc-950", border: "border-amber-400/30" },
    tecnología: { icon: "⚡", gradient: "from-violet-600/60 to-zinc-950", border: "border-violet-500/30" },
    política: { icon: "🏛️", gradient: "from-rose-600/60 to-zinc-950", border: "border-rose-500/30" },
    españa: { icon: "🇪🇸", gradient: "from-red-600/60 to-zinc-950", border: "border-red-500/30" },
    internacional: { icon: "🌐", gradient: "from-sky-600/60 to-zinc-950", border: "border-sky-500/30" },
    general: { icon: "📰", gradient: "from-zinc-600/60 to-zinc-950", border: "border-zinc-500/30" },
};

export const CategoryAlbum = ({ categories, onSelectCategory }: CategoryAlbumProps) => {
    // Separamos Geopolítica para destacarla
    const mainCategory = categories.find(c => c.name.toLowerCase() === "geopolítica");
    const otherCategories = categories.filter(c => c.name.toLowerCase() !== "geopolítica");

    return (
        <div className="px-4 pb-20"> {/* Ajustado para simetría con el padding del main */}
            <div className="mb-8 pt-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                    <span>Sistema de Inteligencia</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">
                    CATEGORÍAS
                </h1>
            </div>

            {/* Categoría Destacada: Geopolítica */}
            {mainCategory && (
                <div className="mb-8">
                    <button
                        onClick={() => onSelectCategory(mainCategory.name)}
                        className={cn(
                            "group relative w-full overflow-hidden rounded-[2rem] p-8 text-left transition-all duration-500",
                            "border border-emerald-500/30 bg-zinc-950 hover:border-emerald-500/60 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]",
                            "active:scale-[0.98]"
                        )}
                    >
                        <div className={cn(
                            "absolute inset-0 bg-gradient-to-br opacity-40 group-hover:opacity-60 transition-opacity duration-500",
                            CATEGORY_STYLES.geopolítica.gradient
                        )} />
                        
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-4">
                                    <span className="text-5xl drop-shadow-2xl">{CATEGORY_STYLES.geopolítica.icon}</span>
                                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[9px] font-black uppercase tracking-[0.2em]">
                                        Prioridad 01
                                    </span>
                                </div>
                                <h2 className="text-4xl font-black text-white capitalize tracking-tighter mb-2">
                                    {mainCategory.name}
                                </h2>
                                <p className="text-emerald-100/40 text-xs font-medium max-w-sm leading-relaxed uppercase tracking-wider">
                                    Seguimiento estratégico global y conflictos de alto impacto.
                                </p>
                            </div>
                            
                            <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-end gap-2">
                                <div className="text-right">
                                    <span className="text-5xl font-black text-white block leading-none">{mainCategory.count}</span>
                                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Registros</span>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-all">
                                    <span className="text-xl">→</span>
                                </div>
                            </div>
                        </div>
                    </button>
                </div>
            )}

            {/* Grid Equilibrado de Categorías Secundarias */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {otherCategories.map((cat) => {
                    const style = CATEGORY_STYLES[cat.name] || CATEGORY_STYLES.general;

                    return (
                        <button
                            key={cat.name}
                            onClick={() => onSelectCategory(cat.name)}
                            className={cn(
                                "relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300",
                                "border border-white/5 bg-zinc-900/40 hover:bg-zinc-900 hover:border-white/20 group",
                                "min-h-[140px] flex flex-col justify-between"
                            )}
                        >
                            <div className={cn(
                                "absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity",
                                style.gradient
                            )} />

                            <div className="relative z-10">
                                <span className="text-3xl block mb-4 grayscale group-hover:grayscale-0 transition-all duration-500">
                                    {style.icon}
                                </span>
                                <h3 className="text-white font-bold text-sm uppercase tracking-widest">
                                    {cat.name}
                                </h3>
                            </div>

                            <div className="relative z-10 flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.15em]">
                                    {cat.count} Docs
                                </span>
                                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/20 transition-all">
                                    <span className="text-xs text-white/40">→</span>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
            
            {/* Footer Táctico para cierre premium */}
            <div className="mt-12 flex flex-col items-center justify-center gap-4 opacity-20">
                <div className="w-12 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
                <span className="text-[8px] font-black tracking-[0.4em] text-white uppercase">
                    Veridian Terminal // End of Line
                </span>
            </div>
        </div>
    );
};



