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
  // apps/web's tsconfig sets jsx: "preserve" (Next.js transforms JSX itself via
  // SWC at build time). This Vite version transforms via oxc by default, which
  // needs an explicit JSX mode regardless, so .tsx files imported by tests
  // (e.g. the document renderer) can be parsed. Test-runner only; the Next.js
  // build is untouched.
  oxc: {
    jsx: { runtime: 'automatic' },
  },
});
