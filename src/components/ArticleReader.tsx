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
        <div className={cn("h-full bg-background text-foreground", className)}>
            <ScrollArea className="h-full px-6 py-8 md:px-10 md:py-10">
                <div className="max-w-3xl mx-auto space-y-6">
                    {title && (
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-6 text-primary">
                            {title}
                        </h1>
                    )}

                    <div className="space-y-4 text-base md:text-lg leading-relaxed text-muted-foreground">
                        {paragraphs.map((paragraph, index) => (
                            <p key={index}>
                                {paragraph}
                            </p>
                        ))}
                    </div>

                    <div className="pt-12 border-t border-border/50 mt-12 text-center text-muted-foreground/50 italic text-sm">
                        End of document
                    </div>
                    <div className="h-20" />
                </div>
            </ScrollArea>
        </div>
    );
}
