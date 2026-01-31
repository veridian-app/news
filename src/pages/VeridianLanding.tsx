import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Globe, Shield, Sparkles, ArrowRight } from "lucide-react";

const VeridianLanding = () => {
  const navigate = useNavigate();

  const handleEnter = () => {
    navigate("/veridian-news");
  };

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
        <div className="flex items-center gap-4">
          <Button
            onClick={handleEnter}
            className="bg-white text-black hover:bg-white/90 rounded-full px-6 font-medium transition-transform active:scale-95 flex items-center gap-2"
          >
            Entrar <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 md:pt-48 pb-20 px-4 min-h-screen flex flex-col items-center text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 animate-fade-in-up">
          <Sparkles className="w-4 h-4 text-green-300 fill-green-300/20" />
          <span className="text-sm font-medium text-white/90">
            Revolucionando el consumo de noticias
          </span>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.1] mb-6 max-w-4xl bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent drop-shadow-sm">
          Noticias sin ruido.
          <br className="hidden md:block" />
          <span className="text-white">Solo la verdad.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-white/60 max-w-2xl mb-12 leading-relaxed">
          Únete a la primera plataforma diseñada para eliminar sesgos y devolverte el control. Inteligencia Artificial ética al servicio de tu criterio.
        </p>

        {/* Main Visual */}
        <div className="w-full max-w-4xl mx-auto mb-20 relative z-10 group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 blur-3xl -z-10 rounded-full opacity-50 group-hover:opacity-70 transition-opacity duration-700"></div>

          <div className="border border-white/10 bg-black/40 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50"></div>

            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
              Deja de hacer scroll en el ruido.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                Empieza a leer la verdad.
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 text-left">
              <div className="flex flex-col gap-2">
                <div className="w-10 h-10 rounded-full bg-green-900/30 flex items-center justify-center border border-green-500/30">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Sin Sesgos</h3>
                <p className="text-sm text-white/60">Algoritmos auditados para neutralidad total.</p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-900/30 flex items-center justify-center border border-emerald-500/30">
                  <Brain className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Hechos Puros</h3>
                <p className="text-sm text-white/60">Sin opiniones disfrazadas de noticias.</p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="w-10 h-10 rounded-full bg-green-900/30 flex items-center justify-center border border-green-500/30">
                  <Globe className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Control Total</h3>
                <p className="text-sm text-white/60">Tú decides qué te importa, no nosotros.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto w-full mb-32 px-4">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-left hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">100% Objetivo</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Nuestra IA analiza miles de fuentes para extraer solo los hechos verificados, eliminando opiniones y adjetivos sensacionalistas.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-left hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">Oraculus</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Tu detector de mentiras personal. Pega cualquier enlace y descubre quién lo financia, qué sesgos tiene y qué es verdad.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-left hover:bg-white/10 transition-colors md:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">Cobertura Global</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Acceso a fuentes de todo el mundo en tu idioma. Rompe la burbuja de información local.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="w-full max-w-xl mx-auto text-center px-4 relative z-20">
          <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl blur opacity-30"></div>
          <div className="relative bg-black border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl">
            <h2 className="text-3xl font-bold mb-2 text-white">Empieza Ahora</h2>
            <p className="text-white/60 mb-8">
              Accede a la plataforma y descubre la verdad.
            </p>

            <Button
              onClick={handleEnter}
              className="w-full sm:w-auto bg-white text-black hover:bg-white/90 rounded-full px-8 py-6 text-lg font-bold transition-transform active:scale-95 flex items-center justify-center gap-2 mx-auto"
            >
              Entrar a Veridian
              <ArrowRight className="w-5 h-5" />
            </Button>

            <p className="text-xs text-white/40 mt-6">
              Sin registro. Gratis para todos.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-32 pb-10 text-center text-white/20 text-sm">
          <p>© 2025 Veridian Inc. Todos los derechos reservados.</p>
        </footer>

      </section>
    </div>
  );
};

export default VeridianLanding;
