import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    signInWithMagicLink: (email: string, metadata?: { phone?: string; full_name?: string }) => Promise<{ error: AuthError | null }>;
    signInWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signUpWithPassword: (email: string, password: string, metadata?: any) => Promise<{ error: AuthError | null }>;
    signInWithGoogle: () => Promise<{ error: AuthError | null }>;
    signInWithApple: () => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isSupabaseConfigured()) {
            console.warn('⚠️ Supabase no configurado. Auth deshabilitado.');
            setIsLoading(false);
            return;
        }

        // Get initial session
        const getInitialSession = async () => {
            try {
                const { data: { session: currentSession } } = await supabase.auth.getSession();
                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                // Create/update user profile if authenticated (non-blocking)
                if (currentSession?.user) {
                    upsertUserProfile(currentSession.user).catch(console.error);
                }
            } catch (error) {
                console.error('Error getting session:', error);
            } finally {
                setIsLoading(false);
            }
        };

        getInitialSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
                console.log('Auth state changed:', event);
                setSession(currentSession);
                setUser(currentSession?.user ?? null);
                setIsLoading(false); // Set loading false immediately

                if (event === 'SIGNED_IN' && currentSession?.user) {
                    // Non-blocking profile update
                    upsertUserProfile(currentSession.user).catch(console.error);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // Create or update user profile in database
    const upsertUserProfile = async (user: User) => {
        try {
            // @ts-ignore - user_profiles table will be created via SQL migration
            const { error } = await supabase
                .from('user_profiles')
                .upsert({
                    id: user.id,
                    email: user.email!,
                    display_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                    avatar_url: user.user_metadata?.avatar_url,
                    last_active_at: new Date().toISOString()
                }, { onConflict: 'id' });

            if (error) {
                console.error('Error upserting user profile:', error);
            }
        } catch (err) {
            console.error('Error in upsertUserProfile:', err);
        }
    };

    const signInWithMagicLink = async (email: string, metadata?: { phone?: string; full_name?: string }) => {
        if (!isSupabaseConfigured()) {
            return { error: { message: 'Supabase no configurado' } as AuthError };
        }

        // Use production URL for redirects, fallback to current origin for local dev
        const siteUrl = window.location.origin;

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${siteUrl}/`,
                data: metadata,
            },
        });

        return { error };
    };

    const signInWithGoogle = async () => {
        if (!isSupabaseConfigured()) {
            return { error: { message: 'Supabase no configurado' } as AuthError };
        }
        const siteUrl = window.location.origin;
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${siteUrl}/`,
            }
        });
        return { error };
    };

    const signInWithApple = async () => {
        if (!isSupabaseConfigured()) {
            return { error: { message: 'Supabase no configurado' } as AuthError };
        }
        const siteUrl = import.meta.env.VITE_SITE_URL || 'https://veridian.news';
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: {
                redirectTo: `${siteUrl}/`,
            }
        });
        return { error };
    };

    const signInWithPassword = async (email: string, password: string) => {
        if (!isSupabaseConfigured()) {
            return { error: { message: 'Supabase no configurado' } as AuthError };
        }
        console.log('Intentando inicio de sesión para:', email);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error('Error detallado de inicio de sesión:', error);
            // Manejo específico para email no confirmado
            if (error.message.includes('Email not confirmed')) {
                return { error: { ...error, message: 'Su email aún no ha sido verificado. Por favor, revise su bandeja de entrada.' } as AuthError };
            }
        }
        
        return { error };
    };

    const signUpWithPassword = async (email: string, password: string, metadata?: any) => {
        if (!isSupabaseConfigured()) {
            return { error: { message: 'Supabase no configurado' } as AuthError };
        }
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata,
            }
        });
        return { error };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
    };

    const value: AuthContextType = {
        user,
        session,
        isLoading,
        isAuthenticated: !!user,
        signInWithMagicLink,
        signInWithPassword,
        signUpWithPassword,
        signInWithGoogle,
        signInWithApple,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
