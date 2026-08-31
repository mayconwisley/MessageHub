import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'),
) as { version: string };

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@emotion/react', '@emotion/styled', '@mui/icons-material', '@mui/material'],
          'react-query': ['@tanstack/react-query'],
          'react-hook-form': ['react-hook-form', '@hookform/resolvers', 'zod'],
          charts: ['@mui/x-charts'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    clearMocks: true,
    coverage: {
      include: [
        'src/lib/presentation.ts',
        'src/services/http-client.ts',
        'src/services/auth-storage.ts',
        'src/modules/templates/template-*.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 75,
        lines: 80,
      },
    },
  },
});
