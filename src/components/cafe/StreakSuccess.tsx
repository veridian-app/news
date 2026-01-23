import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Share2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const StreakSuccess = () => {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-sm mx-auto"
        >
            <div className="mb-8 relative flex justify-center">
                {/* Placeholder for Animation */}
                <div className="w-40 h-40 bg-zinc-800 rounded-full flex items-center justify-center border-4 border-green-500/20 animate-pulse relative">
                    <div className="text-6xl">🔥</div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-50 text-xs font-mono text-zinc-500">
                        ANIMACION<br />STREAK
                    </div>
                </div>
            </div>

            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent mb-2">
                ¡Racha Extendida!
            </h1>
            <p className="text-zinc-400 mb-8 text-lg">
                Has completado tu dosis de verdad de hoy.
            </p>

            <div className="grid gap-4">
                <Button
                    className="w-full bg-white text-black hover:bg-zinc-200 h-12 rounded-full font-bold"
                >
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartir Logro
                </Button>

                <Button
                    variant="ghost"
                    onClick={() => navigate("/veridian-news")}
                    className="text-white/50 hover:text-white"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver al Inicio
                </Button>
            </div>
        </motion.div>
    );
};
