import { defineConfig } from '@playwright/test'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = resolve(fileURLToPath(import.meta.url), '..')
const testDbPath = resolve(__dirname, '..', 'database', 'ihavenomenu.test.db')
const TEST_PORT = 8032

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1, // SQLite 단일 파일 DB → 직렬 실행
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: `http://localhost:${TEST_PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  globalSetup: './tests/e2e/helpers/db-setup.ts',

  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],

  webServer: {
    command: `npx nuxt dev --port ${TEST_PORT}`,
    port: TEST_PORT,
    timeout: 60_000,
    reuseExistingServer: !process.env.CI,
    env: {
      DB_PATH: testDbPath,
      JWT_SECRET: 'test-jwt-secret-e2e',
      NUXT_RATE_LIMIT_MULTIPLIER: '100',
    },
  },
})
