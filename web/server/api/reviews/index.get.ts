export default defineEventHandler((event) => {
  const query = getQuery(event)

  const targetType = query.targetType as string
  const targetId = Number(query.targetId)
  const offset = Number(query.offset) || 0
  const limit = Math.min(Number(query.limit) || 20, 50)

  if (!targetType || !['dish', 'user_recipe'].includes(targetType)) {
    throw createError({ statusCode: 400, message: 'targetType은 dish 또는 user_recipe여야 합니다' })
  }

  if (!targetId || isNaN(targetId)) {
    throw createError({ statusCode: 400, message: 'targetId가 필요합니다' })
  }

  // 로그인 사용자면 좋아요 상태 포함
  const user = getCurrentUser(event)
  const result = getReviews(targetType, targetId, { offset, limit, userId: user?.id })

  return {
    reviews: result.reviews,
    total: result.total,
    avgRating: result.avgRating,
    hasMore: offset + limit < result.total
  }
})
