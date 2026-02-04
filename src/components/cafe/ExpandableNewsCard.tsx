import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Clock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

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

const RichText = ({ content, className }: { content: string; className?: string }) => (
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

export const ExpandableNewsCard = ({ item, index }: ExpandableNewsCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="w-full mb-6"
        >
            <motion.div
                layout
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300",
                    "bg-zinc-900/60 border border-white/5 hover:border-white/10",
                    isExpanded && "border-green-500/20"
                )}
            >
                {/* Image + Headline Section (Always visible) */}
                <motion.div layout className="relative">
                    {/* Image */}
                    <motion.div
                        layout
                        className={cn(
                            "relative w-full overflow-hidden transition-all duration-500",
                            isExpanded ? "aspect-[21/9]" : "aspect-[16/9]"
                        )}
                    >
                        <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                        />

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />

                        {/* Category badge */}
                        <div className="absolute top-3 left-3">
                            <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-medium text-green-400 border border-green-500/20 uppercase tracking-wider">
                                {item.category}
                            </span>
                        </div>

                        {/* Expand indicator */}
                        <motion.div
                            className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10"
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ChevronDown className="w-4 h-4 text-white/70" />
                        </motion.div>
                    </motion.div>

                    {/* Title overlay at bottom of image */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 pb-5">
                        <div className="flex items-center gap-2 text-zinc-400 text-xs mb-2">
                            <Clock className="w-3 h-3" />
                            <span>{item.readTime}</span>
                            {item.source && (
                                <>
                                    <span className="text-zinc-600">•</span>
                                    <span>{item.source}</span>
                                </>
                            )}
                        </div>
                        <h3 className="text-lg md:text-xl font-bold text-white leading-snug line-clamp-2">
                            {item.title}
                        </h3>
                    </div>
                </motion.div>

                {/* Expandable Content Section */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                        >
                            <div className="px-4 pb-5 pt-2">
                                {/* Summary */}
                                <p className="text-zinc-400 text-sm leading-relaxed mb-4 border-l-2 border-green-500/40 pl-3 italic">
                                    {item.summary}
                                </p>

                                {/* Full content */}
                                <div className="text-zinc-300 text-sm leading-relaxed">
                                    <RichText content={item.content} />
                                </div>

                                {/* Read more link if URL exists */}
                                {item.url && (
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1.5 text-green-400 text-sm font-medium mt-4 hover:text-green-300 transition-colors"
                                    >
                                        <span>Leer fuente original</span>
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.article>
    );
};
