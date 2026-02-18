<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue'
import { EffectCreative } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import 'swiper/css'
import 'swiper/css/effect-creative'

definePageMeta({
  layout: false,
  middleware: 'auth'
})

const { t, tm, locale } = useI18n()
const { user, fetchUser } = useAuth()

// 온보딩 완료된 사용자는 홈으로
watchEffect(() => {
  if (user.value?.onboarding_completed) {
    navigateTo('/')
  }
})

const swiperRef = ref<SwiperType | null>(null)
const step = ref(1)
const totalSteps = 4

function onSwiper(swiper: SwiperType) {
  swiperRef.value = swiper
}

function onSlideChange(swiper: SwiperType) {
  step.value = swiper.activeIndex + 1
}

// Step 1: 닉네임
const nickname = ref('')
const nicknameError = ref('')
const isRolling = ref(false)

// Random nickname generator words from i18n
const adjectives = computed(() => tm('onboarding.adjectives') as string[])
const nouns = computed(() => tm('onboarding.nouns') as string[])

function generateRandomNickname() {
  const adjs = adjectives.value
  const ns = nouns.value
  const adj = adjs[Math.floor(Math.random() * adjs.length)]
  const noun = ns[Math.floor(Math.random() * ns.length)]
  const num = String(Math.floor(Math.random() * 99) + 1).padStart(2, '0')
  return `${adj}${noun}${num}`
}

async function rollNickname() {
  isRolling.value = true

  const iterations = 8
  for (let i = 0; i < iterations; i++) {
    nickname.value = generateRandomNickname()
    await new Promise(r => setTimeout(r, 80 + i * 20))
  }

  nicknameError.value = ''
  isRolling.value = false
}

// Step 2: Favorite dishes (Western + Asian)
const favoriteDishes = ref<string[]>([])
// Keys for dishes - used for both display (via i18n) and storage (as keys)
const dishKeys = [
  'pizza', 'pasta', 'burger', 'steak', 'tacos',
  'friedChicken', 'bbqRibs', 'macCheese', 'sandwich', 'salad',
  'burritos', 'wings', 'fishChips',
  'sushi', 'ramen', 'curry', 'pho', 'padThai',
  'koreanBbq', 'bibimbap'
]

// Step 3: Disliked ingredients
const dislikedIngredients = ref<string[]>([])
// Keys for ingredients - used for both display (via i18n) and storage (as keys)
const ingredientKeys = [
  'cilantro', 'olives', 'mushrooms', 'onions', 'tomatoes',
  'seafood', 'pork', 'beef', 'chicken', 'eggs',
  'dairy', 'nuts', 'spicyFood', 'gluten', 'shellfish'
]

// Dietary preferences
const isVegetarian = ref(false)
const isVegan = ref(false)

// Use keys for dietary restrictions
const vegetarianIngredients = ['seafood', 'pork', 'beef', 'chicken', 'shellfish']
const veganOnlyIngredients = ['eggs', 'dairy'] // Vegan 전용 (Vegetarian은 허용)

function toggleVegetarian() {
  isVegetarian.value = !isVegetarian.value
  if (isVegetarian.value) {
    // Vegan이었다면 Eggs, Dairy 제거
    if (isVegan.value) {
      veganOnlyIngredients.forEach(ing => {
        const index = dislikedIngredients.value.indexOf(ing)
        if (index >= 0) dislikedIngredients.value.splice(index, 1)
      })
    }
    isVegan.value = false
    // Add vegetarian restricted ingredients
    vegetarianIngredients.forEach(ing => {
      if (!dislikedIngredients.value.includes(ing)) {
        dislikedIngredients.value.push(ing)
      }
    })
  } else {
    // Remove meat-related ingredients
    vegetarianIngredients.forEach(ing => {
      const index = dislikedIngredients.value.indexOf(ing)
      if (index >= 0) dislikedIngredients.value.splice(index, 1)
    })
  }
}

function toggleVegan() {
  isVegan.value = !isVegan.value
  if (isVegan.value) {
    isVegetarian.value = false
    // Add all vegan restricted ingredients
    const allVeganIngredients = [...vegetarianIngredients, ...veganOnlyIngredients]
    allVeganIngredients.forEach(ing => {
      if (!dislikedIngredients.value.includes(ing)) {
        dislikedIngredients.value.push(ing)
      }
    })
  } else {
    // Remove all vegan-related ingredients
    const allVeganIngredients = [...vegetarianIngredients, ...veganOnlyIngredients]
    allVeganIngredients.forEach(ing => {
      const index = dislikedIngredients.value.indexOf(ing)
      if (index >= 0) dislikedIngredients.value.splice(index, 1)
    })
  }
}

// Step 4: My ingredients
interface IngredientOption {
  id: number
  name: string
  category: string | null
}

const myIngredients = ref<{
  protein: IngredientOption | null
  sauce: IngredientOption | null
  carb: IngredientOption | null
}>({
  protein: null,
  sauce: null,
  carb: null
})

// English categories from TheMealDB import
const categoryGroups = {
  protein: ['Meat', 'Seafood'],
  sauce: ['Seasonings & Sauces'],
  carb: ['Grains & Pasta']
}

const { data: baseIngredients } = await useFetch('/api/ingredients/base', {
  query: { orderByPopularity: 'true' },
  watch: [locale]
})

// Fetch top-level proteins only (parent_id IS NULL)
const { data: proteinData } = await useFetch('/api/ingredients/base', {
  query: { topLevelOnly: 'true' },
  watch: [locale]
})

// Top-level proteins only (Beef, Chicken, Pork - not Ground Beef, Chicken Breast, etc.)
const proteinIngredients = computed(() => {
  if (!proteinData.value?.ingredients) return []
  return proteinData.value.ingredients.filter(
    (i: IngredientOption) => i.category && categoryGroups.protein.includes(i.category)
  ) as IngredientOption[]
})

const sauceIngredients = computed(() => {
  if (!baseIngredients.value?.ingredients) return []
  return baseIngredients.value.ingredients.filter(
    (i: IngredientOption) => i.category && categoryGroups.sauce.includes(i.category)
  ) as IngredientOption[]
})

const carbIngredients = computed(() => {
  if (!baseIngredients.value?.ingredients) return []
  return baseIngredients.value.ingredients.filter(
    (i: IngredientOption) => i.category && categoryGroups.carb.includes(i.category)
  ) as IngredientOption[]
})

const searchQueries = ref({
  protein: '',
  sauce: '',
  carb: ''
})

const searchResults = ref<{
  protein: IngredientOption[]
  sauce: IngredientOption[]
  carb: IngredientOption[]
}>({
  protein: [],
  sauce: [],
  carb: []
})

const dropdownOpen = ref({
  protein: false,
  sauce: false,
  carb: false
})

type IngredientType = 'protein' | 'sauce' | 'carb'

async function searchIngredients(type: IngredientType) {
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

let searchTimeouts: Record<string, NodeJS.Timeout | null> = {
  protein: null,
  sauce: null,
  carb: null
}

function debouncedSearch(type: IngredientType) {
  if (searchTimeouts[type]) {
    clearTimeout(searchTimeouts[type]!)
  }
  searchTimeouts[type] = setTimeout(() => {
    searchIngredients(type)
  }, 200)
}

function selectIngredient(type: IngredientType, ingredient: IngredientOption) {
  myIngredients.value[type] = ingredient
  searchQueries.value[type] = ''
  searchResults.value[type] = []
  dropdownOpen.value[type] = false
}

function clearIngredient(type: IngredientType) {
  myIngredients.value[type] = null
}

function toggleDropdown(type: IngredientType) {
  dropdownOpen.value[type] = !dropdownOpen.value[type]
  Object.keys(dropdownOpen.value).forEach(key => {
    if (key !== type) dropdownOpen.value[key as IngredientType] = false
  })
}

function closeAllDropdowns() {
  dropdownOpen.value.protein = false
  dropdownOpen.value.sauce = false
  dropdownOpen.value.carb = false
}

const isSubmitting = ref(false)
const submitError = ref('')

// 시각적 글자 수 계산
function getGraphemeLength(str: string): number {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter('ko', { granularity: 'grapheme' })
    return [...segmenter.segment(str)].length
  }
  return str.length
}

const nicknameLength = computed(() => getGraphemeLength(nickname.value.trim()))
const maxNicknameLength = 20

function validateNickname() {
  const len = nicknameLength.value
  if (len < 2) {
    nicknameError.value = t('onboarding.nicknameMinError')
    return false
  }
  if (len > maxNicknameLength) {
    nicknameError.value = t('onboarding.nicknameMaxError', { max: maxNicknameLength })
    return false
  }
  nicknameError.value = ''
  return true
}

function nextStep() {
  if (step.value === 1 && !validateNickname()) return
  swiperRef.value?.slideNext()
}

function prevStep() {
  swiperRef.value?.slidePrev()
}

function toggleDish(dishKey: string) {
  const index = favoriteDishes.value.indexOf(dishKey)
  if (index >= 0) {
    favoriteDishes.value.splice(index, 1)
  } else {
    favoriteDishes.value.push(dishKey)
  }
}

function toggleIngredient(ingredientKey: string) {
  const index = dislikedIngredients.value.indexOf(ingredientKey)
  if (index >= 0) {
    dislikedIngredients.value.splice(index, 1)
  } else {
    dislikedIngredients.value.push(ingredientKey)
  }
}

async function completeOnboarding() {
  if (nicknameLength.value < 2) {
    submitError.value = t('onboarding.nicknameMinError')
    swiperRef.value?.slideTo(0)
    return
  }
  isSubmitting.value = true
  submitError.value = ''

  try {
    const myIngredientsData: {
      protein?: number
      sauce?: number
      carb?: number
    } = {}

    if (myIngredients.value.protein) {
      myIngredientsData.protein = myIngredients.value.protein.id
    }
    if (myIngredients.value.sauce) {
      myIngredientsData.sauce = myIngredients.value.sauce.id
    }
    if (myIngredients.value.carb) {
      myIngredientsData.carb = myIngredients.value.carb.id
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
    console.error('Onboarding error:', error)
    submitError.value = error.data?.message || 'Something went wrong. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && step.value === 1) {
    nextStep()
  }
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.ingredient-dropdown')) {
    closeAllDropdowns()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', handleClickOutside)
  Object.values(searchTimeouts).forEach(timeout => {
    if (timeout) clearTimeout(timeout)
  })
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

    <!-- 메인 콘텐츠 - Swiper -->
    <div class="flex-1 flex items-center py-12 overflow-hidden">
      <Swiper
        :modules="[EffectCreative]"
        :slides-per-view="1"
        :space-between="0"
        :allow-touch-move="false"
        :speed="500"
        effect="creative"
        :creative-effect="{
          limitProgress: 2,
          prev: {
            translate: ['-100%', 0, 0],
            opacity: 0,
          },
          next: {
            translate: ['100%', 0, 0],
            opacity: 0,
          },
        }"
        :watch-slides-progress="true"
        class="w-full"
        @swiper="onSwiper"
        @slide-change="onSlideChange"
      >
        <!-- Step 1: Nickname -->
        <SwiperSlide>
          <div class="text-center px-6 max-w-md mx-auto">
            <h1 class="text-2xl font-semibold text-gray-900 mb-2">
              {{ t('onboarding.step1Title') }}
            </h1>
            <p class="text-gray-500 mb-8">
              {{ t('onboarding.step1Subtitle') }}
            </p>

            <div class="relative mb-6">
              <div class="flex items-center gap-3">
                <input
                  v-model="nickname"
                  type="text"
                  :placeholder="t('onboarding.step1Placeholder')"
                  maxlength="30"
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
                  :title="t('onboarding.randomNickname')"
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

            <p class="text-sm text-gray-400 mb-8">{{ nicknameLength }}/{{ maxNicknameLength }}</p>

            <button
              @click="nextStep"
              :disabled="nicknameLength < 2 || nicknameLength > maxNicknameLength"
              :class="[
                'w-full py-4 rounded-2xl font-semibold text-lg transition-all transform',
                nicknameLength >= 2 && nicknameLength <= maxNicknameLength
                  ? 'bg-gray-900 text-white hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              ]"
            >
              {{ t('common.next') }}
            </button>
          </div>
        </SwiperSlide>

        <!-- Step 2: Favorite dishes -->
        <SwiperSlide>
          <div class="text-center px-6 max-w-md mx-auto">
            <h1 class="text-2xl font-semibold text-gray-900 mb-2">
              {{ t('onboarding.step2Title') }}
            </h1>
            <p class="text-gray-500 mb-8">
              {{ t('onboarding.step2Subtitle') }}
            </p>

            <div class="flex flex-wrap justify-center gap-2 mb-8">
              <button
                v-for="dishKey in dishKeys"
                :key="dishKey"
                @click="toggleDish(dishKey)"
                :class="[
                  'px-4 py-2.5 rounded-full text-sm font-medium transition-all transform',
                  favoriteDishes.includes(dishKey)
                    ? 'bg-gray-900 text-white scale-105 shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                ]"
              >
                {{ t(`onboarding.dishes.${dishKey}`) }}
                <span
                  v-if="favoriteDishes.includes(dishKey)"
                  class="ml-1 inline-block animate-pop"
                >
                  ✓
                </span>
              </button>
            </div>

            <p class="text-sm text-gray-400 mb-6">
              {{ t('common.selected', { count: favoriteDishes.length }) }}
            </p>

            <div class="flex gap-3">
              <button
                @click="prevStep"
                class="flex-1 py-4 rounded-2xl font-semibold text-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              >
                {{ t('common.back') }}
              </button>
              <button
                @click="nextStep"
                class="flex-1 py-4 rounded-2xl font-semibold text-lg bg-gray-900 text-white hover:bg-gray-800 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {{ t('common.next') }}
              </button>
            </div>
          </div>
        </SwiperSlide>

        <!-- Step 3: Disliked ingredients -->
        <SwiperSlide>
          <div class="text-center px-6 max-w-md mx-auto">
            <h1 class="text-2xl font-semibold text-gray-900 mb-2">
              {{ t('onboarding.step3Title') }}
            </h1>
            <p class="text-gray-500 mb-6">
              {{ t('onboarding.step3Subtitle') }}
            </p>

            <!-- Dietary preference toggles -->
            <div class="flex justify-center gap-3 mb-6">
              <button
                @click="toggleVegetarian"
                :class="[
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isVegetarian
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                ]"
              >
                <span>🥬</span> {{ t('onboarding.vegetarian') }}
              </button>
              <button
                @click="toggleVegan"
                :class="[
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isVegan
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                ]"
              >
                <span>🌱</span> {{ t('onboarding.vegan') }}
              </button>
            </div>

            <div class="flex flex-wrap justify-center gap-2 mb-8">
              <button
                v-for="ingredientKey in ingredientKeys"
                :key="ingredientKey"
                @click="toggleIngredient(ingredientKey)"
                :class="[
                  'px-4 py-2.5 rounded-full text-sm font-medium transition-all transform',
                  dislikedIngredients.includes(ingredientKey)
                    ? 'bg-red-500 text-white scale-105 shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                ]"
              >
                {{ t(`onboarding.dislikedIngredients.${ingredientKey}`) }}
                <span
                  v-if="dislikedIngredients.includes(ingredientKey)"
                  class="ml-1 inline-block animate-pop"
                >
                  ✕
                </span>
              </button>
            </div>

            <p class="text-sm text-gray-400 mb-6">
              {{ t('common.selected', { count: dislikedIngredients.length }) }}
            </p>

            <div class="flex gap-3">
              <button
                @click="prevStep"
                class="flex-1 py-4 rounded-2xl font-semibold text-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              >
                {{ t('common.back') }}
              </button>
              <button
                @click="nextStep"
                class="flex-1 py-4 rounded-2xl font-semibold text-lg bg-gray-900 text-white hover:bg-gray-800 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {{ t('common.next') }}
              </button>
            </div>
          </div>
        </SwiperSlide>

        <!-- Step 4: My ingredients -->
        <SwiperSlide>
          <div class="text-center px-6 max-w-md mx-auto" @click.self="closeAllDropdowns">
            <h1 class="text-2xl font-semibold text-gray-900 mb-2">
              {{ t('onboarding.step4Title') }}
            </h1>
            <p class="text-gray-500 mb-8">
              {{ t('onboarding.step4Subtitle') }}
            </p>

            <div class="space-y-6 mb-8">
              <!-- Protein -->
              <div class="text-left ingredient-dropdown">
                <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <span class="text-xl">🥩</span> {{ t('onboarding.protein') }}
                </label>
                <div class="relative">
                  <div
                    v-if="myIngredients.protein"
                    class="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <span class="font-medium">{{ myIngredients.protein.name }}</span>
                    <button
                      @click="clearIngredient('protein')"
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
                        v-model="searchQueries.protein"
                        @input="debouncedSearch('protein')"
                        @focus="dropdownOpen.protein = true"
                        type="text"
                        :placeholder="t('onboarding.searchOrSelect')"
                        class="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-gray-400 transition-colors pr-10"
                      />
                      <button
                        @click.stop="toggleDropdown('protein')"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    <div
                      v-if="dropdownOpen.protein"
                      class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto"
                    >
                      <template v-if="searchQueries.protein && searchResults.protein.length > 0">
                        <button
                          v-for="item in searchResults.protein"
                          :key="item.id"
                          @click="selectIngredient('protein', item)"
                          class="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                        >
                          {{ item.name }}
                        </button>
                      </template>
                      <template v-else-if="!searchQueries.protein">
                        <button
                          v-for="item in proteinIngredients.slice(0, 20)"
                          :key="item.id"
                          @click="selectIngredient('protein', item)"
                          class="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                        >
                          {{ item.name }}
                        </button>
                      </template>
                      <template v-else>
                        <div class="px-4 py-3 text-gray-400 text-sm">{{ t('onboarding.noResults') }}</div>
                      </template>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Sauce/Seasoning -->
              <div class="text-left ingredient-dropdown">
                <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <span class="text-xl">🧂</span> {{ t('onboarding.sauceSeasoning') }}
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
                        :placeholder="t('onboarding.searchOrSelect')"
                        class="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-gray-400 transition-colors pr-10"
                      />
                      <button
                        @click.stop="toggleDropdown('sauce')"
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
                          v-for="item in sauceIngredients.slice(0, 20)"
                          :key="item.id"
                          @click="selectIngredient('sauce', item)"
                          class="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                        >
                          {{ item.name }}
                        </button>
                      </template>
                      <template v-else>
                        <div class="px-4 py-3 text-gray-400 text-sm">{{ t('onboarding.noResults') }}</div>
                      </template>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Carbs -->
              <div class="text-left ingredient-dropdown">
                <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <span class="text-xl">🍚</span> {{ t('onboarding.grainsCarbs') }}
                </label>
                <div class="relative">
                  <div
                    v-if="myIngredients.carb"
                    class="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <span class="font-medium">{{ myIngredients.carb.name }}</span>
                    <button
                      @click="clearIngredient('carb')"
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
                        v-model="searchQueries.carb"
                        @input="debouncedSearch('carb')"
                        @focus="dropdownOpen.carb = true"
                        type="text"
                        :placeholder="t('onboarding.searchOrSelect')"
                        class="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-gray-400 transition-colors pr-10"
                      />
                      <button
                        @click.stop="toggleDropdown('carb')"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    <div
                      v-if="dropdownOpen.carb"
                      class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto"
                    >
                      <template v-if="searchQueries.carb && searchResults.carb.length > 0">
                        <button
                          v-for="item in searchResults.carb"
                          :key="item.id"
                          @click="selectIngredient('carb', item)"
                          class="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                        >
                          {{ item.name }}
                        </button>
                      </template>
                      <template v-else-if="!searchQueries.carb">
                        <button
                          v-for="item in carbIngredients.slice(0, 20)"
                          :key="item.id"
                          @click="selectIngredient('carb', item)"
                          class="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                        >
                          {{ item.name }}
                        </button>
                      </template>
                      <template v-else>
                        <div class="px-4 py-3 text-gray-400 text-sm">{{ t('onboarding.noResults') }}</div>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p class="text-sm text-gray-400 mb-6">
              {{ t('onboarding.addMoreLater') }}
            </p>

            <div class="flex gap-3">
              <button
                @click="prevStep"
                class="flex-1 py-4 rounded-2xl font-semibold text-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              >
                {{ t('common.back') }}
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
                  {{ t('common.processing') }}
                </span>
                <span v-else>{{ t('onboarding.getStarted') }}</span>
              </button>
            </div>

            <Transition name="fade">
              <p v-if="submitError" class="mt-4 text-sm text-red-500 text-center">
                {{ submitError }}
              </p>
            </Transition>
          </div>
        </SwiperSlide>
      </Swiper>
    </div>

    <!-- Skip (Step 2, 3, 4) -->
    <div v-if="step > 1" class="pb-8 text-center">
      <button
        @click="completeOnboarding"
        class="text-gray-400 text-sm hover:text-gray-600 transition-colors"
      >
        {{ t('onboarding.skipForNow') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Swiper 슬라이드 페이드 효과 */
:deep(.swiper-slide) {
  transition: opacity 0.5s ease;
  opacity: 0;
}

:deep(.swiper-slide-active) {
  opacity: 1;
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
