import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { NewsItem } from "@/utils/news-utils";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: NewsItem;
}

export const ShareModal = ({ isOpen, onClose, item }: ShareModalProps) => {
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

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-zinc-900 rounded-t-3xl p-6 pb-10 animate-in slide-in-from-bottom-full duration-500 ease-out"
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
            </div>
        </div>
    );
};
