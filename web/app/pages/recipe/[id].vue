<script setup lang="ts">
interface RecipeIngredient {
  id: number
  recipe_id: number
  ingredient_id: number | null
  ingredient_name: string | null
  ingredient_category: string | null
  custom_name: string | null
  amount: string | null
  is_main: number
}

interface RecipeStep {
  id: number
  recipe_id: number
  step_number: number
  description: string
  image_url: string | null
}

interface RecipeDetail {
  id: number
  title: string
  description: string | null
  category: string | null
  cooking_time: number | null
  difficulty: string | null
  youtube_video_id: string | null
  youtube_thumbnail: string | null
  image_url: string | null
  view_count: number
  like_count: number
  status: string
  channel_name: string | null
  youtube_channel_url: string | null
  nickname: string | null
  profile_image: string | null
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
}

const route = useRoute()
const recipeId = route.params.id

const { data, error } = await useFetch<{ recipe: RecipeDetail | null }>(`/api/recipes/${recipeId}`)

const recipe = computed(() => data.value?.recipe)

const youtubeEmbedUrl = computed(() => {
  if (!recipe.value?.youtube_video_id) return null
  return `https://www.youtube.com/embed/${recipe.value.youtube_video_id}`
})

useSeoMeta({
  title: () => recipe.value?.title ? `${recipe.value.title} - I Have No Menu` : '레시피 - I Have No Menu',
  description: () => recipe.value?.description || '크리에이터가 공유한 레시피입니다'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <main class="max-w-2xl mx-auto px-4 py-8">
      <!-- 뒤로가기 -->
      <NuxtLink to="/" class="inline-flex items-center gap-1 text-gray-500 hover:text-gray-900 mb-6">
        <span>&larr;</span>
        <span>검색 결과로 돌아가기</span>
      </NuxtLink>

      <!-- 에러 -->
      <div v-if="error" class="bg-white rounded-2xl p-8 text-center shadow-sm">
        <span class="text-5xl">😢</span>
        <p class="mt-4 text-gray-600">레시피를 찾을 수 없습니다</p>
        <NuxtLink to="/" class="inline-block mt-4 text-orange-600 hover:underline">
          홈으로 돌아가기
        </NuxtLink>
      </div>

      <!-- 레시피 상세 -->
      <div v-else-if="recipe" class="space-y-6">
        <!-- 헤더 -->
        <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
          <!-- 유튜브 영상 -->
          <div v-if="youtubeEmbedUrl" class="aspect-video">
            <iframe
              :src="youtubeEmbedUrl"
              class="w-full h-full"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            />
          </div>
          <!-- 썸네일 (유튜브 없는 경우) -->
          <div v-else-if="recipe.image_url || recipe.youtube_thumbnail" class="aspect-video bg-gray-100">
            <img
              :src="recipe.image_url ?? recipe.youtube_thumbnail ?? ''"
              :alt="recipe.title ?? '레시피'"
              class="w-full h-full object-cover"
            />
          </div>

          <div class="p-6">
            <!-- 크리에이터 배지 -->
            <span class="inline-block px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full mb-3">
              크리에이터 레시피
            </span>

            <h1 class="text-2xl font-semibold text-gray-900">{{ recipe.title }}</h1>

            <!-- 크리에이터 정보 -->
            <div class="flex items-center gap-3 mt-4 pt-4 border-t">
              <img
                v-if="recipe.profile_image"
                :src="recipe.profile_image"
                :alt="recipe.nickname || '크리에이터'"
                class="w-10 h-10 rounded-full"
              />
              <div v-else class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span class="text-lg">👨‍🍳</span>
              </div>
              <div>
                <p class="font-medium text-gray-900">{{ recipe.nickname || recipe.channel_name || '크리에이터' }}</p>
                <a
                  v-if="recipe.youtube_channel_url"
                  :href="recipe.youtube_channel_url"
                  target="_blank"
                  rel="noopener"
                  class="text-sm text-red-600 hover:underline"
                >
                  YouTube 채널 방문
                </a>
              </div>
            </div>

            <!-- 기본 정보 -->
            <div class="flex items-center gap-4 mt-4 text-sm text-gray-500">
              <span v-if="recipe.category" class="flex items-center gap-1">
                <span>🍽️</span> {{ recipe.category }}
              </span>
              <span v-if="recipe.cooking_time" class="flex items-center gap-1">
                <span>⏱️</span> {{ recipe.cooking_time }}분
              </span>
              <span v-if="recipe.difficulty" class="flex items-center gap-1">
                <span>📊</span> {{ recipe.difficulty }}
              </span>
            </div>

            <!-- 통계 -->
            <div class="flex items-center gap-4 mt-3 text-sm text-gray-400">
              <span>👁️ {{ recipe.view_count }}</span>
              <span>❤️ {{ recipe.like_count }}</span>
            </div>

            <!-- 설명 -->
            <p v-if="recipe.description" class="mt-4 text-gray-600">
              {{ recipe.description }}
            </p>
          </div>
        </div>

        <!-- 재료 -->
        <div v-if="recipe.ingredients?.length > 0" class="bg-white rounded-2xl shadow-sm p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">재료</h2>
          <ul class="space-y-2">
            <li
              v-for="ingredient in recipe.ingredients"
              :key="ingredient.id"
              class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
            >
              <span class="text-gray-700">
                {{ ingredient.ingredient_name || ingredient.custom_name }}
                <span v-if="ingredient.is_main" class="text-xs text-orange-600 ml-1">(메인)</span>
              </span>
              <span v-if="ingredient.amount" class="text-gray-500 text-sm">{{ ingredient.amount }}</span>
            </li>
          </ul>
        </div>

        <!-- 조리 순서 -->
        <div v-if="recipe.steps?.length > 0" class="bg-white rounded-2xl shadow-sm p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">조리 순서</h2>
          <ol class="space-y-4">
            <li
              v-for="step in recipe.steps"
              :key="step.id"
              class="flex gap-4"
            >
              <span class="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center font-semibold text-sm">
                {{ step.step_number }}
              </span>
              <div class="flex-1">
                <p class="text-gray-700">{{ step.description }}</p>
                <img
                  v-if="step.image_url"
                  :src="step.image_url"
                  :alt="`Step ${step.step_number}`"
                  class="mt-2 rounded-lg max-w-full"
                />
              </div>
            </li>
          </ol>
        </div>
      </div>

      <!-- 로딩 -->
      <div v-else class="bg-white rounded-2xl p-8 text-center shadow-sm">
        <p class="text-gray-500">로딩 중...</p>
      </div>
    </main>
  </div>
</template>
