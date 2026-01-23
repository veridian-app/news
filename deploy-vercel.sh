#!/bin/bash

# Script para desplegar en Vercel
# Ejecuta: ./deploy-vercel.sh

echo "🚀 Desplegando proyecto Veridian en Vercel..."
echo ""

cd "$(dirname "$0")"

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encuentra package.json"
    echo "Asegúrate de estar en el directorio del proyecto"
    exit 1
fi

# Verificar que el build funciona
echo "📦 Verificando que el proyecto compila..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error: El build falló. Corrige los errores antes de desplegar."
    exit 1
fi

echo ""
echo "✅ Build exitoso"
echo ""

# Verificar si está autenticado
echo "🔐 Verificando autenticación en Vercel..."
npx vercel whoami > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "⚠️  No estás autenticado en Vercel"
    echo ""
    echo "Para autenticarte, ejecuta:"
    echo "  npx vercel login"
    echo ""
    echo "O desplegar desde la web:"
    echo "  https://vercel.com"
    exit 1
fi

echo "✅ Autenticado en Vercel"
echo ""

# Desplegar
echo "🌐 Desplegando a Vercel..."
echo ""
echo "Cuando se te pregunte:"
echo "  - Link to existing project? → Si quieres usar 'veridian', di NO y crea uno nuevo"
echo "  - O si quieres sobrescribir, di SÍ"
echo "  - Project name: veridian-app (o el que prefieras)"
echo "  - Directory: ./"
echo "  - Override settings? → NO"
echo ""

npx vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ¡Despliegue exitoso!"
    echo ""
    echo "Tu proyecto está disponible en la URL que Vercel te proporcionó"
    echo "Puedes verlo en: https://vercel.com/dashboard"
else
    echo ""
    echo "❌ Error en el despliegue"
    echo "Revisa los mensajes de error arriba"
fi

