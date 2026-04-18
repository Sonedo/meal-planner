<!-- pages/planner.vue -->
<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Планировщик питания</h1>
        <p class="text-sm mt-0.5" style="color:var(--color-text-dim);">Неделя: {{ weekLabel }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn btn-secondary px-3" @click="prevWeek">←</button>
        <button class="btn btn-secondary text-xs px-3" @click="thisWeek">Сегодня</button>
        <button class="btn btn-secondary px-3" @click="nextWeek">→</button>
      </div>
    </div>

    <!-- Переключатель мой / семья -->
    <div v-if="hasFamily" class="flex items-center gap-2 mb-4 p-3 rounded-xl" style="background:var(--color-surface); border:1px solid var(--color-border);">
      <span class="text-sm" style="color:var(--color-text-dim);">Показывать:</span>
      <button class="btn text-xs py-1.5 px-3" :class="!familyMode ? 'btn-primary' : 'btn-secondary'" @click="setFamilyMode(false)">Мой план</button>
      <button class="btn text-xs py-1.5 px-3" :class="familyMode ? 'btn-primary' : 'btn-secondary'" @click="setFamilyMode(true)">🏠 Семья</button>
      <span v-if="familyMode" class="text-xs" style="color:var(--color-muted);">Видны планы всех · удалять можно только свои записи</span>
    </div>

    <!-- Полоса дневных итогов -->
    <div class="grid gap-2 mb-4" :style="`grid-template-columns: 90px repeat(${weekDays.length}, 1fr);`">
      <div />
      <div
        v-for="day in weekDays"
        :key="day.date"
        class="card px-2 py-2 text-center"
        :style="day.isToday ? 'border-color:var(--color-accent);' : ''"
      >
        <p class="text-[10px] uppercase tracking-wider mb-0.5" style="color:var(--color-muted); font-family:'Syne',sans-serif;">{{ day.dayName }}</p>
        <p class="text-sm font-bold" :style="day.isToday ? 'color:var(--color-accent);' : ''">{{ day.dayNum }}</p>
        <div v-if="dailyTotals[day.date]" class="mt-1">
          <span class="macro-pill macro-cal text-[10px] px-1.5 py-0.5">{{ Math.round(dailyTotals[day.date]) }}<br/>ккал</span>
        </div>
      </div>
    </div>

    <!-- Сетка -->
    <div v-if="loading" class="py-12 text-center" style="color:var(--color-muted);">Загрузка…</div>
    <div v-else>
      <div
        v-for="mealType in MEAL_TYPES"
        :key="mealType.value"
        class="grid gap-2 mb-3"
        :style="`grid-template-columns: 90px repeat(${weekDays.length}, 1fr);`"
      >
        <div class="flex items-start pt-2">
          <span class="tag text-xs w-full justify-center" :class="`meal-${mealType.value}`">{{ mealType.label }}</span>
        </div>

        <div
          v-for="day in weekDays"
          :key="day.date"
          class="card p-2 flex flex-col gap-1.5 min-h-[90px]"
          :style="day.isToday ? 'border-color:rgba(200,240,74,0.25);' : ''"
        >
          <!-- Блюда в слоте -->
          <div
            v-for="entry in getEntries(day.date, mealType.value)"
            :key="entry.id"
            class="group relative flex flex-col gap-0.5 rounded-lg p-1.5"
            style="background:var(--color-bg); border:1px solid var(--color-border);"
          >
            <!-- Имя участника в режиме семьи -->
            <p v-if="familyMode" class="text-[9px] uppercase tracking-wider font-medium" :style="entry.user?.id === user?.id ? 'color:var(--color-accent)' : 'color:var(--color-muted)'">
              {{ entry.user?.id === user?.id ? 'Вы' : entry.user?.display_name }}
            </p>
            <p class="text-[11px] font-medium leading-tight pr-4" style="font-family:'Syne',sans-serif;">
              {{ entry.dish?.name }}
            </p>
            <div class="flex items-center gap-1 flex-wrap">
              <span class="text-[10px] px-1 py-0.5 rounded" style="background:rgba(200,240,74,0.1); color:var(--color-accent);">
                ×{{ entry.portions ?? 1 }}п
              </span>
              <span class="macro-cal text-[10px] px-1 py-0.5 rounded">
                {{ Math.round(entryCalories(entry)) }} ккал
              </span>
            </div>
            <button
              v-if="entry.user?.id === user?.id"
              class="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
              style="background:rgba(248,113,113,0.2); color:#f87171;"
              @click="removeEntry(entry.id)"
            >×</button>
          </div>

          <!-- Добавить блюдо -->
          <button
            class="flex items-center justify-center text-xs rounded-lg border border-dashed transition-opacity opacity-30 hover:opacity-70 py-1.5"
            style="border-color:var(--color-border); color:var(--color-muted);"
            @click="openAdd(day.date, mealType.value)"
          >+ блюдо</button>
        </div>
      </div>
    </div>

    <!-- ── Модалка добавления ── -->
    <AppModal v-model="showAddModal" title="Добавить в план" max-width="500px">
      <div class="mb-4 flex items-center gap-2 flex-wrap">
        <span class="tag" :class="`meal-${addForm.meal_type}`">{{ getMealLabel(addForm.meal_type) }}</span>
        <span class="text-sm" style="color:var(--color-text-dim);">{{ formatDateRu(addForm.date) }}</span>
      </div>

      <!-- Для кого (только если есть семья) -->
      <div v-if="hasFamily && familyMembers.length > 1" class="mb-4">
        <label class="label">Добавить в план</label>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="m in familyMembers"
            :key="m.id"
            type="button"
            class="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm"
            :style="addForm.target_user_id === m.id
              ? 'border-color:var(--color-accent); background:rgba(200,240,74,0.1); color:var(--color-text);'
              : 'border-color:var(--color-border); background:var(--color-bg); color:var(--color-text-dim);'"
            @click="addForm.target_user_id = m.id"
          >
            <span class="w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0" style="background:var(--color-border); font-family:'Syne',sans-serif;">
              {{ m.display_name[0]?.toUpperCase() }}
            </span>
            <span style="font-family:'Syne',sans-serif;">{{ m.id === user?.id ? 'Мой план' : m.display_name }}</span>
            <span v-if="addForm.target_user_id === m.id" style="color:var(--color-accent);">✓</span>
          </button>
        </div>
      </div>

      <!-- Поиск блюда -->
      <div class="mb-3">
        <label class="label">Поиск блюда</label>
        <div class="relative">
          <input v-model="dishSearch" class="input pr-8" placeholder="Введите название…" @input="addForm.dish_id = ''" />
          <span v-if="dishSearch" class="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-base" style="color:var(--color-muted);" @click="dishSearch=''; addForm.dish_id=''">×</span>
        </div>
      </div>

      <!-- Фильтр по категории -->
      <div class="mb-3 flex gap-1.5 flex-wrap">
        <button
          v-for="m in [{value:'',label:'Все'}, ...MEAL_TYPES]"
          :key="m.value"
          class="btn text-[11px] py-1 px-2"
          :class="dishFilter === m.value ? 'btn-primary' : 'btn-secondary'"
          @click="dishFilter = m.value"
        >{{ m.label }}</button>
      </div>

      <!-- Список блюд -->
      <div class="mb-4 flex flex-col gap-1 overflow-y-auto" style="max-height:200px;">
        <div v-if="filteredDishOptions.length === 0" class="py-4 text-center text-sm" style="color:var(--color-muted);">Блюда не найдены</div>
        <button
          v-for="d in filteredDishOptions"
          :key="d.id"
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
        <p class="text-[10px] uppercase tracking-wider mb-1.5" style="color:var(--color-muted); font-family:'Syne',sans-serif;">
          {{ addForm.portions }} порц. → итого
        </p>
        <MacroPills :calories="portionCalories.calories" :protein="portionCalories.protein" :fat="portionCalories.fat" :carbs="portionCalories.carbs" />
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

const familyMode    = ref(false)
const familyMembers = ref<Array<{ id: number; display_name: string }>>([])

async function loadFamilyMembers() {
  if (!hasFamily.value) return
  try {
    const fam = await $fetch<any>('/api/family')
    familyMembers.value = fam.members ?? []
  } catch {
    familyMembers.value = []
  }
}

function setFamilyMode(val: boolean) {
  familyMode.value = val
  load()
}

// ── Навигация ──────────────────────────────────────────────────────────────────
const weekStart = ref(getMonday(new Date()))
function getMonday(d: Date) {
  const day = new Date(d); day.setHours(0,0,0,0)
  const dow = (day.getDay() + 6) % 7; day.setDate(day.getDate() - dow); return day
}
function prevWeek() { weekStart.value = new Date(weekStart.value.getTime() - 7*86400000); load() }
function nextWeek() { weekStart.value = new Date(weekStart.value.getTime() + 7*86400000); load() }
function thisWeek() { weekStart.value = getMonday(new Date()); load() }

const weekDays = computed(() => {
  const today = new Date(); today.setHours(0,0,0,0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.value.getTime() + i*86400000)
    return { date: d.toISOString().split('T')[0], dayName: DAY_NAMES[d.getDay()], dayNum: d.getDate(), isToday: d.getTime() === today.getTime() }
  })
})
const weekLabel = computed(() => {
  const f = weekDays.value[0], t = weekDays.value[6]
  return `${f.dayName} ${f.dayNum} — ${t.dayName} ${t.dayNum}`
})

// ── Данные ─────────────────────────────────────────────────────────────────────
const entries   = ref<any[]>([])
const allDishes = ref<any[]>([])
const loading   = ref(true)

async function load() {
  loading.value = true
  try {
    [entries.value, allDishes.value] = await Promise.all([
      $fetch('/api/meal-plan', { query: {
        from: weekDays.value[0].date,
        to:   weekDays.value[6].date,
        family: familyMode.value,
      }}),
      $fetch('/api/dishes'),
    ])
  } finally { loading.value = false }
}

onMounted(() => { load(); loadFamilyMembers() })

// ── Сетка ──────────────────────────────────────────────────────────────────────
function getEntries(date: string, mealType: string) {
  return entries.value.filter(e => e.date === date && e.meal_type === mealType)
}
function entryCalories(entry: any) {
  return (entry.dish?.total_calories ?? 0) * ((entry.portions ?? 1) / (entry.dish?.servings ?? 1))
}

const r1 = (n: number) => Math.round(n * 10) / 10

const dailyTotals = computed(() => {
  const m: Record<string, number> = {}
  for (const e of entries.value) {
    m[e.date] = (m[e.date] ?? 0) + entryCalories(e)
  }
  return m
})

function getMealLabel(val: string) { return MEAL_LABEL_MAP[val] ?? val }
function formatDateRu(d: string) {
  if (!d) return ''
  return new Date(d+'T00:00:00').toLocaleDateString('ru', { day: 'numeric', month: 'long' })
}

// ── Добавление ─────────────────────────────────────────────────────────────────
const showAddModal = ref(false)
const dishSearch   = ref('')
const dishFilter   = ref('')
const addForm      = reactive<{
  date: string; meal_type: string; dish_id: number|''; portions: number; target_user_id: number|null
}>({
  date: '', meal_type: '', dish_id: '', portions: 1, target_user_id: null,
})

const targetMemberName = computed(() => {
  if (!addForm.target_user_id || addForm.target_user_id === user.value?.id) return 'Мой план'
  return familyMembers.value.find(m => m.id === addForm.target_user_id)?.display_name ?? ''
})

const filteredDishOptions = computed(() => {
  const q = dishSearch.value.toLowerCase().trim()
  return allDishes.value.filter(d =>
    (!dishFilter.value || d.category === dishFilter.value) &&
    (!q || d.name.toLowerCase().includes(q))
  )
})

const selectedDish = computed(() =>
  addForm.dish_id ? allDishes.value.find(d => d.id === addForm.dish_id) ?? null : null
)

const quickPortions = computed(() => {
  if (!selectedDish.value) return [1]
  const s = selectedDish.value.servings ?? 1
  const opts = new Set<number>()
  if (s > 1) opts.add(0.5)
  opts.add(1)
  if (s >= 2) opts.add(2)
  if (s >= 4) opts.add(4)
  if (s >= 6) opts.add(s)
  return Array.from(opts).sort((a, b) => a - b)
})

const portionCalories = computed(() => {
  if (!selectedDish.value) return { calories: 0, protein: 0, fat: 0, carbs: 0 }
  const factor = (addForm.portions || 1) / (selectedDish.value.servings || 1)
  return {
    calories: r1(selectedDish.value.total_calories * factor),
    protein:  r1(selectedDish.value.total_protein  * factor),
    fat:      r1(selectedDish.value.total_fat      * factor),
    carbs:    r1(selectedDish.value.total_carbs    * factor),
  }
})

function selectDish(id: number) { addForm.dish_id = id; addForm.portions = 1 }

function openAdd(date: string, mealType: string) {
  addForm.date           = date
  addForm.meal_type      = mealType
  addForm.dish_id        = ''
  addForm.portions       = 1
  addForm.target_user_id = user.value?.id ?? null
  dishSearch.value  = ''
  dishFilter.value  = mealType
  showAddModal.value = true
}

async function saveEntry() {
  try {
    const body: any = {
      date:      addForm.date,
      meal_type: addForm.meal_type,
      dish_id:   addForm.dish_id,
      portions:  addForm.portions,
    }
    // Если добавляем за другого — передаём target_user_id
    if (addForm.target_user_id && addForm.target_user_id !== user.value?.id) {
      body.target_user_id = addForm.target_user_id
    }

    await $fetch('/api/meal-plan', { method: 'POST', body })

    const forWhom = addForm.target_user_id !== user.value?.id ? ` → ${targetMemberName.value}` : ''
    toast(`Добавлено: ${addForm.portions} порц.${forWhom}`)
    showAddModal.value = false
    await load()
  } catch (e: any) {
    toast(e?.data?.statusMessage ?? 'Ошибка', 'error')
  }
}

async function removeEntry(id: number) {
  try {
    await $fetch(`/api/meal-plan/${id}`, { method: 'DELETE' })
    toast('Удалено из плана')
    await load()
  } catch (e: any) {
    toast(e?.data?.statusMessage ?? 'Ошибка', 'error')
  }
}
</script>
