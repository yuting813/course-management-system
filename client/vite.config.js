import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // To polyfill `Buffer` and `Stream` for Joi
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'build', // Critical for backend compatibility
  },
});
