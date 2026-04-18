<!-- layouts/default.vue -->
<template>
  <div class="flex min-h-screen min-h-dvh">

    <!-- ── Мобайл: оверлей при открытом меню ────────────────────────────── -->
    <Transition name="fade">
      <div
        v-if="menuOpen"
        class="md:hidden fixed inset-0 z-40 bg-black/60"
        @click="menuOpen = false"
      />
    </Transition>

    <!-- ── Боковая панель ────────────────────────────────────────────────── -->
    <Transition name="slide">
      <aside
        v-show="menuOpen || isDesktop"
        class="fixed md:static top-0 left-0 h-full z-50 md:z-auto w-64 md:w-56 flex-shrink-0 flex flex-col"
        style="background:var(--color-surface); border-right:1px solid var(--color-border);"
      >
        <!-- Логотип + кнопка закрыть (мобайл) -->
        <div class="px-5 py-5 flex items-center justify-between" style="border-bottom:1px solid var(--color-border);">
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg flex items-center justify-center text-base flex-shrink-0" style="background:var(--color-accent); color:#0f0f11;">🥗</div>
            <span class="font-bold text-base" style="font-family:'Syne',sans-serif; letter-spacing:-0.02em;">НутриПлан</span>
          </div>
          <button
            class="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-xl"
            style="color:var(--color-muted);"
            @click="menuOpen = false"
          >×</button>
        </div>

        <!-- Навигация -->
        <nav class="flex-1 px-3 py-4 flex flex-col gap-0.5" @click="menuOpen = false">
          <p class="px-2 text-[10px] uppercase tracking-wider mb-1" style="color:var(--color-muted); font-family:'Syne',sans-serif;">Общее</p>
          <NavLink to="/" icon="📦" label="Продукты" />
          <NavLink to="/dishes" icon="🍳" label="Блюда" />
          <p class="px-2 text-[10px] uppercase tracking-wider mt-3 mb-1" style="color:var(--color-muted); font-family:'Syne',sans-serif;">Личное</p>
          <NavLink to="/planner" icon="📅" label="Планировщик" />
          <NavLink to="/reports" icon="📊" label="Отчёты" />
        </nav>

        <!-- Профиль -->
        <div class="px-3 py-3" style="border-top:1px solid var(--color-border);">
          <NuxtLink
            to="/profile"
            class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors hover:bg-white/5"
            :style="route.path === '/profile' ? 'background:rgba(200,240,74,0.1);' : ''"
            @click="menuOpen = false"
          >
            <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0" style="background:var(--color-border); font-family:'Syne',sans-serif;">
              {{ user?.display_name?.[0]?.toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate" style="font-family:'Syne',sans-serif; color:var(--color-text);">{{ user?.display_name }}</p>
              <p v-if="user?.family_name" class="text-[10px] truncate" style="color:var(--color-accent);">🏠 {{ user.family_name }}</p>
              <p v-else class="text-[10px]" style="color:var(--color-muted);">Без семьи</p>
            </div>
          </NuxtLink>
        </div>
      </aside>
    </Transition>

    <!-- ── Основной контент ──────────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col min-w-0">

      <!-- Мобайл: топ-бар с гамбургером -->
      <header class="md:hidden flex items-center gap-3 px-4 py-3 sticky top-0 z-30" style="background:var(--color-surface); border-bottom:1px solid var(--color-border);">
        <button
          class="w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
          style="background:var(--color-bg); border:1px solid var(--color-border);"
          @click="menuOpen = true"
        >
          <!-- Иконка гамбургера -->
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
            <rect y="0" width="18" height="2" rx="1" fill="currentColor"/>
            <rect y="6" width="14" height="2" rx="1" fill="currentColor"/>
            <rect y="12" width="18" height="2" rx="1" fill="currentColor"/>
          </svg>
        </button>
        <span class="font-bold text-base flex-1" style="font-family:'Syne',sans-serif; letter-spacing:-0.02em;">
          {{ pageTitle }}
        </span>
        <!-- Аватар -->
        <NuxtLink to="/profile" class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0" style="background:var(--color-border); font-family:'Syne',sans-serif;">
          {{ user?.display_name?.[0]?.toUpperCase() }}
        </NuxtLink>
      </header>

      <main class="flex-1 overflow-y-auto">
        <div class="max-w-5xl mx-auto px-4 py-5 md:px-8 md:py-8">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { user } = useAuth()
const route = useRoute()
const menuOpen = ref(false)
const isDesktop = ref(false)

// Закрывать меню при смене маршрута
watch(() => route.path, () => { menuOpen.value = false })

// Определяем десктоп
onMounted(() => {
  isDesktop.value = window.innerWidth >= 768
  window.addEventListener('resize', () => {
    isDesktop.value = window.innerWidth >= 768
    if (isDesktop.value) menuOpen.value = false
  })
})

// Название текущей страницы для топбара
const PAGE_TITLES: Record<string, string> = {
  '/':         'Продукты',
  '/dishes':   'Блюда',
  '/planner':  'Планировщик',
  '/reports':  'Отчёты',
  '/profile':  'Профиль',
}
const pageTitle = computed(() => PAGE_TITLES[route.path] ?? 'НутриПлан')
</script>

<style scoped>
/* Анимация сайдбара */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}

/* На десктопе — без анимации */
@media (min-width: 768px) {
  .slide-enter-from,
  .slide-leave-to {
    transform: none;
  }
}

/* Анимация оверлея */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
