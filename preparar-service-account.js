// Script para preparar el Service Account JSON para Vercel
// Ejecuta: node preparar-service-account.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta al archivo JSON del service account
const serviceAccountPath = path.join(__dirname, '../Downloads/veridian-478902-82755c7563aa.json');

try {
  // Leer el archivo JSON
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  
  // Convertir a string JSON (una línea)
  const jsonString = JSON.stringify(serviceAccount);
  
  console.log('✅ Service Account JSON preparado para Vercel:\n');
  console.log('='.repeat(80));
  console.log('Variable: GOOGLE_SERVICE_ACCOUNT');
  console.log('='.repeat(80));
  console.log(jsonString);
  console.log('='.repeat(80));
  console.log('\n📋 Instrucciones:');
  console.log('1. Copia el JSON de arriba (todo el texto entre los ===)');
  console.log('2. Ve a Vercel Dashboard → Settings → Environment Variables');
  console.log('3. Añade nueva variable:');
  console.log('   - Key: GOOGLE_SERVICE_ACCOUNT');
  console.log('   - Value: [Pega el JSON completo aquí]');
  console.log('   - Environments: ✅ Production, ✅ Preview, ✅ Development');
  console.log('4. Guarda y haz redeploy\n');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\n💡 Alternativa:');
  console.log('1. Abre el archivo veridian-478902-82755c7563aa.json');
  console.log('2. Copia TODO el contenido');
  console.log('3. Pégalo en Vercel como variable GOOGLE_SERVICE_ACCOUNT');
}

