import { Flame } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const StreakHeader = ({ streak = 0 }: { streak?: number }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Fade in animation on mount
        setTimeout(() => setIsVisible(true), 500);
    }, []);

    return (
        <div className="flex items-center gap-3 px-4 py-1.5 bg-orange-500/10 border border-orange-500/30 rounded-sm shadow-[0_0_15px_rgba(249,115,22,0.1)]">
            <div className="relative">
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500/20 animate-pulse" />
                <div className="absolute inset-0 bg-orange-500/20 blur-lg rounded-full animate-pulse" />
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-tactical font-black text-orange-500 tracking-[0.1em] uppercase">
                    Readiness_Streak
                </span>
                <span className="text-[12px] font-tactical font-black text-white tabular-nums">
                    {streak}_DAYS
                </span>
            </div>
        </div>
    );
};
