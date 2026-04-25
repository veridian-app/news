// news-utils.ts
export interface NewsItem {
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
  category?: string;
  bias?: number; // 0 (Left) to 100 (Right), 50 is Neutral
}

/**
 * Detects the political bias of a news item based on keywords.
 * Returns a value from 0 (Left) to 100 (Right), default 50 (Neutral).
 */
export const detectBias = (title: string, content?: string): number => {
  const text = `${title} ${content || ''}`.toLowerCase();
  
  const leftKeywords = ['reforma social', 'igualdad', 'progresista', 'público', 'sindicato', 'derechos sociales', 'clase obrera', 'feminismo', 'ecologismo', 'redistribución'];
  const rightKeywords = ['mercado libre', 'tradición', 'conservador', 'privado', 'empresa', 'seguridad nacional', 'familia', 'liberalismo', 'impuestos bajos', 'soberanía'];

  let leftScore = 0;
  let rightScore = 0;

  leftKeywords.forEach(word => { if (text.includes(word)) leftScore += 10; });
  rightKeywords.forEach(word => { if (text.includes(word)) rightScore += 10; });

  // Default to 50, adjust based on scores
  const result = 50 + (rightScore - leftScore);
  return Math.max(0, Math.min(100, result));
};

/**
 * Detects if a piece of content is an advertisement or promotional material.
 */
export const isAd = (title: string, content?: string, source?: string): boolean => {
  const text = `${title} ${content || ''} ${source || ''}`.toLowerCase();
  
  const adKeywords = [
    'publicidad', 'patrocinado', 'sponsored', 'oferta', 'descuento', 'comprar ahora', 
    'pueblos bonitos', 'mejores destinos', 'regalo', 'suscríbete', 'promoción',
    'enlace de afiliado', 'contenido de marca', 'brand content', 'shopping',
    'chollos', 'gangas', 'las mejores ofertas', 'donde comprar', 'precio mínimo'
  ];

  // Soft ads detection (clickbait typical of ads)
  const softAdPatterns = [
    'no creerás', 'te sorprenderá', 'el secreto para', 'por qué deberías'
  ];

  const hasAdKeyword = adKeywords.some(keyword => text.includes(keyword));
  const hasSoftAdPattern = softAdPatterns.filter(pattern => text.includes(pattern)).length >= 2;

  return hasAdKeyword || hasSoftAdPattern;
};

/**
 * Detects the category of a news item based on its title and content.
 */
export const detectCategory = (title: string, content?: string): string => {
  const textToAnalyze = `${title} ${content || ''}`.toLowerCase();

  const matches = (keywords: string) => {
    const regex = new RegExp(`\\b(${keywords})\\b`, 'i');
    return regex.test(textToAnalyze);
  };

  // 1. Geopolítica (Priority 1)
  if (matches('geopolítica|geopolítico|geostrategy|diplomacia|soberanía|frontera|tratado|alianza|otan|nato|onu|un|brics|unión europea|ue|eu|cumbre|g7|g20|pentágono|kremlin|conflicto|guerra|invasión|misil|armamento|nuclear|despliegue|tregua|alto el fuego|sanciones|embargo|espionaje|inteligencia|cia|mossad|kgb|fsb|mi6|china|rusia|eeuu|usa|ucrania|taiwán|israel|palestina|irán|corea del norte|sahel|indopacífico|árcitico|antártida|recursos naturales|litio|petróleo|gas|estrecho de ormuz|canal de suez|panamá|mar de la china|balcanes|caucaso|migración|refugiado|derechos humanos|pentagono|zelenski|putin|biden|trump|xi jinping|netanyahu')) {
    return 'geopolítica';
  }

  // 2. Tech / IA (Priority 2)
  if (matches('tecnología|tech|innovación|digital|app|apps|software|hardware|ia|inteligencia artificial|robot|robots|ciber|chatgpt|openai|meta|facebook|google|apple|microsoft|amazon|tesla|nvidia|blockchain|crypto|bitcoin|web3|metaverso|realidad virtual|vr|ar|programación|desarrollador|startup|startups|emprendimiento|disruptivo|digitalización|transformación digital|semiconductores|chips|computación cuántica')) {
    return 'tecnología';
  }

  // 3. Economía / Empresa
  if (matches('economía|económico|mercado|empresa|empresas|negocio|negocios|finanzas|bolsa|inversión|acciones|índice|ibex|dow jones|nasdaq|pib|inflación|desempleo|paro|trabajo|empleo|salario|sueldo|contrato|despido|contratación|empresario|directivo|ceo|gerente|banco|financiero|crédito|préstamo|hipoteca|ahorro|pensiones|tipos de interés|bce|fed|recesión')) {
    return 'empresa';
  }

  // 4. España
  if (matches('españa|madrid|barcelona|valencia|sevilla|bilbao|moncloa|congreso de los diputados|zarzuela|comunidad autónoma|ibex 35|gobierno de españa|pedro sánchez|feijóo|ayuso|cataluña|país vasco|galicia|andalucía|senado|constitucional|supremo')) {
    return 'españa';
  }

  // 5. Política General
  if (matches('política|político|gobierno|elecciones|partido|presidente|ministro|congreso|senado|diputado|alcalde|municipal|autonómico|nacional|ley|decreto|normativa|regulación|votación|sufragio|democracia|parlamento|asamblea|coalición|oposición|voto')) {
    return 'política';
  }

  // 6. Ciencia / Salud
  if (matches('ciencia|científico|investigación|descubrimiento|estudio|marte|espacio|nasa|astronomía|física|química|biología|genética|experimento|laboratorio|salud|médico|hospital|medicina|enfermedad|vacuna|virus|bacteria|epidemia|pandemia|covid|tratamiento|terapia|cirugía')) {
    return 'ciencia';
  }

  // 7. Medioambiente
  if (matches('medioambiente|clima|sostenibilidad|verde|ecología|contaminación|emisiones|co2|cambio climático|calentamiento global|energía renovable|solar|eólica|reciclaje|residuos|biodiversidad|naturaleza|animales|bosque|océano|sequía')) {
    return 'medioambiente';
  }

  // 8. Deportes
  if (matches('deporte|deportes|fútbol|futbol|baloncesto|olímpico|atleta|jugador|equipo|liga|champions|mundial|copa|partido|competición|tenis|f1|motor|ciclismo|maratón')) {
    return 'deportes';
  }

  // 9. Internacional (Global scope)
  if (matches('internacional|mundo|global|onu|un|extranjero|américa latina|latam|asia|áfrica|europa|oceanía|vaticano|papa|londres|parís|berlín|tokio|nueva york|washington')) {
    return 'internacional';
  }

  return 'general';
};

/**
 * Extracts key points from text.
 */
export const extractKeyPoints = (text: string): string[] => {
  if (!text || text.trim().length === 0) {
    return ['Información no disponible', 'Contenido pendiente', 'Datos en actualización'];
  }

  const sentences = text
    .split(/[.!?]\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 200);

  if (sentences.length === 0) {
    const parts = text.split(/[,;]\s+/).filter(p => p.length > 15);
    return parts.slice(0, 3).map(p => p.trim());
  }

  const sortedSentences = sentences
    .sort((a, b) => b.length - a.length)
    .slice(0, 3)
    .map(s => {
      let cleaned = s.replace(/^\d+[\.\)]\s*/, '');
      cleaned = cleaned.replace(/^[-•]\s*/, '');
      cleaned = cleaned.trim();
      if (!cleaned.match(/[.!?]$/)) {
        cleaned += '.';
      }
      return cleaned;
    });

  while (sortedSentences.length < 3 && text.length > 0) {
    const remaining = text.substring(sortedSentences.join(' ').length).trim();
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

  while (sortedSentences.length < 3) {
    sortedSentences.push('Información adicional disponible en la fuente.');
  }

  return sortedSentences.slice(0, 3);
};
