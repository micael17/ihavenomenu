<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

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
      error.value = '요리 이름을 입력해주세요'
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
    error.value = e.data?.message || '저장에 실패했습니다'
  } finally {
    isLoading.value = false
  }
}

// 카테고리 옵션
const categoryOptions = ['한식', '중식', '일식', '양식', '분식', '디저트', '음료', '기타']
const difficultyOptions = [
  { value: 'easy', label: '쉬움' },
  { value: 'medium', label: '보통' },
  { value: 'hard', label: '어려움' }
]
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
          <span v-if="step === 1">기본 정보</span>
          <span v-else-if="step === 2">재료</span>
          <span v-else-if="step === 3">조리법</span>
          <span v-else>완료</span>
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
        <h2 class="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              요리 이름 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="title"
              type="text"
              placeholder="예: 김치볶음밥"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              📺 YouTube 영상 (선택)
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
              <p class="text-sm text-green-600 mt-1">✅ 영상이 연결되었습니다</p>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
              <select
                v-model="category"
                class="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="">선택</option>
                <option v-for="opt in categoryOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">⏱️ 시간</label>
              <select
                v-model="cookingTime"
                class="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="">선택</option>
                <option v-for="t in timeOptions" :key="t" :value="t">{{ t }}분</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">🔥 난이도</label>
              <select
                v-model="difficulty"
                class="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="">선택</option>
                <option v-for="d in difficultyOptions" :key="d.value" :value="d.value">{{ d.label }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: 재료 -->
      <div v-else-if="step === 2" class="bg-white rounded-2xl p-5 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">재료</h2>

        <!-- 검색 -->
        <div class="mb-4">
          <div class="flex gap-2">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="🔍 재료 검색..."
              class="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <button
              v-if="searchQuery"
              @click="addCustomIngredient"
              class="px-4 py-3 bg-gray-100 rounded-xl text-sm font-medium"
            >
              추가
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
          <p class="text-sm text-gray-500 mb-2">선택한 재료 ({{ selectedIngredients.length }})</p>

          <div v-if="selectedIngredients.length === 0" class="text-center py-6 text-gray-400">
            재료를 선택해주세요
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
                placeholder="양 (예: 200g)"
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
        <h2 class="text-lg font-semibold text-gray-900 mb-4">조리법</h2>

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
                placeholder="조리 과정을 입력하세요..."
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
          + 단계 추가
        </button>
      </div>

      <!-- Step 4: 미리보기 & 완료 -->
      <div v-else-if="step === 4" class="bg-white rounded-2xl p-5 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">미리보기</h2>

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
          <span v-if="category">{{ category }}</span>
          <span v-if="cookingTime">• {{ cookingTime }}분</span>
          <span v-if="difficulty">
            • {{ difficulty === 'easy' ? '쉬움' : difficulty === 'medium' ? '보통' : '어려움' }}
          </span>
        </div>

        <!-- 재료 -->
        <div class="mt-4">
          <p class="text-sm font-medium text-gray-700 mb-2">🥕 재료 ({{ selectedIngredients.length }})</p>
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
          <p class="text-sm font-medium text-gray-700 mb-2">📋 조리법</p>
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
          ← 이전
        </button>
        <button
          v-if="step < totalSteps"
          @click="nextStep"
          class="flex-1 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800"
        >
          다음 →
        </button>
        <button
          v-else
          @click="saveRecipe"
          :disabled="isLoading"
          class="flex-1 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:bg-gray-300"
        >
          <span v-if="isLoading">저장 중...</span>
          <span v-else>🚀 레시피 등록</span>
        </button>
      </div>
    </main>
  </div>
</template>
