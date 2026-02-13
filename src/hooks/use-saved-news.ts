import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface NewsItem {
    id: string;
    title: string;
    summary: string;
    content: string;
    image?: string;
    date: string;
    source: string;
    url?: string;
    likes?: number; // legacy
    comments?: number; // legacy
}

const LOCAL_STORAGE_KEY = 'veridian_saved_news';

export const useSavedNews = () => {
    const [savedNews, setSavedNews] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load saved news from localStorage
    useEffect(() => {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                setSavedNews(parsed);
            } catch (e) {
                console.error('Error parsing cached saved news:', e);
            }
        }
        setIsLoading(false);
    }, []);

    // Save to localStorage whenever state changes
    useEffect(() => {
        if (!isLoading) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedNews));
        }
    }, [savedNews, isLoading]);

    // Check if a news item is saved
    const isSaved = useCallback((newsId: string) => {
        return savedNews.some(item => item.id === newsId);
    }, [savedNews]);

    // Toggle save status
    const toggleSave = useCallback((item: NewsItem) => {
        setSavedNews(prev => {
            const exists = prev.some(n => n.id === item.id);
            if (exists) {
                toast("Eliminado de guardados");
                return prev.filter(n => n.id !== item.id);
            } else {
                toast("Guardado en tu dossier");
                // Add to beginning of list
                return [item, ...prev];
            }
        });
    }, []);

    return {
        savedNews,
        isSaved,
        toggleSave,
        isLoading
    };
};
