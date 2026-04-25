import { useState } from "react";
import { Check, Users } from "lucide-react";
import { CafeConsensusPoll } from "./data/cafeData";
import { cn } from "@/lib/utils";

interface DailyConsensusProps {
    data: CafeConsensusPoll;
    onVote?: (pollId: string, optionId: string) => Promise<void>;
}

export const DailyConsensus = ({ data, onVote }: DailyConsensusProps) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [isVoting, setIsVoting] = useState(false);

    // Calculate percentages (simulated for now based on static votes)
    const getPercentage = (votes: number) => {
        const total = data.totalVotes + (hasVoted ? 1 : 0);
        if (total === 0) return 0;
        return Math.round((votes / total) * 100);
    };

    const handleVote = async (optionId: string) => {
        if (hasVoted || isVoting) return;

        setIsVoting(true);
        setSelectedOption(optionId);

        try {
            if (onVote) {
                await onVote(data.id, optionId);
            }
            setHasVoted(true);
        } catch (error) {
            console.error('Error voting:', error);
            setSelectedOption(null);
        } finally {
            setIsVoting(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto mb-32 px-4 md:px-0 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="bg-zinc-950/40 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-2xl shadow-2xl relative group">
                {/* Tactical Glass Reflection */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                
                {/* Header */}
                <div className="p-10 border-b border-white/5 bg-gradient-to-br from-green-500/10 via-transparent to-transparent relative">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-green-500/10 rounded-2xl border border-green-500/20 flex items-center justify-center text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                            <Users className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.3em]">Consenso_Global</span>
                            <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Protocolo de Opinión v.2</span>
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-white leading-[1.1] tracking-tighter uppercase max-w-lg">
                        {data.question}
                    </h3>
                </div>

                {/* Options */}
                <div className="p-8 space-y-4">
                    {data.options.map((option) => {
                        const isSelected = selectedOption === option.id;
                        const percent = getPercentage(option.votes + (isSelected ? 1 : 0)); // Add user vote visually

                        return (
                            <button
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
                                    <div
                                        style={{ width: `${percent}%` }}
                                        className={cn(
                                            "absolute inset-0 h-full opacity-20 transition-all duration-1000 ease-out",
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
                            </button>
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
