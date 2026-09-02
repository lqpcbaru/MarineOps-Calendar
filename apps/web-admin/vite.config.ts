import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared-kernel': resolve(__dirname, '../../packages/shared-kernel/src'),
    },
  },
  server: {
    // 5173 belongs to web-public; both portals are often run side by side.
    port: 5174,
    proxy: {
      // Same-origin in dev, exactly as nginx serves it in production. This
      // is what lets the httpOnly refresh cookie (path=/api/v1/auth) be
      // sent by the browser without any CORS involvement.
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
