<!-- pages/inventory.vue -->
<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Инвентарь</h1>
        <p class="text-sm mt-0.5" style="color:var(--color-text-dim);">Что есть дома · список покупок · рецепты из наличия</p>
      </div>
    </div>

    <!-- Вкладки -->
    <div class="flex gap-2 mb-5 flex-wrap">
      <button v-for="t in TABS" :key="t.value" class="btn" :class="tab === t.value ? 'btn-primary' : 'btn-secondary'" @click="tab = t.value">
        {{ t.label }}
      </button>
    </div>

    <!-- ── ЗАПАСЫ ────────────────────────────────────────────────────────── -->
    <div v-if="tab === 'stock'">
      <!-- Переключатель личный/семья -->
      <div v-if="hasFamily" class="flex items-center gap-2 mb-4 p-3 rounded-xl flex-wrap" style="background:var(--color-surface); border:1px solid var(--color-border);">
        <span class="text-sm" style="color:var(--color-text-dim);">Инвентарь:</span>
        <button class="btn text-xs py-1.5 px-3" :class="scope === 'personal' ? 'btn-primary' : 'btn-secondary'" @click="scope = 'personal'">Личный</button>
        <button class="btn text-xs py-1.5 px-3" :class="scope === 'family' ? 'btn-primary' : 'btn-secondary'" @click="scope = 'family'">🏠 Семейный</button>
      </div>

      <!-- Добавить продукт -->
      <div class="card px-5 py-4 mb-5">
        <h3 class="text-sm font-bold mb-3" style="font-family:'Syne',sans-serif;">Добавить в запасы</h3>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div class="flex-1">
            <label class="label">Продукт</label>
            <div class="relative">
              <input
                v-model="addSearch"
                class="input pr-8"
                placeholder="Поиск продукта…"
                @input="addSelectedProduct = null"
                @focus="addDropdownOpen = true"
                @blur="setTimeout(() => addDropdownOpen = false, 150)"
              />
              <span v-if="addSelectedProduct" class="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style="color:var(--color-accent);">✓</span>
              <div v-if="addDropdownOpen && addSearch.length > 0 && !addSelectedProduct"
                class="absolute left-0 right-0 top-full mt-1 rounded-lg shadow-xl z-50 overflow-hidden"
                style="background:var(--color-surface); border:1px solid var(--color-border); max-height:200px; overflow-y:auto;"
              >
                <div v-if="filteredProducts.length === 0" class="px-3 py-2 text-sm" style="color:var(--color-muted);">Не найдено</div>
                <div
                  v-for="p in filteredProducts" :key="p.id"
                  class="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/5 text-sm"
                  @mousedown.prevent="selectProduct(p)"
                >
                  <span>{{ p.name }}</span>
                  <span class="tag text-[10px]" :class="`cat-${p.category}`">{{ p.category }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="flex-1 sm:flex-none" style="min-width:160px;">
            <label class="label">Заметка (необязательно)</label>
            <input v-model="addNote" class="input" placeholder="морозилка, полка…" />
          </div>
          <button
            class="btn btn-primary py-2"
            :disabled="!addSelectedProduct || addSaving"
            @click="addItem"
          >
            {{ addSaving ? '…' : '+ Добавить' }}
          </button>
        </div>
      </div>

      <!-- Список запасов -->
      <div v-if="loadingStock" class="py-8 text-center" style="color:var(--color-muted);">Загрузка…</div>
      <div v-else-if="groupedStock.length === 0" class="py-8 text-center" style="color:var(--color-muted);">
        Инвентарь пуст. Добавьте продукты которые есть дома.
      </div>
      <div v-else>
        <div v-for="group in groupedStock" :key="group.category" class="card mb-4 overflow-hidden">
          <div class="px-4 py-2.5 flex items-center gap-2" style="border-bottom:1px solid var(--color-border); background:rgba(255,255,255,0.02);">
            <span class="tag text-xs" :class="`cat-${group.category}`">{{ getCatLabel(group.category) }}</span>
            <span class="text-xs" style="color:var(--color-muted);">{{ group.items.length }} позиц.</span>
          </div>
          <div v-for="item in group.items" :key="item.id" class="table-row">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium">{{ item.product.name }}</p>
              <p v-if="item.note" class="text-xs" style="color:var(--color-muted);">{{ item.note }}</p>
            </div>
            <span class="tag text-xs" style="color:#4af0b8; background:rgba(74,240,184,0.1);">✓ есть</span>
            <button class="btn btn-danger text-xs py-1 px-2 ml-2" @click="deleteItem(item.id)">×</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── СПИСОК ПОКУПОК ─────────────────────────────────────────────────── -->
    <div v-if="tab === 'shopping'">
      <div class="card px-5 py-4 mb-5 flex flex-wrap items-end gap-4">
        <div>
          <label class="label">С</label>
          <input v-model="shoppingFrom" type="date" class="input" style="width:160px;" />
        </div>
        <div>
          <label class="label">По</label>
          <input v-model="shoppingTo" type="date" class="input" style="width:160px;" />
        </div>
        <div class="flex gap-2">
          <button class="btn btn-secondary text-xs" @click="setShoppingPreset('week')">Эта неделя</button>
          <button class="btn btn-secondary text-xs" @click="setShoppingPreset('month')">Этот месяц</button>
        </div>
        <div v-if="hasFamily" class="flex items-center gap-2">
          <button class="btn text-xs py-1.5 px-3" :class="!shoppingFamily ? 'btn-primary' : 'btn-secondary'" @click="shoppingFamily = false">Мой план</button>
          <button class="btn text-xs py-1.5 px-3" :class="shoppingFamily ? 'btn-primary' : 'btn-secondary'" @click="shoppingFamily = true">🏠 Семьи</button>
        </div>
        <button class="btn btn-primary" :disabled="loadingDiff" @click="loadDiff">
          {{ loadingDiff ? 'Считаем…' : 'Рассчитать' }}
        </button>
      </div>

      <div v-if="!diffData" class="py-8 text-center" style="color:var(--color-muted);">
        Выберите период и нажмите «Рассчитать».
      </div>
      <div v-else>
        <!-- Сводка -->
        <div class="grid grid-cols-2 gap-3 mb-5">
          <div class="card px-4 py-3 text-center">
            <p class="text-2xl font-bold" style="font-family:'Syne',sans-serif; color:var(--color-accent);">{{ itemsToBuy.length }}</p>
            <p class="text-xs mt-1" style="color:var(--color-muted);">нужно купить</p>
          </div>
          <div class="card px-4 py-3 text-center">
            <p class="text-2xl font-bold" style="font-family:'Syne',sans-serif; color:#4af0b8;">{{ itemsCovered.length }}</p>
            <p class="text-xs mt-1" style="color:var(--color-muted);">есть дома</p>
          </div>
        </div>

        <!-- Нужно купить -->
        <div v-if="itemsToBuy.length > 0" class="card mb-4 overflow-hidden">
          <div class="px-4 py-2.5 flex items-center justify-between gap-2" style="border-bottom:1px solid var(--color-border);">
            <span class="text-sm font-bold" style="font-family:'Syne',sans-serif;">🛒 Нужно купить</span>
            <div class="flex items-center gap-2">
              <span v-if="boughtItems.size > 0" class="text-xs" style="color:var(--color-accent);">отмечено {{ boughtItems.size }}</span>
              <button
                v-if="boughtItems.size > 0"
                class="btn btn-primary text-xs py-1.5 px-3"
                :disabled="movingToStock"
                @click="moveBoughtToInventory"
              >{{ movingToStock ? '…' : '📦 В инвентарь' }}</button>
            </div>
          </div>

          <!-- По категориям -->
          <div v-for="group in groupedToBuy" :key="group.category">
            <div class="px-4 py-1.5" style="background:rgba(255,255,255,0.02); border-bottom:1px solid var(--color-border);">
              <span class="tag text-xs" :class="`cat-${group.category}`">{{ getCatLabel(group.category) }}</span>
            </div>
            <div
              v-for="item in group.items" :key="item.product_id"
              class="table-row transition-all"
              :style="boughtItems.has(item.product_id) ? 'opacity:0.45;' : ''"
            >
              <div class="flex items-center gap-3 flex-1">
                <input
                  type="checkbox"
                  class="w-4 h-4 rounded flex-shrink-0 cursor-pointer"
                  :checked="boughtItems.has(item.product_id)"
                  @change="toggleBought(item)"
                />
                <span class="text-sm" :style="boughtItems.has(item.product_id) ? 'text-decoration:line-through;' : ''">
                  {{ item.name }}
                </span>
              </div>
              <!-- Кнопка добавить одну позицию -->
              <button
                class="btn btn-secondary text-xs py-1 px-2"
                @click="moveOneToInventory(item)"
                title="Добавить в инвентарь"
              >📦</button>
            </div>
          </div>
        </div>

        <!-- Есть дома -->
        <div v-if="itemsCovered.length > 0" class="card overflow-hidden">
          <div class="px-4 py-2.5 flex items-center gap-2 cursor-pointer" style="border-bottom:1px solid var(--color-border);" @click="showCovered = !showCovered">
            <span class="text-sm font-bold" style="color:#4af0b8;">✓ Есть дома ({{ itemsCovered.length }})</span>
            <span class="ml-auto text-xs" style="color:var(--color-muted);">{{ showCovered ? '▲' : '▼' }}</span>
          </div>
          <div v-if="showCovered">
            <div v-for="item in itemsCovered" :key="item.product_id" class="table-row" style="opacity:0.6;">
              <span class="text-sm flex-1">{{ item.name }}</span>
              <span class="tag text-xs" style="color:#4af0b8; background:rgba(74,240,184,0.1);">✓</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── ЧТО МОЖНО ПРИГОТОВИТЬ ─────────────────────────────────────────── -->
    <div v-if="tab === 'recipes'">
      <div class="card px-5 py-4 mb-5">
        <h3 class="text-sm font-bold mb-3" style="font-family:'Syne',sans-serif;">Поиск по наличию продуктов</h3>
        <div class="flex items-center gap-3 flex-wrap">
          <span class="text-sm" style="color:var(--color-text-dim);">Допустимо недостающих:</span>
          <div class="flex gap-2">
            <button
              v-for="n in [0, 1, 2, 3]" :key="n"
              class="btn text-sm py-1.5 px-4"
              :class="maxMissing === n ? 'btn-primary' : 'btn-secondary'"
              @click="maxMissing = n; loadRecipes()"
            >{{ n === 0 ? 'Всё есть' : `не хватает ${n}` }}</button>
          </div>
        </div>
      </div>

      <div v-if="loadingRecipes" class="py-8 text-center" style="color:var(--color-muted);">Поиск рецептов…</div>
      <div v-else-if="recipesData">
        <p class="text-sm mb-4" style="color:var(--color-text-dim);">
          Найдено <strong>{{ recipesData.total }}</strong> рецептов
        </p>
        <div v-if="recipesData.dishes.length === 0" class="py-8 text-center" style="color:var(--color-muted);">
          Нет подходящих рецептов. Попробуйте увеличить допустимое кол-во недостающих.
        </div>
        <div v-for="dish in recipesData.dishes" :key="dish.id" class="card mb-3 px-5 py-4">
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-1.5">
                <h3 class="font-bold" style="font-family:'Syne',sans-serif;">{{ dish.name }}</h3>
                <span class="tag text-xs" :class="`meal-${dish.category}`">{{ MEAL_LABELS[dish.category] }}</span>
                <span v-if="dish.cooking_time" class="tag text-xs">⏱ {{ dish.cooking_time }} мин</span>
                <span
                  class="tag text-xs font-bold"
                  :style="dish.missing_count === 0
                    ? 'background:rgba(74,240,184,0.15); color:#4af0b8;'
                    : 'background:rgba(251,191,36,0.15); color:#fbbf24;'"
                >{{ dish.missing_count === 0 ? '✓ Всё есть' : `нет ${dish.missing_count} ингр.` }}</span>
              </div>
              <div class="flex items-center gap-3 text-xs mb-2" style="color:var(--color-text-dim);">
                <span>{{ dish.servings }} порц.</span>
                <span>·</span>
                <span class="macro-cal px-2 py-0.5 rounded">{{ dish.per_portion }} ккал/порц.</span>
              </div>
              <div v-if="dish.missing.length > 0" class="flex flex-wrap gap-1.5">
                <span class="text-xs" style="color:var(--color-muted);">Нет:</span>
                <span
                  v-for="m in dish.missing" :key="m.product_id"
                  class="tag text-xs"
                  style="background:rgba(251,191,36,0.12); color:#fbbf24;"
                >{{ m.name }}</span>
              </div>
            </div>
            <button class="btn btn-secondary text-xs py-1.5 px-3 flex-shrink-0" @click="addToPlanner(dish)">+ В план</button>
          </div>
        </div>
      </div>
      <div v-else class="py-8 text-center" style="color:var(--color-muted);">
        Нажмите на кнопку выше чтобы найти рецепты.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
import { useToast } from '~/composables/useToast'
const { add: toast } = useToast()
const { hasFamily } = useAuth()

const TABS = [
  { value: 'stock',    label: '📦 Запасы' },
  { value: 'shopping', label: '🛒 Покупки' },
  { value: 'recipes',  label: '👨‍🍳 Что приготовить' },
]
const MEAL_LABELS: Record<string,string> = { breakfast:'Завтрак', lunch:'Обед', dinner:'Ужин', snack:'Перекус' }
const CAT_LABELS: Record<string,string> = { vegetable:'Овощи', meat:'Мясо / Рыба', dairy:'Молочное', grain:'Злаки / Крупы', fruit:'Фрукты', legume:'Бобовые', oil:'Масла', other:'Прочее' }
function getCatLabel(v: string) { return CAT_LABELS[v] ?? v }
function localDate(d: Date = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

const tab   = ref('stock')
const scope = ref<'personal'|'family'>('personal')

// ── ЗАПАСЫ ────────────────────────────────────────────────────────────────────
const stockItems         = ref<any[]>([])
const allProducts        = ref<any[]>([])
const loadingStock       = ref(false)
const addSearch          = ref('')
const addSelectedProduct = ref<any>(null)
const addNote            = ref('')
const addDropdownOpen    = ref(false)
const addSaving          = ref(false)

const filteredProducts = computed(() => {
  const q = addSearch.value.toLowerCase().trim()
  if (!q) return []
  return allProducts.value.filter(p => p.name.toLowerCase().includes(q)).slice(0, 15)
})
function selectProduct(p: any) {
  addSelectedProduct.value = p; addSearch.value = p.name; addDropdownOpen.value = false
}
const groupedStock = computed(() => {
  const m: Record<string, any[]> = {}
  for (const item of stockItems.value) {
    const cat = item.product.category
    if (!m[cat]) m[cat] = []
    m[cat].push(item)
  }
  return Object.entries(m).map(([category, items]) => ({ category, items }))
    .sort((a, b) => a.category.localeCompare(b.category))
})

async function loadStock() {
  loadingStock.value = true
  try {
    [stockItems.value, allProducts.value] = await Promise.all([
      $fetch<any[]>('/api/inventory'),
      $fetch<any[]>('/api/products'),
    ])
  } finally { loadingStock.value = false }
}

async function addItem() {
  if (!addSelectedProduct.value) return
  addSaving.value = true
  try {
    await $fetch('/api/inventory', {
      method: 'POST',
      body: { product_id: addSelectedProduct.value.id, note: addNote.value || null, scope: scope.value },
    })
    toast(`Добавлено: ${addSelectedProduct.value.name}`)
    addSearch.value = ''; addSelectedProduct.value = null; addNote.value = ''
    await loadStock()
  } catch (e: any) { toast(e?.data?.statusMessage ?? 'Ошибка', 'error') }
  finally { addSaving.value = false }
}

async function deleteItem(id: number) {
  try { await $fetch(`/api/inventory/${id}`, { method: 'DELETE' }); await loadStock() }
  catch (e: any) { toast(e?.data?.statusMessage ?? 'Ошибка', 'error') }
}

// ── СПИСОК ПОКУПОК ────────────────────────────────────────────────────────────
const boughtItems    = ref<Map<number, any>>(new Map())
const movingToStock  = ref(false)
const shoppingFrom   = ref('')
const shoppingTo     = ref('')
const shoppingFamily = ref(false)
const diffData       = ref<any>(null)
const loadingDiff    = ref(false)
const showCovered    = ref(false)

function setShoppingPreset(preset: 'week'|'month') {
  const now = new Date()
  if (preset === 'week') {
    const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay()+6)%7))
    const sun = new Date(mon); sun.setDate(mon.getDate()+6)
    shoppingFrom.value = localDate(mon); shoppingTo.value = localDate(sun)
  } else {
    shoppingFrom.value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`
    shoppingTo.value   = localDate(new Date(now.getFullYear(), now.getMonth()+1, 0))
  }
}

async function loadDiff() {
  if (!shoppingFrom.value || !shoppingTo.value) { toast('Выберите период','error'); return }
  loadingDiff.value = true
  try {
    diffData.value = await $fetch('/api/inventory/shopping-diff', {
      query: { from: shoppingFrom.value, to: shoppingTo.value, family: shoppingFamily.value },
    })
    boughtItems.value = new Map()
  } catch (e: any) { toast(e?.data?.statusMessage ?? 'Ошибка','error') }
  finally { loadingDiff.value = false }
}

const itemsToBuy   = computed(() => diffData.value?.items.filter((i: any) => !i.covered) ?? [])
const itemsCovered = computed(() => diffData.value?.items.filter((i: any) => i.covered) ?? [])

const groupedToBuy = computed(() => {
  const m: Record<string, any[]> = {}
  for (const item of itemsToBuy.value) {
    if (!m[item.category]) m[item.category] = []
    m[item.category].push(item)
  }
  return Object.entries(m).map(([category, items]) => ({ category, items }))
    .sort((a, b) => a.category.localeCompare(b.category))
})

function toggleBought(item: any) {
  const m = new Map(boughtItems.value)
  if (m.has(item.product_id)) m.delete(item.product_id)
  else m.set(item.product_id, item)
  boughtItems.value = m
}

async function moveOneToInventory(item: any) {
  try {
    await $fetch('/api/inventory', {
      method: 'POST',
      body: { product_id: item.product_id, scope: scope.value },
    })
    toast(`${item.name} → инвентарь`)
    await loadStock(); await loadDiff()
  } catch (e: any) { toast(e?.data?.statusMessage ?? 'Ошибка', 'error') }
}

async function moveBoughtToInventory() {
  if (boughtItems.value.size === 0) return
  movingToStock.value = true
  try {
    await Promise.all(
      Array.from(boughtItems.value.values()).map(item =>
        $fetch('/api/inventory', { method: 'POST', body: { product_id: item.product_id, scope: scope.value } })
      )
    )
    toast(`${boughtItems.value.size} товаров добавлено в инвентарь`)
    boughtItems.value = new Map()
    await loadStock(); await loadDiff()
  } catch (e: any) { toast(e?.data?.statusMessage ?? 'Ошибка', 'error') }
  finally { movingToStock.value = false }
}

// ── РЕЦЕПТЫ ───────────────────────────────────────────────────────────────────
const maxMissing     = ref(0)
const recipesData    = ref<any>(null)
const loadingRecipes = ref(false)

async function loadRecipes() {
  loadingRecipes.value = true
  try { recipesData.value = await $fetch('/api/inventory/recipes', { query: { missing: maxMissing.value } }) }
  catch (e: any) { toast(e?.data?.statusMessage ?? 'Ошибка','error') }
  finally { loadingRecipes.value = false }
}

function addToPlanner(dish: any) {
  navigateTo('/planner'); toast(`Перейдите в планировщик и добавьте «${dish.name}»`)
}

onMounted(() => { loadStock(); setShoppingPreset('week') })
watch(tab, (v) => { if (v === 'recipes' && !recipesData.value) loadRecipes() })
</script>
