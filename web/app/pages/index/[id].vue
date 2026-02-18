<script setup lang="ts">
interface DishDetail {
  dish: {
    id: number
    name: string
    category: string | null
    image_url: string | null
    description: string | null
  }
  ingredients: Array<{
    id: number
    name: string
    category: string | null
    is_main: boolean
    is_optional: boolean
    amount: string | null
  }>
  recipes: Array<{
    id: number
    title: string
    source: string | null
    description: string | null
    ingredients_raw: string | null
    cooking_method: string | null
    cooking_time: string | null
    servings: string | null
    difficulty: string | null
    image_url: string | null
  }>
}

interface IngredientMatch {
  matched: string[]
  count: number
  total: number
  verified: boolean
}

interface YouTubeVideo {
  id: string
  title: string
  thumbnail: string
  channelTitle: string
  publishedAt: string
  description: string
  ingredientMatch: IngredientMatch
  transcriptStatus?: 'pending' | 'loading' | 'done' | 'unavailable'
}

const route = useRoute()
const { t, locale } = useI18n()
const { selectedIngredients } = useRecipeSearch()
const { isLoggedIn } = useAuth()

const dishDetail = ref<DishDetail | null>(null)
const youtubeVideos = ref<YouTubeVideo[]>([])
const selectedVideo = ref<YouTubeVideo | null>(null)
const hasYoutubeApiKey = ref(true)
const isLoadingDetail = ref(true)
const isLoadingYoutube = ref(false)

// 요리 상세 정보 로드
async function loadDishDetail() {
  isLoadingDetail.value = true
  youtubeVideos.value = []

  try {
    const response = await $fetch(`/api/dishes/${route.params.id}`)
    dishDetail.value = response as DishDetail

    // 필수 재료(is_main=true) 최대 3개 추출
    const mainIngredients = dishDetail.value.ingredients
      .filter(ing => ing.is_main)
      .slice(0, 3)
      .map(ing => ing.name)

    if (isLoggedIn.value) {
      fetchYoutubeVideos(dishDetail.value.dish.name, mainIngredients)
    }
  } catch (error) {
    console.error('상세 조회 오류:', error)
  } finally {
    isLoadingDetail.value = false
  }
}

async function fetchYoutubeVideos(dishName: string, mainIngredients: string[] = []) {
  isLoadingYoutube.value = true
  try {
    const ingredientNames = selectedIngredients.value.map(i => i.name).join(',')
    const recipeSuffix = locale.value === 'en' ? 'recipe' : '레시피'
    const searchQuery = mainIngredients.length > 0
      ? `${dishName} ${recipeSuffix} ${mainIngredients.join(' ')}`
      : `${dishName} ${recipeSuffix}`

    const response = await $fetch('/api/youtube/search', {
      query: {
        q: searchQuery,
        ingredients: ingredientNames
      }
    })

    const videos = ((response as any).videos || []).map((v: YouTubeVideo) => ({
      ...v,
      transcriptStatus: 'pending' as const
    }))

    youtubeVideos.value = videos
    hasYoutubeApiKey.value = (response as any).hasApiKey !== false

    if (videos.length > 0 && ingredientNames) {
      verifyTranscriptsLazy(ingredientNames)
    }
  } catch (error) {
    console.error('YouTube 검색 오류:', error)
  } finally {
    isLoadingYoutube.value = false
  }
}

async function verifyTranscriptsLazy(ingredients: string) {
  const videos = youtubeVideos.value

  for (const video of videos) {
    if (!dishDetail.value) break

    video.transcriptStatus = 'loading'

    try {
      const response = await $fetch('/api/youtube/transcript', {
        query: {
          videoId: video.id,
          ingredients
        }
      }) as any

      if (response.hasTranscript && response.ingredientMatch) {
        video.ingredientMatch = response.ingredientMatch
        video.transcriptStatus = 'done'
      } else {
        video.transcriptStatus = 'unavailable'
      }
    } catch {
      video.transcriptStatus = 'unavailable'
    }

    youtubeVideos.value = [...youtubeVideos.value].sort(
      (a, b) => b.ingredientMatch.count - a.ingredientMatch.count
    )
  }
}

function selectVideo(video: YouTubeVideo) {
  selectedVideo.value = video
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 1) return t('common.today')
  if (diffDays < 7) return t('common.daysAgo', { count: diffDays })
  if (diffDays < 30) return t('common.weeksAgo', { count: Math.floor(diffDays / 7) })
  if (diffDays < 365) return t('common.monthsAgo', { count: Math.floor(diffDays / 30) })
  return t('common.yearsAgo', { count: Math.floor(diffDays / 365) })
}

function goBack() {
  navigateTo('/')
}

// 페이지 로드 시 상세 정보 가져오기
onMounted(() => {
  loadDishDetail()
})

// 라우트 변경 시 다시 로드
watch(() => route.params.id, () => {
  loadDishDetail()
})
</script>

<template>
  <div>
    <!-- 뒤로가기 -->
    <button
      @click="goBack"
      class="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      {{ t('dishDetail.backToSearch') }}
    </button>

    <!-- 로딩 -->
    <div v-if="isLoadingDetail" class="text-center py-12 text-gray-500">
      {{ t('dishDetail.loading') }}
    </div>

    <!-- 상세 내용 -->
    <div v-else-if="dishDetail" class="space-y-6">
      <!-- 헤더 -->
      <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <!-- 이미지 -->
        <div v-if="dishDetail.dish.image_url" class="bg-gray-100">
          <img :src="dishDetail.dish.image_url" :alt="dishDetail.dish.name" class="w-full h-48 object-cover" />
        </div>

        <div class="p-6">
          <h1 class="text-2xl font-semibold text-gray-900">{{ dishDetail.dish.name }}</h1>
          <p v-if="dishDetail.dish.category" class="text-gray-500 mt-1">{{ dishDetail.dish.category }}</p>
          <p v-if="dishDetail.dish.description" class="text-gray-600 mt-3">{{ dishDetail.dish.description }}</p>
        </div>
      </div>

      <!-- 필요한 재료 -->
      <section class="bg-white border border-gray-200 rounded-lg p-6">
        <h2 class="font-semibold text-gray-900 mb-4">{{ t('dishDetail.requiredIngredients') }}</h2>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="ing in dishDetail.ingredients"
            :key="ing.id"
            :class="[
              'text-sm px-3 py-1.5 rounded-lg',
              ing.is_main ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
            ]"
          >
            {{ ing.name }}
            <span v-if="ing.amount" class="opacity-60 ml-1">{{ ing.amount }}</span>
          </span>
        </div>
      </section>

      <!-- YouTube 레시피 영상 -->
      <section class="bg-white border border-gray-200 rounded-lg p-6">
        <h2 class="font-semibold text-gray-900 mb-4">{{ t('dishDetail.recipeVideos') }}</h2>

        <!-- 비로그인 시 로그인 유도 -->
        <div v-if="!isLoggedIn" class="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p class="text-sm text-orange-800">{{ t('dishDetail.loginForVideos') }}</p>
          <NuxtLink
            to="/login"
            class="inline-block mt-2 text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            {{ t('dishDetail.goToLogin') }} →
          </NuxtLink>
        </div>

        <div v-else-if="isLoadingYoutube" class="text-center py-4 text-gray-500">
          {{ t('dishDetail.searchingVideos') }}
        </div>

        <div v-else-if="youtubeVideos.length > 0" class="space-y-4">
          <!-- 플레이어 -->
          <div class="rounded-lg overflow-hidden bg-black aspect-video">
            <iframe
              v-if="selectedVideo"
              :src="`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`"
              class="w-full h-full"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
            <div v-else class="w-full h-full flex flex-col items-center justify-center text-white/70">
              <svg class="w-16 h-16 mb-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <p class="text-base font-medium">{{ t('dishDetail.selectVideo') }}</p>
              <p class="text-sm mt-1 opacity-70">{{ t('dishDetail.selectVideoHint') }}</p>
            </div>
          </div>

          <!-- 선택된 영상 정보 -->
          <div v-if="selectedVideo" class="px-1 py-2 border-b border-gray-100">
            <p class="font-medium text-gray-900">{{ selectedVideo.title }}</p>
            <div class="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <span>{{ selectedVideo.channelTitle }}</span>
              <span v-if="selectedVideo.publishedAt">•</span>
              <span v-if="selectedVideo.publishedAt">{{ formatDate(selectedVideo.publishedAt) }}</span>
            </div>
            <!-- 재료 일치 정보 -->
            <div v-if="selectedVideo.ingredientMatch && selectedVideo.ingredientMatch.total > 0" class="mt-2">
              <div class="flex items-center gap-2 flex-wrap">
                <span
                  :class="[
                    'text-xs px-2 py-1 rounded-full font-medium',
                    selectedVideo.ingredientMatch.count === selectedVideo.ingredientMatch.total
                      ? 'bg-green-100 text-green-700'
                      : selectedVideo.ingredientMatch.count > 0
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-600'
                  ]"
                >
                  {{ t('dishDetail.ingredientMatch', { count: selectedVideo.ingredientMatch.count, total: selectedVideo.ingredientMatch.total }) }}
                  <span v-if="selectedVideo.transcriptStatus === 'done'" class="ml-1">✓</span>
                  <span v-else-if="selectedVideo.transcriptStatus === 'loading'" class="ml-1">🔄</span>
                </span>
                <span
                  v-for="ing in selectedVideo.ingredientMatch.matched"
                  :key="ing"
                  class="text-xs px-2 py-1 bg-green-50 text-green-600 rounded"
                >
                  {{ ing }}
                </span>
              </div>
            </div>
          </div>

          <!-- 영상 목록 -->
          <div class="max-h-80 overflow-y-auto space-y-2 pr-1">
            <button
              v-for="video in youtubeVideos"
              :key="video.id"
              @click="selectVideo(video)"
              :class="[
                'w-full flex gap-3 p-2 rounded-lg transition-all text-left',
                selectedVideo?.id === video.id
                  ? 'bg-gray-900 text-white'
                  : 'hover:bg-gray-100'
              ]"
            >
              <div class="relative w-32 flex-shrink-0 aspect-video rounded overflow-hidden bg-gray-200">
                <img :src="video.thumbnail" :alt="video.title" class="w-full h-full object-cover" />
                <div v-if="selectedVideo?.id !== video.id" class="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div class="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                    <svg class="w-4 h-4 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
                <div v-else class="absolute inset-0 flex items-center justify-center bg-black/50">
                  <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                </div>
                <!-- 재료 일치 배지 -->
                <div
                  v-if="video.ingredientMatch && video.ingredientMatch.total > 0"
                  :class="[
                    'absolute top-1 left-1 px-1.5 py-0.5 rounded text-xs font-medium',
                    video.ingredientMatch.count === video.ingredientMatch.total
                      ? 'bg-green-500 text-white'
                      : video.ingredientMatch.count > 0
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-500 text-white'
                  ]"
                >
                  {{ video.ingredientMatch.count }}/{{ video.ingredientMatch.total }}
                </div>
              </div>
              <div class="flex-1 min-w-0 py-0.5">
                <p :class="[
                  'text-sm line-clamp-2',
                  selectedVideo?.id === video.id ? 'text-white font-medium' : 'text-gray-900'
                ]">
                  {{ video.title }}
                </p>
                <p :class="[
                  'text-xs mt-1',
                  selectedVideo?.id === video.id ? 'text-gray-300' : 'text-gray-500'
                ]">
                  {{ video.channelTitle }}
                </p>
                <!-- 재료 검증 상태 -->
                <div class="flex items-center gap-1.5 mt-1">
                  <span v-if="video.transcriptStatus === 'loading'" :class="[
                    'text-xs',
                    selectedVideo?.id === video.id ? 'text-gray-400' : 'text-gray-400'
                  ]">
                    {{ t('dishDetail.verifyingTranscript') }}
                  </span>
                  <span v-else-if="video.transcriptStatus === 'done'" :class="[
                    'text-xs',
                    selectedVideo?.id === video.id ? 'text-green-300' : 'text-green-600'
                  ]">
                    {{ t('dishDetail.transcriptVerified') }}
                  </span>
                  <span v-else-if="video.transcriptStatus === 'unavailable'" :class="[
                    'text-xs',
                    selectedVideo?.id === video.id ? 'text-gray-400' : 'text-gray-400'
                  ]">
                    {{ t('dishDetail.noTranscript') }}
                  </span>
                  <span v-else :class="[
                    'text-xs',
                    selectedVideo?.id === video.id ? 'text-gray-400' : 'text-gray-400'
                  ]">
                    {{ formatDate(video.publishedAt) }}
                  </span>
                </div>
              </div>
            </button>
          </div>

          <a
            :href="`https://www.youtube.com/results?search_query=${encodeURIComponent(dishDetail.dish.name + (locale === 'en' ? ' recipe' : ' 레시피'))}`"
            target="_blank"
            rel="noopener noreferrer"
            class="block text-center text-sm text-gray-500 hover:text-gray-900 py-2"
          >
            {{ t('dishDetail.moreOnYoutube') }} →
          </a>
        </div>

        <a
          v-else
          :href="`https://www.youtube.com/results?search_query=${encodeURIComponent(dishDetail.dish.name + (locale === 'en' ? ' recipe' : ' 레시피'))}`"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-all"
        >
          <div class="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
          <div>
            <p class="font-medium text-gray-900">{{ t('dishDetail.searchOnYoutube') }}</p>
            <p class="text-sm text-gray-500">{{ t('dishDetail.watchOnYoutube') }}</p>
          </div>
        </a>
      </section>
    </div>

    <!-- 오류 -->
    <div v-else class="text-center py-16">
      <p class="text-5xl mb-4">😢</p>
      <p class="text-gray-500">{{ t('dishDetail.loadError') }}</p>
      <button @click="goBack" class="mt-4 text-gray-900 font-medium hover:underline">
        {{ t('dishDetail.goBack') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
