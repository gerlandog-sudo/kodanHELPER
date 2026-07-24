<template>
  <div class="p-8 h-full flex flex-col">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold" style="font-family: var(--font-headline); color: var(--on-background);">Dashboard</h1>
      <div class="flex gap-4 text-sm" style="color: var(--on-surface-variant);">
        <span>Total: {{ store.totalCount }}</span>
        <span>Por clasificar: {{ store.rawInputs.length }}</span>
      </div>
    </div>

    <div v-if="store.loading" class="flex items-center justify-center flex-1">
      <div class="text-sm" style="color: var(--on-surface-variant);">Cargando...</div>
    </div>
    <KanbanBoard v-else class="flex-1 min-h-0" />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useItemsStore } from '../stores/items.js';
import KanbanBoard from '../components/KanbanBoard.vue';

const store = useItemsStore();

onMounted(async () => {
  await store.loadItems();
  await store.loadRawInputs();
  store.startRealtime();
});

onUnmounted(() => {
  store.stopRealtime();
});
</script>
