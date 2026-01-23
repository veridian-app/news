#!/bin/bash

# Script de verificación pre-deploy para Vercel
# Este script verifica que todo esté listo antes de desplegar

echo "🔍 Verificando proyecto para deploy en Vercel..."
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# 1. Verificar que node_modules existe
echo "1. Verificando dependencias..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules no encontrado. Ejecutando npm install...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error instalando dependencias${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${GREEN}✅ Dependencias instaladas${NC}"
fi

# 2. Verificar que vercel.json existe
echo ""
echo "2. Verificando configuración de Vercel..."
if [ ! -f "vercel.json" ]; then
    echo -e "${RED}❌ vercel.json no encontrado${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ vercel.json encontrado${NC}"
fi

# 3. Verificar que el proyecto compila
echo ""
echo "3. Verificando que el proyecto compila..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al compilar el proyecto${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ Proyecto compila correctamente${NC}"
fi

# 4. Verificar que dist/ existe después del build
echo ""
echo "4. Verificando carpeta dist/..."
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Carpeta dist/ no encontrada después del build${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ Carpeta dist/ creada correctamente${NC}"
fi

# 5. Verificar que .env no está en git (debería estar en .gitignore)
echo ""
echo "5. Verificando que .env está en .gitignore..."
if git check-ignore .env > /dev/null 2>&1; then
    echo -e "${GREEN}✅ .env está correctamente ignorado por git${NC}"
else
    if [ -f ".env" ]; then
        echo -e "${YELLOW}⚠️  .env existe pero no está en .gitignore. Esto es peligroso.${NC}"
    else
        echo -e "${GREEN}✅ .env no existe (esto está bien)${NC}"
    fi
fi

# 6. Verificar variables de entorno necesarias
echo ""
echo "6. Verificando variables de entorno..."
echo -e "${YELLOW}⚠️  Recuerda configurar estas variables en Vercel:${NC}"
echo "   - VITE_SUPABASE_URL"
echo "   - VITE_SUPABASE_PUBLISHABLE_KEY"
echo ""
echo "   Puedes encontrarlas en:"
echo "   - Supabase Dashboard → Settings → API"

# 7. Verificar que git está configurado
echo ""
echo "7. Verificando configuración de Git..."
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Repositorio Git inicializado${NC}"
    
    # Verificar si hay un remoto configurado
    if git remote -v | grep -q "origin"; then
        echo -e "${GREEN}✅ Repositorio remoto (origin) configurado${NC}"
    else
        echo -e "${YELLOW}⚠️  No hay repositorio remoto configurado${NC}"
        echo "   Necesitas conectar con GitHub antes de desplegar en Vercel"
    fi
else
    echo -e "${YELLOW}⚠️  Repositorio Git no inicializado${NC}"
    echo "   Ejecuta: git init"
fi

# Resumen final
echo ""
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ ¡Todo listo para desplegar!${NC}"
    echo ""
    echo "Siguiente paso:"
    echo "1. Sube tu código a GitHub:"
    echo "   git add ."
    echo "   git commit -m 'Preparar para deploy'"
    echo "   git push origin main"
    echo ""
    echo "2. Ve a vercel.com e importa tu repositorio"
    echo "3. Configura las variables de entorno en Vercel"
    echo ""
    echo "📖 Lee GUIA_DEPLOY_VERCEL.md para instrucciones detalladas"
    exit 0
else
    echo -e "${RED}❌ Se encontraron $ERRORS error(es)${NC}"
    echo "Por favor, corrige los errores antes de desplegar"
    exit 1
fi

