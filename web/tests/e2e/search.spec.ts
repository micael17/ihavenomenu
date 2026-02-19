import { test, expect } from '@playwright/test'
import { test as authTest, expect as authExpect } from './fixtures/auth'

// --- 비로그인 검색 테스트 ---

test.describe('Search - Guest', () => {
  test('빈 상태에서 🥕 이모지 표시', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 🥕 이모지가 포함된 텍스트 확인
    await expect(page.locator('text=Select ingredients on the left').first()).toBeVisible({ timeout: 10_000 })
    // 🥕 이모지는 5xl 텍스트로 렌더링됨
    await expect(page.locator('.text-5xl').first()).toBeVisible()
  })

  test('카테고리 클릭 → 하위 재료 목록 표시', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // "Please select a category" 텍스트 확인
    await expect(page.getByText('Please select a category')).toBeVisible({ timeout: 10_000 })

    // "Category" 라벨 아래의 카테고리 버튼 클릭
    // IngredientSelector에서 카테고리 버튼은 border 클래스를 가짐
    const categoryBtns = page.locator('.sticky .flex-wrap button.border')
    await expect(categoryBtns.first()).toBeVisible({ timeout: 10_000 })

    await categoryBtns.first().click()

    // "Please select a category"가 사라지고 재료 목록이 나타남
    await expect(page.getByText('Please select a category')).toBeHidden({ timeout: 5_000 })

    // 카테고리 하위 재료 버튼들이 보임
    const ingredientArea = page.locator('.max-h-96 .flex-wrap')
    await expect(ingredientArea).toBeVisible()
  })

  test('재료 선택 → 자동 검색 후 결과 표시', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 카테고리 클릭
    const categoryBtns = page.locator('.sticky .flex-wrap button.border')
    await expect(categoryBtns.first()).toBeVisible({ timeout: 10_000 })
    await categoryBtns.first().click()

    // 하위 재료 중 첫 번째 클릭
    const ingredientBtns = page.locator('.max-h-96 .flex-wrap button')
    await expect(ingredientBtns.first()).toBeVisible({ timeout: 5_000 })
    await ingredientBtns.first().click()

    // 검색 API 호출 대기 (300ms debounce + API)
    const searchResponse = page.waitForResponse(resp =>
      resp.url().includes('/api/dishes/search') && resp.status() === 200
    )
    await searchResponse

    // 결과 그리드 또는 "No dishes found"
    const hasResults = await page.locator('.grid.grid-cols-2').isVisible().catch(() => false)
    const noResults = await page.getByText('No dishes found').isVisible().catch(() => false)
    const noDishes = await page.getByText('No recipes found').isVisible().catch(() => false)
    expect(hasResults || noResults || noDishes).toBeTruthy()
  })

  test('요리 스타일 토글 → 검색 결과 갱신', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 카테고리 + 재료 선택
    const categoryBtns = page.locator('.sticky .flex-wrap button.border')
    await expect(categoryBtns.first()).toBeVisible({ timeout: 10_000 })
    await categoryBtns.first().click()

    const ingredientBtns = page.locator('.max-h-96 .flex-wrap button')
    await expect(ingredientBtns.first()).toBeVisible({ timeout: 5_000 })
    await ingredientBtns.first().click()

    // 첫 검색 완료 대기
    await page.waitForResponse(resp =>
      resp.url().includes('/api/dishes/search') && resp.status() === 200
    )

    // Korean First 버튼 클릭 → 새로운 검색 발생
    const koreanBtn = page.locator('button', { hasText: 'Korean First' })
    const secondSearch = page.waitForResponse(resp =>
      resp.url().includes('/api/dishes/search') && resp.status() === 200
    )
    await koreanBtn.click()
    await secondSearch
  })

  test('요리 카드 클릭 → 상세 페이지 이동', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 카테고리 + 재료 선택
    const categoryBtns = page.locator('.sticky .flex-wrap button.border')
    await expect(categoryBtns.first()).toBeVisible({ timeout: 10_000 })
    await categoryBtns.first().click()

    const ingredientBtns = page.locator('.max-h-96 .flex-wrap button')
    await expect(ingredientBtns.first()).toBeVisible({ timeout: 5_000 })
    await ingredientBtns.first().click()

    await page.waitForResponse(resp =>
      resp.url().includes('/api/dishes/search') && resp.status() === 200
    )

    // 결과 그리드가 있으면 첫 카드 클릭
    const grid = page.locator('.grid.grid-cols-2')
    if (await grid.isVisible().catch(() => false)) {
      const firstCard = grid.locator('button').first()
      await firstCard.click()
      await page.waitForURL(/\/\d+|\/recipe\/\d+/)
    }
  })

  test('뒤로가기 → 선택 재료 상태 유지', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 카테고리 + 재료 선택
    const categoryBtns = page.locator('.sticky .flex-wrap button.border')
    await expect(categoryBtns.first()).toBeVisible({ timeout: 10_000 })
    await categoryBtns.first().click()

    const ingredientBtns = page.locator('.max-h-96 .flex-wrap button')
    await expect(ingredientBtns.first()).toBeVisible({ timeout: 5_000 })
    const firstIngName = await ingredientBtns.first().textContent()
    await ingredientBtns.first().click()

    await page.waitForResponse(resp =>
      resp.url().includes('/api/dishes/search') && resp.status() === 200
    )

    // 결과 카드가 있으면 상세로 이동 후 뒤로가기
    const grid = page.locator('.grid.grid-cols-2')
    if (await grid.isVisible().catch(() => false)) {
      await grid.locator('button').first().click()
      await page.waitForURL(/\/\d+|\/recipe\/\d+/)

      await page.goBack()
      await page.waitForURL('/')

      // 선택된 재료가 유지
      if (firstIngName) {
        await expect(page.getByText(firstIngName.trim()).first()).toBeVisible({ timeout: 5_000 })
      }
    }
  })

  test('URL 파라미터로 자동 검색 (?ingredients=)', async ({ page }) => {
    // 먼저 base API로 실제 재료명 확인
    const baseResp = await page.request.get('/api/ingredients/base')
    const baseData = await baseResp.json()
    const ingredients = baseData.ingredients || []

    if (ingredients.length >= 2) {
      const name1 = ingredients[0].name
      const name2 = ingredients[1].name

      const searchResponse = page.waitForResponse(resp =>
        resp.url().includes('/api/dishes/search') && resp.status() === 200
      )
      await page.goto(`/?ingredients=${encodeURIComponent(name1)},${encodeURIComponent(name2)}`)
      await searchResponse

      // 선택된 재료가 UI에 표시
      await expect(page.getByText(name1).first()).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText(name2).first()).toBeVisible({ timeout: 10_000 })
    }
  })
})

// --- 로그인 상태 검색 테스트 ---

authTest.describe('Search - Authenticated', () => {
  authTest('내 재료 제외/포함 토글 + 검색 반영', async ({ authenticatedPage: page }) => {
    // 유저에게 재료 추가
    const baseResp = await page.request.get('/api/ingredients/base')
    const baseData = await baseResp.json()
    const ingredients = baseData.ingredients || []

    if (ingredients.length >= 2) {
      await page.request.post('/api/user/ingredients', {
        data: { ingredientId: ingredients[0].id },
      })
      await page.request.post('/api/user/ingredients', {
        data: { ingredientId: ingredients[1].id },
      })

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // 내 재료 섹션 표시
      await authExpect(page.getByText('My Ingredients').first()).toBeVisible({ timeout: 10_000 })

      // 내 재료 버튼 (emerald 배경) 클릭 → 제외
      const myIngButtons = page.locator('.bg-emerald-600')
      if (await myIngButtons.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
        await myIngButtons.first().click()

        // line-through 스타일 적용
        await authExpect(page.locator('.line-through').first()).toBeVisible()

        // 다시 클릭 → 포함
        await page.locator('.line-through').first().click()
        await page.waitForTimeout(500)
      }
    }
  })
})
