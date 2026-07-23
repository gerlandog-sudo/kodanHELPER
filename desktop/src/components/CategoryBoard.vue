<template>
  <div>
    <div class="flex items-center gap-2 mb-4">
      <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: color }"></div>
      <h2 class="text-lg font-semibold" style="color: var(--on-background);">{{ title }}</h2>
      <span class="text-xs font-mono px-1.5 py-0.5 rounded" style="background-color: var(--surface-container-high); color: var(--on-surface-variant);">
        {{ items.length }}
      </span>
    </div>
    <div :class="layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-3'">
      <ItemCard v-for="item in items" :key="item.id" :item="item" />
      <p v-if="!items.length" class="text-sm italic" :class="layout === 'grid' ? 'col-span-full' : ''" style="color: var(--on-surface-variant);">
        {{ emptyMessage }}
      </p>
    </div>
  </div>
</template>

<script setup>
import ItemCard from './ItemCard.vue';

defineProps({
  title: { type: String, required: true },
  items: { type: Array, default: () => [] },
  emptyMessage: { type: String, default: 'Sin elementos' },
  color: { type: String, default: 'var(--on-surface-variant)' },
  layout: { type: String, default: 'list', validator: v => ['list', 'grid'].includes(v) },
});
</script>
