// plugins/auth.ts — в SPA режиме всегда выполняется на клиенте
export default defineNuxtPlugin({
  name: 'auth',
  enforce: 'pre',
  async setup() {
    const { user, fetchMe } = useAuth()
    if (!user.value) {
      await fetchMe()
    }
  },
})
