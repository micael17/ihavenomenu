<script setup lang="ts">
const { t } = useI18n()

export interface Ingredient {
  id: number
  name: string
  category: string | null
}

const model = defineModel<Ingredient[]>({ default: () => [] })

const props = defineProps<{
  myIngredients?: Ingredient[]
  excludedIds?: Set<number>
}>()

const emit = defineEmits<{
  toggleExclude: [ingredient: Ingredient]
}>()

const activeCategory = ref<string | null>(null)

const { data: baseData } = await useFetch('/api/ingredients/base')

const categories = computed(() => baseData.value?.categories || [])
const groupedIngredients = computed(() => baseData.value?.grouped || {})

const filteredIngredients = computed(() => {
  if (!activeCategory.value) return []
  return groupedIngredients.value[activeCategory.value] || []
})

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

    <!-- 카테고리 탭 -->
    <div class="px-4 py-3 border-b border-gray-100">
      <p class="text-xs font-medium text-gray-500 mb-2">{{ t('ingredient.category') }}</p>
      <div class="flex flex-wrap gap-1.5">
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
      <div v-if="activeCategory" class="flex flex-wrap gap-1.5">
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
  </div>
</template>
