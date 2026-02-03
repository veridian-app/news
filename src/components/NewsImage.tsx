import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface NewsImageProps {
    src: string;
    alt: string;
    className?: string;
    priority?: boolean;
}

export const NewsImage = ({ src, alt, className, priority = false }: NewsImageProps) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!src) return;

        // Si la imagen ya está en caché, marcar como cargada inmediatamente
        const img = new Image();
        img.src = src;
        if (img.complete) {
            setIsLoaded(true);
        }
    }, [src]);

    return (
        <div className={cn("relative overflow-hidden bg-muted", className)}>
            {!isLoaded && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
                    <span className="sr-only">Loading...</span>
                </div>
            )}

            {error ? (
                <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                    {/* Optional: Add a subtle pattern or icon if desired, for now keeping it clean */}
                </div>
            ) : (
                <img
                    src={src}
                    alt={alt}
                    loading={priority ? "eager" : "lazy"}
                    className={cn(
                        "w-full h-full object-cover transition-opacity duration-500",
                        isLoaded ? "opacity-100" : "opacity-0",
                        className
                    )}
                    onLoad={() => setIsLoaded(true)}
                    onError={() => setError(true)}
                />
            )}
        </div>
    );
};
