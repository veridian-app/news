import { useState } from "react";
import { ChevronDown, Clock, ExternalLink, Share2, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { toast } from "../../hooks/use-toast";

export interface ExpandableNewsItem {
    id: string;
    title: string;
    summary: string;
    content: string;
    imageUrl: string;
    category: string;
    readTime: string;
    source?: string;
    url?: string;
}

interface ExpandableNewsCardProps {
    item: ExpandableNewsItem;
    index: number;
}

const formatTextIntoParagraphs = (text: string): string[] => {
    if (!text) return [];
    return text.split('\n').filter(p => p.trim().length > 0);
};

const RichText = ({ content }: { content: string }) => {
    const paragraphs = formatTextIntoParagraphs(content);
    return (
        <div className="space-y-6">
            {paragraphs.map((paragraph, idx) => (
                <p key={idx} className="text-zinc-400 leading-relaxed text-base md:text-lg">
                    {paragraph}
                </p>
            ))}
        </div>
    );
};

export const ExpandableNewsCard = ({ item }: ExpandableNewsCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    const getDomain = (url: string | undefined) => {
        if (!url) return 'VERIDIAN INTEL';
        try {
            const domain = url.includes('://') ? url.split('://')[1].split('/')[0] : url.split('/')[0];
            return domain.replace('www.', '').toUpperCase();
        } catch (e) {
            return 'VERIDIAN INTEL';
        }
    };

    const domain = getDomain(item.source || item.url);

    return (
        <article className="w-full mb-12">
            <div 
                className={cn(
                    "group relative rounded-[2.5rem] overflow-hidden transition-all duration-500 border border-white/10 bg-zinc-950 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)]",
                    isExpanded ? "ring-2 ring-green-500/30" : "hover:border-white/20"
                )}
            >
                {/* Image Section - Now limited to top part */}
                <div 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={cn(
                        "relative overflow-hidden cursor-pointer transition-all duration-700",
                        isExpanded ? "h-[30vh] md:h-[40vh]" : "h-[45vh] md:h-[55vh]"
                    )}
                >
                    <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        className={cn(
                            "w-full h-full object-cover transition-transform duration-1000",
                            !isExpanded && "group-hover:scale-105"
                        )}
                    />
                    
                    {/* Darker Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                    
                    {/* Top Floating Badge */}
                    <div className="absolute top-6 left-6 z-20">
                        <div className="px-4 py-2 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl">
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{item.category}</span>
                        </div>
                    </div>

                    {/* Share Button */}
                    <div className="absolute top-6 right-6 z-20">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowShareModal(true); }}
                            className="p-3 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 hover:bg-white/10 transition-all text-white shadow-2xl"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* SOLID CONTENT AREA - Absolute Legibility */}
                <div 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="relative p-8 md:p-10 bg-zinc-950 cursor-pointer"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.3em] bg-green-500/5 px-3 py-1 rounded-lg border border-green-500/20">
                            {domain}
                        </span>
                        <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{item.readTime}</span>
                        </div>
                    </div>
                    
                    <h3 className={cn(
                        "font-black text-white leading-[1.1] tracking-tighter uppercase transition-all duration-500",
                        isExpanded ? "text-3xl md:text-5xl mb-8" : "text-2xl md:text-4xl"
                    )}>
                        {item.title}
                    </h3>

                    {/* Expanded Content */}
                    {isExpanded && (
                        <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-500">
                            {item.summary && (
                                <div className="mb-10 p-8 bg-white/[0.02] rounded-[2rem] border border-white/5">
                                    <p className="text-zinc-200 text-xl md:text-2xl font-bold leading-tight italic opacity-90">
                                        "{item.summary}"
                                    </p>
                                </div>
                            )}
                            
                            <div className="max-w-3xl">
                                {item.content ? <RichText content={item.content} /> : (
                                    <p className="text-zinc-600 italic">Análisis en curso...</p>
                                )}

                                {item.url && (
                                    <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <a 
                                            href={item.url} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-full md:w-auto px-10 py-5 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-zinc-200 transition-all shadow-2xl text-center"
                                        >
                                            Leer noticia completa
                                        </a>
                                        <p className="text-[10px] font-mono text-zinc-700 uppercase tracking-[0.3em]">
                                            VERIDIAN_INTEL_PROTOCOL_V4
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* Expand/Collapse Indicator */}
                    <div className="absolute bottom-6 right-8">
                        <ChevronDown className={cn("w-6 h-6 text-zinc-700 transition-transform duration-500", isExpanded && "rotate-180")} />
                    </div>
                </div>
            </div>

            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl" onClick={() => setShowShareModal(false)}>
                    <div className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-[3rem] p-10" onClick={e => e.stopPropagation()}>
                        <h4 className="text-xl font-black text-white uppercase mb-8 tracking-tighter">Compartir noticia</h4>
                        <div className="p-6 bg-white/5 rounded-3xl mb-10 border border-white/5">
                            <p className="text-sm font-bold text-white line-clamp-3 uppercase leading-tight">{item.title}</p>
                        </div>
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                toast({ title: "Copiado al portapapeles" });
                                setShowShareModal(false);
                            }}
                            className="w-full py-5 bg-white text-black font-black uppercase text-xs tracking-widest rounded-2xl shadow-2xl active:scale-95 transition-all"
                        >
                            Copiar enlace
                        </button>
                    </div>
                </div>
            )}
        </article>
    );
};
