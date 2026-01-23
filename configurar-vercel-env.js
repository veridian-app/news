#!/usr/bin/env node

/**
 * Script para configurar variables de entorno en Vercel automáticamente
 * 
 * Uso:
 *   node configurar-vercel-env.js [GOOGLE_SHEET_ID]
 * 
 * Si no proporcionas el GOOGLE_SHEET_ID, el script te lo pedirá.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Leer el Service Account JSON
const serviceAccountPath = join(__dirname, '../../Downloads/veridian-478902-82755c7563aa.json');
let serviceAccountJson;

try {
  const serviceAccountContent = readFileSync(serviceAccountPath, 'utf-8');
  serviceAccountJson = JSON.stringify(JSON.parse(serviceAccountContent));
  console.log('✅ Service Account JSON cargado correctamente');
} catch (error) {
  console.error('❌ Error al leer el Service Account JSON:', error.message);
  console.log('📝 Asegúrate de que el archivo existe en:', serviceAccountPath);
  process.exit(1);
}

// Obtener GOOGLE_SHEET_ID de los argumentos o pedirlo
const googleSheetId = process.argv[2] || null;

if (!googleSheetId) {
  console.log('\n⚠️  No proporcionaste el GOOGLE_SHEET_ID');
  console.log('📋 Para obtenerlo:');
  console.log('   1. Abre tu Google Sheet');
  console.log('   2. Mira la URL: https://docs.google.com/spreadsheets/d/[AQUI_ESTA_EL_ID]/edit');
  console.log('   3. Copia la parte entre /d/ y /edit\n');
  console.log('💡 Ejecuta de nuevo:');
  console.log(`   node configurar-vercel-env.js [TU_GOOGLE_SHEET_ID]\n`);
  process.exit(1);
}

console.log('\n🚀 Configurando variables de entorno en Vercel...\n');

// Función para ejecutar comandos de Vercel CLI
function ejecutarVercelComando(comando, descripcion) {
  try {
    console.log(`📝 ${descripcion}...`);
    const resultado = execSync(comando, { 
      encoding: 'utf-8',
      stdio: 'pipe',
      cwd: __dirname
    });
    console.log(`✅ ${descripcion} - Completado`);
    return resultado;
  } catch (error) {
    console.error(`❌ Error al ${descripcion.toLowerCase()}:`, error.message);
    if (error.stdout) console.log('Salida:', error.stdout);
    if (error.stderr) console.log('Error:', error.stderr);
    throw error;
  }
}

// Configurar GOOGLE_SERVICE_ACCOUNT
try {
  // Usar echo para pasar el valor al comando vercel env add
  const comando1 = `echo "${serviceAccountJson.replace(/"/g, '\\"')}" | npx vercel env add GOOGLE_SERVICE_ACCOUNT production preview development`;
  ejecutarVercelComando(comando1, 'Añadiendo GOOGLE_SERVICE_ACCOUNT');
} catch (error) {
  console.error('\n❌ No se pudo configurar GOOGLE_SERVICE_ACCOUNT automáticamente');
  console.log('\n💡 Alternativa: Configúralo manualmente en el dashboard de Vercel');
  console.log('   Key: GOOGLE_SERVICE_ACCOUNT');
  console.log(`   Value: ${serviceAccountJson.substring(0, 50)}...`);
}

// Configurar GOOGLE_SHEET_ID
try {
  const comando2 = `echo "${googleSheetId}" | npx vercel env add GOOGLE_SHEET_ID production preview development`;
  ejecutarVercelComando(comando2, 'Añadiendo GOOGLE_SHEET_ID');
} catch (error) {
  console.error('\n❌ No se pudo configurar GOOGLE_SHEET_ID automáticamente');
  console.log('\n💡 Alternativa: Configúralo manualmente en el dashboard de Vercel');
  console.log('   Key: GOOGLE_SHEET_ID');
  console.log(`   Value: ${googleSheetId}`);
}

console.log('\n✅ ¡Variables de entorno configuradas!');
console.log('\n📋 Próximos pasos:');
console.log('   1. Ve a Vercel Dashboard > Deployments');
console.log('   2. Haz clic en los 3 puntos (⋯) del último deployment');
console.log('   3. Selecciona "Redeploy"');
console.log('   4. Espera 2-3 minutos\n');

