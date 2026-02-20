export default defineEventHandler((event) => {
  // 현재 토큰을 블랙리스트에 추가하여 즉시 무효화
  const token = getAuthToken(event)
  if (token) {
    revokeToken(token)
  }

  clearAuthCookie(event)
  return { success: true }
})
