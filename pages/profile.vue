<!-- pages/profile.vue -->
<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Профиль</h1>
    </div>

    <!-- Пользователь -->
    <div class="card px-5 py-5 mb-5">
      <div class="flex items-center gap-4 mb-5">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold flex-shrink-0" style="background:var(--color-accent); color:#0f0f11; font-family:'Syne',sans-serif;">
          {{ user?.display_name?.[0]?.toUpperCase() }}
        </div>
        <div>
          <p class="font-bold text-base" style="font-family:'Syne',sans-serif;">{{ user?.display_name }}</p>
          <p class="text-sm" style="color:var(--color-muted);">@{{ user?.login }}</p>
        </div>
      </div>
      <div class="flex gap-2 flex-wrap">
        <button class="btn btn-secondary text-sm py-1.5" @click="logout">Выйти</button>
        <button class="btn btn-danger text-sm py-1.5" @click="confirmDelete = true">Удалить аккаунт</button>
      </div>
    </div>

    <!-- Семья -->
    <div class="card px-5 py-5">
      <h2 class="text-base font-bold mb-4" style="font-family:'Syne',sans-serif;">
        🏠 Семья
        <span v-if="user?.family_name" class="text-sm font-normal ml-2" style="color:var(--color-accent);">{{ user.family_name }}</span>
      </h2>

      <!-- Нет семьи -->
      <div v-if="!user?.family_id">
        <p class="text-sm mb-5" style="color:var(--color-text-dim);">Создайте семью, чтобы объединить планировщики и получать общий список покупок.</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-4 rounded-xl" style="border:1px solid var(--color-border);">
            <p class="text-sm font-bold mb-2" style="font-family:'Syne',sans-serif;">Создать семью</p>
            <input v-model="createName" class="input mb-3 text-sm" placeholder="Название семьи" />
            <button class="btn btn-primary text-sm py-1.5 w-full justify-center" :disabled="!createName.trim() || actLoading" @click="createFamily">
              {{ actLoading ? '…' : 'Создать' }}
            </button>
          </div>
          <div class="p-4 rounded-xl" style="border:1px solid var(--color-border);">
            <p class="text-sm font-bold mb-2" style="font-family:'Syne',sans-serif;">Вступить по коду</p>
            <input v-model="joinCode" class="input mb-3 text-sm uppercase" placeholder="XXXXXXXX" maxlength="8" />
            <button class="btn btn-secondary text-sm py-1.5 w-full justify-center" :disabled="joinCode.length < 8 || actLoading" @click="joinFamily">
              {{ actLoading ? '…' : 'Вступить' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Есть семья -->
      <div v-else>
        <!-- Код приглашения — всегда виден владельцу -->
        <div class="mb-5 p-4 rounded-xl" style="background:rgba(200,240,74,0.06); border:1px solid rgba(200,240,74,0.25);">
          <p class="text-xs uppercase tracking-wider mb-2" style="color:var(--color-accent); font-family:'Syne',sans-serif;">
            {{ user.family_role === 'owner' ? 'Код приглашения' : 'Вы участник семьи' }}
          </p>
          <template v-if="user.family_role === 'owner'">
            <div class="flex items-center gap-3 flex-wrap mb-2">
              <span class="text-2xl font-bold tracking-widest" style="font-family:'Syne',sans-serif; color:var(--color-accent);">{{ family?.invite_code }}</span>
              <button class="btn btn-secondary text-xs py-1 px-2" @click="copyCode">{{ copied ? '✓ Скопировано' : 'Копировать' }}</button>
            </div>
            <p class="text-xs" style="color:var(--color-text-dim);">Поделитесь этим кодом — он постоянный и не меняется</p>
          </template>
          <template v-else>
            <p class="text-sm" style="color:var(--color-text-dim);">Код приглашения видит только владелец семьи</p>
          </template>
        </div>

        <!-- Участники -->
        <div v-if="family" class="mb-4">
          <p class="label mb-3">Участники · {{ family.members.length }}</p>
          <div class="flex flex-col gap-2">
            <div
              v-for="m in family.members" :key="m.id"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg"
              style="background:var(--color-bg); border:1px solid var(--color-border);"
            >
              <div class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0" style="background:var(--color-surface); font-family:'Syne',sans-serif;">
                {{ m.display_name[0]?.toUpperCase() }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium">{{ m.display_name }}</p>
                <p class="text-xs" style="color:var(--color-muted);">@{{ m.login }}</p>
              </div>
              <span v-if="m.family_role === 'owner'" class="tag text-xs" style="background:rgba(200,240,74,0.1); color:var(--color-accent);">Владелец</span>
              <span v-if="m.id === user?.id" class="tag text-xs">Вы</span>
              <!-- Кнопка исключить (только владелец, не себя) -->
              <button
                v-if="user.family_role === 'owner' && m.id !== user?.id"
                class="btn btn-danger text-xs py-1 px-2"
                :disabled="actLoading"
                @click="kickMember(m)"
              >Исключить</button>
            </div>
          </div>
        </div>

        <button class="btn btn-danger text-sm py-1.5" :disabled="actLoading" @click="confirmLeave = true">
          Покинуть семью
        </button>
      </div>

      <!-- Сообщение -->
      <div v-if="msg" class="mt-4 px-3 py-2 rounded-lg text-sm" :style="msgType === 'error' ? 'background:#3d2020;color:#fca5a5;border:1px solid #7f1d1d' : 'background:#1a2d1a;color:#86efac;border:1px solid #14532d'">
        {{ msg }}
      </div>
    </div>

    <!-- Диалог: покинуть семью -->

    <!-- Здоровье и нормы -->
    <div class="card px-5 py-5 mt-5">
      <h2 class="text-base font-bold mb-4" style="font-family:'Syne',sans-serif;">⚡ Параметры здоровья</h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <!-- Пол -->
        <div>
          <label class="label">Пол</label>
          <div class="flex gap-2">
            <button class="btn flex-1 justify-center" :class="health.gender === 'male' ? 'btn-primary' : 'btn-secondary'" @click="health.gender = 'male'">Мужской</button>
            <button class="btn flex-1 justify-center" :class="health.gender === 'female' ? 'btn-primary' : 'btn-secondary'" @click="health.gender = 'female'">Женский</button>
          </div>
        </div>
        <!-- Год рождения -->
        <div>
          <label class="label">Год рождения</label>
          <input v-model.number="health.birth_year" type="number" class="input" min="1940" :max="new Date().getFullYear() - 10" placeholder="1990" />
        </div>
        <!-- Рост -->
        <div>
          <label class="label">Рост (см)</label>
          <input v-model.number="health.height_cm" type="number" class="input" min="140" max="230" placeholder="175" />
        </div>
        <!-- Вес -->
        <div>
          <label class="label">Вес (кг)</label>
          <input v-model.number="health.weight_kg" type="number" class="input" min="40" max="300" step="0.5" placeholder="75" />
        </div>
        <!-- Активность -->
        <div class="sm:col-span-2">
          <label class="label">Уровень активности</label>
          <select v-model="health.activity" class="select">
            <option value="sedentary">Сидячий (без тренировок)</option>
            <option value="light">Лёгкая (1–3 тренировки в нед)</option>
            <option value="moderate">Умеренная (3–5 тренировок в нед)</option>
            <option value="active">Высокая (6–7 тренировок в нед)</option>
            <option value="very_active">Очень высокая + физ. работа</option>
          </select>
        </div>
        <!-- Цель -->
        <div class="sm:col-span-2">
          <label class="label">Цель</label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button v-for="g in GOALS" :key="g.value" class="btn text-xs py-2 justify-center" :class="health.goal === g.value ? 'btn-primary' : 'btn-secondary'" @click="health.goal = g.value">
              {{ g.label }}
            </button>
          </div>
        </div>
      </div>

      <button class="btn btn-primary py-2" :disabled="healthSaving" @click="saveHealth">
        {{ healthSaving ? 'Сохраняем…' : 'Сохранить параметры' }}
      </button>

      <!-- Расчёт норм -->
      <div v-if="nutritionGoals" class="mt-5 p-4 rounded-xl" style="background:rgba(167,139,250,0.06); border:1px solid rgba(167,139,250,0.2);">
        <p class="text-xs uppercase tracking-wider mb-4" style="color:#a78bfa; font-family:'Syne',sans-serif;">
          Рекомендуемая дневная норма
          <span class="normal-case ml-1" style="color:var(--color-muted);">· {{ GOALS.find(g => g.value === health.goal)?.label }}</span>
        </p>
        <MacroGauges
          :calories="nutritionGoals.calories"
          :protein="nutritionGoals.protein"
          :fat="nutritionGoals.fat"
          :carbs="nutritionGoals.carbs"
          :goals="nutritionGoals"
          :size="80"
        />
        <div class="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs" style="color:var(--color-text-dim);">
          <span>Калории: <strong style="color:#a78bfa;">{{ nutritionGoals.calories }} ккал</strong></span>
          <span>Белки: <strong style="color:#4af0b8;">{{ nutritionGoals.protein }} г</strong></span>
          <span>Жиры: <strong style="color:#fbbf24;">{{ nutritionGoals.fat }} г</strong></span>
          <span>Углев.: <strong style="color:#818cf8;">{{ nutritionGoals.carbs }} г</strong></span>
        </div>
        <p class="text-xs mt-3" style="color:var(--color-muted);">
          Расчёт по формуле Миффлина — Сан Жеора. Скорректируйте под себя исходя из реального самочувствия.
        </p>
      </div>

      <div v-if="healthMsg" class="mt-4 px-3 py-2 rounded-lg text-sm" :style="healthMsgError ? 'background:#3d2020;color:#fca5a5;border:1px solid #7f1d1d' : 'background:#1a2d1a;color:#86efac;border:1px solid #14532d'">
        {{ healthMsg }}
      </div>
    </div>

    <ConfirmDialog
      v-model="confirmLeave"
      message="Покинуть семью? Ваш личный план питания сохранится."
      @confirm="leaveFamily"
    />

    <!-- Диалог: удалить аккаунт (с вводом пароля) -->
    <AppModal v-model="confirmDelete" title="Удаление аккаунта" max-width="400px">
      <p class="text-sm mb-4" style="color:var(--color-text-dim);">
        Это действие нельзя отменить. Все ваши данные планировщика будут удалены. Введите пароль для подтверждения.
      </p>
      <input
        v-model="deletePassword"
        type="password"
        class="input mb-4"
        placeholder="Ваш пароль"
        autocomplete="current-password"
      />
      <div v-if="deleteError" class="mb-4 px-3 py-2 rounded-lg text-sm" style="background:#3d2020; color:#fca5a5; border:1px solid #7f1d1d;">
        {{ deleteError }}
      </div>
      <div class="flex gap-2 justify-end">
        <button class="btn btn-secondary" @click="confirmDelete = false; deletePassword = ''; deleteError = ''">Отмена</button>
        <button class="btn btn-danger" :disabled="!deletePassword || actLoading" @click="deleteAccount">
          {{ actLoading ? '…' : 'Удалить аккаунт' }}
        </button>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { user, logout, refreshMe } = useAuth()

const createName    = ref('')
const joinCode      = ref('')
const actLoading    = ref(false)
const msg           = ref('')
const msgType       = ref<'ok'|'error'>('ok')
const copied        = ref(false)
const confirmLeave  = ref(false)
const confirmDelete = ref(false)
const deletePassword = ref('')
const deleteError   = ref('')
const family        = ref<any>(null)
const kickTarget    = ref<any>(null)

function showMsg(text: string, type: 'ok'|'error' = 'ok') {
  msg.value = text; msgType.value = type
  setTimeout(() => { msg.value = '' }, 4000)
}

async function loadFamily() {
  if (!user.value?.family_id) return
  try { family.value = await $fetch('/api/family') } catch {}
}

async function createFamily() {
  actLoading.value = true
  try {
    await $fetch('/api/family', { method: 'POST', body: { name: createName.value.trim() } })
    await refreshMe(); await loadFamily()
    createName.value = ''; showMsg('Семья создана!')
  } catch (e: any) { showMsg(e?.data?.statusMessage ?? 'Ошибка', 'error') }
  finally { actLoading.value = false }
}

async function joinFamily() {
  actLoading.value = true
  try {
    await $fetch('/api/family/join', { method: 'POST', body: { invite_code: joinCode.value.trim() } })
    await refreshMe(); await loadFamily()
    joinCode.value = ''; showMsg('Вы вступили в семью!')
  } catch (e: any) { showMsg(e?.data?.statusMessage ?? 'Ошибка', 'error') }
  finally { actLoading.value = false }
}

async function leaveFamily() {
  actLoading.value = true
  try {
    await $fetch('/api/family/leave', { method: 'POST' })
    await refreshMe(); family.value = null; showMsg('Вы покинули семью')
  } catch (e: any) { showMsg(e?.data?.statusMessage ?? 'Ошибка', 'error') }
  finally { actLoading.value = false }
}

async function kickMember(m: any) {
  if (!confirm(`Исключить ${m.display_name} из семьи?`)) return
  actLoading.value = true
  try {
    await $fetch('/api/family/kick', { method: 'POST', body: { user_id: m.id } })
    await loadFamily(); showMsg(`${m.display_name} исключён`)
  } catch (e: any) { showMsg(e?.data?.statusMessage ?? 'Ошибка', 'error') }
  finally { actLoading.value = false }
}

async function deleteAccount() {
  actLoading.value = true; deleteError.value = ''
  try {
    await $fetch('/api/auth/delete', { method: 'POST', body: { password: deletePassword.value } })
    await logout()
  } catch (e: any) {
    deleteError.value = e?.data?.statusMessage ?? 'Ошибка'
  } finally { actLoading.value = false }
}

async function copyCode() {
  const code = family.value?.invite_code
  if (!code) return
  await navigator.clipboard.writeText(code)
  copied.value = true; setTimeout(() => { copied.value = false }, 2000)
}

// ── Здоровье ─────────────────────────────────────────────────────────────────
const GOALS = [
  { value: 'lose',     label: '🔥 Снижение веса' },
  { value: 'maintain', label: '⚖️ Поддержание' },
  { value: 'gain',     label: '💪 Набор массы' },
  { value: 'recomp',   label: '✂️ Сушка' },
]

const health = reactive({
  gender:     'male',
  birth_year: null as number | null,
  height_cm:  null as number | null,
  weight_kg:  null as number | null,
  activity:   'moderate',
  goal:       'maintain',
})

const nutritionGoals = ref<any>(null)
const healthSaving   = ref(false)
const healthMsg      = ref('')
const healthMsgError = ref(false)

async function loadHealth() {
  try {
    const data = await $fetch<any>('/api/profile')
    if (data.profile) {
      health.gender     = data.profile.gender
      health.birth_year = data.profile.birth_year
      health.height_cm  = data.profile.height_cm
      health.weight_kg  = data.profile.weight_kg
      health.activity   = data.profile.activity
      health.goal       = data.profile.goal
    }
    nutritionGoals.value = data.goals
  } catch {}
}

async function saveHealth() {
  healthSaving.value = true; healthMsg.value = ''
  try {
    const data = await $fetch<any>('/api/profile', { method: 'PUT', body: health })
    nutritionGoals.value = data.goals
    healthMsg.value = 'Параметры сохранены!'; healthMsgError.value = false
    setTimeout(() => { healthMsg.value = '' }, 3000)
  } catch (e: any) {
    healthMsg.value = e?.data?.statusMessage ?? 'Ошибка'; healthMsgError.value = true
  } finally { healthSaving.value = false }
}

onMounted(() => { loadFamily(); loadHealth() })
</script>
