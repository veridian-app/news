import { useState, useRef, useEffect } from "react";
import { NewsImage } from "./NewsImage";
import { cn } from "@/lib/utils";
import { Share2, BookOpen } from "lucide-react";
import { DoubleTapOverlay } from "./DoubleTapOverlay";
import { useHaptic } from "@/hooks/use-haptic";
import { useDockVisibility } from "@/contexts/DockVisibilityContext";
import { useSavedNews } from "@/hooks/use-saved-news";
import { NewsItem } from "@/utils/news-utils";
import { ShareModal } from "./ShareModal";

interface NewsCardProps {
    item: NewsItem;
    isActive: boolean;
    index: number;
    onLike: () => void;
    onShare: () => void;
    onReadMore: () => void;
    category?: string;
}

export const NewsCard = ({ item, isActive, index, onLike, onShare, onReadMore, category }: NewsCardProps) => {
    const lastTap = useRef<number>(0);
    const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
    const [tapPosition, setTapPosition] = useState({ x: 0, y: 0 });
    const [showShareModal, setShowShareModal] = useState(false);
    const { trigger: haptic } = useHaptic();
    const { hideDock, showDock } = useDockVisibility();
    const { isSaved, toggleSave } = useSavedNews();

    const isItemSaved = isSaved(item.id);

    useEffect(() => {
        if (showShareModal) hideDock();
        else showDock();
    }, [showShareModal, hideDock, showDock]);

    const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (now - lastTap.current < DOUBLE_TAP_DELAY) {
            const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

            setTapPosition({ x: clientX, y: clientY });
            setShowDoubleTapHeart(true);
            haptic('medium');

            if (!item.isLiked) onLike();
            setTimeout(() => setShowDoubleTapHeart(false), 800);
        }
        lastTap.current = now;
    };

    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        haptic('light');
        setShowShareModal(true);
    };

    return (
        <>
            <div className="relative h-full w-full overflow-hidden select-none" onClick={handleTap}>
                <DoubleTapOverlay showLike={showDoubleTapHeart} position={tapPosition} />

                {/* Background Image with Tactical Overlays */}
                <div className="absolute inset-0 z-0 noise-overlay tactical-scan">
                    {item.image ? (
                        <div className="w-full h-full overflow-hidden intelligence-grid">
                            <NewsImage
                                src={item.image}
                                alt={item.title}
                                className={cn(
                                    "h-full w-full object-cover transition-all duration-[20s] ease-linear will-change-transform",
                                    isActive ? "scale-110 opacity-50 grayscale-[0.3]" : "scale-105 opacity-30 grayscale-[0.6]"
                                )}
                                priority={index < 2}
                            />
                        </div>
                    ) : (
                        <div className="h-full w-full bg-[#020305] intelligence-grid" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#020305]/90 via-transparent via-40% to-[#020305]" />
                </div>


                {/* Content Layer - Increased padding to clear Command Center bars */}
                <div className="absolute inset-0 z-10 flex flex-col justify-start p-8 pt-64 pb-32 md:p-12 md:pt-72 md:pb-40 corner-accent corner-accent-tl corner-accent-br">
                    <div className="max-w-[620px] w-full flex flex-col gap-6">
                        <div className="flex items-center gap-4 transition-all duration-700 ease-out mb-2">
                            <div className={cn(
                                "px-4 py-1.5 border rounded-sm backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.1)]",
                                category?.toLowerCase() === 'geopolítica' 
                                    ? "bg-emerald-500/20 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
                                    : "bg-black/60 border-white/20"
                            )}>
                                <span className={cn(
                                    "text-[12px] font-black font-tactical tracking-[0.25em] uppercase",
                                    category?.toLowerCase() === 'geopolítica' ? "text-white" : "text-emerald-400"
                                )}>
                                    {category?.toLowerCase() === 'geopolítica' ? "⚠️ PRIORITY_GEOPOLITICS" : `INTEL_CLASS: ${category || "GENERAL"}`}
                                </span>
                            </div>
                            <div className="h-[1px] flex-1 bg-emerald-500/20" />
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                                <div className="text-[10px] font-mono text-emerald-500 font-bold uppercase tracking-widest">Intel_Ready</div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="flex-1 space-y-6">
                                <h2 
                                    onClick={onReadMore}
                                    className="text-[26px] leading-[1.05] md:text-5xl font-black text-white tracking-tighter uppercase line-clamp-4 cursor-pointer hover:text-emerald-400 transition-colors"
                                >
                                    {item.title}
                                </h2>
                            </div>

                            <div className="w-full md:w-[240px] aspect-video md:aspect-square relative group shrink-0">
                                {/* Tactical Frame Accents */}
                                <div className="absolute -inset-1.5 border border-emerald-500/30 group-hover:border-emerald-400/60 transition-all duration-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]" />
                                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-400 z-20" />
                                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-400 z-20" />
                                
                                <div className="w-full h-full overflow-hidden bg-black relative">
                                    <img 
                                        src={item.image || "/tactical_intel_asset.png"} 
                                        alt="Tactical Intel Asset" 
                                        className="w-full h-full object-cover opacity-90 transition-all duration-1000 group-hover:scale-105" 
                                    />
                                    
                                    <div className="absolute inset-0 pointer-events-none z-10">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-500/20 animate-scan-y" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Minimal Meta Bar */}
                        <div className="flex items-center justify-between border-b border-white/5 pb-4 mt-2">
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-tactical text-white/20 uppercase tracking-widest">Source</span>
                                    <span className="text-[10px] font-bold text-white/60 tracking-wider uppercase">{item.source || 'VERIDIAN'}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-tactical text-white/20 uppercase tracking-widest">Est_Read</span>
                                    <span className="text-[10px] font-bold text-emerald-500/60 font-tactical uppercase tracking-widest">04:00_MIN</span>
                                </div>
                            </div>
                            <div className="px-2 py-0.5 rounded-full border border-emerald-500/10 bg-emerald-500/5">
                                <span className="text-[8px] font-tactical text-emerald-400/50 uppercase tracking-widest">
                                    {category === 'geopolítica' ? "High_Priority" : "Standard_Intel"}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-6">
                            <p className="text-[14px] md:text-[16px] text-white/70 line-clamp-3 font-medium leading-relaxed border-l-2 border-emerald-500/40 pl-4 bg-emerald-500/[0.02] py-2 pr-2">
                                {item.summary}
                            </p>
                            <div className="flex items-center justify-between">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onReadMore(); }} 
                                    className="group relative inline-flex items-center gap-4 py-3 px-8 border border-emerald-500/60 hover:bg-emerald-500/20 transition-all bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)] active:scale-[0.98]"
                                >
                                    <div className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-[2px] h-4 bg-emerald-500 animate-pulse" />
                                    <BookOpen className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-[12px] font-black font-tactical text-white tracking-[0.2em] uppercase">Deploy_Full_Intel</span>
                                    <span className="text-emerald-400 group-hover:translate-x-2 transition-transform duration-500">→</span>
                                </button>
                                
                                <button onClick={handleShare} className="flex items-center gap-3 group px-4 py-2 border border-white/10 hover:border-emerald-500/20 transition-all">
                                    <span className="text-[10px] font-tactical text-white/30 group-hover:text-emerald-400 uppercase">Broadcast</span>
                                    <Share2 className="w-4 h-4 text-white/40 group-hover:text-emerald-400" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} item={item} />
        </>
    );
};
