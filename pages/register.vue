<!-- pages/register.vue -->
<template>
  <div class="min-h-screen flex items-center justify-center px-4" style="background:var(--color-bg);">
    <div class="w-full" style="max-width:420px;">
      <div class="text-center mb-8">
        <div class="inline-flex items-center gap-2.5 mb-3">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center text-xl" style="background:var(--color-accent); color:#0f0f11;">🥗</div>
          <span class="text-2xl font-bold" style="font-family:'Syne',sans-serif; letter-spacing:-0.03em;">НутриПлан</span>
        </div>
        <p class="text-sm" style="color:var(--color-text-dim);">Планировщик питания</p>
      </div>

      <div class="card px-6 py-6">
        <h1 class="text-lg font-bold mb-5" style="font-family:'Syne',sans-serif;">Регистрация</h1>

        <form @submit.prevent="submit">
          <div class="mb-4">
            <label class="label">Логин *</label>
            <input v-model="form.login" class="input" placeholder="Любые символы, мин. 2" autocomplete="username" required minlength="2" />
            <p class="text-xs mt-1" style="color:var(--color-muted);">Будет использоваться для входа</p>
          </div>

          <div class="mb-4">
            <label class="label">Отображаемое имя *</label>
            <input v-model="form.display_name" class="input" placeholder="Как вас называть?" required />
          </div>

          <div class="mb-2">
            <label class="label">Пароль *</label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPwd ? 'text' : 'password'"
                class="input pr-10"
                placeholder="Придумайте пароль"
                autocomplete="new-password"
                required
                @input="checkPassword"
              />
              <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style="color:var(--color-muted);" @click="showPwd = !showPwd">
                {{ showPwd ? '🙈' : '👁' }}
              </button>
            </div>
          </div>

          <!-- Требования к паролю -->
          <div class="mb-4 space-y-1">
            <div v-for="rule in passwordRules" :key="rule.text" class="flex items-center gap-2 text-xs">
              <span :style="rule.ok ? 'color:var(--color-accent)' : 'color:var(--color-muted)'">
                {{ rule.ok ? '✓' : '○' }}
              </span>
              <span :style="rule.ok ? 'color:var(--color-text)' : 'color:var(--color-muted)'">{{ rule.text }}</span>
            </div>
          </div>

          <div class="mb-5">
            <label class="label">Повтор пароля *</label>
            <input
              v-model="form.confirm"
              :type="showPwd ? 'text' : 'password'"
              class="input"
              :style="form.confirm && form.confirm !== form.password ? 'border-color:#f87171' : ''"
              placeholder="Повторите пароль"
              autocomplete="new-password"
              required
            />
            <p v-if="form.confirm && form.confirm !== form.password" class="text-xs mt-1" style="color:#f87171;">
              Пароли не совпадают
            </p>
          </div>

          <div v-if="error" class="mb-4 px-3 py-2 rounded-lg text-sm" style="background:#3d2020; color:#fca5a5; border:1px solid #7f1d1d;">
            {{ error }}
          </div>

          <button type="submit" class="btn btn-primary w-full justify-center py-2.5" :disabled="loading || !allRulesOk || form.password !== form.confirm">
            {{ loading ? 'Создаём аккаунт…' : 'Зарегистрироваться' }}
          </button>
        </form>
      </div>

      <p class="text-center mt-4 text-sm" style="color:var(--color-text-dim);">
        Уже есть аккаунт?
        <NuxtLink to="/login" style="color:var(--color-accent);">Войти</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { register } = useAuth()
const router = useRouter()

const form    = reactive({ login: '', display_name: '', password: '', confirm: '' })
const error   = ref('')
const loading = ref(false)
const showPwd = ref(false)

const passwordRules = ref([
  { text: 'Минимум 8 символов',              ok: false, test: (p: string) => p.length >= 8 },
  { text: 'Хотя бы одна заглавная буква',    ok: false, test: (p: string) => /[A-Z]/.test(p) },
  { text: 'Хотя бы одна строчная буква',     ok: false, test: (p: string) => /[a-z]/.test(p) },
  { text: 'Хотя бы одна цифра',              ok: false, test: (p: string) => /[0-9]/.test(p) },
  { text: 'Хотя бы один спецсимвол (!@#…)', ok: false, test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
])

const allRulesOk = computed(() => passwordRules.value.every(r => r.ok))

function checkPassword() {
  passwordRules.value.forEach(r => { r.ok = r.test(form.password) })
}

async function submit() {
  if (!allRulesOk.value || form.password !== form.confirm) return
  error.value = ''
  loading.value = true
  try {
    await register(form.login, form.password, form.display_name)
    await router.push('/')
  } catch (e: any) {
    error.value = e?.data?.statusMessage ?? 'Ошибка регистрации'
  } finally { loading.value = false }
}
</script>
