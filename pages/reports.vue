<!-- pages/reports.vue -->
<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Отчёты</h1>
        <p class="text-sm mt-0.5" style="color:var(--color-text-dim);">Питание · рецепты для заготовок</p>
      </div>
    </div>

    <!-- Параметры: период + режим семьи -->
    <div class="card px-5 py-4 mb-5 flex flex-wrap items-end gap-4">
      <div>
        <label class="label">С</label>
        <input v-model="from" type="date" class="input" style="width:160px;" />
      </div>
      <div>
        <label class="label">По</label>
        <input v-model="to" type="date" class="input" style="width:160px;" />
      </div>
      <div class="flex gap-2 flex-wrap">
        <button class="btn btn-secondary text-xs" @click="setPreset('week')">Эта неделя</button>
        <button class="btn btn-secondary text-xs" @click="setPreset('month')">Этот месяц</button>
      </div>
      <!-- Семейный режим -->
      <div v-if="hasFamily" class="flex items-center gap-2 ml-auto">
        <span class="text-sm" style="color:var(--color-text-dim);">Данные:</span>
        <button class="btn text-xs py-1.5 px-3" :class="!familyMode ? 'btn-primary' : 'btn-secondary'" @click="setFamilyMode(false)">Мои</button>
        <button class="btn text-xs py-1.5 px-3" :class="familyMode ? 'btn-primary' : 'btn-secondary'" @click="setFamilyMode(true)">🏠 Семьи</button>
      </div>
      <button class="btn btn-primary" :disabled="loading" @click="loadReports">
        {{ loading ? 'Загрузка…' : 'Сформировать' }}
      </button>
    </div>

    <!-- Вкладки -->
    <div class="flex gap-2 mb-5 flex-wrap">
      <button v-for="t in TABS" :key="t.value" class="btn" :class="tab === t.value ? 'btn-primary' : 'btn-secondary'" @click="tab = t.value">
        {{ t.label }}
      </button>
    </div>

    <!-- ── ПИТАНИЕ ──────────────────────────────────────────────────────────── -->
    <div v-if="tab === 'nutrition'">
      <div v-if="!nutritionData" class="py-12 text-center" style="color:var(--color-muted);">
        Выберите период и нажмите «Сформировать».
      </div>
      <div v-else>
        <!-- Норма пользователя — подсказка если не задана -->
        <div v-if="!userGoals" class="mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-3" style="background:rgba(167,139,250,0.08); border:1px solid rgba(167,139,250,0.2);">
          <span>💡</span>
          <span style="color:var(--color-text-dim);">
            Заполните параметры в разделе <NuxtLink to="/profile" style="color:var(--color-accent);">Профиль → Здоровье</NuxtLink> чтобы видеть диаграммы достаточности питания.
          </span>
        </div>

        <!-- Итого + среднее в день -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div class="card px-5 py-4">
            <p class="label mb-4">
              Итого · {{ nutritionData.days_with_data }} дн.
              <span v-if="nutritionData.family_mode" class="ml-1" style="color:var(--color-accent);">🏠</span>
            </p>
            <MacroGauges
              :calories="nutritionData.total.calories"
              :protein="nutritionData.total.protein"
              :fat="nutritionData.total.fat"
              :carbs="nutritionData.total.carbs"
              :goals="userGoals ? { calories: userGoals.calories * nutritionData.days_with_data, protein: userGoals.protein * nutritionData.days_with_data, fat: userGoals.fat * nutritionData.days_with_data, carbs: userGoals.carbs * nutritionData.days_with_data } : null"
              :size="88"
            />
          </div>
          <div class="card px-5 py-4">
            <p class="label mb-4">Среднее в день vs норма</p>
            <MacroGauges
              :calories="nutritionData.average_per_day.calories"
              :protein="nutritionData.average_per_day.protein"
              :fat="nutritionData.average_per_day.fat"
              :carbs="nutritionData.average_per_day.carbs"
              :goals="userGoals"
              :size="88"
            />
          </div>
        </div>

        <!-- По участникам (только семейный режим) -->
        <div v-if="nutritionData.by_member?.length > 1" class="card mb-5 overflow-hidden">
          <div class="px-5 py-3" style="border-bottom:1px solid var(--color-border);">
            <h3 class="text-sm font-bold" style="font-family:'Syne',sans-serif;">По участникам семьи</h3>
          </div>
          <div v-for="m in nutritionData.by_member" :key="m.user_id" class="table-row">
            <div class="w-36 flex items-center gap-2">
              <div class="w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0" style="background:var(--color-border); font-family:'Syne',sans-serif;">
                {{ m.display_name[0]?.toUpperCase() }}
              </div>
              <span class="text-sm font-medium truncate" style="font-family:'Syne',sans-serif;">{{ m.display_name }}</span>
            </div>
            <div class="flex-1"><MacroGauges :calories="m.calories" :protein="m.protein" :fat="m.fat" :carbs="m.carbs" :goals="userGoals" :size="72" /></div>
          </div>
        </div>

        <!-- Разбивка по дням -->
        <div class="card overflow-hidden">
          <div class="px-5 py-3" style="border-bottom:1px solid var(--color-border);">
            <h3 class="text-sm font-bold" style="font-family:'Syne',sans-serif;">По дням</h3>
          </div>
          <div v-if="nutritionData.by_day.length === 0" class="px-5 py-6 text-sm" style="color:var(--color-muted);">Нет записей.</div>
          <div v-for="day in nutritionData.by_day" :key="day.date" class="table-row flex-wrap gap-3">
            <span class="w-32 text-sm font-medium flex-shrink-0" style="font-family:'Syne',sans-serif;">{{ fmtDate(day.date) }}</span>
            <MacroGauges
              :calories="day.calories" :protein="day.protein" :fat="day.fat" :carbs="day.carbs"
              :goals="userGoals" :size="72"
            />
          </div>
        </div>
      </div>
    </div>


    <!-- ── РЕЦЕПТЫ ─────────────────────────────────────────────────────────── -->
    <div v-if="tab === 'prep'">
      <div v-if="!prepData" class="py-12 text-center" style="color:var(--color-muted);">
        Выберите период и нажмите «Сформировать».
      </div>
      <div v-else>
        <div class="flex items-center justify-between mb-4">
          <p class="text-sm" style="color:var(--color-text-dim);">
            {{ prepData.dishes.length }} блюд
            <span v-if="prepData.family_mode" style="color:var(--color-accent);"> · 🏠 семья</span>
          </p>
          <button class="btn btn-secondary text-xs" onclick="window.print()">🖨 Печать</button>
        </div>
        <div v-if="prepData.dishes.length === 0" class="py-6 text-sm" style="color:var(--color-muted);">Нет блюд.</div>

        <div v-for="dish in prepData.dishes" :key="dish.id" class="card mb-4 overflow-hidden">
          <!-- Заголовок -->
          <div class="px-5 py-3 flex items-start justify-between gap-3" style="border-bottom:1px solid var(--color-border);">
            <div class="flex-1">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <h3 class="font-bold" style="font-family:'Syne',sans-serif;">{{ dish.name }}</h3>
                <span class="tag text-xs" :class="`meal-${dish.category}`">{{ MEAL_LABELS[dish.category] }}</span>
                <span v-if="dish.cooking_time" class="tag text-xs">⏱ {{ dish.cooking_time }} мин</span>
              </div>
              <p class="text-xs" style="color:var(--color-text-dim);">
                Запланировано <strong style="color:var(--color-accent);">{{ dish.total_portions }} порц.</strong>
                из {{ dish.servings }} в рецепте ·
                {{ dish.used_on_dates.map(fmtDate).join(', ') }}
              </p>
            </div>
            <div class="flex-shrink-0 text-right">
              <p class="text-[10px] uppercase tracking-wider mb-1" style="color:var(--color-muted); font-family:'Syne',sans-serif;">{{ dish.total_portions }} порц.</p>
              <div class="flex gap-1 flex-wrap justify-end">
                <span class="macro-pill macro-cal text-[10px] px-2 py-0.5">{{ dish.nutrition.calories }} ккал</span>
                <span class="macro-pill macro-prot text-[10px] px-2 py-0.5">{{ dish.nutrition.protein }}г Б</span>
                <span class="macro-pill macro-fat text-[10px] px-2 py-0.5">{{ dish.nutrition.fat }}г Ж</span>
                <span class="macro-pill macro-carb text-[10px] px-2 py-0.5">{{ dish.nutrition.carbs }}г У</span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2" style="border-bottom:1px solid var(--color-border);">
            <!-- Ингредиенты -->
            <div class="px-5 py-3" style="border-right:1px solid var(--color-border);">
              <p class="label mb-2.5">Ингредиенты
                <span style="color:var(--color-muted); text-transform:none; font-weight:400;">
                  (× {{ +(dish.total_portions / dish.servings).toFixed(2) }} от рецепта)
                </span>
              </p>
              <div v-for="(items, cat) in groupedIngredients(dish.ingredients)" :key="cat" class="mb-2">
                <p class="text-[10px] uppercase tracking-wider mb-1" style="color:var(--color-muted);">{{ getCatLabel(String(cat)) }}</p>
                <div v-for="ing in items" :key="ing.product" class="flex items-center justify-between py-0.5 gap-2">
                  <span class="text-sm">{{ ing.product }}</span>
                  <span class="text-sm font-mono font-semibold" style="color:var(--color-accent);">{{ fmtGrams(ing.quantity_grams) }}</span>
                </div>
              </div>
            </div>
            <!-- Приготовление -->
            <div class="px-5 py-3">
              <p class="label mb-2.5">Приготовление</p>
              <p v-if="dish.notes" class="text-sm leading-relaxed" style="color:var(--color-text-dim);">{{ dish.notes }}</p>
              <p v-else class="text-sm" style="color:var(--color-muted);">Заметки не указаны</p>
            </div>
          </div>

          <!-- Питательность на 1 порцию -->
          <div class="px-5 py-3 flex items-center gap-4">
            <p class="text-xs" style="color:var(--color-muted); white-space:nowrap;">На 1 порцию:</p>
            <MacroPills :calories="dish.per_portion.calories" :protein="dish.per_portion.protein" :fat="dish.per_portion.fat" :carbs="dish.per_portion.carbs" />
          </div>
        </div>
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
  { value: 'nutrition', label: '🥦 Питание' },
  { value: 'prep',      label: '📋 Рецепты' },
]
const MEAL_LABELS: Record<string,string> = { breakfast:'Завтрак', lunch:'Обед', dinner:'Ужин', snack:'Перекус' }
const CAT_LABELS: Record<string,string> = { vegetable:'Овощи', meat:'Мясо / Рыба', dairy:'Молочное', grain:'Злаки / Крупы', fruit:'Фрукты', legume:'Бобовые', oil:'Масла / Жиры', other:'Прочее' }
const CAT_ORDER = ['meat','dairy','grain','vegetable','fruit','legume','oil','other']

const from       = ref('')
const to         = ref('')
const tab        = ref('nutrition')
const familyMode = ref(false)
const loading    = ref(false)
const nutritionData = ref<any>(null)
const prepData      = ref<any>(null)
const userGoals     = ref<any>(null)  // дневные нормы пользователя


function getCatLabel(v: string) { return CAT_LABELS[v] ?? v }

function localDate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function setPreset(preset: 'week'|'month') {
  const now = new Date()
  if (preset === 'week') {
    const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay()+6)%7))
    const sun = new Date(mon); sun.setDate(mon.getDate()+6)
    from.value = localDate(mon)
    to.value   = localDate(sun)
  } else {
    from.value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`
    const last = new Date(now.getFullYear(), now.getMonth()+1, 0)
    to.value   = localDate(last)
  }
}

function setFamilyMode(val: boolean) {
  familyMode.value = val
  // Если данные уже загружены — перезагружаем с новым режимом
  if (nutritionData.value || shoppingData.value || prepData.value) {
    loadReports()
  }
}

async function loadReports() {
  if (!from.value || !to.value) { toast('Выберите период','error'); return }
  if (from.value > to.value)    { toast('Дата «С» должна быть раньше «По»','error'); return }
  loading.value = true
  const q = { from: from.value, to: to.value, family: String(familyMode.value) }
  try {
    [nutritionData.value, prepData.value] = await Promise.all([
      $fetch('/api/reports/nutrition-summary', { query: q }),
      $fetch('/api/reports/prep-summary',      { query: q }),
    ])
  } catch(e: any) {
    toast(e?.data?.statusMessage ?? 'Ошибка загрузки','error')
  } finally { loading.value = false }
}

function fmtDate(d: string) {
  return new Date(d+'T00:00:00').toLocaleDateString('ru', { weekday:'short', month:'short', day:'numeric' })
}
function fmtGrams(g: number) { return g >= 1000 ? `${(g/1000).toFixed(2)} кг` : `${Math.round(g)} г` }

function groupedIngredients(ings: any[]) {
  const m: Record<string, any[]> = {}
  for (const ing of ings) { const c = ing.category ?? 'other'; if (!m[c]) m[c]=[]; m[c].push(ing) }
  const sorted: Record<string, any[]> = {}
  for (const c of CAT_ORDER) if (m[c]?.length) sorted[c] = m[c]
  for (const c of Object.keys(m)) if (!sorted[c]) sorted[c] = m[c]
  return sorted
}

onMounted(async () => {
  setPreset('week')
  // Загружаем нормы пользователя для диаграмм
  try {
    const p = await $fetch<any>('/api/profile')
    userGoals.value = p.goals ?? null
  } catch {}
  loadReports()
})
</script>
