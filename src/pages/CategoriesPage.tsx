import { useState, useEffect, useMemo } from "react";
import { CategoryAlbum } from "../components/categories/CategoryAlbum";
import { CategoryView } from "../components/categories/CategoryView";
import { NewsItem, detectCategory, isAd } from "../utils/news-utils";
import { supabase, isSupabaseConfigured } from "../integrations/supabase/client";
import { mockNews } from "../data/mockNews";

const PREFERRED_ORDER = [
    "geopolítica",
    "deportes",
    "empresa",
    "tecnología",
    "política",
    "españa",
    "internacional"
];

const CategoriesPage = () => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [newsItems, setNewsItems] = useState<NewsItem[]>(mockNews);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchNewsFromSupabase = async () => {
            if (!isSupabaseConfigured()) {
                console.warn("⚠️ Supabase no configurado, usando datos locales");
                setIsLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('daily_news')
                    .select('*')
                    .order('published_at', { ascending: false })
                    .limit(200);

                if (error) throw error;

                if (data && data.length > 0) {
                    console.log(`📊 Recibidas ${data.length} noticias de Supabase`);
                    const transformed = data
                        .filter(item => !isAd(item.title, item.content, item.source))
                        .map(item => ({
                            id: item.id,
                            title: item.title,
                            summary: item.summary || item.content?.substring(0, 200),
                            content: item.content,
                            image: item.image,
                            date: item.published_at,
                            source: item.source,
                            category: item.category,
                            url: item.url
                        }));
                    setNewsItems(transformed);
                } else {
                    console.warn("⚠️ Supabase devolvió 0 noticias, manteniendo mockNews");
                }
            } catch (error) {
                console.error("❌ Error Supabase Categories:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNewsFromSupabase();
    }, []);

    const categorizedNews = useMemo(() => {
        const map = new Map<string, NewsItem[]>();
        newsItems.forEach(item => {
            const category = (item.category || detectCategory(item.title, item.content)).toLowerCase();
            if (!map.has(category)) map.set(category, []);
            map.get(category)?.push(item);
        });
        
        console.log("📂 Distribución de categorías:", 
            Array.from(map.entries()).map(([k, v]) => `${k}: ${v.length}`)
        );
        
        return map;
    }, [newsItems]);

    const categories = useMemo(() => {
        return PREFERRED_ORDER.map(catName => {
            const items = categorizedNews.get(catName) || [];
            return {
                name: catName,
                count: items.length,
                icon: "", // Se gestiona en el componente
                hasToday: false,
                gradient: "",
                borderColor: ""
            };
        });
    }, [categorizedNews]);

    return (
        <div className="fixed inset-0 w-full h-full bg-zinc-950 text-white overflow-hidden flex flex-col">
            {/* Header Táctico Fijo */}
            <header className="shrink-0 z-50 bg-zinc-950 border-b border-white/10 px-6 py-4 shadow-2xl">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <h1 className="text-[10px] tracking-[0.2em] text-white/90 uppercase font-bold">
                        Veridian // {selectedCategory ? selectedCategory : "Dashboard de Inteligencia"}
                    </h1>
                </div>
            </header>

            {/* Área de Scroll de Alto Rendimiento */}
            <main className="flex-1 overflow-y-auto px-4 pt-6 no-scrollbar scroll-smooth">
                <div className="max-w-2xl mx-auto">
                    {selectedCategory ? (
                        <CategoryView
                            category={selectedCategory}
                            newsItems={categorizedNews.get(selectedCategory) || []}
                            onBack={() => setSelectedCategory(null)}
                        />
                    ) : (
                        <CategoryAlbum
                            categories={categories}
                            onSelectCategory={setSelectedCategory}
                        />
                    )}
                    
                    {/* Guía Visual de Final de Datos */}
                    <div className="mt-20 mb-10 flex flex-col items-center justify-center gap-4 opacity-10">
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-white to-transparent" />
                        <span className="text-[9px] font-black tracking-[0.6em] text-white uppercase">
                            Veridian // End of Records
                        </span>
                    </div>
                </div>
                
                {/* ESPACIADOR FÍSICO ULTRA - 1200px */}
                {/* Garantiza que el usuario pueda elevar el contenido hasta donde quiera */}
                <div className="h-[1200px] w-full pointer-events-none" aria-hidden="true" />
            </main>

            {/* Degradado Táctico Inferior */}
            <div className="fixed bottom-0 left-0 w-full h-40 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none z-40" />
        </div>
    );
};

export default CategoriesPage;
