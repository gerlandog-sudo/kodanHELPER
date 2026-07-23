<template>
  <div class="glass-card p-4 hover-lift">
    <div class="flex items-start gap-3">
      <!-- Category icon -->
      <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        :style="{ backgroundColor: categoryColor + '20', color: categoryColor }"
        v-html="categoryIcon">
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="category-badge" :style="{ backgroundColor: categoryColor + '18', color: categoryColor }">
            {{ item.category || 'SIN CAT' }}
          </span>
          <span class="text-xs" style="color: var(--on-surface-variant);">{{ formatDate(item.created_at) }}</span>
        </div>
        <h3 class="text-sm font-semibold leading-snug" style="color: var(--on-surface);">{{ item.title }}</h3>
        <p v-if="item.summary" class="text-xs mt-1 line-clamp-2" style="color: var(--on-surface-variant);">{{ item.summary }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { format, parseISO } from 'date-fns';
import { getCategoryColor, getCategoryIcon } from '../config/categories.js';

const props = defineProps({
  item: { type: Object, required: true },
});

const categoryColor = computed(() => getCategoryColor(props.item.category));
const categoryIcon = computed(() => getCategoryIcon(props.item.category));

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = parseISO(dateStr);
    const now = new Date();
    const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (isToday) return format(d, 'HH:mm');
    return format(d, 'dd MMM');
  } catch {
    return dateStr;
  }
}
</script>
