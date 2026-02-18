<script setup lang="ts">
/**
 * 내 재료 - 웹 레이아웃 (로그인 연동)
 */

definePageMeta({
  middleware: 'auth'
})

interface BaseIngredient {
  id: number
  name: string
  category: string | null
}

interface UserIngredient {
  id: number
  ingredient_id: number
  name: string
  category: string | null
  expiry_date: string | null
  days_left?: number
}

const { t, locale } = useI18n()
const { isLoggedIn } = useAuth()

// 기본 재료 목록 (DB에서 가져옴)
const { data: baseData } = await useFetch('/api/ingredients/base', {
  watch: [locale]
})
const categories = computed(() => baseData.value?.categories || [])
const groupedIngredients = computed(() => baseData.value?.grouped || {} as Record<string, BaseIngredient[]>)

// 사용자 재료 목록
const userIngredients = ref<UserIngredient[]>([])
const expiringIngredients = ref<UserIngredient[]>([])
const isLoadingIngredients = ref(false)

// 모달 상태
const showAddModal = ref(false)
const activeCategory = ref<string | null>(null)
const selectedIngredientToAdd = ref<BaseIngredient | null>(null)
const expiryDateInput = ref('')
const searchQuery = ref('')

// 검색 필터링된 재료
const filteredIngredients = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) {
    // 검색어 없으면 카테고리 기반
    if (!activeCategory.value) {
      // "전체" 선택 시 모든 재료
      return Object.values(groupedIngredients.value).flat()
    }
    return groupedIngredients.value[activeCategory.value] || []
  }
  // 검색어 있으면 전체에서 필터링
  return Object.values(groupedIngredients.value)
    .flat()
    .filter((ing: BaseIngredient) => ing.name.toLowerCase().includes(query))
})

// 사용자 재료 로드
async function loadUserIngredients() {
  if (!isLoggedIn.value) return

  isLoadingIngredients.value = true
  try {
    const response = await $fetch<{ ingredients: UserIngredient[], expiring: UserIngredient[] }>('/api/user/ingredients')
    userIngredients.value = response.ingredients
    expiringIngredients.value = response.expiring
  } catch (error) {
    console.error('재료 로드 오류:', error)
  } finally {
    isLoadingIngredients.value = false
  }
}

// 재료 추가
async function addIngredient() {
  if (!selectedIngredientToAdd.value) return

  try {
    await $fetch('/api/user/ingredients', {
      method: 'POST',
      body: {
        ingredientId: selectedIngredientToAdd.value.id,
        expiryDate: expiryDateInput.value || undefined
      }
    })
    await loadUserIngredients()
    closeAddModal()
  } catch (error) {
    console.error('재료 추가 오류:', error)
  }
}

// 재료 삭제
async function removeIngredient(ingredientId: number) {
  try {
    await $fetch(`/api/user/ingredients/${ingredientId}`, {
      method: 'DELETE'
    })
    await loadUserIngredients()
  } catch (error) {
    console.error('재료 삭제 오류:', error)
  }
}

// 모달 관련
function openAddModal() {
  showAddModal.value = true
  activeCategory.value = null
  searchQuery.value = ''
}

function closeAddModal() {
  showAddModal.value = false
  selectedIngredientToAdd.value = null
  expiryDateInput.value = ''
  activeCategory.value = null
  searchQuery.value = ''
}

function selectIngredientToAdd(ing: BaseIngredient) {
  selectedIngredientToAdd.value = ing
}

// 이미 추가된 재료인지 확인
function isAlreadyAdded(ingredientId: number) {
  return userIngredients.value.some(ui => ui.ingredient_id === ingredientId)
}

// D-day 계산
function getDaysLeftText(daysLeft: number | undefined) {
  if (daysLeft === undefined) return ''
  if (daysLeft < 0) return `D+${Math.abs(Math.floor(daysLeft))}`
  if (daysLeft === 0) return 'D-Day'
  return `D-${Math.floor(daysLeft)}`
}

function isExpiringSoon(daysLeft: number | undefined) {
  return daysLeft !== undefined && daysLeft <= 3
}

// 카테고리별 사용자 재료 그룹화
const groupedUserIngredients = computed(() => {
  const groups: Record<string, UserIngredient[]> = {}
  for (const ing of userIngredients.value) {
    const cat = ing.category || t('myFridge.other')
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(ing)
  }
  return groups
})

// 유통기한 입력된 재료가 있는지 확인
const hasExpiryIngredients = computed(() => {
  return userIngredients.value.some(ing => ing.expiry_date !== null)
})

// 레시피 검색으로 이동
function searchRecipesWithIngredients(ingredients: UserIngredient[]) {
  const names = ingredients.map(i => i.name).join(',')
  navigateTo(`/?ingredients=${encodeURIComponent(names)}`)
}

// 로그인 상태 변경 감지
watch(isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    loadUserIngredients()
  } else {
    userIngredients.value = []
    expiringIngredients.value = []
  }
}, { immediate: true })

// locale 변경 시 사용자 재료 리로드
watch(locale, () => {
  if (isLoggedIn.value) {
    loadUserIngredients()
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 상단 헤더 -->
    <AppHeader />

    <main class="max-w-6xl mx-auto px-6 py-8">
      <div class="flex gap-8">
        <!-- 왼쪽: 재료 목록 -->
        <div class="flex-1">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h1 class="text-2xl font-semibold text-gray-900">{{ t('myFridge.title') }}</h1>
              <p class="text-gray-500 mt-1">{{ t('myFridge.ingredientCount', { count: userIngredients.length }) }}</p>
            </div>
            <button
              @click="openAddModal"
              class="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800"
            >
              + {{ t('myFridge.addIngredient') }}
            </button>
          </div>

          <!-- 유통기한 임박 알림 (조건부 표시) -->
          <div
            v-if="hasExpiryIngredients && expiringIngredients.length > 0"
            class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm">⏰</span>
                <div>
                  <p class="font-medium text-red-900">{{ t('myFridge.expiringAlert') }}</p>
                  <p class="text-sm text-red-700">
                    {{ expiringIngredients.map(i => `${i.name} (${getDaysLeftText(i.days_left)})`).join(', ') }}
                  </p>
                </div>
              </div>
              <button
                @click="searchRecipesWithIngredients(expiringIngredients)"
                class="text-sm text-red-700 hover:text-red-900 font-medium"
              >
                {{ t('myFridge.searchWithIngredients') }} →
              </button>
            </div>
          </div>

          <!-- 로딩 상태 -->
          <div v-if="isLoadingIngredients" class="text-center py-12 text-gray-500">
            {{ t('common.loading') }}
          </div>

          <!-- 재료 없음 -->
          <div v-else-if="userIngredients.length === 0" class="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <span class="text-4xl mb-4 block">🥬</span>
            <p class="text-gray-500 mb-4">{{ t('myFridge.noIngredients') }}</p>
            <button
              @click="openAddModal"
              class="text-gray-900 font-medium hover:underline"
            >
              {{ t('myFridge.addIngredientsLink') }} →
            </button>
          </div>

          <!-- 카테고리별 재료 그리드 -->
          <div v-else class="grid grid-cols-2 gap-6">
            <div
              v-for="(items, category) in groupedUserIngredients"
              :key="category"
              class="bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              <div class="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <h2 class="font-medium text-gray-900">{{ category }}</h2>
              </div>
              <div class="p-4">
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="item in items"
                    :key="item.id"
                    class="group relative px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm flex items-center gap-2"
                  >
                    {{ item.name }}
                    <span
                      v-if="item.expiry_date && isExpiringSoon(item.days_left)"
                      class="text-xs text-red-500 font-medium"
                    >
                      {{ getDaysLeftText(item.days_left) }}
                    </span>
                    <button
                      @click="removeIngredient(item.ingredient_id)"
                      class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 오른쪽: 빠른 액션 -->
        <aside class="w-80 flex-shrink-0">
          <div class="bg-white border border-gray-200 rounded-lg sticky top-8">
            <div class="px-4 py-3 border-b border-gray-100">
              <h2 class="font-medium text-gray-900">{{ t('myFridge.quickMenu') }}</h2>
            </div>
            <div class="p-4 space-y-2">
              <button
                @click="searchRecipesWithIngredients(userIngredients)"
                :disabled="userIngredients.length === 0"
                :class="[
                  'w-full py-3 rounded-lg font-medium transition-colors text-left px-4',
                  userIngredients.length > 0
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                ]"
              >
                🔍 {{ t('myFridge.searchWithMyIngredients') }}
              </button>
              <NuxtLink
                to="/"
                class="block w-full py-3 px-4 bg-gray-50 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                🍳 {{ t('dashboard.searchRecipes') }}
              </NuxtLink>
            </div>
          </div>
        </aside>
      </div>
    </main>

    <!-- 재료 추가 모달 -->
    <Teleport to="body">
      <div
        v-if="showAddModal"
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        @click.self="closeAddModal"
      >
        <div class="bg-white w-full max-w-lg rounded-lg h-[70vh] overflow-hidden flex flex-col">
          <!-- 헤더 -->
          <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <h2 class="font-semibold text-lg text-gray-900">{{ t('myFridge.addIngredientModal') }}</h2>
            <button @click="closeAddModal" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">
              ✕
            </button>
          </div>

          <!-- 선택된 재료 표시 -->
          <template v-if="selectedIngredientToAdd">
            <div class="p-4 bg-gray-50 border-b border-gray-100 flex-shrink-0">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-gray-900">{{ selectedIngredientToAdd.name }}</p>
                  <p class="text-sm text-gray-500">{{ selectedIngredientToAdd.category }}</p>
                </div>
                <button
                  @click="selectedIngredientToAdd = null"
                  class="text-sm text-gray-500 hover:text-gray-700"
                >
                  {{ t('myFridge.changeIngredient') }}
                </button>
              </div>
              <div class="mt-4">
                <label class="block text-sm text-gray-600 mb-2">
                  {{ t('myFridge.expiryDateLabel') }} <span class="text-gray-400">{{ t('myFridge.expiryDateOptional') }}</span>
                </label>
                <input
                  v-model="expiryDateInput"
                  type="date"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>
            <div class="p-4 border-t border-gray-100 flex-shrink-0 mt-auto">
              <button
                @click="addIngredient"
                class="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800"
              >
                {{ t('myFridge.addButton') }}
              </button>
            </div>
          </template>

          <!-- 재료 선택 -->
          <template v-else>
            <!-- 검색 입력 -->
            <div class="px-4 pt-3 pb-2 flex-shrink-0">
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="t('myFridge.searchPlaceholder')"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <!-- 카테고리 탭 (검색 중이 아닐 때만) -->
            <div v-if="!searchQuery.trim()" class="px-4 pb-2 flex-shrink-0">
              <div class="flex flex-wrap gap-1.5">
                <button
                  @click="activeCategory = null"
                  :class="[
                    'px-3 py-1 text-xs font-medium rounded-full border transition-colors',
                    activeCategory === null
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  ]"
                >
                  {{ t('myFridge.allIngredients') }}
                </button>
                <button
                  v-for="category in categories"
                  :key="category"
                  @click="activeCategory = category"
                  :class="[
                    'px-3 py-1 text-xs font-medium rounded-full border transition-colors',
                    activeCategory === category
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  ]"
                >
                  {{ category }}
                </button>
              </div>
            </div>

            <!-- 재료 목록 (고정 높이 스크롤) -->
            <div class="flex-1 overflow-y-auto border-t border-gray-100 px-4 py-3">
              <p v-if="searchQuery.trim()" class="text-xs text-gray-400 mb-2">
                {{ t('myFridge.searchResultCount', { count: filteredIngredients.length }) }}
              </p>
              <div v-if="filteredIngredients.length > 0" class="flex flex-wrap gap-2">
                <button
                  v-for="ing in filteredIngredients"
                  :key="ing.id"
                  @click="selectIngredientToAdd(ing)"
                  :disabled="isAlreadyAdded(ing.id)"
                  :class="[
                    'px-3 py-1.5 text-sm rounded-lg transition-colors',
                    isAlreadyAdded(ing.id)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  ]"
                >
                  {{ ing.name }}
                  <span v-if="isAlreadyAdded(ing.id)" class="ml-1 text-xs">✓</span>
                </button>
              </div>
              <p v-else class="text-sm text-gray-400 text-center py-8">
                {{ t('myFridge.noSearchResults') }}
              </p>
            </div>
          </template>
        </div>
      </div>
    </Teleport>
  </div>
</template>
