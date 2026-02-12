interface User {
  id: number
  nickname: string | null
  email: string | null
  profileImage: string | null
  provider: 'google'
  onboarding_completed: boolean
}

const user = ref<User | null>(null)
const isLoading = ref(true)
const isInitialized = ref(false)

export function useAuth() {
  async function fetchUser() {
    if (import.meta.server) return

    isLoading.value = true
    try {
      const response = await $fetch<{ user: User | null }>('/api/auth/me')
      user.value = response.user
    } catch {
      user.value = null
    } finally {
      isLoading.value = false
      isInitialized.value = true
    }
  }

  async function logout() {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
      user.value = null
      navigateTo('/')
    } catch (error) {
      console.error('로그아웃 오류:', error)
    }
  }

  function loginWithGoogle() {
    window.location.href = '/api/auth/google/login'
  }

  const isLoggedIn = computed(() => !!user.value)

  // 초기화 (앱 로드 시 한 번만)
  if (!isInitialized.value && import.meta.client) {
    fetchUser()
  }

  return {
    user: readonly(user),
    isLoading: readonly(isLoading),
    isLoggedIn,
    fetchUser,
    logout,
    loginWithGoogle
  }
}
