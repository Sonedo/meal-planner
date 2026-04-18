<!-- components/MobileNavLink.vue -->
<template>
  <NuxtLink
    :to="to"
    class="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-center transition-colors"
    :style="isActive
      ? 'color:var(--color-accent);'
      : 'color:var(--color-muted);'"
  >
    <span class="text-xl leading-none">{{ icon }}</span>
    <span class="text-[10px] font-medium" style="font-family:'Syne',sans-serif;">{{ label }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
const props = defineProps<{ to: string; icon: string; label: string }>()
const route = useRoute()
const isActive = computed(() =>
  props.to === '/' ? route.path === '/' : route.path.startsWith(props.to)
)
</script>
