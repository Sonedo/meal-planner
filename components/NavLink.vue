<!-- components/NavLink.vue -->
<template>
  <NuxtLink
    :to="to"
    class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
    :class="isActive
      ? 'text-[#0f0f11]'
      : 'hover:bg-white/5'"
    :style="isActive ? 'background:var(--color-accent); color:#0f0f11;' : 'color:var(--color-text-dim);'"
  >
    <span class="text-base leading-none">{{ icon }}</span>
    <span style="font-family:'Syne',sans-serif;">{{ label }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
const props = defineProps<{ to: string; icon: string; label: string }>()
const route = useRoute()

const isActive = computed(() => {
  if (props.to === '/') return route.path === '/'
  return route.path.startsWith(props.to)
})
</script>
