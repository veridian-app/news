import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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
}

// Función para obtener conteo de comentarios desde Supabase
async function getCommentsCount(newsIds: string[]): Promise<Map<string, number>> {
  const SUPABASE_URL = process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (newsIds.length === 0) {
    return new Map();
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn('⚠️ Variables de Supabase no configuradas para comentarios. Retornando conteos en 0.');
    const emptyMap = new Map<string, number>();
    newsIds.forEach(id => emptyMap.set(id, 0));
    return emptyMap;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const commentsMap = new Map<string, number>();

    // Procesar en lotes para evitar consultas demasiado grandes
    const batchSize = 100;
    for (let i = 0; i < newsIds.length; i += batchSize) {
      const batch = newsIds.slice(i, i + batchSize);

      const { data, error } = await supabase
        .from('news_comments')
        .select('news_id')
        .in('news_id', batch);

      if (error) {
        console.warn('⚠️ Error obteniendo comentarios desde Supabase:', error.message);
        continue;
      }

      // Contar comentarios por noticia en este lote
      if (data) {
        data.forEach((comment: any) => {
          const count = commentsMap.get(comment.news_id) || 0;
          commentsMap.set(comment.news_id, count + 1);
        });
      }
    }

    // Asegurar que todas las noticias tengan un conteo (aunque sea 0)
    newsIds.forEach(id => {
      if (!commentsMap.has(id)) {
        commentsMap.set(id, 0);
      }
    });

    return commentsMap;
  } catch (error: any) {
    console.warn('⚠️ Error conectando con Supabase para comentarios:', error.message);
    const emptyMap = new Map<string, number>();
    newsIds.forEach(id => emptyMap.set(id, 0));
    return emptyMap;
  }
}

// Función para obtener conteo de likes desde Supabase
async function getLikesCount(newsIds: string[]): Promise<Map<string, number>> {
  const SUPABASE_URL = process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (newsIds.length === 0) {
    return new Map();
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn('⚠️ Variables de Supabase no configuradas. Retornando conteos en 0 para todas las noticias.');
    const emptyMap = new Map<string, number>();
    newsIds.forEach(id => emptyMap.set(id, 0));
    return emptyMap;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const likesMap = new Map<string, number>();

    const batchSize = 100;
    for (let i = 0; i < newsIds.length; i += batchSize) {
      const batch = newsIds.slice(i, i + batchSize);

      const { data, error } = await supabase
        .from('news_likes')
        .select('news_id')
        .in('news_id', batch);

      if (error) {
        console.warn('⚠️ Error obteniendo likes desde Supabase:', error.message);
        continue;
      }

      if (data) {
        data.forEach((like: any) => {
          const count = likesMap.get(like.news_id) || 0;
          likesMap.set(like.news_id, count + 1);
        });
      }
    }

    newsIds.forEach(id => {
      if (!likesMap.has(id)) {
        likesMap.set(id, 0);
      }
    });

    return likesMap;
  } catch (error: any) {
    console.warn('⚠️ Error conectando con Supabase para likes:', error.message);
    const emptyMap = new Map<string, number>();
    newsIds.forEach(id => emptyMap.set(id, 0));
    return emptyMap;
  }
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Configurar CORS
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  );

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error('❌ Variables de Supabase no configuradas');
      return response.status(500).json({
        error: 'Configuración faltante',
        message: 'Debes configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY',
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Obtener parámetros de paginación
    const { page = '1', limit = '100' } = request.query;
    const pageNum = parseInt(Array.isArray(page) ? page[0] : page, 10) || 1;
    const limitNum = parseInt(Array.isArray(limit) ? limit[0] : limit, 10) || 100;

    // Calcular rango (0-indexed)
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    console.log(`📡 Fetching news from Supabase (range: ${from}-${to})`);

    const { data: dbNews, error: dbError } = await supabase
      .from('daily_news')
      .select('*')
      .order('published_at', { ascending: false })
      .range(from, to);

    if (dbError) {
      console.error('❌ Error fetching from daily_news:', dbError);
      throw dbError;
    }

    if (!dbNews || dbNews.length === 0) {
      console.warn('⚠️ No news found in daily_news table');
      return response.status(200).json([]);
    }

    // DEBUG: Log sample of raw data to see image field
    console.log('📊 Sample raw data from DB:', dbNews.slice(0, 3).map((item: any) => ({
      id: item.id,
      title: item.title?.substring(0, 30),
      image: item.image,
      hasImage: !!item.image
    })));
    console.log(`📊 Total items with images: ${dbNews.filter((item: any) => item.image && item.image !== '' && item.image !== 'GENERATION_FAILED').length}/${dbNews.length}`);

    // Transformar datos de Supabase a formato NewsItem
    const news: NewsItem[] = dbNews.map((item: any) => ({
      id: item.id,
      title: item.title,
      summary: item.summary || item.content?.substring(0, 200) || 'Sin resumen',
      content: item.content || 'Sin contenido',
      image: item.image,
      date: item.published_at || new Date().toISOString(),
      source: item.source || 'Veridian News',
      url: item.url,
      likes: 0,
      comments: 0,
    }));

    // Obtener conteo de likes y comentarios desde Supabase
    const newsIds = news.map(item => item.id);
    const [likesCount, commentsCount] = await Promise.all([
      getLikesCount(newsIds),
      getCommentsCount(newsIds)
    ]);

    // Actualizar el conteo de likes y comentarios en cada noticia
    news.forEach(item => {
      item.likes = likesCount.get(item.id) || 0;
      item.comments = commentsCount.get(item.id) || 0;
    });

    console.log(`✅ Loaded ${news.length} news items from Supabase`);

    return response.status(200).json(news);
  } catch (error: any) {
    console.error('❌ Error in API /api/news:', error);

    return response.status(500).json({
      error: 'Error interno del servidor',
      message: error.message || 'Error desconocido',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
