import { test, expect } from '@playwright/test'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const __dirname = resolve(fileURLToPath(import.meta.url), '..')

test.describe('Auth', () => {
  const uniqueEmail = () => `e2e-auth-${Date.now()}@test.com`
  const validPassword = 'test1234'

  test('이메일 가입 → onboarding 리다이렉트', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Sign Up 탭 클릭
    const signUpTab = page.locator('.border-b button').filter({ hasText: 'Sign Up' })
    await signUpTab.click()

    // 탭이 전환될 때까지 대기 (submit 버튼 텍스트 변경)
    await expect(page.locator('button[type="submit"]')).toContainText('Sign Up', { timeout: 5_000 })

    // 폼 입력
    await page.locator('input[type="email"]').fill(uniqueEmail())
    await page.locator('input[type="password"]').fill(validPassword)

    // submit 버튼 활성화 대기 후 클릭
    await expect(page.locator('button[type="submit"]')).toBeEnabled({ timeout: 5_000 })
    await page.locator('button[type="submit"]').click()

    // 가입 후 /login을 벗어남 (SSR auth 제약으로 /onboarding 또는 /에 도착할 수 있음)
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15_000 })
    const finalUrl = new URL(page.url())
    expect(
      finalUrl.pathname === '/onboarding' || finalUrl.pathname === '/'
    ).toBeTruthy()
  })

  test('중복 이메일 가입 → 에러 메시지', async ({ page }) => {
    const email = uniqueEmail()

    // 첫 번째 가입 (DB 직접 생성으로 쿠키 오염 방지)
    const Database = require('better-sqlite3')
    const bcrypt = require('bcrypt')
    const testDb = resolve(__dirname, '..', '..', '..', 'database', 'ihavenomenu.test.db')
    const db = new Database(testDb)
    const hash = await bcrypt.hash(validPassword, 10)
    db.prepare(`
      INSERT INTO users (provider, provider_id, email, password_hash, onboarding_completed)
      VALUES ('email', ?, ?, ?, 0)
    `).run(email, email, hash)
    db.close()

    // 두 번째 가입 시도 (UI)
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    const signUpTab = page.locator('.border-b button').filter({ hasText: 'Sign Up' })
    await signUpTab.click()
    await expect(page.locator('button[type="submit"]')).toContainText('Sign Up', { timeout: 5_000 })

    await page.locator('input[type="email"]').fill(email)
    await page.locator('input[type="password"]').fill(validPassword)
    await expect(page.locator('button[type="submit"]')).toBeEnabled({ timeout: 5_000 })
    await page.locator('button[type="submit"]').click()

    // 에러 메시지 표시
    await expect(page.locator('.text-red-600')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('.text-red-600')).toContainText('Email already registered')
  })

  test('로그인 → / 이동 (온보딩 완료 유저)', async ({ page }) => {
    const email = uniqueEmail()

    // 유저 생성 + 온보딩 완료 (DB 직접)
    const Database = require('better-sqlite3')
    const bcrypt = require('bcrypt')
    const testDb = resolve(__dirname, '..', '..', '..', 'database', 'ihavenomenu.test.db')
    const db = new Database(testDb)
    const hash = await bcrypt.hash(validPassword, 10)
    db.prepare(`
      INSERT INTO users (provider, provider_id, email, password_hash, nickname, onboarding_completed)
      VALUES ('email', ?, ?, ?, 'AuthTest', 1)
    `).run(email, email, hash)
    db.close()

    // 로그인
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await page.locator('input[type="email"]').fill(email)
    await page.locator('input[type="password"]').fill(validPassword)
    await expect(page.locator('button[type="submit"]')).toBeEnabled({ timeout: 5_000 })
    await page.locator('button[type="submit"]').click()

    // / 로 이동
    await page.waitForURL('/', { timeout: 15_000 })
  })

  test('잘못된 비밀번호 → 에러 메시지', async ({ page }) => {
    const email = uniqueEmail()

    // 유저 생성 (DB 직접 — page.request.post는 쿠키가 오염됨)
    const Database = require('better-sqlite3')
    const bcrypt = require('bcrypt')
    const testDb = resolve(__dirname, '..', '..', '..', 'database', 'ihavenomenu.test.db')
    const db = new Database(testDb)
    const hash = await bcrypt.hash(validPassword, 10)
    db.prepare(`
      INSERT INTO users (provider, provider_id, email, password_hash, onboarding_completed)
      VALUES ('email', ?, ?, ?, 0)
    `).run(email, email, hash)
    db.close()

    // 잘못된 비밀번호로 로그인 시도
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await page.locator('input[type="email"]').fill(email)
    await page.locator('input[type="password"]').fill('wrongpass1')
    await expect(page.locator('button[type="submit"]')).toBeEnabled({ timeout: 5_000 })
    await page.locator('button[type="submit"]').click()

    // 에러 메시지
    await expect(page.locator('.text-red-600')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('.text-red-600')).toContainText('Invalid email or password')
  })
})
