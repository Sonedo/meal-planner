<!-- components/ToastList.vue -->
<template>
  <Teleport to="body">
    <div class="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end pointer-events-none">
      <TransitionGroup name="slide-up">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium shadow-xl"
          :style="t.type === 'error'
            ? 'background:#3d2020; border:1px solid #7f1d1d; color:#fca5a5;'
            : 'background:#1a2d1a; border:1px solid #14532d; color:#86efac;'"
        >
          <span>{{ t.type === 'error' ? '✗' : '✓' }}</span>
          {{ t.message }}
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '~/composables/useToast'
const { toasts } = useToast()
</script>
