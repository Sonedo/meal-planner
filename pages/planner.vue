<!-- pages/planner.vue -->
<template>
  <div>
    <!-- Заголовок -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Планировщик</h1>
        <p class="text-sm mt-0.5 hidden md:block" style="color:var(--color-text-dim);">Неделя: {{ weekLabel }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn btn-secondary px-3" @click="prev">←</button>
        <button class="btn btn-secondary text-xs px-3" @click="goToday">Сегодня</button>
        <button class="btn btn-secondary px-3" @click="next">→</button>
      </div>
    </div>

    <!-- Мобайл: текущий день -->
    <div class="md:hidden text-center mb-4">
      <p class="font-bold text-lg" style="font-family:'Syne',sans-serif;">
        {{ mobileDayLabel }}
      </p>
    </div>

    <!-- Переключатель семья/мой -->
    <div v-if="hasFamily" class="flex items-center gap-2 mb-4 p-3 rounded-xl flex-wrap" style="background:var(--color-surface); border:1px solid var(--color-border);">
      <span class="text-sm" style="color:var(--color-text-dim);">Показывать:</span>
      <button class="btn text-xs py-1.5 px-3" :class="!familyMode ? 'btn-primary' : 'btn-secondary'" @click="setFamilyMode(false)">Мой план</button>
      <button class="btn text-xs py-1.5 px-3" :class="familyMode ? 'btn-primary' : 'btn-secondary'" @click="setFamilyMode(true)">🏠 Семья</button>
    </div>

    <div v-if="loading" class="py-12 text-center" style="color:var(--color-muted);">Загрузка…</div>
    <div v-else>

      <!-- ── DESKTOP: недельная сетка ─────────────────────────────────── -->
      <div class="hidden md:block">
        <!-- Шапка дней -->
        <div class="grid gap-2 mb-2" :style="`grid-template-columns: 80px repeat(7, 1fr);`">
          <div />
          <div v-for="day in weekDays" :key="day.date" class="card px-2 py-2 text-center" :style="day.isToday ? 'border-color:var(--color-accent);' : ''">
            <p class="text-[10px] uppercase tracking-wider" style="color:var(--color-muted); font-family:'Syne',sans-serif;">{{ day.dayName }}</p>
            <p class="text-sm font-bold" :style="day.isToday ? 'color:var(--color-accent);' : ''">{{ day.dayNum }}</p>
            <div v-if="dailyTotals[day.date]" class="mt-1">
              <span class="macro-cal text-[10px] px-1.5 py-0.5 rounded">{{ Math.round(dailyTotals[day.date]) }} ккал</span>
            </div>
          </div>
        </div>

        <!-- Строки приёмов пищи -->
        <div v-for="mealType in MEAL_TYPES" :key="mealType.value" class="grid gap-2 mb-2" :style="`grid-template-columns: 80px repeat(7, 1fr);`">
          <div class="flex items-start pt-2">
            <span class="tag text-xs w-full justify-center" :class="`meal-${mealType.value}`">{{ mealType.label }}</span>
          </div>
          <div
            v-for="day in weekDays" :key="day.date"
            class="card p-2 flex flex-col gap-1.5 min-h-[80px]"
            :style="day.isToday ? 'border-color:rgba(200,240,74,0.2);' : ''"
          >
            <!-- Блюда в ячейке — рендерим inline для корректной реактивности -->
            <div
              v-for="entry in entries.filter(e => e.date === day.date && e.meal_type === mealType.value)"
              :key="entry.id"
              class="group relative flex flex-col gap-0.5 rounded-lg p-1.5"
              style="background:var(--color-bg); border:1px solid var(--color-border);"
            >
              <p v-if="familyMode" class="text-[9px] uppercase tracking-wider" :style="entry.user?.id === user?.id ? 'color:var(--color-accent)' : 'color:var(--color-muted)'">
                {{ entry.user?.id === user?.id ? 'Вы' : entry.user?.display_name }}
              </p>
              <p class="text-[11px] font-medium leading-tight pr-4" style="font-family:'Syne',sans-serif;">{{ entry.dish?.name }}</p>
              <p v-if="entry.note" class="text-[10px] italic" style="color:var(--color-text-dim);">{{ entry.note }}</p>
              <div v-if="entry.extraIngredients?.length" class="flex gap-1 flex-wrap">
                <span v-for="ex in entry.extraIngredients" :key="ex.id" class="text-[9px] px-1 py-0.5 rounded" style="background:var(--color-border); color:var(--color-text-dim);">+{{ ex.product.name }}</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="text-[10px] px-1 py-0.5 rounded" style="background:rgba(200,240,74,0.1); color:var(--color-accent);">×{{ entry.portions ?? 1 }}п</span>
                <span class="macro-cal text-[10px] px-1 py-0.5 rounded">{{ Math.round(entryCalories(entry)) }} ккал</span>
              </div>
              <button
                v-if="entry.user?.id === user?.id"
                class="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                style="background:rgba(248,113,113,0.2); color:#f87171;"
                @click="removeEntry(entry.id)"
              >×</button>
            </div>
            <button class="add-btn" @click="openAdd(day.date, mealType.value)">+ блюдо</button>
          </div>
        </div>
      </div>

      <!-- ── MOBILE: день за днём ──────────────────────────────────────── -->
      <div class="md:hidden">
        <!-- Итого дня -->
        <div v-if="dailyTotals[mobileDay]" class="card px-4 py-3 mb-4 flex items-center justify-between">
          <span class="text-sm font-medium" style="font-family:'Syne',sans-serif;">Итого за день</span>
          <span class="macro-cal text-sm font-bold px-3 py-1 rounded-lg">{{ Math.round(dailyTotals[mobileDay]) }} ккал</span>
        </div>

        <!-- Приёмы пищи -->
        <div v-for="mealType in MEAL_TYPES" :key="mealType.value" class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="tag" :class="`meal-${mealType.value}`">{{ mealType.label }}</span>
            <button
              class="btn btn-secondary text-xs py-1.5 px-3"
              @click="openAdd(mobileDay, mealType.value)"
            >+ блюдо</button>
          </div>

          <!-- Блюда в этом приёме -->
          <div v-if="getEntries(mobileDay, mealType.value).length === 0" class="px-1 py-2 text-sm" style="color:var(--color-muted);">
            Ничего не запланировано
          </div>
          <div v-for="entry in getEntries(mobileDay, mealType.value)" :key="entry.id"
            class="card p-3 mb-2 flex items-start justify-between gap-3"
          >
            <div class="flex-1 min-w-0">
              <p v-if="familyMode" class="text-[10px] uppercase tracking-wider mb-0.5" :style="entry.user?.id === user?.id ? 'color:var(--color-accent)' : 'color:var(--color-muted)'">
                {{ entry.user?.id === user?.id ? 'Вы' : entry.user?.display_name }}
              </p>
              <p class="text-sm font-medium leading-tight" style="font-family:'Syne',sans-serif;">{{ entry.dish?.name }}</p>
              <p v-if="entry.note" class="text-xs mt-0.5 italic" style="color:var(--color-text-dim);">{{ entry.note }}</p>
              <div v-if="entry.extraIngredients?.length" class="flex gap-1 flex-wrap mt-0.5">
                <span v-for="ex in entry.extraIngredients" :key="ex.id" class="tag text-[10px]">+{{ ex.product.name }}</span>
              </div>
              <div class="flex items-center gap-2 mt-1 flex-wrap">
                <span class="text-xs px-2 py-0.5 rounded" style="background:rgba(200,240,74,0.1); color:var(--color-accent);">×{{ entry.portions ?? 1 }} порц.</span>
                <span class="macro-cal text-xs px-2 py-0.5 rounded">{{ Math.round(entryCalories(entry)) }} ккал</span>
              </div>
            </div>
            <button v-if="entry.user?.id === user?.id"
              class="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-sm"
              style="background:rgba(248,113,113,0.15); color:#f87171;"
              @click="removeEntry(entry.id)"
            >×</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Модалка добавления ── -->
    <AppModal v-model="showAddModal" title="Добавить в план" max-width="500px">
      <div class="mb-4 flex items-center gap-2 flex-wrap">
        <span class="tag" :class="`meal-${addForm.meal_type}`">{{ getMealLabel(addForm.meal_type) }}</span>
        <span class="text-sm" style="color:var(--color-text-dim);">{{ formatDateRu(addForm.date) }}</span>
      </div>

      <!-- Для кого (семья) -->
      <div v-if="hasFamily && familyMembers.length > 1" class="mb-4">
        <label class="label">Добавить в план</label>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="m in familyMembers" :key="m.id" type="button"
            class="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm"
            :style="addForm.target_user_id === m.id
              ? 'border-color:var(--color-accent); background:rgba(200,240,74,0.1);'
              : 'border-color:var(--color-border); background:var(--color-bg); color:var(--color-text-dim);'"
            @click="addForm.target_user_id = m.id"
          >
            <span class="w-6 h-6 rounded flex items-center justify-center text-xs font-bold" style="background:var(--color-border); font-family:'Syne',sans-serif;">{{ m.display_name[0]?.toUpperCase() }}</span>
            {{ m.id === user?.id ? 'Мой план' : m.display_name }}
            <span v-if="addForm.target_user_id === m.id" style="color:var(--color-accent);">✓</span>
          </button>
        </div>
      </div>

      <!-- Поиск блюда -->
      <div class="mb-3">
        <label class="label">Поиск блюда</label>
        <div class="relative">
          <input v-model="dishSearch" class="input pr-8" placeholder="Введите название…" @input="addForm.dish_id = ''" />
          <span v-if="dishSearch" class="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" style="color:var(--color-muted);" @click="dishSearch=''; addForm.dish_id=''">×</span>
        </div>
      </div>

      <!-- Фильтр по категории -->
      <div class="mb-3 flex gap-1.5 flex-wrap">
        <button v-for="m in [{value:'',label:'Все'}, ...MEAL_TYPES]" :key="m.value"
          class="btn text-[11px] py-1 px-2"
          :class="dishFilter === m.value ? 'btn-primary' : 'btn-secondary'"
          @click="dishFilter = m.value"
        >{{ m.label }}</button>
      </div>

      <!-- Список блюд -->
      <div class="mb-4 flex flex-col gap-1 overflow-y-auto" style="max-height:200px;">
        <div v-if="filteredDishOptions.length === 0" class="py-4 text-center text-sm" style="color:var(--color-muted);">Блюда не найдены</div>
        <button v-for="d in filteredDishOptions" :key="d.id"
          class="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left transition-all"
          :style="addForm.dish_id === d.id
            ? 'background:rgba(200,240,74,0.12); border:1px solid var(--color-accent);'
            : 'background:var(--color-bg); border:1px solid var(--color-border);'"
          @click="selectDish(d.id)"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate" style="font-family:'Syne',sans-serif;">{{ d.name }}</p>
            <p class="text-xs" style="color:var(--color-muted);">{{ d.servings > 1 ? `${d.servings} порц.` : '1 порц.' }} · {{ Math.round(d.total_calories / (d.servings||1)) }} ккал/порц.</p>
          </div>
          <span class="tag text-[10px] flex-shrink-0" :class="`meal-${d.category}`">{{ MEAL_LABEL_MAP[d.category] }}</span>
          <span v-if="addForm.dish_id === d.id" style="color:var(--color-accent);">✓</span>
        </button>
      </div>

      <!-- Порции -->
      <div v-if="selectedDish" class="mb-4 p-3 rounded-xl" style="background:var(--color-bg); border:1px solid var(--color-border);">
        <label class="label mb-2">Количество порций</label>
        <div class="flex items-center gap-2 flex-wrap mb-3">
          <button v-for="n in quickPortions" :key="n" type="button" class="btn text-xs py-1.5 px-3" :class="addForm.portions === n ? 'btn-primary' : 'btn-secondary'" @click="addForm.portions = n">{{ n }}</button>
          <input v-model.number="addForm.portions" type="number" class="input text-sm" min="0.5" max="50" step="0.5" style="width:72px;" />
        </div>
        <p class="text-[10px] uppercase tracking-wider mb-1.5" style="color:var(--color-muted); font-family:'Syne',sans-serif;">{{ addForm.portions }} порц. → итого</p>
        <MacroPills :calories="portionCalories.calories" :protein="portionCalories.protein" :fat="portionCalories.fat" :carbs="portionCalories.carbs" />
      </div>

      <!-- Кастомизация: доп. ингредиенты -->
      <div v-if="selectedDish" class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <label class="label mb-0">Дополнительные ингредиенты</label>
          <button type="button" class="btn btn-secondary text-xs py-1 px-2" @click="addExtra">+ Добавить</button>
        </div>
        <p class="text-xs mb-2" style="color:var(--color-muted);">Кастомизация под конкретный приём: начинка, соус, топпинг…</p>

        <div v-for="(ex, idx) in addForm.extras" :key="idx" class="flex items-end gap-2 mb-2">
          <!-- Поиск продукта -->
          <div class="flex-1 relative">
            <input
              v-model="ex.search"
              class="input text-sm"
              placeholder="Поиск продукта…"
              @input="ex.product_id = 0"
              @focus="ex.open = true"
              @blur="closeExtraDropdown(idx)"
            />
            <div v-if="ex.open && ex.search.length > 0 && !ex.product_id"
              class="absolute left-0 right-0 top-full mt-1 rounded-lg shadow-xl z-50 overflow-hidden"
              style="background:var(--color-surface); border:1px solid var(--color-border); max-height:160px; overflow-y:auto;"
            >
              <div
                v-for="p in searchExtraProducts(ex.search)" :key="p.id"
                class="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/5 text-sm"
                @mousedown.prevent="selectExtraProduct(idx, p)"
              >
                <span>{{ p.name }}</span>
                <span class="tag text-[10px]" :class="`cat-${p.category}`">{{ p.category }}</span>
              </div>
              <div v-if="searchExtraProducts(ex.search).length === 0" class="px-3 py-2 text-xs" style="color:var(--color-muted);">Не найдено</div>
            </div>
          </div>
          <!-- Граммы -->
          <div style="width:90px;">
            <input v-model.number="ex.quantity_grams" type="number" min="1" step="1" class="input text-sm" placeholder="г" />
          </div>
          <button type="button" class="btn btn-ghost px-2 text-base" style="color:var(--color-muted);" @click="removeExtra(idx)">×</button>
        </div>
      </div>

      <!-- Заметка к приёму -->
      <div class="mb-4">
        <label class="label">Заметка</label>
        <input v-model="addForm.note" class="input text-sm" placeholder="напр. со сливочным сыром и лососем" />
      </div>

      <div class="flex gap-2 justify-end">
        <button class="btn btn-secondary" @click="showAddModal = false">Отмена</button>
        <button class="btn btn-primary" :disabled="!addForm.dish_id" @click="saveEntry">
          Добавить{{ addForm.target_user_id !== user?.id ? ` → ${targetMemberName}` : '' }}
        </button>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
import { useToast } from '~/composables/useToast'
const { add: toast } = useToast()
const { user, hasFamily } = useAuth()

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Завтрак' },
  { value: 'lunch',     label: 'Обед' },
  { value: 'dinner',    label: 'Ужин' },
  { value: 'snack',     label: 'Перекус' },
]
const MEAL_LABEL_MAP: Record<string,string> = { breakfast:'Завтрак', lunch:'Обед', dinner:'Ужин', snack:'Перекус' }
const DAY_NAMES = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб']
const DAY_NAMES_FULL = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота']

// ── Навигация ─────────────────────────────────────────────────────────────────
const weekStart  = ref(getMonday(new Date()))
const mobileDay  = ref(today())
const isDesktop  = ref(true)  // инициализируем на сервере как desktop, обновляем в onMounted

// Локальная дата YYYY-MM-DD без UTC-сдвига
function localDate(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function today() { return localDate() }
function getMonday(d: Date) {
  const day = new Date(d); day.setHours(0,0,0,0)
  const dow = (day.getDay() + 6) % 7; day.setDate(day.getDate() - dow); return day
}

// Безопасный сдвиг даты без проблем с таймзоной
// Храним дату как YYYY-MM-DD, сдвигаем через явные год/месяц/день
function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)   // локальное время, без UTC-сдвига
  dt.setDate(dt.getDate() + days)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function prev() {
  if (isDesktop.value) {
    weekStart.value = new Date(weekStart.value.getTime() - 7*86400000)
  } else {
    mobileDay.value = shiftDate(mobileDay.value, -1)
  }
  load()
}
function next() {
  if (isDesktop.value) {
    weekStart.value = new Date(weekStart.value.getTime() + 7*86400000)
  } else {
    mobileDay.value = shiftDate(mobileDay.value, 1)
  }
  load()
}
function goToday() {
  mobileDay.value = today()
  weekStart.value = getMonday(new Date())
  load()
}

const weekDays = computed(() => {
  const todayStr = localDate()
  return Array.from({ length: 7 }, (_, i) => {
    // Сдвигаем от начала недели через локальные дни — без UTC-проблем
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() + i)
    const dateStr = localDate(d)
    return {
      date: dateStr,
      dayName: DAY_NAMES[d.getDay()],
      dayNum: d.getDate(),
      isToday: dateStr === todayStr,
    }
  })
})
const weekLabel = computed(() => {
  const f = weekDays.value[0], t = weekDays.value[6]
  return `${f.dayName} ${f.dayNum} — ${t.dayName} ${t.dayNum}`
})
const mobileDayLabel = computed(() => {
  const d = new Date(mobileDay.value + 'T00:00:00')
  const t = new Date(); t.setHours(0,0,0,0)
  const isToday = d.getTime() === t.getTime()
  const dayStr = d.toLocaleDateString('ru', { day: 'numeric', month: 'long' })
  const dowStr = DAY_NAMES_FULL[d.getDay()]
  return isToday ? `Сегодня, ${dayStr}` : `${dowStr[0].toUpperCase()}${dowStr.slice(1)}, ${dayStr}`
})

// ── Данные ────────────────────────────────────────────────────────────────────
const entries      = ref<any[]>([])
const allDishes    = ref<any[]>([])
const familyMembers = ref<any[]>([])
const loading      = ref(true)
const familyMode   = ref(false)

function getFrom() {
  if (!isDesktop.value) {
    const d = new Date(mobileDay.value + 'T00:00:00')
    d.setDate(d.getDate() - 3)
    return localDate(d)
  }
  return weekDays.value[0].date
}
function getTo() {
  if (!isDesktop.value) {
    const d = new Date(mobileDay.value + 'T00:00:00')
    d.setDate(d.getDate() + 3)
    return localDate(d)
  }
  return weekDays.value[6].date
}

async function load() {
  loading.value = true
  try {
    const [planEntries, dishList, productList] = await Promise.all([
      $fetch<any[]>('/api/meal-plan', { query: { from: getFrom(), to: getTo(), family: familyMode.value } }),
      $fetch<any[]>('/api/dishes'),
      allProducts.value.length > 0 ? Promise.resolve(allProducts.value) : $fetch<any[]>('/api/products'),
    ])
    entries.value    = planEntries
    allDishes.value  = dishList
    allProducts.value = productList
  } finally { loading.value = false }
}

async function loadFamilyMembers() {
  if (!hasFamily.value) return
  try { const f = await $fetch<any>('/api/family'); familyMembers.value = f.members ?? [] } catch {}
}

function setFamilyMode(val: boolean) { familyMode.value = val; load() }
onMounted(() => {
  isDesktop.value = window.innerWidth >= 768
  window.addEventListener('resize', () => { isDesktop.value = window.innerWidth >= 768 })
  load()
  loadFamilyMembers()
})

// ── Сетка ─────────────────────────────────────────────────────────────────────
function getEntries(date: string, mealType: string) {
  return entries.value.filter(e => e.date === date && e.meal_type === mealType)
}
function entryCalories(entry: any) {
  return (entry.dish?.total_calories ?? 0) * ((entry.portions ?? 1) / (entry.dish?.servings ?? 1))
}
const r1 = (n: number) => Math.round(n * 10) / 10
const dailyTotals = computed(() => {
  const m: Record<string, number> = {}
  for (const e of entries.value) m[e.date] = (m[e.date] ?? 0) + entryCalories(e)
  return m
})
function getMealLabel(val: string) { return MEAL_LABEL_MAP[val] ?? val }
function formatDateRu(d: string) {
  if (!d) return ''
  return new Date(d+'T00:00:00').toLocaleDateString('ru', { day: 'numeric', month: 'long' })
}

// ── Добавление ────────────────────────────────────────────────────────────────
const showAddModal = ref(false)
const dishSearch   = ref('')
const dishFilter   = ref('')
const addForm = reactive<{
  date: string; meal_type: string; dish_id: number|''
  portions: number; target_user_id: number|null
  note: string
  extras: Array<{ product_id: number; quantity_grams: number; search: string; open: boolean }>
}>({
  date: '', meal_type: '', dish_id: '', portions: 1, target_user_id: null,
  note: '', extras: [],
})
// ── Дополнительные ингредиенты ───────────────────────────────────────────────
const allProducts = ref<any[]>([])

function addExtra() {
  addForm.extras.push({ product_id: 0, quantity_grams: 100, search: '', open: false })
}
function removeExtra(idx: number) { addForm.extras.splice(idx, 1) }

function searchExtraProducts(q: string) {
  const lower = q.toLowerCase().trim()
  if (!lower) return []
  return allProducts.value.filter(p => p.name.toLowerCase().includes(lower)).slice(0, 15)
}
function selectExtraProduct(idx: number, product: any) {
  addForm.extras[idx].product_id = product.id
  addForm.extras[idx].search     = product.name
  addForm.extras[idx].open       = false
}
function closeExtraDropdown(idx: number) {
  setTimeout(() => { addForm.extras[idx].open = false }, 150)
}

const targetMemberName = computed(() => {
  if (!addForm.target_user_id || addForm.target_user_id === user.value?.id) return 'Мой план'
  return familyMembers.value.find(m => m.id === addForm.target_user_id)?.display_name ?? ''
})
const filteredDishOptions = computed(() => {
  const q = dishSearch.value.toLowerCase().trim()
  return allDishes.value.filter(d =>
    (!dishFilter.value || d.category === dishFilter.value) && (!q || d.name.toLowerCase().includes(q))
  )
})
const selectedDish = computed(() => addForm.dish_id ? allDishes.value.find(d => d.id === addForm.dish_id) ?? null : null)
const quickPortions = computed(() => {
  if (!selectedDish.value) return [1]
  const s = selectedDish.value.servings ?? 1
  const opts = new Set<number>()
  if (s > 1) opts.add(0.5); opts.add(1)
  if (s >= 2) opts.add(2); if (s >= 4) opts.add(4); if (s >= 6) opts.add(s)
  return Array.from(opts).sort((a, b) => a - b)
})
const portionCalories = computed(() => {
  if (!selectedDish.value) return { calories: 0, protein: 0, fat: 0, carbs: 0 }
  const factor = (addForm.portions || 1) / (selectedDish.value.servings || 1)
  return { calories: r1(selectedDish.value.total_calories * factor), protein: r1(selectedDish.value.total_protein * factor), fat: r1(selectedDish.value.total_fat * factor), carbs: r1(selectedDish.value.total_carbs * factor) }
})
function selectDish(id: number) { addForm.dish_id = id; addForm.portions = 1 }
function openAdd(date: string, mealType: string) {
  addForm.date = date; addForm.meal_type = mealType; addForm.dish_id = ''; addForm.portions = 1
  addForm.target_user_id = user.value?.id ?? null
  addForm.note = ''; addForm.extras = []
  dishSearch.value = ''; dishFilter.value = mealType; showAddModal.value = true
}
async function saveEntry() {
  try {
    const validExtras = addForm.extras
      .filter(e => e.product_id && e.quantity_grams > 0)
      .map(e => ({ product_id: e.product_id, quantity_grams: e.quantity_grams }))

    const body: any = {
      date: addForm.date, meal_type: addForm.meal_type,
      dish_id: addForm.dish_id, portions: addForm.portions,
      note: addForm.note || null,
      extra_ingredients: validExtras,
    }
    if (addForm.target_user_id && addForm.target_user_id !== user.value?.id) body.target_user_id = addForm.target_user_id
    await $fetch('/api/meal-plan', { method: 'POST', body })
    toast(`Добавлено: ${addForm.portions} порц.`)
    showAddModal.value = false; await load()
  } catch (e: any) { toast(e?.data?.statusMessage ?? 'Ошибка', 'error') }
}
async function removeEntry(id: number) {
  try { await $fetch(`/api/meal-plan/${id}`, { method: 'DELETE' }); await load() }
  catch (e: any) { toast(e?.data?.statusMessage ?? 'Ошибка', 'error') }
}
</script>

<style scoped>
.add-btn {
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; border-radius: 6px; border: 1px dashed var(--color-border);
  color: var(--color-muted); padding: 4px; opacity: 0.4; transition: opacity 0.15s;
  cursor: pointer; background: transparent; width: 100%;
}
.add-btn:hover { opacity: 0.7; }
</style>
