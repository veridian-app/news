import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldCheck } from 'lucide-react';
// import { motion } from 'framer-motion';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#020305] flex flex-col items-center justify-center space-y-6">
            <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
                    <div className="relative w-16 h-16 rounded-2xl bg-zinc-900 border border-emerald-500/30 flex items-center justify-center">
                        <ShieldCheck className="w-8 h-8 text-emerald-500" />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <p className="text-[10px] font-mono text-emerald-500 uppercase tracking-[0.4em] animate-pulse">Verificando Credenciales</p>
                    <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Protocolo Interno // Nivel 1</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
