import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/stellarVax/' : '/',
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/v1': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
