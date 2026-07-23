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

const props = defineProps({
  item: { type: Object, required: true },
});

const categoryColor = computed(() => {
  const map = {
    TASK: 'var(--primary)',
    IDEA: 'var(--secondary)',
    MEETING: 'var(--tertiary)',
  };
  return map[props.item.category] || 'var(--on-surface-variant)';
});

const categoryIcon = computed(() => {
  const icons = {
    TASK: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    IDEA: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>',
    MEETING: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  };
  return icons[props.item.category] || '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
});

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
