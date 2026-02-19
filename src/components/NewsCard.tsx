import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NewsImage } from "./NewsImage";
import { cn } from "@/lib/utils";
import { Heart, Share2, Bookmark, X } from "lucide-react";
import { DoubleTapOverlay } from "./DoubleTapOverlay";
import { useHaptic } from "@/hooks/use-haptic";
import { toast } from "@/hooks/use-toast";
import { useDockVisibility } from "@/contexts/DockVisibilityContext";
import { useSavedNews } from "@/hooks/use-saved-news";

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
    isRead?: boolean;
}

interface NewsCardProps {
    item: NewsItem;
    isActive: boolean;
    index: number;
    onLike: () => void;
    onShare: () => void;
    onReadMore: () => void;
    category?: string;
}

// Share modal component
const ShareModal = ({ isOpen, onClose, item }: { isOpen: boolean; onClose: () => void; item: NewsItem }) => {
    // Generar URL interna para deep linking
    const shareUrl = `${window.location.origin}/veridian-news?newsId=${item.id}`;

    // Texto para compartir
    const shareTitle = item.title;
    const shareText = `${item.title}\n\nLee la historia completa en Veridian News:`;
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
                // WhatsApp deep link funciona mejor en móvil
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
                // Instagram no permite compartir links directamente, copiamos y avisamos
                navigator.clipboard.writeText(`${shareTitle}\n\n${shareUrl}`);
                toast({
                    title: "📋 Texto copiado",
                    description: "Abre Instagram y pégalo en tu historia o publicación",
                });
                // Intentar abrir Instagram en móvil
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
                // Deep link para X/Twitter en móvil
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
                // Deep link para Facebook en móvil
                if (isMobile) {
                    // Intentar abrir en app de Facebook
                    window.location.href = `fb://share/?link=${urlParam}`;
                    // Fallback después de un pequeño delay
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

export const NewsCard = ({ item, isActive, index, onLike, onShare, onReadMore, category }: NewsCardProps) => {
    // Logic for double tap
    const lastTap = useRef<number>(0);
    const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
    const [tapPosition, setTapPosition] = useState({ x: 0, y: 0 });
    const [showShareModal, setShowShareModal] = useState(false);
    const { trigger: haptic } = useHaptic();
    const { hideDock, showDock } = useDockVisibility();
    const { isSaved, toggleSave } = useSavedNews();

    // Check if the item is saved
    const isItemSaved = isSaved(item.id);

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
        toggleSave(item);
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

                {/* Background Image with Parallax & Zoom */}
                <div className="absolute inset-0 z-0">
                    {item.image ? (
                        <div className="w-full h-full overflow-hidden">
                            <NewsImage
                                src={item.image}
                                alt={item.title}
                                className={cn(
                                    "h-full w-full object-cover opacity-90 transition-all duration-[20s] ease-linear will-change-transform",
                                    isActive ? "scale-110" : "scale-100"
                                )}
                                priority={index < 2}
                            />
                        </div>
                    ) : (
                        <div className="h-full w-full bg-gradient-to-br from-slate-900 to-black" />
                    )}

                    {/* Enhanced Gradient Overlay for Text Readability - Multi-layer for depth */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent via-40% to-black/95 to-90%" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                </div>

                {/* Content Layer - adjusted padding for cleaner look */}
                <div className="absolute bottom-0 left-0 right-0 z-10 p-5 pb-24 md:p-10 md:pb-32 flex flex-col gap-4 max-w-full mx-auto pr-16 md:pr-24">
                    {/* Source Pill with Glassmorphism */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isActive ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="flex items-center gap-2.5"
                    >
                        <div className="rounded-full bg-white/10 backdrop-blur-xl px-3.5 py-1 text-[11px] font-semibold text-white border border-white/10 shadow-lg tracking-wide uppercase">
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
                        {category && (
                            <>
                                <span className="text-[10px] text-white/50">•</span>
                                <div className="rounded-full bg-emerald-500/10 backdrop-blur-xl px-3 py-1 text-[10px] font-bold text-emerald-300 border border-emerald-500/20 shadow-lg uppercase tracking-widest">
                                    {category}
                                </div>
                            </>
                        )}
                        <span className="text-[10px] text-white/60 shadow-black drop-shadow-md font-medium tracking-wide">
                            {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                    </motion.div>

                    {/* Title with improved typography */}
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={isActive ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
                        className="text-[28px] md:text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight drop-shadow-2xl pr-2"
                        style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
                    >
                        {item.title}
                    </motion.h2>

                    {/* Summary with better readability */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isActive ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="relative"
                        onClick={(e) => {
                            e.stopPropagation();
                            onReadMore();
                        }}
                    >
                        <p className="text-[15px] md:text-[17px] text-zinc-100 line-clamp-3 font-normal leading-relaxed drop-shadow-lg text-shadow-sm pr-2 opacity-90">
                            {item.summary}
                        </p>
                        <motion.button
                            className="mt-3 text-xs font-bold text-white flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity uppercase tracking-widest group"
                            whileHover={{ x: 5 }}
                        >
                            Leer historia completa <span className="text-emerald-400 group-hover:translate-x-1 transition-transform">→</span>
                        </motion.button>
                    </motion.div>
                </div>

                {/* Side Actions (Like TikTok) - Share & Read Status only */}
                <div className="absolute right-3 bottom-24 md:right-8 md:bottom-32 z-20 flex flex-col gap-4 md:gap-6 items-center w-12 md:w-16">
                    <ActionButton
                        icon={<Share2 className="w-6 h-6 md:w-7 md:h-7 text-white drop-shadow-md" />}
                        label="Compartir"
                        onClick={handleShare}
                        delay={0.7}
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

const ActionButton = ({ icon, label, onClick, isActive, delay, animate, activeColor }: { icon: React.ReactNode, label?: string, onClick: (e: any) => void, isActive: boolean, delay: number, animate?: boolean, activeColor?: string }) => (
    <motion.button
        type="button"
        initial={{ opacity: 0, x: 20 }}
        animate={isActive ? {
            opacity: 1,
            x: 0,
            scale: animate ? [1, 1.2, 1] : 1
        } : {}}
        transition={{
            delay,
            scale: { duration: 0.4, type: "spring", stiffness: 300, damping: 15 }
        }}
        onClick={onClick}
        className="flex flex-col items-center gap-1 group"
    >
        <motion.div
            className={cn(
                "p-3 rounded-full backdrop-blur-xl border active:scale-90 transition-all duration-300 shadow-lg",
                animate && activeColor
                    ? activeColor
                    : "bg-black/20 hover:bg-black/40 border-white/10 hover:border-white/20"
            )}
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.1 }}
        >
            {icon}
        </motion.div>
        {label && <span className="text-[10px] font-medium text-white drop-shadow-lg tracking-wide opacity-90">{label}</span>}
    </motion.button>
);

const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
};
