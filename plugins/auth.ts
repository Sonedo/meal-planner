// plugins/auth.ts — только клиент, восстанавливает сессию при навигации
export default defineNuxtPlugin({
  name: 'auth',
  enforce: 'pre',
  async setup() {
    if (import.meta.client) {
      const { user, fetchMe } = useAuth()
      if (!user.value) {
        await fetchMe()
      }
    }
  },
})
