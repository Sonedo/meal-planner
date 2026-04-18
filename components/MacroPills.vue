<!-- components/MacroPills.vue -->
<template>
  <div class="flex items-center gap-2 flex-wrap">
    <span class="macro-pill macro-cal">
      <span class="text-base font-bold leading-tight">{{ fmt(calories) }}</span>
      <span class="text-[10px] opacity-70 uppercase tracking-wider">ккал</span>
    </span>
    <span class="macro-pill macro-prot">
      <span class="text-base font-bold leading-tight">{{ fmt(protein) }}г</span>
      <span class="text-[10px] opacity-70 uppercase tracking-wider">белки</span>
    </span>
    <span class="macro-pill macro-fat">
      <span class="text-base font-bold leading-tight">{{ fmt(fat) }}г</span>
      <span class="text-[10px] opacity-70 uppercase tracking-wider">жиры</span>
    </span>
    <span class="macro-pill macro-carb">
      <span class="text-base font-bold leading-tight">{{ fmt(carbs) }}г</span>
      <span class="text-[10px] opacity-70 uppercase tracking-wider">углев.</span>
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  calories: number
  protein: number
  fat: number
  carbs: number
}>()

const fmt = (n: number) => Math.round(n * 10) / 10
</script>
