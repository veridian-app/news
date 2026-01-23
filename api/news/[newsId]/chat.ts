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
  // Configurar CORS PRIMERO (antes de cualquier otra cosa)
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  );

  // Manejar preflight OPTIONS
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  // Log para debugging
  console.log('🔵 Chat endpoint llamado:', {
    method: request.method,
    url: request.url,
    query: request.query,
    hasBody: !!request.body,
    bodyType: typeof request.body
  });

  // Verificar que el método sea POST
  if (request.method !== 'POST') {
    console.error('❌ Método no permitido:', request.method);
    return response.status(405).json({
      error: 'Método no permitido',
      message: `Método ${request.method} no está permitido. Solo se acepta POST.`,
      receivedMethod: request.method,
      allowedMethods: ['POST', 'OPTIONS']
    });
  }

  const { newsId } = request.query;

  if (!newsId || typeof newsId !== 'string') {
    console.error('❌ newsId inválido:', newsId);
    return response.status(400).json({
      error: 'newsId requerido',
      message: 'Debes proporcionar un newsId válido',
    });
  }

  try {
    console.log('✅ Método POST recibido para newsId:', newsId);
    
    // Parsear el body si es necesario
    let body = request.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error('❌ Error parseando body:', e);
        return response.status(400).json({
          error: 'Body inválido',
          message: 'El body debe ser un JSON válido',
        });
      }
    }

    const { question, newsData } = body as { question: string; newsData: NewsData };

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return response.status(400).json({
        error: 'Pregunta requerida',
        message: 'Debes proporcionar una pregunta válida',
      });
    }

    if (!newsData || !newsData.title) {
      return response.status(400).json({
        error: 'Datos de noticia requeridos',
        message: 'Debes proporcionar los datos de la noticia',
      });
    }

    // Generar respuesta usando API de IA real
    const responseText = await generateAIResponse(question, newsData);

    console.log(`✅ Respuesta IA generada para noticia ${newsId}`);

    return response.status(200).json({
      response: responseText,
      newsId,
      question,
    });
  } catch (error: any) {
    console.error('❌ Error en API de chat:', error);
    
    return response.status(500).json({
      error: 'Error interno del servidor',
      message: error.message || 'Error desconocido',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

// Función para detectar si el contenido es sobre política
function isPoliticalContent(newsData: NewsData): boolean {
  const politicalKeywords = [
    'política', 'político', 'políticos', 'gobierno', 'gobiernos',
    'partido', 'partidos', 'elecciones', 'elección', 'votación', 'voto',
    'parlamento', 'congreso', 'senado', 'diputado', 'diputados',
    'ministro', 'ministros', 'presidente', 'presidencia', 'alcalde',
    'ley', 'leyes', 'legislación', 'decreto', 'normativa',
    'democracia', 'democrático', 'reforma', 'reformas',
    'oposición', 'coalición', 'mayoría', 'minoría'
  ];
  
  const content = `${newsData.title} ${newsData.content} ${newsData.summary}`.toLowerCase();
  return politicalKeywords.some(keyword => content.includes(keyword));
}

// Función para detectar si la pregunta es sobre un documento o estudio
function isAskingForDocument(question: string): boolean {
  const documentKeywords = [
    'documento', 'documentos', 'estudio', 'estudios', 'informe', 'informes',
    'reporte', 'reportes', 'análisis', 'investigación', 'investigaciones',
    'paper', 'publicación', 'publicaciones', 'fuente', 'fuentes',
    'referencia', 'referencias', 'cita', 'citas', 'bibliografía',
    'dame el', 'muéstrame el', 'busca el', 'encuentra el',
    'dónde está el', 'dónde encontrar', 'link del', 'enlace del',
    'pdf', 'archivo', 'descargar', 'descarga', 'descárgalo',
    'papel', 'papeles', 'texto completo', 'texto íntegro',
    'versión completa', 'documento completo', 'estudio completo',
    'informe completo', 'reporte completo', 'análisis completo'
  ];
  
  const questionLower = question.toLowerCase();
  return documentKeywords.some(keyword => questionLower.includes(keyword));
}

// Función para buscar documentos/estudios/PDFs en la web centrado en la noticia
async function searchDocument(query: string, newsData: NewsData): Promise<string | null> {
  try {
    // Usar la API de búsqueda de Google (Custom Search API) si está disponible
    const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
    const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    if (GOOGLE_SEARCH_API_KEY && GOOGLE_SEARCH_ENGINE_ID) {
      // Construir query centrado en la noticia: incluir título, tema principal y buscar PDFs
      const newsTitle = newsData.title || '';
      const newsSummary = newsData.summary || newsData.content || '';
      
      // Extraer palabras clave del título (palabras importantes, excluyendo artículos y preposiciones)
      const stopWords = ['el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'en', 'con', 'por', 'para', 'sobre', 'a', 'al'];
      const titleWords = newsTitle
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopWords.includes(w.toLowerCase()))
        .slice(0, 6)
        .join(' ');
      
      // Extraer palabras clave del resumen/contenido (primeras palabras importantes)
      const summaryWords = newsSummary
        .split(/\s+/)
        .filter(w => w.length > 4 && !stopWords.includes(w.toLowerCase()))
        .slice(0, 3)
        .join(' ');
      
      // Construir query mejorado: pregunta del usuario + palabras clave de la noticia + tipos de archivo
      const contextWords = titleWords + (summaryWords ? ` ${summaryWords}` : '');
      const enhancedQuery = `"${query}" ${contextWords} (filetype:pdf OR filetype:doc OR filetype:docx)`;
      
      const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(enhancedQuery)}&num=5`;
      
      console.log(`🔍 Buscando documentos con query: ${enhancedQuery}`);
      
      const response = await fetch(searchUrl);
      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          // Filtrar y priorizar PDFs y documentos oficiales
          const pdfResults = data.items.filter((item: any) => 
            item.link.toLowerCase().includes('.pdf') || 
            item.link.toLowerCase().includes('pdf') ||
            item.title.toLowerCase().includes('pdf')
          );
          
          const otherDocs = data.items.filter((item: any) => 
            !item.link.toLowerCase().includes('.pdf') && 
            !item.link.toLowerCase().includes('pdf')
          );
          
          // Priorizar PDFs, luego otros documentos
          const prioritizedResults = [...pdfResults, ...otherDocs].slice(0, 5);
          
          const results = prioritizedResults.map((item: any, index: number) => {
            const isPdf = item.link.toLowerCase().includes('.pdf') || item.link.toLowerCase().includes('pdf');
            const pdfLabel = isPdf ? ' [PDF]' : '';
            return `${index + 1}. ${item.title}${pdfLabel}\n   🔗 ${item.link}\n   ${item.snippet || 'Sin descripción disponible'}`;
          }).join('\n\n');
          
          return `Documentos y PDFs encontrados relacionados con la noticia:\n\n${results}`;
        }
      } else {
        const errorText = await response.text();
        console.warn(`⚠️ Error en búsqueda de Google: ${response.status} - ${errorText}`);
      }
    }
    
    return null;
  } catch (error: any) {
    console.error('❌ Error buscando documento:', error.message);
    return null;
  }
}

// Función para generar respuesta de IA usando APIs reales
async function generateAIResponse(question: string, newsData: NewsData): Promise<string> {
  // Obtener API keys de las variables de entorno
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  // Si no hay ninguna API key configurada, usar respuesta básica como fallback
  if (!OPENAI_API_KEY && !ANTHROPIC_API_KEY && !GEMINI_API_KEY) {
    console.warn('⚠️ No se encontró ninguna API key de IA. Usando respuesta básica.');
    return generateBasicResponse(question, newsData);
  }

  // Detectar si se pregunta por un documento/PDF (funciona para CUALQUIER noticia)
  const askingForDoc = isAskingForDocument(question);
  
  // Si pregunta por documento/PDF, buscar información centrada en la noticia
  let documentSearchResults: string | null = null;
  if (askingForDoc) {
    console.log('🔍 Detectado: pregunta por documento/PDF. Buscando documentos relacionados con la noticia...');
    // Construir query centrado en la noticia y la pregunta del usuario
    const searchQuery = question; // La pregunta del usuario ya contiene lo que busca
    documentSearchResults = await searchDocument(searchQuery, newsData);
    if (documentSearchResults) {
      console.log('✅ Documentos encontrados relacionados con la noticia');
    } else {
      console.log('ℹ️ No se encontraron documentos con búsqueda automática, la IA proporcionará orientación');
    }
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

  // Construir system prompt con instrucciones especiales para política y documentos
  let systemPrompt = `Eres un asistente de IA especializado en analizar y explicar noticias. Tu objetivo principal es ayudar a los usuarios a entender mejor la noticia específica que están leyendo.

INSTRUCCIONES:
- Responde SIEMPRE en español
- Tu respuesta DEBE estar basada principalmente en la información de la noticia proporcionada
- Prioriza siempre mencionar o relacionar tu respuesta con el contenido de la noticia
- Puedes proporcionar contexto adicional, información relacionada o responder preguntas sobre:
  * Productos, servicios o ofertas mencionados en la noticia
  * Fechas, eventos o plazos relacionados con la noticia
  * Detalles sobre personas, empresas o lugares mencionados
  * Información complementaria sobre el tema de la noticia
- Si la pregunta está relacionada con el tema de la noticia, responde de manera útil y siempre relaciona con la noticia
- Sé conversacional, amigable y natural
- Si la pregunta no tiene relación alguna con la noticia, sé amable y sugiere hacer preguntas sobre el contenido de la noticia

IMPORTANTE: Siempre relaciona tu respuesta con la noticia. Si hablas de algo relacionado, menciona cómo se relaciona con lo que dice la noticia.`;

  // Agregar instrucciones especiales cuando se pregunta por documentos/PDFs
  if (askingForDoc) {
    systemPrompt += `

INSTRUCCIONES ESPECIALES PARA BÚSQUEDA DE DOCUMENTOS Y PDFs:
- El usuario está preguntando por un documento, estudio, informe, PDF o fuente relacionada con ESTA NOTICIA ESPECÍFICA
- SIEMPRE relaciona la búsqueda con el contenido de la noticia proporcionada
- Si se proporcionan resultados de búsqueda de documentos, ÚSALOS y proporciona los enlaces directos
- Prioriza documentos y PDFs que estén directamente relacionados con el tema de la noticia
- Si no hay resultados de búsqueda pero mencionas un documento/estudio, proporciona información sobre cómo encontrarlo:
  * Para noticias políticas: BOE, diarios oficiales, páginas web gubernamentales, instituciones públicas
  * Para noticias científicas: repositorios académicos, universidades, revistas científicas
  * Para noticias empresariales: registros mercantiles, informes corporativos, reguladores
  * Para noticias de salud: organismos de salud pública, estudios médicos, revistas especializadas
  * En general: sitios oficiales, instituciones relevantes, fuentes primarias del tema
- Si conoces el nombre del documento mencionado en la noticia, proporciona términos de búsqueda específicos
- Siempre intenta dar información útil sobre dónde encontrar el documento mencionado, CENTRÁNDOTE EN EL CONTENIDO DE LA NOTICIA
- Si no puedes encontrar el documento específico, proporciona orientación sobre cómo buscarlo de manera efectiva usando términos relacionados con la noticia`;
  }

  // Construir user prompt con resultados de búsqueda si están disponibles
  let userPrompt = `NOTICIA ACTUAL:

${newsContext}

PREGUNTA DEL USUARIO: ${question}`;

  // Agregar resultados de búsqueda si están disponibles
  if (documentSearchResults) {
    userPrompt += `

RESULTADOS DE BÚSQUEDA DE DOCUMENTOS:
${documentSearchResults}

IMPORTANTE: Usa estos resultados de búsqueda para proporcionar enlaces directos y información específica sobre el documento solicitado.`;
  }

  userPrompt += `

INSTRUCCIONES PARA RESPONDER:
1. Analiza la pregunta en relación con la noticia proporcionada
2. Si la pregunta está relacionada con el tema, productos, eventos, fechas o conceptos de la noticia, responde de manera útil
3. SIEMPRE menciona o relaciona tu respuesta con el contenido de la noticia
4. Puedes proporcionar información adicional relacionada, pero siempre conectándola con lo que dice la noticia
5. Sé específico y útil, usando la información de la noticia como base principal
6. Si la pregunta es sobre algo mencionado en la noticia (productos, ofertas, fechas, etc.), proporciona detalles útiles basándote en la noticia y contexto relacionado`;

  // Instrucciones adicionales cuando se pregunta por documentos
  if (askingForDoc) {
    userPrompt += `
7. ESPECIAL: El usuario pregunta por un documento/PDF/estudio relacionado con ESTA NOTICIA. 
   - Si hay resultados de búsqueda arriba, proporciona los enlaces directamente
   - SIEMPRE relaciona los documentos con el contenido específico de la noticia
   - Si no hay resultados, proporciona orientación sobre dónde buscar documentos relacionados con el tema de esta noticia específica
   - Menciona términos clave de la noticia que puedan ayudar a encontrar el documento`;
  }

  try {
    let aiResponse: string;

    // Prioridad: OpenAI > Anthropic > Gemini
    if (OPENAI_API_KEY) {
      // Si pregunta por documento, usar modelo más potente para mejor razonamiento sobre documentos
      const useBetterModel = askingForDoc && !documentSearchResults;
      const model = useBetterModel ? 'gpt-4o' : 'gpt-4o-mini'; // gpt-4o tiene mejor capacidad de razonamiento
      
      console.log(`🔵 Usando OpenAI API para chat con modelo ${model}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // Más tiempo si busca documentos

      try {
        const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7, // Un poco menos creativo para respuestas más precisas sobre documentos
            max_tokens: 2000, // Más tokens para incluir enlaces y referencias
          }),
        });

        clearTimeout(timeoutId);

        if (!apiResponse.ok) {
          const errorText = await apiResponse.text();
          console.error(`❌ Error de OpenAI: ${apiResponse.status} - ${errorText}`);
          throw new Error(`Error de OpenAI: ${apiResponse.status}`);
        }

        const data = await apiResponse.json();
        aiResponse = data.choices[0]?.message?.content || 'No se pudo generar una respuesta.';
        console.log('✅ Respuesta de OpenAI recibida');
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('La petición tardó demasiado. Por favor, intenta de nuevo.');
        }
        throw fetchError;
      }
    } else if (ANTHROPIC_API_KEY) {
      console.log('🟣 Usando Anthropic API para chat...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

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
            model: 'claude-3-haiku-20240307', // Modelo más rápido y económico
            max_tokens: 1500, // Respuestas más completas
            temperature: 0.8, // Más creativo y flexible
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
        aiResponse = data.content[0]?.text || 'No se pudo generar una respuesta.';
        console.log('✅ Respuesta de Anthropic recibida');
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('La petición tardó demasiado. Por favor, intenta de nuevo.');
        }
        throw fetchError;
      }
    } else if (GEMINI_API_KEY) {
      console.log('🟢 Usando Gemini API para chat...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

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
                temperature: 0.8, // Más creativo y flexible
                maxOutputTokens: 1500, // Respuestas más completas
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
        aiResponse = data.candidates[0]?.content?.parts[0]?.text || 'No se pudo generar una respuesta.';
        console.log('✅ Respuesta de Gemini recibida');
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('La petición tardó demasiado. Por favor, intenta de nuevo.');
        }
        throw fetchError;
      }
    } else {
      // Fallback a respuesta básica
      return generateBasicResponse(question, newsData);
    }

    return aiResponse.trim();
  } catch (error: any) {
    console.error('❌ Error al generar respuesta de IA:', error);
    
    // Si falla la API, usar respuesta básica como fallback
    console.log('⚠️ Usando respuesta básica como fallback');
    return generateBasicResponse(question, newsData);
  }
}

// Función de fallback con respuestas básicas (sin IA)
function generateBasicResponse(question: string, newsData: NewsData): string {
  const questionLower = question.toLowerCase();
  const content = newsData.content || newsData.summary || '';
  const title = newsData.title || '';

  // Respuestas contextuales basadas en palabras clave
  if (questionLower.includes('qué') || questionLower.includes('que') || questionLower.includes('what')) {
    if (content.length > 0) {
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
      const summary = sentences.slice(0, 3).join('. ').trim();
      return `Basándome en la noticia "${title}", puedo decirte que: ${summary}. ${newsData.url ? `Puedes leer más en: ${newsData.url}` : ''}`;
    }
    return `Según la noticia "${title}", esta información proviene de ${newsData.source || 'una fuente confiable'}. ${newsData.date ? `Publicada el ${new Date(newsData.date).toLocaleDateString('es-ES')}.` : ''}`;
  }

  if (questionLower.includes('cuándo') || questionLower.includes('cuando') || questionLower.includes('when')) {
    if (newsData.date) {
      const date = new Date(newsData.date);
      return `Esta noticia fue publicada el ${date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}.`;
    }
    return 'No tengo información específica sobre la fecha de esta noticia.';
  }

  if (questionLower.includes('dónde') || questionLower.includes('donde') || questionLower.includes('where')) {
    return `Esta noticia proviene de ${newsData.source || 'una fuente confiable'}. ${newsData.url ? `Puedes ver la fuente original aquí: ${newsData.url}` : ''}`;
  }

  if (questionLower.includes('quién') || questionLower.includes('quien') || questionLower.includes('who')) {
    const namePattern = /[A-Z][a-z]+ [A-Z][a-z]+/g;
    const names = content.match(namePattern);
    if (names && names.length > 0) {
      return `Según la noticia, las personas mencionadas incluyen: ${names.slice(0, 3).join(', ')}.`;
    }
    return `Esta información proviene de ${newsData.source || 'la fuente de la noticia'}.`;
  }

  if (questionLower.includes('cómo') || questionLower.includes('como') || questionLower.includes('how')) {
    if (content.length > 100) {
      const relevantPart = content.substring(0, 300);
      return `Según la noticia: ${relevantPart}... ${newsData.url ? `Para más detalles, visita: ${newsData.url}` : ''}`;
    }
    return `Para entender mejor cómo sucedió esto, te recomiendo leer el contenido completo de la noticia. ${newsData.url ? `Puedes encontrarlo aquí: ${newsData.url}` : ''}`;
  }

  if (questionLower.includes('por qué') || questionLower.includes('porque') || questionLower.includes('why')) {
    if (content.length > 100) {
      const explanation = content.split(/[.!?]+/).find(s => 
        s.toLowerCase().includes('porque') || 
        s.toLowerCase().includes('debido') || 
        s.toLowerCase().includes('causa')
      );
      if (explanation) {
        return explanation.trim() + '.';
      }
    }
    return `Basándome en la noticia "${title}", esta situación se explica en el contenido. Te recomiendo leer el artículo completo para entender mejor las razones.`;
  }

  // Respuesta genérica
  if (content.length > 0) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const relevantSentences = sentences.slice(0, 2).join('. ').trim();
    return `Según la noticia "${title}": ${relevantSentences}. ${newsData.url ? `Para más información, puedes consultar la fuente: ${newsData.url}` : ''}`;
  }

  return `Basándome en la noticia "${title}" de ${newsData.source || 'la fuente'}, puedo ayudarte a entender mejor el tema. ¿Hay algo específico que te gustaría saber sobre esta noticia?`;
}

