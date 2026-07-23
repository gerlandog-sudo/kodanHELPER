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
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-enter">
      <CategoryBoard
        v-for="cat in boardConfig"
        :key="cat.value"
        :title="cat.label"
        :items="getItemsForCategory(cat.value)"
        :empty-message="cat.emptyMessage"
        :color="cat.color"
        :layout="cat.layout"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue';
import { useItemsStore } from '../stores/items.js';
import CategoryBoard from '../components/CategoryBoard.vue';
import { CATEGORIES } from '../config/categories.js';

const store = useItemsStore();

const boardConfig = computed(() => [
  {
    value: 'Tarea',
    label: 'Tareas',
    color: CATEGORIES.find(c => c.value === 'Tarea')?.color || 'var(--primary)',
    emptyMessage: 'No hay tareas pendientes',
    layout: 'list',
  },
  {
    value: 'Idea',
    label: 'Ideas',
    color: CATEGORIES.find(c => c.value === 'Idea')?.color || 'var(--secondary)',
    emptyMessage: 'Sin ideas registradas',
    layout: 'grid',
  },
  {
    value: 'Reunion',
    label: 'Reuniones',
    color: CATEGORIES.find(c => c.value === 'Reunion')?.color || 'var(--tertiary)',
    emptyMessage: 'No hay reuniones agendadas',
    layout: 'list',
  },
  {
    value: 'Recordatorio',
    label: 'Recordatorios',
    color: CATEGORIES.find(c => c.value === 'Recordatorio')?.color || 'var(--error)',
    emptyMessage: 'Sin recordatorios activos',
    layout: 'list',
  },
  {
    value: 'Nota',
    label: 'Notas',
    color: CATEGORIES.find(c => c.value === 'Nota')?.color || 'var(--on-surface-variant)',
    emptyMessage: 'Sin notas guardadas',
    layout: 'grid',
  },
  {
    value: 'Investigar',
    label: 'Investigar',
    color: CATEGORIES.find(c => c.value === 'Investigar')?.color || '#9b59b6',
    emptyMessage: 'Sin enlaces para revisar',
    layout: 'list',
  },
  {
    value: 'Llamar',
    label: 'Llamar',
    color: CATEGORIES.find(c => c.value === 'Llamar')?.color || '#e67e22',
    emptyMessage: 'Sin llamadas pendientes',
    layout: 'list',
  },
]);

function getItemsForCategory(categoryValue) {
  return store.items.filter(i => i.category === categoryValue);
}

onMounted(async () => {
  await store.loadItems();
  store.startRealtime();
});

onUnmounted(() => {
  store.stopRealtime();
});
</script>
