<!-- pages/index.vue  (Products Library) -->
<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">База продуктов</h1>
        <p class="text-sm mt-0.5" style="color:var(--color-text-dim);">{{ products.length }} продуктов · питательность на 100г</p>
      </div>
      <button class="btn btn-primary" @click="openCreate">+ Добавить продукт</button>
    </div>

    <!-- Поиск + фильтр -->
    <div class="flex gap-3 mb-5">
      <input
        v-model="search"
        class="input"
        placeholder="Поиск продуктов…"
        style="max-width:280px;"
      />
      <select v-model="filterCategory" class="select" style="max-width:200px;">
        <option value="">Все категории</option>
        <option v-for="c in CATEGORIES" :key="c.value" :value="c.value">{{ c.label }}</option>
      </select>
    </div>

    <!-- Таблица -->
    <div class="card overflow-hidden">
      <!-- Заголовок -->
      <div class="flex items-center gap-4 px-4 py-2.5 text-xs uppercase tracking-wider" style="color:var(--color-muted); border-bottom:1px solid var(--color-border); font-family:'Syne',sans-serif;">
        <span class="flex-1">Название</span>
        <span class="w-28 text-center">Категория</span>
        <span class="w-20 text-right">Ккал</span>
        <span class="w-20 text-right">Белки</span>
        <span class="w-16 text-right">Жиры</span>
        <span class="w-16 text-right">Углев.</span>
        <span class="w-24 text-right">Действия</span>
      </div>

      <div v-if="loading" class="py-12 text-center" style="color:var(--color-muted);">Загрузка…</div>

      <div v-else-if="filtered.length === 0" class="py-12 text-center" style="color:var(--color-muted);">
        Продукты не найдены.
      </div>

      <TransitionGroup name="slide-up" tag="div">
        <div
          v-for="p in filtered"
          :key="p.id"
          class="table-row"
        >
          <span class="flex-1 font-medium text-sm">{{ p.name }}</span>
          <span class="w-28 text-center">
            <span class="tag text-xs" :class="`cat-${p.category}`">{{ getCategoryLabel(p.category) }}</span>
          </span>
          <span class="w-20 text-right text-sm font-mono macro-cal px-2 py-0.5 rounded text-xs">{{ p.calories_per_100g }}</span>
          <span class="w-20 text-right text-sm font-mono" style="color:var(--color-text-dim);">{{ p.protein_per_100g }}г</span>
          <span class="w-16 text-right text-sm font-mono" style="color:var(--color-text-dim);">{{ p.fat_per_100g }}г</span>
          <span class="w-16 text-right text-sm font-mono" style="color:var(--color-text-dim);">{{ p.carbs_per_100g }}г</span>
          <div class="w-24 flex justify-end gap-1">
            <button class="btn btn-ghost px-2 py-1 text-xs" @click="openEdit(p)">Изм.</button>
            <button class="btn btn-danger px-2 py-1 text-xs" @click="askDelete(p)">Удал.</button>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- Модалка создания/редактирования -->
    <AppModal v-model="showModal" :title="editing ? 'Редактировать продукт' : 'Новый продукт'" max-width="500px">
      <ProductForm
        :initial="form"
        :saving="saving"
        @submit="saveProduct"
        @cancel="showModal = false"
      />
    </AppModal>

    <!-- Подтверждение удаления -->
    <ConfirmDialog
      v-model="showConfirm"
      :message="`Удалить '${toDelete?.name}'? Это действие нельзя отменить.`"
      @confirm="deleteProduct"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

import { useToast } from '~/composables/useToast'

const { add: toast } = useToast()

const CATEGORIES = [
  { value: 'vegetable', label: 'Овощи' },
  { value: 'meat',      label: 'Мясо / Рыба' },
  { value: 'dairy',     label: 'Молочное' },
  { value: 'grain',     label: 'Злаки / Крупы' },
  { value: 'fruit',     label: 'Фрукты' },
  { value: 'legume',    label: 'Бобовые' },
  { value: 'oil',       label: 'Масла / Жиры' },
  { value: 'other',     label: 'Прочее' },
]

const products = ref<any[]>([])
const loading  = ref(true)
const search   = ref('')
const filterCategory = ref('')

const showModal   = ref(false)
const showConfirm = ref(false)
const editing     = ref(false)
const saving      = ref(false)
const toDelete    = ref<any>(null)

const blankForm = () => ({
  name: '', calories_per_100g: '', protein_per_100g: '', fat_per_100g: '', carbs_per_100g: '', category: 'other'
})
const form = ref(blankForm())

const filtered = computed(() => {
  let list = products.value
  if (search.value) list = list.filter(p => p.name.toLowerCase().includes(search.value.toLowerCase()))
  if (filterCategory.value) list = list.filter(p => p.category === filterCategory.value)
  return list
})

const getCategoryLabel = (val: string) =>
  CATEGORIES.find(c => c.value === val)?.label ?? val

async function load() {
  loading.value = true
  try { products.value = await $fetch('/api/products') }
  finally { loading.value = false }
}

function openCreate() {
  editing.value = false
  form.value = blankForm()
  showModal.value = true
}

function openEdit(p: any) {
  editing.value = true
  form.value = { ...p }
  showModal.value = true
}

async function saveProduct(data: any) {
  saving.value = true
  try {
    if (editing.value) {
      await $fetch(`/api/products/${data.id}`, { method: 'PUT', body: data })
      toast('Продукт обновлён')
    } else {
      await $fetch('/api/products', { method: 'POST', body: data })
      toast('Продукт создан')
    }
    showModal.value = false
    await load()
  } catch (e: any) {
    toast(e?.data?.statusMessage ?? 'Ошибка сохранения', 'error')
  } finally {
    saving.value = false
  }
}

function askDelete(p: any) {
  toDelete.value = p
  showConfirm.value = true
}

async function deleteProduct() {
  try {
    await $fetch(`/api/products/${toDelete.value.id}`, { method: 'DELETE' })
    toast('Продукт удалён')
    await load()
  } catch (e: any) {
    toast(e?.data?.statusMessage ?? 'Невозможно удалить', 'error')
  }
}

onMounted(load)
</script>
