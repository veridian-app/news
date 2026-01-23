import { useRef, useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Coffee, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CoffeeTicketProps {
    onClose: () => void;
}

export const CoffeeTicket = ({ onClose }: CoffeeTicketProps) => {
    // Gyroscope / Mouse motion values
    const tiltX = useMotionValue(0);
    const tiltY = useMotionValue(0);

    // Smooth physics-based spring movement
    const smoothX = useSpring(tiltX, { stiffness: 100, damping: 30, mass: 0.5 });
    const smoothY = useSpring(tiltY, { stiffness: 100, damping: 30, mass: 0.5 });

    // Map tilt to background movement (parallax effect)
    const backgroundX = useTransform(smoothX, [-45, 45], ["-10%", "10%"]);
    const backgroundY = useTransform(smoothY, [-45, 45], ["-10%", "10%"]);

    // Reverse movement for the second layer to create depth/liquid feeling
    const layer2X = useTransform(smoothX, [-45, 45], ["5%", "-5%"]);
    const layer2Y = useTransform(smoothY, [-45, 45], ["5%", "-5%"]);

    useEffect(() => {
        const handleOrientation = (event: DeviceOrientationEvent) => {
            if (event.gamma && event.beta) {
                // Gamma: Left/Right tilt (-90 to 90)
                // Beta: Front/Back tilt (-180 to 180)
                // Clamping values for a subtle effect
                const gamma = Math.min(Math.max(event.gamma, -45), 45);
                const beta = Math.min(Math.max(event.beta, -45), 45);

                tiltX.set(gamma);
                tiltY.set(beta);
            }
        };

        const handleMouseMove = (event: MouseEvent) => {
            // Fallback for desktop testing: Map mouse position to tilt angles
            const width = window.innerWidth;
            const height = window.innerHeight;

            const mouseX = (event.clientX - width / 2) / (width / 2); // -1 to 1
            const mouseY = (event.clientY - height / 2) / (height / 2); // -1 to 1

            tiltX.set(mouseX * 45);
            tiltY.set(mouseY * 45);
        };

        // Determine environment support
        if (typeof window !== 'undefined') {
            // Request permission for iOS 13+ if needed (optional implementation details omitted for brevity)
            window.addEventListener('deviceorientation', handleOrientation);
            window.addEventListener('mousemove', handleMouseMove); // Fallback
        }

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
        >
            <div className="relative w-full max-w-sm bg-zinc-900 border border-green-500/30 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-green-500/10">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-black/20 rounded-full text-white/50 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Liquid Background Animation */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    {/* Layer 1: Primary Swirl */}
                    <motion.div
                        style={{ x: backgroundX, y: backgroundY, borderRadius: '40%' }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320%] h-[320%] bg-gradient-to-t from-green-900 via-green-800 to-black animate-[spin_10s_linear_infinite]"
                    />

                    {/* Layer 2: Counter Swirl (Deep Liquid) */}
                    <motion.div
                        style={{ x: layer2X, y: layer2Y, borderRadius: '42%' }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[310%] h-[310%] bg-black/80 animate-[spin_15s_linear_infinite_reverse] mix-blend-overlay"
                    />

                    {/* Layer 3: Surface Highlights */}
                    <motion.div
                        style={{ x: backgroundX, y: backgroundY, borderRadius: '45%' }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] h-[300%] bg-gradient-to-tr from-transparent via-green-500/10 to-transparent animate-[spin_12s_ease-in-out_infinite]"
                    />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center h-[600px]">
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(34,197,94,0.4)] animate-pulse">
                        <Coffee className="w-10 h-10 text-black fill-current" />
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                        VERIDIAN PASS
                    </h2>
                    <p className="text-sm font-medium text-green-400 uppercase tracking-[0.2em] mb-8">
                        Golden Ticket
                    </p>

                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 w-full mb-8 transform transition-transform hover:scale-105 duration-300">
                        <div className="text-zinc-400 text-xs uppercase tracking-widest mb-2">Válido para</div>
                        <div className="text-2xl font-serif italic text-white mb-1">1 Café de Especialidad</div>
                        <div className="text-xs text-zinc-500">Cualquier Partner de la Red Veridian</div>
                    </div>

                    <div className="animate-bounce mb-2">
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <p className="text-xs text-zinc-500 max-w-[200px]">
                        Mueve tu teléfono. El líquido reacciona para verificar autenticidad.
                    </p>
                </div>
            </div>
        </motion.div>
    );
};
