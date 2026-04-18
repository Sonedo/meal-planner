<!-- components/EntryList.vue — список блюд в ячейке планировщика (desktop) -->
<template>
  <div class="flex flex-col gap-1">
    <div
      v-for="entry in entries" :key="entry.id"
      class="group relative flex flex-col gap-0.5 rounded-lg p-1.5"
      style="background:var(--color-bg); border:1px solid var(--color-border);"
    >
      <p v-if="familyMode" class="text-[9px] uppercase tracking-wider" :style="entry.user?.id === currentUserId ? 'color:var(--color-accent)' : 'color:var(--color-muted)'">
        {{ entry.user?.id === currentUserId ? 'Вы' : entry.user?.display_name }}
      </p>
      <p class="text-[11px] font-medium leading-tight pr-4" style="font-family:'Syne',sans-serif;">{{ entry.dish?.name }}</p>
      <div class="flex items-center gap-1">
        <span class="text-[10px] px-1 py-0.5 rounded" style="background:rgba(200,240,74,0.1); color:var(--color-accent);">×{{ entry.portions ?? 1 }}п</span>
        <span class="macro-cal text-[10px] px-1 py-0.5 rounded">{{ Math.round((entry.dish?.total_calories ?? 0) * ((entry.portions ?? 1) / (entry.dish?.servings ?? 1))) }} ккал</span>
      </div>
      <button
        v-if="entry.user?.id === currentUserId"
        class="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
        style="background:rgba(248,113,113,0.2); color:#f87171;"
        @click="$emit('remove', entry.id)"
      >×</button>
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps<{ entries: any[]; familyMode: boolean; currentUserId?: number }>()
defineEmits(['remove'])
</script>
