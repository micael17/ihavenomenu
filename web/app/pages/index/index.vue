<script setup lang="ts">
const { selectedIngredients, allIngredients, userDishes, dbDishes, dishes, isSearching, isRateLimited, hasMore, totalCount, loadMore } = useRecipeSearch()
const { t } = useI18n()

// 무한 스크롤을 위한 Intersection Observer
const loadMoreTrigger = ref<HTMLElement | null>(null)

function viewDish(dish: any) {
  if (dish.isUserRecipe) {
    navigateTo(`/recipe/${dish.id}`)
  } else {
    navigateTo(`/${dish.id}`)
  }
}

const observer = ref<IntersectionObserver | null>(null)

function setupObserver() {
  if (observer.value) observer.value.disconnect()
  if (!loadMoreTrigger.value) return

  observer.value = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore.value && !isSearching.value) {
        loadMore()
      }
    },
    { rootMargin: '200px' }
  )
  observer.value.observe(loadMoreTrigger.value)
}

watch(loadMoreTrigger, () => {
  setupObserver()
})

onMounted(() => {
  setupObserver()
})

onUnmounted(() => {
  observer.value?.disconnect()
})
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900">{{ t('nav.recipeSearch') }}</h1>
      <p class="text-gray-500 mt-1">
        <span v-if="allIngredients.length > 0 && totalCount > 0">
          {{ t('home.dishCountDisplay', { total: totalCount, shown: dishes.length }) }}
        </span>
        <span v-else-if="allIngredients.length > 0 && !isSearching">
          {{ t('home.noDishesFound') }}
        </span>
        <span v-else>{{ t('home.selectIngredientsHint') }}</span>
      </p>
    </div>

    <!-- Rate limit 안내 -->
    <div v-if="isRateLimited" class="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
      <span class="text-xl flex-shrink-0">&#x23F3;</span>
      <div>
        <p class="text-amber-800 font-medium text-sm">{{ t('home.rateLimitTitle') }}</p>
        <p class="text-amber-600 text-xs mt-1">{{ t('home.rateLimitMessage') }}</p>
      </div>
    </div>

    <!-- 로딩 -->
    <div v-if="isSearching" class="text-center py-12 text-gray-500">
      <div class="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600 mb-2"></div>
      <p>{{ t('home.searchingRecipes') }}</p>
    </div>

    <!-- 빈 상태 -->
    <div v-else-if="allIngredients.length === 0" class="text-center py-16">
      <p class="text-5xl mb-4">🥕</p>
      <p class="text-gray-500">{{ t('home.selectIngredientsHint') }}</p>
    </div>

    <!-- 결과 없음 -->
    <div v-else-if="dishes.length === 0" class="text-center py-16">
      <p class="text-5xl mb-4">😢</p>
      <p class="text-gray-500">{{ t('home.noRecipesFound') }}</p>
    </div>

    <!-- 요리 목록 -->
    <template v-else>
      <!-- 크리에이터 레시피 수평 캐러셀 -->
      <div v-if="userDishes.length > 0" class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-gray-700">
            {{ t('home.creatorRecipes') }}
            <span class="text-gray-400 font-normal ml-1">{{ t('home.creatorRecipeCount', { count: userDishes.length }) }}</span>
          </h2>
        </div>
        <div class="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
          <button
            v-for="dish in userDishes"
            :key="`user-${dish.id}`"
            @click="viewDish(dish)"
            class="flex-shrink-0 w-[calc(25%-9px)] min-w-[160px] bg-white border border-gray-200 rounded-lg p-3 text-left hover:border-orange-300 transition-colors relative snap-start"
          >
            <div class="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
              {{ t('home.creatorBadge') }}
            </div>
            <div class="relative w-full aspect-[4/3] rounded-md overflow-hidden bg-gray-100 mb-2">
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
              <div v-if="dish.youtubeVideoId" class="absolute bottom-1 right-1 bg-red-600 text-white rounded px-1 py-0.5">
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
              </div>
            </div>
            <h3 class="font-medium text-gray-900 text-sm truncate">{{ dish.name }}</h3>
            <div v-if="dish.creator" class="flex items-center gap-1.5 mt-1">
              <img
                v-if="dish.creator.profileImage"
                :src="dish.creator.profileImage"
                :alt="dish.creator.nickname || t('home.creatorBadge')"
                class="w-4 h-4 rounded-full"
              />
              <span class="text-xs text-gray-500 truncate">{{ dish.creator.nickname || dish.creator.channelName }}</span>
            </div>
            <div class="flex items-center gap-2 mt-1.5">
              <span class="text-xs px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded">
                {{ t('home.matchCount', { match: dish.match_count, total: dish.total_count }) }}
              </span>
            </div>
          </button>
        </div>
      </div>

      <!-- DB 레시피 그리드 -->
      <div class="grid grid-cols-2 gap-4">
        <button
          v-for="dish in dbDishes"
          :key="`db-${dish.id}`"
          @click="viewDish(dish)"
          class="bg-white border border-gray-200 rounded-lg p-4 text-left hover:border-gray-400 transition-colors relative"
        >
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
            </div>

            <div class="flex-1 min-w-0">
              <h3 class="font-medium text-gray-900">{{ dish.name }}</h3>
              <p v-if="dish.category" class="text-xs text-gray-500 mt-0.5">{{ dish.category }}</p>

              <div class="flex items-center gap-2 mt-2">
                <span class="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                  {{ t('home.matchCount', { match: dish.match_count, total: dish.total_count }) }}
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
        <div v-if="isSearching" class="text-gray-500">
          <div class="inline-block animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-600 mb-1"></div>
          <p class="text-sm">{{ t('home.loadingMore') }}</p>
        </div>
        <p v-else-if="!hasMore && dishes.length > 0" class="text-sm text-gray-400">
          {{ t('home.allRecipesLoaded') }}
        </p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
