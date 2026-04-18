<!-- components/ProductForm.vue -->
<template>
  <form @submit.prevent="submit">
    <div class="grid grid-cols-2 gap-4">
      <!-- Название -->
      <div class="col-span-2">
        <label class="label">Название *</label>
        <input v-model="f.name" class="input" placeholder="напр. Куриная грудка" required />
      </div>

      <!-- Категория -->
      <div class="col-span-2">
        <label class="label">Категория</label>
        <select v-model="f.category" class="select">
          <option v-for="c in CATEGORIES" :key="c.value" :value="c.value">{{ c.label }}</option>
        </select>
      </div>

      <!-- Макросы -->
      <div>
        <label class="label">Калории / 100г *</label>
        <input v-model="f.calories_per_100g" class="input" type="number" step="0.1" min="0" required placeholder="0" />
      </div>
      <div>
        <label class="label">Белки / 100г (г)</label>
        <input v-model="f.protein_per_100g" class="input" type="number" step="0.1" min="0" placeholder="0" />
      </div>
      <div>
        <label class="label">Жиры / 100г (г)</label>
        <input v-model="f.fat_per_100g" class="input" type="number" step="0.1" min="0" placeholder="0" />
      </div>
      <div>
        <label class="label">Углеводы / 100г (г)</label>
        <input v-model="f.carbs_per_100g" class="input" type="number" step="0.1" min="0" placeholder="0" />
      </div>
    </div>

    <!-- Предпросмотр -->
    <div class="mt-5 p-3 rounded-lg" style="background:var(--color-bg); border:1px solid var(--color-border);">
      <p class="text-xs mb-2" style="color:var(--color-muted); font-family:'Syne',sans-serif;">Предпросмотр на 100г</p>
      <MacroPills
        :calories="Number(f.calories_per_100g) || 0"
        :protein="Number(f.protein_per_100g) || 0"
        :fat="Number(f.fat_per_100g) || 0"
        :carbs="Number(f.carbs_per_100g) || 0"
      />
    </div>

    <div class="flex gap-2 justify-end mt-5">
      <button type="button" class="btn btn-secondary" @click="$emit('cancel')">Отмена</button>
      <button type="submit" class="btn btn-primary" :disabled="saving">
        {{ saving ? 'Сохраняем…' : (initial?.id ? 'Обновить' : 'Создать') }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
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

const props = defineProps<{ initial?: any; saving?: boolean }>()
const emit  = defineEmits(['submit', 'cancel'])

const f = reactive({
  id: props.initial?.id,
  name: props.initial?.name ?? '',
  category: props.initial?.category ?? 'other',
  calories_per_100g: props.initial?.calories_per_100g ?? '',
  protein_per_100g:  props.initial?.protein_per_100g  ?? '',
  fat_per_100g:      props.initial?.fat_per_100g       ?? '',
  carbs_per_100g:    props.initial?.carbs_per_100g     ?? '',
})

watch(() => props.initial, (v) => {
  if (!v) return
  Object.assign(f, {
    id: v.id, name: v.name, category: v.category,
    calories_per_100g: v.calories_per_100g,
    protein_per_100g:  v.protein_per_100g,
    fat_per_100g:      v.fat_per_100g,
    carbs_per_100g:    v.carbs_per_100g,
  })
})

const submit = () => emit('submit', { ...f })
</script>
