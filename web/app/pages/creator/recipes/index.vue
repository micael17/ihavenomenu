<script setup lang="ts">
interface Recipe {
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
  status: 'draft' | 'published'
  created_at: string
}

interface Creator {
  id: number
  user_id: number
  youtube_channel_url: string | null
  channel_name: string | null
}

definePageMeta({
  middleware: 'auth'
})

const { t } = useI18n()

const { data, refresh } = await useFetch<{ recipes: Recipe[]; creator: Creator | null }>('/api/recipes/my')

const recipes = computed(() => data.value?.recipes || [])
const creator = computed(() => data.value?.creator)

// 크리에이터가 아니면 등록 페이지로
if (!creator.value) {
  navigateTo('/creator/register')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <main class="max-w-2xl mx-auto px-4 py-8">
      <!-- 헤더 -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">{{ t('creator.myRecipes') }}</h1>
          <p class="text-gray-500 mt-1">{{ t('creator.recipesCount', { count: recipes.length }) }}</p>
        </div>
        <NuxtLink
          to="/creator/recipes/new"
          class="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800"
        >
          {{ t('creator.newRecipe') }}
        </NuxtLink>
      </div>

      <!-- 빈 상태 -->
      <div v-if="recipes.length === 0" class="bg-white rounded-2xl p-8 text-center shadow-sm">
        <span class="text-5xl">📝</span>
        <h2 class="text-lg font-medium text-gray-900 mt-4">{{ t('creator.noRecipesYet') }}</h2>
        <p class="text-gray-500 mt-2 text-sm">{{ t('creator.writeFirstRecipe') }}</p>
        <NuxtLink
          to="/creator/recipes/new"
          class="inline-block mt-4 px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800"
        >
          {{ t('creator.writeRecipe') }}
        </NuxtLink>
      </div>

      <!-- 레시피 목록 -->
      <div v-else class="space-y-3">
        <div
          v-for="recipe in recipes"
          :key="recipe.id"
          class="bg-white rounded-xl p-4 shadow-sm flex gap-4"
        >
          <!-- 썸네일 -->
          <div class="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <img
              v-if="recipe.youtube_thumbnail"
              :src="recipe.youtube_thumbnail"
              :alt="recipe.title"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-2xl">
              🍳
            </div>
          </div>

          <!-- 정보 -->
          <div class="flex-1 min-w-0">
            <h3 class="font-medium text-gray-900">{{ recipe.title }}</h3>
            <div class="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <span v-if="recipe.category">{{ recipe.category }}</span>
              <span v-if="recipe.cooking_time">• {{ recipe.cooking_time }}{{ t('common.minutes') }}</span>
            </div>
            <div class="flex items-center gap-4 mt-2 text-sm text-gray-400">
              <span>👁️ {{ recipe.view_count }}</span>
              <span>❤️ {{ recipe.like_count }}</span>
            </div>
            <div class="mt-2">
              <span
                :class="[
                  'text-xs px-2 py-0.5 rounded',
                  recipe.status === 'published'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                ]"
              >
                {{ recipe.status === 'published' ? t('common.published') : t('common.draft') }}
              </span>
            </div>
          </div>

          <!-- 액션 -->
          <div class="flex flex-col gap-2">
            <NuxtLink
              :to="`/recipe/${recipe.id}`"
              class="text-sm text-gray-500 hover:text-gray-900"
            >
              {{ t('common.view') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
