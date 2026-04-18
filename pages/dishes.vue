<!-- pages/dishes.vue -->
<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Блюда</h1>
        <p class="text-sm mt-0.5" style="color:var(--color-text-dim);">{{ filtered.length }} из {{ dishes.length }}</p>
      </div>
      <button class="btn btn-primary" @click="openCreate">+ Новое</button>
    </div>

    <!-- Поиск + фильтр -->
    <div class="flex flex-col gap-3 mb-5">
      <div class="relative">
        <input v-model="search" class="input pl-9" placeholder="Поиск блюда…" />
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-base" style="color:var(--color-muted);">🔍</span>
        <span v-if="search" class="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" style="color:var(--color-muted);" @click="search = ''">×</span>
      </div>
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="cat in MEAL_CATS" :key="cat.value"
          class="btn text-xs py-1.5 px-3"
          :class="filterCat === cat.value ? 'btn-primary' : 'btn-secondary'"
          @click="filterCat = cat.value"
        >{{ cat.label }}</button>
      </div>
    </div>

    <div v-if="loading" class="py-12 text-center" style="color:var(--color-muted);">Загрузка…</div>
    <div v-else-if="filtered.length === 0" class="py-12 text-center" style="color:var(--color-muted);">
      {{ search ? `По запросу «${search}» ничего не найдено` : 'Блюд пока нет.' }}
    </div>
    <div v-else class="grid grid-cols-1 gap-3">
      <DishCard v-for="d in filtered" :key="d.id" :dish="d" @edit="openEdit(d)" @delete="askDelete(d)" />
    </div>

    <AppModal v-model="showModal" :title="editing ? 'Редактировать блюдо' : 'Новое блюдо'" max-width="720px">
      <DishForm :initial="editingDish" :products="products" :saving="saving" @submit="saveDish" @cancel="showModal = false" />
    </AppModal>
    <ConfirmDialog v-model="showConfirm" :message="`Удалить '${toDelete?.name}'?`" @confirm="deleteDish" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
import { useToast } from '~/composables/useToast'
const { add: toast } = useToast()

const MEAL_CATS = [
  { value: 'all', label: 'Все' },
  { value: 'breakfast', label: 'Завтрак' },
  { value: 'lunch', label: 'Обед' },
  { value: 'dinner', label: 'Ужин' },
  { value: 'snack', label: 'Перекус' },
]

const dishes    = ref<any[]>([])
const products  = ref<any[]>([])
const loading   = ref(true)
const saving    = ref(false)
const filterCat = ref('all')
const search    = ref('')
const showModal   = ref(false)
const showConfirm = ref(false)
const editing     = ref(false)
const editingDish = ref<any>(null)
const toDelete    = ref<any>(null)

const filtered = computed(() => {
  let list = filterCat.value === 'all' ? dishes.value : dishes.value.filter(d => d.category === filterCat.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase().trim()
    list = list.filter(d => d.name.toLowerCase().includes(q))
  }
  return list
})

async function load() {
  loading.value = true
  try {
    [dishes.value, products.value] = await Promise.all([$fetch('/api/dishes'), $fetch('/api/products')])
  } finally { loading.value = false }
}
function openCreate() { editing.value = false; editingDish.value = null; showModal.value = true }
function openEdit(d: any) { editing.value = true; editingDish.value = d; showModal.value = true }
async function saveDish(data: any) {
  saving.value = true
  try {
    if (editing.value) { await $fetch(`/api/dishes/${data.id}`, { method: 'PUT', body: data }); toast('Блюдо обновлено') }
    else { await $fetch('/api/dishes', { method: 'POST', body: data }); toast('Блюдо создано') }
    showModal.value = false; await load()
  } catch (e: any) { toast(e?.data?.statusMessage ?? 'Ошибка', 'error') }
  finally { saving.value = false }
}
function askDelete(d: any) { toDelete.value = d; showConfirm.value = true }
async function deleteDish() {
  try { await $fetch(`/api/dishes/${toDelete.value.id}`, { method: 'DELETE' }); toast('Блюдо удалено'); await load() }
  catch (e: any) { toast(e?.data?.statusMessage ?? 'Невозможно удалить', 'error') }
}
onMounted(load)
</script>
