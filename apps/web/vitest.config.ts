import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  // tsconfig uses "jsx": "preserve" (Next compiles JSX itself); tests that
  // import .tsx components need vite to transform JSX.
  oxc: {
    jsx: { runtime: 'automatic' },
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', '.next'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
