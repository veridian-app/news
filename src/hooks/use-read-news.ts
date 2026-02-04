import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const LOCAL_STORAGE_KEY = 'veridian_read_news';

export const useReadNews = () => {
    const { user } = useAuth();
    const [readNewsIds, setReadNewsIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);

    // Load read news from localStorage first (instant), then sync with DB
    useEffect(() => {
        // Load from localStorage immediately
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                setReadNewsIds(new Set(parsed));
            } catch (e) {
                console.error('Error parsing cached read news:', e);
            }
        }

        // Then load from DB if user is logged in
        const loadFromDB = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }

            try {
                // @ts-ignore - table needs to be created
                const { data, error } = await supabase
                    .from('user_read_news')
                    .select('news_id')
                    .eq('user_id', user.id);

                if (error) throw error;

                if (data) {
                    const ids = data.map((item: any) => item.news_id);
                    setReadNewsIds(new Set(ids));
                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ids));
                }
            } catch (err) {
                console.error('Error loading read news:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadFromDB();
    }, [user]);

    // Check if a news item is read
    const isRead = useCallback((newsId: string) => {
        return readNewsIds.has(newsId);
    }, [readNewsIds]);

    // Mark a news item as read
    const markAsRead = useCallback(async (newsId: string) => {
        if (readNewsIds.has(newsId)) return; // Already read

        // Optimistic update
        const newSet = new Set(readNewsIds);
        newSet.add(newsId);
        setReadNewsIds(newSet);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([...newSet]));

        // Sync to DB if logged in
        if (user) {
            try {
                // @ts-ignore - table needs to be created
                await supabase
                    .from('user_read_news')
                    .upsert({
                        user_id: user.id,
                        news_id: newsId,
                        read_at: new Date().toISOString()
                    }, { onConflict: 'user_id,news_id' });
            } catch (err) {
                console.error('Error marking news as read:', err);
            }
        }
    }, [readNewsIds, user]);

    // Mark a news item as unread
    const markAsUnread = useCallback(async (newsId: string) => {
        if (!readNewsIds.has(newsId)) return; // Not read

        // Optimistic update
        const newSet = new Set(readNewsIds);
        newSet.delete(newsId);
        setReadNewsIds(newSet);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([...newSet]));

        // Sync to DB if logged in
        if (user) {
            try {
                // @ts-ignore - table needs to be created
                await supabase
                    .from('user_read_news')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('news_id', newsId);
            } catch (err) {
                console.error('Error marking news as unread:', err);
            }
        }
    }, [readNewsIds, user]);

    // Toggle read status
    const toggleRead = useCallback((newsId: string) => {
        if (readNewsIds.has(newsId)) {
            markAsUnread(newsId);
        } else {
            markAsRead(newsId);
        }
    }, [readNewsIds, markAsRead, markAsUnread]);

    // Sort news items with unread first
    const sortByReadStatus = useCallback(<T extends { id: string }>(items: T[]): T[] => {
        return [...items].sort((a, b) => {
            const aRead = readNewsIds.has(a.id);
            const bRead = readNewsIds.has(b.id);

            if (aRead === bRead) return 0;
            return aRead ? 1 : -1; // Unread first
        });
    }, [readNewsIds]);

    return {
        readNewsIds,
        isRead,
        markAsRead,
        markAsUnread,
        toggleRead,
        sortByReadStatus,
        isLoading
    };
};
