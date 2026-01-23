/**
 * Script para configurar OPENAI_API_KEY en Supabase Edge Function
 * 
 * Uso:
 * 1. Obtén tu Access Token de Supabase:
 *    - Ve a https://supabase.com/dashboard/account/tokens
 *    - Crea un nuevo token
 * 
 * 2. Ejecuta este script:
 *    SUPABASE_ACCESS_TOKEN=tu_token node config-secret.js
 * 
 * O configura las variables de entorno:
 *    export SUPABASE_ACCESS_TOKEN=tu_token
 *    export OPENAI_API_KEY=tu_openai_key
 *    node config-secret.js
 */

const SUPABASE_PROJECT_ID = "eqxbipotluwtboktksed";
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.argv[2];

if (!SUPABASE_ACCESS_TOKEN) {
  console.error("❌ Error: SUPABASE_ACCESS_TOKEN no está configurado");
  console.log("\nPara obtener tu token:");
  console.log("1. Ve a https://supabase.com/dashboard/account/tokens");
  console.log("2. Crea un nuevo Access Token");
  console.log("3. Ejecuta: SUPABASE_ACCESS_TOKEN=tu_token OPENAI_API_KEY=tu_key node config-secret.js");
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error("❌ Error: OPENAI_API_KEY no está configurado");
  console.log("\nPuedes pasarlo como argumento:");
  console.log("  node config-secret.js tu_openai_api_key");
  console.log("\nO como variable de entorno:");
  console.log("  OPENAI_API_KEY=tu_key node config-secret.js");
  process.exit(1);
}

async function setSecret() {
  try {
    console.log("🔧 Configurando OPENAI_API_KEY en Supabase...");
    
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/secrets`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "OPENAI_API_KEY",
          value: OPENAI_API_KEY,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error:", response.status, errorText);
      
      if (response.status === 401) {
        console.log("\n💡 Tu Access Token puede ser inválido o haber expirado.");
        console.log("   Ve a https://supabase.com/dashboard/account/tokens para crear uno nuevo.");
      } else if (response.status === 404) {
        console.log("\n💡 El proyecto puede no existir o no tener acceso.");
        console.log("   Verifica que el project_id sea correcto.");
      }
      process.exit(1);
    }

    const result = await response.json();
    console.log("✅ Secret configurado exitosamente!");
    console.log("\n📝 Verifica en Supabase Dashboard:");
    console.log(`   https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/settings/functions`);
    
  } catch (error) {
    console.error("❌ Error al configurar el secret:", error.message);
    process.exit(1);
  }
}

setSecret();

