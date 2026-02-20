<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { t } = useI18n()
const { user } = useAuth()

// 실제 데이터
const expiringIngredients = ref<any[]>([])
const userIngredients = ref<any[]>([])
const todayRecommendations = ref<any[]>([])
const isLoadingExpiring = ref(true)
const isLoadingRecommendations = ref(true)

// 유통기한 임박 재료 + 사용자 재료 로드
async function loadIngredients() {
  isLoadingExpiring.value = true
  try {
    const response = await $fetch<{ ingredients: any[]; expiring: any[] }>('/api/user/ingredients')
    userIngredients.value = response.ingredients
    expiringIngredients.value = response.expiring
  } catch (e) {
    console.error('재료 로드 오류:', e)
  } finally {
    isLoadingExpiring.value = false
  }
}

// 추천 요리 로드 (사용자 재료 기반)
async function loadRecommendations() {
  isLoadingRecommendations.value = true
  try {
    if (userIngredients.value.length === 0) {
      todayRecommendations.value = []
      return
    }
    const ids = userIngredients.value.map((i: any) => i.ingredient_id).join(',')
    const response = await $fetch<{ userDishes: any[]; dbDishes: any[] }>('/api/dishes/search', {
      query: { ids, limit: 4 }
    })
    todayRecommendations.value = [...(response.userDishes || []), ...(response.dbDishes || [])].slice(0, 4)
  } catch (e) {
    console.error('추천 로드 오류:', e)
  } finally {
    isLoadingRecommendations.value = false
  }
}

// D-day 텍스트
function getDaysLeftText(daysLeft: number | undefined) {
  if (daysLeft === undefined) return ''
  if (daysLeft < 0) return `D+${Math.abs(Math.floor(daysLeft))}`
  if (daysLeft === 0) return 'D-Day'
  return `D-${Math.floor(daysLeft)}`
}

// 요리 상세로 이동
function viewDish(dish: any) {
  if (dish.isUserRecipe) {
    navigateTo(`/recipe/${dish.id}`)
  } else {
    navigateTo(`/${dish.id}`)
  }
}

// 재료로 요리 찾기
function searchWithExpiring() {
  if (expiringIngredients.value.length === 0) return
  const names = expiringIngredients.value.map((i: any) => i.name).join(',')
  navigateTo(`/?ingredients=${encodeURIComponent(names)}`)
}

// 새로고침
async function refreshRecommendations() {
  await loadRecommendations()
}

// 초기 로드
onMounted(async () => {
  await loadIngredients()
  await loadRecommendations()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <main class="max-w-6xl mx-auto px-6 py-8">
      <!-- 환영 메시지 -->
      <div class="mb-8">
        <h1 class="text-2xl font-semibold text-gray-900">{{ t('dashboard.greeting', { name: user?.nickname || t('common.profile') }) }}</h1>
        <p class="text-gray-500 mt-1">{{ t('dashboard.greetingSubtitle') }}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- 왼쪽 2/3: 메인 콘텐츠 -->
        <div class="col-span-2 space-y-6">
          <!-- 유통기한 임박 알림 -->
          <section class="bg-white border border-gray-200 rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-semibold text-gray-900">⏰ {{ t('dashboard.expiringTitle') }}</h2>
              <NuxtLink to="/my-fridge" class="text-sm text-gray-500 hover:text-gray-900">
                {{ t('dashboard.viewAllIngredients') }} →
              </NuxtLink>
            </div>

            <div v-if="isLoadingExpiring" class="text-center py-4 text-gray-400 text-sm">
              {{ t('common.loading') }}
            </div>
            <div v-else-if="expiringIngredients.length === 0" class="text-center py-4 text-gray-400 text-sm">
              {{ t('dashboard.noExpiringIngredients') }} 👍
            </div>
            <template v-else>
              <div class="grid grid-cols-3 gap-4">
                <div
                  v-for="item in expiringIngredients"
                  :key="item.ingredient_id"
                  class="p-4 bg-gray-50 rounded-lg"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-medium text-gray-900">{{ item.name }}</span>
                    <span class="text-sm text-red-500">{{ getDaysLeftText(item.days_left) }}</span>
                  </div>
                  <span class="text-xs text-gray-500">{{ item.category || t('myFridge.other') }}</span>
                </div>
              </div>
              <button
                @click="searchWithExpiring"
                class="mt-4 w-full py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                {{ t('dashboard.searchWithExpiring') }}
              </button>
            </template>
          </section>

          <!-- 오늘의 추천 -->
          <section class="bg-white border border-gray-200 rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-semibold text-gray-900">✨ {{ t('dashboard.recommendTitle') }}</h2>
              <button @click="refreshRecommendations" class="text-sm text-gray-500 hover:text-gray-900">{{ t('dashboard.refresh') }}</button>
            </div>

            <div v-if="isLoadingRecommendations" class="text-center py-4 text-gray-400 text-sm">
              {{ t('dashboard.searchingRecommendations') }}
            </div>
            <div v-else-if="todayRecommendations.length === 0" class="text-center py-8 text-gray-400 text-sm">
              <p class="text-3xl mb-2">🥕</p>
              <p>{{ t('dashboard.registerIngredientsHint') }}</p>
              <NuxtLink to="/my-fridge" class="text-gray-900 font-medium hover:underline mt-2 inline-block">
                {{ t('dashboard.goRegisterIngredients') }} →
              </NuxtLink>
            </div>
            <div v-else class="grid grid-cols-2 gap-4">
              <button
                v-for="dish in todayRecommendations"
                :key="`${dish.isUserRecipe ? 'u' : 'd'}-${dish.id}`"
                @click="viewDish(dish)"
                class="p-4 border border-gray-100 rounded-lg text-left hover:border-gray-300 transition-colors"
              >
                <div class="flex items-start justify-between mb-2">
                  <div>
                    <p class="font-medium text-gray-900">{{ dish.name }}</p>
                    <p v-if="dish.category" class="text-sm text-gray-500">{{ dish.category }}</p>
                  </div>
                  <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    {{ t('home.matchCount', { match: dish.match_count, total: dish.total_count }) }}
                  </span>
                </div>
                <p v-if="dish.ingredients" class="text-xs text-gray-400 truncate">
                  {{ dish.ingredients.split(',').slice(0, 4).join(', ') }}
                </p>
              </button>
            </div>
          </section>
        </div>

        <!-- 오른쪽 1/3: 사이드바 -->
        <div class="space-y-6">
          <!-- 내 재료 요약 -->
          <section class="bg-gray-900 text-white rounded-lg p-6">
            <h2 class="font-semibold mb-4">📊 {{ t('dashboard.myIngredientsSummary') }}</h2>
            <div class="space-y-4">
              <div class="flex justify-between">
                <span class="text-gray-400">{{ t('dashboard.ownedIngredients') }}</span>
                <span class="font-medium">{{ t('dashboard.count', { count: userIngredients.length }) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">{{ t('dashboard.expiringCount') }}</span>
                <span class="font-medium" :class="expiringIngredients.length > 0 ? 'text-red-400' : ''">
                  {{ t('dashboard.count', { count: expiringIngredients.length }) }}
                </span>
              </div>
            </div>
          </section>

          <!-- 빠른 액션 -->
          <section class="bg-white border border-gray-200 rounded-lg p-6">
            <h2 class="font-semibold text-gray-900 mb-4">{{ t('dashboard.quickMenu') }}</h2>
            <div class="space-y-2">
              <NuxtLink
                to="/my-fridge"
                class="block px-4 py-3 bg-gray-50 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                🧊 {{ t('dashboard.manageIngredients') }}
              </NuxtLink>
              <NuxtLink
                to="/"
                class="block px-4 py-3 bg-gray-50 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                🔍 {{ t('dashboard.searchRecipes') }}
              </NuxtLink>
              <NuxtLink
                to="/creator/register"
                class="block px-4 py-3 bg-gray-50 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                👨‍🍳 {{ t('dashboard.startCreator') }}
              </NuxtLink>
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>
