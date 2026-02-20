interface User {
  id: number
  nickname: string | null
  email: string | null
  profileImage: string | null
  provider: 'google' | 'email'
  onboarding_completed: boolean
}

export function useAuth() {
  const user = useState<User | null>('auth-user', () => null)
  const isLoading = useState('auth-loading', () => true)
  const isInitialized = useState('auth-initialized', () => false)

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
    } catch (error) {
      console.error('로그아웃 오류:', error)
    }
    user.value = null
    try {
      const { resetState } = useRecipeSearch()
      resetState()
    } catch {
      // 상태 초기화 실패해도 홈으로 이동
    }
    await navigateTo('/', { replace: true })
  }

  function loginWithGoogle() {
    window.location.href = '/api/auth/google/login'
  }

  async function loginWithEmail(email: string, password: string) {
    const response = await $fetch<{ user: User; redirectTo: string }>('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    user.value = response.user
    return response
  }

  async function registerWithEmail(email: string, password: string) {
    const response = await $fetch<{ user: User; redirectTo: string }>('/api/auth/register', {
      method: 'POST',
      body: { email, password }
    })
    user.value = response.user
    return response
  }

  const isLoggedIn = computed(() => !!user.value)

  function waitForAuth(): Promise<void> {
    if (isInitialized.value) return Promise.resolve()
    return new Promise((resolve) => {
      const stop = watch(isInitialized, (val) => {
        if (val) {
          stop()
          resolve()
        }
      })
    })
  }

  // 초기화 (앱 로드 시 한 번만)
  if (!isInitialized.value && import.meta.client) {
    fetchUser()
  }

  return {
    user: readonly(user),
    isLoading: readonly(isLoading),
    isLoggedIn,
    fetchUser,
    waitForAuth,
    logout,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail
  }
}
