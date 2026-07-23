<template>
  <div class="px-4 pt-4">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold" style="font-family: var(--font-headline); color: var(--on-background);">Inbox</h1>
      <span class="text-xs font-mono" style="color: var(--on-surface-variant); letter-spacing: 0.05em;">
        {{ store.inboxCount }} pendientes
      </span>
    </div>

    <!-- Filter chips -->
    <div class="flex gap-2 mb-5 overflow-x-auto pb-1" style="-webkit-overflow-scrolling: touch;">
      <button v-for="f in filters" :key="f.value"
        @click="store.setFilter(f.value)"
        class="sub-tab px-4 py-1.5 text-xs font-medium whitespace-nowrap"
        :class="store.filter === f.value ? 'active' : ''"
        :style="store.filter !== f.value ? { backgroundColor: 'var(--surface-container-high)', color: 'var(--on-surface-variant)' } : {}">
        {{ f.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="space-y-3">
      <div v-for="n in 4" :key="n" class="h-20 shimmer rounded-lg"></div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!store.filteredItems.length" class="flex flex-col items-center justify-center pt-16">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--on-surface-variant); opacity: 0.4;">
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
      </svg>
      <p class="mt-4 text-sm" style="color: var(--on-surface-variant);">Todo vacio. Captura algo!</p>
    </div>

    <!-- Items list -->
    <div v-else class="space-y-3 pb-4 stagger-enter">
      <ItemCard v-for="item in store.filteredItems" :key="item.id" :item="item" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useItemsStore } from '../stores/items.js';
import ItemCard from '../components/ItemCard.vue';
import { CATEGORIES } from '../config/categories.js';

const store = useItemsStore();

const filters = [
  { label: 'Todo', value: 'ALL' },
  ...CATEGORIES.map(c => ({ label: c.label, value: c.value })),
];

onMounted(async () => {
  await store.loadItems();
  store.startRealtime();
});

onUnmounted(() => {
  store.stopRealtime();
});
</script>
