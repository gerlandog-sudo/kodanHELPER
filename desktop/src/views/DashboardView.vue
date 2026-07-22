<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold" style="font-family: var(--font-headline); color: var(--on-background);">Dashboard</h1>
      <div class="flex gap-4 text-sm" style="color: var(--on-surface-variant);">
        <span>Total: {{ store.totalCount }}</span>
        <span>Pendientes: {{ store.inboxCount }}</span>
      </div>
    </div>

    <div v-if="store.loading" style="color: var(--on-surface-variant);">Cargando...</div>
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <KanbanBoard :items="store.tasks" />
      <IdeaWall :items="store.ideas" />
      <MeetingCalendar :items="store.meetings" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useItemsStore } from '../stores/items.js';
import KanbanBoard from '../components/KanbanBoard.vue';
import IdeaWall from '../components/IdeaWall.vue';
import MeetingCalendar from '../components/MeetingCalendar.vue';

const store = useItemsStore();

onMounted(async () => {
  await store.loadItems();
  store.startRealtime();
});

onUnmounted(() => {
  store.stopRealtime();
});
</script>
