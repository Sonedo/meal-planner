// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],

  devServer: {
    port: parseInt(process.env.PORT || '3000'),
  },

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'nutriplan-jwt-secret-change-in-production',
  },

  nitro: {
    preset: 'node-server',
  },
})
