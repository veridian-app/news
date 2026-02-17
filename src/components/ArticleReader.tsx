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
        <div className={cn("h-full bg-white text-gray-900 font-serif", className)}>
            <ScrollArea className="h-full px-8 py-12 md:px-12 md:py-16">
                <div className="max-w-2xl mx-auto space-y-6">
                    {title && (
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8 leading-tight">
                            {title}
                        </h1>
                    )}

                    <div className="space-y-6 text-lg leading-relaxed text-gray-800">
                        {paragraphs.map((paragraph, index) => (
                            <p key={index} className="first-letter:text-5xl first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:text-gray-900 first-letter:leading-[0.8]">
                                {paragraph}
                            </p>
                        ))}
                    </div>

                    <div className="pt-12 border-t border-gray-200 mt-12 text-center text-gray-500 italic text-sm">
                        End of document
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
