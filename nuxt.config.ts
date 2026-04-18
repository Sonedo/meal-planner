// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],

  devServer: {
    port: parseInt(process.env.PORT || '3000'),
  },

  // Отключаем SSR — рендерим всё на клиенте (SPA режим)
  // Это решает все проблемы с baseURL + cookie + hydration mismatch
  ssr: false,

  app: {
    baseURL: process.env.APP_BASE_URL
      ? `/${process.env.APP_BASE_URL.replace(/^\/+|\/+$/g, '')}/`
      : '/',
  },

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'nutriplan-jwt-secret-change-in-production',
  },

  nitro: {
    preset: 'node-server',
  },
})
