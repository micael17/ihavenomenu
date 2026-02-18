export default defineNuxtRouteMiddleware(async (to, from) => {
  const { isLoggedIn, isLoading, waitForAuth } = useAuth()

  if (import.meta.client && isLoading.value) {
    await waitForAuth()
  }

  if (!isLoggedIn.value) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
