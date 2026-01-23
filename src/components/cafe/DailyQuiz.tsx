import { useState } from "react";
import { CafeQuizQuestion } from "./data/cafeData";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import { useHaptic } from "@/hooks/use-haptic";

interface DailyQuizProps {
    questions: CafeQuizQuestion[];
    onComplete: () => void;
}

export const DailyQuiz = ({ questions, onComplete }: DailyQuizProps) => {
    const { triggerNotification, triggerImpact } = useHaptic();
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);

    const question = questions[currentQIndex];

    const handleSelect = (index: number) => {
        if (isAnswered) return;

        setSelectedOption(index);
        setIsAnswered(true);

        const isCorrect = index === question.correctIndex;
        if (isCorrect) {
            setScore(prev => prev + 1);
            triggerNotification('success'); // Haptic Success
        } else {
            triggerNotification('error'); // Haptic Error
        }

        // Auto advance after short delay
        setTimeout(() => {
            if (currentQIndex < questions.length - 1) {
                setCurrentQIndex(prev => prev + 1);
                setSelectedOption(null);
                setIsAnswered(false);
            } else {
                onComplete();
            }
        }, 1500);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-zinc-900 border border-green-500/20 rounded-3xl p-8 relative overflow-hidden"
        >
            {/* Animation Placeholder Tag */}
            <div className="absolute top-0 right-0 bg-yellow-500/20 text-yellow-500 text-[10px] px-2 py-1">
                ANIMACION: CONFETI SI ACIERTA
            </div>

            <div className="text-center mb-8">
                <span className="text-sm font-medium text-green-400 uppercase tracking-widest">
                    Quiz del Día
                </span>
                <h2 className="text-2xl font-bold text-white mt-2">
                    {question.question}
                </h2>
                <p className="text-zinc-500 text-sm mt-4">
                    Pregunta {currentQIndex + 1} de {questions.length}
                </p>
            </div>

            <div className="space-y-3">
                {question.options.map((option, idx) => {
                    let btnClass = "bg-zinc-800 border-zinc-700 hover:bg-zinc-700";
                    let icon = null;

                    if (isAnswered) {
                        if (idx === question.correctIndex) {
                            btnClass = "bg-green-600 border-green-500 text-white";
                            icon = <CheckCircle2 className="w-5 h-5" />;
                        } else if (idx === selectedOption) {
                            btnClass = "bg-red-900/50 border-red-500/50 text-red-200";
                            icon = <XCircle className="w-5 h-5" />;
                        } else {
                            btnClass = "bg-zinc-800 opacity-50";
                        }
                    }

                    return (
                        <div key={idx} className="relative">
                            <Button
                                onClick={() => handleSelect(idx)}
                                className={`w-full justify-between py-6 text-left h-auto text-base border ${btnClass} transition-all duration-300`}
                                disabled={isAnswered}
                            >
                                <span className="mr-4">{option}</span>
                                {icon}
                            </Button>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
};
