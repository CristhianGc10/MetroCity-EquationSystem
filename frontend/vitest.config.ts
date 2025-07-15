// @ts-check
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  // No usar plugins para evitar conflictos de versiones
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,ts,tsx}',
      'src/**/__tests__/**/*.{js,ts,tsx}'
    ],
    exclude: [
      'node_modules',
      'dist',
      'build'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/__tests__/**/*',
        'src/main.tsx'
      ]
    },
    testTimeout: 30000
  }
})