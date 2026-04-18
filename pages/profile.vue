<!-- pages/profile.vue -->
<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Профиль</h1>
    </div>

    <!-- Пользователь -->
    <div class="card px-5 py-5 mb-5">
      <div class="flex items-center gap-4 mb-4">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold" style="background:var(--color-accent); color:#0f0f11; font-family:'Syne',sans-serif;">
          {{ user?.display_name?.[0]?.toUpperCase() }}
        </div>
        <div>
          <p class="font-bold text-base" style="font-family:'Syne',sans-serif;">{{ user?.display_name }}</p>
          <p class="text-sm" style="color:var(--color-muted);">@{{ user?.login }}</p>
        </div>
      </div>
      <button class="btn btn-danger text-sm py-1.5" @click="logout">Выйти из аккаунта</button>
    </div>

    <!-- Семья -->
    <div class="card px-5 py-5">
      <h2 class="text-base font-bold mb-4" style="font-family:'Syne',sans-serif;">
        🏠 Семья
        <span v-if="user?.family_name" class="text-sm font-normal ml-2" style="color:var(--color-accent);">{{ user.family_name }}</span>
      </h2>

      <!-- Нет семьи -->
      <div v-if="!user?.family_id">
        <p class="text-sm mb-5" style="color:var(--color-text-dim);">
          Создайте семью, чтобы объединить планировщики и получать общий список покупок.
        </p>
        <div class="grid grid-cols-2 gap-4">
          <!-- Создать -->
          <div class="p-4 rounded-xl" style="border:1px solid var(--color-border);">
            <p class="text-sm font-bold mb-2" style="font-family:'Syne',sans-serif;">Создать семью</p>
            <input v-model="createName" class="input mb-3 text-sm" placeholder="Название (напр. Семья Ивановых)" />
            <button class="btn btn-primary text-sm py-1.5 w-full justify-center" :disabled="!createName.trim() || actLoading" @click="createFamily">
              {{ actLoading ? '…' : 'Создать' }}
            </button>
          </div>
          <!-- Вступить -->
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
        <!-- Код приглашения (только для владельца) -->
        <div v-if="user.family_role === 'owner' && user.invite_code" class="mb-5 p-4 rounded-xl" style="background:rgba(200,240,74,0.06); border:1px solid rgba(200,240,74,0.25);">
          <p class="text-xs uppercase tracking-wider mb-1" style="color:var(--color-accent); font-family:'Syne',sans-serif;">Код приглашения</p>
          <div class="flex items-center gap-3">
            <span class="text-2xl font-bold tracking-widest" style="font-family:'Syne',sans-serif; color:var(--color-accent);">{{ user.invite_code }}</span>
            <button class="btn btn-secondary text-xs py-1 px-2" @click="copyCode">{{ copied ? '✓ Скопировано' : 'Копировать' }}</button>
          </div>
          <p class="text-xs mt-2" style="color:var(--color-text-dim);">Поделитесь этим кодом с членами семьи</p>
        </div>

        <!-- Участники -->
        <div v-if="family" class="mb-4">
          <p class="label mb-3">Участники · {{ family.members.length }}</p>
          <div class="flex flex-col gap-2">
            <div
              v-for="m in family.members"
              :key="m.id"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg"
              style="background:var(--color-bg); border:1px solid var(--color-border);"
            >
              <div class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0" style="background:var(--color-surface); font-family:'Syne',sans-serif;">
                {{ m.display_name[0]?.toUpperCase() }}
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium">{{ m.display_name }}</p>
                <p class="text-xs" style="color:var(--color-muted);">@{{ m.login }}</p>
              </div>
              <span v-if="m.family_role === 'owner'" class="tag text-xs" style="background:rgba(200,240,74,0.1); color:var(--color-accent);">Владелец</span>
              <span v-if="m.id === user?.id" class="tag text-xs">Вы</span>
            </div>
          </div>
        </div>

        <button class="btn btn-danger text-sm py-1.5" :disabled="actLoading" @click="confirmLeave = true">
          {{ actLoading ? '…' : 'Покинуть семью' }}
        </button>
      </div>

      <!-- Ошибка / успех -->
      <div v-if="msg" class="mt-4 px-3 py-2 rounded-lg text-sm" :style="msgType === 'error' ? 'background:#3d2020;color:#fca5a5;border:1px solid #7f1d1d' : 'background:#1a2d1a;color:#86efac;border:1px solid #14532d'">
        {{ msg }}
      </div>
    </div>

    <ConfirmDialog
      v-model="confirmLeave"
      message="Покинуть семью? Ваш личный план питания сохранится, но вы потеряете доступ к семейным отчётам."
      @confirm="leaveFamily"
    />
  </div>
</template>

<script setup lang="ts">
const { user, logout, refreshMe } = useAuth()
const { add: toast } = useToast()

const createName  = ref('')
const joinCode    = ref('')
const actLoading  = ref(false)
const msg         = ref('')
const msgType     = ref<'ok'|'error'>('ok')
const copied      = ref(false)
const confirmLeave = ref(false)
const family      = ref<any>(null)

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
    await refreshMe()
    await loadFamily()
    createName.value = ''
    showMsg('Семья создана!')
  } catch (e: any) { showMsg(e?.data?.statusMessage ?? 'Ошибка', 'error') }
  finally { actLoading.value = false }
}

async function joinFamily() {
  actLoading.value = true
  try {
    await $fetch('/api/family/join', { method: 'POST', body: { invite_code: joinCode.value.trim() } })
    await refreshMe()
    await loadFamily()
    joinCode.value = ''
    showMsg('Вы вступили в семью!')
  } catch (e: any) { showMsg(e?.data?.statusMessage ?? 'Ошибка', 'error') }
  finally { actLoading.value = false }
}

async function leaveFamily() {
  actLoading.value = true
  try {
    await $fetch('/api/family/leave', { method: 'POST' })
    await refreshMe()
    family.value = null
    showMsg('Вы покинули семью')
  } catch (e: any) { showMsg(e?.data?.statusMessage ?? 'Ошибка', 'error') }
  finally { actLoading.value = false }
}

async function copyCode() {
  if (!user.value?.invite_code) return
  await navigator.clipboard.writeText(user.value.invite_code)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

onMounted(async () => {
  await loadFamily()
})
</script>
