<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { t } = useI18n()

interface SelectedIngredient {
  ingredient_id?: number
  custom_name?: string
  name: string
  amount: string
  is_main: boolean
}

interface RecipeStep {
  description: string
}

// 상태
const step = ref(1)
const totalSteps = 4
const isLoading = ref(false)
const error = ref('')

// Step 1: 기본 정보
const title = ref('')
const youtubeUrl = ref('')
const youtubeVideoId = ref('')
const youtubeThumbnail = ref('')
const category = ref('')
const cookingTime = ref('')
const difficulty = ref('')

// Step 2: 재료
const selectedIngredients = ref<SelectedIngredient[]>([])
const searchQuery = ref('')
const activeCategory = ref<string | null>(null)

// Step 3: 조리법
const recipeSteps = ref<RecipeStep[]>([{ description: '' }])

// 기본 재료 데이터
const { data: baseData } = await useFetch('/api/ingredients/base')
const categories = computed(() => baseData.value?.categories || [])
const groupedIngredients = computed(() => baseData.value?.grouped || {})

const filteredIngredients = computed(() => {
  if (!activeCategory.value) return []
  let list = groupedIngredients.value[activeCategory.value] || []

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    list = list.filter((ing: any) => ing.name.toLowerCase().includes(query))
  }

  return list
})

// YouTube URL 파싱
function parseYoutubeUrl() {
  const url = youtubeUrl.value.trim()
  if (!url) {
    youtubeVideoId.value = ''
    youtubeThumbnail.value = ''
    return
  }

  // YouTube URL 파싱
  let videoId = ''

  // youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/)
  if (shortMatch?.[1]) videoId = shortMatch[1]

  // youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([^&]+)/)
  if (watchMatch?.[1]) videoId = watchMatch[1]

  // youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/embed\/([^?&]+)/)
  if (embedMatch?.[1]) videoId = embedMatch[1]

  if (videoId) {
    youtubeVideoId.value = videoId
    youtubeThumbnail.value = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  }
}

// 재료 추가
function addIngredient(ing: any) {
  if (selectedIngredients.value.some(s => s.ingredient_id === ing.id)) return

  selectedIngredients.value.push({
    ingredient_id: ing.id,
    name: ing.name,
    amount: '',
    is_main: selectedIngredients.value.length < 3 // 처음 3개는 주재료
  })
}

function removeIngredient(index: number) {
  selectedIngredients.value.splice(index, 1)
}

function addCustomIngredient() {
  if (!searchQuery.value.trim()) return

  selectedIngredients.value.push({
    custom_name: searchQuery.value.trim(),
    name: searchQuery.value.trim(),
    amount: '',
    is_main: false
  })
  searchQuery.value = ''
}

// 조리법 단계 관리
function addStep() {
  recipeSteps.value.push({ description: '' })
}

function removeStep(index: number) {
  if (recipeSteps.value.length > 1) {
    recipeSteps.value.splice(index, 1)
  }
}

// 단계 이동
function nextStep() {
  if (step.value === 1) {
    if (!title.value.trim()) {
      error.value = t('creator.recipeNameRequired')
      return
    }
    error.value = ''
  }
  if (step.value < totalSteps) step.value++
}

function prevStep() {
  if (step.value > 1) step.value--
}

// 레시피 저장
async function saveRecipe() {
  isLoading.value = true
  error.value = ''

  try {
    const ingredients = selectedIngredients.value.map(ing => ({
      ingredient_id: ing.ingredient_id,
      custom_name: ing.custom_name,
      amount: ing.amount,
      is_main: ing.is_main
    }))

    const steps = recipeSteps.value
      .filter(s => s.description.trim())
      .map(s => ({ description: s.description.trim() }))

    const response = await $fetch('/api/recipes', {
      method: 'POST',
      body: {
        title: title.value.trim(),
        category: category.value || undefined,
        cookingTime: cookingTime.value ? Number(cookingTime.value) : undefined,
        difficulty: difficulty.value || undefined,
        youtubeVideoId: youtubeVideoId.value || undefined,
        youtubeThumbnail: youtubeThumbnail.value || undefined,
        ingredients,
        steps
      }
    })

    navigateTo(`/creator/recipes`)
  } catch (e: any) {
    error.value = e.data?.message || t('creator.saveFailed')
  } finally {
    isLoading.value = false
  }
}

// 카테고리 옵션
const categoryKeys = ['korean', 'chinese', 'japanese', 'western', 'snack', 'dessert', 'beverage', 'other']
const difficultyKeys = ['easy', 'medium', 'hard']
const timeOptions = ['5', '10', '15', '20', '30', '45', '60', '90', '120']
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <main class="max-w-lg mx-auto px-4 py-6">
      <!-- 진행 바 -->
      <div class="mb-6">
        <div class="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>{{ step }} / {{ totalSteps }}</span>
          <span v-if="step === 1">{{ t('creator.basicInfo') }}</span>
          <span v-else-if="step === 2">{{ t('creator.ingredients') }}</span>
          <span v-else-if="step === 3">{{ t('creator.cookingSteps') }}</span>
          <span v-else>{{ t('creator.preview') }}</span>
        </div>
        <div class="h-1 bg-gray-200 rounded-full">
          <div
            class="h-1 bg-gray-900 rounded-full transition-all"
            :style="{ width: `${(step / totalSteps) * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- Step 1: 기본 정보 -->
      <div v-if="step === 1" class="bg-white rounded-2xl p-5 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ t('creator.basicInfo') }}</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ t('creator.recipeName') }} <span class="text-red-500">*</span>
            </label>
            <input
              v-model="title"
              type="text"
              :placeholder="t('creator.recipeNamePlaceholder')"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              📺 {{ t('creator.youtubeVideo') }}
            </label>
            <input
              v-model="youtubeUrl"
              type="url"
              placeholder="https://youtu.be/..."
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
              @blur="parseYoutubeUrl"
            />
            <div v-if="youtubeThumbnail" class="mt-2 rounded-lg overflow-hidden">
              <img :src="youtubeThumbnail" class="w-full aspect-video object-cover" />
              <p class="text-sm text-green-600 mt-1">{{ t('creator.videoLinked') }}</p>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('creator.categoryLabel') }}</label>
              <select
                v-model="category"
                class="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="">{{ t('creator.selectOption') }}</option>
                <option v-for="key in categoryKeys" :key="key" :value="key">{{ t(`creator.categories.${key}`) }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">⏱️ {{ t('creator.timeLabel') }}</label>
              <select
                v-model="cookingTime"
                class="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="">{{ t('creator.selectOption') }}</option>
                <option v-for="time in timeOptions" :key="time" :value="time">{{ time }}{{ t('common.minutes') }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">🔥 {{ t('creator.difficultyLabel') }}</label>
              <select
                v-model="difficulty"
                class="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="">{{ t('creator.selectOption') }}</option>
                <option v-for="key in difficultyKeys" :key="key" :value="key">{{ t(`creator.difficulty.${key}`) }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: 재료 -->
      <div v-else-if="step === 2" class="bg-white rounded-2xl p-5 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ t('creator.ingredients') }}</h2>

        <!-- 검색 -->
        <div class="mb-4">
          <div class="flex gap-2">
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('creator.searchIngredients')"
              class="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <button
              v-if="searchQuery"
              @click="addCustomIngredient"
              class="px-4 py-3 bg-gray-100 rounded-xl text-sm font-medium"
            >
              {{ t('creator.addCustom') }}
            </button>
          </div>
        </div>

        <!-- 카테고리 탭 -->
        <div class="flex flex-wrap gap-2 mb-4">
          <button
            v-for="cat in categories"
            :key="cat"
            @click="activeCategory = activeCategory === cat ? null : cat"
            :class="[
              'px-3 py-1.5 text-sm rounded-lg transition-colors',
              activeCategory === cat
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600'
            ]"
          >
            {{ cat }}
          </button>
        </div>

        <!-- 재료 목록 -->
        <div v-if="activeCategory" class="flex flex-wrap gap-2 mb-4 max-h-32 overflow-y-auto">
          <button
            v-for="ing in filteredIngredients"
            :key="ing.id"
            @click="addIngredient(ing)"
            :disabled="selectedIngredients.some(s => s.ingredient_id === ing.id)"
            :class="[
              'px-3 py-1.5 text-sm rounded-lg transition-colors',
              selectedIngredients.some(s => s.ingredient_id === ing.id)
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700'
            ]"
          >
            {{ ing.name }}
          </button>
        </div>

        <!-- 선택된 재료 -->
        <div class="border-t border-gray-200 pt-4">
          <p class="text-sm text-gray-500 mb-2">{{ t('creator.selectedIngredients', { count: selectedIngredients.length }) }}</p>

          <div v-if="selectedIngredients.length === 0" class="text-center py-6 text-gray-400">
            {{ t('creator.selectIngredientsPlease') }}
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="(ing, index) in selectedIngredients"
              :key="index"
              class="flex items-center gap-2 bg-gray-50 p-3 rounded-lg"
            >
              <span class="font-medium text-gray-900 flex-shrink-0">{{ ing.name }}</span>
              <input
                v-model="ing.amount"
                type="text"
                :placeholder="t('creator.amount')"
                class="flex-1 px-2 py-1 border border-gray-200 rounded text-sm"
              />
              <button
                @click="removeIngredient(index)"
                class="text-gray-400 hover:text-red-500 flex-shrink-0"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: 조리법 -->
      <div v-else-if="step === 3" class="bg-white rounded-2xl p-5 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ t('creator.cookingSteps') }}</h2>

        <div class="space-y-3">
          <div
            v-for="(recipeStep, index) in recipeSteps"
            :key="index"
            class="flex gap-3"
          >
            <div class="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
              {{ index + 1 }}
            </div>
            <div class="flex-1">
              <textarea
                v-model="recipeStep.description"
                :placeholder="t('creator.enterCookingStep')"
                rows="2"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              ></textarea>
            </div>
            <button
              v-if="recipeSteps.length > 1"
              @click="removeStep(index)"
              class="text-gray-400 hover:text-red-500 flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>

        <button
          @click="addStep"
          class="w-full mt-4 py-3 border border-dashed border-gray-300 rounded-xl text-gray-500 hover:bg-gray-50"
        >
          {{ t('creator.addStep') }}
        </button>
      </div>

      <!-- Step 4: 미리보기 & 완료 -->
      <div v-else-if="step === 4" class="bg-white rounded-2xl p-5 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ t('creator.preview') }}</h2>

        <!-- 썸네일 -->
        <div v-if="youtubeThumbnail" class="rounded-lg overflow-hidden mb-4">
          <img :src="youtubeThumbnail" class="w-full aspect-video object-cover" />
        </div>
        <div v-else class="bg-gray-100 rounded-lg aspect-video flex items-center justify-center mb-4">
          <span class="text-4xl">🍳</span>
        </div>

        <!-- 제목 -->
        <h3 class="text-xl font-semibold text-gray-900">{{ title }}</h3>
        <div class="flex items-center gap-2 text-sm text-gray-500 mt-1">
          <span v-if="category">{{ t(`creator.categories.${category}`) }}</span>
          <span v-if="cookingTime">• {{ cookingTime }}{{ t('common.minutes') }}</span>
          <span v-if="difficulty">
            • {{ t(`creator.difficulty.${difficulty}`) }}
          </span>
        </div>

        <!-- 재료 -->
        <div class="mt-4">
          <p class="text-sm font-medium text-gray-700 mb-2">{{ t('creator.ingredientsPreview', { count: selectedIngredients.length }) }}</p>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="ing in selectedIngredients"
              :key="ing.name"
              class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
            >
              {{ ing.name }} {{ ing.amount }}
            </span>
          </div>
        </div>

        <!-- 조리법 -->
        <div class="mt-4">
          <p class="text-sm font-medium text-gray-700 mb-2">{{ t('creator.cookingStepsPreview') }}</p>
          <div class="space-y-2">
            <div
              v-for="(s, i) in recipeSteps.filter(s => s.description.trim())"
              :key="i"
              class="flex gap-2 text-sm"
            >
              <span class="text-gray-400">{{ i + 1 }}.</span>
              <span class="text-gray-700">{{ s.description }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 에러 메시지 -->
      <p v-if="error" class="text-red-500 text-sm mt-4 text-center">{{ error }}</p>

      <!-- 버튼 -->
      <div class="flex gap-3 mt-6">
        <button
          v-if="step > 1"
          @click="prevStep"
          class="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
        >
          {{ t('creator.previous') }}
        </button>
        <button
          v-if="step < totalSteps"
          @click="nextStep"
          class="flex-1 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800"
        >
          {{ t('creator.nextStep') }}
        </button>
        <button
          v-else
          @click="saveRecipe"
          :disabled="isLoading"
          class="flex-1 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:bg-gray-300"
        >
          <span v-if="isLoading">{{ t('creator.saving') }}</span>
          <span v-else>{{ t('creator.publishRecipe') }}</span>
        </button>
      </div>
    </main>
  </div>
</template>
