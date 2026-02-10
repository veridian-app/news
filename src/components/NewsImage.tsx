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

        // Reset state when src changes
        setIsLoaded(false);
        setError(false);

        // Check if image is already cached
        const img = new Image();
        img.src = src;
        if (img.complete && img.naturalWidth > 0) {
            setIsLoaded(true);
        }
    }, [src]);

    return (
        <div className={cn("relative overflow-hidden bg-muted", className)}>
            {/* Shimmer placeholder while loading */}
            {!isLoaded && !error && (
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 animate-shimmer bg-[length:200%_100%]">
                    <span className="sr-only">Loading...</span>
                </div>
            )}

            {error ? (
                <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                    {/* Clean fallback gradient */}
                </div>
            ) : (
                <img
                    src={src}
                    alt={alt}
                    loading={priority ? "eager" : "lazy"}
                    decoding="async"
                    {...(priority ? { fetchPriority: "high" as any } : {})}
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

