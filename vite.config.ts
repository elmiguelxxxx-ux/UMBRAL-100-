import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

// En desarrollo, Vite monta el MISMO router de /api/* que usa server.js en producción.
// Así `npm run dev` expone los 7 endpoints (antes solo 4, copiados a mano).
function apiMiddlewarePlugin(env: Record<string, string>) {
  return {
    name: 'api-middleware',
    async configureServer(server: any) {
      // Vite no vuelca .env a process.env; los manejadores leen GEMINI_API_KEY de ahí.
      for (const key of ['GEMINI_API_KEY', 'VITE_GEMINI_API_KEY']) {
        if (env[key] && !process.env[key]) process.env[key] = env[key];
      }
      // @ts-ignore - módulo JS compartido con server.js
      const { createApiRouter } = await import('./api/routes.js');
      server.middlewares.use('/api', createApiRouter());
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss(), apiMiddlewarePlugin(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
