import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NewsImage } from "./NewsImage";
import { cn } from "@/lib/utils";
import { Heart, MessageCircle, Share2, MousePointerClick, BookOpen } from "lucide-react";
import { DoubleTapOverlay } from "./DoubleTapOverlay";
import { useHaptic } from "@/hooks/use-haptic";

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

export const NewsCard = ({ item, isActive, index, onLike, onComment, onShare, onReadMore }: NewsCardProps) => {
    // Logic for double tap
    const lastTap = useRef<number>(0);
    const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
    const [tapPosition, setTapPosition] = useState({ x: 0, y: 0 });
    const { trigger: haptic } = useHaptic();

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

    return (
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
                        className="h-full w-full object-cover opacity-90 transition-transform duration-[20s] ease-linear scale-110" // Slow zoom effect
                        priority={index < 2}
                    />
                ) : (
                    <div className="h-full w-full bg-gradient-to-br from-slate-900 to-black" />
                )}
                {/* Gradient Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent via-50% to-black/90 to-90%" />
            </div>

            {/* Content Layer */}
            <div className="absolute bottom-0 left-0 right-0 z-10 p-4 pb-24 md:p-8 md:pb-32 flex flex-col gap-3 md:gap-5 max-w-full mx-auto pr-16 md:pr-24">
                {/* Source Pill */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isActive ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-2"
                >
                    <div className="rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-xs font-medium text-white border border-white/5 shadow-sm">
                        {(() => {
                            // Limpiar la fuente: quitar (URLs: ...), quitar http/https, quitar paréntesis
                            let clean = item.source || 'Veridian';
                            clean = clean.replace(/\(URLs?:?\s*/gi, '').replace(/\)/g, ''); // Quitar "(URLs: " y ")"
                            try {
                                // Si es una URL, mostrar solo el dominio
                                if (clean.includes('.') && !clean.includes(' ')) {
                                    const url = new URL(clean.startsWith('http') ? clean : `https://${clean}`);
                                    clean = url.hostname.replace('www.', '');
                                }
                            } catch (e) {
                                // Si falla parsear URL, dejar como está
                            }
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
                        e.stopPropagation(); // Avoid triggering double tap when reading
                        onReadMore();
                    }}
                >
                    {item.summary}
                    <span className="text-white font-semibold ml-1 cursor-pointer hover:underline">Leer más</span>
                </motion.p>
            </div>

            {/* Side Actions (Like TikTok) */}
            <div className="absolute right-2 bottom-20 md:right-8 md:bottom-28 z-20 flex flex-col gap-4 md:gap-6 items-center w-12 md:w-16">
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
                    icon={<MessageCircle className="text-white" />}
                    label={formatNumber(item.comments || 0)}
                    onClick={(e) => {
                        e.stopPropagation();
                        onComment();
                    }}
                    delay={0.5}
                    isActive={isActive}
                />
                <ActionButton
                    icon={<BookOpen className="text-white" />}
                    label="Leer"
                    onClick={(e) => {
                        e.stopPropagation();
                        onReadMore();
                    }}
                    delay={0.6}
                    isActive={isActive}
                />
                <ActionButton
                    icon={<Share2 className="text-white" />}
                    label="Share"
                    onClick={(e) => {
                        e.stopPropagation();
                        onShare();
                    }}
                    delay={0.7}
                    isActive={isActive}
                />
            </div>
        </div>
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
