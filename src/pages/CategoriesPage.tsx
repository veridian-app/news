import { useState, useEffect, useMemo } from "react";
import { CategoryAlbum } from "@/components/categories/CategoryAlbum";
import { CategoryView } from "@/components/categories/CategoryView";
import { BottomDock } from "@/components/BottomDock";
import { Loader2 } from "lucide-react";

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

const API_BASE =
    import.meta.env.VITE_VERIDIAN_API_BASE || window.location.origin;

// Detectar categoría (copia simplificada de VeridianNews)
const detectCategory = (title: string, content?: string): string => {
    const textToAnalyze = `${title} ${content || ""}`.toLowerCase();

    const matches = (keywords: string) => {
        const regex = new RegExp(`\\b(${keywords})\\b`, "i");
        return regex.test(textToAnalyze);
    };

    if (matches("tecnología|tech|innovación|digital|app|apps|software|hardware|ia|inteligencia artificial|robot|ciber|chatgpt|openai|meta|google|apple|microsoft|amazon|tesla|nvidia|blockchain|crypto|bitcoin|startup|programación"))
        return "tecnología";
    if (matches("ciencia|científico|científicos|investigación|descubrimiento|estudio|marte|espacio|nasa|astronomía|física|química|biología|genética|adn|laboratorio|universidad"))
        return "ciencia";
    if (matches("política|político|gobierno|elecciones|partido|presidente|ministro|congreso|senado|diputado|ley|decreto|parlamento|oposición"))
        return "política";
    if (matches("economía|económico|mercado|empresa|empresas|negocio|finanzas|bolsa|inversión|ibex|pib|inflación|desempleo|paro|salario|banco|hipoteca"))
        return "economía";
    if (matches("salud|médico|hospital|medicina|enfermedad|vacuna|virus|pandemia|covid|tratamiento|terapia|paciente|sanidad|farmacia"))
        return "salud";
    if (matches("deporte|deportes|fútbol|baloncesto|olímpico|atleta|liga|champions|mundial|copa|competición|torneo|campeonato|tenis|fórmula 1"))
        return "deportes";
    if (matches("cultura|arte|música|cine|teatro|literatura|libro|escritor|película|actor|festival|museo|galería|fotografía|moda|gastronomía"))
        return "cultura";
    if (matches("medioambiente|clima|sostenibilidad|ecología|contaminación|emisiones|cambio climático|energía renovable|solar|eólica|reciclaje|biodiversidad"))
        return "medioambiente";
    if (matches("internacional|mundo|global|onu|unión europea|diplomacia|migración|refugiado|conflicto|guerra|rusia|ucrania|china|eeuu|estados unidos"))
        return "internacional";
    if (matches("educación|educativo|escuela|colegio|universidad|estudiante|profesor|formación|enseñanza|aprendizaje"))
        return "educación";
    if (matches("sociedad|social|comunidad|ciudad|población|vivienda|alquiler|transporte|urbanismo"))
        return "sociedad";

    return "general";
};

const CategoriesPage = () => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [allNews, setAllNews] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadNews = async () => {
            // Try cache first
            const cached = localStorage.getItem("veridian_news_cache");
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setAllNews(parsed);
                        setIsLoading(false);
                    }
                } catch (e) {
                    console.error("Error parsing cache:", e);
                }
            }

            // Fetch from API
            try {
                const response = await fetch(`${API_BASE}/api/news?limit=100`, {
                    signal: AbortSignal.timeout(5000),
                });
                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data) && data.length > 0) {
                        setAllNews(data);
                        localStorage.setItem("veridian_news_cache", JSON.stringify(data));
                    }
                }
            } catch (e) {
                console.error("Error fetching news:", e);
            } finally {
                setIsLoading(false);
            }
        };

        loadNews();
    }, []);

    // Group news by category
    const categorizedNews = useMemo(() => {
        const map = new Map<string, NewsItem[]>();

        allNews.forEach((item) => {
            const category = item.category || detectCategory(item.title, item.content);
            const existing = map.get(category) || [];
            existing.push({ ...item, category });
            map.set(category, existing);
        });

        return map;
    }, [allNews]);

    // Build categories list sorted by count
    const categories = useMemo(() => {
        return Array.from(categorizedNews.entries())
            .map(([name, items]) => ({
                name,
                count: items.length,
                icon: "",
                gradient: "",
                borderColor: "",
            }))
            .sort((a, b) => b.count - a.count);
    }, [categorizedNews]);

    if (isLoading && allNews.length === 0) {
        return (
            <div className="h-[100dvh] w-full flex items-center justify-center bg-zinc-950 text-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    <p className="text-white/50 animate-pulse">Cargando categorías...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] bg-zinc-950 text-white">
            {selectedCategory ? (
                <CategoryView
                    category={selectedCategory}
                    newsItems={categorizedNews.get(selectedCategory) || []}
                    onBack={() => setSelectedCategory(null)}
                />
            ) : (
                <div className="max-w-2xl mx-auto pt-6">
                    <CategoryAlbum
                        categories={categories}
                        onSelectCategory={setSelectedCategory}
                    />
                </div>
            )}

            <BottomDock />
        </div>
    );
};

export default CategoriesPage;
