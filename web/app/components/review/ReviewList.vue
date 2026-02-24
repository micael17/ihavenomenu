<script setup lang="ts">
import type { ReviewItem } from '~/composables/useReviews'

defineProps<{
  reviews: readonly ReviewItem[]
  hasMore: boolean
  isLoading: boolean
  currentUserId: number | null
}>()

const emit = defineEmits<{
  loadMore: []
  like: [reviewId: number]
  delete: [reviewId: number]
}>()

const { t } = useI18n()
</script>

<template>
  <div>
    <div v-if="reviews.length === 0 && !isLoading" class="text-center py-8 text-gray-400">
      <p class="text-3xl mb-2">📝</p>
      <p class="text-sm">{{ t('review.noReviews') }}</p>
      <p class="text-xs mt-1">{{ t('review.beFirstReviewer') }}</p>
    </div>

    <div v-else>
      <ReviewReviewItem
        v-for="review in reviews"
        :key="review.id"
        :review="review"
        :is-owner="review.user_id === currentUserId"
        @like="emit('like', $event)"
        @delete="emit('delete', $event)"
      />
    </div>

    <!-- 더 보기 -->
    <div v-if="hasMore" class="text-center mt-4">
      <button
        @click="emit('loadMore')"
        :disabled="isLoading"
        class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-50"
      >
        {{ isLoading ? t('common.loading') : t('review.loadMore') }}
      </button>
    </div>
  </div>
</template>
