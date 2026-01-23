import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CafeItem, HeadlineItem, StandardItem, CompactItem, VisualItem, DeepDiveItem } from "./data/cafeData";
import { Clock, TrendingUp, Quote, ExternalLink, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NewsBrewCardProps {
    data: CafeItem;
    current: number;
    total: number;
}

const CardContainer = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={cn("w-full max-w-2xl mx-auto mb-24 relative group", className)}
    >
        {children}
    </motion.div>
);

const MetaTag = ({ text, className }: { text: string; className?: string }) => (
    <span className={cn("px-3 py-1 bg-zinc-900/80 backdrop-blur-md rounded-full text-xs font-medium text-green-400 border border-green-500/20 uppercase tracking-wider", className)}>
        {text}
    </span>
);

// Helper Component for Rich Text Rendering
const RichText = ({ content, className }: { content: string, className?: string }) => {
    return (
        <div className={cn("space-y-6", className)}>
            {content.split('\n\n').map((paragraph, idx) => {
                // Check if paragraph is a list item (starts with - )
                if (paragraph.trim().startsWith('- ')) {
                    return (
                        <ul key={idx} className="list-disc pl-5 space-y-2 marker:text-green-500">
                            {paragraph.split('\n').map((item, i) => (
                                <li key={i} className="pl-2">
                                    {item.replace('- ', '').split(/(\*\*.*?\*\*)/).map((part, j) => {
                                        if (part.startsWith('**') && part.endsWith('**')) {
                                            return <span key={j} className="text-white font-semibold bg-green-500/10 px-1 rounded">{part.slice(2, -2)}</span>;
                                        }
                                        return part;
                                    })}
                                </li>
                            ))}
                        </ul>
                    );
                }

                return (
                    <p key={idx} className={idx === 0 ? "first-letter:text-5xl first-letter:font-bold first-letter:text-green-400 first-letter:mr-3 first-letter:float-left leading-relaxed" : "leading-relaxed"}>
                        {paragraph.split(/(\*\*.*?\*\*)/).map((part, i) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                // Highlight style
                                return <span key={i} className="text-green-200 font-semibold bg-green-900/30 px-1 rounded box-decoration-clone">{part.slice(2, -2)}</span>;
                            }
                            return part;
                        })}
                    </p>
                );
            })}
        </div>
    );
};

const SimpleRichText = ({ content, className }: { content: string, className?: string }) => {
    return (
        <div className={cn("space-y-4", className)}>
            {content.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="leading-relaxed">
                    {paragraph.split(/(\*\*.*?\*\*)/).map((part, i) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <span key={i} className="text-white font-medium">{part.slice(2, -2)}</span>;
                        }
                        return part;
                    })}
                </p>
            ))}
        </div>
    );
};

const ReadingTime = ({ time }: { time: string }) => (
    <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium uppercase tracking-wider">
        <Clock className="w-3.5 h-3.5" />
        <span>{time}</span>
    </div>
);

// 1. Headline Card (Hero)
const HeadlineCard = ({ data }: { data: HeadlineItem }) => (
    <CardContainer className="mb-32">
        <div className="relative aspect-[4/5] md:aspect-[16/10] w-full rounded-[2.5rem] overflow-hidden mb-8">
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent z-10" />
            <img src={data.imageUrl} alt={data.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />

            <div className="absolute bottom-0 left-0 p-8 md:p-12 z-20 w-full">
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    <MetaTag text={data.category} />
                    <ReadingTime time={data.readTime} />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-[1.1] tracking-tight">
                    {data.title}
                </h1>
                <p className="text-xl md:text-2xl text-zinc-300 font-light leading-snug max-w-3xl">
                    {data.subtitle}
                </p>
            </div>
        </div>

        <div className="px-4 md:px-8">
            <div className="flex items-center gap-4 mb-8 text-sm text-zinc-500 border-b border-white/10 pb-8">
                <div className="bg-green-500/20 w-10 h-10 rounded-full flex items-center justify-center text-green-400 font-bold">
                    {data.author?.[0] || 'V'}
                </div>
                <div>
                    <p className="text-white font-medium">{data.author || 'Veridian Editorial'}</p>
                    <p>Reportaje Especial</p>
                </div>
            </div>

            <div className="prose prose-invert prose-lg md:prose-xl max-w-none text-zinc-300 leading-relaxed space-y-6">
                <RichText content={data.content} />
            </div>
        </div>
    </CardContainer>
);

// 2. Standard Card
const StandardCard = ({ data }: { data: StandardItem }) => (
    <CardContainer>
        <div className="rounded-3xl overflow-hidden bg-zinc-900/40 border border-white/5">
            <div className="aspect-video relative overflow-hidden">
                <img src={data.imageUrl} alt={data.title} className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4">
                    <MetaTag text={data.category} />
                </div>
            </div>
            <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-4">
                    <ReadingTime time={data.readTime} />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">{data.title}</h2>
                <div className="text-zinc-400 text-lg leading-relaxed whitespace-pre-line">
                    <SimpleRichText content={data.content} />
                </div>
            </div>
        </div>
    </CardContainer>
);

// 3. Compact Card (Espresso Shots - Expandable Takes)
const CompactCard = ({ data }: { data: CompactItem }) => {
    // Track expanded state for each item by ID
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const toggleItem = (id: string) => {
        const next = new Set(expandedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setExpandedIds(next);
    };

    return (
        <CardContainer>
            <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-widest">{data.title}</h3>
                </div>

                <div className="grid gap-4">
                    {data.items.map((item, idx) => {
                        const isExpanded = expandedIds.has(item.id);
                        return (
                            <motion.div
                                layout
                                key={item.id}
                                onClick={() => toggleItem(item.id)}
                                className={cn(
                                    "group/item cursor-pointer rounded-2xl p-5 border border-transparent transition-all duration-300",
                                    isExpanded ? "bg-zinc-800/40 border-white/5" : "hover:bg-zinc-800/20"
                                )}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-semibold text-orange-400/80 uppercase tracking-wider">{item.category}</span>
                                    <div className="flex items-center gap-2 text-zinc-500">
                                        <span className="text-xs">{item.time}</span>
                                        <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isExpanded ? "rotate-180" : "text-zinc-600")} />
                                    </div>
                                </div>
                                <h4 className={cn("text-lg font-bold text-zinc-200 mb-1 transition-colors", !isExpanded && "group-hover/item:text-orange-400")}>
                                    {item.title}
                                </h4>
                                <p className="text-zinc-400 text-sm leading-relaxed">{item.summary}</p>

                                <AnimatePresence>
                                    {isExpanded && item.details && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                            animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="text-zinc-300 text-sm border-t border-white/5 pt-3">
                                                <SimpleRichText content={item.details} />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </CardContainer>
    );
};

// 4. Visual Card (Expandable Story)
const VisualCard = ({ data }: { data: VisualItem }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <CardContainer>
            <div className="relative rounded-3xl overflow-hidden group/visual bg-zinc-900">
                {/* Image Container - shrinks when expanded */}
                <motion.div
                    layout
                    className={cn("relative w-full overflow-hidden", isExpanded ? "aspect-[21/9]" : "aspect-[4/3] md:aspect-video")}
                >
                    <img src={data.imageUrl} alt={data.title} className="w-full h-full object-cover" />
                    <div className={cn("absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-500", isExpanded ? "opacity-40" : "opacity-100")} />

                    {/* Collapsed Overlay */}
                    <motion.div
                        animate={{ opacity: isExpanded ? 0 : 1 }}
                        className="absolute bottom-0 left-0 p-6 md:p-8 w-full pointer-events-none"
                    >
                        <div className="flex items-center gap-2 text-white/80 mb-2">
                            <Quote className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">{data.title}</span>
                        </div>
                        <p className="text-xl md:text-2xl text-white font-serif italic leading-relaxed line-clamp-3">
                            "{data.caption}"
                        </p>
                    </motion.div>
                </motion.div>

                {/* Content Container (Expanded) */}
                <div className="relative">
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="p-6 md:p-8 pt-4">
                                    <div className="flex items-center gap-2 text-green-400 mb-4">
                                        <Quote className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-widest">{data.title}</span>
                                    </div>
                                    <p className="text-xl md:text-2xl text-white font-serif italic leading-relaxed mb-6">
                                        "{data.caption}"
                                    </p>
                                    <div className="prose prose-invert prose-sm md:prose-base text-zinc-300 leading-relaxed">
                                        {data.content && <SimpleRichText content={data.content} />}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Toggle Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="absolute right-4 -top-6 z-20 bg-black/50 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white rounded-full px-4"
                    >
                        <span className="mr-2 text-xs uppercase tracking-wider">{isExpanded ? "Reducir" : "Leer análisis"}</span>
                        <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isExpanded ? "rotate-180" : "")} />
                    </Button>
                </div>
            </div>
        </CardContainer>
    );
};

// 5. Deep Dive Card
const DeepDiveCard = ({ data }: { data: DeepDiveItem }) => (
    <CardContainer>
        <div className="bg-zinc-950 border-y border-white/10 py-12 px-4 md:px-0">
            <div className="text-center mb-10">
                <MetaTag text={data.category} className="bg-blue-500/10 text-blue-400 border-blue-500/20 mb-4 inline-block" />
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">{data.title}</h2>
                <p className="text-xl text-zinc-400 max-w-2xl mx-auto">{data.subtitle}</p>
            </div>

            <div className="aspect-[21/9] rounded-2xl overflow-hidden mb-10 grayscale hover:grayscale-0 transition-all duration-700">
                <img src={data.imageUrl} alt={data.title} className="w-full h-full object-cover" />
            </div>

            <div className="prose prose-lg prose-invert mx-auto text-zinc-300 leading-loose">
                <RichText content={data.content} />
            </div>
        </div>
    </CardContainer>
);

export const NewsBrewCard = ({ data, current, total }: NewsBrewCardProps) => {
    switch (data.type) {
        case 'headline':
            return <HeadlineCard data={data} />;
        case 'standard':
            return <StandardCard data={data} />;
        case 'compact':
            return <CompactCard data={data} />;
        case 'visual':
            return <VisualCard data={data} />;
        case 'deep-dive':
            return <DeepDiveCard data={data} />;
        default:
            return null;
    }
};
