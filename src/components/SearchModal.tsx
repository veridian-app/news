import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, ArrowRight, Clock, Globe, Shield } from "lucide-react";
import { useSearch } from "@/contexts/SearchContext";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export const SearchModal = () => {
  const { showSearchModal, closeSearch, searchQuery, setSearchQuery } = useSearch();
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (showSearchModal && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showSearchModal]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSearch();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [closeSearch]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      try {
        if (isSupabaseConfigured()) {
          const { data, error } = await supabase
            .from('daily_news' as any)
            .select('*')
            .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,summary.ilike.%${searchQuery}%`)
            .order('published_at', { ascending: false })
            .limit(10);

          if (data) setResults(data);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(performSearch, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!showSearchModal) return null;

  return (
    <div className="fixed inset-0 z-[2000000] bg-black/95 backdrop-blur-2xl flex flex-col animate-in fade-in duration-300">
      <header className="p-6 md:p-10 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          <Search className="w-6 h-6 text-emerald-500" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar noticias clave..."
            className="w-full bg-transparent border-none outline-none text-2xl md:text-4xl font-black uppercase tracking-tighter text-white placeholder:text-white/10"
          />
        </div>
        <button 
          onClick={closeSearch}
          className="p-4 rounded-full bg-white/5 hover:bg-white/10 transition-colors group"
        >
          <X className="w-8 h-8 text-white/40 group-hover:text-white transition-colors" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-8">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
              <p className="text-[10px] font-mono text-emerald-500/40 uppercase tracking-[0.3em]">Consultando Red Nodal...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] mb-8">Resultados de Inteligencia // {results.length} hallazgos</p>
              {results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    closeSearch();
                    navigate(`/?newsId=${item.id}`);
                  }}
                  className="w-full group p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-emerald-500/5 hover:border-emerald-500/20 transition-all text-left flex items-center gap-6"
                >
                  <div className="hidden md:flex w-16 h-16 rounded-2xl bg-white/5 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                    {item.image ? (
                      <img src={item.image} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-emerald-500/10">
                        <Globe className="w-6 h-6 text-emerald-500/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3 text-[9px] font-mono text-emerald-500/60 uppercase">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(item.published_at).toLocaleDateString()}</span>
                      <span className="h-1 w-1 rounded-full bg-white/10" />
                      <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {item.source || "Veridian"}</span>
                    </div>
                    <h3 className="text-lg md:text-xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase leading-tight">{item.title}</h3>
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/10 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-20 space-y-4">
              <p className="text-xl font-bold text-white/40 uppercase">No se han encontrado registros</p>
              <p className="text-sm text-white/20">Prueba con otras palabras clave de inteligencia.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-10">
              <TrendingSearch label="Conflictos Geopolíticos" onClick={() => setSearchQuery("Guerra")} />
              <TrendingSearch label="Inteligencia Artificial" onClick={() => setSearchQuery("IA")} />
              <TrendingSearch label="Economía Global" onClick={() => setSearchQuery("Inflación")} />
              <TrendingSearch label="Ciberseguridad" onClick={() => setSearchQuery("Hacker")} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const TrendingSearch = ({ label, onClick }: { label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 text-left group transition-all"
  >
    <p className="text-[9px] font-mono text-emerald-500/40 uppercase mb-2">Tendencia de Búsqueda</p>
    <p className="text-lg font-black text-white group-hover:text-emerald-500 transition-colors uppercase">{label}</p>
  </button>
);
