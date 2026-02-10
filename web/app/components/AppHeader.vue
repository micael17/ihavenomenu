<script setup lang="ts">
const route = useRoute()
const { user, isLoggedIn, logout } = useAuth()

const showUserMenu = ref(false)

function isActive(path: string) {
  if (path === '/') {
    return route.path === '/' || route.path.match(/^\/\d+$/)
  }
  return route.path === path
}

function handleLogout() {
  showUserMenu.value = false
  logout()
}

function handleLogin() {
  navigateTo('/login')
}
</script>

<template>
  <header class="bg-white border-b border-gray-200">
    <div class="max-w-6xl mx-auto px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-8">
          <NuxtLink to="/" class="text-xl font-semibold text-gray-900">I Have No Menu</NuxtLink>
          <nav class="flex items-center gap-6">
            <NuxtLink
              to="/"
              :class="[
                isActive('/') ? 'text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-900'
              ]"
            >
              레시피 검색
            </NuxtLink>
            <NuxtLink
              to="/my-fridge"
              :class="[
                isActive('/my-fridge') ? 'text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-900'
              ]"
            >
              내 재료
            </NuxtLink>
          </nav>
        </div>

        <!-- 로그인 상태 -->
        <div v-if="isLoggedIn" class="relative">
          <button
            @click="showUserMenu = !showUserMenu"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div class="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
              <img
                v-if="user?.profileImage"
                :src="user.profileImage"
                :alt="user.nickname || '프로필'"
                class="w-full h-full object-cover"
              />
              <span v-else class="text-sm text-gray-500">{{ user?.nickname?.charAt(0) || '?' }}</span>
            </div>
            <span class="text-sm text-gray-700">{{ user?.nickname }}</span>
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- 드롭다운 메뉴 -->
          <div
            v-if="showUserMenu"
            class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
          >
            <div class="px-4 py-2 border-b border-gray-100">
              <p class="text-sm font-medium text-gray-900">{{ user?.nickname }}</p>
              <p class="text-xs text-gray-500">{{ user?.email || user?.provider }}</p>
            </div>
            <NuxtLink
              to="/dashboard"
              class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              @click="showUserMenu = false"
            >
              대시보드
            </NuxtLink>
            <button
              @click="handleLogout"
              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              로그아웃
            </button>
          </div>
        </div>

        <!-- 비로그인 상태 -->
        <button
          v-else
          @click="handleLogin"
          class="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"
        >
          로그인
        </button>
      </div>
    </div>
  </header>

  <!-- 외부 클릭 시 메뉴 닫기 -->
  <div
    v-if="showUserMenu"
    class="fixed inset-0 z-40"
    @click="showUserMenu = false"
  />
</template>
