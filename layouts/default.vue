<!-- layouts/default.vue -->
<template>
  <div class="flex min-h-screen min-h-dvh">

    <!-- ── Боковая панель (только desktop) ──────────────────────────────── -->
    <aside class="hidden md:flex w-56 flex-shrink-0 flex-col" style="background:var(--color-surface); border-right:1px solid var(--color-border);">
      <!-- Логотип -->
      <div class="px-5 py-5" style="border-bottom:1px solid var(--color-border);">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center text-base" style="background:var(--color-accent); color:#0f0f11;">🥗</div>
          <span class="font-bold text-base" style="font-family:'Syne',sans-serif; letter-spacing:-0.02em;">НутриПлан</span>
        </div>
      </div>

      <!-- Навигация -->
      <nav class="flex-1 px-3 py-4 flex flex-col gap-0.5">
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
        >
          <div class="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0" style="background:var(--color-border); font-family:'Syne',sans-serif;">
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

    <!-- ── Основной контент ──────────────────────────────────────────────── -->
    <main class="flex-1 overflow-y-auto pb-20 md:pb-0">
      <div class="max-w-5xl mx-auto px-4 py-5 md:px-8 md:py-8">
        <slot />
      </div>
    </main>

    <!-- ── Нижняя навигация (только mobile) ─────────────────────────────── -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch" style="background:var(--color-surface); border-top:1px solid var(--color-border); padding-bottom: env(safe-area-inset-bottom);">
      <MobileNavLink to="/" icon="📦" label="Продукты" />
      <MobileNavLink to="/dishes" icon="🍳" label="Блюда" />
      <MobileNavLink to="/planner" icon="📅" label="План" />
      <MobileNavLink to="/reports" icon="📊" label="Отчёты" />
      <MobileNavLink to="/profile" icon="👤" label="Профиль" />
    </nav>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { user } = useAuth()
const route = useRoute()
</script>
