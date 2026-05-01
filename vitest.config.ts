import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.ts'],
  },
  resolve: {
    alias: {
      '@components': path.resolve('./src/components'),
      '@playground': path.resolve('./src/lib/playground'),
    },
  },
});
