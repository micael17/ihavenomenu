<script setup lang="ts">
definePageMeta({
  layout: false
})

const { user, isLoggedIn, fetchUser } = useAuth()

// 온보딩 완료된 사용자는 홈으로
watchEffect(() => {
  if (user.value?.onboarding_completed) {
    navigateTo('/')
  }
})

const step = ref(1)
const totalSteps = 4
const direction = ref<'forward' | 'backward'>('forward')

// Step 1: 닉네임
const nickname = ref('')
const nicknameError = ref('')
const isRolling = ref(false)

// 랜덤 닉네임 생성용 단어들
const adjectives = [
  '배고픈', '행복한', '매콤한', '달콤한', '시원한',
  '뜨거운', '졸린', '신나는', '웃기는', '귀여운',
  '용감한', '느긋한', '부지런한', '똑똑한', '엉뚱한',
  '수줍은', '당당한', '호기심많은', '활발한', '차분한'
]

const nouns = [
  '페퍼로니', '치즈', '냉장고', '김치', '떡볶이',
  '파스타', '주먹밥', '고추장', '라면', '만두',
  '샌드위치', '초밥', '햄버거', '타코', '카레',
  '짜장면', '피자', '도넛', '케이크', '쿠키'
]

function generateRandomNickname() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = String(Math.floor(Math.random() * 99) + 1).padStart(2, '0')
  return `${adj}${noun}${num}`
}

async function rollNickname() {
  isRolling.value = true

  // 여러 번 빠르게 바뀌는 효과
  const iterations = 8
  for (let i = 0; i < iterations; i++) {
    nickname.value = generateRandomNickname()
    await new Promise(r => setTimeout(r, 80 + i * 20))
  }

  nicknameError.value = ''
  isRolling.value = false
}

// Step 2: 좋아하는 요리
const favoriteDishes = ref<string[]>([])
const dishOptions = [
  '김치찌개', '된장찌개', '비빔밥', '불고기', '삼겹살',
  '파스타', '스시', '라멘', '짜장면', '탕수육',
  '피자', '햄버거', '샐러드', '스테이크', '카레',
  '쌀국수', '떡볶이', '치킨', '갈비찜', '해물탕'
]

// Step 3: 싫어하는 재료
const dislikedIngredients = ref<string[]>([])
const ingredientOptions = [
  '고수', '민트', '올리브', '치즈', '버섯',
  '해산물', '돼지고기', '소고기', '닭고기', '계란',
  '우유', '견과류', '매운 음식', '생선', '조개'
]

// Step 4: 내 재료
interface IngredientOption {
  id: number
  name: string
  category: string | null
}

const myIngredients = ref<{
  main: IngredientOption | null
  sauce: IngredientOption | null
  grain: IngredientOption | null
}>({
  main: null,
  sauce: null,
  grain: null
})

// 카테고리별 재료 목록
const categoryGroups = {
  main: ['육류', '해물류', '채소류'],
  sauce: ['양념류'],
  grain: ['곡류']
}

// 기본 재료 목록 로드
const { data: baseIngredients } = await useFetch('/api/ingredients/base')

// 카테고리별 필터링된 재료
const mainIngredients = computed(() => {
  if (!baseIngredients.value?.ingredients) return []
  return baseIngredients.value.ingredients.filter(
    (i) => i.category && categoryGroups.main.includes(i.category)
  ) as IngredientOption[]
})

const sauceIngredients = computed(() => {
  if (!baseIngredients.value?.ingredients) return []
  return baseIngredients.value.ingredients.filter(
    (i) => i.category && categoryGroups.sauce.includes(i.category)
  ) as IngredientOption[]
})

const grainIngredients = computed(() => {
  if (!baseIngredients.value?.ingredients) return []
  return baseIngredients.value.ingredients.filter(
    (i) => i.category && categoryGroups.grain.includes(i.category)
  ) as IngredientOption[]
})

// 검색어 상태
const searchQueries = ref({
  main: '',
  sauce: '',
  grain: ''
})

// 검색 결과 상태
const searchResults = ref<{
  main: IngredientOption[]
  sauce: IngredientOption[]
  grain: IngredientOption[]
}>({
  main: [],
  sauce: [],
  grain: []
})

// 드롭다운 열림 상태
const dropdownOpen = ref<{
  main: boolean
  sauce: boolean
  grain: boolean
}>({
  main: false,
  sauce: false,
  grain: false
})

// 검색 함수
async function searchIngredients(type: 'main' | 'sauce' | 'grain') {
  const query = searchQueries.value[type].trim()
  if (!query) {
    searchResults.value[type] = []
    return
  }

  const categories = categoryGroups[type].join(',')
  const { results } = await $fetch('/api/ingredients/search', {
    query: { q: query, categories }
  })
  searchResults.value[type] = (results || []) as IngredientOption[]
}

// 디바운스된 검색
let searchTimeouts: Record<string, NodeJS.Timeout | null> = {
  main: null,
  sauce: null,
  grain: null
}

function debouncedSearch(type: 'main' | 'sauce' | 'grain') {
  if (searchTimeouts[type]) {
    clearTimeout(searchTimeouts[type]!)
  }
  searchTimeouts[type] = setTimeout(() => {
    searchIngredients(type)
  }, 200)
}

// 재료 선택
function selectIngredient(type: 'main' | 'sauce' | 'grain', ingredient: IngredientOption) {
  myIngredients.value[type] = ingredient
  searchQueries.value[type] = ''
  searchResults.value[type] = []
  dropdownOpen.value[type] = false
}

// 재료 선택 해제
function clearIngredient(type: 'main' | 'sauce' | 'grain') {
  myIngredients.value[type] = null
}

// 드롭다운 토글
function toggleDropdown(type: 'main' | 'sauce' | 'grain') {
  dropdownOpen.value[type] = !dropdownOpen.value[type]
  // 다른 드롭다운 닫기
  Object.keys(dropdownOpen.value).forEach(key => {
    if (key !== type) dropdownOpen.value[key as 'main' | 'sauce' | 'grain'] = false
  })
}

// 외부 클릭 시 드롭다운 닫기
function closeAllDropdowns() {
  dropdownOpen.value.main = false
  dropdownOpen.value.sauce = false
  dropdownOpen.value.grain = false
}

const isSubmitting = ref(false)

function validateNickname() {
  if (nickname.value.trim().length < 2) {
    nicknameError.value = '2자 이상 입력해주세요'
    return false
  }
  if (nickname.value.trim().length > 10) {
    nicknameError.value = '10자 이하로 입력해주세요'
    return false
  }
  nicknameError.value = ''
  return true
}

function nextStep() {
  if (step.value === 1 && !validateNickname()) return

  direction.value = 'forward'
  step.value++
}

function isLastStep() {
  return step.value === totalSteps
}

function prevStep() {
  direction.value = 'backward'
  step.value--
}

function toggleDish(dish: string) {
  const index = favoriteDishes.value.indexOf(dish)
  if (index >= 0) {
    favoriteDishes.value.splice(index, 1)
  } else {
    favoriteDishes.value.push(dish)
  }
}

function toggleIngredient(ingredient: string) {
  const index = dislikedIngredients.value.indexOf(ingredient)
  if (index >= 0) {
    dislikedIngredients.value.splice(index, 1)
  } else {
    dislikedIngredients.value.push(ingredient)
  }
}

async function completeOnboarding() {
  isSubmitting.value = true
  try {
    // 내 재료 ID 추출
    const myIngredientsData: {
      main?: number
      sauce?: number
      grain?: number
    } = {}

    if (myIngredients.value.main) {
      myIngredientsData.main = myIngredients.value.main.id
    }
    if (myIngredients.value.sauce) {
      myIngredientsData.sauce = myIngredients.value.sauce.id
    }
    if (myIngredients.value.grain) {
      myIngredientsData.grain = myIngredients.value.grain.id
    }

    await $fetch('/api/auth/onboarding', {
      method: 'POST',
      body: {
        nickname: nickname.value.trim(),
        favoriteDishes: favoriteDishes.value,
        dislikedIngredients: dislikedIngredients.value,
        myIngredients: Object.keys(myIngredientsData).length > 0 ? myIngredientsData : undefined
      }
    })
    await fetchUser()
    navigateTo('/')
  } catch (error: any) {
    console.error('온보딩 오류:', error)
    alert(error.data?.message || '오류가 발생했습니다')
  } finally {
    isSubmitting.value = false
  }
}

// 키보드 이벤트
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && step.value === 1) {
    nextStep()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="min-h-screen bg-white flex flex-col">
    <!-- 진행 표시 -->
    <div class="pt-8 px-6">
      <div class="max-w-md mx-auto flex justify-center gap-2">
        <div
          v-for="i in totalSteps"
          :key="i"
          :class="[
            'h-1 rounded-full transition-all duration-500',
            i <= step ? 'bg-gray-900 w-8' : 'bg-gray-200 w-2'
          ]"
        />
      </div>
    </div>

    <!-- 메인 콘텐츠 -->
    <div class="flex-1 flex items-center justify-center px-6 py-12">
      <div class="w-full max-w-md">
        <!-- Step 1: 닉네임 -->
        <Transition
          :name="direction === 'forward' ? 'slide-left' : 'slide-right'"
          mode="out-in"
        >
          <div v-if="step === 1" key="step1" class="text-center">
            <h1 class="text-2xl font-semibold text-gray-900 mb-2 animate-fade-in">
              어떻게 불러드릴까요?
            </h1>
            <p class="text-gray-500 mb-8 animate-fade-in-delay">
              다른 사용자에게 보여질 이름이에요
            </p>

            <div class="relative mb-6">
              <div class="flex items-center gap-3">
                <input
                  v-model="nickname"
                  type="text"
                  placeholder="닉네임"
                  maxlength="10"
                  :class="[
                    'flex-1 text-center text-2xl font-medium py-4 border-b-2 outline-none transition-all bg-transparent',
                    nicknameError ? 'border-red-400' : 'border-gray-200 focus:border-gray-900'
                  ]"
                  autofocus
                />
                <button
                  @click="rollNickname"
                  :disabled="isRolling"
                  :class="[
                    'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
                    isRolling
                      ? 'bg-gray-100 text-gray-400'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-110 active:scale-95'
                  ]"
                  title="랜덤 닉네임"
                >
                  <svg
                    :class="['w-6 h-6', isRolling && 'animate-spin-dice']"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7.5 18c-.83 0-1.5-.67-1.5-1.5S6.67 15 7.5 15s1.5.67 1.5 1.5S8.33 18 7.5 18zm0-9C6.67 9 6 8.33 6 7.5S6.67 6 7.5 6 9 6.67 9 7.5 8.33 9 7.5 9zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-9c-.83 0-1.5-.67-1.5-1.5S15.67 6 16.5 6s1.5.67 1.5 1.5S17.33 9 16.5 9z"/>
                  </svg>
                </button>
              </div>
              <Transition name="fade">
                <p v-if="nicknameError" class="absolute -bottom-6 left-0 right-0 text-sm text-red-500">
                  {{ nicknameError }}
                </p>
              </Transition>
            </div>

            <p class="text-sm text-gray-400 mb-8">{{ nickname.length }}/10</p>

            <button
              @click="nextStep"
              :disabled="nickname.trim().length < 2"
              :class="[
                'w-full py-4 rounded-2xl font-semibold text-lg transition-all transform',
                nickname.trim().length >= 2
                  ? 'bg-gray-900 text-white hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              ]"
            >
              다음
            </button>
          </div>
        </Transition>

        <!-- Step 2: 좋아하는 요리 -->
        <Transition
          :name="direction === 'forward' ? 'slide-left' : 'slide-right'"
          mode="out-in"
        >
          <div v-if="step === 2" key="step2" class="text-center">
            <h1 class="text-2xl font-semibold text-gray-900 mb-2">
              좋아하는 요리를 알려주세요
            </h1>
            <p class="text-gray-500 mb-8">
              취향에 맞는 레시피를 추천해드릴게요
            </p>

            <div class="flex flex-wrap justify-center gap-2 mb-8">
              <button
                v-for="dish in dishOptions"
                :key="dish"
                @click="toggleDish(dish)"
                :class="[
                  'px-4 py-2.5 rounded-full text-sm font-medium transition-all transform',
                  favoriteDishes.includes(dish)
                    ? 'bg-gray-900 text-white scale-105 shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                ]"
              >
                {{ dish }}
                <span
                  v-if="favoriteDishes.includes(dish)"
                  class="ml-1 inline-block animate-pop"
                >
                  ✓
                </span>
              </button>
            </div>

            <p class="text-sm text-gray-400 mb-6">
              {{ favoriteDishes.length }}개 선택됨
            </p>

            <div class="flex gap-3">
              <button
                @click="prevStep"
                class="flex-1 py-4 rounded-2xl font-semibold text-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              >
                이전
              </button>
              <button
                @click="nextStep"
                class="flex-1 py-4 rounded-2xl font-semibold text-lg bg-gray-900 text-white hover:bg-gray-800 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                다음
              </button>
            </div>
          </div>
        </Transition>

        <!-- Step 3: 싫어하는 재료 -->
        <Transition
          :name="direction === 'forward' ? 'slide-left' : 'slide-right'"
          mode="out-in"
        >
          <div v-if="step === 3" key="step3" class="text-center">
            <h1 class="text-2xl font-semibold text-gray-900 mb-2">
              피하고 싶은 재료가 있나요?
            </h1>
            <p class="text-gray-500 mb-8">
              선택하지 않아도 괜찮아요
            </p>

            <div class="flex flex-wrap justify-center gap-2 mb-8">
              <button
                v-for="ingredient in ingredientOptions"
                :key="ingredient"
                @click="toggleIngredient(ingredient)"
                :class="[
                  'px-4 py-2.5 rounded-full text-sm font-medium transition-all transform',
                  dislikedIngredients.includes(ingredient)
                    ? 'bg-red-500 text-white scale-105 shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                ]"
              >
                {{ ingredient }}
                <span
                  v-if="dislikedIngredients.includes(ingredient)"
                  class="ml-1 inline-block animate-pop"
                >
                  ✕
                </span>
              </button>
            </div>

            <p class="text-sm text-gray-400 mb-6">
              {{ dislikedIngredients.length }}개 선택됨
            </p>

            <div class="flex gap-3">
              <button
                @click="prevStep"
                class="flex-1 py-4 rounded-2xl font-semibold text-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              >
                이전
              </button>
              <button
                @click="nextStep"
                class="flex-1 py-4 rounded-2xl font-semibold text-lg bg-gray-900 text-white hover:bg-gray-800 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                다음
              </button>
            </div>
          </div>
        </Transition>

        <!-- Step 4: 내 재료 -->
        <Transition
          :name="direction === 'forward' ? 'slide-left' : 'slide-right'"
          mode="out-in"
        >
          <div v-if="step === 4" key="step4" class="text-center" @click.self="closeAllDropdowns">
            <h1 class="text-2xl font-semibold text-gray-900 mb-2">
              내 냉장고에 뭐가 있나요?
            </h1>
            <p class="text-gray-500 mb-8">
              간단히 선택해주세요 (선택)
            </p>

            <div class="space-y-6 mb-8">
              <!-- 주요 재료 -->
              <div class="text-left">
                <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <span class="text-xl">🥩</span> 주요 재료
                </label>
                <div class="relative">
                  <!-- 선택된 재료가 있을 때 -->
                  <div
                    v-if="myIngredients.main"
                    class="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <span class="font-medium">{{ myIngredients.main.name }}</span>
                    <button
                      @click="clearIngredient('main')"
                      class="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <!-- 선택 UI -->
                  <div v-else>
                    <div class="relative">
                      <input
                        v-model="searchQueries.main"
                        @input="debouncedSearch('main')"
                        @focus="dropdownOpen.main = true"
                        type="text"
                        placeholder="검색하거나 선택하세요"
                        class="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-gray-400 transition-colors pr-10"
                      />
                      <button
                        @click="toggleDropdown('main')"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    <!-- 드롭다운 -->
                    <div
                      v-if="dropdownOpen.main"
                      class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto"
                    >
                      <!-- 검색 결과 -->
                      <template v-if="searchQueries.main && searchResults.main.length > 0">
                        <button
                          v-for="item in searchResults.main"
                          :key="item.id"
                          @click="selectIngredient('main', item)"
                          class="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                        >
                          {{ item.name }}
                          <span class="text-xs text-gray-400 ml-1">{{ item.category }}</span>
                        </button>
                      </template>
                      <!-- 기본 목록 -->
                      <template v-else-if="!searchQueries.main">
                        <button
                          v-for="item in mainIngredients"
                          :key="item.id"
                          @click="selectIngredient('main', item)"
                          class="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                        >
                          {{ item.name }}
                          <span class="text-xs text-gray-400 ml-1">{{ item.category }}</span>
                        </button>
                      </template>
                      <!-- 검색 결과 없음 -->
                      <template v-else>
                        <div class="px-4 py-3 text-gray-400 text-sm">검색 결과가 없습니다</div>
                      </template>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 소스/양념 -->
              <div class="text-left">
                <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <span class="text-xl">🧂</span> 소스/양념
                </label>
                <div class="relative">
                  <div
                    v-if="myIngredients.sauce"
                    class="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <span class="font-medium">{{ myIngredients.sauce.name }}</span>
                    <button
                      @click="clearIngredient('sauce')"
                      class="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div v-else>
                    <div class="relative">
                      <input
                        v-model="searchQueries.sauce"
                        @input="debouncedSearch('sauce')"
                        @focus="dropdownOpen.sauce = true"
                        type="text"
                        placeholder="검색하거나 선택하세요"
                        class="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-gray-400 transition-colors pr-10"
                      />
                      <button
                        @click="toggleDropdown('sauce')"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    <div
                      v-if="dropdownOpen.sauce"
                      class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto"
                    >
                      <template v-if="searchQueries.sauce && searchResults.sauce.length > 0">
                        <button
                          v-for="item in searchResults.sauce"
                          :key="item.id"
                          @click="selectIngredient('sauce', item)"
                          class="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                        >
                          {{ item.name }}
                        </button>
                      </template>
                      <template v-else-if="!searchQueries.sauce">
                        <button
                          v-for="item in sauceIngredients"
                          :key="item.id"
                          @click="selectIngredient('sauce', item)"
                          class="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                        >
                          {{ item.name }}
                        </button>
                      </template>
                      <template v-else>
                        <div class="px-4 py-3 text-gray-400 text-sm">검색 결과가 없습니다</div>
                      </template>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 곡물 -->
              <div class="text-left">
                <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <span class="text-xl">🍚</span> 곡물
                </label>
                <div class="relative">
                  <div
                    v-if="myIngredients.grain"
                    class="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <span class="font-medium">{{ myIngredients.grain.name }}</span>
                    <button
                      @click="clearIngredient('grain')"
                      class="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div v-else>
                    <div class="relative">
                      <input
                        v-model="searchQueries.grain"
                        @input="debouncedSearch('grain')"
                        @focus="dropdownOpen.grain = true"
                        type="text"
                        placeholder="검색하거나 선택하세요"
                        class="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-gray-400 transition-colors pr-10"
                      />
                      <button
                        @click="toggleDropdown('grain')"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    <div
                      v-if="dropdownOpen.grain"
                      class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto"
                    >
                      <template v-if="searchQueries.grain && searchResults.grain.length > 0">
                        <button
                          v-for="item in searchResults.grain"
                          :key="item.id"
                          @click="selectIngredient('grain', item)"
                          class="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                        >
                          {{ item.name }}
                        </button>
                      </template>
                      <template v-else-if="!searchQueries.grain">
                        <button
                          v-for="item in grainIngredients"
                          :key="item.id"
                          @click="selectIngredient('grain', item)"
                          class="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                        >
                          {{ item.name }}
                        </button>
                      </template>
                      <template v-else>
                        <div class="px-4 py-3 text-gray-400 text-sm">검색 결과가 없습니다</div>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p class="text-sm text-gray-400 mb-6">
              나중에 "내 재료" 페이지에서 더 추가할 수 있어요
            </p>

            <div class="flex gap-3">
              <button
                @click="prevStep"
                class="flex-1 py-4 rounded-2xl font-semibold text-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              >
                이전
              </button>
              <button
                @click="completeOnboarding"
                :disabled="isSubmitting"
                class="flex-1 py-4 rounded-2xl font-semibold text-lg bg-gray-900 text-white hover:bg-gray-800 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                <span v-if="isSubmitting" class="inline-flex items-center gap-2">
                  <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  처리 중...
                </span>
                <span v-else>시작하기</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- 건너뛰기 (Step 2, 3, 4에서) -->
    <div v-if="step > 1" class="pb-8 text-center">
      <button
        @click="isLastStep() ? completeOnboarding() : nextStep()"
        class="text-gray-400 text-sm hover:text-gray-600 transition-colors"
      >
        건너뛰기
      </button>
    </div>
  </div>
</template>

<style scoped>
/* 페이지 전환 애니메이션 - 슬라이드만 */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-left-enter-from {
  transform: translateX(100%);
}
.slide-left-leave-to {
  transform: translateX(-100%);
}

.slide-right-enter-from {
  transform: translateX(-100%);
}
.slide-right-leave-to {
  transform: translateX(100%);
}

/* 페이드 애니메이션 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 텍스트 페이드인 */
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}
.animate-fade-in-delay {
  animation: fadeIn 0.5s ease-out 0.1s both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 선택 팝 애니메이션 */
.animate-pop {
  animation: pop 0.2s ease-out;
}

@keyframes pop {
  0% {
    transform: scale(0);
  }
  70% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

/* 주사위 굴리기 애니메이션 */
.animate-spin-dice {
  animation: spinDice 0.15s linear infinite;
}

@keyframes spinDice {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(90deg);
  }
}
</style>
