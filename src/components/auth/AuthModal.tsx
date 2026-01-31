import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const { signInWithMagicLink } = useAuth();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            setError('Por favor, introduce un email válido');
            return;
        }

        setIsLoading(true);
        setError(null);

        const { error: authError } = await signInWithMagicLink(email);

        setIsLoading(false);

        if (authError) {
            setError(authError.message);
        } else {
            setIsSent(true);
        }
    };

    const handleClose = () => {
        setEmail('');
        setIsSent(false);
        setError(null);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 px-4"
                    >
                        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                            {/* Glow effect */}
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-green-500/20 rounded-full blur-3xl" />
                            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />

                            {/* Close button */}
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="relative z-10">
                                {!isSent ? (
                                    <>
                                        <div className="text-center mb-8">
                                            <div className="w-16 h-16 bg-gradient-to-tr from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
                                                <Mail className="w-8 h-8 text-white" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-white mb-2">
                                                Entra a Veridian
                                            </h2>
                                            <p className="text-white/60 text-sm">
                                                Te enviaremos un enlace mágico a tu email. Sin contraseñas.
                                            </p>
                                        </div>

                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="tu@email.com"
                                                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all"
                                                    disabled={isLoading}
                                                    autoFocus
                                                />
                                            </div>

                                            {error && (
                                                <p className="text-red-400 text-sm text-center">{error}</p>
                                            )}

                                            <Button
                                                type="submit"
                                                disabled={isLoading}
                                                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-6 rounded-xl transition-all flex items-center justify-center gap-2"
                                            >
                                                {isLoading ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <>
                                                        Continuar <ArrowRight className="w-5 h-5" />
                                                    </>
                                                )}
                                            </Button>
                                        </form>

                                        <p className="text-center text-white/40 text-xs mt-6">
                                            Al continuar, aceptas nuestros{' '}
                                            <a href="/terminos" className="underline hover:text-white/60">
                                                Términos
                                            </a>{' '}
                                            y{' '}
                                            <a href="/privacidad" className="underline hover:text-white/60">
                                                Política de Privacidad
                                            </a>
                                        </p>
                                    </>
                                ) : (
                                    <div className="text-center py-4">
                                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle className="w-8 h-8 text-green-400" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white mb-2">
                                            ¡Revisa tu email!
                                        </h2>
                                        <p className="text-white/60 text-sm mb-6">
                                            Hemos enviado un enlace mágico a<br />
                                            <span className="text-white font-medium">{email}</span>
                                        </p>
                                        <p className="text-white/40 text-xs">
                                            No lo ves? Revisa tu carpeta de spam
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
