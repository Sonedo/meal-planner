// composables/useAuth.ts
// SPA режим — всё выполняется на клиенте, cookie браузер отправляет сам

export interface AuthUser {
  id: number
  login: string
  display_name: string
  family_id: number | null
  family_role: string | null
  family_name: string | null
  invite_code?: string | null
}

export function useAuth() {
  const user    = useState<AuthUser | null>('auth_user', () => null)
  const loading = useState<boolean>('auth_loading', () => false)

  async function fetchMe() {
    try {
      loading.value = true
      user.value = await $fetch<AuthUser>('/api/auth/me')
    } catch {
      user.value = null
    } finally {
      loading.value = false
    }
  }

  async function login(loginStr: string, password: string) {
    const res = await $fetch<{ user: AuthUser; token: string }>('/api/auth/login', {
      method: 'POST', body: { login: loginStr, password },
    })
    user.value = res.user
    return res
  }

  async function register(loginStr: string, password: string, display_name: string) {
    const res = await $fetch<{ user: AuthUser; token: string }>('/api/auth/register', {
      method: 'POST', body: { login: loginStr, password, display_name },
    })
    user.value = res.user
    return res
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    await navigateTo('/login')
  }

  async function refreshMe() {
    user.value = await $fetch<AuthUser>('/api/auth/me')
  }

  const isAuthenticated = computed(() => !!user.value)
  const hasFamily       = computed(() => !!user.value?.family_id)
  const isOwner         = computed(() => user.value?.family_role === 'owner')

  return { user, loading, isAuthenticated, hasFamily, isOwner, fetchMe, login, register, logout, refreshMe }
}
