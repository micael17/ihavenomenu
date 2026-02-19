import { test as baseTest, expect as baseExpect } from '@playwright/test'
import { test, expect } from './fixtures/auth'

baseTest.describe('My Fridge - Guest', () => {
  baseTest('비로그인 접근 → /login?redirect= 리다이렉트', async ({ page }) => {
    await page.goto('/my-fridge')

    // /login으로 리다이렉트 + redirect 파라미터
    await page.waitForURL('**/login**', { timeout: 15_000 })
    baseExpect(page.url()).toContain('/login')
    baseExpect(page.url()).toContain('redirect')
  })
})

test.describe('My Fridge - Authenticated', () => {
  test('로그인 후 접근 → 페이지 정상 로드', async ({ authenticatedPage: page }) => {
    await page.goto('/my-fridge')
    await page.waitForLoadState('networkidle')

    // 페이지 타이틀 표시
    await expect(page.getByText('My Ingredients').first()).toBeVisible({ timeout: 10_000 })

    // Add Ingredient 버튼 표시
    await expect(page.locator('button', { hasText: 'Add Ingredient' }).first()).toBeVisible()
  })

  test('재료 추가 (모달 → 선택 → 목록)', async ({ authenticatedPage: page }) => {
    await page.goto('/my-fridge')
    await page.waitForLoadState('networkidle')

    // 페이지가 완전히 로드될 때까지 대기
    await expect(page.getByText('My Ingredients').first()).toBeVisible({ timeout: 10_000 })

    // Add Ingredient 버튼 클릭
    await page.locator('button', { hasText: 'Add Ingredient' }).first().click()

    // 모달 표시 확인 (Teleport로 body에 렌더링됨)
    const modalOverlay = page.locator('.fixed.inset-0')
    await expect(modalOverlay).toBeVisible({ timeout: 5_000 })

    // 재료 목록 로드 대기 (overflow-y-auto 내의 버튼들)
    const scrollArea = page.locator('.overflow-y-auto')
    const ingredientBtns = scrollArea.locator('button:not([disabled])')
    await expect(ingredientBtns.first()).toBeVisible({ timeout: 10_000 })

    // 첫 번째 활성 재료의 이름 저장 후 클릭
    const ingName = await ingredientBtns.first().textContent()
    await ingredientBtns.first().click()

    // 재료 선택 후 "Add" 버튼 표시 확인 (selectedIngredientToAdd 템플릿)
    const addBtn = page.locator('button', { hasText: /^Add$/ })
    await expect(addBtn).toBeVisible({ timeout: 5_000 })
    await addBtn.click()

    // 모달 닫힘
    await expect(modalOverlay).toBeHidden({ timeout: 5_000 })

    // 추가된 재료가 목록에 표시
    if (ingName) {
      await expect(page.getByText(ingName.trim()).first()).toBeVisible({ timeout: 5_000 })
    }
  })

  test('재료 삭제 (hover → X 클릭 → 제거)', async ({ authenticatedPage: page }) => {
    // 먼저 재료 추가 (API)
    const baseResp = await page.request.get('/api/ingredients/base')
    const baseData = await baseResp.json()
    const ingredients = baseData.ingredients || []

    if (ingredients.length > 0) {
      await page.request.post('/api/user/ingredients', {
        data: { ingredientId: ingredients[0].id },
      })

      await page.goto('/my-fridge')
      await page.waitForLoadState('networkidle')

      // 재료가 표시될 때까지 대기
      const ingName = ingredients[0].name
      await expect(page.getByText(ingName).first()).toBeVisible({ timeout: 10_000 })

      // 재료 항목에서 X 버튼 (hover 시 보임 → force click)
      const ingItem = page.locator('.group').filter({ hasText: ingName }).first()
      const deleteBtn = ingItem.locator('button')
      await deleteBtn.click({ force: true })

      // API로 재료 삭제 확인
      await page.waitForTimeout(1000)
      const checkResp = await page.request.get('/api/user/ingredients')
      const checkData = await checkResp.json()
      const found = (checkData.ingredients || []).some(
        (i: any) => i.ingredient_id === ingredients[0].id
      )
      baseExpect(found).toBeFalsy()
    }
  })
})
