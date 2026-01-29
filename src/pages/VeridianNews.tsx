import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { NewsImage } from "../components/NewsImage";
import "./VeridianNews.css";
import { supabase, isSupabaseConfigured } from "../integrations/supabase/client";
import { useIsMobile, useScreenSize } from "../hooks/use-mobile";
import { Clock, Brain, ThumbsUp, ThumbsDown } from "lucide-react";
import { BottomDock } from "../components/BottomDock";
import { NewsCard } from "@/components/NewsCard";
import { StreakHeader } from "@/components/StreakHeader";
import { toast } from "sonner";


interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  image?: string;
  date: string;
  source: string;
  url?: string;
  likes?: number;
  comments?: number;
  isLiked?: boolean;
}

// Usar datos de ejemplo si el servidor no está disponible
// Usa window.location.origin para que funcione con el proxy de Vite
const API_BASE = import.meta.env.VITE_VERIDIAN_API_BASE || window.location.origin;

// Datos de ejemplo para cuando el servidor no esté disponible
const mockNews: NewsItem[] = [
  {
    id: 'news-1',
    title: 'Tecnología: Inteligencia Artificial revoluciona la medicina',
    summary: 'Los avances en IA están transformando el diagnóstico médico, permitiendo detectar enfermedades con mayor precisión y rapidez.',
    content: 'Los avances en IA están transformando el diagnóstico médico, permitiendo detectar enfermedades con mayor precisión y rapidez. Los sistemas de aprendizaje automático pueden analizar imágenes médicas en segundos, identificando patrones que el ojo humano podría pasar por alto. Esta tecnología ya se está utilizando en hospitales de todo el mundo para detectar cáncer, enfermedades cardíacas y otras condiciones médicas con una precisión superior al 90%. Los expertos predicen que en los próximos años, la IA será una herramienta estándar en la práctica médica diaria.',
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800',
    date: new Date().toISOString(),
    source: 'Veridian Tech',
    url: undefined // Sin URL para que no aparezca el link
  },
  {
    id: 'news-2',
    title: 'Ciencia: Descubrimiento de agua en Marte',
    summary: 'Los científicos han confirmado la presencia de agua líquida en el planeta rojo, abriendo nuevas posibilidades para la exploración espacial.',
    content: 'Los científicos han confirmado la presencia de agua líquida en el planeta rojo, abriendo nuevas posibilidades para la exploración espacial y la búsqueda de vida extraterrestre. El descubrimiento se realizó utilizando datos del rover Perseverance de la NASA, que detectó señales de agua líquida bajo la superficie marciana. Este hallazgo es crucial para futuras misiones tripuladas a Marte, ya que el agua es esencial para la supervivencia humana y puede ser utilizada para producir combustible. Los investigadores están ahora planificando misiones más profundas para estudiar estas reservas de agua.',
    image: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=800',
    date: new Date(Date.now() - 3600000).toISOString(),
    source: 'Veridian Science',
    url: undefined // Sin URL para que no aparezca el link
  },
  {
    id: 'news-3',
    title: 'Innovación: Nuevos materiales sostenibles',
    summary: 'Investigadores desarrollan materiales biodegradables que podrían reemplazar el plástico en múltiples aplicaciones.',
    content: 'Investigadores desarrollan materiales biodegradables que podrían reemplazar el plástico en múltiples aplicaciones, reduciendo significativamente el impacto ambiental. Estos nuevos materiales, creados a partir de algas y residuos agrícolas, se descomponen completamente en menos de 90 días cuando se exponen a condiciones naturales. A diferencia del plástico tradicional que tarda cientos de años en degradarse, estos materiales ofrecen una solución sostenible para el empaquetado, la construcción y la industria textil. Varias empresas ya están adoptando estos materiales en sus productos, marcando el inicio de una nueva era en la fabricación sostenible.',
    image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800',
    date: new Date(Date.now() - 7200000).toISOString(),
    source: 'Veridian Green',
    url: undefined // Sin URL para que no aparezca el link
  }
];
// Función para obtener o crear un userId persistente
const getOrCreateUserId = (): string => {
  // Intentar obtener de localStorage
  let userId = localStorage.getItem('veridian_userId');

  // Si no existe, intentar obtener de cookies
  if (!userId) {
    const cookies = document.cookie.split(';');
    const userIdCookie = cookies.find(cookie => cookie.trim().startsWith('veridian_userId='));
    if (userIdCookie) {
      userId = userIdCookie.split('=')[1];
    }
  }

  // Si aún no existe, crear uno nuevo
  if (!userId) {
    // Generar un ID único más robusto
    userId = `user - ${Date.now()} -${Math.random().toString(36).substr(2, 9)} -${Math.random().toString(36).substr(2, 9)} `;

    // Guardar en localStorage
    localStorage.setItem('veridian_userId', userId);

    // Guardar también en cookie (expira en 1 año)
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `veridian_userId = ${userId}; expires = ${expires.toUTCString()}; path =/; SameSite=Lax`;
  } else {
    // Si existe, asegurarse de que también esté en ambos lugares
    localStorage.setItem('veridian_userId', userId);
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `veridian_userId=${userId}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  }

  return userId;
};

const USER_ID = getOrCreateUserId();

// Funciones auxiliares - deben estar antes del componente para evitar errores de inicialización
const shuffleNews = (newsArray: NewsItem[]) => {
  const shuffled = [...newsArray];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Detectar categoría de una noticia basándose en su título y contenido
const detectCategory = (title: string, content?: string): string => {
  const textToAnalyze = `${title} ${content || ''}`.toLowerCase();

  // Tecnología - palabras clave más amplias
  if (textToAnalyze.match(/(tecnología|tech|innovación|digital|app|software|hardware|ia|inteligencia artificial|robot|ciber|inteligencia|artificial|chatgpt|openai|meta|facebook|google|apple|microsoft|amazon|tesla|nvidia|blockchain|crypto|bitcoin|web3|metaverso|realidad virtual|vr|ar|aplicación|programación|desarrollador|startup|emprendimiento|innovación|disruptivo|digitalización|transformación digital)/)) {
    return 'tecnología';
  }

  // Ciencia - más específico
  if (textToAnalyze.match(/(ciencia|científico|investigación|descubrimiento|estudio|marte|espacio|nasa|astronomía|física|química|biología|genética|adn|molecular|experimento|laboratorio|universidad|investigador|publicación científica|revista científica|nature|science|hallazgo|teoría|hipótesis)/)) {
    return 'ciencia';
  }

  // Política - más amplio
  if (textToAnalyze.match(/(política|político|gobierno|elecciones|partido|presidente|ministro|congreso|senado|diputado|alcalde|municipal|autonómico|nacional|ley|decreto|normativa|regulación|votación|sufragio|democracia|parlamento|asamblea|coalición|oposición)/)) {
    return 'política';
  }

  // Economía - más amplio
  if (textToAnalyze.match(/(economía|económico|mercado|empresa|negocio|finanzas|bolsa|inversión|acciones|índice|ibex|dow jones|nasdaq|pib|inflación|desempleo|paro|trabajo|empleo|salario|sueldo|contrato|despido|contratación|empresario|directivo|ceo|gerente|banco|financiero|crédito|préstamo|hipoteca|ahorro|pensiones)/)) {
    return 'economía';
  }

  // Salud - más amplio
  if (textToAnalyze.match(/(salud|médico|hospital|medicina|enfermedad|vacuna|virus|bacteria|epidemia|pandemia|covid|coronavirus|tratamiento|terapia|cirugía|operación|médico|doctor|enfermero|paciente|diagnóstico|síntoma|prevención|sanidad|farmacia|medicamento|fármaco|investigación médica|ensayo clínico)/)) {
    return 'salud';
  }

  // Deportes - más amplio
  if (textToAnalyze.match(/(deporte|fútbol|baloncesto|olímpico|atleta|futbolista|jugador|equipo|liga|champions|mundial|copa|partido|competición|torneo|campeonato|entrenador|estadio|gimnasio|ejercicio|fitness|running|maratón|tenis|natación|ciclismo|motociclismo|fórmula 1|f1)/)) {
    return 'deportes';
  }

  // Cultura - más amplio
  if (textToAnalyze.match(/(cultura|arte|música|cine|teatro|literatura|libro|escritor|autor|película|actor|actriz|director|festival|exposición|museo|galería|pintura|escultura|fotografía|diseño|moda|gastronomía|chef|restaurante|receta|cocina)/)) {
    return 'cultura';
  }

  // Medioambiente - más amplio
  if (textToAnalyze.match(/(medioambiente|clima|sostenibilidad|verde|ecología|contaminación|emisiones|co2|cambio climático|calentamiento global|energía renovable|solar|eólica|reciclaje|residuos|plástico|biodiversidad|especies|extinción|naturaleza|animales|plantas|bosque|océano|mar|río|agua|sequía|inundación)/)) {
    return 'medioambiente';
  }

  // Internacional - más amplio
  if (textToAnalyze.match(/(internacional|mundo|país|global|onu|naciones unidas|ue|unión europea|brexit|tratado|acuerdo internacional|diplomacia|embajada|consulado|migración|refugiado|inmigración|conflicto|guerra|paz|guerra|rusia|ucrania|china|eeuu|estados unidos|europa|asia|áfrica|américa latina)/)) {
    return 'internacional';
  }

  // Educación
  if (textToAnalyze.match(/(educación|educativo|escuela|colegio|universidad|estudiante|profesor|maestro|alumno|grado|máster|doctorado|investigación académica|título|diploma|formación|enseñanza|aprendizaje|pedagogía)/)) {
    return 'educación';
  }

  // Sociedad
  if (textToAnalyze.match(/(sociedad|social|comunidad|vecino|barrio|ciudad|población|demografía|natalidad|mortalidad|envejecimiento|jubilación|pensiones|vivienda|alquiler|hipoteca|transporte|tráfico|movilidad|urbanismo)/)) {
    return 'sociedad';
  }

  return 'general';
};

// Algoritmo de recomendación mejorado: reordena noticias basándose en preferencias del usuario
const recommendNews = (newsArray: NewsItem[], preferences: Map<string, number>, likedIds: Set<string>): NewsItem[] => {
  if (preferences.size === 0 && likedIds.size === 0) {
    // Si no hay preferencias ni likes, usar shuffle aleatorio pero priorizar noticias con más likes
    const sortedByLikes = [...newsArray].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    const topLiked = sortedByLikes.slice(0, Math.min(5, sortedByLikes.length));
    const rest = shuffleNews(sortedByLikes.slice(5));
    return [...topLiked, ...rest];
  }

  // Calcular el score máximo de preferencias para normalizar
  const maxPreferenceScore = Math.max(...Array.from(preferences.values()), 1);

  // Calcular score para cada noticia
  const scoredNews = newsArray.map(item => {
    let score = 0;
    const category = detectCategory(item.title || '', item.content || '');
    const source = item.source || '';

    // Score basado en categoría (peso alto) - normalizado
    const categoryScore = preferences.get(category) || 0;
    const normalizedCategoryScore = maxPreferenceScore > 0 ? (categoryScore / maxPreferenceScore) * 10 : 0;
    score += normalizedCategoryScore * 4; // Las categorías tienen más peso (aumentado de 3 a 4)

    // Score basado en fuente (peso medio) - normalizado
    const sourceScore = preferences.get(`source:${source}`) || 0;
    const normalizedSourceScore = maxPreferenceScore > 0 ? (sourceScore / maxPreferenceScore) * 10 : 0;
    score += normalizedSourceScore * 2; // Aumentado de 1.5 a 2

    // Bonus por likes totales (popularidad) - con escala logarítmica para evitar dominancia
    const likesCount = item.likes || 0;
    if (likesCount > 0) {
      // Usar escala logarítmica: log(1 + likes) para que no domine sobre las preferencias
      const likesBonus = Math.log10(1 + likesCount) * 1.5;
      score += likesBonus;
    }

    // Penalizar noticias ya vistas (que el usuario ya le dio like) - más agresivo
    if (likedIds.has(item.id)) {
      score -= 20; // Aumentado de 15 a 20 para evitar mostrar noticias ya vistas
    }

    // Bonus por novedad (noticias más recientes) - mejorado
    try {
      const newsDate = new Date(item.date || Date.now());
      const daysSincePublication = (Date.now() - newsDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePublication < 0.5) score += 3; // Muy reciente (menos de 12 horas)
      else if (daysSincePublication < 1) score += 2.5; // Muy reciente (menos de 24 horas)
      else if (daysSincePublication < 3) score += 2; // Reciente (menos de 3 días)
      else if (daysSincePublication < 7) score += 1; // Reciente (menos de una semana)
      else if (daysSincePublication < 30) score += 0.5; // Moderadamente reciente
    } catch (e) {
      // Ignorar errores de fecha
    }

    // Bonus por tener contenido completo (no solo título)
    if (item.content && item.content.length > 100) {
      score += 0.5;
    }

    // Bonus por tener URL (noticia completa)
    if (item.url) {
      score += 0.3;
    }

    return { item, score };
  });

  // Ordenar por score (mayor a menor)
  scoredNews.sort((a, b) => {
    // Si los scores son muy cercanos (diferencia < 0.5), darle un poco de variedad
    if (Math.abs(a.score - b.score) < 0.5) {
      return Math.random() > 0.5 ? -1 : 1;
    }
    return b.score - a.score;
  });

  // Separar en grupos: muy recomendadas, recomendadas, y resto - con umbrales mejorados
  const veryRecommended = scoredNews.filter(n => n.score > 8).map(n => n.item);
  const recommended = scoredNews.filter(n => n.score > 2 && n.score <= 8).map(n => n.item);
  const rest = scoredNews.filter(n => n.score <= 2).map(n => n.item);

  // Mezclar un poco el grupo de "recomendadas" para variedad (pero mantener orden general)
  const shuffledRecommended = shuffleNews(recommended);
  const shuffledRest = shuffleNews(rest);

  // Combinar: muy recomendadas primero, luego recomendadas mezcladas, luego resto
  // Añadir algunas noticias del resto al principio para evitar burbujas de filtro
  const varietyFromRest = shuffledRest.slice(0, Math.min(3, shuffledRest.length));
  const remainingRest = shuffledRest.slice(3);

  return [...veryRecommended, ...varietyFromRest, ...shuffledRecommended, ...remainingRest];
};

const VeridianNews = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const screenSize = useScreenSize();
  const { toast } = useToast();


  const [isLoading, setIsLoading] = useState(false); // Empezar en false
  const [error, setError] = useState<string | null>(null);
  const [tableExists, setTableExists] = useState<boolean | null>(null); // null = desconocido, true = existe, false = no existe
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [currentVisibleNews, setCurrentVisibleNews] = useState<NewsItem | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [isGeneratingComment, setIsGeneratingComment] = useState(false);
  const [likedNewsIds, setLikedNewsIds] = useState<Set<string>>(new Set());
  const [userPreferences, setUserPreferences] = useState<Map<string, number>>(new Map());
  // Inicializar vacío - solo mostrar noticias del Excel
  const [rawNews, setRawNews] = useState<NewsItem[]>([]); // Noticias sin ordenar - solo del Excel
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const loadingProgressRef = useRef<HTMLDivElement>(null);

  // Calcular noticias recomendadas basándose en preferencias
  const news = useMemo(() => {
    console.log('📰 Calculando noticias, rawNews.length:', rawNews.length);
    // Solo usar noticias del Excel, no usar mockNews
    if (rawNews.length === 0) {
      console.log('⚠️ No hay noticias del Excel disponibles');
      return [];
    }
    if (userPreferences.size === 0) {
      const shuffled = shuffleNews([...rawNews]);
      console.log('✅ Noticias mezcladas:', shuffled.length);
      return shuffled;
    }
    const recommended = recommendNews([...rawNews], userPreferences, likedNewsIds);
    console.log('✅ Noticias recomendadas:', recommended.length);
    return recommended;
  }, [rawNews, userPreferences, likedNewsIds]);

  useEffect(() => {
    // No usar mockNews - solo cargar del Excel
    setIsLoading(false);

    // Intentar cargar desde la API en segundo plano (sin bloquear)
    const loadFromAPI = async () => {
      try {
        await loadNews();
      } catch (error) {
        console.error('Error cargando noticias desde API:', error);
        // Si falla, no usar mockNews - dejar vacío
      }
    };

    // Cargar desde API después de un pequeño delay
    setTimeout(() => {
      loadFromAPI();
    }, 500);

    // Cargar preferencias y likes (opcional, no crítico)
    if (isSupabaseConfigured()) {
      try {
        loadUserLikes();
        loadUserPreferences();
      } catch (error) {
        console.error('Error cargando preferencias:', error);
      }
    }

    // Auto-refresh cada 5 minutos
    const interval = setInterval(() => {
      loadFromAPI();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Ref para el observer
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Efecto para IntersectionObserver
  useEffect(() => {
    const container = feedContainerRef.current;
    if (!container) return;

    // Limpiar observer anterior si existe
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Callback del observer
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Encontrar la noticia correspondiente al elemento visible
          const index = Number(entry.target.getAttribute('data-index'));
          if (!isNaN(index) && news[index]) {
            setCurrentVisibleNews(news[index]);

            // Preload next images logic could go here
            const nextNews = news[index + 1];
            if (nextNews && nextNews.image) {
              const img = new Image();
              img.src = nextNews.image;
            }
          }
        }
      });
    };

    // Crear nuevo observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: container,
      threshold: 0.6, // La tarjeta debe estar al 60% visible
      rootMargin: "0px"
    });

    // Observar todas las tarjetas
    const cards = container.querySelectorAll('.news-card');
    cards.forEach((card) => {
      observerRef.current?.observe(card);
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [news, isMobile, screenSize]); // Dependencias

  // Función dummy para mantener compatibilidad si es llamada desde otro lado, 
  // aunque ahora el observer se encarga de esto.
  const updateVisibleNews = () => {
    // Ya no es necesario lógica manual aquí gracias al IntersectionObserver
  };

  const openFullContent = (item: NewsItem) => {
    setSelectedNews(item);
    setShowContentModal(true);
    // Intentar entrar en modo fullscreen para ocultar UI del navegador
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {
        // Ignorar errores si el usuario no permite fullscreen
      });
    } else if ((document.documentElement as any).webkitRequestFullscreen) {
      (document.documentElement as any).webkitRequestFullscreen();
    } else if ((document.documentElement as any).mozRequestFullScreen) {
      (document.documentElement as any).mozRequestFullScreen();
    } else if ((document.documentElement as any).msRequestFullscreen) {
      (document.documentElement as any).msRequestFullscreen();
    }
  };

  const openAIChat = (item: NewsItem) => {
    setSelectedNews(item);
    setShowAIPanel(true);
    setChatMessages([{
      type: 'bot',
      text: 'Hola! Puedo responder preguntas sobre esta noticia y también investigar información adicional relacionada, buscar artículos relacionados y consultar fuentes externas. ¿Qué te gustaría saber?'
    }]);
  };


  const updateLoadingProgress = (percent: number) => {
    if (loadingProgressRef.current) {
      loadingProgressRef.current.style.width = `${percent}%`;
    }
  };

  // Extraer 3 puntos clave del contenido/resumen
  const extractKeyPoints = (text: string): string[] => {
    if (!text || text.trim().length === 0) {
      return ['Información no disponible', 'Contenido pendiente', 'Datos en actualización'];
    }

    // Dividir el texto en oraciones
    const sentences = text
      .split(/[.!?]\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 20 && s.length < 200); // Filtrar oraciones muy cortas o muy largas

    if (sentences.length === 0) {
      // Si no hay oraciones válidas, dividir por comas o puntos
      const parts = text.split(/[,;]\s+/).filter(p => p.length > 15);
      return parts.slice(0, 3).map(p => p.trim());
    }

    // Seleccionar las 3 oraciones más informativas (las más largas y con más contenido)
    const sortedSentences = sentences
      .sort((a, b) => b.length - a.length)
      .slice(0, 3)
      .map(s => {
        // Limpiar y formatear
        let cleaned = s.replace(/^\d+[\.\)]\s*/, ''); // Eliminar numeración
        cleaned = cleaned.replace(/^[-•]\s*/, ''); // Eliminar bullets
        cleaned = cleaned.trim();
        // Asegurar que termine con punto si no lo tiene
        if (!cleaned.match(/[.!?]$/)) {
          cleaned += '.';
        }
        return cleaned;
      });

    // Si no hay suficientes oraciones, completar con partes del texto
    while (sortedSentences.length < 3 && text.length > 0) {
      const remaining = text.substring(
        sortedSentences.join(' ').length
      ).trim();
      if (remaining.length > 20) {
        const nextSentence = remaining.split(/[.!?]/)[0].trim();
        if (nextSentence.length > 20) {
          sortedSentences.push(nextSentence + '.');
        } else {
          break;
        }
      } else {
        break;
      }
    }

    // Asegurar que siempre haya 3 puntos
    while (sortedSentences.length < 3) {
      sortedSentences.push('Información adicional disponible en la fuente.');
    }

    return sortedSentences.slice(0, 3);
  };

  const loadNews = async () => {
    // 1. Cargar caché inmediatamente si existe (Stale-While-Revalidate)
    const cachedNews = localStorage.getItem('veridian_news_cache');
    if (cachedNews) {
      try {
        const parsedCache = JSON.parse(cachedNews);
        if (Array.isArray(parsedCache) && parsedCache.length > 0) {
          console.log('📦 Cargando noticias desde caché local (instantáneo)');
          setRawNews(parsedCache);
          // No ponemos isLoading(false) aquí para mostrar indicador de "actualizando" si se desea,
          // o podemos ponerlo para que la UI esté lista ya.
          // Estrategia: Mostrar contenido ya, pero dejar el indicador de carga pequeño o invisible.
        }
      } catch (e) {
        console.error('Error parseando caché:', e);
      }
    } else {
      setIsLoading(true); // Solo mostrar loading full si no hay caché
    }

    setError(null);

    try {
      updateLoadingProgress(10);

      // Intentar cargar desde el servidor (Google Sheets)
      const apiUrl = `${API_BASE}/api/news?limit=100`;

      // Timeout reducido a 5s para no bloquear
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      updateLoadingProgress(50);

      if (response.ok) {
        const newsData = await response.json();

        if (newsData && Array.isArray(newsData) && newsData.length > 0) {
          // Actualizar estado y guardar en caché
          setRawNews(newsData);
          localStorage.setItem('veridian_news_cache', JSON.stringify(newsData));

          updateLoadingProgress(100);
          console.log(`✅ Noticias actualizadas desde API (${newsData.length})`);
        } else {
          console.warn('⚠️ API respondió pero sin noticias');
          // Si ya teníamos caché, no mostramos error, solo log
          if (!cachedNews) setError('No hay noticias disponibles en este momento.');
        }
      } else {
        throw new Error(`Error servidor: ${response.status}`);
      }
    } catch (error: any) {
      console.error('❌ Error actualizando noticias:', error);
      // Si falló la red pero tenemos caché, es un éxito parcial (usuario ve contenido)
      if (cachedNews) {
        console.log('⚠️ Usando versión en caché debido a error de red');
        toast({ title: "Modo Offline", description: "Mostrando noticias guardadas", duration: 3000 });
      } else {
        setError('No se pudieron cargar las noticias. Verifica tu conexión.');
        // En último caso, usar mockNews si todo falla y no hay caché?
        // Por ahora mantenemos la lógica original de no usar mockNews si falla API real, 
        // pero podríamos habilitarlo si el usuario quiere "ver algo" siempre
        setRawNews(mockNews); // Fallback final a mockNews para que la app no parezca rota
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar likes del usuario desde Supabase (userId anónimo) - SOLO funciona con Supabase
  const loadUserLikes = async () => {
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase no configurado. Los likes no se cargarán.');
      // Limpiar likes locales si Supabase no está configurado
      setLikedNewsIds(new Set());
      return;
    }
    try {
      const { data, error } = await supabase
        .from('news_likes')
        .select('news_id')
        .eq('user_id', USER_ID);

      if (error) {
        // Detectar si la tabla no existe o hay problema de schema cache
        const isTableNotFound = error.message && (
          error.message.includes('schema cache') ||
          error.message.includes('Could not find the table') ||
          error.message.includes('relation') && error.message.includes('does not exist')
        );

        if (isTableNotFound) {
          console.warn('⚠️ Error de schema cache detectado, intentando refrescar con delays más largos...');

          // Intentar múltiples veces con delays más largos (el schema cache puede tardar)
          for (let attempt = 1; attempt <= 5; attempt++) {
            const delay = attempt * 3000; // 3s, 6s, 9s, 12s, 15s
            console.log(`🔄 Intento ${attempt}/5: Esperando ${delay / 1000}s antes de reintentar...`);
            await new Promise(resolve => setTimeout(resolve, delay));

            // Reintentar la consulta
            const { data: retryData, error: retryError } = await supabase
              .from('news_likes')
              .select('news_id')
              .eq('user_id', USER_ID);

            if (!retryError && retryData !== null) {
              console.log('✅ Tabla encontrada después del reintento!');
              const likedIds = new Set(retryData.map(like => like.news_id));
              setLikedNewsIds(likedIds);
              setTableExists(true);
              return; // Éxito!
            }

            if (retryError && !retryError.message.includes('schema cache') && !retryError.message.includes('Could not find')) {
              // Si el error cambió completamente, puede ser otro problema
              console.warn('⚠️ Error diferente después del reintento:', retryError.message);
              // Continuar intentando si aún es schema cache
            }
          }

          // Si después de 5 intentos (hasta 45 segundos) sigue fallando, asumir que la tabla no existe
          console.warn('⚠️ La tabla news_likes no se encontró después de múltiples intentos');
          setTableExists(false);
          return; // Continuar sin likes
        }
        throw error;
      }

      if (data) {
        const likedIds = new Set(data.map(like => like.news_id));
        setLikedNewsIds(likedIds);
        setTableExists(true); // La tabla existe si pudimos leer datos
      }
    } catch (error) {
      console.log('Error cargando likes:', error);
      // Continuar sin likes si hay error
    }
  };

  // Cargar preferencias del usuario desde Supabase (userId anónimo) - SOLO funciona con Supabase
  const loadUserPreferences = async () => {
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase no configurado. Las preferencias no se cargarán.');
      // Limpiar preferencias locales si Supabase no está configurado
      setUserPreferences(new Map());
      return;
    }
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('category, source, score')
        .eq('user_id', USER_ID)
        .order('score', { ascending: false });

      if (error) throw error;

      if (data) {
        const prefs = new Map<string, number>();
        data.forEach(pref => {
          prefs.set(pref.category, pref.score);
          if (pref.source) {
            prefs.set(`source:${pref.source}`, pref.score);
          }
        });
        setUserPreferences(prefs);
      }
    } catch (error) {
      console.log('Error cargando preferencias:', error);
      // Continuar sin preferencias si hay error
    }
  };

  // Dar like a una noticia (guardado SOLO en Supabase con userId anónimo)
  const toggleLike = async (item: NewsItem) => {
    console.log('❤️ toggleLike llamado para:', item.id, item.title);

    if (!isSupabaseConfigured()) {
      console.error('❌ Supabase no configurado. Los likes requieren Supabase para funcionar.');
      setError('⚠️ Los likes requieren Supabase. Por favor, configura las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en Vercel.');
      setTimeout(() => setError(null), 5000);
      return;
    }

    const isLiked = likedNewsIds.has(item.id);
    console.log('📊 Estado actual - isLiked:', isLiked, 'USER_ID:', USER_ID);

    // ACTUALIZACIÓN OPTIMISTA (feedback inmediato como TikTok)
    // Actualizar el estado inmediatamente antes de la petición
    if (isLiked) {
      // Quitar like - actualización optimista
      setLikedNewsIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
      setRawNews(prevNews =>
        prevNews.map(n =>
          n.id === item.id
            ? { ...n, likes: Math.max(0, (n.likes || 0) - 1) }
            : n
        )
      );
    } else {
      // Agregar like - actualización optimista
      setLikedNewsIds(prev => new Set([...prev, item.id]));
      setRawNews(prevNews =>
        prevNews.map(n =>
          n.id === item.id
            ? { ...n, likes: (n.likes || 0) + 1 }
            : n
        )
      );
    }

    try {
      if (isLiked) {
        // Quitar like
        console.log('🗑️ Quitando like...');
        const { error, data } = await supabase
          .from('news_likes')
          .delete()
          .eq('user_id', USER_ID)
          .eq('news_id', item.id)
          .select();

        if (error) {
          console.error('❌ Error al quitar like:', error);
          // Revertir actualización optimista en caso de error
          setLikedNewsIds(prev => new Set([...prev, item.id]));
          setRawNews(prevNews =>
            prevNews.map(n =>
              n.id === item.id
                ? { ...n, likes: (n.likes || 0) + 1 }
                : n
            )
          );
          throw error;
        }

        console.log('✅ Like quitado exitosamente:', data);
      } else {
        // Agregar like
        console.log('➕ Agregando like...');
        const { error, data } = await supabase
          .from('news_likes')
          .insert({
            user_id: USER_ID, // userId anónimo generado desde localStorage
            news_id: item.id,
            news_title: item.title,
            news_source: item.source,
            news_url: item.url || null
          })
          .select();

        if (error) {
          console.error('❌ Error al agregar like:', error);
          console.error('❌ Detalles del error:', JSON.stringify(error, null, 2));

          // Revertir actualización optimista en caso de error
          setLikedNewsIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(item.id);
            return newSet;
          });
          setRawNews(prevNews =>
            prevNews.map(n =>
              n.id === item.id
                ? { ...n, likes: Math.max(0, (n.likes || 0) - 1) }
                : n
            )
          );

          // Detectar si la tabla no existe o hay problema de schema cache
          const isTableNotFound = error.message && (
            error.message.includes('schema cache') ||
            error.message.includes('Could not find the table') ||
            error.message.includes('relation') && error.message.includes('does not exist')
          );

          if (isTableNotFound) {
            console.log('🔄 Error de schema cache detectado, intentando múltiples reintentos con delays largos...');

            // Intentar múltiples veces con delays más largos (el schema cache puede tardar)
            for (let attempt = 1; attempt <= 5; attempt++) {
              const delay = attempt * 3000; // 3s, 6s, 9s, 12s, 15s
              console.log(`🔄 Intento ${attempt}/5: Esperando ${delay / 1000}s antes de reintentar insertar like...`);
              await new Promise(resolve => setTimeout(resolve, delay));

              // Reintentar el insert
              const { error: retryError, data: retryData } = await supabase
                .from('news_likes')
                .insert({
                  user_id: USER_ID,
                  news_id: item.id,
                  news_title: item.title,
                  news_source: item.source,
                  news_url: item.url || null
                })
                .select();

              if (!retryError && retryData) {
                console.log('✅ Like agregado exitosamente después del reintento!');
                // Restaurar el estado optimista
                setLikedNewsIds(prev => new Set([...prev, item.id]));
                setTableExists(true);
                setRawNews(prevNews =>
                  prevNews.map(n =>
                    n.id === item.id
                      ? { ...n, likes: (n.likes || 0) + 1 }
                      : n
                  )
                );
                // Recargar preferencias después del éxito
                setTimeout(() => {
                  loadUserPreferences();
                }, 1000);
                return; // Éxito!
              }

              if (retryError && !retryError.message.includes('schema cache') && !retryError.message.includes('Could not find')) {
                // Si el error cambió completamente, puede ser otro problema
                console.warn('⚠️ Error diferente después del reintento:', retryError.message);
                // Continuar intentando si aún es schema cache
              }
            }

            // Si después de 5 intentos (hasta 45 segundos) sigue fallando
            console.warn('⚠️ No se pudo agregar el like después de múltiples intentos');
            setTableExists(false);
            setError('⚠️ La tabla "news_likes" no se encuentra. Ejecuta este comando en Supabase SQL Editor: NOTIFY pgrst, \'reload schema\'; Luego espera 30s y recarga.');
            setTimeout(() => setError(null), 12000);
            return;
          }

          throw error;
        }

        console.log('✅ Like agregado exitosamente:', data);
        setTableExists(true); // La tabla existe si pudimos insertar datos

        // El trigger de Supabase actualizará automáticamente las preferencias
        // Recargar preferencias después de dar like (con delay para que el trigger se ejecute)
        setTimeout(() => {
          loadUserPreferences();
        }, 1000); // Aumentado a 1 segundo para dar tiempo al trigger de Supabase
      }
    } catch (error: any) {
      console.error('❌ Error al dar like:', error);
      const errorMessage = error?.message || error?.error_description || 'Error desconocido al guardar el like';

      // Si el error ya fue manejado en el bloque try (schema cache con reintentos), no hacer nada más
      // Solo manejar errores que no fueron capturados en el bloque try
      const isTableNotFound = errorMessage && (
        errorMessage.includes('schema cache') ||
        errorMessage.includes('Could not find the table') ||
        errorMessage.includes('relation') && errorMessage.includes('does not exist')
      );

      if (isTableNotFound) {
        // Ya se intentó con reintentos, solo mostrar mensaje final
        console.warn('⚠️ Error de schema cache después de todos los reintentos');
        setTableExists(false);
        setError('⚠️ La tabla "news_likes" no se encuentra. Ejecuta: NOTIFY pgrst, \'reload schema\'; en Supabase SQL Editor, espera 30s y recarga.');
        setTimeout(() => setError(null), 10000);
        return;
      }

      // Otros errores (no relacionados con schema cache)
      setError(`⚠️ Error: ${errorMessage}. Revisa la consola para más detalles.`);
      setTimeout(() => setError(null), 7000);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible';

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Ahora';
      if (minutes < 60) return `Hace ${minutes} min`;
      if (hours < 24) return `Hace ${hours} h`;
      if (days < 7) return `Hace ${days} días`;

      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch (e) {
      return dateString;
    }
  };

  const escapeHtml = (text: string) => {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    let cleaned = div.innerHTML
      .replace(/<a[^>]*>.*?<\/a>/gi, '')
      .replace(/<img[^>]*>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
    return cleaned;
  };

  const getSourceColor = (source: string) => {
    const colors = [
      { gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', badge: 'rgba(102, 126, 234, 0.25)', border: 'rgba(102, 126, 234, 0.5)' },
      { gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', badge: 'rgba(245, 87, 108, 0.25)', border: 'rgba(245, 87, 108, 0.5)' },
      { gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', badge: 'rgba(79, 172, 254, 0.25)', border: 'rgba(79, 172, 254, 0.5)' },
      { gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', badge: 'rgba(67, 233, 123, 0.25)', border: 'rgba(67, 233, 123, 0.5)' },
      { gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', badge: 'rgba(250, 112, 154, 0.25)', border: 'rgba(250, 112, 154, 0.5)' },
      { gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', badge: 'rgba(48, 207, 208, 0.25)', border: 'rgba(48, 207, 208, 0.5)' },
      { gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', badge: 'rgba(168, 237, 234, 0.25)', border: 'rgba(168, 237, 234, 0.5)' },
      { gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', badge: 'rgba(255, 154, 158, 0.25)', border: 'rgba(255, 154, 158, 0.5)' },
      { gradient: 'linear-gradient(135deg, #fa8bff 0%, #2bd2ff 50%, #2bff88 100%)', badge: 'rgba(250, 139, 255, 0.25)', border: 'rgba(250, 139, 255, 0.5)' },
      { gradient: 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)', badge: 'rgba(255, 234, 167, 0.25)', border: 'rgba(255, 234, 167, 0.5)' }
    ];
    const hash = source.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getThemeIcon = (title: string) => {
    const titleLower = title.toLowerCase();
    const icons: { [key: string]: string } = {
      política: '🏛️', politico: '🏛️', gobierno: '🏛️', elecciones: '🗳️', partido: '🏛️',
      tecnología: '💻', tech: '💻', innovación: '🚀', digital: '💻', app: '📱',
      economía: '💰', económico: '💰', mercado: '📈', empresa: '🏢', negocio: '💼',
      salud: '🏥', médico: '⚕️', hospital: '🏥', medicina: '💊',
      deportes: '⚽', deporte: '⚽', fútbol: '⚽', baloncesto: '🏀',
      cultura: '🎭', arte: '🎨', música: '🎵', cine: '🎬',
      ciencia: '🔬', investigación: '🔬', estudio: '📊',
      internacional: '🌍', mundo: '🌍', país: '🗺️',
      sociedad: '👥', social: '👥', comunidad: '👥',
      medioambiente: '🌱', clima: '🌡️', sostenibilidad: '♻️'
    };

    for (const [keyword, icon] of Object.entries(icons)) {
      if (titleLower.includes(keyword)) {
        return icon;
      }
    }

    return '📰';
  };


  const openComments = async (item: NewsItem) => {
    setSelectedNews(item);
    setShowCommentsModal(true);
    await loadComments(item.id);
  };

  const loadComments = async (newsId: string) => {
    try {
      // Intentar cargar desde la API primero
      const response = await fetch(`${API_BASE}/api/news/${newsId}/comments`);
      if (response.ok) {
        const commentsData = await response.json();
        setComments(commentsData);
        console.log(`✅ Cargados ${commentsData.length} comentarios desde API`);
        return;
      }

      // Si la API falla, intentar cargar desde Supabase directamente
      if (isSupabaseConfigured()) {
        // Cargar comentarios
        // @ts-ignore - Supabase types might be outdated for news_comments
        const { data: commentsData, error: commentsError } = await (supabase
          .from('news_comments' as any)
          .select('*')
          .eq('news_id', newsId)
          .order('created_at', { ascending: true }));

        if (commentsError) throw commentsError;

        if (commentsData) {
          const formattedComments = (commentsData as any[]).map((comment: any) => ({
            id: comment.id,
            user: comment.username || 'Usuario anónimo',
            text: comment.text,
            date: new Date(comment.created_at).toLocaleDateString(),
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_id}`
          }));
          setComments(formattedComments);
          console.log(`✅ Cargados ${commentsData.length} comentarios desde Supabase`);
          return;
        }
      }

      // Si todo falla, usar array vacío
      console.warn('⚠️ No se pudieron cargar comentarios');
      setComments([]);
    } catch (error) {
      console.error('❌ Error cargando comentarios:', error);
      setComments([]);
    }
  };

  const generateAIComment = async () => {
    if (!selectedNews) return;

    setIsGeneratingComment(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 segundos timeout

      const response = await fetch(`${API_BASE}/api/news/${selectedNews.id}/generate-comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsData: {
            title: selectedNews.title,
            content: selectedNews.content || '',
            summary: selectedNews.summary || '',
            source: selectedNews.source || '',
            date: selectedNews.date || '',
            url: selectedNews.url || ''
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
      }

      const data = await response.json();
      const suggestedComment = data.comment || '';

      // Poner el comentario sugerido en el input
      if (suggestedComment.trim()) {
        setCommentInput(suggestedComment.trim());
        console.log('✅ Comentario sugerido generado con IA');
      } else {
        throw new Error('No se pudo generar un comentario sugerido');
      }
    } catch (error: any) {
      console.error('❌ Error generando comentario con IA:', error);

      let errorMessage = 'No se pudo generar un comentario sugerido.';

      if (error.name === 'AbortError') {
        errorMessage = 'La petición tardó demasiado. Por favor, intenta de nuevo.';
      } else if (error.message) {
        if (error.message.includes('API key') || error.message.includes('configurada')) {
          errorMessage = '⚠️ La función de IA no está configurada. Configura OPENAI_API_KEY, ANTHROPIC_API_KEY o GEMINI_API_KEY en Vercel.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }

      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsGeneratingComment(false);
    }
  };

  const submitComment = async () => {
    if (!commentInput.trim() || !selectedNews) return;

    const commentText = commentInput.trim();

    // Validar longitud antes de enviar
    if (commentText.length > 500) {
      setError('⚠️ El comentario no puede exceder 500 caracteres');
      setTimeout(() => setError(null), 5000);
      return;
    }

    setCommentInput(''); // Limpiar input inmediatamente para mejor UX

    try {
      // Intentar guardar en la API primero
      const response = await fetch(`${API_BASE}/api/news/${selectedNews.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: USER_ID, text: commentText }),
      });

      if (response.ok) {
        const newComment = await response.json();
        // Agregar el comentario a la lista inmediatamente para mejor UX
        setComments(prev => [newComment, ...prev]);
        // Actualizar el conteo de comentarios en la noticia localmente
        setRawNews(prevNews =>
          prevNews.map(n =>
            n.id === selectedNews.id
              ? { ...n, comments: (n.comments || 0) + 1 }
              : n
          )
        );
        console.log('✅ Comentario guardado en API');
        return;
      }

      // Si la API falla, intentar guardar directamente en Supabase
      if (isSupabaseConfigured()) {
        // @ts-ignore - Supabase types might be outdated
        const { data, error } = await (supabase
          .from('news_comments' as any)
          .insert({
            news_id: selectedNews.id,
            user_id: USER_ID,
            text: commentText,
            username: USER_ID === 'anonymous' ? 'Anónimo' : USER_ID.substring(0, 20),
          })
          .select()
          .single());


        if (!error && data) {
          // Agregar el comentario a la lista inmediatamente
          const commentData = data as any; // Force any cast to fix missing type definition
          const newComment = {
            id: commentData.id,
            newsId: commentData.news_id,
            userId: commentData.user_id,
            text: commentData.text,
            timestamp: commentData.created_at,
            username: commentData.username || (commentData.user_id === 'anonymous' ? 'Anónimo' : commentData.user_id.substring(0, 20)),
          };
          setComments(prev => [newComment, ...prev]);
          // Actualizar el conteo de comentarios en la noticia localmente
          setRawNews(prevNews =>
            prevNews.map(n =>
              n.id === selectedNews.id
                ? { ...n, comments: (n.comments || 0) + 1 }
                : n
            )
          );
          console.log('✅ Comentario guardado en Supabase');
          return;
        } else {
          throw error || new Error('Error al guardar en Supabase');
        }
      }

      // Si llegamos aquí, ni la API ni Supabase funcionaron
      const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(errorData.message || errorData.error || 'No se pudo guardar el comentario. Verifica la configuración de Supabase.');
    } catch (error: any) {
      console.error('❌ Error al guardar comentario:', error);
      setError(`⚠️ Error al guardar comentario: ${error.message || 'Error desconocido'}`);
      setTimeout(() => setError(null), 5000);
      // Restaurar el texto del comentario si falló
      setCommentInput(commentText);
    }
  };

  const openChat = (item: NewsItem) => {
    setSelectedNews(item);
    setShowChatModal(true);
    setChatMessages([{
      type: 'bot',
      text: 'Hola! Puedo responder preguntas sobre esta noticia y también investigar información adicional relacionada, buscar artículos relacionados y consultar fuentes externas. ¿Qué te gustaría saber?'
    }]);
  };

  const submitChatMessage = async () => {
    if (!chatInput.trim() || !selectedNews) return;

    const userMessage = { type: 'user', text: chatInput.trim() };
    setChatMessages(prev => [...prev, userMessage]);
    const currentQuestion = chatInput.trim();
    setChatInput('');

    const loadingMessage = { type: 'bot', text: 'Pensando...', loading: true };
    setChatMessages(prev => [...prev, loadingMessage]);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000); // 35 segundos timeout

      const chatUrl = `${API_BASE}/api/news/${selectedNews.id}/chat`;
      console.log('🔗 Llamando a:', chatUrl);

      const response = await fetch(chatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion,
          newsData: {
            title: selectedNews.title,
            content: selectedNews.content || '',
            summary: selectedNews.summary || '',
            source: selectedNews.source || '',
            date: selectedNews.date || '',
            url: selectedNews.url || ''
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('📡 Respuesta del servidor:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error del servidor:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || `Error ${response.status}` };
        }
        throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
      }

      const data = await response.json();

      setChatMessages(prev => {
        const filtered = prev.filter(m => !m.loading);
        return [...filtered, { type: 'bot', text: data.response || 'No se pudo generar una respuesta.' }];
      });
    } catch (error: any) {
      console.error('❌ Error en chat:', error);
      console.error('❌ Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        API_BASE: API_BASE,
        newsId: selectedNews?.id
      });

      let errorMessage = 'Lo siento, no pude procesar tu pregunta en este momento.';

      if (error.name === 'AbortError') {
        errorMessage = 'La petición tardó demasiado. Por favor, intenta con una pregunta más corta o vuelve a intentarlo.';
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = '⚠️ No se pudo conectar con el servidor. Verifica que el endpoint /api/news/[newsId]/chat esté desplegado correctamente en Vercel.';
      } else if (error.message) {
        if (error.message.includes('API key') || error.message.includes('configurada')) {
          errorMessage = '⚠️ La función de IA no está configurada correctamente. Por favor, configura OPENAI_API_KEY, ANTHROPIC_API_KEY o GEMINI_API_KEY en las variables de entorno de Vercel.';
        } else if (error.message.includes('404') || error.message.includes('Not Found')) {
          errorMessage = '⚠️ El endpoint de chat no se encontró. Verifica que el archivo /api/news/[newsId]/chat.ts esté desplegado en Vercel.';
        } else if (error.message.includes('500') || error.message.includes('Error interno')) {
          errorMessage = '⚠️ Error en el servidor. Revisa los logs de Vercel para más detalles. Puede ser que OPENAI_API_KEY no esté configurada correctamente.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }

      setChatMessages(prev => {
        const filtered = prev.filter(m => !m.loading);
        return [...filtered, {
          type: 'bot',
          text: errorMessage,
          error: true
        }];
      });
    }
  };

  // Función para feedback háptico sutil
  const triggerHapticFeedback = (intensity: 'light' | 'medium' | 'strong' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [5],      // Vibración muy sutil
        medium: [10],    // Vibración media
        strong: [15]     // Vibración más fuerte
      };
      navigator.vibrate(patterns[intensity]);
    }
  };

  const setupTikTokScroll = () => {
    if (!feedContainerRef.current) return;

    const container = feedContainerRef.current;
    let scrollTimeout: NodeJS.Timeout;
    let isScrolling = false;
    let lastScrollTop = 0;
    let scrollVelocity = 0;
    let lastScrollTime = Date.now();
    let rafId: number | null = null;
    let currentCardIndex = -1;
    let lastSnappedIndex = -1;

    const getCardHeight = () => {
      // Usar window.innerHeight para obtener altura real del viewport (incluye barras del navegador)
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const headerHeight = isMobile ? 60 : 70;
      // Asegurar que siempre haya espacio visible
      return Math.max(viewportHeight - headerHeight, 400);
    };

    const getCurrentCardIndex = () => {
      const scrollTop = container.scrollTop;
      const cardHeight = getCardHeight();
      return Math.round(scrollTop / cardHeight);
    };

    const snapToNearestCard = (immediate = false, skipHaptic = false) => {
      if (isScrolling && !immediate) return;

      const cards = container.querySelectorAll('.news-card');
      if (cards.length === 0) return;

      const scrollTop = container.scrollTop;
      const cardHeight = getCardHeight();
      const targetIndex = Math.round(scrollTop / cardHeight);
      const limitedIndex = Math.max(0, Math.min(targetIndex, cards.length - 1));
      const targetScroll = limitedIndex * cardHeight;
      const distance = Math.abs(scrollTop - targetScroll);

      // Snap más suave y controlado - umbrales más altos para evitar cambios bruscos
      const snapThreshold = isMobile
        ? (immediate ? 20 : 50)  // En móvil: más espacio antes de snap
        : (immediate ? 30 : 60); // En desktop: umbral más alto

      if (distance > snapThreshold || immediate) {
        // Feedback háptico solo si cambiamos de card (más suave)
        if (!skipHaptic && limitedIndex !== lastSnappedIndex && lastSnappedIndex !== -1) {
          triggerHapticFeedback(isMobile ? 'light' : 'light');
        }
        lastSnappedIndex = limitedIndex;

        isScrolling = true;

        // Efectos visuales más suaves y visibles
        const currentCard = cards[limitedIndex] as HTMLElement;
        if (currentCard) {
          if (isMobile) {
            // En móvil: efectos más visibles pero suaves
            currentCard.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.6s ease';
            currentCard.style.transform = 'scale(0.98)';
            currentCard.style.opacity = '0.95';
          } else {
            // En desktop: efectos más pronunciados y suaves
            currentCard.style.transition = 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.7s ease';
            currentCard.style.transform = 'scale(0.97)';
            currentCard.style.opacity = '0.92';
          }
        }

        // Usar requestAnimationFrame para scroll más suave con easing mejorado
        const startScroll = scrollTop;
        const startTime = performance.now();
        // Duración más larga para scroll más suave y visible
        const duration = isMobile
          ? (immediate ? 500 : 700)  // Móvil: más suave y visible
          : (immediate ? 600 : 800); // Desktop: más suave y visible

        const animateScroll = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Easing más suave y gradual (ease-out-cubic mejorado con curva más suave)
          const ease = 1 - Math.pow(1 - progress, 2.5); // Reducido de 3.5 a 2.5 para más suavidad
          const currentScroll = startScroll + (targetScroll - startScroll) * ease;

          container.scrollTop = currentScroll;

          if (progress < 1) {
            rafId = requestAnimationFrame(animateScroll);
          } else {
            container.scrollTop = targetScroll;
            isScrolling = false;
            rafId = null;

            // Restaurar efecto visual con transición suave
            if (currentCard) {
              setTimeout(() => {
                currentCard.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease';
                currentCard.style.transform = 'scale(1)';
                currentCard.style.opacity = '1';
              }, isMobile ? 100 : 150); // Más tiempo para transición suave
            }
          }
        };

        if (rafId) {
          cancelAnimationFrame(rafId);
        }
        rafId = requestAnimationFrame(animateScroll);
      } else {
        isScrolling = false;
      }
    };

    // Manejar scroll con mejor detección de velocidad y snap más inmediato
    const handleScroll = () => {
      const currentScrollTop = container.scrollTop;
      const currentTime = Date.now();
      const timeDelta = currentTime - lastScrollTime;

      if (timeDelta > 0) {
        scrollVelocity = Math.abs(currentScrollTop - lastScrollTop) / timeDelta;
      }

      // Detectar cambio de card para efectos visuales (más sutiles en móvil)
      const newCardIndex = getCurrentCardIndex();
      if (newCardIndex !== currentCardIndex && currentCardIndex !== -1) {
        // Aplicar efecto visual sutil al card actual
        const cards = container.querySelectorAll('.news-card');
        const prevCard = cards[currentCardIndex] as HTMLElement;
        const newCard = cards[newCardIndex] as HTMLElement;

        if (prevCard) {
          prevCard.style.transform = 'scale(1)';
          prevCard.style.opacity = '1';
        }
        if (newCard) {
          // Efectos más sutiles en móvil para mejor rendimiento
          if (isMobile) {
            newCard.style.transform = 'scale(1.005)';
            newCard.style.opacity = '1';
          } else {
            newCard.style.transform = 'scale(1.01)';
            newCard.style.opacity = '1';
          }
        }
      }
      currentCardIndex = newCardIndex;

      lastScrollTop = currentScrollTop;
      lastScrollTime = currentTime;

      // Cancelar snap anterior si el usuario sigue scrolleando
      if (scrollTimeout) clearTimeout(scrollTimeout);

      // Snap más suave y controlado - delays más largos para evitar cambios bruscos
      const snapDelay = isMobile
        ? (scrollVelocity > 1.5 ? 300 : 200)  // Móvil: más tiempo antes de snap
        : (scrollVelocity > 1.5 ? 400 : 250);   // Desktop: más tiempo antes de snap

      scrollTimeout = setTimeout(() => {
        // Umbral de velocidad más alto para snap más suave (esperar a que pare más)
        const velocityThreshold = isMobile ? 0.05 : 0.03; // Reducido para esperar más tiempo
        if (scrollVelocity < velocityThreshold) {
          snapToNearestCard(false, false);
        }
      }, snapDelay);
    };

    // Scroll con rueda mejorado para desktop - más responsivo y fluido
    let wheelTimeout: NodeJS.Timeout;
    let wheelAccumulator = 0;
    const handleWheel = (e: WheelEvent) => {
      const delta = e.deltaY;
      wheelAccumulator += delta;

      // Limpiar acumulador después de un tiempo más corto para mejor respuesta
      if (wheelTimeout) clearTimeout(wheelTimeout);
      wheelTimeout = setTimeout(() => {
        wheelAccumulator = 0;
      }, 100); // Reducido de 150 a 100

      // Umbral más bajo para scroll más responsivo
      if (Math.abs(wheelAccumulator) > 30 && !isScrolling) { // Reducido de 50 a 30
        const direction = wheelAccumulator > 0 ? 1 : -1;
        const cardHeight = getCardHeight();
        const currentScroll = container.scrollTop;
        const currentIndex = Math.round(currentScroll / cardHeight);
        const cards = container.querySelectorAll('.news-card');
        const nextIndex = Math.max(0, Math.min(currentIndex + direction, cards.length - 1));

        if (nextIndex !== currentIndex) {
          isScrolling = true;
          wheelAccumulator = 0;

          // Feedback háptico sutil en desktop (si está disponible)
          triggerHapticFeedback('light');

          // Scroll suave con requestAnimationFrame y easing mejorado
          const startScroll = currentScroll;
          const targetScroll = nextIndex * cardHeight;
          const startTime = performance.now();
          const duration = 700; // Más lento para scroll más suave y visible

          // Aplicar efecto visual más suave y visible
          const currentCard = cards[currentIndex] as HTMLElement;
          const nextCard = cards[nextIndex] as HTMLElement;
          if (currentCard) {
            currentCard.style.transition = 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.7s ease';
            currentCard.style.transform = 'scale(0.97)';
            currentCard.style.opacity = '0.9';
          }
          if (nextCard) {
            nextCard.style.transition = 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.7s ease';
            nextCard.style.transform = 'scale(1.02)';
            nextCard.style.opacity = '1';
          }

          const animateWheelScroll = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Easing más suave y gradual
            const ease = 1 - Math.pow(1 - progress, 2.5); // Reducido de 3.5 a 2.5
            const currentScrollPos = startScroll + (targetScroll - startScroll) * ease;

            container.scrollTop = currentScrollPos;

            if (progress < 1) {
              rafId = requestAnimationFrame(animateWheelScroll);
            } else {
              container.scrollTop = targetScroll;
              isScrolling = false;
              rafId = null;

              // Restaurar efectos visuales con transición suave
              if (currentCard) {
                setTimeout(() => {
                  currentCard.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease';
                  currentCard.style.transform = 'scale(1)';
                  currentCard.style.opacity = '1';
                }, 150);
              }
              if (nextCard) {
                setTimeout(() => {
                  nextCard.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease';
                  nextCard.style.transform = 'scale(1)';
                  nextCard.style.opacity = '1';
                }, 150);
              }

              snapToNearestCard(true, true);
            }
          };

          if (rafId) {
            cancelAnimationFrame(rafId);
          }
          rafId = requestAnimationFrame(animateWheelScroll);

          e.preventDefault();
        }
      }
    };

    // Manejar touch events mejorado para scroll más fluido y responsivo en móvil
    let touchStartY = 0;
    let touchStartTime = 0;
    let isTouching = false;
    let touchMoveY = 0;
    let touchMoveTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      touchMoveY = touchStartY;
      touchMoveTime = touchStartTime;
      isTouching = true;
      scrollVelocity = 0;

      // Efecto visual sutil al iniciar touch
      const currentIndex = getCurrentCardIndex();
      const cards = container.querySelectorAll('.news-card');
      const currentCard = cards[currentIndex] as HTMLElement;
      if (currentCard) {
        currentCard.style.transition = 'transform 0.2s ease';
        currentCard.style.transform = 'scale(0.99)';
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouching) return;
      touchMoveY = e.touches[0].clientY;
      touchMoveTime = Date.now();

      // Efecto visual más sutil en móvil para mejor rendimiento
      const deltaY = touchMoveY - touchStartY;
      const currentIndex = getCurrentCardIndex();
      const cards = container.querySelectorAll('.news-card');
      const currentCard = cards[currentIndex] as HTMLElement;

      if (currentCard && Math.abs(deltaY) > 15) {
        // Efectos más sutiles en móvil
        const maxScale = 0.03; // Reducido de 0.05 para móvil
        const maxOpacity = 0.15; // Reducido de 0.2 para móvil
        const scale = 1 - Math.min(Math.abs(deltaY) / 600, maxScale);
        const opacity = 1 - Math.min(Math.abs(deltaY) / 400, maxOpacity);
        currentCard.style.transform = `scale(${scale})`;
        currentCard.style.opacity = `${opacity}`;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isTouching) return;

      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();
      const distance = Math.abs(touchStartY - touchEndY);
      const duration = touchEndTime - touchStartTime;
      const velocity = distance / duration; // Velocidad del swipe

      // Restaurar efecto visual
      const currentIndex = getCurrentCardIndex();
      const cards = container.querySelectorAll('.news-card');
      const currentCard = cards[currentIndex] as HTMLElement;
      if (currentCard) {
        currentCard.style.transform = 'scale(1)';
        currentCard.style.opacity = '1';
      }

      // Snap más inteligente y suave basado en velocidad y distancia
      if (duration < 200 && distance > 50) {
        // Swipe muy rápido - snap suave con feedback háptico medio
        triggerHapticFeedback('medium');
        setTimeout(() => {
          snapToNearestCard(true, false);
        }, 100); // Más tiempo para transición suave
      } else if (duration < 300 && distance > 60) {
        // Swipe rápido - snap suave con feedback háptico ligero
        triggerHapticFeedback('light');
        setTimeout(() => {
          snapToNearestCard(true, false);
        }, 150);
      } else if (velocity > 0.3 && distance > 40) {
        // Swipe con buena velocidad - snap suave con feedback ligero
        triggerHapticFeedback('light');
        setTimeout(() => {
          snapToNearestCard(true, false);
        }, 200); // Más tiempo para transición suave
      } else {
        // Snap normal después de que termine el momentum - más tiempo para suavidad
        setTimeout(() => {
          snapToNearestCard(false, false);
        }, 300); // Aumentado para scroll más suave
      }

      isTouching = false;
    };

    // Inicializar índice actual
    currentCardIndex = getCurrentCardIndex();
    lastSnappedIndex = currentCardIndex;

    // Agregar event listeners
    container.addEventListener('scroll', handleScroll, { passive: true });

    if (!isMobile) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    } else {
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: true });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    // Cleanup function
    return () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      if (wheelTimeout) clearTimeout(wheelTimeout);
      if (rafId) cancelAnimationFrame(rafId);
      container.removeEventListener('scroll', handleScroll);
      if (!isMobile) {
        container.removeEventListener('wheel', handleWheel);
      } else {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  };

  // Verificar si hay error de configuración
  const supabaseConfigured = isSupabaseConfigured();

  // Solo mostrar noticias del Excel, no usar mockNews
  const displayNews = news && news.length > 0 ? news : [];
  if (displayNews.length === 0) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-4">
          {!supabaseConfigured && (
            <div className="p-4 bg-yellow-500/20 rounded-lg text-yellow-200 text-center max-w-sm mb-4">
              Supabase no configurado.
            </div>
          )}
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="opacity-70 animate-pulse">Cargando noticias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-black overflow-hidden relative font-sans text-white">
      {/* Background ambient for tablet/desktop */}
      <div className="hidden md:block absolute inset-0 bg-zinc-900 z-0 pr-[calc(100vw-100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(59,130,246,0.1),_transparent_70%)] opacity-40" />
      </div>

      <StreakHeader />
      <main
        ref={feedContainerRef}
        className="h-full w-full md:max-w-md md:mx-auto relative z-10 overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar md:border-x md:border-white/10 shadow-2xl bg-black"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Hide scrollbar specifically
      >
        <style>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {displayNews.map((item, index) => {
          // Determinar si esta tarjeta está activa (visible)
          // Por simplicidad en MVP, usamos el índice del observer
          const isActive = currentVisibleNews?.id === item.id;

          return (
            <div key={item.id} data-index={index} className="news-card h-[100dvh] w-full snap-start">
              <NewsCard
                item={item}
                index={index}
                isActive={isActive}
                onLike={() => {
                  // Logic for like
                  console.log('Like', item.id);
                  const isLiked = likedNewsIds.has(item.id);
                  if (isLiked) {
                    likedNewsIds.delete(item.id);
                    item.likes = (item.likes || 0) - 1;
                    item.isLiked = false;
                  } else {
                    likedNewsIds.add(item.id);
                    item.likes = (item.likes || 0) + 1;
                    item.isLiked = true;
                  }
                  setLikedNewsIds(new Set(likedNewsIds));
                  // Force update (quick hack for demo, should use better state management)
                  setRawNews([...rawNews]);
                }}
                onComment={() => {
                  setSelectedNews(item);
                  setShowCommentsModal(true);
                }}
                onShare={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: item.title,
                      text: item.summary,
                      url: window.location.href
                    }).catch(console.error);
                  } else {
                    // Fallback copy to clipboard
                    navigator.clipboard.writeText(`${item.title}\n${window.location.href}`);
                    toast({
                      title: "Enlace copiado",
                      description: "El enlace a la noticia se ha copiado al portapapeles.",
                    });
                  }
                }}
                onReadMore={() => openFullContent(item)}
              />
            </div>
          );
        })}

        {/* Loading Indicator at bottom */}
        {isLoading && (
          <div className="h-20 w-full flex items-center justify-center snap-end bg-black">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </main>

      {/* Floating Bottom Dock */}
      <BottomDock />

      {/* Modals (Keep existing ones intact for now, just ensure z-index is high enough) */}
      {/* Modal de Contenido Completo */}
      {showContentModal && selectedNews && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in slide-in-from-bottom duration-300">
          {/* Simple custom header for article view */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-10">
            <h2 className="text-white font-bold truncate max-w-[80%]">{selectedNews.title}</h2>
            <button onClick={() => setShowContentModal(false)} className="p-2 rounded-full bg-white/10 text-white">
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 text-white pb-32">
            <h1 className="text-3xl font-bold mb-6">{selectedNews.title}</h1>

            <div className="flex items-center gap-3 mb-8 text-sm text-white/60">
              <span>{selectedNews.source}</span>
              <span>•</span>
              <span>{new Date(selectedNews.date).toLocaleDateString()}</span>
            </div>

            {selectedNews.image && (
              <div className="mb-8 rounded-xl overflow-hidden aspect-video w-full">
                <img src={selectedNews.image} alt="" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="prose prose-invert prose-lg max-w-none">
              {selectedNews.content && selectedNews.content.trim().length > 30 && !selectedNews.content.toLowerCase().includes("sin contenido") ? (
                selectedNews.content.split('\n').map((p, i) => (
                  <p key={i} className="mb-4 text-gray-300 leading-relaxed">
                    {p}
                  </p>
                ))
              ) : (
                <p className="mb-4 text-gray-300 leading-relaxed text-lg">
                  {selectedNews.summary}
                </p>
              )}
            </div>
          </div>

          {/* Floating AI Button in Article */}
          <div className="absolute bottom-8 right-6">
            <button
              onClick={() => openAIChat(selectedNews)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-full shadow-lg shadow-blue-900/50 font-medium transition-all"
            >
              <Brain className="w-5 h-5" />
              <span>Analizar con IA</span>
            </button>
          </div>
        </div>
      )}

      {/* Other modals (Comments, AI, etc) - keeping minimal logic for brevity but ensuring they render */}
      {showCommentsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-zinc-900 w-full sm:max-w-md h-[80dvh] sm:h-[600px] sm:rounded-2xl rounded-t-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-white font-bold">Comentarios</h3>
              <button onClick={() => setShowCommentsModal(false)} className="text-white/60 hover:text-white">✕</button>
            </div>
            <div className="flex-1 flex items-center justify-center text-white/40">
              <p>Funcionalidad de comentarios en construcción para esta demo.</p>
            </div>
          </div>
        </div>
      )}

      {showAIPanel && selectedNews && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-400">
              <Brain className="w-6 h-6" />
              <span className="font-bold text-lg">Veridian AI</span>
            </div>
            <button onClick={() => setShowAIPanel(false)} className="bg-white/10 p-2 rounded-full text-white">✕</button>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="bg-zinc-800/50 p-4 rounded-xl text-white/90 mb-4 border border-white/5">
              <p className="font-medium mb-2 text-blue-300">Análisis de la noticia:</p>
              <p>Esta noticia sobre "{selectedNews.title}" presenta información relevante. Como asistente IA, puedo profundizar en los hechos, detectar posibles sesgos (actualmente: Neutral) y buscar fuentes adicionales.</p>
            </div>
            {chatMessages.map((msg, i) => (
              <div key={i} className={`mb-4 p-3 rounded-lg max-w-[85%] ${msg.type === 'user' ? 'bg-blue-600 ml-auto' : 'bg-zinc-800'}`}>
                <p className="text-white text-sm">{msg.text}</p>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-white/10 bg-zinc-900">
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                className="flex-1 bg-zinc-800 border-none rounded-full px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Pregunta algo..."
              />
              <button onClick={submitChatMessage} className="bg-blue-600 p-3 rounded-full text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default VeridianNews;
