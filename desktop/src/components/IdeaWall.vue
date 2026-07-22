<template>
  <div>
    <h2 class="text-lg font-semibold text-white mb-4">Ideas</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <ItemCard v-for="item in items" :key="item.id" :item="item" />
      <p v-if="!items.length" class="text-sm text-slate-500 italic col-span-full">Sin ideas registradas</p>
    </div>
  </div>
</template>

<script setup>
import ItemCard from './ItemCard.vue';

defineProps({
  items: { type: Array, default: () => [] },
});
</script>
