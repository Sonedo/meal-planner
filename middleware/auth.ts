// middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login' || to.path === '/register') return

  const { user, fetchMe } = useAuth()

  // На сервере: user пуст после SSR — грузим с cookie входящего запроса
  // На клиенте: плагин уже загрузил, но если нет — грузим здесь
  if (!user.value) {
    await fetchMe()
  }

  if (!user.value) {
    return navigateTo('/login')
  }
})
