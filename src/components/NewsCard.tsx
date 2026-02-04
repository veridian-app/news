import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NewsImage } from "./NewsImage";
import { cn } from "@/lib/utils";
import { Heart, Share2, Bookmark, X } from "lucide-react";
import { DoubleTapOverlay } from "./DoubleTapOverlay";
import { useHaptic } from "@/hooks/use-haptic";
import { toast } from "@/hooks/use-toast";
import { useDockVisibility } from "@/contexts/DockVisibilityContext";

export interface NewsItem {
    id: string;
    title: string;
    summary: string;
    content: string;
    image?: string;
    date: string;
    source: string;
    url?: string;
    likes?: number;
    comments?: number;
    isLiked?: boolean;
    isSaved?: boolean;
}

interface NewsCardProps {
    item: NewsItem;
    isActive: boolean;
    index: number;
    onLike: () => void;
    onComment: () => void;
    onShare: () => void;
    onReadMore: () => void;
}

// Share modal component
const ShareModal = ({ isOpen, onClose, item }: { isOpen: boolean; onClose: () => void; item: NewsItem }) => {
    const shareUrl = `https://veridian.news/noticia/${item.id}`;
    const shareTitle = item.title;
    const shareText = `${item.title}\n\nLee más en Veridian - Noticias sin sesgos`;
    const shareTextTwitter = `${item.title.substring(0, 200)}${item.title.length > 200 ? '...' : ''}\n\n📰 @VeridianNews`;

    const shareOptions = [
        {
            name: "WhatsApp",
            icon: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg",
            color: "bg-[#25D366]",
            action: () => {
                const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
                window.open(url, '_blank');
            }
        },
        {
            name: "WhatsApp Status",
            icon: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg",
            color: "bg-[#128C7E]",
            action: () => {
                // WhatsApp doesn't have a direct status API, but we can share the image URL
                const url = `https://api.whatsapp.com/send?text=${encodeURIComponent('📰 ' + shareTitle + '\n\n' + shareUrl)}`;
                window.open(url, '_blank');
            }
        },
        {
            name: "Instagram",
            icon: "https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg",
            color: "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]",
            action: () => {
                // Instagram doesn't support direct web sharing, copy link instead
                navigator.clipboard.writeText(shareUrl);
                toast({
                    title: "📋 Enlace copiado",
                    description: "Abre Instagram y pégalo en tu historia o publicación",
                });
                onClose();
            }
        },
        {
            name: "Twitter / X",
            icon: "https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg",
            color: "bg-black",
            action: () => {
                const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTextTwitter)}&url=${encodeURIComponent(shareUrl)}`;
                window.open(url, '_blank');
            }
        },
        {
            name: "Facebook",
            icon: "https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png",
            color: "bg-[#1877F2]",
            action: () => {
                const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareTitle)}`;
                window.open(url, '_blank');
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
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white">Compartir noticia</h3>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        {/* Preview */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 mb-6">
                            {item.image && (
                                <img
                                    src={item.image}
                                    alt=""
                                    className="w-16 h-16 rounded-lg object-cover"
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white line-clamp-2">{item.title}</p>
                                <p className="text-xs text-white/50 mt-1">veridian.news</p>
                            </div>
                        </div>

                        {/* Share Options */}
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

export const NewsCard = ({ item, isActive, index, onLike, onComment, onShare, onReadMore }: NewsCardProps) => {
    // Logic for double tap
    const lastTap = useRef<number>(0);
    const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
    const [tapPosition, setTapPosition] = useState({ x: 0, y: 0 });
    const [showShareModal, setShowShareModal] = useState(false);
    const { trigger: haptic } = useHaptic();
    const { hideDock, showDock } = useDockVisibility();

    // Hide dock when share modal opens, show when it closes
    useEffect(() => {
        if (showShareModal) {
            hideDock();
        } else {
            showDock();
        }
    }, [showShareModal, hideDock, showDock]);

    const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (now - lastTap.current < DOUBLE_TAP_DELAY) {
            // Double tap detected
            const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

            setTapPosition({ x: clientX, y: clientY });
            setShowDoubleTapHeart(true);
            haptic('medium');

            // Trigger like functionality
            if (!item.isLiked) {
                onLike();
            }

            setTimeout(() => setShowDoubleTapHeart(false), 800);
        }

        lastTap.current = now;
    };

    const handleSave = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        haptic('light');
        toast({
            title: "🔜 Próximamente",
            description: "La función de guardar estará disponible muy pronto",
        });
    };

    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        haptic('light');
        setShowShareModal(true);
    };

    return (
        <>
            <div
                className="relative h-[100dvh] w-full snap-start snap-always overflow-hidden bg-black select-none"
                onClick={handleTap}
            >
                <DoubleTapOverlay showLike={showDoubleTapHeart} position={tapPosition} />

                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    {item.image ? (
                        <NewsImage
                            src={item.image}
                            alt={item.title}
                            className="h-full w-full object-cover opacity-90 transition-transform duration-[20s] ease-linear scale-110"
                            priority={index < 2}
                        />
                    ) : (
                        <div className="h-full w-full bg-gradient-to-br from-slate-900 to-black" />
                    )}
                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent via-50% to-black/90 to-90%" />
                </div>

                {/* Content Layer - adjusted padding for smaller dock */}
                <div className="absolute bottom-0 left-0 right-0 z-10 p-4 pb-20 md:p-8 md:pb-28 flex flex-col gap-3 md:gap-5 max-w-full mx-auto pr-16 md:pr-24">
                    {/* Source Pill */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isActive ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.1 }}
                        className="flex items-center gap-2"
                    >
                        <div className="rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-xs font-medium text-white border border-white/5 shadow-sm">
                            {(() => {
                                let clean = item.source || 'Veridian';
                                clean = clean.replace(/\(URLs?:?\s*/gi, '').replace(/\)/g, '');
                                try {
                                    if (clean.includes('.') && !clean.includes(' ')) {
                                        const url = new URL(clean.startsWith('http') ? clean : `https://${clean}`);
                                        clean = url.hostname.replace('www.', '');
                                    }
                                } catch (e) { }
                                return clean.trim();
                            })()}
                        </div>
                        <span className="text-xs text-white/70 shadow-black drop-shadow-md">• {new Date(item.date).toLocaleDateString()}</span>
                    </motion.div>

                    {/* Title */}
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={isActive ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.2 }}
                        className="text-2xl md:text-3xl font-bold text-white leading-tight drop-shadow-lg pr-4"
                    >
                        {item.title}
                    </motion.h2>

                    {/* Summary */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={isActive ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.3 }}
                        className="text-sm md:text-base text-white/90 line-clamp-3 font-light leading-relaxed drop-shadow-md"
                        onClick={(e) => {
                            e.stopPropagation();
                            onReadMore();
                        }}
                    >
                        {item.summary}
                        <span className="text-white font-semibold ml-1 cursor-pointer hover:underline">Leer más</span>
                    </motion.p>
                </div>

                {/* Side Actions (Like TikTok) - 3 buttons now */}
                <div className="absolute right-2 bottom-16 md:right-8 md:bottom-24 z-20 flex flex-col gap-3 md:gap-5 items-center w-12 md:w-16">
                    <ActionButton
                        icon={<Heart className={item.isLiked ? "fill-red-500 text-red-500" : "text-white"} />}
                        label={formatNumber(item.likes || 0)}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onLike();
                            haptic('light');
                        }}
                        delay={0.4}
                        isActive={isActive}
                    />
                    <ActionButton
                        icon={<Bookmark className={item.isSaved ? "fill-yellow-500 text-yellow-500" : "text-white"} />}
                        label="Guardar"
                        onClick={handleSave}
                        delay={0.5}
                        isActive={isActive}
                    />
                    <ActionButton
                        icon={<Share2 className="text-white" />}
                        label="Compartir"
                        onClick={handleShare}
                        delay={0.6}
                        isActive={isActive}
                    />
                </div>
            </div>

            {/* Share Modal */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                item={item}
            />
        </>
    );
};

const ActionButton = ({ icon, label, onClick, isActive, delay }: { icon: React.ReactNode, label?: string, onClick: (e: any) => void, isActive: boolean, delay: number }) => (
    <motion.button
        type="button"
        initial={{ opacity: 0, x: 20 }}
        animate={isActive ? { opacity: 1, x: 0 } : {}}
        transition={{ delay }}
        onClick={onClick}
        className="flex flex-col items-center gap-1 group"
    >
        <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10 active:scale-90 transition-transform hover:bg-white/20">
            {icon}
        </div>
        {label && <span className="text-[10px] font-medium text-white drop-shadow-md">{label}</span>}
    </motion.button>
);

const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
};
