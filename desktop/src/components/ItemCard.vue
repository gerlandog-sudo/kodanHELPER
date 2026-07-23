<template>
  <div class="glass-card p-4 hover-lift cursor-pointer">
    <div class="flex items-start justify-between mb-2">
      <span class="text-xs font-medium px-2 py-0.5 rounded"
        :style="{ backgroundColor: categoryColor + '20', color: categoryColor }">
        {{ item.category }}
      </span>
      <span class="text-xs" style="color: var(--on-surface-variant);">
        {{ formatDate(item.created_at) }}
      </span>
    </div>
    <h3 class="text-sm font-semibold mb-1" style="color: var(--on-surface);">{{ item.title }}</h3>
    <p v-if="item.summary" class="text-xs line-clamp-2" style="color: var(--on-surface-variant);">{{ item.summary }}</p>
    <div v-if="item.metadata?.tags?.length" class="flex flex-wrap gap-1 mt-2">
      <span v-for="tag in item.metadata.tags" :key="tag"
        class="text-xs px-1.5 py-0.5 rounded"
        style="background-color: var(--surface-container-high); color: var(--on-surface-variant);">
        #{{ tag }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { format, parseISO } from 'date-fns';
import { getCategoryColor } from '../config/categories.js';

const props = defineProps({
  item: { type: Object, required: true },
});

const categoryColor = getCategoryColor(props.item.category);

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), 'dd MMM HH:mm');
  } catch {
    return dateStr;
  }
}
</script>
