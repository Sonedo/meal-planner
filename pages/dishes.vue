<!-- pages/dishes.vue -->
<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Конструктор блюд</h1>
        <p class="text-sm mt-0.5" style="color:var(--color-text-dim);">{{ dishes.length }} рецептов</p>
      </div>
      <button class="btn btn-primary" @click="openCreate">+ Новое блюдо</button>
    </div>

    <!-- Фильтр по категории -->
    <div class="flex gap-2 mb-5 flex-wrap">
      <button
        v-for="cat in MEAL_CATS"
        :key="cat.value"
        class="btn text-xs py-1.5 px-3"
        :class="filterCat === cat.value ? 'btn-primary' : 'btn-secondary'"
        @click="filterCat = cat.value"
      >{{ cat.label }}</button>
    </div>

    <div v-if="loading" class="py-12 text-center" style="color:var(--color-muted);">Загрузка…</div>

    <div v-else-if="filtered.length === 0" class="py-12 text-center" style="color:var(--color-muted);">Блюд пока нет.</div>

    <div v-else class="grid grid-cols-1 gap-3">
      <TransitionGroup name="slide-up">
        <DishCard
          v-for="d in filtered"
          :key="d.id"
          :dish="d"
          @edit="openEdit(d)"
          @delete="askDelete(d)"
        />
      </TransitionGroup>
    </div>

    <!-- Модалка -->
    <AppModal v-model="showModal" :title="editing ? 'Редактировать блюдо' : 'Новое блюдо'" max-width="720px">
      <DishForm
        :initial="editingDish"
        :products="products"
        :saving="saving"
        @submit="saveDish"
        @cancel="showModal = false"
      />
    </AppModal>

    <ConfirmDialog
      v-model="showConfirm"
      :message="`Удалить '${toDelete?.name}'?`"
      @confirm="deleteDish"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

import { useToast } from '~/composables/useToast'
const { add: toast } = useToast()

const MEAL_CATS = [
  { value: 'all',       label: 'Все' },
  { value: 'breakfast', label: 'Завтрак' },
  { value: 'lunch',     label: 'Обед' },
  { value: 'dinner',    label: 'Ужин' },
  { value: 'snack',     label: 'Перекус' },
]

const dishes   = ref<any[]>([])
const products = ref<any[]>([])
const loading  = ref(true)
const saving   = ref(false)
const filterCat = ref('all')

const showModal   = ref(false)
const showConfirm = ref(false)
const editing     = ref(false)
const editingDish = ref<any>(null)
const toDelete    = ref<any>(null)

const filtered = computed(() =>
  filterCat.value === 'all' ? dishes.value : dishes.value.filter(d => d.category === filterCat.value)
)

async function load() {
  loading.value = true
  try {
    [dishes.value, products.value] = await Promise.all([
      $fetch('/api/dishes'),
      $fetch('/api/products'),
    ])
  } finally { loading.value = false }
}

function openCreate() {
  editing.value = false
  editingDish.value = null
  showModal.value = true
}

function openEdit(d: any) {
  editing.value = true
  editingDish.value = d
  showModal.value = true
}

async function saveDish(data: any) {
  saving.value = true
  try {
    if (editing.value) {
      await $fetch(`/api/dishes/${data.id}`, { method: 'PUT', body: data })
      toast('Блюдо обновлено')
    } else {
      await $fetch('/api/dishes', { method: 'POST', body: data })
      toast('Блюдо создано')
    }
    showModal.value = false
    await load()
  } catch (e: any) {
    toast(e?.data?.statusMessage ?? 'Ошибка сохранения', 'error')
  } finally { saving.value = false }
}

function askDelete(d: any) {
  toDelete.value = d
  showConfirm.value = true
}

async function deleteDish() {
  try {
    await $fetch(`/api/dishes/${toDelete.value.id}`, { method: 'DELETE' })
    toast('Блюдо удалено')
    await load()
  } catch (e: any) {
    toast(e?.data?.statusMessage ?? 'Невозможно удалить', 'error')
  }
}

onMounted(load)
</script>
