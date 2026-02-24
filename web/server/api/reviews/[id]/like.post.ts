export default defineEventHandler((event) => {
  checkRateLimit(event, { maxRequests: 30, windowMs: 60000 })
  const user = requireAuth(event)
  const reviewId = Number(getRouterParam(event, 'id'))

  if (!reviewId || isNaN(reviewId)) {
    throw createError({ statusCode: 400, message: '유효하지 않은 리뷰 ID입니다' })
  }

  const result = toggleReviewLike(reviewId, user.id)

  if (!result) {
    throw createError({ statusCode: 404, message: '리뷰를 찾을 수 없습니다' })
  }

  return result
})
