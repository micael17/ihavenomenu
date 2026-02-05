<script setup lang="ts">
const { selectedIngredients, dishes, isLoading } = useRecipeSearch()

function viewDish(dishId: number) {
  navigateTo(`/${dishId}`)
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900">레시피 검색</h1>
      <p class="text-gray-500 mt-1">
        <span v-if="selectedIngredients.length > 0">
          {{ dishes.length }}개의 요리를 찾았습니다
        </span>
        <span v-else>재료를 선택하면 만들 수 있는 요리를 찾아드려요</span>
      </p>
    </div>

    <!-- 로딩 -->
    <div v-if="isLoading" class="text-center py-12 text-gray-500">
      검색 중...
    </div>

    <!-- 빈 상태 -->
    <div v-else-if="selectedIngredients.length === 0" class="text-center py-16">
      <p class="text-5xl mb-4">🥕</p>
      <p class="text-gray-500">왼쪽에서 재료를 선택해보세요</p>
    </div>

    <!-- 결과 없음 -->
    <div v-else-if="dishes.length === 0" class="text-center py-16">
      <p class="text-5xl mb-4">😢</p>
      <p class="text-gray-500">선택한 재료로 만들 수 있는 요리가 없습니다</p>
    </div>

    <!-- 요리 목록 -->
    <div v-else class="grid grid-cols-2 gap-4">
      <button
        v-for="dish in dishes"
        :key="dish.id"
        @click="viewDish(dish.id)"
        class="bg-white border border-gray-200 rounded-lg p-4 text-left hover:border-gray-400 transition-colors"
      >
        <div class="flex gap-4">
          <div v-if="dish.image_url" class="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
            <img :src="dish.image_url" :alt="dish.name" class="w-full h-full object-cover" loading="lazy" />
          </div>
          <div v-else class="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <span class="text-2xl">🍽️</span>
          </div>

          <div class="flex-1 min-w-0">
            <h3 class="font-medium text-gray-900">{{ dish.name }}</h3>
            <p v-if="dish.category" class="text-xs text-gray-500 mt-0.5">{{ dish.category }}</p>
            <div class="mt-2">
              <span class="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                일치 {{ dish.match_count }}/{{ dish.total_count }}
              </span>
            </div>
            <p v-if="dish.ingredients" class="mt-2 text-xs text-gray-400 truncate">
              {{ dish.ingredients.split(',').slice(0, 4).join(', ') }}
            </p>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>
