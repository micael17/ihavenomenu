interface OnboardingBody {
  nickname: string
  favoriteDishes: string[]
  dislikedIngredients: string[]
  myIngredients?: {
    main?: number
    sauce?: number
    grain?: number
  }
}

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

  // 온보딩 완료 처리
  completeOnboarding(
    user.id,
    body.nickname.trim(),
    body.favoriteDishes || [],
    body.dislikedIngredients || [],
    body.myIngredients
  )

  return { success: true }
})
