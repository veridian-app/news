import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import "./VeridianNews.css";
import { supabase, isSupabaseConfigured } from "../integrations/supabase/client";
import { useIsMobile, useScreenSize } from "../hooks/use-mobile";
import { Search, Globe, X } from "lucide-react";
import { BottomDock } from "../components/BottomDock";
import { NewsCard } from "@/components/NewsCard";
import { useAuth } from "@/contexts/AuthContext";
import { useSearch } from "@/contexts/SearchContext";
import { StreakHeader } from "../components/StreakHeader";
import { NewsItem, detectCategory, detectBias, isAd } from "../utils/news-utils";
import { recommendNews } from "../utils/recommendation-utils";
import { TacticalLoader } from "../components/TacticalLoader";
import { GeopoliticsTicker } from "../components/GeopoliticsTicker";
import { mockNews } from "../data/mockNews";

const API_BASE = import.meta.env.VITE_VERIDIAN_API_BASE || window.location.origin;

// Legacy fingerprint function fallback
const getOrCreateUserId = (): string => {
  let userId = localStorage.getItem('veridian_userId');
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!userId || !uuidRegex.test(userId)) {
    userId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    localStorage.setItem('veridian_userId', userId);
  }
  return userId;
};

const FALLBACK_USER_ID = getOrCreateUserId();

const VeridianNews = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const screenSize = useScreenSize();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const USER_ID = user?.id || FALLBACK_USER_ID;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [activeNewsId, setActiveNewsId] = useState<string | null>(null);
  const [likedNewsIds, setLikedNewsIds] = useState<Set<string>>(new Set());
  const [userPreferences, setUserPreferences] = useState<Map<string, number>>(new Map());
  const [streakCount, setStreakCount] = useState<number>(0);
  const [rawNews, setRawNews] = useState<NewsItem[]>(mockNews);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const { showSearchModal, openSearch, closeSearch, searchQuery } = useSearch();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const feedContainerRef = useRef<HTMLDivElement>(null);
  const [loadingProgress, setLoadingProgress] = useState(10);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const news = useMemo(() => {
    if (rawNews.length === 0) return [];
    
    // Read AI Algorithm settings from Control Center
    const savedSettings = localStorage.getItem('veridian_settings');
    const settings = savedSettings ? JSON.parse(savedSettings) : { aiBias: 50 };
    
    let filtered = rawNews;

    // Apply AI Bias Filter
    // Filter news that are within a range of the user's bias
    // Range is userBias +/- 25
    filtered = rawNews.filter(item => {
      const newsBias = item.bias ?? 50;
      const lowerBound = Math.max(0, settings.aiBias - 25);
      const upperBound = Math.min(100, settings.aiBias + 25);
      return newsBias >= lowerBound && newsBias <= upperBound;
    });

    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.summary?.toLowerCase().includes(query)
      );
    }

    const categorized = filtered.map(item => {
      const category = item.category || detectCategory(item.title, item.content);
      const bias = item.bias ?? detectBias(item.title, item.content);
      let weight = 0;
      if (category === 'geopolítica') weight = 100;
      else if (category === 'política') weight = 50;
      else if (category === 'empresa') weight = 30;
      return { ...item, category, weight, bias };
    });

    const sorted = [...categorized].sort((a, b) => {
      if (b.weight !== a.weight) return b.weight - a.weight;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    const finalNews = !debouncedSearchQuery.trim() && userPreferences.size > 0
      ? recommendNews(sorted, userPreferences, likedNewsIds)
      : sorted;

    if (selectedCategory === 'all') return finalNews;
    return finalNews.filter(n => n.category?.toLowerCase() === selectedCategory.toLowerCase());
  }, [rawNews, userPreferences, likedNewsIds, debouncedSearchQuery, selectedCategory]);

  useEffect(() => {
    const newsId = searchParams.get('newsId');
    if (newsId && news.length > 0 && feedContainerRef.current) {
      const index = news.findIndex(n => n.id === newsId);
      if (index !== -1) {
        feedContainerRef.current.scrollTo({
          top: index * window.innerHeight,
          behavior: 'instant'
        });
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('newsId');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [news, searchParams, setSearchParams]);

  useEffect(() => {
    if (showContentModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showContentModal]);

  useEffect(() => {
    setIsLoading(true);
    const loadFromAPI = async () => {
      try { await fetchNews(); } catch (e) { console.error(e); }
    };
    setTimeout(loadFromAPI, 500);

    if (isSupabaseConfigured()) {
      loadUserLikes();
      loadUserPreferences();
      loadUserStreak();
    }

    const interval = setInterval(loadFromAPI, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const container = feedContainerRef.current;
    if (!container) return;

    if (observerRef.current) observerRef.current.disconnect();

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.getAttribute('data-index'));
          if (!isNaN(index) && news[index]) {
            setActiveNewsId(news[index].id);
          }
        }
      });
    };

    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: container,
      threshold: 0.5,
      rootMargin: "0px"
    });

    container.querySelectorAll('.news-card').forEach(card => observerRef.current?.observe(card));

    return () => observerRef.current?.disconnect();
  }, [news]);

  const fetchNews = async () => {
    // 1. Intentar cargar desde caché local para velocidad instantánea
    const cachedNews = localStorage.getItem('veridian_news_cache');
    if (cachedNews) {
      try {
        const parsed = JSON.parse(cachedNews);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRawNews(parsed);
          if (isLoading) setIsLoading(false);
        }
      } catch (e) { console.error("Error cargando caché:", e); }
    }

    try {
      setLoadingProgress(20);
      
      // 2. PRIORIDAD: Supabase (Conexión directa)
      if (isSupabaseConfigured()) {
        console.log("📡 Cargando noticias desde Supabase...");
        const { data: dbNews, error: dbError } = await supabase
          .from('daily_news' as any)
          .select('*')
          .order('published_at', { ascending: false })
          .limit(100);

        if (dbError) throw dbError;

        if (dbNews && dbNews.length > 0) {
          const transformed: NewsItem[] = dbNews
            .filter((item: any) => !isAd(item.title, item.content, item.source)) // BLOQUEO DE ANUNCIOS
            .map((item: any) => {
              const category = item.category || detectCategory(item.title, item.content);
              return {
                id: item.id,
                title: item.title,
                summary: item.summary || item.content?.substring(0, 200) || 'Sin resumen',
                content: item.content || 'Sin contenido',
                image: item.image,
                date: item.published_at || new Date().toISOString(),
                source: item.source || 'Veridian News',
                url: item.url,
                category: category,
                bias: item.bias || detectBias(item.title, item.content)
              };
            });
          
          setRawNews(transformed);
          localStorage.setItem('veridian_news_cache', JSON.stringify(transformed));
          setLoadingProgress(100);
          console.log(`✅ ${transformed.length} noticias filtradas y clasificadas cargadas`);
          return;
        }
      }

      // 3. FALLBACK: API externa (si Supabase falla o no está configurado)
      console.log("🔌 Intentando fallback a API externa...");
      const response = await fetch(`${API_BASE}/api/news?limit=100`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data) && data.length > 0) {
          setRawNews(data);
          localStorage.setItem('veridian_news_cache', JSON.stringify(data));
          setLoadingProgress(100);
          return;
        }
      }
    } catch (e) {
      console.error("❌ Error cargando noticias:", e);
      setError("No se pudieron cargar las noticias. Comprueba tu conexión.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserLikes = async () => {
    try {
      const { data } = await supabase.from('news_likes').select('news_id').eq('user_id', USER_ID);
      if (data) setLikedNewsIds(new Set(data.map(l => l.news_id)));
    } catch (e) { console.error(e); }
  };

  const loadUserPreferences = async () => {
    try {
      const { data } = await supabase.from('user_preferences').select('category, source, score').eq('user_id', USER_ID);
      if (data) {
        const prefs = new Map<string, number>();
        data.forEach(p => {
          prefs.set(p.category, p.score);
          if (p.source) prefs.set(`source:${p.source}`, p.score);
        });
        setUserPreferences(prefs);
      }
    } catch (e) { console.error(e); }
  };

  const loadUserStreak = async () => {
    try {
      const { data } = await supabase.from('user_profiles' as any).select('streak_count').eq('id', USER_ID).maybeSingle();
      if (data) setStreakCount((data as any).streak_count || 0);
    } catch (e) { console.error(e); }
  };

  const updateStreak = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data: profile } = await supabase.from('user_profiles' as any).select('*').eq('id', USER_ID).maybeSingle();
      const lastVisit = profile?.last_visit_date ? new Date(profile.last_visit_date) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (!lastVisit || lastVisit < today) {
        const newStreak = lastVisit && (today.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24) <= 1 
          ? (profile?.streak_count || 0) + 1 
          : 1;
        
        await supabase.from('user_profiles' as any).upsert({
          id: USER_ID,
          streak_count: newStreak,
          last_visit_date: new Date().toISOString()
        });
        setStreakCount(newStreak);
      }
    } catch (e) { console.error(e); }
  };

  const handleLike = async (newsId: string) => {
    if (!isSupabaseConfigured()) return;
    const isLiked = likedNewsIds.has(newsId);
    try {
      if (isLiked) {
        await supabase.from('news_likes').delete().eq('user_id', USER_ID).eq('news_id', newsId);
        likedNewsIds.delete(newsId);
      } else {
        await supabase.from('news_likes').insert({ user_id: USER_ID, news_id: newsId });
        likedNewsIds.add(newsId);
      }
      setLikedNewsIds(new Set(likedNewsIds));
    } catch (e) { console.error(e); }
  };

  const geoCount = news.filter(n => n.category?.toLowerCase() === 'geopolítica' || n.category?.toLowerCase() === 'geopolitica').length;
  console.log('VeridianNews rendering', news.length, 'geo:', geoCount, 'isLoading:', isLoading);

  if (isLoading) return <TacticalLoader progress={loadingProgress} />;

  return (
    <div className="veridian-news-container font-sans bg-black text-white h-[100dvh] overflow-hidden flex flex-col relative">
      {/* Tactical Command Header - ULTRA MINIMALIST */}
      <div className={cn(
        "flex flex-col bg-background/80 backdrop-blur-xl border-b border-border z-[100] shrink-0 relative transition-all duration-500",
        showContentModal ? "opacity-0 invisible -translate-y-10" : "opacity-100 visible translate-y-0"
      )}>
        <div className="flex justify-between items-center h-[60px] px-6">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            <h1 className="text-lg font-black tracking-[0.2em] text-foreground uppercase italic">
              Veridian<span className="text-emerald-500">_</span>
            </h1>
          </div>

          {/* Center Clock (Discreet) */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[11px] font-tactical font-black text-emerald-400 tabular-nums">
              {currentTime.getUTCHours().toString().padStart(2, '0')}:
              {currentTime.getUTCMinutes().toString().padStart(2, '0')}:
              {currentTime.getUTCSeconds().toString().padStart(2, '0')}
              <span className="ml-1 text-[8px] text-emerald-500/50 uppercase">UTC</span>
            </span>
          </div>
          
          {/* Action Section */}
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden xs:flex scale-75 md:scale-90 opacity-80">
              <StreakHeader streak={streakCount} />
            </div>
            <div className="hidden xs:block h-6 w-[1px] bg-white/10 mx-1" />
            <a 
              href="#" 
              className="px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-emerald-500 text-black text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95 whitespace-nowrap"
            >
              <span className="xs:hidden">App</span>
              <span className="hidden xs:inline">Descargar web.app</span>
            </a>
            <button onClick={openSearch} className="p-2 text-foreground/40 hover:text-emerald-400 transition-colors shrink-0">
              <Search className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        {/* Global Geopolitics Ticker - Integrated */}
        <div className="h-[34px] flex items-center bg-black/40 border-t border-white/5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 px-4 shrink-0 border-r border-white/10 mr-4">
            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Filter_Mode</span>
          </div>
          <div className="flex items-center gap-6 px-4 shrink-0">
            {['all', 'geopolítica', 'tecnología', 'empresa', 'españa', 'política'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "text-[10px] font-tactical font-bold uppercase tracking-[0.2em] transition-all relative py-2",
                  selectedCategory === cat 
                    ? "text-emerald-400" 
                    : "text-white/30 hover:text-white/60"
                )}
              >
                {cat === 'all' ? 'Ver_Todo' : cat}
                {selectedCategory === cat && (
                  <div className="absolute bottom-0 left-0 w-full h-[1px] bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                )}
              </button>
            ))}
          </div>
          <div className="h-4 w-[1px] bg-white/10 mx-2 shrink-0" />
          <GeopoliticsTicker news={news} />
        </div>
      </div>

      {/* Bottom Navigation Dock - Smart Visibility */}
      <div className={cn(
        "fixed bottom-0 left-0 w-full z-[1000] transition-all duration-700",
        showContentModal ? "opacity-0 translate-y-20" : "opacity-100 translate-y-0"
      )}>
        <BottomDock />
      </div>

      {/* MAIN FEED CONTAINER - ONLY THIS PART SCROLLS */}
      <main 
        ref={feedContainerRef}
        className={cn(
          "feed-container flex-1 w-full relative z-10 overflow-x-hidden snap-y snap-mandatory scrollbar-hide bg-black transition-all duration-700",
          showContentModal ? "opacity-0 invisible overflow-y-hidden pointer-events-none" : "opacity-100 visible overflow-y-auto"
        )}
      >
        {news.map((item, index) => (
          <div 
            key={item.id} 
            data-index={index}
            className="news-card w-full h-full snap-start snap-always relative"
          >
            <NewsCard 
              item={item} 
              isActive={activeNewsId === item.id}
              index={index}
              onLike={() => handleLike(item.id)}
              onShare={() => {}}
              onReadMore={() => {
                closeSearch();
                setSelectedNews(item);
                setShowContentModal(true);
                updateStreak();
              }}
              category={item.category}
            />
          </div>
        ))}
        
        {/* Tactical Loader Footer - Extra height to avoid dock overlap */}
        <div className="h-48 flex flex-col items-center justify-center gap-4 border-t border-white/5 bg-black/40">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
          <span className="text-[10px] font-tactical text-emerald-500/50 animate-pulse tracking-widest">SYNCHRONIZING_FEED...</span>
        </div>
      </main>

      {/* Deep Intelligence Detail Modal - High-Fidelity Editorial Edition */}
      {showContentModal && selectedNews && createPortal(
        <div className="fixed inset-0 z-[2000000] bg-black flex flex-col overflow-hidden pointer-events-auto">
          {/* Reading Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-white/5 z-[210000]">
            <div className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] transition-all duration-300" style={{ width: '0%' }} id="reading-progress" />
          </div>

          <header className="px-4 py-3 md:px-10 md:py-6 flex items-center justify-between border-b border-white/5 bg-black z-[205000] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Globe className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-emerald-500">Expediente_Verificado</span>
                  <div className="w-1 h-1 rounded-full bg-emerald-500/40" />
                  <span className="text-[8px] md:text-[9px] font-mono text-emerald-500/60 uppercase">V.9</span>
                </div>
                <span className="text-[10px] md:text-[11px] font-bold text-white/60 truncate max-w-[120px] md:max-w-xl uppercase tracking-tighter">
                  {selectedNews.source.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
              {selectedNews.url && (
                <a 
                  href={selectedNews.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                >
                  <span className="hidden sm:inline">Documento</span> Original
                </a>
              )}
              <button 
                onClick={() => setShowContentModal(false)} 
                className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/10 hover:bg-emerald-500 hover:text-black text-white flex items-center justify-center transition-all duration-300 group active:scale-90 z-[210000] border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                aria-label="Cerrar expediente"
              >
                <X className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
          </header>

          <main 
            className="flex-1 overflow-y-auto scrollbar-hide scroll-smooth overscroll-contain"
            onScroll={(e) => {
              const target = e.currentTarget;
              const progress = (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100;
              const bar = document.getElementById('reading-progress');
              if (bar) bar.style.width = `${progress}%`;
            }}
          >
            {/* Dynamic Hero Section - Optimized for Mobile Viewports */}
            <div className="relative w-full min-h-[50dvh] md:min-h-[60vh] bg-black flex flex-col justify-end overflow-hidden shrink-0">
              <div className="absolute inset-0">
                <img 
                  src={selectedNews.image || "/tactical_intel_asset.png"} 
                  alt="" 
                  className="w-full h-full object-cover opacity-50 transition-opacity duration-1000"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/tactical_intel_asset.png";
                    (e.target as HTMLImageElement).classList.add('opacity-20');
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent md:hidden" />
              </div>
              
              <div className="relative z-10 w-full p-6 md:p-16">
                <div className="max-w-4xl mx-auto">
                  <div className="inline-flex items-center gap-3 px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-4 md:mb-6 backdrop-blur-md">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Lectura Prioritaria
                  </div>
                  <h2 className="text-2xl md:text-7xl font-black text-white tracking-tighter uppercase leading-[0.95] md:leading-[0.85] max-w-4xl drop-shadow-2xl">
                    {selectedNews.title}
                  </h2>
                </div>
              </div>
            </div>

            {/* Editorial Content */}
            {/* Editorial Content */}
            <div className="max-w-4xl mx-auto px-5 py-8 md:px-6 md:py-24">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20 items-start">
                <div className="lg:col-span-8 space-y-10 mt-4 md:mt-0">
                  <p className="text-lg md:text-3xl text-white/90 font-bold leading-tight border-l-4 border-emerald-500 pl-5 md:pl-10 italic bg-emerald-500/5 py-5 pr-5 rounded-r-2xl">
                    {selectedNews.summary}
                  </p>
                  
                  <div className="prose prose-invert max-w-none">
                    <div className="text-base md:text-xl text-white/70 leading-[1.7] md:leading-[1.8] space-y-8 md:space-y-10 font-medium tracking-tight">
                      {selectedNews.content.split('\n').map((p, i) => (
                        p.trim() && (
                          <p key={i} className="animate-in fade-in duration-1000 fill-mode-both">
                            {p}
                          </p>
                        )
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sidebar Info */}
                <aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-8 pb-10">
                  <div className="p-6 md:p-8 rounded-[24px] md:rounded-[32px] bg-white/[0.03] border border-white/5 backdrop-blur-sm space-y-6 md:space-y-8">
                    <h4 className="text-[9px] md:text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      Análisis_Técnico
                    </h4>
                    
                    <div className="space-y-5 md:space-y-6">
                      <MetaItem label="Origen de la Inteligencia" value={selectedNews.source.replace(/^https?:\/\/(www\.)?/, '').split('/')[0].toUpperCase()} />
                      <MetaItem label="Clasificación Sectorial" value={selectedNews.category || "GENERAL_INTEL"} />
                      <MetaItem label="Registro Temporal" value={new Date(selectedNews.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} />
                      <MetaItem label="Cripto-ID" value={`#VER-${selectedNews.id.substring(0, 8).toUpperCase()}`} />
                    </div>

                    <button className="w-full py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-emerald-500 text-black font-black uppercase text-[10px] md:text-[11px] tracking-[0.2em] hover:bg-emerald-400 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-95 flex items-center justify-center gap-3">
                      Descargar Dossier
                    </button>
                  </div>
                </aside>
              </div>

              <footer className="text-center py-16 md:py-24 mt-8 md:mt-12 space-y-6 pb-20 md:pb-0">
                <div className="flex items-center justify-center gap-4">
                  <div className="h-px w-10 md:w-12 bg-white/10" />
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500/40" />
                  <div className="h-px w-10 md:w-12 bg-white/10" />
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] md:text-[10px] font-mono text-white/20 uppercase tracking-[0.4em] md:tracking-[0.5em]">Fin de la Transmisión</p>
                  <p className="text-[7px] md:text-[8px] font-mono text-white/10 uppercase tracking-[0.2em] md:tracking-[0.3em]">Veridian News // Deep Intel Protocol</p>
                </div>
              </footer>
            </div>
          </main>
        </div>,
        document.body
      )}
    </div>
  );
};

const MetaItem = ({ label, value }: { label: string, value: string }) => (
  <div className="space-y-1">
    <p className="text-[8px] text-foreground/30 uppercase tracking-widest">{label}</p>
    <p className="text-[11px] font-bold text-foreground/80 uppercase tracking-tight">{value}</p>
  </div>
);

export default VeridianNews;
