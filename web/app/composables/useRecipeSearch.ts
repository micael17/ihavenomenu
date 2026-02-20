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
  isUserRecipe?: boolean
  creator?: {
    nickname: string | null
    channelName: string | null
    profileImage: string | null
  }
  youtubeVideoId?: string | null
  viewCount?: number
  likeCount?: number
  description?: string | null
}

export type CuisinePreference = 'mixed' | 'western' | 'dessert' | 'korean'

const CACHE_MAX_SIZE = 50
const CACHE_TTL = 5 * 60 * 1000 // 5분
const RATE_LIMIT_COOLDOWN = 30 * 1000 // 30초 쿨다운
const DEBOUNCE_MS = 400
const SEARCH_DELAY_MS = 2000 // 부하 방지용 API 호출 전 딜레이
const searchCache = new Map<string, { data: any; timestamp: number }>()

let watcherRegistered = false
let searchTimer: ReturnType<typeof setTimeout> | null = null
let searchQueue: Promise<void> = Promise.resolve()

export function useRecipeSearch() {
  const { locale } = useI18n()
  const myIngredients = useState<Ingredient[]>('search-my-ingredients', () => [])
  const selectedIngredients = useState<Ingredient[]>('search-selected-ingredients', () => [])
  const excludedMyIngredientIds = useState<Set<number>>('search-excluded-ids', () => new Set())
  const cuisinePreference = useState<CuisinePreference>('search-cuisine-preference', () => 'mixed')
  const cuisineSubCategory = useState<string | null>('search-cuisine-sub-category', () => null)
  const userDishes = useState<Dish[]>('search-user-dishes', () => [])
  const dbDishes = useState<Dish[]>('search-db-dishes', () => [])
  const isSearching = useState('search-is-searching', () => false)
  const isRateLimited = useState('search-rate-limited', () => false)
  const currentPage = useState('search-current-page', () => 1)
  const hasMore = useState('search-has-more', () => false)
  const totalCount = useState('search-total-count', () => 0)

  // 호환용 합산 computed
  const dishes = computed(() => [...userDishes.value, ...dbDishes.value])
  const pageSize = 24

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

  function buildCacheKey(ids: number[], cuisine: string, subCat: string | null, offset: number, loc: string): string {
    return `${[...ids].sort((a, b) => a - b).join(',')}|${cuisine}|${subCat || ''}|${offset}|${loc}`
  }

  function applyResponse(response: any, page: number, cacheKey: string) {
    searchCache.set(cacheKey, { data: response, timestamp: Date.now() })
    if (searchCache.size > CACHE_MAX_SIZE) {
      searchCache.delete(searchCache.keys().next().value!)
    }
    // 사용자 레시피는 항상 전체 교체 (페이지네이션 없음)
    userDishes.value = response.userDishes || []
    if (page === 1) {
      dbDishes.value = response.dbDishes || []
    } else {
      dbDishes.value = [...dbDishes.value, ...(response.dbDishes || [])]
    }
    currentPage.value = page
    hasMore.value = response.hasMore
    totalCount.value = response.total
    isRateLimited.value = false
  }

  function searchDishes(page = 1) {
    // 이전 검색이 끝나야(캐시 저장까지) 다음 검색 시작
    searchQueue = searchQueue.then(() => executeSearch(page)).catch(() => {})
    return searchQueue
  }

  async function executeSearch(page: number) {
    const ingredients = allIngredients.value
    if (ingredients.length === 0) {
      userDishes.value = []
      dbDishes.value = []
      totalCount.value = 0
      hasMore.value = false
      return
    }

    const offset = (page - 1) * pageSize
    const cacheKey = buildCacheKey(
      ingredients.map(i => i.id), cuisinePreference.value, cuisineSubCategory.value, offset, locale.value
    )

    // 캐시 HIT — 이전 요청 완료 후이므로 캐시에 있을 확률 높음
    const cached = searchCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      userDishes.value = cached.data.userDishes || []
      if (page === 1) dbDishes.value = cached.data.dbDishes || []
      else dbDishes.value = [...dbDishes.value, ...(cached.data.dbDishes || [])]
      currentPage.value = page
      hasMore.value = cached.data.hasMore
      totalCount.value = cached.data.total
      isRateLimited.value = false
      return
    }

    // 캐시 MISS → API 호출 (부하 방지용 2초 딜레이)
    isSearching.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, SEARCH_DELAY_MS))
      const ingredientIds = ingredients.map(i => i.id).join(',')
      const response = await $fetch<{
        userDishes: Dish[]
        dbDishes: Dish[]
        total: number
        dbTotal: number
        hasMore: boolean
        offset: number
      }>('/api/dishes/search', {
        query: {
          ids: ingredientIds,
          offset,
          limit: pageSize,
          cuisine: cuisinePreference.value,
          ...(cuisineSubCategory.value ? { subCategory: cuisineSubCategory.value } : {})
        }
      })
      applyResponse(response, page, cacheKey)
    } catch (error: any) {
      if (error?.statusCode === 429 || error?.status === 429) {
        isRateLimited.value = true
        setTimeout(() => { isRateLimited.value = false }, RATE_LIMIT_COOLDOWN)
      } else {
        console.error('검색 오류:', error)
      }
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
    cuisineSubCategory.value = null
    userDishes.value = []
    dbDishes.value = []
    currentPage.value = 1
    hasMore.value = false
    totalCount.value = 0
  }

  function debouncedSearch() {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      searchDishes(1)
    }, DEBOUNCE_MS)
  }

  // 재료 또는 요리 스타일 변경 시 자동 검색 (한 번만 등록)
  if (import.meta.client && !watcherRegistered) {
    watcherRegistered = true
    watch([allIngredients, cuisinePreference, cuisineSubCategory], () => {
      debouncedSearch()
    }, { deep: true })

    // locale 변경 시 캐시 초기화 + 재료 데이터 리로드
    watch(locale, () => {
      if (searchTimer) clearTimeout(searchTimer)
      searchCache.clear()
      resetState()
      loadUserIngredients()
    })

    // 컴포넌트 unmount 시 플래그 리셋 → 재진입 시 watcher 재등록
    onScopeDispose(() => {
      watcherRegistered = false
    })
  }

  return {
    myIngredients: readonly(myIngredients),
    selectedIngredients,
    excludedMyIngredientIds: readonly(excludedMyIngredientIds),
    cuisinePreference,
    cuisineSubCategory,
    userDishes: readonly(userDishes),
    dbDishes: readonly(dbDishes),
    dishes,
    isSearching: readonly(isSearching),
    isRateLimited: readonly(isRateLimited),
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
