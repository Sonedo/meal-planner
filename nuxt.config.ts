// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],

  devServer: {
    port: parseInt(process.env.PORT || '3000'),
  },

  // Базовый путь — задаётся через APP_BASE_URL в .env
  // Dev:  APP_BASE_URL не задан → работает на /
  // Prod: APP_BASE_URL=/wfqwefqefq23f1 → все ссылки и запросы идут через префикс
  app: {
    baseURL: process.env.APP_BASE_URL ? `${process.env.APP_BASE_URL}/` : '/',
    cdnURL:  process.env.APP_BASE_URL ? `${process.env.APP_BASE_URL}/` : '/',
  },

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'nutriplan-jwt-secret-change-in-production',
  },

  nitro: {
    preset: 'node-server',
  },
})
