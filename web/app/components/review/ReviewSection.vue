<script setup lang="ts">
const props = defineProps<{
  targetType: 'dish' | 'user_recipe'
  targetId: number
}>()

const { t } = useI18n()
const { isLoggedIn, user } = useAuth()

const {
  reviews,
  total,
  avgRating,
  hasMore,
  isLoading,
  isSubmitting,
  submitError,
  userHasReview,
  loadReviews,
  loadMore,
  submitReview,
  deleteReview,
  toggleLike
} = useReviews(props.targetType, props.targetId)

const showForm = ref(false)

const currentUserId = computed(() => user.value?.id ?? null)

async function handleSubmit(data: { rating: number; content?: string; photoUrls?: string[] }) {
  const success = await submitReview(data)
  if (success) {
    showForm.value = false
  }
}

function handleCancel() {
  showForm.value = false
}

onMounted(() => {
  loadReviews()
})
</script>

<template>
  <section class="bg-white border border-gray-200 rounded-lg p-6">
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-semibold text-gray-900">{{ t('review.title') }}</h2>
      <ReviewReviewSummary :avg-rating="avgRating" :review-count="total" />
    </div>

    <!-- 리뷰 작성 버튼 / 폼 -->
    <div v-if="isLoggedIn" class="mb-4">
      <div v-if="userHasReview" class="text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-2">
        {{ t('review.alreadyReviewed') }}
      </div>
      <div v-else-if="!showForm">
        <button
          @click="showForm = true"
          class="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
        >
          {{ t('review.writeReview') }}
        </button>
      </div>
      <div v-else class="bg-gray-50 rounded-lg p-4">
        <ReviewReviewForm
          :is-submitting="isSubmitting"
          :submit-error="submitError"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </div>
    </div>
    <div v-else class="mb-4">
      <div class="text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-3 text-center">
        <p>{{ t('review.loginToReview') }}</p>
        <NuxtLink to="/login" class="text-gray-900 font-medium hover:underline mt-1 inline-block">
          {{ t('common.login') }} →
        </NuxtLink>
      </div>
    </div>

    <!-- 리뷰 목록 -->
    <ReviewReviewList
      :reviews="reviews"
      :has-more="hasMore"
      :is-loading="isLoading"
      :current-user-id="currentUserId"
      @load-more="loadMore"
      @like="toggleLike"
      @delete="deleteReview"
    />
  </section>
</template>
