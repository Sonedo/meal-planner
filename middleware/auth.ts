// middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  // to.path всегда без baseURL — Nuxt его убирает до middleware
  // Поэтому проверяем просто /login и /register
  const publicPaths = ['/login', '/register']
  if (publicPaths.includes(to.path)) return

  const { user, fetchMe } = useAuth()

  if (!user.value) {
    await fetchMe()
  }

  if (!user.value) {
    // navigateTo с внешним флагом — работает корректно и в SSR и на клиенте
    return navigateTo('/login', { replace: true })
  }
})
