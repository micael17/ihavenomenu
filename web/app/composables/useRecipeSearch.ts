import { ref, watch, computed } from 'vue'

export interface Ingredient {
  id: number
  name: string
  category: string | null
}

export interface Creator {
  nickname: string | null
  channelName: string | null
  profileImage: string | null
}

export interface Dish {
  id: number
  name: string
  category: string | null
  image_url: string | null
  description: string | null
  ingredients: string
  match_count: number
  total_count: number
  isUserRecipe?: boolean
  creator?: Creator
  youtubeVideoId?: string | null
  viewCount?: number
  likeCount?: number
}

interface SearchResponse {
  dishes: Dish[]
  total: number
  hasMore: boolean
  offset: number
}

const PAGE_SIZE = 12

// 내 재료 (사용자가 저장한 재료)
const myIngredients = ref<Ingredient[]>([])
// 선택한 재료 (임시로 선택한 재료)
const selectedIngredients = ref<Ingredient[]>([])
// 임시 제외된 내 재료 ID
const excludedMyIngredientIds = ref<Set<number>>(new Set())
// 전체 재료 (내 재료 - 제외된 재료 + 선택한 재료)
const allIngredients = computed(() => {
  const activeMyIngredients = myIngredients.value.filter(i => !excludedMyIngredientIds.value.has(i.id))
  const myIds = new Set(activeMyIngredients.map(i => i.id))
  const uniqueSelected = selectedIngredients.value.filter(i => !myIds.has(i.id))
  return [...activeMyIngredients, ...uniqueSelected]
})

const dishes = ref<Dish[]>([])
const isLoading = ref(false)
const isLoadingMore = ref(false)
const hasMore = ref(false)
const total = ref(0)
const isInitialized = ref(false)

export function useRecipeSearch() {
  // 사용자 재료 불러오기 (로그인 시 자동 선택)
  async function loadUserIngredients() {
    if (isInitialized.value) return

    try {
      const response = await $fetch<{ ingredients: Array<{ ingredient_id: number; name: string; category: string | null }> }>('/api/user/ingredients')
      if (response.ingredients && response.ingredients.length > 0) {
        myIngredients.value = response.ingredients.map(ing => ({
          id: ing.ingredient_id,
          name: ing.name,
          category: ing.category
        }))
      }
      isInitialized.value = true
    } catch (error) {
      // 로그인 안 된 경우 무시
      isInitialized.value = true
    }
  }

  // 내 재료 임시 제외 토글
  function toggleExcludeMyIngredient(ingredient: Ingredient) {
    const newSet = new Set(excludedMyIngredientIds.value)
    if (newSet.has(ingredient.id)) {
      newSet.delete(ingredient.id)
    } else {
      newSet.add(ingredient.id)
    }
    excludedMyIngredientIds.value = newSet
  }

  // 내 재료가 임시 제외되었는지 확인
  function isExcludedMyIngredient(ingredientId: number) {
    return excludedMyIngredientIds.value.has(ingredientId)
  }

  // 선택한 재료에서 제거
  function removeSelectedIngredient(ingredient: Ingredient) {
    const index = selectedIngredients.value.findIndex(i => i.id === ingredient.id)
    if (index >= 0) {
      selectedIngredients.value.splice(index, 1)
    }
  }

  // 재료가 내 재료인지 확인
  function isMyIngredient(ingredient: Ingredient) {
    return myIngredients.value.some(i => i.id === ingredient.id)
  }

  // 초기 검색 (재료 변경 시)
  async function searchDishes() {
    if (allIngredients.value.length === 0) {
      dishes.value = []
      hasMore.value = false
      total.value = 0
      return
    }

    isLoading.value = true
    try {
      const names = allIngredients.value.map(i => i.name).join(',')
      const response = await $fetch<SearchResponse>('/api/dishes/search', {
        query: { ingredients: names, offset: 0, limit: PAGE_SIZE }
      })
      dishes.value = response.dishes
      hasMore.value = response.hasMore
      total.value = response.total
    } catch (error) {
      console.error('검색 오류:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 더 불러오기 (무한 스크롤)
  async function loadMore() {
    if (isLoadingMore.value || !hasMore.value || allIngredients.value.length === 0) {
      return
    }

    isLoadingMore.value = true
    try {
      const names = allIngredients.value.map(i => i.name).join(',')
      const response = await $fetch<SearchResponse>('/api/dishes/search', {
        query: { ingredients: names, offset: dishes.value.length, limit: PAGE_SIZE }
      })
      dishes.value = [...dishes.value, ...response.dishes]
      hasMore.value = response.hasMore
    } catch (error) {
      console.error('추가 로딩 오류:', error)
    } finally {
      isLoadingMore.value = false
    }
  }

  // 재료 변경 시 자동 검색 (처음부터)
  watch(allIngredients, () => {
    searchDishes()
  }, { deep: true })

  return {
    myIngredients,
    selectedIngredients,
    excludedMyIngredientIds,
    allIngredients,
    dishes,
    isLoading,
    isLoadingMore,
    hasMore,
    total,
    isInitialized,
    searchDishes,
    loadMore,
    loadUserIngredients,
    toggleExcludeMyIngredient,
    isExcludedMyIngredient,
    removeSelectedIngredient,
    isMyIngredient
  }
}
