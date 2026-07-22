<template>
  <div>
    <h2 class="text-lg font-semibold mb-4" style="color: var(--on-background);">Reuniones</h2>
    <div class="space-y-3">
      <ItemCard v-for="item in items" :key="item.id" :item="item" />
      <p v-if="!items.length" class="text-sm italic" style="color: var(--on-surface-variant);">No hay reuniones agendadas</p>
    </div>
  </div>
</template>

<script setup>
import ItemCard from './ItemCard.vue';

defineProps({
  items: { type: Array, default: () => [] },
});
</script>
