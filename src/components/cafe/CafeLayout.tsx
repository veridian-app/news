import { useState, useRef, useEffect, useMemo } from "react";
import { CAFE_NEWS, DAILY_CONSENSUS, CafeItem, CafeConsensusPoll } from "./data/cafeData";
import { ExpandableNewsCard, ExpandableNewsItem } from "./ExpandableNewsCard";
import { LiquidProgressBar } from "./LiquidProgressBar";
import { DailyConsensus } from "./DailyConsensus";
import { GobiernoGasto } from "./GobiernoGasto";
import { Button } from "@/components/ui/button";
import { X, Coffee, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, useScroll, useSpring, useTransform } from "framer-motion";
import { useHaptic } from "@/hooks/use-haptic";
import { cn } from "@/lib/utils";

// Transform CafeItem to ExpandableNewsItem format
const transformToExpandable = (items: CafeItem[]): ExpandableNewsItem[] => {
    const result: ExpandableNewsItem[] = [];

    for (const item of items) {
        const anyItem = item as any;

        // Skip compact type items for now
        if (item.type === 'compact') continue;

        result.push({
            id: anyItem.id || `item-${Math.random()}`,
            title: anyItem.title || 'Sin título',
            summary: anyItem.subtitle || anyItem.caption || '',
            content: anyItem.content || '',
            imageUrl: anyItem.imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800',
            category: anyItem.category || 'Noticias',
            readTime: anyItem.readTime || '2 min',
            source: anyItem.author || anyItem.source,
        });
    }

    return result;
};

export const CafeLayout = () => {
    const navigate = useNavigate();
    const { triggerImpact } = useHaptic();
    const containerRef = useRef<HTMLDivElement>(null);

    // Data states
    const [cafeNews, setCafeNews] = useState<CafeItem[]>(CAFE_NEWS);
    const [dailyPolls, setDailyPolls] = useState<CafeConsensusPoll[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Consensus State
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
                const newsResponse = await fetch('/api/cafe?type=featured');
                if (newsResponse.ok) {
                    const newsData = await newsResponse.json();
                    if (newsData.news && newsData.news.length > 0) {
                        setCafeNews(newsData.news);
                    }
                }

                // Fetch polls
                const pollsResponse = await fetch('/api/cafe?type=polls');
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
            triggerImpact('medium');
        }
    };

    const handleClose = () => {
        navigate("/veridian-news");
    };

    // Use first poll from API or fallback to mock
    const activePoll = dailyPolls.length > 0 ? dailyPolls[0] : DAILY_CONSENSUS;

    return (
        <div className="fixed inset-0 bg-zinc-950 text-white flex z-50 overflow-hidden">
            {/* Left/Main Content: Scrollable */}
            <div ref={containerRef} className="flex-1 overflow-y-auto relative custom-scrollbar scroll-smooth">
                {/* Header Overlay */}
                <div className="sticky top-0 z-40 p-6 flex justify-between items-start bg-gradient-to-b from-zinc-950/90 to-transparent pointer-events-none">

                    {/* Café Veridian Label */}
                    <div className="pointer-events-auto bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-green-500/20 flex items-center gap-2">
                        <Coffee className="w-5 h-5 text-green-400" />
                        <span className="text-sm font-semibold text-white">Café Veridian</span>
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
                            {/* Transform and render all news as expandable cards */}
                            {transformToExpandable(cafeNews).map((item, index) => (
                                <ExpandableNewsCard
                                    key={item.id}
                                    item={item}
                                    index={index}
                                />
                            ))}

                            {/* Sección BOE: ¿En qué se gasta el gobierno tu dinero? */}
                            <div className="mt-20 px-4">
                                <GobiernoGasto />
                            </div>

                            {/* Consensus Section at the bottom */}
                            <div className="mt-16 mb-20 scroll-mt-20">
                                <div onClick={handleConsensusComplete}>
                                    <DailyConsensus
                                        data={activePoll}
                                        onVote={async (pollId, optionId) => {
                                            // Generate simple fingerprint
                                            const fingerprint = `${navigator.userAgent}-${screen.width}x${screen.height}`;

                                            try {
                                                const response = await fetch('/api/cafe?type=vote', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ pollId, optionId, fingerprint, type: 'vote' })
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
