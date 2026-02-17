import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
    tecnología: { icon: "💻", gradient: "from-violet-600/80 to-indigo-900/80", border: "border-violet-500/30" },
    ciencia: { icon: "🔬", gradient: "from-cyan-600/80 to-blue-900/80", border: "border-cyan-500/30" },
    política: { icon: "🏛️", gradient: "from-red-600/80 to-rose-900/80", border: "border-red-500/30" },
    economía: { icon: "💰", gradient: "from-amber-600/80 to-yellow-900/80", border: "border-amber-500/30" },
    salud: { icon: "🏥", gradient: "from-emerald-600/80 to-green-900/80", border: "border-emerald-500/30" },
    deportes: { icon: "⚽", gradient: "from-orange-600/80 to-red-900/80", border: "border-orange-500/30" },
    cultura: { icon: "🎭", gradient: "from-pink-600/80 to-fuchsia-900/80", border: "border-pink-500/30" },
    medioambiente: { icon: "🌱", gradient: "from-lime-600/80 to-green-900/80", border: "border-lime-500/30" },
    internacional: { icon: "🌍", gradient: "from-sky-600/80 to-blue-900/80", border: "border-sky-500/30" },
    educación: { icon: "📚", gradient: "from-teal-600/80 to-cyan-900/80", border: "border-teal-500/30" },
    sociedad: { icon: "👥", gradient: "from-slate-500/80 to-zinc-800/80", border: "border-slate-500/30" },
    general: { icon: "📰", gradient: "from-zinc-600/80 to-zinc-900/80", border: "border-zinc-500/30" },
};

export const CategoryAlbum = ({ categories, onSelectCategory }: CategoryAlbumProps) => {
    return (
        <div className="px-4 pb-32">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-8"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium uppercase tracking-wider mb-4">
                    <span>Explorar</span>
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                    <span>{categories.length} categorías</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    Categorías
                </h1>
                <p className="text-zinc-400 mt-2 text-sm">
                    Explora noticias por categoría. Pulsa para ver todas las noticias.
                </p>
            </motion.div>

            {/* Grid de tarjetas */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {categories.map((cat, index) => {
                    const style = CATEGORY_STYLES[cat.name] || CATEGORY_STYLES.general;

                    return (
                        <motion.button
                            key={cat.name}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{
                                duration: 0.35,
                                delay: index * 0.05,
                                ease: [0.25, 0.1, 0.25, 1],
                            }}
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => onSelectCategory(cat.name)}
                            className={cn(
                                "relative overflow-hidden rounded-2xl p-4 md:p-5 text-left",
                                "border backdrop-blur-sm",
                                "transition-shadow duration-300 hover:shadow-lg hover:shadow-black/30",
                                style.border,
                                "group"
                            )}
                        >
                            {/* Gradient background */}
                            <div className={cn(
                                "absolute inset-0 bg-gradient-to-br opacity-80 group-hover:opacity-100 transition-opacity duration-300",
                                style.gradient
                            )} />

                            {/* Subtle pattern overlay */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(255,255,255,0.08),_transparent_60%)]" />

                            {/* Today indicator */}
                            {cat.hasToday && (
                                <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_2px_rgba(16,185,129,0.4)]" />
                                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Hoy</span>
                                </div>
                            )}

                            {/* Content */}
                            <div className="relative z-10 flex flex-col h-full min-h-[110px] md:min-h-[130px] justify-between">
                                <div>
                                    <span className="text-3xl md:text-4xl block mb-2 drop-shadow-lg">
                                        {style.icon}
                                    </span>
                                    <h3 className="text-white font-semibold text-sm md:text-base capitalize leading-tight">
                                        {cat.name}
                                    </h3>
                                </div>

                                <div className="flex items-center gap-1.5 mt-3">
                                    <span className="text-white/60 text-xs font-medium">
                                        {cat.count} {cat.count === 1 ? "noticia" : "noticias"}
                                    </span>
                                    <motion.span
                                        className="text-white/40 text-xs"
                                        animate={{ x: [0, 3, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        →
                                    </motion.span>
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};
