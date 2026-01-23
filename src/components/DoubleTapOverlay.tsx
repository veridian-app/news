import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";

interface DoubleTapOverlayProps {
    showLike: boolean;
    position: { x: number; y: number };
}

export const DoubleTapOverlay = ({ showLike, position }: DoubleTapOverlayProps) => {
    return (
        <AnimatePresence>
            {showLike && (
                <motion.div
                    initial={{ opacity: 0, scale: 0, x: position.x - 50, y: position.y - 50 }}
                    animate={{ opacity: 1, scale: 1.5 }}
                    exit={{ opacity: 0, scale: 3, y: position.y - 150 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute z-50 pointer-events-none"
                    style={{ left: 0, top: 0 }}
                >
                    <Heart
                        className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                        strokeWidth={0}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};
