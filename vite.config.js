import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 5173, strictPort: true, host: true },
  preview: { port: 4173, strictPort: true, host: true },
  build: { outDir: 'dist', sourcemap: true, target: 'es2022' },
});
