<script setup lang="ts">
import type { Ingredient } from '~/composables/useRecipeSearch'

const { myIngredients, selectedIngredients, excludedMyIngredientIds, cuisinePreference, cuisineSubCategory, loadUserIngredients, toggleExcludeMyIngredient, setIngredientsFromNames } = useRecipeSearch()

const route = useRoute()

// 페이지 로드 시 사용자 재료 자동 선택
onMounted(async () => {
  await loadUserIngredients()

  // 쿼리 파라미터에서 재료 이름 읽기
  const ingredientParam = route.query.ingredients as string
  if (ingredientParam) {
    const names = ingredientParam.split(',').map(n => n.trim()).filter(Boolean)
    if (names.length > 0) {
      await setIngredientsFromNames(names)
    }
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 상단 헤더 -->
    <AppHeader />

    <main class="max-w-6xl mx-auto px-6 py-8">
      <div class="flex flex-col lg:flex-row gap-4 lg:gap-8">
        <!-- 왼쪽: 재료 선택 (항상 유지) -->
        <div class="w-full lg:w-80 lg:flex-shrink-0">
          <RecipeIngredientSelector
            v-model="selectedIngredients"
            v-model:cuisine="cuisinePreference"
            v-model:sub-category="cuisineSubCategory"
            :my-ingredients="myIngredients"
            :excluded-ids="excludedMyIngredientIds"
            @toggle-exclude="(ing) => toggleExcludeMyIngredient(ing.id)"
          />
        </div>

        <!-- 오른쪽: 자식 라우트 렌더링 -->
        <div class="flex-1">
          <NuxtPage />
        </div>
      </div>
    </main>
  </div>
</template>
