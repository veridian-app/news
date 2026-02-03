import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface NewsImageProps {
    src: string;
    alt: string;
    className?: string;
    priority?: boolean;
    width?: number;
    quality?: number;
}

/**
 * Transform Supabase Storage URL to use Image Transformation API
 * Converts to WebP format and resizes for faster loading
 */
const getOptimizedImageUrl = (src: string, width: number = 800, quality: number = 75): string => {
    if (!src) return '';

    // Check if it's a Supabase Storage URL
    if (src.includes('supabase.co/storage/v1/object/public/')) {
        // Transform: /storage/v1/object/public/ → /storage/v1/render/image/public/
        // Add query params for optimization
        const optimizedUrl = src
            .replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
            + `?width=${width}&quality=${quality}&format=webp`;
        return optimizedUrl;
    }

    // For other URLs (Unsplash, etc), return as-is
    return src;
};

export const NewsImage = ({
    src,
    alt,
    className,
    priority = false,
    width = 800,
    quality = 75
}: NewsImageProps) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(false);

    // Get optimized URL
    const optimizedSrc = getOptimizedImageUrl(src, width, quality);

    useEffect(() => {
        if (!optimizedSrc) return;
        setIsLoaded(false);
        setError(false);

        // Preload for priority images
        if (priority) {
            const img = new Image();
            img.src = optimizedSrc;
            if (img.complete) {
                setIsLoaded(true);
            }
        }
    }, [optimizedSrc, priority]);

    return (
        <div className={cn("relative overflow-hidden bg-zinc-900", className)}>
            {/* Skeleton loader */}
            {!isLoaded && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-zinc-700" />
                </div>
            )}

            {error ? (
                <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-zinc-900 to-zinc-800 flex items-center justify-center">
                    <span className="text-zinc-600 text-sm">Error</span>
                </div>
            ) : (
                <img
                    src={optimizedSrc}
                    alt={alt}
                    loading={priority ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={priority ? "high" : "auto"}
                    className={cn(
                        "w-full h-full object-cover transition-opacity duration-300",
                        isLoaded ? "opacity-100" : "opacity-0"
                    )}
                    onLoad={() => setIsLoaded(true)}
                    onError={() => {
                        // Fallback to original URL if transform fails
                        if (optimizedSrc !== src) {
                            console.warn('Optimized image failed, using original:', src);
                            // Don't set error, let it try original
                        } else {
                            setError(true);
                        }
                    }}
                />
            )}
        </div>
    );
};

