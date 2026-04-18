<!-- components/DishCard.vue -->
<template>
  <div class="card px-5 py-4">
    <div class="flex items-start justify-between gap-4">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2.5 mb-2 flex-wrap">
          <h3 class="font-bold text-base" style="font-family:'Syne',sans-serif;">{{ dish.name }}</h3>
          <span class="tag text-xs" :class="`meal-${dish.category}`">{{ MEAL_LABELS[dish.category] ?? dish.category }}</span>
          <span v-if="dish.cooking_time" class="tag text-xs">⏱ {{ dish.cooking_time }} мин</span>
          <span class="tag text-xs" style="background:rgba(200,240,74,0.1); color:var(--color-accent);">
            🍽 {{ dish.servings ?? 1 }} порц.
          </span>
        </div>

        <!-- Питательность на 1 порцию -->
        <div class="mb-2">
          <p class="text-[10px] uppercase tracking-wider mb-1.5" style="color:var(--color-muted); font-family:'Syne',sans-serif;">
            {{ (dish.servings ?? 1) > 1 ? `На 1 порцию из ${dish.servings}` : 'На весь рецепт' }}
          </p>
          <MacroPills
            :calories="perServing.calories"
            :protein="perServing.protein"
            :fat="perServing.fat"
            :carbs="perServing.carbs"
          />
        </div>

        <!-- Показать итого рецепта если порций > 1 -->
        <div v-if="(dish.servings ?? 1) > 1" class="mb-3">
          <p class="text-[10px] uppercase tracking-wider mb-1" style="color:var(--color-muted); font-family:'Syne',sans-serif;">
            Весь рецепт
          </p>
          <div class="flex gap-1.5 flex-wrap">
            <span class="text-xs px-2 py-0.5 rounded" style="background:var(--color-bg); color:var(--color-text-dim);">
              {{ dish.total_calories }} ккал · {{ dish.total_protein }}г Б · {{ dish.total_fat }}г Ж · {{ dish.total_carbs }}г У
            </span>
          </div>
        </div>

        <!-- Ингредиенты -->
        <div class="flex flex-wrap gap-1.5">
          <span v-for="ing in dish.ingredients" :key="ing.id" class="tag text-xs">
            {{ ing.product.name }} <span style="color:var(--color-muted);">· {{ ing.quantity_grams }}г</span>
          </span>
        </div>

        <p v-if="dish.notes" class="mt-2 text-xs" style="color:var(--color-text-dim);">{{ dish.notes }}</p>
      </div>

      <div class="flex flex-col gap-1.5 flex-shrink-0">
        <button class="btn btn-secondary px-3 py-1.5 text-xs" @click="$emit('edit')">Изменить</button>
        <button class="btn btn-danger px-3 py-1.5 text-xs" @click="$emit('delete')">Удалить</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Завтрак', lunch: 'Обед', dinner: 'Ужин', snack: 'Перекус',
}
const props = defineProps<{ dish: any }>()
defineEmits(['edit', 'delete'])

const r1 = (n: number) => Math.round(n * 10) / 10

const perServing = computed(() => {
  const s = Math.max(1, props.dish.servings ?? 1)
  return {
    calories: r1(props.dish.total_calories / s),
    protein:  r1(props.dish.total_protein  / s),
    fat:      r1(props.dish.total_fat      / s),
    carbs:    r1(props.dish.total_carbs    / s),
  }
})
</script>
