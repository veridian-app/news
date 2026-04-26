import React, { useState, useEffect } from 'react';
import { Mail, Lock, Shield, ArrowRight, CheckCircle2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from "../components/ui/button";
import { InstallAppModal } from '../components/InstallAppModal';

const VeridianLanding = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isSent, setIsSent] = useState(false);
  const [error] = useState<string | null>(null);

  // PWA Logic
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Capture install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowInstallModal(true);
  };

  const executeInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallModal(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSent(true);
    setTimeout(() => {
      window.location.href = '/';
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30 selection:text-emerald-400 overflow-x-hidden flex flex-col relative">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/5 blur-[120px] animate-pulse delay-1000" />
      </div>

      <header className="w-full px-6 py-8 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-[1000]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-lg font-bold tracking-tight uppercase italic">Veridian</span>
        </div>
        <div className="flex items-center gap-4">
          <a 
            href="#" 
            onClick={handleInstallClick}
            className="px-4 py-1.5 rounded-full bg-emerald-500 text-black text-[9px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95 whitespace-nowrap"
          >
            <span className="xs:hidden">App</span>
            <span className="hidden xs:inline">Descargar web.app</span>
          </a>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-md relative">
          <div className="bg-[#0A0A0A]/80 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 md:p-12 shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
            {!isSent ? (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black uppercase tracking-tight italic leading-none">
                    {authMode === 'login' ? 'Acceso_Terminal' : 'Crear_Identidad'}
                  </h2>
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/30">Protocolo Veridian V.9</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-white/30 ml-1">Identificador_Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-14 bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                        placeholder="operador@veridian.intel"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-white/30 ml-1">Clave_Acceso</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-14 bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{error}</p>
                  </div>
                )}

                <Button 
                  type="submit"
                  className={`w-full h-14 rounded-xl text-[11px] font-black uppercase tracking-[0.3em] transition-all relative overflow-hidden group shadow-[0_20px_40px_rgba(0,0,0,0.3)] ${authMode === 'signup' ? 'bg-cyan-500 hover:bg-cyan-400' : 'bg-emerald-500 hover:bg-emerald-400'} text-black`}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {authMode === 'login' ? 'Sincronizar' : 'Registrar'} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-white transition-all"
                  >
                    {authMode === 'login' ? '¿No tiene terminal? CREAR' : '¿Ya es operador? ACCEDER'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-10 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black uppercase tracking-tight italic">Acceso Concedido</h3>
                  <p className="text-[10px] text-white/40 font-mono tracking-widest uppercase">Redireccionando al terminal...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="w-full px-6 py-6 flex items-center justify-between border-t border-white/5 bg-black/20">
        <div className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">
          © 2024 Veridian Corp
        </div>
        <div className="flex items-center gap-6 text-[9px] font-bold uppercase tracking-widest text-white/20">
          <a href="#" className="hover:text-emerald-500 transition-colors">Privacidad</a>
          <a href="#" className="hover:text-emerald-500 transition-colors">Términos</a>
        </div>
      </footer>

      <InstallAppModal 
        isOpen={showInstallModal} 
        onClose={() => setShowInstallModal(false)}
        isIOS={isIOS}
        onInstall={executeInstall}
        canInstall={!!deferredPrompt}
      />
    </div>
  );
};

export default VeridianLanding;
