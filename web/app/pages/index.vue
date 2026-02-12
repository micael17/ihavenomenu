<script setup lang="ts">
import type { Ingredient } from '~/composables/useRecipeSearch'

const { myIngredients, selectedIngredients, excludedMyIngredientIds, loadUserIngredients, toggleExcludeMyIngredient } = useRecipeSearch()

// 페이지 로드 시 사용자 재료 자동 선택
onMounted(() => {
  loadUserIngredients()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 상단 헤더 -->
    <AppHeader />

    <main class="max-w-6xl mx-auto px-6 py-8">
      <div class="flex gap-8">
        <!-- 왼쪽: 재료 선택 (항상 유지) -->
        <div class="w-80 flex-shrink-0">
          <RecipeIngredientSelector
            v-model="selectedIngredients"
            :my-ingredients="myIngredients"
            :excluded-ids="excludedMyIngredientIds"
            @toggle-exclude="toggleExcludeMyIngredient"
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
