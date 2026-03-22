import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main/index.ts'),
      formats: ['cjs'],
      fileName: () => 'index.js',
    },
    outDir: 'dist/main',
    emptyDirOnBuild: true,
    rollupOptions: {
      external: ['electron', 'path', 'fs', 'fs/promises', 'os', 'child_process', 'url', 'http', 'https', 'net', 'node-pty', 'chokidar', 'electron-store'],
    },
    minify: false,
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
});
