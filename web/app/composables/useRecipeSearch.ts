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
  ingredients: string
  match_count: number
  total_count: number
  source?: 'db' | 'user'
  creator_name?: string
}

export type CuisinePreference = 'korean' | 'mixed'

let watcherRegistered = false

export function useRecipeSearch() {
  const { locale } = useI18n()
  const myIngredients = useState<Ingredient[]>('search-my-ingredients', () => [])
  const selectedIngredients = useState<Ingredient[]>('search-selected-ingredients', () => [])
  const excludedMyIngredientIds = useState<Set<number>>('search-excluded-ids', () => new Set())
  const cuisinePreference = useState<CuisinePreference>('search-cuisine-preference', () =>
    locale.value === 'ko' ? 'korean' : 'mixed'
  )
  const dishes = useState<Dish[]>('search-dishes', () => [])
  const isSearching = useState('search-is-searching', () => false)
  const currentPage = useState('search-current-page', () => 1)
  const hasMore = useState('search-has-more', () => false)
  const totalCount = useState('search-total-count', () => 0)
  const pageSize = 12

  const activeMyIngredients = computed(() =>
    myIngredients.value.filter(i => !excludedMyIngredientIds.value.has(i.id))
  )

  const allIngredients = computed(() => {
    const myActive = activeMyIngredients.value
    const selected = selectedIngredients.value
    const combined = [...myActive]
    for (const s of selected) {
      if (!combined.some(m => m.id === s.id)) {
        combined.push(s)
      }
    }
    return combined
  })

  async function searchDishes(page = 1) {
    const ingredients = allIngredients.value
    if (ingredients.length === 0) {
      dishes.value = []
      totalCount.value = 0
      hasMore.value = false
      return
    }

    isSearching.value = true
    try {
      const ingredientNames = ingredients.map(i => i.name).join(',')
      const offset = (page - 1) * pageSize
      const response = await $fetch<{
        dishes: Dish[]
        total: number
        hasMore: boolean
        offset: number
      }>('/api/dishes/search', {
        query: {
          ingredients: ingredientNames,
          offset,
          limit: pageSize,
          cuisine: cuisinePreference.value
        }
      })

      if (page === 1) {
        dishes.value = response.dishes
      } else {
        dishes.value = [...dishes.value, ...response.dishes]
      }
      currentPage.value = page
      hasMore.value = response.hasMore
      totalCount.value = response.total
    } catch (error) {
      console.error('검색 오류:', error)
    } finally {
      isSearching.value = false
    }
  }

  function loadMore() {
    if (!hasMore.value || isSearching.value) return
    searchDishes(currentPage.value + 1)
  }

  async function loadUserIngredients() {
    try {
      const response = await $fetch<{ ingredients: any[] }>('/api/user/ingredients')
      myIngredients.value = (response.ingredients || []).map((ui: any) => ({
        id: ui.ingredient_id,
        name: ui.name,
        category: ui.category
      }))
    } catch {
      // 비로그인 시 무시
    }
  }

  function toggleExcludeMyIngredient(ingredientId: number) {
    const newSet = new Set(excludedMyIngredientIds.value)
    if (newSet.has(ingredientId)) {
      newSet.delete(ingredientId)
    } else {
      newSet.add(ingredientId)
    }
    excludedMyIngredientIds.value = newSet
  }

  function removeSelectedIngredient(ingredientId: number) {
    selectedIngredients.value = selectedIngredients.value.filter(i => i.id !== ingredientId)
  }

  async function setIngredientsFromNames(names: string[]) {
    if (names.length === 0) return

    try {
      const response = await $fetch<{ ingredients: Ingredient[] }>('/api/ingredients/base')
      const fetchedIngredients = response.ingredients || []
      const matched = names
        .map(name => fetchedIngredients.find((i: Ingredient) => i.name === name))
        .filter((i): i is Ingredient => !!i)

      if (matched.length > 0) {
        selectedIngredients.value = matched
      }
    } catch (error) {
      console.error('재료 로드 오류:', error)
    }
  }

  function resetState() {
    myIngredients.value = []
    selectedIngredients.value = []
    excludedMyIngredientIds.value = new Set()
    dishes.value = []
    currentPage.value = 1
    hasMore.value = false
    totalCount.value = 0
  }

  // 재료 또는 요리 스타일 변경 시 자동 검색 (한 번만 등록)
  if (import.meta.client && !watcherRegistered) {
    watcherRegistered = true
    watch([allIngredients, cuisinePreference], () => {
      searchDishes(1)
    }, { deep: true })

    // locale 변경 시 재료 데이터 리로드
    watch(locale, () => {
      resetState()
      loadUserIngredients()
    })
  }

  return {
    myIngredients: readonly(myIngredients),
    selectedIngredients,
    excludedMyIngredientIds: readonly(excludedMyIngredientIds),
    cuisinePreference,
    dishes: readonly(dishes),
    isSearching: readonly(isSearching),
    hasMore: readonly(hasMore),
    totalCount: readonly(totalCount),
    activeMyIngredients,
    allIngredients,
    searchDishes,
    loadMore,
    loadUserIngredients,
    toggleExcludeMyIngredient,
    removeSelectedIngredient,
    setIngredientsFromNames,
    resetState
  }
}
