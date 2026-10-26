import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer', // ensure the package is resolvable
    },
  },
  test: {
    setupFiles: ['tests/setup.ts'],
    env: loadEnv('', process.cwd(), ''),
    globals: true, // This provides Jest compatibility globals like expect
    coverage: {
      include: ['src/**/*'],
      exclude: ['src/**/*.stories.{js,jsx,ts,tsx}'],
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.{js,ts,tsx}'],
          exclude: ['src/hooks/**/*.test.ts'],
          environment: 'jsdom',
          setupFiles: ['tests/setup.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'ui',
          include: ['src/hooks/**/*.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: 'playwright',
            screenshotDirectory: 'vitest-test-results',
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
