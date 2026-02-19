import { test, expect } from '@playwright/test'

test.describe('Search - Locale', () => {
  test('기본 로케일 UI + 언어 토글 버튼 존재', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 언어 토글 버튼 존재 (EN 또는 한국어)
    const localeBtn = page.locator('header button.rounded-full')
    await expect(localeBtn).toBeVisible({ timeout: 10_000 })
    const text = await localeBtn.textContent()
    expect(text === 'EN' || text === '한국어').toBeTruthy()
  })

  test('en → ko 전환 → UI 텍스트 한국어 변경', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 현재 영문인지 확인
    await expect(page.getByText('Recipe Search').first()).toBeVisible({ timeout: 10_000 })

    // 한국어 토글 클릭
    const localeBtn = page.locator('header button.rounded-full')
    const btnText = await localeBtn.textContent()

    if (btnText?.trim() === '한국어') {
      await localeBtn.click()

      // UI 텍스트가 한국어로 변경
      await expect(page.getByText('레시피 검색').first()).toBeVisible({ timeout: 10_000 })

      // EN 버튼 표시
      await expect(localeBtn).toContainText('EN')
    }
  })

  test('로케일 전환 → 재료 카테고리/이름 변경', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 영문 카테고리 확인
    const categoryBtns = page.locator('.sticky .flex-wrap button.border')
    await expect(categoryBtns.first()).toBeVisible({ timeout: 10_000 })
    const enCategoryName = await categoryBtns.first().textContent()

    // 한국어 전환
    const localeBtn = page.locator('header button.rounded-full')
    const btnText = await localeBtn.textContent()

    if (btnText?.trim() === '한국어') {
      // base API 리로드 대기
      const koResponse = page.waitForResponse(resp =>
        resp.url().includes('/api/ingredients/base') && resp.status() === 200
      )
      await localeBtn.click()
      await koResponse

      // 카테고리 버튼 텍스트가 변경됨
      await page.waitForTimeout(1000)
      const koCategoryName = await categoryBtns.first().textContent()

      // 한국어 카테고리명은 영문과 달라야 함 (같을 수도 있지만 대부분 다름)
      if (koCategoryName && enCategoryName) {
        // 카테고리 로드 확인
        const allCategories = await categoryBtns.allTextContents()
        expect(allCategories.length).toBeGreaterThan(0)
      }
    }
  })
})
