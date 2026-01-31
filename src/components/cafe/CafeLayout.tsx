import { useState, useRef, useEffect } from "react";
import { CAFE_NEWS, DAILY_CONSENSUS, CafeItem, CafeConsensusPoll } from "./data/cafeData";
import { NewsBrewCard } from "./NewsBrewCard";
import { LiquidProgressBar } from "./LiquidProgressBar";
import { DailyConsensus } from "./DailyConsensus";
import { CoffeeTicket } from "./CoffeeTicket";
import { Button } from "@/components/ui/button";
import { X, Coffee, Ticket, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, useScroll, useSpring, useTransform } from "framer-motion";
import { useHaptic } from "@/hooks/use-haptic";
import { cn } from "@/lib/utils";

export const CafeLayout = () => {
    const navigate = useNavigate();
    const { triggerImpact } = useHaptic();
    const containerRef = useRef<HTMLDivElement>(null);
    const [showTicket, setShowTicket] = useState(false);

    // Data states
    const [cafeNews, setCafeNews] = useState<CafeItem[]>(CAFE_NEWS);
    const [dailyPolls, setDailyPolls] = useState<CafeConsensusPoll[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Passport State
    const [stamps, setStamps] = useState(9);
    const [hasConsensusVoted, setHasConsensusVoted] = useState(false);

    // Scroll Progress
    const { scrollYProgress } = useScroll({
        container: containerRef,
    });

    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const progressPercent = useTransform(scaleX, value => value * 100);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const unsubscribe = progressPercent.on("change", (v) => setProgress(v));
        return () => unsubscribe();
    }, [progressPercent]);

    // Fetch real data on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch featured news
                const newsResponse = await fetch('/api/cafe/featured-news');
                if (newsResponse.ok) {
                    const newsData = await newsResponse.json();
                    if (newsData.news && newsData.news.length > 0) {
                        setCafeNews(newsData.news);
                    }
                }

                // Fetch polls
                const pollsResponse = await fetch('/api/cafe/polls');
                if (pollsResponse.ok) {
                    const pollsData = await pollsResponse.json();
                    if (pollsData.polls && pollsData.polls.length > 0) {
                        // Transform API polls to component format
                        const transformedPolls = pollsData.polls.map((poll: any) => ({
                            id: poll.id,
                            question: poll.question,
                            options: poll.options.map((opt: any) => ({
                                id: opt.id,
                                label: opt.label,
                                votes: poll.voteCounts?.[opt.id] || 0
                            })),
                            totalVotes: poll.totalVotes || 0
                        }));
                        setDailyPolls(transformedPolls);
                    }
                }
            } catch (error) {
                console.error('Error fetching café data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleConsensusComplete = () => {
        if (!hasConsensusVoted) {
            setHasConsensusVoted(true);
            const newStamps = Math.min(stamps + 1, 10);
            setStamps(newStamps);
            if (newStamps === 10) {
                triggerImpact('heavy');
                setTimeout(() => setShowTicket(true), 1500);
            } else {
                triggerImpact('medium');
            }
        }
    };

    const handleClose = () => {
        navigate("/veridian-news");
    };

    // Use first poll from API or fallback to mock
    const activePoll = dailyPolls.length > 0 ? dailyPolls[0] : DAILY_CONSENSUS;

    return (
        <div className="fixed inset-0 bg-zinc-950 text-white flex z-50 overflow-hidden">
            {/* Golden Ticket Overlay */}
            <AnimatePresence>
                {showTicket && <CoffeeTicket onClose={() => setShowTicket(false)} />}
            </AnimatePresence>

            {/* Left/Main Content: Scrollable */}
            <div ref={containerRef} className="flex-1 overflow-y-auto relative custom-scrollbar scroll-smooth">
                {/* Header Overlay */}
                <div className="sticky top-0 z-40 p-6 flex justify-between items-start bg-gradient-to-b from-zinc-950/90 to-transparent pointer-events-none">

                    {/* Coffee Passport Indicator */}
                    <div className="pointer-events-auto bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-green-500/20 flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Coffee className={cn("w-5 h-5", stamps === 10 ? "text-green-400 animate-bounce" : "text-zinc-500")} />
                                {stamps === 10 && <div className="absolute -top-2 left-1 text-[10px] text-green-400 opacity-70 animate-pulse">~</div>}
                            </div>
                            <div className="flex flex-col">
                                <span className={cn("text-[10px] font-bold uppercase tracking-widest leading-none mb-0.5", stamps === 10 ? "text-green-400" : "text-zinc-500")}>
                                    Passport
                                </span>
                                <div className="flex gap-1">
                                    {Array.from({ length: 10 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                                i < stamps ? "bg-green-500" : "bg-zinc-800",
                                                i === stamps - 1 && "animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {stamps === 10 && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowTicket(true)}
                                className="h-6 px-2 text-[10px] bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:text-green-300 uppercase tracking-widest animate-pulse"
                            >
                                <Ticket className="w-3 h-3 mr-1" />
                                Claim
                            </Button>
                        )}
                    </div>

                    <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full hover:bg-white/10 pointer-events-auto bg-black/50 backdrop-blur-md">
                        <X className="w-5 h-5 text-white/50" />
                    </Button>
                </div>

                <div className="max-w-2xl mx-auto px-4 pb-40 pt-20">
                    <div className="mb-16 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium uppercase tracking-wider">
                            <span>Edición Diaria</span>
                            <span className="w-1 h-1 rounded-full bg-orange-500" />
                            <span>10 min lectura</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">Tu Briefing Matutino</h1>
                        <p className="text-xl text-zinc-400 max-w-lg leading-relaxed">
                            Profundidad donde importa, brevedad donde la necesitas.
                            <br />
                            <span className="text-zinc-500 text-sm">Desliza para comenzar</span>
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {cafeNews.map((item, index) => (
                                <NewsBrewCard
                                    key={item.id}
                                    data={item}
                                    current={index + 1}
                                    total={cafeNews.length}
                                />
                            ))}

                            {/* Consensus Section at the bottom */}
                            <div className="mt-32 mb-20 scroll-mt-20">
                                <div onClick={handleConsensusComplete}>
                                    <DailyConsensus
                                        data={activePoll}
                                        onVote={async (pollId, optionId) => {
                                            // Generate simple fingerprint
                                            const fingerprint = `${navigator.userAgent}-${screen.width}x${screen.height}`;

                                            try {
                                                const response = await fetch('/api/cafe/polls', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ pollId, optionId, fingerprint })
                                                });

                                                if (response.ok) {
                                                    const result = await response.json();
                                                    console.log('Vote registered:', result);
                                                }
                                            } catch (error) {
                                                console.error('Error voting:', error);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Right: Vertical Progress Bar */}
            <div className="w-14 md:w-20 bg-zinc-900 border-l border-white/5 relative h-full shrink-0 flex flex-col p-2 md:p-3">
                <div className="relative flex-1 w-full bg-zinc-950/50 rounded-[2rem] shadow-inner">
                    <LiquidProgressBar progress={progress} orientation="vertical" />
                </div>
            </div>
        </div>
    );
};
