<script setup lang="ts">
defineProps<{
  avgRating: number
  reviewCount: number
}>()

const { t } = useI18n()
</script>

<template>
  <div class="flex items-center gap-3">
    <div v-if="reviewCount > 0" class="flex items-center gap-2">
      <ReviewStarRating :model-value="Math.round(avgRating)" readonly size="sm" />
      <span class="text-sm font-medium text-gray-700">{{ avgRating }}</span>
      <span class="text-sm text-gray-400">·</span>
      <span class="text-sm text-gray-500">{{ t('review.reviewCount', { count: reviewCount }) }}</span>
    </div>
    <span v-else class="text-sm text-gray-400">{{ t('review.noReviews') }}</span>
  </div>
</template>
