import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4001',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://127.0.0.1:4001',
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err: any) => {
            // Ignore benign client disconnects / tab closes / page reloads
            if (['ECONNABORTED', 'ECONNRESET', 'EPIPE', 'ETIMEDOUT'].includes(err?.code)) {
              return;
            }
            console.warn('[vite] ws proxy notice:', err?.message || err);
          });
          proxy.on('proxyReqWs', (_proxyReq, _req, socket: any) => {
            socket.on('error', (err: any) => {
              if (['ECONNABORTED', 'ECONNRESET', 'EPIPE', 'ETIMEDOUT'].includes(err?.code)) {
                return;
              }
              console.warn('[vite] ws socket notice:', err?.message || err);
            });
          });
        }
      },
      '/uploads': {
        target: 'http://127.0.0.1:4001',
        changeOrigin: true
      }
    }
  }
});
