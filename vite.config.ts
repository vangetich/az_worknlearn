import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  return {
    plugins: [
      {
        name: 'disable-vite-hmr-client',
        apply: 'serve' as const,
        transform(code: string, id: string) {
          if (id.includes('@vite/client') || id.includes('client/client.mjs')) {
            return code.replace(
              'const createWebSocketModuleRunnerTransport = (options) => {',
              'const createWebSocketModuleRunnerTransport = () => ({ async connect() {}, send() {}, async disconnect() {} }); const _unused_ws = (options) => {'
            );
          }
        },
      },
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 3000,
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true as const,
      cors: true,
      // HMR is disabled in AI Studio cloud environment
      hmr: false,
      ws: false as const,
      watch: null,
    },
  };
});
