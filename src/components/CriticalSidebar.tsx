import { useMemo } from "react";
import { AlertTriangle, ChevronRight, Activity } from "lucide-react";
import { NewsItem } from "@/utils/news-utils";
import { cn } from "@/lib/utils";

interface CriticalSidebarProps {
  news: NewsItem[];
  onReadMore: (item: NewsItem) => void;
}

export const CriticalSidebar = ({ news, onReadMore }: CriticalSidebarProps) => {
  const criticalNews = useMemo(() => {
    return news.filter(item => 
      item.category?.toLowerCase() === 'geopolítica' || 
      (item.bias && item.bias > 80)
    ).slice(0, 6);
  }, [news]);

  if (criticalNews.length === 0) return null;

  return (
    <div className="hidden lg:flex flex-col w-72 h-fit max-h-[80vh] bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] sticky top-24 mr-8">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-red-500/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
            <div className="absolute inset-0 bg-red-500/50 blur-md rounded-full animate-pulse" />
          </div>
          <span className="text-[11px] font-black font-tactical text-red-500 tracking-[0.2em] uppercase">
            Critical_Alerts
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Activity className="w-3 h-3 text-red-500/50" />
          <span className="text-[9px] font-mono text-red-500/50 uppercase">Live</span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-2">
        {criticalNews.map((item) => (
          <div 
            key={item.id}
            onClick={() => onReadMore(item)}
            className="group p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer relative overflow-hidden"
          >
            {/* Hover indicator */}
            <div className="absolute left-0 top-0 w-[2px] h-0 bg-red-500 group-hover:h-full transition-all duration-300" />
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-black text-red-500/60 uppercase tracking-widest px-1.5 py-0.5 bg-red-500/10 rounded">
                  {item.category === 'geopolítica' ? 'Geo_Intel' : 'High_Bias'}
                </span>
                <span className="text-[8px] font-mono text-white/20 tabular-nums">
                  {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h3 className="text-[11px] font-bold text-white/80 leading-snug group-hover:text-white transition-colors line-clamp-2 uppercase tracking-tight">
                {item.title}
              </h3>
              <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-tighter flex items-center gap-1">
                  View Intel <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Decoration */}
      <div className="p-3 border-t border-white/5 bg-black/20">
        <div className="flex items-center justify-between opacity-30">
          <div className="h-px flex-1 bg-white/20" />
          <span className="mx-2 text-[7px] font-mono uppercase tracking-[0.3em]">End_Transmission</span>
          <div className="h-px flex-1 bg-white/20" />
        </div>
      </div>
    </div>
  );
};
