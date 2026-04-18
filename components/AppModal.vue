<!-- components/AppModal.vue -->
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @click.self="close">
        <div class="modal-inner" :style="!isMobile ? `max-width:${maxWidth}` : ''">
          <!-- Ручка для свайпа на мобайле -->
          <div class="md:hidden flex justify-center pt-3 pb-1">
            <div class="w-10 h-1 rounded-full" style="background:var(--color-border);"></div>
          </div>
          <!-- Заголовок -->
          <div class="flex items-center justify-between px-5 py-4" style="border-bottom:1px solid var(--color-border);">
            <h2 class="font-bold text-base" style="font-family:'Syne',sans-serif;">{{ title }}</h2>
            <button class="w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-colors hover:bg-white/5" style="color:var(--color-muted);" @click="close">×</button>
          </div>
          <!-- Контент -->
          <div class="px-5 py-5">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: boolean; title?: string; maxWidth?: string }>()
const emit  = defineEmits(['update:modelValue'])

const isMobile = ref(false)
onMounted(() => {
  isMobile.value = window.innerWidth < 768
  window.addEventListener('resize', () => { isMobile.value = window.innerWidth < 768 })
})

function close() { emit('update:modelValue', false) }
</script>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
}

.modal-inner {
  width: 100%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  max-height: 90dvh;
  overflow-y: auto;
}

/* На мобайле — снизу вверх */
@media (max-width: 767px) {
  .modal-backdrop {
    align-items: flex-end;
    padding: 0;
  }
  .modal-inner {
    border-radius: 16px 16px 0 0;
    border-bottom: none;
    max-height: 92dvh;
    padding-bottom: env(safe-area-inset-bottom, 16px);
  }
}

/* Анимация */
.modal-enter-active, .modal-leave-active { transition: all 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

@media (max-width: 767px) {
  .modal-enter-from .modal-inner,
  .modal-leave-to .modal-inner { transform: translateY(100%); }
  .modal-enter-active .modal-inner,
  .modal-leave-active .modal-inner { transition: transform 0.3s ease; }
}
@media (min-width: 768px) {
  .modal-enter-from .modal-inner,
  .modal-leave-to .modal-inner { transform: scale(0.95) translateY(8px); opacity: 0; }
  .modal-enter-active .modal-inner,
  .modal-leave-active .modal-inner { transition: all 0.2s ease; }
}
</style>
