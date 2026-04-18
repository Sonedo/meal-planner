<!-- components/DishForm.vue -->
<template>
  <form @submit.prevent="submit">
    <div class="grid grid-cols-2 gap-4 mb-5">
      <div class="col-span-2">
        <label class="label">Название блюда *</label>
        <input v-model="f.name" class="input" placeholder="напр. Куриная грудка с рисом" required />
      </div>
      <div>
        <label class="label">Категория</label>
        <select v-model="f.category" class="select">
          <option value="breakfast">Завтрак</option>
          <option value="lunch">Обед</option>
          <option value="dinner">Ужин</option>
          <option value="snack">Перекус</option>
        </select>
      </div>
      <div>
        <label class="label">Время приготовления (мин)</label>
        <input v-model="f.cooking_time" class="input" type="number" min="0" placeholder="30" />
      </div>
      <!-- Порции -->
      <div class="col-span-2">
        <label class="label">Кол-во порций в рецепте *</label>
        <div class="flex items-center gap-3 flex-wrap">
          <input v-model="f.servings" class="input" type="number" min="1" max="100" step="1" style="max-width:110px;" required />
          <div v-if="f.ingredients.length > 0" class="flex gap-2 flex-wrap">
            <span class="macro-pill macro-cal text-xs px-2 py-1">{{ perServing.calories }} ккал/порц.</span>
            <span class="macro-pill macro-prot text-xs px-2 py-1">{{ perServing.protein }}г Б</span>
            <span class="macro-pill macro-fat text-xs px-2 py-1">{{ perServing.fat }}г Ж</span>
            <span class="macro-pill macro-carb text-xs px-2 py-1">{{ perServing.carbs }}г У</span>
          </div>
        </div>
        <p class="text-xs mt-1" style="color:var(--color-muted);">
          Напр.: из 1 кг картофеля получается 14–15 вафель → укажите 14
        </p>
      </div>
      <div class="col-span-2">
        <label class="label">Заметки</label>
        <textarea v-model="f.notes" class="input resize-none" rows="2" placeholder="Способ приготовления, советы…" />
      </div>
    </div>

    <hr class="divider mb-4" />

    <!-- Ингредиенты -->
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-bold" style="font-family:'Syne',sans-serif;">
        Ингредиенты <span style="color:var(--color-muted); font-weight:400;">(на весь рецепт)</span>
      </h3>
      <button type="button" class="btn btn-secondary text-xs py-1 px-3" @click="addIngredient">+ Добавить</button>
    </div>

    <div v-if="f.ingredients.length === 0" class="py-4 text-center text-sm mb-4" style="color:var(--color-muted);">
      Нажмите «Добавить» чтобы выбрать ингредиент.
    </div>

    <div class="flex flex-col gap-2 mb-5">
      <div
        v-for="(ing, idx) in f.ingredients"
        :key="idx"
        class="rounded-lg p-3"
        style="background:var(--color-bg); border:1px solid var(--color-border);"
      >
        <div class="flex items-end gap-3">
          <!-- Поиск продукта -->
          <div class="flex-1">
            <label class="label text-[10px]">Продукт</label>
            <!-- Если продукт уже выбран — показываем название + кнопку сброса -->
            <div v-if="ing.product_id" class="flex items-center gap-2">
              <div
                class="flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between"
                style="background:rgba(200,240,74,0.08); border:1px solid var(--color-accent); color:var(--color-text);"
              >
                <span>{{ productMap[ing.product_id]?.name }}</span>
                <span class="text-xs ml-2" style="color:var(--color-accent);">✓</span>
              </div>
              <button
                type="button"
                class="btn btn-ghost text-xs py-1 px-2"
                style="color:var(--color-muted);"
                @click="clearProduct(idx)"
              >Сменить</button>
            </div>
            <!-- Поисковое поле если продукт не выбран -->
            <div v-else class="relative">
              <input
                v-model="ing._search"
                class="input text-sm"
                placeholder="Поиск продукта…"
                autocomplete="off"
                @focus="ing._open = true"
                @blur="onSearchBlur(idx)"
              />
              <!-- Дропдаун результатов -->
              <div
                v-if="ing._open && ing._search.length >= 1"
                class="absolute left-0 right-0 top-full mt-1 rounded-lg overflow-hidden shadow-xl z-50"
                style="background:var(--color-surface); border:1px solid var(--color-border); max-height:200px; overflow-y:auto;"
              >
                <div
                  v-for="p in searchProducts(ing._search)"
                  :key="p.id"
                  class="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors text-sm"
                  @mousedown.prevent="selectProduct(idx, p)"
                >
                  <span>{{ p.name }}</span>
                  <span class="tag text-[10px] ml-2" :class="`cat-${p.category}`">{{ p.category }}</span>
                </div>
                <div v-if="searchProducts(ing._search).length === 0" class="px-3 py-2 text-xs" style="color:var(--color-muted);">
                  Не найдено
                </div>
              </div>
            </div>
          </div>

          <!-- Граммы -->
          <div style="width:90px;">
            <label class="label text-[10px]">Граммы</label>
            <input
              v-model="ing.quantity_grams"
              class="input text-sm"
              type="number" step="1" min="1" placeholder="100" required
            />
          </div>

          <!-- Ккал мини -->
          <div v-if="ing.product_id && ing.quantity_grams" style="width:60px;" class="pb-0.5">
            <span class="macro-cal text-[10px] px-1.5 py-1 rounded block text-center">
              {{ ingCalories(ing) }}<br/>ккал
            </span>
          </div>

          <button
            type="button"
            class="btn btn-ghost px-2 py-1 text-base pb-1"
            style="color:var(--color-muted);"
            @click="removeIngredient(idx)"
          >×</button>
        </div>
      </div>
    </div>

    <!-- Итоговая питательность -->
    <div class="rounded-xl mb-5 overflow-hidden" style="border:1px solid var(--color-border);">
      <div class="px-4 py-3" style="background:var(--color-bg);">
        <p class="text-xs mb-2 uppercase tracking-wider" style="color:var(--color-muted); font-family:'Syne',sans-serif;">
          Весь рецепт · {{ f.ingredients.filter(i=>i.product_id).length }} ингр.
        </p>
        <MacroPills :calories="nutrition.calories" :protein="nutrition.protein" :fat="nutrition.fat" :carbs="nutrition.carbs" />
      </div>
      <div v-if="Number(f.servings) > 1" class="px-4 py-3" style="border-top:1px solid var(--color-border);">
        <p class="text-xs mb-2 uppercase tracking-wider" style="color:var(--color-muted); font-family:'Syne',sans-serif;">
          1 порция из {{ f.servings }}
        </p>
        <MacroPills :calories="perServing.calories" :protein="perServing.protein" :fat="perServing.fat" :carbs="perServing.carbs" />
      </div>
    </div>

    <div class="flex gap-2 justify-end">
      <button type="button" class="btn btn-secondary" @click="$emit('cancel')">Отмена</button>
      <button type="submit" class="btn btn-primary" :disabled="saving || f.ingredients.filter(i=>i.product_id).length === 0">
        {{ saving ? 'Сохраняем…' : (initial?.id ? 'Обновить блюдо' : 'Создать блюдо') }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
const props = defineProps<{ initial?: any; products: any[]; saving?: boolean }>()
const emit  = defineEmits(['submit', 'cancel'])

const productMap = computed<Record<number, any>>(() => {
  const m: Record<number, any> = {}
  for (const p of props.products) m[p.id] = p
  return m
})

// Полнотекстовый поиск продуктов
function searchProducts(q: string) {
  if (!q || q.length < 1) return []
  const lower = q.toLowerCase()
  return props.products
    .filter(p => p.name.toLowerCase().includes(lower))
    .slice(0, 20)
}

// ── Форма ─────────────────────────────────────────────────────────────────────
const makeIng = (product_id = '', quantity_grams: number|'' = 100) => ({
  product_id, quantity_grams, _search: '', _open: false,
})

const f = reactive({
  id:           props.initial?.id ?? null,
  name:         props.initial?.name ?? '',
  category:     props.initial?.category ?? 'lunch',
  cooking_time: props.initial?.cooking_time ?? '',
  notes:        props.initial?.notes ?? '',
  servings:     props.initial?.servings ?? 1,
  ingredients:  props.initial?.ingredients?.map((i: any) => makeIng(i.product_id, i.quantity_grams)) ?? [],
})

watch(() => props.initial, (v) => {
  if (!v) return
  f.id = v.id; f.name = v.name; f.category = v.category
  f.cooking_time = v.cooking_time ?? ''; f.notes = v.notes ?? ''
  f.servings = v.servings ?? 1
  f.ingredients = v.ingredients?.map((i: any) => makeIng(i.product_id, i.quantity_grams)) ?? []
})

function addIngredient() { f.ingredients.push(makeIng()) }
function removeIngredient(idx: number) { f.ingredients.splice(idx, 1) }

function selectProduct(idx: number, product: any) {
  f.ingredients[idx].product_id = product.id
  f.ingredients[idx]._search = ''
  f.ingredients[idx]._open = false
}

function clearProduct(idx: number) {
  f.ingredients[idx].product_id = ''
  f.ingredients[idx]._search = ''
  nextTick(() => { f.ingredients[idx]._open = false })
}

function onSearchBlur(idx: number) {
  setTimeout(() => { f.ingredients[idx]._open = false }, 150)
}

// ── Питательность ─────────────────────────────────────────────────────────────
const r1 = (n: number) => Math.round(n * 10) / 10

function ingCalories(ing: any) {
  const p = productMap.value[ing.product_id]
  if (!p || !ing.quantity_grams) return 0
  return Math.round(p.calories_per_100g * ing.quantity_grams / 100)
}

const nutrition = computed(() => {
  let cal = 0, prot = 0, fat = 0, carbs = 0
  for (const ing of f.ingredients) {
    const p = productMap.value[ing.product_id]
    if (!p || !ing.quantity_grams) continue
    const x = Number(ing.quantity_grams) / 100
    cal += p.calories_per_100g * x; prot += p.protein_per_100g * x
    fat += p.fat_per_100g * x;      carbs += p.carbs_per_100g * x
  }
  return { calories: r1(cal), protein: r1(prot), fat: r1(fat), carbs: r1(carbs) }
})

const perServing = computed(() => {
  const s = Math.max(1, Number(f.servings) || 1)
  return {
    calories: r1(nutrition.value.calories / s),
    protein:  r1(nutrition.value.protein  / s),
    fat:      r1(nutrition.value.fat      / s),
    carbs:    r1(nutrition.value.carbs    / s),
  }
})

// ── Сабмит ────────────────────────────────────────────────────────────────────
function submit() {
  const ings = f.ingredients
    .filter(i => i.product_id && i.quantity_grams)
    .map(i => ({ product_id: Number(i.product_id), quantity_grams: Number(i.quantity_grams) }))

  emit('submit', {
    id: f.id, name: f.name, category: f.category,
    cooking_time: f.cooking_time || null, notes: f.notes || null,
    servings: Number(f.servings) || 1,
    ingredients: ings,
  })
}
</script>
