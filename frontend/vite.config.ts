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
        ws: true
      },
      '/uploads': {
        target: 'http://127.0.0.1:4001',
        changeOrigin: true
      }
    }
  }
});
