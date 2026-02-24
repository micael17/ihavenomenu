export default defineEventHandler((event) => {
  const user = requireAuth(event)
  const reviewId = Number(getRouterParam(event, 'id'))

  if (!reviewId || isNaN(reviewId)) {
    throw createError({ statusCode: 400, message: '유효하지 않은 리뷰 ID입니다' })
  }

  const result = deleteReview(reviewId, user.id)

  if (!result.deleted) {
    throw createError({ statusCode: 404, message: '리뷰를 찾을 수 없거나 삭제 권한이 없습니다' })
  }

  return { success: true }
})
