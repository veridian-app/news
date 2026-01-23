import { useState, useEffect } from "react";

type Language = "es" | "en";

const translations = {
  es: {
    // Navigation
    nav: {
      platform: "Plataforma",
      oraculus: "Oraculus",
      joinWaitlist: "Unirse",
      forInstitutions: "Para Instituciones",
    },
    // Hero
    hero: {
      title: "Información sin sesgos.",
      titleHighlight: "Noticias objetivas.",
      subtitle: "Veridian presenta dos herramientas para combatir la desinformación y construir criterio propio.",
      ctaPrimary: "Unirme a la plataforma",
      ctaSecondary: "Ver Oraculus",
      ctaInstitutions: "Soy una institución",
    },
    // Platform Section
    platform: {
      title: "La plataforma de noticias",
      titleHighlight: "sin sesgos editoriales",
      description: "Para el público general que busca información objetiva y verificada.",
      features: [
        {
          title: "Research automático",
          description: "Cada noticia pasa por un proceso de verificación y análisis de fuentes antes de llegar a ti.",
        },
        {
          title: "Solo hechos verificados",
          description: "Eliminamos opiniones, sesgos editoriales y agendas ocultas. Solo datos objetivos.",
        },
        {
          title: "Crea tu propia opinión",
          description: "Te damos la información cruda para que formes tu criterio sin influencias externas.",
        },
      ],
      cta: "Reservar mi plaza",
    },
    // Oraculus Section
    oraculus: {
      title: "Oraculus",
      titleHighlight: "para instituciones educativas",
      description: "Herramienta de análisis de fuentes y detección de sesgos para universidades y centros educativos.",
      features: [
        {
          title: "Análisis CRAAP automático",
          description: "Evalúa automáticamente la calidad de las fuentes usando el método CRAAP (Currency, Relevance, Authority, Accuracy, Purpose).",
        },
        {
          title: "Detección de sesgos",
          description: "Identifica 12 tipos de sesgos periodísticos con citas textuales y explicaciones detalladas.",
        },
        {
          title: "Score de objetividad",
          description: "Calificación 0-100 de la objetividad del contenido con explicaciones claras.",
        },
        {
          title: "Detección de bulos",
          description: "Sistema avanzado que detecta desinformación y teorías conspirativas con alertas claras.",
        },
        {
          title: "Auditoría de textos propios",
          description: "Los estudiantes pueden analizar sus propios textos y recibir sugerencias de mejora y citación.",
        },
        {
          title: "Estadísticas agregadas",
          description: "Las instituciones reciben datos agregados sobre el consumo de información de sus estudiantes.",
        },
      ],
      cta: "Solicitar demo para instituciones",
      ctaSecondary: "Probar Oraculus gratis",
    },
    // Benefits Section
    benefits: {
      title: "Por qué Veridian",
      items: [
        {
          title: "Tecnología avanzada",
          description: "IA de última generación para análisis de contenido y detección de sesgos.",
        },
        {
          title: "Transparencia total",
          description: "Sabes exactamente cómo se analiza cada artículo y qué fuentes se utilizan.",
        },
        {
          title: "Educación crítica",
          description: "No solo te damos información, te enseñamos a evaluarla por ti mismo.",
        },
        {
          title: "Sin agenda oculta",
          description: "No tenemos línea editorial. Nuestro único objetivo es la verdad objetiva.",
        },
      ],
    },
    // Waiting List Section
    waitlist: {
      title: "Lista de Espera",
      subtitle: "Únete ahora y forma parte de los primeros",
      description: "Estamos construyendo la primera plataforma de noticias objetivas. Regístrate ahora para estar entre los primeros en acceder cuando lancemos.",
      howItWorks: "Cómo funciona",
      step1: "Regístrate en la lista de espera",
      step2: "Comparte tu enlace de referido",
      step3: "Desbloquea recompensas exclusivas",
      step4: "Accede primero cuando lancemos",
    },
    // Referral Program Section
    referral: {
      title: "Programa de Referidos",
      subtitle: "Comparte y gana recompensas reales",
      description: "Cada persona que invites te acerca a recompensas exclusivas. Los primeros 100 usuarios obtienen acceso gratuito por 1 año.",
      currentReferrals: "Referidos actuales",
      shareLink: "Comparte tu enlace",
      copyLink: "Copiar enlace",
      linkCopied: "¡Enlace copiado!",
      rewardsTitle: "Recompensas por nivel",
      unlocked: "Desbloqueado",
      remaining: "restantes",
      nextReward: "Próxima recompensa",
    },
    // Rewards Tiers
    rewards: {
      tier1: {
        threshold: 1,
        title: "Mini Guía Antisesgos",
        description: "PDF descargable para detectar titulares manipuladores, agendas ocultas y lenguaje cargado. Aprende a identificar desinformación.",
        icon: "Gift",
      },
      tier3: {
        threshold: 3,
        title: "Acceso a Oraculus + Beta",
        description: "Desbloquea Oraculus, nuestra herramienta de análisis de fuentes, y reserva tu plaza en la beta cerrada de la plataforma de noticias objetivas.",
        icon: "Key",
      },
      tier5: {
        threshold: 5,
        title: "Adelantos + 3 meses premium",
        description: "Acceso anticipado a cualquier función que lancemos y 3 meses de cuenta premium cuando salga la plataforma. Sé el primero en probar todo.",
        icon: "Sparkles",
      },
      tier10: {
        threshold: 10,
        title: "El Consejo",
        description: "Grupo privado y exclusivo de entrevistas. Tu opinión guiará qué temas investigar y cómo evolucionará la plataforma. Forma parte del equipo que decide el futuro.",
        icon: "Crown",
      },
    },
    // CTA Section
    cta: {
      title: "Únete a la revolución",
      titleHighlight: "de la información objetiva",
      description: "Sé parte de los primeros en acceder a noticias sin sesgos y herramientas educativas de vanguardia.",
      ctaPrimary: "Unirme ahora",
      ctaSecondary: "Ver demo",
    },
    // Footer
    footer: {
      platform: "Plataforma",
      oraculus: "Oraculus",
      company: "Veridian",
      legal: "Legal",
      privacy: "Privacidad",
      terms: "Términos",
      legalNotice: "Aviso Legal",
    },
    // Form
    form: {
      name: "Tu nombre",
      email: "tu@email.com",
      referralCode: "Código de referido (opcional)",
      submit: "Unirme a la lista",
      submitting: "Registrando...",
      institutionName: "Nombre de la institución",
      institutionEmail: "email@institucion.edu",
      institutionPhone: "Teléfono (opcional)",
      institutionMessage: "Cuéntanos sobre tu institución",
      institutionSubmit: "Solicitar información",
      institutionSubmitting: "Enviando...",
    },
  },
  en: {
    // Navigation
    nav: {
      platform: "Platform",
      oraculus: "Oraculus",
      joinWaitlist: "Join Waitlist",
      forInstitutions: "For Institutions",
    },
    // Hero
    hero: {
      title: "Information without bias.",
      titleHighlight: "Objective news.",
      subtitle: "Veridian presents two tools to combat misinformation and build critical thinking.",
      ctaPrimary: "Join the platform",
      ctaSecondary: "See Oraculus",
      ctaInstitutions: "I'm an institution",
    },
    // Platform Section
    platform: {
      title: "The news platform",
      titleHighlight: "without editorial bias",
      description: "For the general public seeking objective and verified information.",
      features: [
        {
          title: "Automatic research",
          description: "Every news story goes through a verification and source analysis process before reaching you.",
        },
        {
          title: "Only verified facts",
          description: "We eliminate opinions, editorial biases, and hidden agendas. Only objective data.",
        },
        {
          title: "Form your own opinion",
          description: "We give you raw information so you can form your judgment without external influences.",
        },
      ],
      cta: "Reserve my spot",
    },
    // Oraculus Section
    oraculus: {
      title: "Oraculus",
      titleHighlight: "for educational institutions",
      description: "Source analysis and bias detection tool for universities and educational centers.",
      features: [
        {
          title: "Automatic CRAAP analysis",
          description: "Automatically evaluates source quality using the CRAAP method (Currency, Relevance, Authority, Accuracy, Purpose).",
        },
        {
          title: "Bias detection",
          description: "Identifies 12 types of journalistic biases with textual quotes and detailed explanations.",
        },
        {
          title: "Objectivity score",
          description: "0-100 rating of content objectivity with clear explanations.",
        },
        {
          title: "Hoax detection",
          description: "Advanced system that detects misinformation and conspiracy theories with clear alerts.",
        },
        {
          title: "Own text auditing",
          description: "Students can analyze their own texts and receive improvement and citation suggestions.",
        },
        {
          title: "Aggregated statistics",
          description: "Institutions receive aggregated data on their students' information consumption.",
        },
      ],
      cta: "Request demo for institutions",
      ctaSecondary: "Try Oraculus free",
    },
    // Benefits Section
    benefits: {
      title: "Why Veridian",
      items: [
        {
          title: "Advanced technology",
          description: "State-of-the-art AI for content analysis and bias detection.",
        },
        {
          title: "Total transparency",
          description: "You know exactly how each article is analyzed and what sources are used.",
        },
        {
          title: "Critical education",
          description: "We don't just give you information, we teach you to evaluate it yourself.",
        },
        {
          title: "No hidden agenda",
          description: "We have no editorial line. Our only goal is objective truth.",
        },
      ],
    },
    // Waiting List Section
    waitlist: {
      title: "Waitlist",
      subtitle: "Join now and be among the first",
      description: "We're building the first objective news platform. Sign up now to be among the first to access when we launch.",
      howItWorks: "How it works",
      step1: "Sign up for the waitlist",
      step2: "Share your referral link",
      step3: "Unlock exclusive rewards",
      step4: "Get first access when we launch",
    },
    // Referral Program Section
    referral: {
      title: "Referral Program",
      subtitle: "Share and earn real rewards",
      description: "Every person you invite brings you closer to exclusive rewards. The first 100 users get free access for 1 year.",
      currentReferrals: "Current referrals",
      shareLink: "Share your link",
      copyLink: "Copy link",
      linkCopied: "Link copied!",
      rewardsTitle: "Rewards by tier",
      unlocked: "Unlocked",
      remaining: "remaining",
      nextReward: "Next reward",
    },
    // Rewards Tiers
    rewards: {
      tier1: {
        threshold: 1,
        title: "Mini Anti-Bias Guide",
        description: "Downloadable PDF to detect manipulative headlines, hidden agendas, and loaded language. Learn to identify misinformation.",
        icon: "Gift",
      },
      tier3: {
        threshold: 3,
        title: "Oraculus Access + Beta",
        description: "Unlock Oraculus, our source analysis tool, and reserve your spot in the closed beta of the objective news platform.",
        icon: "Key",
      },
      tier5: {
        threshold: 5,
        title: "Early Access + 3 months premium",
        description: "Early access to any feature we launch and 3 months of premium account when the platform launches. Be the first to try everything.",
        icon: "Sparkles",
      },
      tier10: {
        threshold: 10,
        title: "The Council",
        description: "Private and exclusive interview group. Your opinion will guide what topics to investigate and how the platform evolves. Be part of the team that decides the future.",
        icon: "Crown",
      },
    },
    // CTA Section
    cta: {
      title: "Join the revolution",
      titleHighlight: "of objective information",
      description: "Be among the first to access bias-free news and cutting-edge educational tools.",
      ctaPrimary: "Join now",
      ctaSecondary: "See demo",
    },
    // Footer
    footer: {
      platform: "Platform",
      oraculus: "Oraculus",
      company: "Veridian",
      legal: "Legal",
      privacy: "Privacy",
      terms: "Terms",
      legalNotice: "Legal Notice",
    },
    // Form
    form: {
      name: "Your name",
      email: "your@email.com",
      referralCode: "Referral code (optional)",
      submit: "Join the waitlist",
      submitting: "Registering...",
      institutionName: "Institution name",
      institutionEmail: "email@institution.edu",
      institutionPhone: "Phone (optional)",
      institutionMessage: "Tell us about your institution",
      institutionSubmit: "Request information",
      institutionSubmitting: "Sending...",
    },
  },
};

export const useLanguage = () => {
  const [language, setLanguage] = useState<Language>(() => {
    // Check localStorage first
    const saved = localStorage.getItem("veridian_language") as Language;
    if (saved && (saved === "es" || saved === "en")) {
      return saved;
    }
    // Check browser language
    const browserLang = navigator.language.split("-")[0];
    return browserLang === "es" ? "es" : "en";
  });

  useEffect(() => {
    localStorage.setItem("veridian_language", language);
  }, [language]);

  const t = translations[language];
  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "es" ? "en" : "es"));
  };

  return { language, t, toggleLanguage, setLanguage };
};

