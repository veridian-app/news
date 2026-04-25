import { useMemo } from "react";
import { Globe, AlertTriangle } from "lucide-react";
import { NewsItem } from "@/utils/news-utils";
import { cn } from "@/lib/utils";

interface GeopoliticsTickerProps {
  news: NewsItem[];
}

export const GeopoliticsTicker = ({ news }: GeopoliticsTickerProps) => {
  const geopoliticsNews = useMemo(() => {
    return news.filter(item => item.category === 'geopolítica').slice(0, 5);
  }, [news]);

  if (geopoliticsNews.length === 0) return null;

  return (
    <div className="w-full h-full bg-[#020408] border-b border-emerald-500 py-2 px-4 md:px-10 flex items-center gap-4 md:gap-8 overflow-hidden relative z-[1000] shadow-[0_4px_40px_rgba(16,185,129,0.3)]">
      {/* Tactical scanline effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none opacity-30" />
      <div className="absolute inset-0 bg-emerald-500/[0.03] pointer-events-none" />
      
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 relative z-10">
        <div className="relative">
          <Globe className="w-3.5 h-3.5 md:w-[18px] md:h-[18px] text-emerald-400 animate-spin-slow" />
          <div className="absolute inset-0 bg-emerald-400/50 blur-lg rounded-full animate-pulse" />
        </div>
        <div className="flex flex-col justify-center">
          <span className="text-[10px] md:text-[13px] font-tactical font-black text-emerald-400 tracking-[0.2em] md:tracking-[0.4em] whitespace-nowrap leading-none">
            CONFLICT_THEATER
          </span>
          <span className="text-[7px] md:text-[9px] font-tactical font-bold text-emerald-500/50 tracking-[0.1em] md:tracking-[0.2em] uppercase mt-0.5 hidden xs:block">
            Global Tactical Intelligence Feed
          </span>
        </div>
      </div>

      <div className="h-10 w-[1px] bg-emerald-500/20 mx-2 relative z-10" />

      <div className="flex-1 overflow-hidden relative group z-10">
        <div className="flex animate-infinite-scroll group-hover:[animation-play-state:paused] whitespace-nowrap gap-24 items-center h-full">
          {/* Render twice for seamless loop */}
          {[...geopoliticsNews, ...geopoliticsNews].map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="flex items-center gap-4 md:gap-5">
              <div className="w-1.5 h-1.5 md:w-2.5 md:h-2.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.7)]" />
              <span className="text-[11px] md:text-[13px] font-tactical text-zinc-50 hover:text-emerald-300 transition-colors cursor-pointer font-black tracking-wide uppercase">
                {item.title}
              </span>
              <span className="text-[8px] md:text-[10px] font-tactical text-emerald-400 font-black bg-emerald-500/20 px-1.5 py-0.5 md:px-2 md:py-1 rounded-sm border border-emerald-500/20 tabular-nums">
                {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
        
        {/* Stronger fades for depth */}
        <div className="absolute inset-y-0 left-0 w-12 md:w-28 bg-gradient-to-r from-[#020408] via-[#020408]/90 to-transparent z-20" />
        <div className="absolute inset-y-0 right-0 w-12 md:w-28 bg-gradient-to-l from-[#020408] via-[#020408]/90 to-transparent z-20" />
      </div>
    </div>
  );
};
