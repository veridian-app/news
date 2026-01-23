import type { VercelRequest, VercelResponse } from '@vercel/node';

interface NewsData {
  title: string;
  content: string;
  summary: string;
  source: string;
  date: string;
  url?: string;
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
    // POST: Generar comentario sugerido con IA
    if (request.method === 'POST') {
      const { newsData } = request.body as { newsData: NewsData };

      if (!newsData || !newsData.title) {
        return response.status(400).json({
          error: 'Datos de noticia requeridos',
          message: 'Debes proporcionar los datos de la noticia',
        });
      }

      // Generar comentario sugerido usando API de IA
      const suggestedComment = await generateAIComment(newsData);

      console.log(`✅ Comentario sugerido generado para noticia ${newsId}`);

      return response.status(200).json({
        comment: suggestedComment,
        newsId,
      });
    }

    // Método no permitido
    return response.status(405).json({
      error: 'Método no permitido',
      message: `Método ${request.method} no está permitido`,
    });
  } catch (error: any) {
    console.error('❌ Error en API de generar comentario:', error);
    
    return response.status(500).json({
      error: 'Error interno del servidor',
      message: error.message || 'Error desconocido',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

// Función para generar comentario sugerido con IA
async function generateAIComment(newsData: NewsData): Promise<string> {
  // Obtener API keys de las variables de entorno
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  // Si no hay ninguna API key configurada, usar comentario básico como fallback
  if (!OPENAI_API_KEY && !ANTHROPIC_API_KEY && !GEMINI_API_KEY) {
    console.warn('⚠️ No se encontró ninguna API key de IA. Usando comentario básico.');
    return generateBasicComment(newsData);
  }

  // Construir el contexto de la noticia
  const newsContext = `
Título: ${newsData.title}
Fuente: ${newsData.source || 'Desconocida'}
Fecha: ${newsData.date ? new Date(newsData.date).toLocaleDateString('es-ES') : 'No disponible'}
${newsData.url ? `URL: ${newsData.url}` : ''}

Contenido de la noticia:
${newsData.content || newsData.summary || 'No hay contenido disponible'}
`.trim();

  const systemPrompt = `Eres un asistente de IA especializado en generar comentarios relevantes y útiles sobre noticias.

REGLAS ESTRICTAS:
- Responde SIEMPRE en español
- Genera un comentario breve, relevante y constructivo sobre la noticia
- El comentario debe ser de máximo 200 caracteres (muy breve)
- Debe ser una opinión, pregunta o reflexión útil sobre el contenido de la noticia
- NO uses emojis
- Sé conciso, directo y profesional
- El comentario debe invitar a la discusión o aportar valor`;

  const userPrompt = `NOTICIA:
${newsContext}

Genera un comentario breve y relevante (máximo 200 caracteres) sobre esta noticia. Debe ser una opinión, pregunta o reflexión útil que invite a la discusión.`;

  try {
    let aiResponse: string;

    // Prioridad: OpenAI > Anthropic > Gemini
    if (OPENAI_API_KEY) {
      console.log('🔵 Usando OpenAI API para generar comentario...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 segundos timeout

      try {
        const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini', // Modelo más económico para comentarios
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.8, // Un poco más creativo para comentarios
            max_tokens: 150, // Más corto para comentarios
          }),
        });

        clearTimeout(timeoutId);

        if (!apiResponse.ok) {
          const errorText = await apiResponse.text();
          console.error(`❌ Error de OpenAI: ${apiResponse.status} - ${errorText}`);
          throw new Error(`Error de OpenAI: ${apiResponse.status}`);
        }

        const data = await apiResponse.json();
        aiResponse = data.choices[0]?.message?.content || 'Interesante noticia.';
        console.log('✅ Comentario generado con OpenAI');
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('La petición tardó demasiado. Por favor, intenta de nuevo.');
        }
        throw fetchError;
      }
    } else if (ANTHROPIC_API_KEY) {
      console.log('🟣 Usando Anthropic API para generar comentario...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      try {
        const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 150,
            messages: [
              { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
            ],
          }),
        });

        clearTimeout(timeoutId);

        if (!apiResponse.ok) {
          const errorText = await apiResponse.text();
          console.error(`❌ Error de Anthropic: ${apiResponse.status} - ${errorText}`);
          throw new Error(`Error de Anthropic: ${apiResponse.status}`);
        }

        const data = await apiResponse.json();
        aiResponse = data.content[0]?.text || 'Interesante noticia.';
        console.log('✅ Comentario generado con Anthropic');
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('La petición tardó demasiado. Por favor, intenta de nuevo.');
        }
        throw fetchError;
      }
    } else if (GEMINI_API_KEY) {
      console.log('🟢 Usando Gemini API para generar comentario...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      try {
        const apiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `${systemPrompt}\n\n${userPrompt}`
                }]
              }],
              generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 150,
              }
            }),
          }
        );

        clearTimeout(timeoutId);

        if (!apiResponse.ok) {
          const errorText = await apiResponse.text();
          console.error(`❌ Error de Gemini: ${apiResponse.status} - ${errorText}`);
          throw new Error(`Error de Gemini: ${apiResponse.status}`);
        }

        const data = await apiResponse.json();
        aiResponse = data.candidates[0]?.content?.parts[0]?.text || 'Interesante noticia.';
        console.log('✅ Comentario generado con Gemini');
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('La petición tardó demasiado. Por favor, intenta de nuevo.');
        }
        throw fetchError;
      }
    } else {
      // Fallback a comentario básico
      return generateBasicComment(newsData);
    }

    // Limpiar y truncar el comentario a 200 caracteres máximo
    const cleanedComment = aiResponse.trim().replace(/\n/g, ' ').substring(0, 200);
    return cleanedComment || 'Interesante noticia.';
  } catch (error: any) {
    console.error('❌ Error al generar comentario con IA:', error);
    
    // Si falla la API, usar comentario básico como fallback
    console.log('⚠️ Usando comentario básico como fallback');
    return generateBasicComment(newsData);
  }
}

// Función de fallback con comentarios básicos (sin IA)
function generateBasicComment(newsData: NewsData): string {
  const title = newsData.title || '';
  const content = newsData.content || newsData.summary || '';
  
  // Generar comentarios básicos basados en el contenido
  const basicComments = [
    `Interesante noticia sobre ${title.substring(0, 50)}.`,
    `Muy relevante esta información.`,
    `Gracias por compartir esta noticia.`,
    `¿Alguien más tiene más información sobre esto?`,
    `Esto es importante para estar informado.`,
  ];

  // Si hay contenido, intentar extraer algo relevante
  if (content.length > 50) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    if (sentences.length > 0) {
      const firstSentence = sentences[0].trim().substring(0, 150);
      return `${firstSentence}...`;
    }
  }

  // Comentario genérico
  return basicComments[Math.floor(Math.random() * basicComments.length)];
}

