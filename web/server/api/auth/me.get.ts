export default defineEventHandler((event) => {
  const user = getCurrentUser(event)

  if (!user) {
    return { user: null }
  }

  // 민감 정보 제외하고 반환
  return {
    user: {
      id: user.id,
      nickname: user.nickname,
      email: user.email,
      profileImage: user.profile_image,
      provider: user.provider,
      onboarding_completed: !!user.onboarding_completed
    }
  }
})
