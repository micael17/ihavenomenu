// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  devServer: {
    port: 8031
  },

  modules: [
    '@nuxtjs/tailwindcss'
  ],

  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: 'tailwind.config.ts',
  },

  nitro: {
    // better-sqlite3 네이티브 모듈 서버사이드에서만 사용
    externals: {
      external: ['better-sqlite3']
    }
  },

  runtimeConfig: {
    dbPath: process.env.DB_PATH || '../database/ihavenomenu.db',
    youtubeApiKey: process.env.YOUTUBE_API_KEY || '',
    jwtSecret: process.env.JWT_SECRET || 'ihavenomenu-secret-key-change-in-production',
    kakaoClientId: process.env.KAKAO_CLIENT_ID || '',
    kakaoClientSecret: process.env.KAKAO_CLIENT_SECRET || '',
    kakaoRedirectUri: process.env.KAKAO_REDIRECT_URI || 'http://localhost:8031/api/auth/kakao/callback',
    naverClientId: process.env.NAVER_CLIENT_ID || '',
    naverClientSecret: process.env.NAVER_CLIENT_SECRET || '',
    naverRedirectUri: process.env.NAVER_REDIRECT_URI || 'http://localhost:8031/api/auth/naver/callback',
    public: {
      kakaoClientId: process.env.KAKAO_CLIENT_ID || '',
      naverClientId: process.env.NAVER_CLIENT_ID || ''
    }
  }
})
