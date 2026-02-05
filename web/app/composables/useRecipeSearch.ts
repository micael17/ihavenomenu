import { ref, watch } from 'vue'

export interface Ingredient {
  id: number
  name: string
  category: string | null
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
}

const selectedIngredients = ref<Ingredient[]>([])
const dishes = ref<Dish[]>([])
const isLoading = ref(false)

export function useRecipeSearch() {
  async function searchDishes() {
    if (selectedIngredients.value.length === 0) {
      dishes.value = []
      return
    }

    isLoading.value = true
    try {
      const names = selectedIngredients.value.map(i => i.name).join(',')
      const response = await $fetch<{ dishes: Dish[] }>('/api/dishes/search', {
        query: { ingredients: names }
      })
      dishes.value = response.dishes
    } catch (error) {
      console.error('검색 오류:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 재료 변경 시 자동 검색
  watch(selectedIngredients, () => {
    searchDishes()
  }, { deep: true })

  return {
    selectedIngredients,
    dishes,
    isLoading,
    searchDishes
  }
}
