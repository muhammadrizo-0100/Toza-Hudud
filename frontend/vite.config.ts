import { defineConfig, createLogger } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const logger = createLogger();
const originalLoggerError = logger.error.bind(logger);
logger.error = (msg, options) => {
  const str = String(msg || '');
  if (
    str.includes('ECONNABORTED') ||
    str.includes('ECONNRESET') ||
    str.includes('ws proxy error') ||
    str.includes('ws proxy socket error') ||
    str.includes('writeGeneric')
  ) {
    return;
  }
  originalLoggerError(msg, options);
};

export default defineConfig({
  customLogger: logger,
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
        changeOrigin: true,
        configure: (proxy) => {
          const isBenign = (err: any) => {
            const str = String(err?.code || '') + ' ' + String(err?.message || '');
            return ['ECONNABORTED', 'ECONNRESET', 'EPIPE', 'ETIMEDOUT'].some((code) => str.includes(code));
          };
          proxy.on('error', (err: any) => {
            if (isBenign(err)) return;
            console.warn('[vite] ws proxy notice:', err?.message || err);
          });
          proxy.on('proxyReqWs', (_proxyReq, _req, socket: any) => {
            socket.on('error', (err: any) => {
              if (isBenign(err)) return;
              console.warn('[vite] ws socket notice:', err?.message || err);
            });
          });
          proxy.on('open', (proxySocket: any) => {
            proxySocket.on('error', (err: any) => {
              if (isBenign(err)) return;
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
