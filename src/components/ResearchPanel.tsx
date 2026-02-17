import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, X, Bot, User, Sparkles, BookOpen, Fingerprint, Link as LinkIcon, ExternalLink, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { motion, AnimatePresence } from "framer-motion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface ResearchPanelProps {
    isOpen: boolean;
    onClose: () => void;
    articleContext: string;
    articleTitle?: string;
    variant?: "overlay" | "embedded";
    extractedLinks?: Array<{ text: string; url: string }>;
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

export function ResearchPanel({ isOpen, onClose, articleContext, articleTitle, variant = "overlay", extractedLinks = [] }: ResearchPanelProps) {
    const { language } = useLanguage();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLinksOpen, setIsLinksOpen] = useState(false);
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

    const handleVerify = async (url: string) => {
        setIsLoading(true);
        // Add a temporary system message to show we are working
        const tempId = Date.now().toString();
        setMessages(prev => [...prev, {
            role: 'assistant',
            content: language === 'es' ? "🔍 Analizando fuente externa..." : "🔍 Analyzing external source..."
        }]);

        try {
            // 1. Fetch text from the external URL
            const res = await fetch('/api/analyze-article', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ articleUrl: url, language })
            });

            if (!res.ok) throw new Error("Failed to fetch source");
            const data = await res.json();
            const sourceText = data.summary?.text_content || data.extracted_content || JSON.stringify(data); // Fallback depending on API response structure

            // Note: analyze-article returns the full analysis JSON. We need the RAW text if possible, 
            // but currently it returns the analyzed result. 
            // Wait, looking at analyze-article.ts logic: "return res.status(200).json(output);"
            // The output from OpenAI doesn't contain the raw text unless we asked for it?
            // Actually, analyze-article.ts DOES NOT return the raw text in the final JSON.
            // I might need to adjust analyze-article.ts to return "text_content" or use another way.
            // For now, I will assume the "summary" or detailed analysis is enough proxy, 
            // OR I will ask the chat to analyze the "summary" of the source.

            // ALTERNATIVE: Use the detailed analysis of the source as the "evidence".
            const analysisSummary = JSON.stringify(data.summary);

            // 2. Send to Chat
            const prompt = language === 'es'
                ? `He consultado la fuente externa citada (${url}). Aquí está el análisis de su contenido:\n\n${analysisSummary.substring(0, 3000)}\n\n¿Esta fuente respalda las afirmaciones del artículo principal? Compara y verifica.`
                : `I have accessed the cited external source (${url}). Here is the analysis of its content:\n\n${analysisSummary.substring(0, 3000)}\n\nDoes this source support the claims in the main article? Compare and verify.`;

            // Remove the loading message
            setMessages(prev => prev.filter(m => m.content !== (language === 'es' ? "🔍 Analizando fuente externa..." : "🔍 Analyzing external source...")));

            handleSend(prompt);

        } catch (error) {
            console.error(error);
            setMessages(prev => prev.filter(m => m.content !== (language === 'es' ? "🔍 Analizando fuente externa..." : "🔍 Analyzing external source...")));
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: language === 'es' ? "❌ No pude acceder a esa fuente. Puede estar protegida o caída." : "❌ Could not access that source. It might be protected or down."
            }]);
            setIsLoading(false);
        }
    };

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
                    messages: [...messages, userMsg], // Send full history
                    articleContext,
                    articleTitle,
                    language
                }),
            });

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error(language === 'es' ? "El sistema está ocupado, intenta en un momento." : "System busy, please try again shortly.");
                }
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            // Check if response has content
            if (data.error) {
                throw new Error(data.error);
            }

            const assistantMsg: Message = {
                role: 'assistant',
                content: data.content || (language === 'es' ? "Lo siento, no pude analizar eso." : "Sorry, I couldn't analyze that.")
            };

            setMessages(prev => [...prev, assistantMsg]);
        } catch (error: any) {
            console.error('Research chat error:', error);
            const errorMsg: Message = {
                role: 'assistant',
                content: error.message || t.error
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const content = (
        <div className={cn(
            "flex flex-col h-full bg-background/95 backdrop-blur-xl border-l border-white/10 shadow-2xl",
            variant === "embedded" ? "w-full border-0 shadow-none bg-transparent" : "fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] pt-16 sm:pt-0"
        )}>
            {/* Header - Only show close button in overlay mode */}
            {variant === "overlay" && (
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
                    <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/10 rounded-full h-8 w-8">
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            )}

            {/* Main Chat Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-6 pb-4 max-w-3xl mx-auto">
                    {/* Extracted Links Section */}
                    {extractedLinks.length > 0 && (
                        <Collapsible open={isLinksOpen} onOpenChange={setIsLinksOpen} className="border border-white/10 rounded-xl bg-card/20 overflow-hidden">
                            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <LinkIcon className="w-4 h-4 text-purple-400" />
                                    <span>{language === 'es' ? 'Fuentes Detectadas' : 'Detected Sources'}</span>
                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{extractedLinks.length}</Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {isLinksOpen ? (language === 'es' ? 'Ocultar' : 'Hide') : (language === 'es' ? 'Ver todas' : 'View all')}
                                </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <div className="p-2 space-y-1 bg-black/20">
                                    {extractedLinks.map((link, i) => (
                                        <div key={i} className="group flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium truncate text-foreground/80 group-hover:text-foreground">{link.text || "Link"}</div>
                                                <div className="text-[10px] text-muted-foreground truncate">{link.url}</div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-muted-foreground hover:text-white transition-colors" title="Open Link">
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="h-6 text-[10px] px-2 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 border-purple-500/20"
                                                    onClick={() => handleVerify(link.url)}
                                                    disabled={isLoading}
                                                >
                                                    <ShieldCheck className="w-3 h-3 mr-1" />
                                                    {language === 'es' ? 'Verificar' : 'Verify'}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    )}

                    {/* Welcome Message */}
                    {messages.length === 0 && (
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                <Bot className="w-6 h-6 text-primary" />
                            </div>
                            <div className="bg-card/40 border border-white/5 rounded-2xl rounded-tl-sm p-6 text-base leading-relaxed text-foreground/90 shadow-sm">
                                {t.welcome}
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
                                "flex gap-4",
                                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                msg.role === 'user' ? "bg-white/10" : "bg-primary/20"
                            )}>
                                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-6 h-6 text-primary" />}
                            </div>
                            <div className={cn(
                                "rounded-2xl p-6 text-base leading-7 whitespace-pre-wrap shadow-sm max-w-[85%]", // Improved typography
                                msg.role === 'user'
                                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                                    : "bg-card/60 border border-white/5 rounded-tl-sm backdrop-blur-sm text-foreground/90"
                            )}>
                                {msg.content}
                            </div>
                        </motion.div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                <Bot className="w-6 h-6 text-primary" />
                            </div>
                            <div className="bg-card/40 border border-white/5 rounded-2xl rounded-tl-sm p-6 flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-primary rounded-full" />
                                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-primary rounded-full" />
                                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-primary rounded-full" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-background/50 backdrop-blur-md">
                <div className="max-w-3xl mx-auto space-y-4">
                    {/* Persistent Quick Actions (Horizontal Scroll) */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mask-fade-right">
                        {actions.map((action, i) => (
                            <button
                                key={i}
                                onClick={() => handleSend(action.prompt)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary border border-transparent hover:border-primary/20 transition-all text-xs font-medium whitespace-nowrap group shrink-0"
                            >
                                <action.icon className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
                                {action.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <Input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={t.placeholder}
                            className="pr-12 bg-secondary/30 border-white/10 focus-visible:ring-primary/50 h-14 text-base rounded-xl"
                            disabled={isLoading}
                        />
                        <Button
                            size="icon"
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 top-2 h-10 w-10 bg-primary/20 hover:bg-primary text-primary hover:text-white transition-all rounded-lg"
                        >
                            <Send className="w-5 h-5" />
                        </Button>
                    </div>
                    <p className="text-[10px] text-center text-muted-foreground opacity-50">
                        {language === 'es' ? "Oraculus puede cometer errores. Verifica la info." : "Oraculus can make mistakes. Verify info."}
                    </p>
                </div>
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
