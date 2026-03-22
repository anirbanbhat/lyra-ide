import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/renderer/**/*.test.ts'],
    setupFiles: ['src/renderer/__tests__/setup.ts'],
  },
});
