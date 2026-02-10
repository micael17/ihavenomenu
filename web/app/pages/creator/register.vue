<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { user } = useAuth()

const step = ref(1)
const isLoading = ref(false)
const youtubeUrl = ref('')
const channelInfo = ref<{
  name: string
  thumbnail: string
} | null>(null)
const isLoadingChannel = ref(false)
const error = ref('')

// 이미 크리에이터인지 확인
const { data: creatorData } = await useFetch('/api/creator/me')
if (creatorData.value?.creator) {
  navigateTo('/creator/recipes')
}

// YouTube 채널 URL에서 정보 추출 (간단한 버전)
async function fetchChannelInfo() {
  if (!youtubeUrl.value) return

  isLoadingChannel.value = true
  error.value = ''

  try {
    // YouTube URL 파싱
    const url = youtubeUrl.value.trim()
    let channelName = ''

    // @username 형태
    if (url.includes('@')) {
      const match = url.match(/@([^/\s]+)/)
      if (match?.[1]) channelName = match[1]
    }
    // /channel/ 형태
    else if (url.includes('/channel/')) {
      channelName = '채널'
    }
    // /c/ 형태
    else if (url.includes('/c/')) {
      const match = url.match(/\/c\/([^/\s]+)/)
      if (match?.[1]) channelName = match[1]
    }

    if (channelName) {
      channelInfo.value = {
        name: channelName,
        thumbnail: '' // 실제로는 YouTube API로 가져와야 함
      }
      step.value = 2
    } else {
      error.value = '올바른 YouTube 채널 URL을 입력해주세요'
    }
  } catch (e) {
    error.value = '채널 정보를 가져오는데 실패했습니다'
  } finally {
    isLoadingChannel.value = false
  }
}

// 채널 없이 시작
function skipChannel() {
  channelInfo.value = null
  step.value = 2
}

// 크리에이터 등록
async function registerCreator() {
  isLoading.value = true

  try {
    await $fetch('/api/creator/register', {
      method: 'POST',
      body: {
        youtubeChannelUrl: youtubeUrl.value || undefined,
        channelName: channelInfo.value?.name || user.value?.nickname || undefined,
        channelThumbnail: channelInfo.value?.thumbnail || undefined
      }
    })

    navigateTo('/creator/recipes/new')
  } catch (e) {
    error.value = '등록에 실패했습니다. 다시 시도해주세요.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <main class="max-w-md mx-auto px-4 py-8">
      <!-- Step 1: 유튜브 채널 연동 -->
      <div v-if="step === 1" class="bg-white rounded-2xl p-6 shadow-sm">
        <div class="text-center mb-6">
          <span class="text-5xl">👨‍🍳</span>
          <h1 class="text-xl font-semibold text-gray-900 mt-4">크리에이터로 시작하기</h1>
          <p class="text-gray-500 mt-2 text-sm">
            레시피를 공유하고 채널을 홍보하세요!
          </p>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              📺 YouTube 채널 URL
            </label>
            <input
              v-model="youtubeUrl"
              type="url"
              placeholder="https://youtube.com/@..."
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              @keyup.enter="fetchChannelInfo"
            />
            <p v-if="error" class="text-red-500 text-sm mt-2">{{ error }}</p>
          </div>

          <button
            @click="fetchChannelInfo"
            :disabled="!youtubeUrl || isLoadingChannel"
            class="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <span v-if="isLoadingChannel">확인 중...</span>
            <span v-else>채널 연동하기</span>
          </button>

          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-200"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-white text-gray-500">또는</span>
            </div>
          </div>

          <button
            @click="skipChannel"
            class="w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
          >
            채널 없이 시작하기
          </button>
          <p class="text-xs text-gray-400 text-center">
            나중에 채널을 연동할 수 있어요
          </p>
        </div>
      </div>

      <!-- Step 2: 확인 및 완료 -->
      <div v-else-if="step === 2" class="bg-white rounded-2xl p-6 shadow-sm">
        <div class="text-center mb-6">
          <span class="text-5xl">✅</span>
          <h1 class="text-xl font-semibold text-gray-900 mt-4">준비 완료!</h1>
        </div>

        <!-- 채널 정보 표시 -->
        <div v-if="channelInfo" class="bg-gray-50 rounded-xl p-4 mb-6">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
              {{ channelInfo.name.charAt(0).toUpperCase() }}
            </div>
            <div>
              <p class="font-medium text-gray-900">{{ channelInfo.name }}</p>
              <p class="text-sm text-gray-500">YouTube 채널</p>
            </div>
          </div>
        </div>

        <div v-else class="bg-gray-50 rounded-xl p-4 mb-6 text-center">
          <p class="text-gray-600">채널 연동 없이 시작합니다</p>
          <p class="text-sm text-gray-400 mt-1">설정에서 나중에 연동할 수 있어요</p>
        </div>

        <div class="space-y-3">
          <p class="text-sm text-gray-600 text-center mb-4">
            크리에이터가 되면 레시피를 작성하고<br />
            다른 사용자들과 공유할 수 있어요!
          </p>

          <button
            @click="registerCreator"
            :disabled="isLoading"
            class="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:bg-gray-300"
          >
            <span v-if="isLoading">등록 중...</span>
            <span v-else>🚀 크리에이터 시작하기</span>
          </button>

          <button
            @click="step = 1"
            class="w-full py-3 text-gray-500 text-sm hover:text-gray-700"
          >
            ← 이전으로
          </button>
        </div>

        <p v-if="error" class="text-red-500 text-sm mt-4 text-center">{{ error }}</p>
      </div>
    </main>
  </div>
</template>
