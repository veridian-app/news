import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Shield, Sparkles, ArrowRight, Mail, Loader2, CheckCircle, Users, Zap, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";

const VeridianLanding = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, signInWithMagicLink } = useAuth();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  useEffect(() => {
    const cookiesAccepted = localStorage.getItem('cookies-accepted');
    if (!cookiesAccepted) {
      setShowCookieBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookies-accepted', 'true');
    setShowCookieBanner(false);
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/veridian-news');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setError('Introduce un email válido');
      return;
    }

    if (!acceptedTerms) {
      setError('Debes aceptar la Política de Privacidad y el Aviso Legal');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const { error: authError } = await signInWithMagicLink(email);

    setIsSubmitting(false);

    if (authError) {
      setError(authError.message);
    } else {
      setIsSent(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-black text-white relative overflow-x-hidden font-sans selection:bg-green-500/30 selection:text-green-200">

      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-green-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-6 flex justify-between items-center backdrop-blur-sm bg-black/0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/20">
            <Shield className="w-5 h-5 text-white fill-white/20" />
          </div>
          <span className="font-bold text-xl tracking-tight hidden md:block">Veridian</span>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-24 md:pt-32 pb-20 px-4 min-h-screen flex flex-col items-center text-center">

        {/* Social Proof Badge */}
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 animate-fade-in-up">
          <div className="flex -space-x-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-green-400 to-emerald-500 flex items-center justify-center text-[10px] font-bold">V</div>
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-400 to-cyan-500 flex items-center justify-center text-[10px] font-bold">R</div>
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-400 to-pink-500 flex items-center justify-center text-[10px] font-bold">A</div>
          </div>
          <span className="text-sm text-white/80">
            <span className="font-semibold text-white">2,847</span> personas leen sin sesgos
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[1.1] mb-6 max-w-4xl">
          <span className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
            Noticias sin ruido.
          </span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
            Solo la verdad.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-white/60 max-w-xl mb-10 leading-relaxed">
          La primera plataforma de noticias diseñada para eliminar sesgos.
          IA ética al servicio de tu criterio.
        </p>

        {/* Email Signup Form - THE MAIN CTA */}
        <div className="w-full max-w-md mx-auto mb-16">
          {!isSent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all text-lg"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <div className="flex items-start space-x-2 px-1">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                  className="mt-1 border-white/30 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-white/60 leading-tight cursor-pointer select-none"
                >
                  He leído y acepto la <a href="/privacidad" target="_blank" className="text-green-400 hover:underline">Política de Privacidad</a> y el <a href="/aviso-legal" target="_blank" className="text-green-400 hover:underline">Aviso Legal</a>.
                </label>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-6 rounded-xl transition-all text-lg flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Acceder gratis <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>

              <p className="text-white/40 text-sm text-center">
                Sin contraseñas. Te enviamos un enlace mágico.
              </p>
            </form>
          ) : (
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">¡Revisa tu email!</h3>
              <p className="text-white/60">
                Hemos enviado un enlace mágico a<br />
                <span className="text-white font-medium">{email}</span>
              </p>
              <p className="text-white/40 text-xs mt-4">
                ¿No lo ves? Revisa spam
              </p>
            </div>
          )}
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center gap-6 mb-16 text-sm text-white/50">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-green-400" />
            <span>Acceso inmediato</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-400" />
            <span>100% privado</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-green-400" />
            <span>Sin anuncios</span>
          </div>
        </div>

        {/* Features Grid - Compact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto w-full mb-20 px-4">
          <div className="p-5 rounded-xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mb-3">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="font-bold mb-1 text-white">Sin Sesgos</h3>
            <p className="text-white/50 text-sm">Algoritmos auditados para neutralidad total.</p>
          </div>

          <div className="p-5 rounded-xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-3">
              <Brain className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-bold mb-1 text-white">Solo Hechos</h3>
            <p className="text-white/50 text-sm">Sin opiniones disfrazadas de noticias.</p>
          </div>

          <div className="p-5 rounded-xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="font-bold mb-1 text-white">Comunidad</h3>
            <p className="text-white/50 text-sm">Debates y encuestas diarias en Café Veridian.</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-auto pb-10 text-center text-white/20 text-sm space-y-2">
          <div className="flex justify-center gap-4">
            <a href="/privacidad" className="hover:text-white/40 transition-colors">Privacidad</a>
            <a href="/terminos" className="hover:text-white/40 transition-colors">Términos</a>
            <a href="/aviso-legal" className="hover:text-white/40 transition-colors">Aviso Legal</a>
          </div>
          <p>© 2025 Veridian Inc.</p>
        </footer>

      </section>

      {/* Cookie Banner */}
      {showCookieBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-zinc-900/95 backdrop-blur-md border-t border-white/10 animate-fade-in-up">
          <div className="container mx-auto max-w-4xl flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/70 text-center md:text-left">
              Utilizamos cookies propias y de terceros para mejorar tu experiencia y analizar el uso de la web.
              Puedes consultar nuestra <a href="/privacidad" className="text-green-400 hover:underline">Política de Cookies</a>.
            </p>
            <Button
              onClick={acceptCookies}
              variant="outline"
              className="whitespace-nowrap bg-white text-black hover:bg-white/90 border-transparent font-medium"
            >
              Aceptar cookies
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VeridianLanding;
