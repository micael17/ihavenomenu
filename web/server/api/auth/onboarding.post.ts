interface OnboardingBody {
  nickname: string
  favoriteDishes: string[]
  dislikedIngredients: string[]
  myIngredients?: {
    protein?: number
    sauce?: number
    carb?: number
  }
}

const MAX_FAVORITES = 50
const MAX_DISLIKED = 50

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody<OnboardingBody>(event)

  // 닉네임 검증
  if (!body.nickname || body.nickname.trim().length < 2) {
    throw createError({
      statusCode: 400,
      message: '닉네임은 2자 이상이어야 합니다'
    })
  }

  if (body.nickname.trim().length > 20) {
    throw createError({
      statusCode: 400,
      message: '닉네임은 20자 이하여야 합니다'
    })
  }

  const favoriteDishes = (body.favoriteDishes || []).slice(0, MAX_FAVORITES)
  const dislikedIngredients = (body.dislikedIngredients || []).slice(0, MAX_DISLIKED)

  // 온보딩 완료 처리
  completeOnboarding(
    user.id,
    body.nickname.trim(),
    favoriteDishes,
    dislikedIngredients,
    body.myIngredients
  )

  return { success: true }
})
