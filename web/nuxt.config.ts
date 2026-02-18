// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },

  devServer: {
    port: 8031
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/i18n'
  ],

  i18n: {
    locales: [
      { code: 'en', file: 'en.json', name: 'English' },
      { code: 'ko', file: 'ko.json', name: '한국어' }
    ],
    defaultLocale: 'en',
    lazy: true,
    langDir: 'locales/',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
      alwaysRedirect: false,
      fallbackLocale: 'en'
    }
  },

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
    // Google OAuth
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8031/api/auth/google/callback',
    public: {}
  }
})
