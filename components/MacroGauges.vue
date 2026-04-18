<!-- components/MacroGauges.vue — 4 радиальных диаграммы с нормами -->
<template>
  <div class="flex gap-4 flex-wrap justify-start">
    <NutrientGauge
      :value="calories" :goal="goals?.calories"
      label="Калории" unit="ккал" color="#a78bfa"
      :size="size"
    />
    <NutrientGauge
      :value="protein" :goal="goals?.protein"
      label="Белки" color="#4af0b8"
      :size="size"
    />
    <NutrientGauge
      :value="fat" :goal="goals?.fat"
      label="Жиры" color="#fbbf24"
      :size="size"
    />
    <NutrientGauge
      :value="carbs" :goal="goals?.carbs"
      label="Углев." color="#818cf8"
      :size="size"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  calories: number
  protein:  number
  fat:      number
  carbs:    number
  goals?:   { calories: number; protein: number; fat: number; carbs: number } | null
  size?:    number
}>()
</script>
