import { motion } from "framer-motion";
import { ArrowLeft, Newspaper } from "lucide-react";
import { ExpandableNewsCard, ExpandableNewsItem } from "@/components/cafe/ExpandableNewsCard";
import { cn } from "@/lib/utils";

interface NewsItem {
    id: string;
    title: string;
    summary: string;
    content: string;
    image?: string;
    date: string;
    source: string;
    url?: string;
    category?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
    tecnología: "💻",
    ciencia: "🔬",
    política: "🏛️",
    economía: "💰",
    salud: "🏥",
    deportes: "⚽",
    cultura: "🎭",
    medioambiente: "🌱",
    internacional: "🌍",
    educación: "📚",
    sociedad: "👥",
    general: "📰",
};

interface CategoryViewProps {
    category: string;
    newsItems: NewsItem[];
    onBack: () => void;
}

const transformToExpandable = (items: NewsItem[]): ExpandableNewsItem[] => {
    return items.map((item) => ({
        id: item.id,
        title: item.title,
        summary: item.summary || "",
        content: item.content || "",
        imageUrl:
            item.image ||
            "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800",
        category: item.category || "general",
        readTime: `${Math.max(1, Math.ceil((item.content?.length || 0) / 1000))} min`,
        source: item.source,
        url: item.url,
    }));
};

export const CategoryView = ({ category, newsItems, onBack }: CategoryViewProps) => {
    const icon = CATEGORY_ICONS[category] || "📰";

    // Split by today vs older
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    const todayNews: NewsItem[] = [];
    const olderNews: NewsItem[] = [];

    // Sort by date descending first
    const sorted = [...newsItems].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    sorted.forEach((item) => {
        try {
            const itemDate = new Date(item.date);
            if (itemDate.getTime() >= todayMs) {
                todayNews.push(item);
            } else {
                olderNews.push(item);
            }
        } catch {
            olderNews.push(item);
        }
    });

    const todayExpandable = transformToExpandable(todayNews);
    const olderExpandable = transformToExpandable(olderNews);
    const hasAny = todayNews.length > 0 || olderNews.length > 0;

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            {/* Sticky Header */}
            <div className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
                    <motion.button
                        onClick={onBack}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-white/70" />
                    </motion.button>

                    <div className="flex items-center gap-2 flex-1">
                        <span className="text-xl">{icon}</span>
                        <h2 className="text-lg font-semibold text-white capitalize">
                            {category}
                        </h2>
                        <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full ml-1">
                            {newsItems.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* News List */}
            <div className="max-w-2xl mx-auto px-4 py-6 pb-32">
                {hasAny ? (
                    <>
                        {/* Today section */}
                        {todayExpandable.length > 0 && (
                            <div className="mb-8">
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-2 mb-4"
                                >
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">
                                        Hoy
                                    </h3>
                                    <span className="text-xs text-emerald-400/50 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                        {todayNews.length}
                                    </span>
                                </motion.div>
                                {todayExpandable.map((item, index) => (
                                    <ExpandableNewsCard key={item.id} item={item} index={index} />
                                ))}
                            </div>
                        )}

                        {/* Divider between sections */}
                        {todayExpandable.length > 0 && olderExpandable.length > 0 && (
                            <div className="flex items-center gap-3 my-8">
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            </div>
                        )}

                        {/* Older section */}
                        {olderExpandable.length > 0 && (
                            <div>
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: todayExpandable.length > 0 ? 0.2 : 0 }}
                                    className="flex items-center gap-2 mb-4"
                                >
                                    <div className="w-2 h-2 rounded-full bg-zinc-500" />
                                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                                        Anteriores
                                    </h3>
                                    <span className="text-xs text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">
                                        {olderNews.length}
                                    </span>
                                </motion.div>
                                {olderExpandable.map((item, index) => (
                                    <ExpandableNewsCard key={item.id} item={item} index={index} />
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-20 text-center"
                    >
                        <Newspaper className="w-12 h-12 text-white/20 mb-4" />
                        <p className="text-white/50 text-lg font-medium">
                            No hay noticias en esta categoría
                        </p>
                        <p className="text-white/30 text-sm mt-1">
                            Vuelve más tarde para ver contenido nuevo.
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
};
