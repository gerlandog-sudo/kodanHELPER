<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold text-white mb-8">Inbox</h1>
    <div class="space-y-3 max-w-2xl">
      <ItemCard v-for="item in store.items" :key="item.id" :item="item" />
      <p v-if="!store.items.length && !store.loading" class="text-sm text-slate-500 italic">
        No hay elementos. Graba algo desde tu movil!
      </p>
      <p v-if="store.loading" class="text-sm text-slate-500 italic">Cargando...</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useItemsStore } from '../stores/items.js';
import ItemCard from '../components/ItemCard.vue';

const store = useItemsStore();

onMounted(async () => {
  await store.loadItems();
});
</script>
