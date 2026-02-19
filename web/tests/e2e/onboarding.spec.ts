import { test, expect } from './fixtures/auth'
import type { Page } from '@playwright/test'

/**
 * SSR에서 useAuth의 fetchUser가 실행되지 않아 auth middleware가 항상 redirect하는 문제를 우회.
 * 1) auth가 필요 없는 /에 먼저 방문 → 클라이언트 auth 초기화
 * 2) Vue Router를 통해 client-side navigation → middleware가 클라이언트에서 실행
 */
async function navigateToOnboarding(page: Page) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // fetchUser 완료 대기
  await page.waitForFunction(() => {
    const el = document.querySelector('#__nuxt') as any
    return el?.__vue_app__ !== undefined
  }, { timeout: 10_000 })
  await page.waitForTimeout(2000)

  // Vue Router client-side navigation
  await page.evaluate(() => {
    const el = document.querySelector('#__nuxt') as any
    const router = el?.__vue_app__?.config?.globalProperties?.$router
    if (router) router.push('/onboarding')
  })

  await page.waitForURL('**/onboarding', { timeout: 15_000 })
}

test.describe('Onboarding', () => {
  test('전체 4단계 완료 → / 이동', async ({ onboardingUser: { page } }) => {
    await navigateToOnboarding(page)

    // Step 1: 닉네임 입력 (Swiper 렌더링 대기)
    const nicknameInput = page.locator('input[type="text"][maxlength="30"]')
    await expect(nicknameInput).toBeVisible({ timeout: 15_000 })
    await nicknameInput.fill('TestChef42')

    // Step 1의 Next 버튼 (active slide 내)
    const step1Next = page.locator('.swiper-slide-active button', { hasText: 'Next' })
    await expect(step1Next).toBeEnabled({ timeout: 5_000 })
    await step1Next.click()

    // Step 2: 좋아하는 요리 선택
    await expect(page.getByText('What are your favorite foods?')).toBeVisible({ timeout: 10_000 })
    await page.locator('.swiper-slide-active button', { hasText: 'Pizza' }).click()
    await page.locator('.swiper-slide-active button', { hasText: 'Pasta' }).click()

    // Step 2의 Next 버튼
    await page.locator('.swiper-slide-active button', { hasText: 'Next' }).click()

    // Step 3: 싫어하는 재료
    await expect(page.getByText("Any ingredients you'd like to avoid?")).toBeVisible({ timeout: 10_000 })
    await page.locator('.swiper-slide-active button', { hasText: 'Cilantro' }).click()

    // Step 3의 Next 버튼
    await page.locator('.swiper-slide-active button', { hasText: 'Next' }).click()

    // Step 4: 내 재료 설정
    await expect(page.getByText("What's in your kitchen?")).toBeVisible({ timeout: 10_000 })

    // Get Started 클릭
    await page.locator('.swiper-slide-active button', { hasText: 'Get Started' }).click()

    // / 로 이동
    await page.waitForURL('/', { timeout: 15_000 })
  })

  test('닉네임 랜덤 생성 (주사위 버튼)', async ({ onboardingUser: { page } }) => {
    await navigateToOnboarding(page)

    const nicknameInput = page.locator('input[type="text"][maxlength="30"]')
    await expect(nicknameInput).toBeVisible({ timeout: 15_000 })

    // 닉네임이 빈 상태
    await expect(nicknameInput).toHaveValue('')

    // 주사위 버튼 클릭 (닉네임 입력 옆의 w-12 h-12 버튼)
    const diceButton = page.locator('.swiper-slide-active .w-12.h-12')
    await diceButton.click()

    // 롤링 애니메이션 대기
    await page.waitForTimeout(2500)

    // 닉네임이 채워짐
    const value = await nicknameInput.inputValue()
    expect(value.length).toBeGreaterThanOrEqual(2)
  })

  test('닉네임 2자 미만 → Next 버튼 disabled', async ({ onboardingUser: { page } }) => {
    await navigateToOnboarding(page)

    const nicknameInput = page.locator('input[type="text"][maxlength="30"]')
    await expect(nicknameInput).toBeVisible({ timeout: 15_000 })

    // 1자 입력
    await nicknameInput.fill('A')

    // Step 1의 Next 버튼이 disabled 상태 (cursor-not-allowed 클래스)
    const nextBtn = page.locator('.swiper-slide-active button', { hasText: 'Next' })
    await expect(nextBtn).toHaveClass(/cursor-not-allowed/)
  })

  test('Skip으로 빠른 완료 → / 이동', async ({ onboardingUser: { page } }) => {
    await navigateToOnboarding(page)

    // Step 1: 닉네임 입력 (필수)
    const nicknameInput = page.locator('input[type="text"][maxlength="30"]')
    await expect(nicknameInput).toBeVisible({ timeout: 15_000 })
    await nicknameInput.fill('SkipUser42')

    const step1Next = page.locator('.swiper-slide-active button', { hasText: 'Next' })
    await expect(step1Next).toBeEnabled({ timeout: 5_000 })
    await step1Next.click()

    // Step 2: Skip for now 클릭
    await expect(page.getByText('What are your favorite foods?')).toBeVisible({ timeout: 10_000 })
    await page.locator('button', { hasText: 'Skip for now' }).click()

    // / 로 이동
    await page.waitForURL('/', { timeout: 15_000 })
  })
})
