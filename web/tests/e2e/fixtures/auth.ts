import { test as base, type Page } from '@playwright/test'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import { createTestToken } from '../helpers/jwt'

const require = createRequire(import.meta.url)
const __dirname = resolve(fileURLToPath(import.meta.url), '..')
const TEST_DB = resolve(__dirname, '..', '..', '..', '..', 'database', 'ihavenomenu.test.db')

interface AuthFixtures {
  authenticatedPage: Page
  onboardingUser: { page: Page; email: string }
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    const Database = require('better-sqlite3')
    const bcrypt = require('bcrypt')
    const db = new Database(TEST_DB)

    const email = `e2e-done-${Date.now()}@test.com`
    const hash = await bcrypt.hash('test1234', 10)

    db.prepare(`
      INSERT INTO users (provider, provider_id, email, password_hash, nickname, onboarding_completed)
      VALUES ('email', ?, ?, ?, 'TestUser', 1)
    `).run(email, email, hash)

    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number }
    db.close()

    const token = createTestToken(user.id)
    const context = await browser.newContext()
    await context.addCookies([{
      name: 'ihavenomenu_token',
      value: token,
      domain: 'localhost',
      path: '/',
    }])
    const page = await context.newPage()
    await use(page)
    await context.close()
  },

  onboardingUser: async ({ browser }, use) => {
    const Database = require('better-sqlite3')
    const bcrypt = require('bcrypt')
    const db = new Database(TEST_DB)

    const email = `e2e-new-${Date.now()}@test.com`
    const hash = await bcrypt.hash('test1234', 10)

    db.prepare(`
      INSERT INTO users (provider, provider_id, email, password_hash, onboarding_completed)
      VALUES ('email', ?, ?, ?, 0)
    `).run(email, email, hash)

    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number }
    db.close()

    const token = createTestToken(user.id)
    const context = await browser.newContext()
    await context.addCookies([{
      name: 'ihavenomenu_token',
      value: token,
      domain: 'localhost',
      path: '/',
    }])
    const page = await context.newPage()
    await use({ page, email })
    await context.close()
  },
})

export { expect } from '@playwright/test'
