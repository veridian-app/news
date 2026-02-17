import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, X, Bot, User, Sparkles, BookOpen, Fingerprint } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { motion, AnimatePresence } from "framer-motion";

interface ResearchPanelProps {
    isOpen: boolean;
    onClose: () => void;
    articleContext: string;
    articleTitle?: string;
    variant?: "overlay" | "embedded";
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

// Custom Fire icon since it might not be exported from lucide-react in older versions (fallback)
const Fire = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.6-3" />
    </svg>
);

const QUICK_ACTIONS = {
    es: [
        { label: "Datos Duros", icon: Fingerprint, prompt: "Extrae una lista con todas las cifras, fechas y datos estadísticos clave del texto." },
        { label: "Abogado del Diablo", icon: Fire, prompt: "Actúa como 'Abogado del Diablo'. Cuestiona las tesis principales del texto y busca debilidades metodológicas o lógicas." },
        { label: "Citas Clave", icon: BookOpen, prompt: "Identifica las 3 citas más impactantes o controvertidas del texto y explícalas brevemente." },
    ],
    en: [
        { label: "Hard Data", icon: Fingerprint, prompt: "Extract a bulleted list of all key figures, dates, and statistical data from the text." },
        { label: "Devil's Advocate", icon: Fire, prompt: "Act as 'Devil's Advocate'. Question the main theses of the text and look for methodological or logical weaknesses." },
        { label: "Key Quotes", icon: BookOpen, prompt: "Identify the 3 most impactful or controversial quotes in the text and briefly explain them." },
    ]
};

export function ResearchPanel({ isOpen, onClose, articleContext, articleTitle, variant = "overlay" }: ResearchPanelProps) {
    const { language } = useLanguage();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const t = language === 'es' ? {
        title: "Oraculus Research",
        subtitle: "Asistente de Evidencia",
        placeholder: "Pregunta algo sobre el texto...",
        welcome: "Hola. He analizado el documento completo. ¿Qué necesitas investigar?",
        error: "Error al obtener respuesta. Inténtalo de nuevo."
    } : {
        title: "Oraculus Research",
        subtitle: "Evidence Assistant",
        placeholder: "Ask something about the text...",
        welcome: "Hello. I have analyzed the entire document. What do you need to research?",
        error: "Error getting response. Please try again."
    };

    const actions = language === 'es' ? QUICK_ACTIONS.es : QUICK_ACTIONS.en;

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Focus input when opening
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSend = async (text: string = input) => {
        if (!text.trim() || isLoading) return;

        const userMsg: Message = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch('/api/research-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: text,
                    context: articleContext,
                    language
                }),
            });

            if (!response.ok) throw new Error('API Error');

            const data = await response.json();
            const assistantMsg: Message = { role: 'assistant', content: data.answer };
            setMessages(prev => [...prev, assistantMsg]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${t.error}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    const content = (
        <div className={cn(
            "flex flex-col h-full bg-background/95 backdrop-blur-xl border-l border-white/10 shadow-2xl",
            variant === "embedded" ? "w-full border-0 shadow-none bg-transparent" : "fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] pt-16 sm:pt-0"
        )}>
            {/* Header - Only show close button in overlay mode */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/20 p-2 rounded-lg">
                        <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">{t.title}</h3>
                        <p className="text-xs text-muted-foreground">{t.subtitle}</p>
                    </div>
                </div>
                {variant === "overlay" && (
                    <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/10 rounded-full h-8 w-8">
                        <X className="w-5 h-5" />
                    </Button>
                )}
            </div>

            {/* Main Chat Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4 pb-4">
                    {/* Welcome Message */}
                    {messages.length === 0 && (
                        <div className="space-y-6">
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                    <Bot className="w-5 h-5 text-primary" />
                                </div>
                                <div className="bg-card/40 border border-white/5 rounded-2xl rounded-tl-sm p-4 text-sm leading-relaxed max-w-[85%]">
                                    {t.welcome}
                                </div>
                            </div>

                            {/* Quick Actions Grid */}
                            <div className="grid grid-cols-1 gap-2">
                                {actions.map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(action.prompt)}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/30 transition-all text-left group"
                                    >
                                        <div className="p-2 rounded-md bg-black/20 group-hover:bg-primary/20 transition-colors">
                                            <action.icon className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{action.label}</p>
                                            <p className="text-[10px] text-muted-foreground opacity-70 line-clamp-1">{action.prompt}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Chat History */}
                    {messages.map((msg, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={idx}
                            className={cn(
                                "flex gap-3",
                                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                msg.role === 'user' ? "bg-white/10" : "bg-primary/20"
                            )}>
                                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-5 h-5 text-primary" />}
                            </div>
                            <div className={cn(
                                "rounded-2xl p-4 text-sm leading-relaxed max-w-[85%] whitespace-pre-wrap",
                                msg.role === 'user'
                                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                                    : "bg-card/60 border border-white/5 rounded-tl-sm backdrop-blur-sm"
                            )}>
                                {msg.content}
                            </div>
                        </motion.div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                <Bot className="w-5 h-5 text-primary" />
                            </div>
                            <div className="bg-card/40 border border-white/5 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
                                <div className="flex gap-1">
                                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-black/20">
                <div className="relative">
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={t.placeholder}
                        className="pr-12 bg-black/20 border-white/10 focus-visible:ring-primary/50 h-12"
                        disabled={isLoading}
                    />
                    <Button
                        size="icon"
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-1 top-1 h-10 w-10 bg-primary/20 hover:bg-primary text-primary hover:text-white transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
                <p className="text-[10px] text-center text-muted-foreground mt-2 opacity-50">
                    {language === 'es' ? "Oraculus puede cometer errores. Verifica la info." : "Oraculus can make mistakes. Verify info."}
                </p>
            </div>
        </div>
    );

    if (variant === "embedded") {
        return content;
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: "100%", opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "100%", opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed inset-y-0 right-0 z-50 w-full sm:w-[450px]"
                >
                    {content}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
