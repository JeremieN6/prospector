export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    sessionSecret: process.env.SESSION_SECRET || 'dev-change-me',
    encryptionSecret: process.env.ENCRYPTION_SECRET || process.env.SESSION_SECRET || 'dev-encryption-secret-change-me',
    redisUrl: process.env.REDIS_URL || '',
    public: {
      appName: 'Prospector Sassify'
    }
  },
  nitro: {
    experimental: {
      tasks: true
    }
  },
  compatibilityDate: '2026-01-01'
})
