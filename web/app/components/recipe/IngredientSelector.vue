<script setup lang="ts">
export interface Ingredient {
  id: number
  name: string
  category: string | null
}

const model = defineModel<Ingredient[]>({ default: () => [] })

const activeCategory = ref<string | null>(null)

const { data: baseData } = await useFetch('/api/ingredients/base')

const categories = computed(() => baseData.value?.categories || [])
const groupedIngredients = computed(() => baseData.value?.grouped || {})

const filteredIngredients = computed(() => {
  if (!activeCategory.value) return []
  return groupedIngredients.value[activeCategory.value] || []
})

function toggleIngredient(ingredient: Ingredient) {
  const index = model.value.findIndex(i => i.id === ingredient.id)
  if (index >= 0) {
    model.value.splice(index, 1)
  } else {
    model.value.push(ingredient)
  }
}

function isSelected(ingredient: Ingredient) {
  return model.value.some(i => i.id === ingredient.id)
}
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-lg sticky top-8">
    <div class="px-4 py-3 border-b border-gray-100">
      <h2 class="font-semibold text-gray-900">재료 선택</h2>
      <p class="text-sm text-gray-500 mt-1">냉장고에 있는 재료를 선택하세요</p>
    </div>

    <!-- 선택된 재료 -->
    <div v-if="model.length > 0" class="px-4 py-3 border-b border-gray-100">
      <p class="text-xs text-gray-500 mb-2">선택한 재료 ({{ model.length }})</p>
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
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="category in categories"
          :key="category"
          @click="activeCategory = activeCategory === category ? null : category"
          :class="[
            'px-3 py-1.5 text-sm rounded-lg transition-colors',
            activeCategory === category
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          ]"
        >
          {{ category }}
        </button>
      </div>
    </div>

    <!-- 카테고리 내 재료 -->
    <div class="p-4 max-h-96 overflow-y-auto">
      <div v-if="activeCategory" class="flex flex-wrap gap-1.5">
        <button
          v-for="ing in filteredIngredients"
          :key="ing.id"
          @click="toggleIngredient(ing)"
          :class="[
            'px-3 py-1.5 text-sm rounded-lg transition-colors',
            isSelected(ing)
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          {{ ing.name }}
        </button>
      </div>
      <p v-else class="text-sm text-gray-400 text-center py-4">
        카테고리를 선택해주세요
      </p>
    </div>
  </div>
</template>
