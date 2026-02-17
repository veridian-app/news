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
    const expandableItems = transformToExpandable(newsItems);

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
                {expandableItems.length > 0 ? (
                    expandableItems.map((item, index) => (
                        <ExpandableNewsCard key={item.id} item={item} index={index} />
                    ))
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
