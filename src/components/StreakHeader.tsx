import { Flame } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const StreakHeader = () => {
    // Mock user streak data (later integration with Supabase)
    const [streak, setStreak] = useState(3);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Fade in animation on mount
        setTimeout(() => setIsVisible(true), 500);
    }, []);

    return (
        <div className={cn(
            "fixed top-4 right-4 z-50 transition-all duration-700 ease-out transform",
            isVisible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
        )}>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/30 backdrop-blur-md border border-orange-500/30 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                <div className="relative">
                    <Flame className="w-5 h-5 text-orange-500 fill-orange-500/20 animate-pulse" />
                    <div className="absolute inset-0 bg-orange-500/20 blur-lg rounded-full animate-pulse" />
                </div>
                <span className="text-sm font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                    {streak} días
                </span>
            </div>
        </div>
    );
};
