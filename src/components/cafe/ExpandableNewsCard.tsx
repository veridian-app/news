import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Clock, ExternalLink, Share2, X, Link, Twitter, Facebook } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

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
    <div className="flex items-center justify-center py-5">
        <div className="w-12 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
);

// Función para dividir texto largo en párrafos legibles
const formatTextIntoParagraphs = (text: string): string[] => {
    // Si ya tiene saltos de línea dobles, usarlos
    if (text.includes('\n\n')) {
        return text.split('\n\n').filter(p => p.trim().length > 0);
    }
    // Si tiene saltos simples, usarlos
    if (text.includes('\n')) {
        return text.split('\n').filter(p => p.trim().length > 0);
    }

    // Si no, dividir inteligentemente por oraciones (cada 2-3 oraciones = 1 párrafo)
    const sentences = text.split(/(?<=[.!?])\s+/);
    const paragraphs: string[] = [];
    let currentParagraph: string[] = [];

    sentences.forEach((sentence) => {
        currentParagraph.push(sentence);
        if (currentParagraph.length >= 3 ||
            (currentParagraph.length >= 2 && currentParagraph.join(' ').length > 350)) {
            paragraphs.push(currentParagraph.join(' '));
            currentParagraph = [];
        }
    });

    if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join(' '));
    }

    return paragraphs;
};

const RichText = ({ content, className }: { content: string; className?: string }) => {
    const paragraphs = formatTextIntoParagraphs(content);

    return (
        <div className={cn("space-y-6", className)}>
            {paragraphs.map((paragraph, idx) => {
                const isFirstParagraph = idx === 0;
                const showDivider = idx > 0 && idx % 3 === 0;

                return (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.35,
                            delay: idx * 0.06,
                            ease: [0.25, 0.1, 0.25, 1]
                        }}
                    >
                        {showDivider && <DecorativeDivider />}
                        <p className={cn(
                            "text-zinc-300 leading-[1.85] tracking-wide",
                            isFirstParagraph ? "text-[15px] text-zinc-200 font-medium" : "text-sm"
                        )}>
                            {paragraph}
                        </p>
                    </motion.div>
                );
            })}
        </div>
    );
};

// Share modal component
const ShareModal = ({ isOpen, onClose, item }: { isOpen: boolean; onClose: () => void; item: ExpandableNewsItem }) => {
    // Generar URL interna para deep linking
    const shareUrl = `${window.location.origin}/veridian-news?newsId=${item.id}`;

    // Texto para compartir
    const shareTitle = item.title;
    const shareText = `${item.title}\n\nLee la historia completa en Café Veridian:`;
    const shareTextTwitter = `${item.title.substring(0, 200)}${item.title.length > 200 ? '...' : ''}\n\n📰 @VeridianNews`;

    // Detectar si estamos en móvil
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    const shareOptions = [
        {
            name: "WhatsApp",
            icon: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg",
            color: "bg-[#25D366]",
            action: () => {
                const text = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
                const url = isMobile
                    ? `whatsapp://send?text=${text}`
                    : `https://api.whatsapp.com/send?text=${text}`;
                window.open(url, '_blank');
            }
        },
        {
            name: "WhatsApp Status",
            icon: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg",
            color: "bg-[#128C7E]",
            action: () => {
                const text = encodeURIComponent(`📰 ${shareTitle}\n\n${shareUrl}`);
                const url = isMobile
                    ? `whatsapp://send?text=${text}`
                    : `https://api.whatsapp.com/send?text=${text}`;
                window.open(url, '_blank');
            }
        },
        {
            name: "Instagram",
            icon: "https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg",
            color: "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]",
            action: () => {
                navigator.clipboard.writeText(`${shareTitle}\n\n${shareUrl}`);
                toast({
                    title: "📋 Texto copiado",
                    description: "Abre Instagram y pégalo en tu historia o publicación",
                });
                if (isMobile) {
                    window.location.href = 'instagram://';
                }
                onClose();
            }
        },
        {
            name: "Twitter / X",
            icon: "https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg",
            color: "bg-black",
            action: () => {
                const text = encodeURIComponent(shareTextTwitter);
                const urlParam = encodeURIComponent(shareUrl);
                const url = isMobile
                    ? `twitter://post?message=${text}%20${urlParam}`
                    : `https://twitter.com/intent/tweet?text=${text}&url=${urlParam}`;
                window.open(url, '_blank');
            }
        },
        {
            name: "Facebook",
            icon: "https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png",
            color: "bg-[#1877F2]",
            action: () => {
                const urlParam = encodeURIComponent(shareUrl);
                if (isMobile) {
                    window.location.href = `fb://share/?link=${urlParam}`;
                    setTimeout(() => {
                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${urlParam}`, '_blank');
                    }, 500);
                } else {
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${urlParam}`, '_blank');
                }
            }
        },
        {
            name: "Copiar enlace",
            icon: null,
            emoji: "🔗",
            color: "bg-white/10",
            action: () => {
                navigator.clipboard.writeText(shareUrl);
                toast({
                    title: "✅ Enlace copiado",
                    description: "Compártelo donde quieras",
                });
                onClose();
            }
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="w-full max-w-md bg-zinc-900 rounded-t-3xl p-6 pb-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white">Compartir noticia</h3>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 mb-6">
                            {item.imageUrl && (
                                <img
                                    src={item.imageUrl}
                                    alt=""
                                    className="w-16 h-16 rounded-lg object-cover"
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white line-clamp-2">{item.title}</p>
                                <p className="text-xs text-white/50 mt-1">Café Veridian</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {shareOptions.map((option) => (
                                <button
                                    key={option.name}
                                    onClick={option.action}
                                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", option.color)}>
                                        {option.icon ? (
                                            <img src={option.icon} alt="" className="w-6 h-6" />
                                        ) : (
                                            <span className="text-2xl">{option.emoji}</span>
                                        )}
                                    </div>
                                    <span className="text-xs text-white/70 text-center">{option.name}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export const ExpandableNewsCard = ({ item, index }: ExpandableNewsCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowShareModal(true);
    };

    return (
        <>
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

                            {/* Controls: Share + Expand */}
                            <div className="absolute top-3 right-3 flex items-center gap-2">
                                <motion.button
                                    onClick={handleShare}
                                    className="p-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/10 transition-colors group"
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <Share2 className="w-4 h-4 text-white/90 group-hover:text-green-400 transition-colors" />
                                </motion.button>

                                <motion.div
                                    className="p-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10"
                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <ChevronDown className="w-4 h-4 text-white/70" />
                                </motion.div>
                            </div>
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
                                        <div className="flex items-center gap-3 mt-8">
                                            <motion.a
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: 0.2 }}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 hover:border-green-500/50 rounded-full text-green-400 hover:text-green-300 text-sm font-medium transition-all duration-300 backdrop-blur-sm group"
                                            >
                                                <span>Leer fuente original</span>
                                                <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                            </motion.a>
                                            {/* Share Button (Bottom) */}
                                            <motion.button
                                                onClick={handleShare}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: 0.25 }}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-zinc-300 text-sm font-medium transition-all"
                                            >
                                                <Share2 className="w-4 h-4" />
                                                <span>Compartir</span>
                                            </motion.button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.article>

            {/* Share Modal */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                item={item}
            />
        </>
    );
};

