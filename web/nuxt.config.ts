// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },

  devServer: {
    port: 8031
  },

  app: {
    head: {
      title: 'I Have No Menu',
      htmlAttrs: {
        lang: 'en'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Find delicious recipes with the ingredients you already have. No more wondering what to cook!' },
        { name: 'theme-color', content: '#111827' },
        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'I Have No Menu' },
        { property: 'og:description', content: 'Find delicious recipes with the ingredients you already have.' },
        { property: 'og:image', content: '/og-image.svg' },
        { property: 'og:site_name', content: 'I Have No Menu' },
        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'I Have No Menu' },
        { name: 'twitter:description', content: 'Find delicious recipes with the ingredients you already have.' },
        { name: 'twitter:image', content: '/og-image.svg' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.svg' },
        { rel: 'manifest', href: '/manifest.json' }
      ]
    }
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/i18n',
    '@nuxtjs/sitemap'
  ],

  site: {
    url: process.env.SITE_URL || 'https://ihavenomenu.com'
  },

  sitemap: {
    sources: ['/api/__sitemap__/urls']
  },

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
