<script setup lang="ts">
import type { CuisinePreference } from '~/composables/useRecipeSearch'

const { t, locale } = useI18n()

export interface Ingredient {
  id: number
  name: string
  category: string | null
}

const model = defineModel<Ingredient[]>({ default: () => [] })
const cuisineModel = defineModel<CuisinePreference>('cuisine', { default: 'mixed' })
const subCategoryModel = defineModel<string | null>('subCategory', { default: null })

const props = defineProps<{
  myIngredients?: Ingredient[]
  excludedIds?: Set<number>
}>()

const emit = defineEmits<{
  toggleExclude: [ingredient: Ingredient]
}>()

const cuisineOptions = computed(() => [
  { value: 'mixed' as CuisinePreference, label: t('ingredient.cuisineMixed') },
  { value: 'western' as CuisinePreference, label: t('ingredient.cuisineWestern') },
  { value: 'dessert' as CuisinePreference, label: t('ingredient.cuisineDessert') },
  { value: 'korean' as CuisinePreference, label: t('ingredient.cuisineKorean') }
])

const subCategoryMap: Record<string, { value: string; labelKey: string }[]> = {
  korean: [
    { value: '밑반찬', labelKey: 'ingredient.subKoreanSide' },
    { value: '메인반찬', labelKey: 'ingredient.subKoreanMain' },
    { value: '국/탕', labelKey: 'ingredient.subKoreanSoup' },
    { value: '찌개', labelKey: 'ingredient.subKoreanStew' },
    { value: '밥/죽/떡', labelKey: 'ingredient.subKoreanRice' },
    { value: '면/만두', labelKey: 'ingredient.subKoreanNoodle' },
    { value: '김치/젓갈/장류', labelKey: 'ingredient.subKoreanKimchi' }
  ]
}

const currentSubCategories = computed(() => subCategoryMap[cuisineModel.value] || [])

function selectCuisine(value: CuisinePreference) {
  if (cuisineModel.value !== value) {
    subCategoryModel.value = null
  }
  cuisineModel.value = value
}

function toggleSubCategory(value: string) {
  subCategoryModel.value = subCategoryModel.value === value ? null : value
}

const activeCategory = ref<string | null>(null)
const searchQuery = ref('')
const searchResults = ref<Ingredient[]>([])
const isSearchingIngredients = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | null = null

const { data: baseData } = await useFetch('/api/ingredients/base', {
  watch: [locale]
})

const categories = computed(() => baseData.value?.categories || [])
const groupedIngredients = computed(() => baseData.value?.grouped || {})

const filteredIngredients = computed(() => {
  if (!activeCategory.value) return []
  return groupedIngredients.value[activeCategory.value] || []
})

const isSearchActive = computed(() => searchQuery.value.trim().length > 0)

async function doIngredientSearch(q: string) {
  const trimmed = q.trim()
  if (!trimmed) {
    searchResults.value = []
    isSearchingIngredients.value = false
    return
  }

  isSearchingIngredients.value = true
  try {
    const response = await $fetch<{ results: Ingredient[] }>('/api/ingredients/search', {
      query: { q: trimmed }
    })
    searchResults.value = response.results || []
  } catch {
    searchResults.value = []
  } finally {
    isSearchingIngredients.value = false
  }
}

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    doIngredientSearch(searchQuery.value)
  }, 250)
}

function clearSearch() {
  searchQuery.value = ''
  searchResults.value = []
  if (searchTimer) clearTimeout(searchTimer)
}

// 내 재료인지 확인
function isMyIngredient(ingredient: Ingredient) {
  return props.myIngredients?.some(i => i.id === ingredient.id) ?? false
}

// 내 재료가 임시 제외되었는지 확인
function isExcluded(ingredientId: number) {
  return props.excludedIds?.has(ingredientId) ?? false
}

// 전체 선택된 재료인지 확인 (내 재료(제외 안된) + 선택한 재료)
function isSelected(ingredient: Ingredient) {
  if (isMyIngredient(ingredient)) {
    return !isExcluded(ingredient.id)
  }
  return model.value.some(i => i.id === ingredient.id)
}

// 카테고리 하위 재료 클릭 시
function toggleIngredient(ingredient: Ingredient) {
  // 내 재료인 경우 임시 제외 토글
  if (isMyIngredient(ingredient)) {
    emit('toggleExclude', ingredient)
    return
  }

  // 선택한 재료인 경우
  const index = model.value.findIndex(i => i.id === ingredient.id)
  if (index >= 0) {
    model.value.splice(index, 1)
  } else {
    model.value.push(ingredient)
  }
}

// 내 재료 임시 제외 토글
function toggleExcludeMyIngredient(ingredient: Ingredient) {
  emit('toggleExclude', ingredient)
}
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-lg sticky top-8">
    <div class="px-4 py-3 border-b border-gray-100">
      <h2 class="font-semibold text-gray-900">{{ t('ingredient.selectTitle') }}</h2>
      <p class="text-sm text-gray-500 mt-1">{{ t('ingredient.selectSubtitle') }}</p>
    </div>

    <!-- 레시피 스타일 -->
    <div class="px-4 py-3 border-b border-gray-100">
      <p class="text-xs font-medium text-gray-500 mb-2">{{ t('ingredient.cuisineLabel') }}</p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="option in cuisineOptions"
          :key="option.value"
          @click="selectCuisine(option.value)"
          :class="[
            'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border',
            cuisineModel === option.value
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
          ]"
        >
          {{ option.label }}
        </button>
      </div>
      <!-- 세부 카테고리 -->
      <div v-if="currentSubCategories.length > 0" class="flex flex-wrap gap-1 mt-2">
        <button
          v-for="sub in currentSubCategories"
          :key="sub.value"
          @click="toggleSubCategory(sub.value)"
          :class="[
            'px-2 py-1 text-xs rounded-md transition-colors border',
            subCategoryModel === sub.value
              ? 'bg-gray-700 text-white border-gray-700'
              : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
          ]"
        >
          {{ t(sub.labelKey) }}
        </button>
      </div>
    </div>

    <!-- 내 재료 -->
    <div v-if="myIngredients && myIngredients.length > 0" class="px-4 py-3 border-b border-gray-100">
      <p class="text-xs text-gray-500 mb-2">{{ t('ingredient.myIngredients') }} ({{ myIngredients.length }})</p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="ing in myIngredients"
          :key="ing.id"
          @click="toggleExcludeMyIngredient(ing)"
          :class="[
            'px-2.5 py-1 text-sm rounded-lg flex items-center gap-1 transition-all',
            isExcluded(ing.id)
              ? 'bg-gray-200 text-gray-400 line-through'
              : 'bg-emerald-600 text-white'
          ]"
        >
          {{ ing.name }}
        </button>
      </div>
      <p v-if="excludedIds && excludedIds.size > 0" class="text-xs text-gray-400 mt-2">
        {{ t('ingredient.reincludeHint') }}
      </p>
    </div>

    <!-- 선택한 재료 -->
    <div v-if="model.length > 0" class="px-4 py-3 border-b border-gray-100">
      <p class="text-xs text-gray-500 mb-2">{{ t('ingredient.selectedIngredients') }} ({{ model.length }})</p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="ing in model"
          :key="ing.id"
          @click="toggleIngredient(ing)"
          class="px-2.5 py-1 bg-gray-900 text-white text-sm rounded-lg flex items-center gap-1"
        >
          {{ ing.name }}
          <span class="text-gray-400">×</span>
        </button>
      </div>
    </div>

    <!-- 재료 검색 -->
    <div class="px-4 py-3 border-b border-gray-100">
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchQuery"
          @input="onSearchInput"
          type="text"
          :placeholder="t('ingredient.searchPlaceholder')"
          class="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
        <button
          v-if="searchQuery"
          @click="clearSearch"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 검색 결과 (검색 활성 시) -->
    <template v-if="isSearchActive">
      <div class="p-4 max-h-96 overflow-y-auto">
        <div v-if="isSearchingIngredients" class="text-center py-4">
          <div class="inline-block animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-600"></div>
        </div>
        <div v-else-if="searchResults.length > 0">
          <p class="text-xs text-gray-500 mb-2">{{ t('ingredient.searchResultCount', { count: searchResults.length }) }}</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="ing in searchResults"
              :key="ing.id"
              @click="toggleIngredient(ing)"
              :class="[
                'px-3 py-1.5 text-sm rounded-lg transition-colors',
                isMyIngredient(ing)
                  ? isExcluded(ing.id)
                    ? 'bg-gray-200 text-gray-400 line-through'
                    : 'bg-emerald-600 text-white'
                  : isSelected(ing)
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              <span>{{ ing.name }}</span>
              <span v-if="ing.category" class="text-[10px] opacity-60 ml-1">{{ ing.category }}</span>
            </button>
          </div>
        </div>
        <p v-else class="text-sm text-gray-400 text-center py-4">
          {{ t('ingredient.noSearchResults') }}
        </p>
      </div>
    </template>

    <!-- 카테고리 브라우저 (검색 비활성 시) -->
    <template v-else>
      <!-- 카테고리 탭 -->
      <div class="px-4 py-3 border-b border-gray-100">
        <p class="text-xs font-medium text-gray-500 mb-2">{{ t('ingredient.category') }}</p>
        <div data-testid="category-list" class="flex flex-wrap gap-1.5">
          <button
            v-for="category in categories"
            :key="category"
            @click="activeCategory = activeCategory === category ? null : category"
            :class="[
              'px-3 py-1.5 text-sm rounded-lg transition-colors border',
              activeCategory === category
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            ]"
          >
            {{ category }}
          </button>
        </div>
      </div>

      <!-- 카테고리 내 재료 -->
      <div class="p-4 max-h-96 overflow-y-auto">
        <p v-if="activeCategory" class="text-xs font-medium text-gray-500 mb-2">{{ t('ingredient.categoryItems', { category: activeCategory }) }}</p>
        <div v-if="activeCategory" data-testid="ingredient-list" class="flex flex-wrap gap-1.5">
          <button
            v-for="ing in filteredIngredients"
            :key="ing.id"
            @click="toggleIngredient(ing)"
            :class="[
              'px-3 py-1.5 text-sm rounded-lg transition-colors',
              isMyIngredient(ing)
                ? isExcluded(ing.id)
                  ? 'bg-gray-200 text-gray-400 line-through'
                  : 'bg-emerald-600 text-white'
                : isSelected(ing)
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            ]"
          >
            {{ ing.name }}
          </button>
        </div>
        <p v-else class="text-sm text-gray-400 text-center py-4">
          {{ t('ingredient.selectCategoryHint') }}
        </p>
      </div>
    </template>
  </div>
</template>
