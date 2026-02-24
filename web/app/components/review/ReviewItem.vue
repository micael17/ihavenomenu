<script setup lang="ts">
import type { ReviewItem } from '~/composables/useReviews'

const props = defineProps<{
  review: ReviewItem
  isOwner: boolean
}>()

const emit = defineEmits<{
  like: [reviewId: number]
  delete: [reviewId: number]
}>()

const { t } = useI18n()

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

function handleDelete() {
  if (confirm(t('review.deleteConfirm'))) {
    emit('delete', props.review.id)
  }
}
</script>

<template>
  <div class="py-4 border-b border-gray-100 last:border-0">
    <!-- 헤더: 프로필 + 별점 + 날짜 -->
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-3">
        <img
          v-if="review.profile_image"
          :src="review.profile_image"
          :alt="review.nickname || ''"
          class="w-8 h-8 rounded-full"
        />
        <div v-else class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
          👤
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-gray-900">{{ review.nickname || t('review.anonymous') }}</span>
            <span v-if="isOwner" class="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded">{{ t('review.myReview') }}</span>
          </div>
          <div class="flex items-center gap-2 mt-0.5">
            <ReviewStarRating :model-value="review.rating" readonly size="sm" />
            <span class="text-xs text-gray-400">{{ formatDate(review.created_at) }}</span>
          </div>
        </div>
      </div>

      <!-- 삭제 버튼 (본인만) -->
      <button
        v-if="isOwner"
        @click="handleDelete"
        class="text-gray-400 hover:text-red-500 text-xs"
      >
        {{ t('common.delete') }}
      </button>
    </div>

    <!-- 내용 -->
    <p v-if="review.content" class="text-sm text-gray-700 mt-3 whitespace-pre-line">{{ review.content }}</p>

    <!-- 사진 -->
    <div v-if="review.photo_urls.length > 0" class="flex gap-2 mt-3">
      <img
        v-for="(url, index) in review.photo_urls"
        :key="index"
        :src="url"
        class="w-24 h-24 object-cover rounded-lg"
      />
    </div>

    <!-- 좋아요 -->
    <div class="mt-3">
      <button
        @click="emit('like', review.id)"
        :class="[
          'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs transition-colors',
          review.liked
            ? 'bg-red-50 text-red-600'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        ]"
      >
        <span>{{ review.liked ? '❤️' : '🤍' }}</span>
        <span>{{ t('review.helpful') }}</span>
        <span v-if="review.like_count > 0" class="font-medium">{{ review.like_count }}</span>
      </button>
    </div>
  </div>
</template>
