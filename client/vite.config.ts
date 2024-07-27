import react from '@vitejs/plugin-react';
import autoprefixer from 'autoprefixer';
import { defineConfig } from 'vite';
import { checker } from 'vite-plugin-checker';

export default defineConfig({
  plugins: [
    react(),
    checker({
      typescript: {
        buildMode: true,
        root: '..',
        tsconfigPath: 'client/tsconfig.json',
      },
    }),
  ],
  build: {
    outDir: '../build/client',
    emptyOutDir: true,
  },
  envDir: '..',
  server: {
    proxy: {
      '/api': {
        target: 'ws://localhost:5000',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  css: {
    postcss: {
      plugins: [autoprefixer()],
    },
  },
});
