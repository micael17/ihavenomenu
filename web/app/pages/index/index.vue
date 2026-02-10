<script setup lang="ts">
import type { Dish } from '~/composables/useRecipeSearch'

const { selectedIngredients, dishes, isLoading, isLoadingMore, hasMore, total, loadMore } = useRecipeSearch()

// 무한 스크롤을 위한 Intersection Observer
const loadMoreTrigger = ref<HTMLElement | null>(null)

function viewDish(dish: Dish) {
  if (dish.isUserRecipe) {
    navigateTo(`/recipe/${dish.id}`)
  } else {
    navigateTo(`/${dish.id}`)
  }
}

// Intersection Observer 설정
onMounted(() => {
  if (!loadMoreTrigger.value) return

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry?.isIntersecting && hasMore.value && !isLoadingMore.value) {
        loadMore()
      }
    },
    { rootMargin: '100px' }
  )

  observer.observe(loadMoreTrigger.value)

  onUnmounted(() => {
    observer.disconnect()
  })
})
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900">레시피 검색</h1>
      <p class="text-gray-500 mt-1">
        <span v-if="selectedIngredients.length > 0 && total > 0">
          {{ total }}개의 요리 중 {{ dishes.length }}개 표시
        </span>
        <span v-else-if="selectedIngredients.length > 0 && !isLoading">
          요리를 찾을 수 없습니다
        </span>
        <span v-else>재료를 선택하면 만들 수 있는 요리를 찾아드려요</span>
      </p>
    </div>

    <!-- 로딩 -->
    <div v-if="isLoading" class="text-center py-12 text-gray-500">
      <div class="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600 mb-2"></div>
      <p>검색 중...</p>
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
    <template v-else>
      <div class="grid grid-cols-2 gap-4">
        <button
          v-for="dish in dishes"
          :key="`${dish.isUserRecipe ? 'user' : 'db'}-${dish.id}`"
          @click="viewDish(dish)"
          class="bg-white border border-gray-200 rounded-lg p-4 text-left hover:border-gray-400 transition-colors relative"
        >
          <!-- 사용자 레시피 배지 -->
          <div v-if="dish.isUserRecipe" class="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
            크리에이터
          </div>

          <div class="flex gap-4">
            <div class="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
              <img
                v-if="dish.image_url"
                :src="dish.image_url"
                :alt="dish.name"
                class="w-full h-full object-cover"
                loading="lazy"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <span class="text-2xl">🍽️</span>
              </div>
              <!-- YouTube 아이콘 -->
              <div v-if="dish.youtubeVideoId" class="absolute bottom-1 right-1 bg-red-600 text-white rounded px-1 py-0.5">
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
              </div>
            </div>

            <div class="flex-1 min-w-0">
              <h3 class="font-medium text-gray-900">{{ dish.name }}</h3>
              <p v-if="dish.category" class="text-xs text-gray-500 mt-0.5">{{ dish.category }}</p>

              <!-- 크리에이터 정보 -->
              <div v-if="dish.isUserRecipe && dish.creator" class="flex items-center gap-1.5 mt-1">
                <img
                  v-if="dish.creator.profileImage"
                  :src="dish.creator.profileImage"
                  :alt="dish.creator.nickname || '크리에이터'"
                  class="w-4 h-4 rounded-full"
                />
                <span class="text-xs text-gray-500">{{ dish.creator.nickname || dish.creator.channelName }}</span>
              </div>

              <div class="flex items-center gap-2 mt-2">
                <span class="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                  일치 {{ dish.match_count }}/{{ dish.total_count }}
                </span>
                <!-- 조회수/좋아요 (사용자 레시피만) -->
                <span v-if="dish.isUserRecipe && dish.viewCount" class="text-xs text-gray-400">
                  👁️ {{ dish.viewCount }}
                </span>
              </div>

              <p v-if="dish.ingredients" class="mt-2 text-xs text-gray-400 truncate">
                {{ dish.ingredients.split(',').slice(0, 4).join(', ') }}
              </p>
            </div>
          </div>
        </button>
      </div>

      <!-- 더 불러오기 트리거 & 로딩 표시 -->
      <div ref="loadMoreTrigger" class="py-8 text-center">
        <div v-if="isLoadingMore" class="text-gray-500">
          <div class="inline-block animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-600 mb-1"></div>
          <p class="text-sm">더 불러오는 중...</p>
        </div>
        <p v-else-if="!hasMore && dishes.length > 0" class="text-sm text-gray-400">
          모든 레시피를 불러왔습니다
        </p>
      </div>
    </template>
  </div>
</template>
