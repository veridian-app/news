import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Users } from "lucide-react";
import { CafeConsensusPoll } from "./data/cafeData";
import { cn } from "@/lib/utils";

interface DailyConsensusProps {
    data: CafeConsensusPoll;
}

export const DailyConsensus = ({ data }: DailyConsensusProps) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [hasVoted, setHasVoted] = useState(false);

    // Calculate percentages (simulated for now based on static votes)
    const getPercentage = (votes: number) => {
        return Math.round((votes / data.totalVotes) * 100);
    };

    const handleVote = (optionId: string) => {
        if (hasVoted) return;
        setSelectedOption(optionId);
        setHasVoted(true);
        // Here we would typically trigger an API call or haptic feedback
    };

    return (
        <div className="w-full max-w-2xl mx-auto mb-32 px-4 md:px-0">
            <div className="bg-zinc-900/60 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md">
                {/* Header */}
                <div className="p-8 border-b border-white/5 bg-gradient-to-r from-green-900/20 to-transparent">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                            <Users className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-green-400 uppercase tracking-widest">The Consensus</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white leading-tight">
                        {data.question}
                    </h3>
                </div>

                {/* Options */}
                <div className="p-8 space-y-4">
                    {data.options.map((option) => {
                        const isSelected = selectedOption === option.id;
                        const percent = getPercentage(option.votes + (isSelected ? 1 : 0)); // Add user vote visually

                        return (
                            <motion.button
                                key={option.id}
                                onClick={() => handleVote(option.id)}
                                disabled={hasVoted}
                                className={cn(
                                    "relative w-full text-left p-4 rounded-xl border transition-all duration-300 overflow-hidden group",
                                    hasVoted
                                        ? "cursor-default border-transparent bg-zinc-800/50"
                                        : "cursor-pointer border-white/10 hover:border-green-500/50 hover:bg-zinc-800/50"
                                )}
                            >
                                {/* Progress Bar Background */}
                                {hasVoted && (
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percent}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className={cn(
                                            "absolute inset-0 h-full opacity-20",
                                            isSelected ? "bg-green-500" : "bg-zinc-500"
                                        )}
                                    />
                                )}

                                <div className="relative flex justify-between items-center z-10">
                                    <span className={cn(
                                        "font-medium transition-colors",
                                        isSelected ? "text-green-400" : "text-zinc-200"
                                    )}>
                                        {option.label}
                                    </span>

                                    {hasVoted && (
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-zinc-400">{percent}%</span>
                                            {isSelected && <Check className="w-4 h-4 text-green-400" />}
                                        </div>
                                    )}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                <div className="px-8 pb-8 text-center md:text-right">
                    <span className="text-xs text-zinc-600 uppercase tracking-widest">
                        {data.totalVotes.toLocaleString()} Votos totales
                    </span>
                </div>
            </div>
        </div>
    );
};
