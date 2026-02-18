<script setup lang="ts">
const { t } = useI18n()
const { loginWithGoogle, loginWithEmail, registerWithEmail, isLoggedIn } = useAuth()

const route = useRoute()

// 이미 로그인된 상태면 홈으로 리다이렉트
watch(isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    const redirect = route.query.redirect as string
    navigateTo(redirect || '/')
  }
}, { immediate: true })

// 탭 상태
const activeTab = ref<'login' | 'register'>('login')

// 폼 상태
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

// 유효성 검사
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isEmailValid = computed(() => !email.value || (email.value.length <= 64 && emailRegex.test(email.value)))
const isPasswordValid = computed(() => !password.value || (password.value.length >= 8 && password.value.length <= 16))
const isFormValid = computed(() =>
  email.value && password.value
  && email.value.length <= 64 && emailRegex.test(email.value)
  && password.value.length >= 8 && password.value.length <= 16
)

// 탭 전환 시 에러 초기화
watch(activeTab, () => {
  errorMessage.value = ''
})

async function handleSubmit() {
  if (!isFormValid.value || isSubmitting.value) return

  errorMessage.value = ''
  isSubmitting.value = true

  try {
    const redirect = route.query.redirect as string
    if (activeTab.value === 'register') {
      const response = await registerWithEmail(email.value, password.value)
      navigateTo(response.redirectTo === '/onboarding' ? '/onboarding' : (redirect || response.redirectTo))
    } else {
      const response = await loginWithEmail(email.value, password.value)
      navigateTo(response.redirectTo === '/onboarding' ? '/onboarding' : (redirect || response.redirectTo))
    }
  } catch (error: any) {
    const statusCode = error?.response?.status || error?.statusCode
    if (activeTab.value === 'register' && statusCode === 409) {
      errorMessage.value = t('auth.emailExists')
    } else if (activeTab.value === 'login' && statusCode === 401) {
      errorMessage.value = t('auth.loginFailed')
    } else {
      errorMessage.value = t('common.error')
    }
  } finally {
    isSubmitting.value = false
  }
}

function handleGoogleLogin() {
  loginWithGoogle()
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- 상단 헤더 -->
    <AppHeader />

    <!-- 로그인 폼 -->
    <main class="flex-1 flex items-center justify-center px-4">
      <div class="bg-white w-full max-w-sm rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <!-- 탭 -->
        <div class="flex border-b border-gray-200">
          <button
            @click="activeTab = 'login'"
            :class="[
              'flex-1 py-3.5 text-sm font-medium transition-colors',
              activeTab === 'login'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            ]"
          >
            {{ t('auth.loginTab') }}
          </button>
          <button
            @click="activeTab = 'register'"
            :class="[
              'flex-1 py-3.5 text-sm font-medium transition-colors',
              activeTab === 'register'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            ]"
          >
            {{ t('auth.registerTab') }}
          </button>
        </div>

        <!-- 본문 -->
        <div class="p-6">
          <!-- 이메일/비밀번호 폼 -->
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <!-- 이메일 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('auth.email') }}</label>
              <input
                v-model="email"
                type="email"
                :placeholder="t('auth.emailPlaceholder')"
                class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
                :class="{ 'border-red-400 focus:ring-red-500': email && !isEmailValid }"
              />
              <p v-if="email && !isEmailValid" class="mt-1 text-xs text-red-500">
                {{ t('auth.emailInvalid') }}
              </p>
            </div>

            <!-- 비밀번호 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('auth.password') }}</label>
              <input
                v-model="password"
                type="password"
                :placeholder="t('auth.passwordPlaceholder')"
                class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
                :class="{ 'border-red-400 focus:ring-red-500': password && !isPasswordValid }"
              />
              <p v-if="password && password.length < 8" class="mt-1 text-xs text-red-500">
                {{ t('auth.passwordMinError') }}
              </p>
              <p v-else-if="password && password.length > 16" class="mt-1 text-xs text-red-500">
                {{ t('auth.passwordMaxError') }}
              </p>
            </div>

            <!-- 에러 메시지 -->
            <p v-if="errorMessage" class="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {{ errorMessage }}
            </p>

            <!-- 제출 버튼 -->
            <button
              type="submit"
              :disabled="!isFormValid || isSubmitting"
              class="w-full py-3 rounded-xl font-medium text-white transition-colors"
              :class="isFormValid && !isSubmitting
                ? 'bg-orange-500 hover:bg-orange-600'
                : 'bg-gray-300 cursor-not-allowed'"
            >
              {{ isSubmitting
                ? t('common.processing')
                : activeTab === 'login'
                  ? t('auth.loginTab')
                  : t('auth.registerTab')
              }}
            </button>
          </form>

          <!-- 구분선 -->
          <div class="flex items-center my-5">
            <div class="flex-1 border-t border-gray-200"></div>
            <span class="px-3 text-sm text-gray-400">{{ t('auth.or') }}</span>
            <div class="flex-1 border-t border-gray-200"></div>
          </div>

          <!-- 구글 로그인 -->
          <button
            @click="handleGoogleLogin"
            class="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-colors bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {{ t('auth.continueWithGoogle') }}
          </button>
        </div>

        <!-- 푸터 -->
        <div class="px-6 py-4 bg-gray-50 text-center">
          <p class="text-xs text-gray-500">
            <i18n-t keypath="auth.termsAgreement" tag="span">
              <template #terms>
                <a href="#" class="underline">{{ t('auth.termsOfService') }}</a>
              </template>
              <template #privacy>
                <a href="#" class="underline">{{ t('auth.privacyPolicy') }}</a>
              </template>
            </i18n-t>
          </p>
        </div>
      </div>
    </main>
  </div>
</template>
