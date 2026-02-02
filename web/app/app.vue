<script setup lang="ts">
interface Ingredient {
  id: number
  name: string
  category: string | null
}

interface Dish {
  id: number
  name: string
  category: string | null
  image_url: string | null
  description: string | null
  ingredients: string
  match_count: number
  total_count: number
}

interface DishDetail {
  dish: {
    id: number
    name: string
    category: string | null
    image_url: string | null
    description: string | null
  }
  ingredients: Array<{
    id: number
    name: string
    category: string | null
    is_main: boolean
    is_optional: boolean
    amount: string | null
  }>
  recipes: Array<{
    id: number
    title: string
    source: string | null
    description: string | null
    ingredients_raw: string | null
    cooking_method: string | null
    cooking_time: string | null
    servings: string | null
    difficulty: string | null
    image_url: string | null
  }>
}

interface YouTubeVideo {
  id: string
  title: string
  thumbnail: string
  channelTitle: string
}

// 상태
const selectedIngredients = ref<Ingredient[]>([])
const searchInput = ref('')
const dishes = ref<Dish[]>([])
const selectedDish = ref<DishDetail | null>(null)
const youtubeVideos = ref<YouTubeVideo[]>([])
const hasYoutubeApiKey = ref(true)
const isLoading = ref(false)
const isLoadingDetail = ref(false)
const isLoadingYoutube = ref(false)
const activeCategory = ref<string | null>(null)

// 기본 재료 목록 로드
const { data: baseData } = await useFetch('/api/ingredients/base')

const categories = computed(() => baseData.value?.categories || [])
const groupedIngredients = computed(() => baseData.value?.grouped || {})

// 카테고리별 필터된 재료
const filteredIngredients = computed(() => {
  if (!activeCategory.value) return []
  return groupedIngredients.value[activeCategory.value] || []
})

// 재료 선택/해제
function toggleIngredient(ingredient: Ingredient) {
  const index = selectedIngredients.value.findIndex(i => i.id === ingredient.id)
  if (index >= 0) {
    selectedIngredients.value.splice(index, 1)
  } else {
    selectedIngredients.value.push(ingredient)
  }
}

// 재료가 선택되었는지 확인
function isSelected(ingredient: Ingredient) {
  return selectedIngredients.value.some(i => i.id === ingredient.id)
}

// 요리 검색
async function searchDishes() {
  if (selectedIngredients.value.length === 0) {
    dishes.value = []
    return
  }

  isLoading.value = true
  try {
    const names = selectedIngredients.value.map(i => i.name).join(',')
    const response = await $fetch('/api/dishes/search', {
      query: { ingredients: names }
    })
    dishes.value = response.dishes
  } catch (error) {
    console.error('검색 오류:', error)
  } finally {
    isLoading.value = false
  }
}

// 요리 상세 보기
async function viewDish(dish: Dish) {
  isLoadingDetail.value = true
  youtubeVideos.value = []

  try {
    const response = await $fetch(`/api/dishes/${dish.id}`)
    selectedDish.value = response as DishDetail

    // YouTube 영상 검색 (비동기)
    fetchYoutubeVideos(dish.name)
  } catch (error) {
    console.error('상세 조회 오류:', error)
  } finally {
    isLoadingDetail.value = false
  }
}

// YouTube 영상 검색
async function fetchYoutubeVideos(dishName: string) {
  isLoadingYoutube.value = true
  try {
    const response = await $fetch('/api/youtube/search', {
      query: { q: `${dishName} 레시피` }
    })
    youtubeVideos.value = (response as any).videos || []
    hasYoutubeApiKey.value = (response as any).hasApiKey !== false
  } catch (error) {
    console.error('YouTube 검색 오류:', error)
  } finally {
    isLoadingYoutube.value = false
  }
}

// 상세 닫기
function closeDetail() {
  selectedDish.value = null
  youtubeVideos.value = []
}

// 재료 선택 변경시 자동 검색
watch(selectedIngredients, () => {
  searchDishes()
}, { deep: true })
</script>

<template>
  <div class="min-h-screen bg-primary-50">
    <!-- 헤더 -->
    <header class="bg-white border-b border-primary-200 sticky top-0 z-10">
      <div class="max-w-4xl mx-auto px-4 py-4">
        <h1 class="text-2xl font-bold text-primary-900">🍳 모목디</h1>
        <p class="text-sm text-primary-500">냉장고 재료로 뭐 해먹지?</p>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <!-- 선택된 재료 -->
      <section v-if="selectedIngredients.length > 0" class="card">
        <h2 class="text-sm font-medium text-primary-500 mb-3">선택한 재료</h2>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="ing in selectedIngredients"
            :key="ing.id"
            @click="toggleIngredient(ing)"
            class="tag tag-selected"
          >
            {{ ing.name }}
            <span class="ml-1">×</span>
          </button>
        </div>
      </section>

      <!-- 카테고리 선택 -->
      <section class="card">
        <h2 class="text-sm font-medium text-primary-500 mb-3">재료 선택</h2>

        <!-- 카테고리 탭 -->
        <div class="flex flex-wrap gap-2 mb-4 pb-4 border-b border-primary-100">
          <button
            v-for="category in categories"
            :key="category"
            @click="activeCategory = activeCategory === category ? null : category"
            :class="[
              'px-3 py-1.5 text-sm rounded-lg transition-all',
              activeCategory === category
                ? 'bg-primary-900 text-white'
                : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
            ]"
          >
            {{ category }}
          </button>
        </div>

        <!-- 카테고리 내 재료들 -->
        <div v-if="activeCategory" class="flex flex-wrap gap-2">
          <button
            v-for="ing in filteredIngredients"
            :key="ing.id"
            @click="toggleIngredient(ing)"
            :class="[
              'tag transition-all',
              isSelected(ing) ? 'tag-selected' : 'hover:bg-primary-200'
            ]"
          >
            {{ ing.name }}
          </button>
        </div>
        <p v-else class="text-sm text-primary-400">
          위에서 카테고리를 선택해주세요
        </p>
      </section>

      <!-- 검색 결과 -->
      <section v-if="selectedIngredients.length > 0" class="space-y-4">
        <h2 class="text-lg font-semibold text-primary-900">
          만들 수 있는 요리
          <span v-if="dishes.length > 0" class="text-primary-500 font-normal">
            ({{ dishes.length }}개)
          </span>
        </h2>

        <!-- 로딩 -->
        <div v-if="isLoading" class="text-center py-8 text-primary-500">
          검색 중...
        </div>

        <!-- 결과 없음 -->
        <div v-else-if="dishes.length === 0" class="text-center py-8 text-primary-500">
          선택한 재료로 만들 수 있는 요리가 없습니다
        </div>

        <!-- 요리 목록 -->
        <div v-else class="grid gap-3">
          <button
            v-for="dish in dishes"
            :key="dish.id"
            @click="viewDish(dish)"
            class="card text-left hover:shadow-md hover:border-primary-300 transition-all"
          >
            <div class="flex items-start gap-3">
              <!-- 이미지 -->
              <div v-if="dish.image_url" class="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-primary-100">
                <img
                  :src="dish.image_url"
                  :alt="dish.name"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div v-else class="w-20 h-20 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                <span class="text-3xl">🍽️</span>
              </div>

              <!-- 정보 -->
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-primary-900 truncate">{{ dish.name }}</h3>
                <p v-if="dish.category" class="text-xs text-primary-500">{{ dish.category }}</p>
                <div class="mt-1 flex items-center gap-2">
                  <span class="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                    일치 {{ dish.match_count }}/{{ dish.total_count }}
                  </span>
                </div>
                <p v-if="dish.ingredients" class="mt-1 text-xs text-primary-500 line-clamp-1">
                  {{ dish.ingredients.split(',').slice(0, 5).join(', ') }}
                </p>
              </div>
            </div>
          </button>
        </div>
      </section>

      <!-- 안내 메시지 -->
      <div v-else class="text-center py-12 text-primary-400">
        <p class="text-5xl mb-4">🥕</p>
        <p>냉장고에 있는 재료를 선택해보세요</p>
      </div>
    </main>

    <!-- 요리 상세 모달 -->
    <Teleport to="body">
      <div
        v-if="selectedDish"
        class="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
        @click.self="closeDetail"
      >
        <div class="bg-white w-full sm:max-w-lg sm:rounded-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl">
          <!-- 헤더 -->
          <div class="sticky top-0 bg-white border-b border-primary-100 px-4 py-3 flex items-center justify-between">
            <h2 class="font-semibold text-lg">{{ selectedDish.dish.name }}</h2>
            <button
              @click="closeDetail"
              class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary-100"
            >
              ✕
            </button>
          </div>

          <!-- 로딩 -->
          <div v-if="isLoadingDetail" class="p-8 text-center text-primary-500">
            로딩 중...
          </div>

          <!-- 내용 -->
          <div v-else class="p-4 space-y-6">
            <!-- 이미지 -->
            <div v-if="selectedDish.dish.image_url" class="rounded-2xl overflow-hidden bg-primary-100">
              <img
                :src="selectedDish.dish.image_url"
                :alt="selectedDish.dish.name"
                class="w-full h-48 object-cover"
              />
            </div>

            <!-- 설명 -->
            <p v-if="selectedDish.dish.description" class="text-primary-600">
              {{ selectedDish.dish.description }}
            </p>

            <!-- 필요한 재료 -->
            <section>
              <h3 class="font-semibold text-primary-900 mb-2">필요한 재료</h3>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="ing in selectedDish.ingredients"
                  :key="ing.id"
                  :class="[
                    'text-sm px-2 py-1 rounded-lg',
                    ing.is_main
                      ? 'bg-primary-900 text-white'
                      : 'bg-primary-100 text-primary-700'
                  ]"
                >
                  {{ ing.name }}
                  <span v-if="ing.amount" class="text-primary-400 ml-1">{{ ing.amount }}</span>
                </span>
              </div>
            </section>

            <!-- 레시피 -->
            <section v-if="selectedDish.recipes.length > 0">
              <h3 class="font-semibold text-primary-900 mb-3">레시피</h3>
              <div class="space-y-4">
                <div
                  v-for="recipe in selectedDish.recipes"
                  :key="recipe.id"
                  class="bg-primary-50 rounded-xl p-4"
                >
                  <h4 class="font-medium text-primary-900">{{ recipe.title }}</h4>
                  <div class="mt-2 flex flex-wrap gap-2 text-xs text-primary-500">
                    <span v-if="recipe.cooking_time">⏱️ {{ recipe.cooking_time }}</span>
                    <span v-if="recipe.servings">👥 {{ recipe.servings }}</span>
                    <span v-if="recipe.difficulty">📊 {{ recipe.difficulty }}</span>
                    <span v-if="recipe.source">📖 {{ recipe.source }}</span>
                  </div>
                  <p v-if="recipe.description" class="mt-2 text-sm text-primary-600">
                    {{ recipe.description }}
                  </p>
                  <details v-if="recipe.ingredients_raw" class="mt-3">
                    <summary class="text-sm text-primary-500 cursor-pointer hover:text-primary-700">
                      원본 재료 보기
                    </summary>
                    <p class="mt-2 text-sm text-primary-600 whitespace-pre-wrap bg-white rounded-lg p-3">
                      {{ recipe.ingredients_raw }}
                    </p>
                  </details>
                </div>
              </div>
            </section>

            <!-- YouTube 레시피 영상 -->
            <section>
              <h3 class="font-semibold text-primary-900 mb-3">📺 유튜브 레시피</h3>

              <!-- 로딩 -->
              <div v-if="isLoadingYoutube" class="text-center py-4 text-primary-500">
                영상 검색 중...
              </div>

              <!-- 영상 목록 -->
              <div v-else-if="youtubeVideos.length > 0" class="space-y-3">
                <a
                  v-for="video in youtubeVideos"
                  :key="video.id"
                  :href="`https://www.youtube.com/watch?v=${video.id}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex gap-3 bg-primary-50 hover:bg-primary-100 rounded-xl p-2 transition-all"
                >
                  <div class="w-32 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-primary-200 relative">
                    <img
                      :src="video.thumbnail"
                      :alt="video.title"
                      class="w-full h-full object-cover"
                    />
                    <!-- Play 버튼 오버레이 -->
                    <div class="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div class="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                        <svg class="w-5 h-5 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0 py-1">
                    <p class="font-medium text-primary-900 text-sm line-clamp-2">{{ video.title }}</p>
                    <p class="text-xs text-primary-500 mt-1">{{ video.channelTitle }}</p>
                  </div>
                </a>

                <!-- 더보기 링크 -->
                <a
                  :href="`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedDish.dish.name + ' 레시피')}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="block text-center text-sm text-primary-500 hover:text-primary-700 py-2"
                >
                  YouTube에서 더 보기 →
                </a>
              </div>

              <!-- API 키 없거나 결과 없음 - 검색 링크 폴백 -->
              <a
                v-else
                :href="`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedDish.dish.name + ' 레시피')}`"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-3 bg-red-50 hover:bg-red-100 rounded-xl p-4 transition-all"
              >
                <div class="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <div>
                  <p class="font-medium text-primary-900">"{{ selectedDish.dish.name }} 레시피" 검색</p>
                  <p class="text-sm text-primary-500">YouTube에서 영상 레시피 보기</p>
                </div>
              </a>
            </section>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
