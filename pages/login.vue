<!-- pages/login.vue -->
<template>
  <div class="min-h-screen flex items-center justify-center px-4" style="background:var(--color-bg);">
    <div class="w-full" style="max-width:400px;">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center gap-2.5 mb-3">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center text-xl" style="background:var(--color-accent); color:#0f0f11;">🥗</div>
          <span class="text-2xl font-bold" style="font-family:'Syne',sans-serif; letter-spacing:-0.03em;">НутриПлан</span>
        </div>
        <p class="text-sm" style="color:var(--color-text-dim);">Планировщик питания</p>
      </div>

      <div class="card px-6 py-6">
        <h1 class="text-lg font-bold mb-5" style="font-family:'Syne',sans-serif;">Вход</h1>

        <form @submit.prevent="submit">
          <div class="mb-4">
            <label class="label">Логин</label>
            <input v-model="form.login" class="input" placeholder="Ваш логин" autocomplete="username" required />
          </div>
          <div class="mb-5">
            <label class="label">Пароль</label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPwd ? 'text' : 'password'"
                class="input pr-10"
                placeholder="Ваш пароль"
                autocomplete="current-password"
                required
              />
              <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style="color:var(--color-muted);" @click="showPwd = !showPwd">
                {{ showPwd ? '🙈' : '👁' }}
              </button>
            </div>
          </div>

          <div v-if="error" class="mb-4 px-3 py-2 rounded-lg text-sm" style="background:#3d2020; color:#fca5a5; border:1px solid #7f1d1d;">
            {{ error }}
          </div>

          <button type="submit" class="btn btn-primary w-full justify-center py-2.5" :disabled="loading">
            {{ loading ? 'Входим…' : 'Войти' }}
          </button>
        </form>
      </div>

      <p class="text-center mt-4 text-sm" style="color:var(--color-text-dim);">
        Нет аккаунта?
        <NuxtLink to="/register" style="color:var(--color-accent);">Зарегистрироваться</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { login } = useAuth()
const router = useRouter()

const form     = reactive({ login: '', password: '' })
const error    = ref('')
const loading  = ref(false)
const showPwd  = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await login(form.login, form.password)
    await router.push('/')
  } catch (e: any) {
    error.value = e?.data?.statusMessage ?? 'Ошибка входа'
  } finally { loading.value = false }
}
</script>
