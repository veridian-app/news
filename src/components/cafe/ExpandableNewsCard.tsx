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

// Separador decorativo minimalista
const DecorativeDivider = () => (
    <div className="flex items-center justify-center py-6 opacity-40">
        <div className="flex items-center gap-3">
            <div className="w-8 h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
            <div className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
            <div className="w-8 h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
        </div>
    </div>
);

// Componente para renderizar texto con formato (negrita, etc.)
const FormattedText = ({ text, isFirstParagraph }: { text: string; isFirstParagraph?: boolean }) => {
    const parts = text.split(/(\*\*.*?\*\*)/);

    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    // Texto en negrita con estilo destacado
                    return (
                        <span
                            key={i}
                            className="font-semibold text-white bg-gradient-to-r from-green-500/10 to-emerald-500/10 px-1.5 py-0.5 rounded-md border-l-2 border-green-500/40"
                        >
                            {part.slice(2, -2)}
                        </span>
                    );
                }
                // Para el primer párrafo, aplicar Drop Cap al primer carácter
                if (isFirstParagraph && i === 0 && part.length > 0) {
                    const firstChar = part.charAt(0);
                    const rest = part.slice(1);
                    return (
                        <span key={i}>
                            <span className="float-left text-5xl font-bold text-green-400 leading-none mr-2 mt-1 font-serif">
                                {firstChar}
                            </span>
                            {rest}
                        </span>
                    );
                }
                return part;
            })}
        </>
    );
};

const RichText = ({ content, className }: { content: string; className?: string }) => {
    const paragraphs = content.split('\n\n').filter(p => p.trim());

    return (
        <div className={cn("space-y-6", className)}>
            {paragraphs.map((paragraph, idx) => {
                const isFirstParagraph = idx === 0;
                const showDivider = idx > 0 && idx % 3 === 0; // Divisor cada 3 párrafos

                return (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.4,
                            delay: idx * 0.08,
                            ease: [0.25, 0.1, 0.25, 1]
                        }}
                    >
                        {showDivider && <DecorativeDivider />}
                        <p className={cn(
                            "leading-loose text-zinc-300 tracking-wide",
                            isFirstParagraph && "text-base first-letter:text-transparent" // Hide default first-letter when using Drop Cap
                        )}>
                            <FormattedText text={paragraph} isFirstParagraph={isFirstParagraph} />
                        </p>
                    </motion.div>
                );
            })}
        </div>
    );
};

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
                            <div className="px-5 pb-6 pt-4">
                                {/* Summary/Lead - estilo editorial destacado */}
                                {item.summary && item.summary.trim() && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="mb-6"
                                    >
                                        <p className="text-zinc-200 text-base leading-relaxed font-medium border-l-3 border-green-500 pl-4 py-2 bg-gradient-to-r from-green-500/5 to-transparent rounded-r-lg">
                                            {item.summary}
                                        </p>
                                    </motion.div>
                                )}

                                {/* Full content */}
                                <div className="text-zinc-300 text-[15px]">
                                    {item.content && item.content.trim() ? (
                                        <RichText content={item.content} />
                                    ) : (
                                        <p className="text-zinc-500 italic">Esta noticia no tiene contenido expandido disponible.</p>
                                    )}
                                </div>

                                {/* Read more link if URL exists - diseño mejorado */}
                                {item.url && (
                                    <motion.a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.2 }}
                                        className="inline-flex items-center gap-2 mt-8 px-5 py-2.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 hover:border-green-500/50 rounded-full text-green-400 hover:text-green-300 text-sm font-medium transition-all duration-300 backdrop-blur-sm group"
                                    >
                                        <span>Leer fuente original</span>
                                        <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </motion.a>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.article>
    );
};
