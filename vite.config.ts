import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Plugin para excluir archivos de API del procesamiento de Vite
const excludeApiPlugin = () => ({
  name: 'exclude-api',
  resolveId(id: string) {
    // Si el ID contiene 'api/' o es un módulo de servidor, excluirlo
    if (id.includes('/api/') || id.includes('\\api\\') || id === 'googleapis' || id === '@vercel/node') {
      return { id, external: true };
    }
    return null;
  },
  load(id: string) {
    // Si es un archivo de la carpeta api, retornar vacío
    if (id.includes('/api/') || id.includes('\\api\\')) {
      return 'export {}';
    }
    return null;
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
  },
  plugins: [
    excludeApiPlugin(),
    react()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Excluir archivos de API de Vercel del procesamiento de Vite
  optimizeDeps: {
    exclude: ['googleapis', '@vercel/node'],
  },
  // Configurar para ignorar archivos de API durante el desarrollo
  publicDir: 'public',
  build: {
    rollupOptions: {
      external: (id) => {
        // Excluir archivos de la carpeta api
        if (id.includes('/api/') || id.includes('\\api\\') || id.startsWith('./api/') || id.startsWith('../api/') || id.includes('api/news')) {
          return true;
        }
        // Excluir módulos de servidor
        if (id === 'googleapis' || id === '@vercel/node') {
          return true;
        }
        return false;
      },
    },
  },
}));
