import { ref, watch } from 'vue'

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

const selectedIngredients = ref<Ingredient[]>([])
const dishes = ref<Dish[]>([])
const isLoading = ref(false)
const isLoadingMore = ref(false)
const hasMore = ref(false)
const total = ref(0)

export function useRecipeSearch() {
  // 초기 검색 (재료 변경 시)
  async function searchDishes() {
    if (selectedIngredients.value.length === 0) {
      dishes.value = []
      hasMore.value = false
      total.value = 0
      return
    }

    isLoading.value = true
    try {
      const names = selectedIngredients.value.map(i => i.name).join(',')
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
    if (isLoadingMore.value || !hasMore.value || selectedIngredients.value.length === 0) {
      return
    }

    isLoadingMore.value = true
    try {
      const names = selectedIngredients.value.map(i => i.name).join(',')
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
  watch(selectedIngredients, () => {
    searchDishes()
  }, { deep: true })

  return {
    selectedIngredients,
    dishes,
    isLoading,
    isLoadingMore,
    hasMore,
    total,
    searchDishes,
    loadMore
  }
}
