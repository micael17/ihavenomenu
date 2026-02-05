<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { user } = useAuth()

const todayRecommendations = [
  { id: 1, name: '김치찌개', match: 95, time: '30분', ingredients: ['김치', '돼지고기', '두부'] },
  { id: 2, name: '계란말이', match: 100, time: '15분', ingredients: ['계란', '당근', '양파'] },
  { id: 3, name: '볶음밥', match: 80, time: '20분', ingredients: ['밥', '계란', '대파'] },
  { id: 4, name: '된장찌개', match: 85, time: '25분', ingredients: ['된장', '두부', '애호박'] },
]

const expiringIngredients = [
  { name: '돼지고기', daysLeft: 1, category: '냉장' },
  { name: '우유', daysLeft: 2, category: '냉장' },
  { name: '두부', daysLeft: 3, category: '냉장' },
]

const recentDishes = [
  { name: '된장찌개', date: '2025.02.02' },
  { name: '볶음밥', date: '2025.01.31' },
  { name: '라면', date: '2025.01.30' },
  { name: '김치찌개', date: '2025.01.28' },
]

const stats = {
  thisWeek: { dishes: 5, ingredients: 12, newRecipes: 2 },
  thisMonth: { dishes: 18, ingredients: 42, newRecipes: 7 }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 상단 헤더 -->
    <AppHeader />

    <main class="max-w-6xl mx-auto px-6 py-8">
      <!-- 환영 메시지 -->
      <div class="mb-8">
        <h1 class="text-2xl font-semibold text-gray-900">안녕하세요, {{ user?.nickname || '사용자' }}님</h1>
        <p class="text-gray-500 mt-1">오늘은 무엇을 요리해볼까요?</p>
      </div>

      <div class="grid grid-cols-3 gap-6">
        <!-- 왼쪽 2/3: 메인 콘텐츠 -->
        <div class="col-span-2 space-y-6">
          <!-- 유통기한 임박 알림 -->
          <section class="bg-white border border-gray-200 rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-semibold text-gray-900">⏰ 빨리 써야 하는 재료</h2>
              <NuxtLink to="/my-fridge" class="text-sm text-gray-500 hover:text-gray-900">
                전체 재료 보기 →
              </NuxtLink>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div
                v-for="item in expiringIngredients"
                :key="item.name"
                class="p-4 bg-gray-50 rounded-lg"
              >
                <div class="flex items-center justify-between">
                  <span class="font-medium text-gray-900">{{ item.name }}</span>
                  <span class="text-sm text-red-500">D-{{ item.daysLeft }}</span>
                </div>
                <span class="text-xs text-gray-500">{{ item.category }}</span>
              </div>
            </div>
            <button class="mt-4 w-full py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              이 재료로 요리 찾기
            </button>
          </section>

          <!-- 오늘의 추천 -->
          <section class="bg-white border border-gray-200 rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-semibold text-gray-900">✨ 오늘의 추천</h2>
              <button class="text-sm text-gray-500 hover:text-gray-900">새로고침</button>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <button
                v-for="dish in todayRecommendations"
                :key="dish.id"
                class="p-4 border border-gray-100 rounded-lg text-left hover:border-gray-300 transition-colors"
              >
                <div class="flex items-start justify-between mb-2">
                  <div>
                    <p class="font-medium text-gray-900">{{ dish.name }}</p>
                    <p class="text-sm text-gray-500">{{ dish.time }}</p>
                  </div>
                  <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{{ dish.match }}% 일치</span>
                </div>
                <p class="text-xs text-gray-400">{{ dish.ingredients.join(', ') }}</p>
              </button>
            </div>
          </section>
        </div>

        <!-- 오른쪽 1/3: 사이드바 -->
        <div class="space-y-6">
          <!-- 이번 주 통계 -->
          <section class="bg-gray-900 text-white rounded-lg p-6">
            <h2 class="font-semibold mb-4">📊 이번 주</h2>
            <div class="space-y-4">
              <div class="flex justify-between">
                <span class="text-gray-400">요리 횟수</span>
                <span class="font-medium">{{ stats.thisWeek.dishes }}회</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">사용한 재료</span>
                <span class="font-medium">{{ stats.thisWeek.ingredients }}개</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">새 레시피</span>
                <span class="font-medium">{{ stats.thisWeek.newRecipes }}개</span>
              </div>
            </div>
          </section>

          <!-- 최근 요리 기록 -->
          <section class="bg-white border border-gray-200 rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-semibold text-gray-900">📋 최근 요리</h2>
              <button class="text-sm text-gray-500 hover:text-gray-900">전체</button>
            </div>
            <div class="space-y-3">
              <div
                v-for="dish in recentDishes"
                :key="dish.name"
                class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <span class="text-gray-900">{{ dish.name }}</span>
                <span class="text-xs text-gray-400">{{ dish.date }}</span>
              </div>
            </div>
          </section>

          <!-- 빠른 액션 -->
          <section class="bg-white border border-gray-200 rounded-lg p-6">
            <h2 class="font-semibold text-gray-900 mb-4">빠른 메뉴</h2>
            <div class="space-y-2">
              <NuxtLink
                to="/my-fridge"
                class="block px-4 py-3 bg-gray-50 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                🧊 내 재료 관리
              </NuxtLink>
              <NuxtLink
                to="/"
                class="block px-4 py-3 bg-gray-50 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                🔍 레시피 검색
              </NuxtLink>
              <button class="w-full px-4 py-3 bg-gray-50 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-left">
                📝 장보기 목록
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>
