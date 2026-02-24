function sanitizeString(str: unknown, maxLength: number = 500): string | undefined {
  if (typeof str !== 'string') return undefined
  return str.trim().replace(/<[^>]*>/g, '').slice(0, maxLength) || undefined
}

export default defineEventHandler(async (event) => {
  checkRateLimit(event, { maxRequests: 5, windowMs: 60000 })
  const user = requireAuth(event)
  const body = await readBody(event)

  const { targetType, targetId, rating, content, photoUrls, ingredientIds } = body

  // targetType 검증
  if (!targetType || !['dish', 'user_recipe'].includes(targetType)) {
    throw createError({ statusCode: 400, message: 'targetType은 dish 또는 user_recipe여야 합니다' })
  }

  // targetId 검증
  const sanitizedTargetId = Number(targetId)
  if (!sanitizedTargetId || isNaN(sanitizedTargetId)) {
    throw createError({ statusCode: 400, message: 'targetId가 필요합니다' })
  }

  // 별점 검증 (1-5 정수)
  const sanitizedRating = Number(rating)
  if (!sanitizedRating || isNaN(sanitizedRating) || sanitizedRating < 1 || sanitizedRating > 5 || !Number.isInteger(sanitizedRating)) {
    throw createError({ statusCode: 400, message: '별점은 1-5 사이 정수여야 합니다' })
  }

  // 내용 검증 (선택, 최대 2000자)
  const sanitizedContent = sanitizeString(content, 2000)

  // 사진 URL 검증 (최대 3개, https만)
  const sanitizedPhotoUrls = Array.isArray(photoUrls)
    ? photoUrls
        .slice(0, 3)
        .filter((url: unknown) => typeof url === 'string' && url.startsWith('https://'))
        .map((url: string) => url.slice(0, 500))
    : []

  // 재료 ID 검증 (숫자 배열)
  const sanitizedIngredientIds = Array.isArray(ingredientIds)
    ? ingredientIds.slice(0, 30).filter((id: unknown) => typeof id === 'number' && Number.isInteger(id))
    : []

  // 중복 리뷰 체크
  const existing = getUserReviewForTarget(user.id, targetType, sanitizedTargetId)
  if (existing) {
    throw createError({ statusCode: 409, message: '이미 리뷰를 작성했습니다' })
  }

  const reviewId = createReview({
    userId: user.id,
    targetType,
    targetId: sanitizedTargetId,
    rating: sanitizedRating,
    content: sanitizedContent,
    photoUrls: sanitizedPhotoUrls.length > 0 ? sanitizedPhotoUrls : undefined,
    ingredientIds: sanitizedIngredientIds.length > 0 ? sanitizedIngredientIds : undefined
  })

  return { id: reviewId, success: true }
})
