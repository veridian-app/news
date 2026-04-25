import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Shield, Loader2, 
  Mail, Lock, ChevronRight, EyeOff, Eye,
  Terminal, ShieldCheck, CheckCircle2,
  ArrowLeft, UserPlus, Fingerprint
} from "lucide-react";
import { Button } from "@/components/ui/button";

const VeridianLanding = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { 
    isAuthenticated, 
    isLoading, 
    signInWithPassword,
    signUpWithPassword,
    signInWithGoogle
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated && !isLoading) {
      navigate("/veridian-news");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { error: authError } = authMode === 'login' 
      ? await signInWithPassword(email, password)
      : await signUpWithPassword(email, password);

    setIsSubmitting(false);
    
    if (authError) {
      setError(authError.message);
    } else if (authMode === 'signup') {
      setIsSent(true);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
    setIsSubmitting(false);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#020305] text-white font-sans selection:bg-emerald-500/30 flex flex-col transition-colors duration-700">
      {/* Fondo Dinámico según modo */}
      <div className={`fixed inset-0 transition-opacity duration-1000 ${authMode === 'signup' ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_rgba(6,182,212,0.08)_0%,_transparent_60%)]" />
      </div>
      <div className={`fixed inset-0 transition-opacity duration-1000 ${authMode === 'login' ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_rgba(16,185,129,0.08)_0%,_transparent_60%)]" />
      </div>

      <header className="w-full px-6 py-6 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg transition-all duration-500 ${authMode === 'signup' ? 'bg-cyan-500 shadow-cyan-500/20' : 'bg-emerald-500 shadow-emerald-500/20'}`}>
            {authMode === 'signup' ? <UserPlus className="w-5 h-5 text-black" /> : <Shield className="w-5 h-5 text-black" />}
          </div>
          <span className="text-lg font-bold tracking-tight uppercase italic">Veridian</span>
        </div>
        <div className="flex items-center gap-4">
          <a 
            href="#" 
            className="px-4 py-1.5 rounded-full bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95"
          >
            Descargar web.app
          </a>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse transition-colors duration-500 ${authMode === 'signup' ? 'bg-cyan-500' : 'bg-emerald-500'}`} />
            <span className={`text-[9px] font-mono uppercase tracking-widest transition-colors duration-500 ${authMode === 'signup' ? 'text-cyan-500/70' : 'text-emerald-500/70'}`}>
              {authMode === 'signup' ? 'Nuevo Registro' : 'Sistema Activo'}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-[440px] space-y-8">
          
          {/* Header de Sección Dinámico */}
          <div className="text-center space-y-3">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-500 ${
              authMode === 'signup' 
                ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            } mb-2`}>
              {authMode === 'signup' ? <Fingerprint className="w-3 h-3" /> : <Terminal className="w-3 h-3" />}
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                {authMode === 'signup' ? 'Inicialización de Perfil' : 'Protocolo de Acceso'}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter transition-all duration-500">
              {authMode === 'signup' ? (
                <>Registro <span className="text-cyan-500">Operador</span></>
              ) : (
                <>Veridian <span className="text-emerald-500">News</span></>
              )}
            </h1>
            <p className="text-sm text-white/40 font-medium">
              {authMode === 'signup' 
                ? 'Cree su identidad digital en la red Veridian.' 
                : 'Identifíquese para acceder al terminal de inteligencia.'}
            </p>
          </div>

          {/* Tarjeta con Borde Dinámico */}
          <div className={`bg-zinc-900/40 border rounded-[2rem] p-8 md:p-10 backdrop-blur-xl shadow-2xl transition-all duration-700 ${
            authMode === 'signup' ? 'border-cyan-500/20 shadow-cyan-500/5' : 'border-white/5 shadow-black'
          }`}>
            {!isSent ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-white/30 ml-1">Email de Operador</label>
                    <div className={`flex items-center gap-3 bg-white/5 border rounded-xl px-4 transition-all focus-within:ring-1 ${
                      authMode === 'signup' ? 'focus-within:border-cyan-500/50 focus-within:ring-cyan-500/20 border-white/10' : 'focus-within:border-emerald-500/50 focus-within:ring-emerald-500/20 border-white/10'
                    }`}>
                      <Mail className={`w-5 h-5 transition-colors ${authMode === 'signup' ? 'text-cyan-500/40' : 'text-emerald-500/40'}`} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1 h-14 bg-transparent text-sm focus:outline-none"
                        placeholder="operador@veridian.io"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-white/30 ml-1">Clave de Seguridad</label>
                    <div className={`flex items-center gap-3 bg-white/5 border rounded-xl px-4 transition-all focus-within:ring-1 ${
                      authMode === 'signup' ? 'focus-within:border-cyan-500/50 focus-within:ring-cyan-500/20 border-white/10' : 'focus-within:border-emerald-500/50 focus-within:ring-emerald-500/20 border-white/10'
                    }`}>
                      <Lock className={`w-5 h-5 transition-colors ${authMode === 'signup' ? 'text-cyan-500/40' : 'text-emerald-500/40'}`} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="flex-1 h-14 bg-transparent text-sm focus:outline-none"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-2 text-white/20 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center animate-in fade-in slide-in-from-top-1">
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full h-14 text-black font-black uppercase tracking-[0.2em] rounded-xl shadow-lg transition-all duration-500 ${
                    authMode === 'signup' 
                      ? 'bg-cyan-500 hover:bg-cyan-400 shadow-cyan-500/10' 
                      : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/10'
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                  <div className="relative flex justify-center text-[9px] uppercase tracking-widest text-white/20 bg-transparent px-2 mx-auto w-fit">O</div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-3 transition-all group"
                >
                  <svg className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.29.81-.55z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 group-hover:text-white">Red Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="w-full text-[11px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all mt-4 py-2"
                >
                  {authMode === 'login' ? (
                    <>¿No tiene terminal? <span className="text-emerald-500 underline underline-offset-4 ml-1">CREAR IDENTIDAD</span></>
                  ) : (
                    <>¿Ya es operador? <span className="text-cyan-500 underline underline-offset-4 ml-1">INICIAR SESIÓN</span></>
                  )}
                </button>
              </form>
            ) : (
              <div className="py-10 text-center space-y-6 animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                  <CheckCircle2 className="w-10 h-10 text-cyan-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black uppercase tracking-tight italic">Identidad en Espera</h3>
                  <p className="text-sm text-white/40 leading-relaxed">
                    Hemos enviado un enlace de sincronización a <span className="text-cyan-500 font-bold">{email}</span>. Verifique su terminal para activar el acceso.
                  </p>
                </div>
                <button
                  onClick={() => setIsSent(false)}
                  className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-cyan-500 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Volver al Panel
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="w-full px-6 py-6 flex flex-col md:flex-row items-center justify-between border-t border-white/5 bg-black/20 gap-4">
        <div className="flex items-center gap-4 text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">
          <span>© 2024 Veridian Corp</span>
          <span className="hidden md:inline">|</span>
          <span className={authMode === 'signup' ? 'text-cyan-500/40' : 'text-emerald-500/40'}>
            Status: {authMode === 'signup' ? 'Registering' : 'Ready'}
          </span>
        </div>
        <div className="flex items-center gap-6 text-[9px] font-bold uppercase tracking-widest text-white/20">
          <a href="/privacidad" className="hover:text-emerald-500 transition-colors">Privacidad</a>
          <a href="/terminos" className="hover:text-emerald-500 transition-colors">Términos</a>
        </div>
      </footer>
    </div>
  );
};

export default VeridianLanding;
