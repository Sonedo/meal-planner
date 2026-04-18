<!-- components/NutrientGauge.vue — радиальная диаграмма нутриента -->
<template>
  <div class="flex flex-col items-center gap-1.5">
    <div class="relative" :style="`width:${size}px; height:${size}px;`">
      <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" style="transform:rotate(-90deg)">
        <!-- Фоновая дорожка -->
        <circle
          :cx="size/2" :cy="size/2" :r="radius"
          fill="none"
          :stroke="trackColor"
          :stroke-width="strokeW"
        />
        <!-- Заполненная дуга -->
        <circle
          :cx="size/2" :cy="size/2" :r="radius"
          fill="none"
          :stroke="arcColor"
          :stroke-width="strokeW"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashOffset"
          stroke-linecap="round"
          style="transition: stroke-dashoffset 0.6s ease, stroke 0.3s ease;"
        />
        <!-- Перебор — дуга поверх красным -->
        <circle
          v-if="pct > 100"
          :cx="size/2" :cy="size/2" :r="radius"
          fill="none"
          stroke="rgba(248,113,113,0.5)"
          :stroke-width="strokeW - 1"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="overDashOffset"
          stroke-linecap="round"
        />
      </svg>
      <!-- Центр: значение -->
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span class="font-bold leading-tight" :style="`font-size:${size < 80 ? 13 : 15}px; font-family:'Syne',sans-serif; color:${arcColor};`">
          {{ Math.round(value) }}
        </span>
        <span class="text-[9px] uppercase tracking-wider" style="color:var(--color-muted);">{{ unit }}</span>
      </div>
    </div>
    <!-- Подпись -->
    <div class="text-center">
      <p class="text-xs font-medium" style="font-family:'Syne',sans-serif;">{{ label }}</p>
      <p v-if="goal" class="text-[10px]" :style="`color:${statusColor};`">
        {{ pct }}% от {{ Math.round(goal) }}{{ unit }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  value:  number
  goal?:  number   // норма; если не задана — просто показываем значение
  label:  string
  unit?:  string
  color:  string   // основной цвет
  size?:  number
}>()

const size    = computed(() => props.size ?? 96)
const strokeW = computed(() => size.value < 80 ? 7 : 9)
const radius  = computed(() => (size.value - strokeW.value * 2) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const unit    = computed(() => props.unit ?? 'г')

// Процент заполнения (0–100 для нормы, >100 для перебора)
const pct = computed(() => {
  if (!props.goal || props.goal <= 0) return 0
  return Math.round((props.value / props.goal) * 100)
})

// Цвет дуги по статусу
const arcColor = computed(() => {
  if (!props.goal) return props.color
  if (pct.value < 50)  return '#6b6b7a'      // мало — серый
  if (pct.value < 85)  return '#fbbf24'       // недобор — жёлтый
  if (pct.value <= 115) return props.color    // норма — основной цвет
  return '#f87171'                             // перебор — красный
})

const trackColor = 'rgba(255,255,255,0.06)'

// Смещение дашированной линии (ограничиваем 100%)
const dashOffset = computed(() => {
  const fill = Math.min(pct.value, 100) / 100
  return circumference.value * (1 - fill)
})

// Дуга перебора поверх
const overDashOffset = computed(() => {
  if (pct.value <= 100) return circumference.value
  const over = Math.min((pct.value - 100) / 100, 1)
  return circumference.value * (1 - over)
})

const statusColor = computed(() => arcColor.value)
</script>
