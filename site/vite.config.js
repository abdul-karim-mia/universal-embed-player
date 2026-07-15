import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
