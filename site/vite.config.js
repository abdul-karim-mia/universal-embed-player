import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@uep': path.resolve(__dirname, '../src'),
    },
  },
  build: {
    target: 'es2020',
    cssMinify: true,
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      external: ['hls.js', 'dashjs'],
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
        },
        globals: {
          'hls.js': 'Hls',
          dashjs: 'dashjs',
        },
      },
    },
  },
});
