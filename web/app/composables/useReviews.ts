interface ReviewUser {
  nickname: string | null
  profile_image: string | null
}

export interface ReviewItem {
  id: number
  user_id: number
  target_type: string
  target_id: number
  rating: number
  content: string | null
  photo_urls: string[]
  ingredient_ids: number[]
  like_count: number
  liked: boolean
  created_at: string
  updated_at: string
  nickname: string | null
  profile_image: string | null
}

export function useReviews(targetType: string, targetId: number) {
  const reviews = ref<ReviewItem[]>([])
  const total = ref(0)
  const avgRating = ref(0)
  const hasMore = ref(false)
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const submitError = ref('')
  const offset = ref(0)
  const limit = 20

  const { user, isLoggedIn } = useAuth()

  const userHasReview = computed(() => {
    if (!user.value) return false
    return reviews.value.some(r => r.user_id === user.value!.id)
  })

  async function loadReviews() {
    isLoading.value = true
    offset.value = 0
    try {
      const response = await $fetch<{
        reviews: ReviewItem[]
        total: number
        avgRating: number
        hasMore: boolean
      }>('/api/reviews', {
        query: { targetType, targetId, offset: 0, limit }
      })

      reviews.value = response.reviews
      total.value = response.total
      avgRating.value = response.avgRating
      hasMore.value = response.hasMore
      offset.value = limit
    } catch {
      reviews.value = []
      total.value = 0
      avgRating.value = 0
    } finally {
      isLoading.value = false
    }
  }

  async function loadMore() {
    if (isLoading.value || !hasMore.value) return
    isLoading.value = true
    try {
      const response = await $fetch<{
        reviews: ReviewItem[]
        total: number
        avgRating: number
        hasMore: boolean
      }>('/api/reviews', {
        query: { targetType, targetId, offset: offset.value, limit }
      })

      reviews.value = [...reviews.value, ...response.reviews]
      hasMore.value = response.hasMore
      offset.value += limit
    } catch {
      // 무시
    } finally {
      isLoading.value = false
    }
  }

  async function submitReview(data: {
    rating: number
    content?: string
    photoUrls?: string[]
    ingredientIds?: number[]
  }) {
    isSubmitting.value = true
    submitError.value = ''
    try {
      await $fetch('/api/reviews', {
        method: 'POST',
        body: {
          targetType,
          targetId,
          ...data
        }
      })
      await loadReviews()
      return true
    } catch (error: any) {
      submitError.value = error?.data?.message || error?.message || '등록 실패'
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  async function deleteReview(reviewId: number) {
    try {
      await $fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' })
      await loadReviews()
      return true
    } catch {
      return false
    }
  }

  async function toggleLike(reviewId: number) {
    try {
      const result = await $fetch<{ liked: boolean; likeCount: number }>(
        `/api/reviews/${reviewId}/like`,
        { method: 'POST' }
      )
      reviews.value = reviews.value.map(r =>
        r.id === reviewId
          ? { ...r, liked: result.liked, like_count: result.likeCount }
          : r
      )
    } catch {
      // 무시
    }
  }

  return {
    reviews: readonly(reviews),
    total: readonly(total),
    avgRating: readonly(avgRating),
    hasMore: readonly(hasMore),
    isLoading: readonly(isLoading),
    isSubmitting: readonly(isSubmitting),
    submitError: readonly(submitError),
    userHasReview,
    loadReviews,
    loadMore,
    submitReview,
    deleteReview,
    toggleLike
  }
}
