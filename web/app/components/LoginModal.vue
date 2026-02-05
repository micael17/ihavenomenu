<script setup lang="ts">
const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const { loginWithKakao, loginWithNaver } = useAuth()

function handleKakaoLogin() {
  loginWithKakao()
}

function handleNaverLogin() {
  loginWithNaver()
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      @click="handleBackdropClick"
    >
      <div class="bg-white w-full max-w-sm rounded-2xl overflow-hidden">
        <!-- 헤더 -->
        <div class="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">로그인</h2>
          <button
            @click="emit('close')"
            class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
          >
            ✕
          </button>
        </div>

        <!-- 본문 -->
        <div class="p-6 space-y-4">
          <p class="text-center text-gray-600 text-sm mb-6">
            소셜 계정으로 간편하게 시작하세요
          </p>

          <!-- 카카오 로그인 -->
          <button
            @click="handleKakaoLogin"
            class="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-colors"
            style="background-color: #FEE500; color: #000000;"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.8 5.16 4.44 6.6-.18.66-.72 2.64-.84 3.06-.12.54.18.54.42.42.18-.12 2.88-1.98 4.02-2.76.6.12 1.26.18 1.92.18 5.52 0 10-3.48 10-7.8S17.52 3 12 3z"/>
            </svg>
            카카오로 시작하기
          </button>

          <!-- 네이버 로그인 -->
          <button
            @click="handleNaverLogin"
            class="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-colors text-white"
            style="background-color: #03C75A;"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.273 12.845 7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
            </svg>
            네이버로 시작하기
          </button>
        </div>

        <!-- 푸터 -->
        <div class="px-6 py-4 bg-gray-50 text-center">
          <p class="text-xs text-gray-500">
            로그인 시 <a href="#" class="underline">서비스 이용약관</a> 및 <a href="#" class="underline">개인정보처리방침</a>에 동의합니다
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>
