export default defineNuxtRouteMiddleware((to, from) => {
  const { isLoggedIn, isLoading } = useAuth()

  // 아직 로딩 중이면 대기 (클라이언트에서만)
  if (import.meta.client && isLoading.value) {
    return
  }

  // 비로그인 상태면 로그인 페이지로 리다이렉트
  if (!isLoggedIn.value) {
    return navigateTo('/login')
  }
})
