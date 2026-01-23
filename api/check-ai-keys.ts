import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Configurar CORS
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  );

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'GET') {
    return response.status(405).json({
      error: 'Método no permitido',
      message: 'Solo se acepta GET',
    });
  }

  // Verificar qué API keys están configuradas
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  const keysStatus = {
    OPENAI_API_KEY: {
      configured: !!OPENAI_API_KEY,
      hasValue: OPENAI_API_KEY ? (OPENAI_API_KEY.length > 0) : false,
      preview: OPENAI_API_KEY ? `${OPENAI_API_KEY.substring(0, 10)}...` : 'No configurada',
    },
    ANTHROPIC_API_KEY: {
      configured: !!ANTHROPIC_API_KEY,
      hasValue: ANTHROPIC_API_KEY ? (ANTHROPIC_API_KEY.length > 0) : false,
      preview: ANTHROPIC_API_KEY ? `${ANTHROPIC_API_KEY.substring(0, 10)}...` : 'No configurada',
    },
    GEMINI_API_KEY: {
      configured: !!GEMINI_API_KEY,
      hasValue: GEMINI_API_KEY ? (GEMINI_API_KEY.length > 0) : false,
      preview: GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...` : 'No configurada',
    },
  };

  const hasAnyKey = !!(OPENAI_API_KEY || ANTHROPIC_API_KEY || GEMINI_API_KEY);
  const configuredKeys = [
    OPENAI_API_KEY && 'OPENAI_API_KEY',
    ANTHROPIC_API_KEY && 'ANTHROPIC_API_KEY',
    GEMINI_API_KEY && 'GEMINI_API_KEY',
  ].filter(Boolean) as string[];

  return response.status(200).json({
    success: hasAnyKey,
    message: hasAnyKey
      ? `✅ API keys configuradas: ${configuredKeys.join(', ')}`
      : '❌ No se encontró ninguna API key configurada',
    keys: keysStatus,
    configuredKeys,
    instructions: hasAnyKey
      ? 'Las API keys están configuradas correctamente. El chat de IA debería funcionar.'
      : {
          title: 'Cómo configurar las API keys',
          steps: [
            '1. Ve a Vercel Dashboard: https://vercel.com/dashboard',
            '2. Selecciona tu proyecto',
            '3. Ve a Settings → Environment Variables',
            '4. Agrega una de estas variables:',
            '   - OPENAI_API_KEY (recomendado)',
            '   - ANTHROPIC_API_KEY',
            '   - GEMINI_API_KEY',
            '5. Pega tu API key como valor',
            '6. Marca Production, Preview y Development',
            '7. Haz un redeploy del proyecto',
          ],
          links: {
            openai: 'https://platform.openai.com/api-keys',
            anthropic: 'https://console.anthropic.com/',
            gemini: 'https://makersuite.google.com/app/apikey',
          },
        },
  });
}

