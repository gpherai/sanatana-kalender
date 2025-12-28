import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    clearMocks: true,
    environmentMatchGlobs: [
      ['src/app/api/**', 'node'],
      ['src/services/**', 'node'],
      ['src/server/**', 'node'],
      ['src/lib/**', 'node'],
      ['src/scripts/**', 'node'],
      ['prisma/**', 'node'],
    ],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
