import { Heart } from "lucide-react";

interface DoubleTapOverlayProps {
    showLike: boolean;
    position: { x: number; y: number };
}

export const DoubleTapOverlay = ({ showLike, position }: DoubleTapOverlayProps) => {
    return (
        <>
            {showLike && (
                <div
                    className="absolute z-50 pointer-events-none animate-in fade-in zoom-in slide-out-to-top-12 duration-700 ease-out fill-mode-both"
                    style={{ 
                        left: position.x - 48, 
                        top: position.y - 48,
                        transform: `rotate(${Math.random() * 40 - 20}deg)`
                    }}
                >
                    <Heart
                        className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse"
                        strokeWidth={0}
                    />
                </div>
            )}
        </>
    );
};
