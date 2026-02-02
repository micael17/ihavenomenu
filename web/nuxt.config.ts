// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

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
    dbPath: process.env.DB_PATH || '../database/momokdi.db',
    youtubeApiKey: process.env.YOUTUBE_API_KEY || ''
  }
})
