<!-- components/ConfirmDialog.vue -->
<template>
  <AppModal :model-value="modelValue" title="Подтверждение" max-width="380px" @update:model-value="$emit('update:modelValue', $event)">
    <p class="mb-5 text-sm" style="color:var(--color-text-dim);">{{ message }}</p>
    <div class="flex gap-2 justify-end">
      <button class="btn btn-secondary" @click="$emit('update:modelValue', false)">Отмена</button>
      <button class="btn btn-danger" @click="confirm">Удалить</button>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean; message: string }>()
const emit = defineEmits(['update:modelValue', 'confirm'])
const confirm = () => {
  emit('confirm')
  emit('update:modelValue', false)
}
</script>
