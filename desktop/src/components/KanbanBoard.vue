<template>
  <div>
    <h2 class="text-lg font-semibold text-white mb-4">Tareas</h2>
    <div class="space-y-3">
      <ItemCard v-for="item in items" :key="item.id" :item="item" />
      <p v-if="!items.length" class="text-sm text-slate-500 italic">No hay tareas pendientes</p>
    </div>
  </div>
</template>

<script setup>
import ItemCard from './ItemCard.vue';

defineProps({
  items: { type: Array, default: () => [] },
});
</script>
