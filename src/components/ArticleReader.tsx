import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ArticleReaderProps {
    content: string;
    title?: string;
    className?: string;
}

export function ArticleReader({ content, title, className }: ArticleReaderProps) {
    // Simple paragraph splitter
    const paragraphs = content.split('\n').filter(p => p.trim().length > 0);

    return (
        <div className={cn("h-full bg-card/30 text-card-foreground font-serif", className)}>
            <ScrollArea className="h-full px-8 py-12 md:px-16 md:py-20">
                <div className="max-w-3xl mx-auto space-y-8">
                    {title && (
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-12 leading-tight text-primary/90">
                            {title}
                        </h1>
                    )}

                    <div className="space-y-8 text-lg md:text-xl leading-loose text-muted-foreground/90">
                        {paragraphs.map((paragraph, index) => (
                            <p key={index} className="first-letter:text-5xl first-letter:font-bold first-letter:mr-4 first-letter:float-left first-letter:text-primary first-letter:leading-[0.8] tracking-wide">
                                {paragraph}
                            </p>
                        ))}
                    </div>

                    <div className="pt-16 border-t border-border/50 mt-16 text-center text-muted-foreground/50 italic text-sm">
                        End of document
                    </div>
                    <div className="h-20" /> {/* Bottom spacer */}
                </div>
            </ScrollArea>
        </div>
    );
}
