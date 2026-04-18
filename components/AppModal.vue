<!-- components/AppModal.vue -->
<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background:rgba(0,0,0,0.7); backdrop-filter:blur(4px);"
        @mousedown.self="$emit('update:modelValue', false)"
      >
        <Transition name="slide-up">
          <div
            v-if="modelValue"
            class="card w-full flex flex-col"
            :style="`max-width:${maxWidth}; max-height:90vh;`"
          >
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4" style="border-bottom:1px solid var(--color-border);">
              <h2 class="text-lg font-bold" style="font-family:'Syne',sans-serif; letter-spacing:-0.02em;">{{ title }}</h2>
              <button
                class="w-7 h-7 rounded-md flex items-center justify-center text-lg transition-colors hover:bg-white/10"
                style="color:var(--color-muted);"
                @click="$emit('update:modelValue', false)"
              >✕</button>
            </div>
            <!-- Body -->
            <div class="flex-1 overflow-y-auto px-6 py-5">
              <slot />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean; title: string; maxWidth?: string }>()
defineEmits(['update:modelValue'])
</script>
