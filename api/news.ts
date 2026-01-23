import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';
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
  // Intentar obtener variables de entorno (primero sin VITE_ para API routes, luego con VITE_ como fallback)
  // Nota: En Vercel, las variables VITE_* normalmente NO están disponibles en API routes,
  // pero las intentamos como fallback por si acaso
  const SUPABASE_URL = process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Para API routes, preferir SERVICE_ROLE_KEY (tiene más permisos), pero aceptar PUBLISHABLE_KEY como fallback
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (newsIds.length === 0) {
    return new Map();
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn('⚠️ Variables de Supabase no configuradas. Retornando conteos en 0 para todas las noticias.');
    // Retornar un mapa con ceros para todas las noticias
    const emptyMap = new Map<string, number>();
    newsIds.forEach(id => emptyMap.set(id, 0));
    return emptyMap;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Usar una consulta más eficiente: contar directamente en la base de datos
    // Para cada noticia, obtener el conteo de likes
    const likesMap = new Map<string, number>();

    // Procesar en lotes para evitar consultas demasiado grandes
    const batchSize = 100;
    for (let i = 0; i < newsIds.length; i += batchSize) {
      const batch = newsIds.slice(i, i + batchSize);

      // Obtener todos los likes de este lote
      const { data, error } = await supabase
        .from('news_likes')
        .select('news_id')
        .in('news_id', batch);

      if (error) {
        console.warn('⚠️ Error obteniendo likes desde Supabase:', error.message);
        // Continuar con el siguiente lote en lugar de retornar vacío
        continue;
      }

      // Contar likes por noticia en este lote
      if (data) {
        data.forEach((like: any) => {
          const count = likesMap.get(like.news_id) || 0;
          likesMap.set(like.news_id, count + 1);
        });
      }
    }

    // Asegurar que todas las noticias tengan un conteo (aunque sea 0)
    newsIds.forEach(id => {
      if (!likesMap.has(id)) {
        likesMap.set(id, 0);
      }
    });

    return likesMap;
  } catch (error: any) {
    console.warn('⚠️ Error conectando con Supabase para likes:', error.message);
    // Retornar un mapa con ceros para todas las noticias en caso de error
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
    const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
    const GOOGLE_SERVICE_ACCOUNT = process.env.GOOGLE_SERVICE_ACCOUNT; // JSON string del service account
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; // Fallback a API Key simple

    // Verificar que GOOGLE_SHEET_ID esté configurado
    if (!GOOGLE_SHEET_ID) {
      console.error('❌ GOOGLE_SHEET_ID no configurado');
      return response.status(500).json({
        error: 'Configuración faltante',
        message: 'GOOGLE_SHEET_ID debe estar configurado en Vercel',
      });
    }

    // Obtener parámetros de paginación
    const { page = '1', limit = '100' } = request.query;
    const pageNum = parseInt(Array.isArray(page) ? page[0] : page, 10) || 1;
    const limitNum = parseInt(Array.isArray(limit) ? limit[0] : limit, 10) || 100;

    // Calcular rango basado en paginación
    // Fila 1 son headers, datos empiezan en fila 2
    const startRow = 2 + (pageNum - 1) * limitNum;
    const endRow = startRow + limitNum - 1;

    // Usar Sheet1 y el rango calculado
    const range = `Sheet1!A${startRow}:H${endRow}`;
    let data: any;

    // Intentar usar Service Account (más seguro)
    if (GOOGLE_SERVICE_ACCOUNT) {
      try {
        console.log(`🔐 Usando Service Account para autenticación. Rango: ${range}`);
        const serviceAccount = JSON.parse(GOOGLE_SERVICE_ACCOUNT);

        // Usar GoogleAuth con las credenciales del Service Account
        const auth = new google.auth.GoogleAuth({
          credentials: {
            client_email: serviceAccount.client_email,
            private_key: serviceAccount.private_key,
          },
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const authClient = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: authClient as any });

        const sheetsResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: GOOGLE_SHEET_ID,
          range: range,
        });

        data = sheetsResponse.data;
        console.log(`✅ Conectado con Service Account a Google Sheets: ${GOOGLE_SHEET_ID}`);
      } catch (serviceAccountError: any) {
        console.warn('⚠️ Error con Service Account, intentando con API Key:', serviceAccountError.message);

        // Fallback a API Key simple
        if (!GOOGLE_API_KEY) {
          throw new Error('Service Account falló y no hay GOOGLE_API_KEY como fallback');
        }

        const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${range}?key=${GOOGLE_API_KEY}`;
        const sheetsResponse = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!sheetsResponse.ok) {
          const errorText = await sheetsResponse.text();
          throw new Error(`Google Sheets API error: ${sheetsResponse.status} - ${errorText}`);
        }

        data = await sheetsResponse.json();
        console.log(`✅ Conectado con API Key a Google Sheets: ${GOOGLE_SHEET_ID}`);
      }
    } else if (GOOGLE_API_KEY) {
      // Usar API Key simple
      console.log('🔑 Usando API Key simple para autenticación');
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${range}?key=${GOOGLE_API_KEY}`;

      const sheetsResponse = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!sheetsResponse.ok) {
        const errorText = await sheetsResponse.text();
        console.error('❌ Error de Google Sheets API:', sheetsResponse.status, errorText);

        return response.status(sheetsResponse.status).json({
          error: 'Error al conectar con Google Sheets',
          message: `Google Sheets API respondió con status ${sheetsResponse.status}`,
          details: errorText,
        });
      }

      data = await sheetsResponse.json();
      console.log(`✅ Conectado con API Key a Google Sheets: ${GOOGLE_SHEET_ID}`);
    } else {
      return response.status(500).json({
        error: 'Configuración faltante',
        message: 'Debes configurar GOOGLE_SERVICE_ACCOUNT (recomendado) o GOOGLE_API_KEY en Vercel',
      });
    }

    // Verificar que hay datos
    if (!data.values || !Array.isArray(data.values) || data.values.length === 0) {
      console.warn('⚠️ Google Sheets no tiene datos o está vacío');
      return response.status(200).json([]);
    }

    // Transformar datos de Google Sheets a formato NewsItem
    // Formato del Sheet: A=Article Title, B=Small resumen, C=Timestamp, D=Source, E=Link, F=Tema, G=Content, H=(vacío)
    const news: NewsItem[] = data.values
      .filter((row: any[]) => row && row.length >= 1 && row[0]) // Filtrar filas vacías o sin título
      .map((row: any[], index: number) => {
        // Mapear columnas según el formato real del Sheet
        const [articleTitle, smallResumen, timestamp, source, link, tema, content] = row;

        // Validar URL: solo incluir si es una URL válida (no vacía, no solo espacios)
        const validUrl = link && typeof link === 'string' && link.trim() && link.trim().length > 0
          ? link.trim()
          : undefined;

        // Usar el título del artículo como ID si no hay ID específico
        const newsId = articleTitle ? `news-${articleTitle.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '-')}-${index}` : `news-${index}`;

        return {
          id: newsId,
          title: articleTitle || 'Sin título',
          summary: smallResumen || content?.substring(0, 200) || articleTitle || 'Sin resumen',
          content: content || smallResumen || articleTitle || 'Sin contenido',
          image: undefined, // No hay columna de imagen en el Sheet actual
          date: timestamp || new Date().toISOString(),
          source: source || 'Veridian News',
          url: validUrl,
          likes: 0, // Se actualizará después con los datos de Supabase
          comments: 0,
        };
      })
      .filter((item: NewsItem) => item.title && item.title !== 'Sin título' && item.title.trim().length > 0); // Filtrar items inválidos

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

    console.log(`✅ Cargadas ${news.length} noticias desde Google Sheets`);
    console.log(`✅ Conteo de likes obtenido para ${likesCount.size} noticias`);
    console.log(`✅ Conteo de comentarios obtenido para ${commentsCount.size} noticias`);

    return response.status(200).json(news);
  } catch (error: any) {
    console.error('❌ Error en API /api/news:', error);

    return response.status(500).json({
      error: 'Error interno del servidor',
      message: error.message || 'Error desconocido',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

