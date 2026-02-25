import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Shield,
  Brain,
  Eye,
  ArrowRight,
  Loader2,
  Globe,
  Star,
  HelpCircle,
  CheckCircle,
  Mail,
  Phone,
} from "lucide-react";

/*
 * Landing page CSS variables — scoped to this page only.
 * These override the app-wide dark theme to match the original
 * Veridian warm-cream + dark-green design.
 */
const landingThemeVars: React.CSSProperties & Record<string, string> = {
  "--background": "44 26% 94%",
  "--foreground": "167 38% 17%",
  "--card": "44 26% 90%",
  "--card-foreground": "167 38% 17%",
  "--popover": "44 26% 94%",
  "--popover-foreground": "167 38% 17%",
  "--primary": "167 38% 17%",
  "--primary-foreground": "44 26% 94%",
  "--primary-dark": "167 40% 14%",
  "--primary-light": "167 30% 25%",
  "--secondary": "167 15% 85%",
  "--secondary-foreground": "167 38% 17%",
  "--muted": "44 10% 85%",
  "--muted-foreground": "167 20% 40%",
  "--accent": "35 30% 80%",
  "--accent-foreground": "167 38% 17%",
  "--border": "167 38% 17%",
  "--input": "167 38% 17%",
  "--ring": "167 38% 17%",
  "--shadow-glow": "0 4px 20px hsl(167 38% 17% / 0.1)",
  "--shadow-card":
    "0 4px 6px -1px hsl(167 38% 17% / 0.1), 0 2px 4px -1px hsl(167 38% 17% / 0.06)",
};

const VeridianLanding = () => {
  const navigate = useNavigate();
  const { language, t, toggleLanguage } = useLanguage();
  const { isAuthenticated, isLoading, signInWithMagicLink } = useAuth();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  const featuresRef = useRef<HTMLDivElement>(null);
  const missionRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const tryFreeLabel = language === "es" ? "Pruébalo gratis" : "Try it free";

  useEffect(() => {
    const cookiesAccepted = localStorage.getItem("cookies-accepted");
    if (!cookiesAccepted) {
      setShowCookieBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookies-accepted", "true");
    setShowCookieBanner(false);
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/veridian-news");
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Intersection Observer for scroll-reveal animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute("data-section-id");
            if (sectionId) {
              setVisibleSections((prev) => new Set(prev).add(sectionId));
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    const sections = [featuresRef.current, missionRef.current, ctaRef.current];
    sections.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => {
      sections.forEach((section) => {
        if (section) observer.unobserve(section);
      });
    };
  }, []);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setError(language === "es" ? "Introduce un email válido" : "Enter a valid email");
      return;
    }

    if (!acceptedTerms) {
      setError(
        language === "es"
          ? "Debes aceptar la Política de Privacidad y el Aviso Legal"
          : "You must accept the Privacy Policy and Legal Notice"
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const metadata: { phone?: string } = {};
    if (phone.trim()) {
      metadata.phone = phone.trim();
    }

    const { error: authError } = await signInWithMagicLink(email, metadata);

    setIsSubmitting(false);

    if (authError) {
      setError(authError.message);
    } else {
      setIsSent(true);
    }
  };

  /* Reusable section CTA */
  const SectionCTA = () => (
    <div className="text-center mt-10 md:mt-12">
      <Button
        onClick={() => scrollToSection(ctaRef)}
        className="bg-primary text-primary-foreground hover:bg-primary-dark transition-all duration-300 shadow-sm h-11 px-6 text-base"
      >
        {tryFreeLabel}
        <ArrowRight className="ml-2 w-4 h-4" />
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background text-foreground relative font-sans selection:bg-primary/20"
      style={landingThemeVars}
    >

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border/10">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-primary rounded-sm flex items-center justify-center">
              <span className="text-background font-bold text-xs">V</span>
            </div>
            <span className="text-lg md:text-xl font-bold tracking-tight text-primary">Veridian News</span>
          </div>
          <div className="flex items-center gap-2 md:gap-6">
            <button onClick={() => scrollToSection(featuresRef)} className="text-sm font-medium hover:text-primary/70 transition-colors hidden md:block">
              {t.nav.technology}
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="gap-1 md:gap-2 text-primary hover:bg-primary/5 px-2 md:px-3"
            >
              <Globe className="w-4 h-4" />
              <span className="text-xs md:text-sm">{language === "es" ? "EN" : "ES"}</span>
            </Button>
            <Button
              onClick={() => scrollToSection(ctaRef)}
              className="bg-primary text-primary-foreground hover:bg-primary-dark transition-all duration-300 shadow-sm text-sm md:text-base px-3 md:px-4 h-9 md:h-10"
            >
              {tryFreeLabel}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 md:pt-48 pb-16 md:pb-32 px-4 overflow-hidden">
        <div className="container mx-auto max-w-5xl text-center space-y-6 md:space-y-8 z-10 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium tracking-wide border border-border/20 mb-2 md:mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            {language === "es" ? "Ya disponible" : "Available now"}
          </div>

          <h1 className="text-4xl md:text-7xl lg:text-8xl font-bold tracking-tight text-primary leading-[1.05] animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both delay-100">
            {t.hero.landingTitle}
            <span className="block text-primary/80 mt-1 md:mt-2 font-serif italic font-normal text-3xl md:text-6xl lg:text-7xl">
              {t.hero.landingSubtitle}
            </span>
          </h1>

          <p className="text-base md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both delay-200 px-2">
            {t.hero.landingDescription}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 pt-4 md:pt-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both delay-300">
            <Button
              size="lg"
              onClick={() => scrollToSection(ctaRef)}
              className="h-12 md:h-14 px-6 md:px-8 text-base md:text-lg bg-primary text-primary-foreground hover:bg-primary-dark transition-all shadow-lg hover:shadow-xl w-full sm:w-auto"
            >
              {tryFreeLabel}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollToSection(featuresRef)}
              className="h-12 md:h-14 px-6 md:px-8 text-base md:text-lg border-primary/20 hover:bg-secondary/50 text-secondary-foreground w-full sm:w-auto"
            >
              {t.hero.landingCtaSecondary}
            </Button>
          </div>
        </div>
      </section>

      {/* Mission / Stats Section */}
      <section ref={missionRef} data-section-id="mission" className="py-16 md:py-24 bg-secondary/30 relative border-y border-border/5">
        <div className={`container mx-auto px-4 max-w-6xl transition-all duration-1000 ${visibleSections.has("mission") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div className="grid grid-cols-2 gap-6 md:gap-12 text-center">
            <div className="space-y-2">
              <p className="text-2xl md:text-4xl font-serif italic text-primary">{t.mission.stat1}</p>
            </div>
            <div className="space-y-2">
              <p className="text-2xl md:text-4xl font-serif italic text-primary">{t.mission.stat2}</p>
            </div>
          </div>
          <div className="mt-10 md:mt-16 text-center max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-primary">{t.mission.title}</h2>
            <p className="text-base md:text-xl text-muted-foreground leading-relaxed px-2">
              {t.mission.description}
            </p>
          </div>
          <SectionCTA />
        </div>
      </section>

      {/* Features Grid */}
      <section ref={featuresRef} data-section-id="features" className="py-16 md:py-32 px-4">
        <div className={`container mx-auto max-w-6xl transition-all duration-1000 ${visibleSections.has("features") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div className="text-center mb-10 md:mb-20 space-y-3 md:space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold text-primary">{t.landingFeatures.title}</h2>
            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-2">{t.landingFeatures.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {t.landingFeatures.items.map((item, i) => (
              <Card key={i} className="p-6 md:p-8 bg-card border border-border/10 hover:border-primary/20 transition-all duration-300 shadow-card hover:shadow-lg group">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-secondary rounded-lg flex items-center justify-center mb-4 md:mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {item.icon === "Shield" && <Shield className="w-5 h-5 md:w-6 md:h-6" />}
                  {item.icon === "Brain" && <Brain className="w-5 h-5 md:w-6 md:h-6" />}
                  {item.icon === "Eye" && <Eye className="w-5 h-5 md:w-6 md:h-6" />}
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-primary">{item.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </Card>
            ))}
          </div>
          <SectionCTA />
        </div>
      </section>

      {/* CRAAP Method Section */}
      <section className="py-16 md:py-24 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10 md:mb-16 space-y-3 md:space-y-4">
            <h2 className="text-2xl md:text-4xl font-bold text-primary">{t.methodology.title}</h2>
            <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">{t.methodology.subtitle}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
            {t.methodology.items.map((item, i) => (
              <Card key={i} className={`p-4 md:p-6 border-border/10 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-card/40 ${i === 4 ? "col-span-2 md:col-span-1" : ""}`}>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 md:mb-4 mx-auto">
                  <span className="text-xl md:text-2xl font-bold text-primary">{item.letter}</span>
                </div>
                <h3 className="text-sm md:text-lg font-bold text-center mb-1 md:mb-2">{item.title}</h3>
                <p className="text-xs md:text-sm text-center text-muted-foreground">
                  {item.description}
                </p>
              </Card>
            ))}
          </div>
          <SectionCTA />
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-secondary/20 border-y border-border/5">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-10 md:mb-16 space-y-3 md:space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-primary">{t.testimonials.title}</h2>
            <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">{t.testimonials.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {t.testimonials.items.map((item, i) => (
              <Card key={i} className="p-6 md:p-8 bg-card border-none shadow-sm h-full flex flex-col justify-between">
                <div className="mb-4 md:mb-6">
                  <div className="flex gap-1 mb-3 md:mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-3 h-3 md:w-4 md:h-4 text-primary fill-primary" />
                    ))}
                  </div>
                  <p className="text-sm md:text-base text-muted-foreground italic leading-relaxed">"{item.quote}"</p>
                </div>
                <div>
                  <p className="font-bold text-primary text-sm md:text-base">{item.author}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">{item.role}</p>
                </div>
              </Card>
            ))}
          </div>
          <SectionCTA />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 px-4 bg-background">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-10 md:mb-16 space-y-3 md:space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-primary">{t.faq.title}</h2>
          </div>
          <div className="space-y-3 md:space-y-4">
            {t.faq.items.map((item, i) => (
              <Card key={i} className="p-4 md:p-6 border border-border/10 hover:border-primary/20 transition-all bg-card/40">
                <h3 className="font-bold text-sm md:text-lg text-primary mb-1 md:mb-2 flex items-start gap-2">
                  <div className="bg-primary/10 p-1 rounded-full mt-0.5 shrink-0">
                    <HelpCircle className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                  </div>
                  <span>{item.question}</span>
                </h3>
                <p className="text-xs md:text-base text-muted-foreground pl-7 md:pl-8">{item.answer}</p>
              </Card>
            ))}
          </div>
          <SectionCTA />
        </div>
      </section>

      {/* Registration / CTA Section */}
      <section ref={ctaRef} data-section-id="cta" className="py-16 md:py-32 px-4 bg-background relative">
        <div className="container mx-auto max-w-2xl">

          <div className="bg-card p-6 md:p-12 rounded-2xl border border-border/10 shadow-card text-center space-y-6 md:space-y-8">
            <div className="space-y-3 md:space-y-4">
              <h2 className="text-2xl md:text-4xl font-bold text-primary">
                {tryFreeLabel}
              </h2>
              <p className="text-sm md:text-lg text-muted-foreground px-2">
                {language === "es"
                  ? "Regístrate gratis y empieza a informarte con hechos verificados. Sin contraseñas, te enviamos un enlace mágico."
                  : "Sign up for free and start getting verified facts. No passwords, we'll send you a magic link."}
              </p>
            </div>

            {!isSent ? (
              <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4 max-w-md mx-auto">
                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.form.email}
                    className="w-full pl-10 pr-4 h-11 md:h-12 bg-background border border-border/20 rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all text-sm md:text-base"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Phone */}
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t.form.phone}
                    className="w-full pl-10 pr-4 h-11 md:h-12 bg-background border border-border/20 rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all text-sm md:text-base"
                    disabled={isSubmitting}
                  />
                </div>

                {error && (
                  <p className="text-red-600 text-xs md:text-sm text-left">{error}</p>
                )}

                <div className="flex items-start space-x-2 text-left">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    className="mt-0.5 border-border/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label
                    htmlFor="terms"
                    className="text-xs md:text-sm text-muted-foreground leading-tight cursor-pointer select-none"
                  >
                    {language === "es" ? (
                      <>He leído y acepto la <a href="/privacidad" target="_blank" className="text-primary hover:underline">Política de Privacidad</a> y el <a href="/aviso-legal" target="_blank" className="text-primary hover:underline">Aviso Legal</a>.</>
                    ) : (
                      <>I have read and accept the <a href="/privacidad" target="_blank" className="text-primary hover:underline">Privacy Policy</a> and the <a href="/aviso-legal" target="_blank" className="text-primary hover:underline">Legal Notice</a>.</>
                    )}
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 md:h-12 bg-primary text-primary-foreground hover:bg-primary-dark transition-all duration-300 shadow-sm text-sm md:text-base"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t.form.submitting}
                    </>
                  ) : (
                    <>
                      {tryFreeLabel}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>

                <p className="text-muted-foreground/60 text-xs md:text-sm">
                  {language === "es" ? "100% gratuito · Sin contraseñas · Enlace mágico" : "100% free · No passwords · Magic link"}
                </p>
              </form>
            ) : (
              <div className="bg-secondary/20 p-6 md:p-8 rounded-xl text-center border border-primary/20 max-w-md mx-auto">
                <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-primary mx-auto mb-3 md:mb-4" />
                <h3 className="text-lg md:text-xl font-bold text-primary mb-2">
                  {language === "es" ? "¡Revisa tu email!" : "Check your email!"}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  {language === "es"
                    ? "Hemos enviado un enlace mágico a"
                    : "We've sent a magic link to"}
                  <br />
                  <span className="font-medium text-primary">{email}</span>
                </p>
                <p className="text-muted-foreground/60 text-xs mt-3 md:mt-4">
                  {language === "es" ? "¿No lo ves? Revisa spam" : "Don't see it? Check spam"}
                </p>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 md:py-8 border-t border-border/10 bg-background text-muted-foreground text-sm">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs md:text-sm">&copy; {new Date().getFullYear()} Veridian. {t.footer.rights}</p>
          <div className="flex flex-wrap justify-center gap-3 md:gap-6 mt-4 md:mt-6 text-[10px] md:text-xs text-muted-foreground/60">
            <a href="/privacidad" className="hover:text-primary transition-colors">{t.footer.privacy}</a>
            <a href="/terminos" className="hover:text-primary transition-colors">{t.footer.terms}</a>
            <a href="/aviso-legal" className="hover:text-primary transition-colors">{t.footer.legalNotice}</a>
            <a href="mailto:contact@veridian.news" className="hover:text-primary transition-colors">Contact</a>
            <span className="text-muted-foreground/40">v1.0.2-beta</span>
          </div>
        </div>
      </footer>

      {/* Cookie Banner */}
      {showCookieBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 md:p-4 bg-card/95 backdrop-blur-md border-t border-border/10">
          <div className="container mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4">
            <p className="text-xs md:text-sm text-muted-foreground text-center sm:text-left">
              {language === "es"
                ? "Utilizamos cookies para mejorar tu experiencia."
                : "We use cookies to improve your experience."}
              {" "}
              <a href="/privacidad" className="text-primary hover:underline">
                {language === "es" ? "Más info" : "More info"}
              </a>.
            </p>
            <Button
              onClick={acceptCookies}
              size="sm"
              className="whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary-dark font-medium text-xs md:text-sm"
            >
              {language === "es" ? "Aceptar" : "Accept"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VeridianLanding;
