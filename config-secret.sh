#!/bin/bash

# Script para configurar OPENAI_API_KEY en Supabase Edge Function
# 
# Uso:
#   chmod +x config-secret.sh
#   ./config-secret.sh tu_openai_api_key

SUPABASE_PROJECT_ID="eqxbipotluwtboktksed"
OPENAI_API_KEY="${1:-$OPENAI_API_KEY}"

if [ -z "$OPENAI_API_KEY" ]; then
  echo "❌ Error: OPENAI_API_KEY no proporcionado"
  echo ""
  echo "Uso:"
  echo "  ./config-secret.sh tu_openai_api_key"
  echo ""
  echo "O configura la variable de entorno:"
  echo "  export OPENAI_API_KEY=tu_openai_api_key"
  echo "  ./config-secret.sh"
  exit 1
fi

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "❌ Error: SUPABASE_ACCESS_TOKEN no está configurado"
  echo ""
  echo "Para obtener tu token:"
  echo "1. Ve a https://supabase.com/dashboard/account/tokens"
  echo "2. Crea un nuevo Access Token"
  echo "3. Ejecuta: export SUPABASE_ACCESS_TOKEN=tu_token"
  echo "4. Luego ejecuta este script de nuevo"
  exit 1
fi

echo "🔧 Configurando OPENAI_API_KEY en Supabase..."

response=$(curl -s -w "\n%{http_code}" -X POST \
  "https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/secrets" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"OPENAI_API_KEY\",\"value\":\"${OPENAI_API_KEY}\"}")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
  echo "✅ Secret configurado exitosamente!"
  echo ""
  echo "📝 Verifica en Supabase Dashboard:"
  echo "   https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/settings/functions"
else
  echo "❌ Error: HTTP $http_code"
  echo "$body"
  
  if [ "$http_code" -eq 401 ]; then
    echo ""
    echo "💡 Tu Access Token puede ser inválido o haber expirado."
    echo "   Ve a https://supabase.com/dashboard/account/tokens para crear uno nuevo."
  elif [ "$http_code" -eq 404 ]; then
    echo ""
    echo "💡 El proyecto puede no existir o no tener acceso."
    echo "   Verifica que el project_id sea correcto."
  fi
  exit 1
fi

