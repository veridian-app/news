#!/bin/bash

# Script para configurar variables de entorno en Vercel automáticamente

echo "🚀 Configurando variables de entorno en Vercel..."
echo ""

# Verificar si está autenticado
if ! npx vercel whoami &>/dev/null; then
    echo "⚠️  No estás autenticado en Vercel CLI"
    echo "📝 Autenticándote ahora..."
    echo ""
    npx vercel login
    echo ""
fi

# Leer el Service Account JSON
SERVICE_ACCOUNT_PATH="../../Downloads/veridian-478902-82755c7563aa.json"

if [ ! -f "$SERVICE_ACCOUNT_PATH" ]; then
    echo "❌ No se encontró el archivo Service Account en: $SERVICE_ACCOUNT_PATH"
    exit 1
fi

# Convertir JSON a una sola línea
SERVICE_ACCOUNT_JSON=$(cat "$SERVICE_ACCOUNT_PATH" | jq -c . 2>/dev/null || cat "$SERVICE_ACCOUNT_PATH" | tr -d '\n' | sed 's/ //g')

if [ -z "$SERVICE_ACCOUNT_JSON" ]; then
    echo "❌ Error al leer el Service Account JSON"
    exit 1
fi

echo "✅ Service Account JSON cargado"
echo ""

# Pedir GOOGLE_SHEET_ID si no se proporciona como argumento
if [ -z "$1" ]; then
    echo "📋 Necesito el ID de tu Google Sheet"
    echo "   Para obtenerlo:"
    echo "   1. Abre tu Google Sheet"
    echo "   2. Mira la URL: https://docs.google.com/spreadsheets/d/[AQUI_ESTA_EL_ID]/edit"
    echo "   3. Copia la parte entre /d/ y /edit"
    echo ""
    read -p "🔑 Pega el GOOGLE_SHEET_ID aquí: " GOOGLE_SHEET_ID
else
    GOOGLE_SHEET_ID="$1"
fi

if [ -z "$GOOGLE_SHEET_ID" ]; then
    echo "❌ No proporcionaste el GOOGLE_SHEET_ID"
    exit 1
fi

echo ""
echo "📝 Configurando GOOGLE_SERVICE_ACCOUNT..."
echo "$SERVICE_ACCOUNT_JSON" | npx vercel env add GOOGLE_SERVICE_ACCOUNT production preview development

if [ $? -eq 0 ]; then
    echo "✅ GOOGLE_SERVICE_ACCOUNT configurado"
else
    echo "⚠️  Hubo un problema al configurar GOOGLE_SERVICE_ACCOUNT"
fi

echo ""
echo "📝 Configurando GOOGLE_SHEET_ID..."
echo "$GOOGLE_SHEET_ID" | npx vercel env add GOOGLE_SHEET_ID production preview development

if [ $? -eq 0 ]; then
    echo "✅ GOOGLE_SHEET_ID configurado"
else
    echo "⚠️  Hubo un problema al configurar GOOGLE_SHEET_ID"
fi

echo ""
echo "✅ ¡Configuración completada!"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Ve a Vercel Dashboard > Deployments"
echo "   2. Haz clic en los 3 puntos (⋯) del último deployment"
echo "   3. Selecciona 'Redeploy'"
echo "   4. Espera 2-3 minutos"
echo ""

