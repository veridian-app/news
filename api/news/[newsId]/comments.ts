import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

interface Comment {
  id: string;
  newsId: string;
  userId: string;
  text: string;
  timestamp: string;
  username?: string;
}

// Función para obtener cliente de Supabase
function getSupabaseClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                       process.env.SUPABASE_PUBLISHABLE_KEY || 
                       process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return null;
  }
  
  return createClient(SUPABASE_URL, SUPABASE_KEY);
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

  const { newsId } = request.query;

  if (!newsId || typeof newsId !== 'string') {
    return response.status(400).json({
      error: 'newsId requerido',
      message: 'Debes proporcionar un newsId válido',
    });
  }

  try {
    const supabase = getSupabaseClient();
    
    // GET: Obtener comentarios
    if (request.method === 'GET') {
      if (supabase) {
        // Obtener desde Supabase
        const { data, error } = await supabase
          .from('news_comments')
          .select('*')
          .eq('news_id', newsId)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('⚠️ Error obteniendo comentarios desde Supabase:', error.message);
          // Fallback a array vacío
          return response.status(200).json([]);
        }

        // Transformar a formato esperado
        const comments: Comment[] = (data || []).map((c: any) => ({
          id: c.id,
          newsId: c.news_id,
          userId: c.user_id,
          text: c.text,
          timestamp: c.created_at,
          username: c.username || (c.user_id === 'anonymous' ? 'Anónimo' : c.user_id.substring(0, 20)),
        }));

        console.log(`✅ Obtenidos ${comments.length} comentarios desde Supabase para noticia ${newsId}`);
        return response.status(200).json(comments);
      } else {
        // Fallback: retornar array vacío si Supabase no está configurado
        console.warn('⚠️ Supabase no configurado para comentarios');
        return response.status(200).json([]);
      }
    }

    // POST: Añadir comentario
    if (request.method === 'POST') {
      const { userId, text } = request.body;

      if (!userId || !text || typeof text !== 'string' || text.trim().length === 0) {
        return response.status(400).json({
          error: 'Datos inválidos',
          message: 'userId y text son requeridos',
        });
      }

      if (text.length > 500) {
        return response.status(400).json({
          error: 'Comentario muy largo',
          message: 'El comentario no puede exceder 500 caracteres',
        });
      }

      if (supabase) {
        // Guardar en Supabase
        const { data, error } = await supabase
          .from('news_comments')
          .insert({
            news_id: newsId,
            user_id: userId,
            text: text.trim(),
            username: userId === 'anonymous' ? 'Anónimo' : userId.substring(0, 20),
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Error guardando comentario en Supabase:', error);
          return response.status(500).json({
            error: 'Error al guardar comentario',
            message: error.message,
          });
        }

        // Transformar a formato esperado
        const newComment: Comment = {
          id: data.id,
          newsId: data.news_id,
          userId: data.user_id,
          text: data.text,
          timestamp: data.created_at,
          username: data.username || (data.user_id === 'anonymous' ? 'Anónimo' : data.user_id.substring(0, 20)),
        };

        console.log(`✅ Comentario guardado en Supabase para noticia ${newsId} por usuario ${userId}`);
        return response.status(201).json(newComment);
      } else {
        // Fallback: error si Supabase no está configurado
        console.error('❌ Supabase no configurado para guardar comentarios');
        return response.status(500).json({
          error: 'Servicio no disponible',
          message: 'Los comentarios requieren Supabase. Configura las variables de entorno.',
        });
      }
    }

    // Método no permitido
    return response.status(405).json({
      error: 'Método no permitido',
      message: `Método ${request.method} no está permitido`,
    });
  } catch (error: any) {
    console.error('❌ Error en API de comentarios:', error);
    
    return response.status(500).json({
      error: 'Error interno del servidor',
      message: error.message || 'Error desconocido',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

