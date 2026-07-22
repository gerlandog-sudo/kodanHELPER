<template>
  <div class="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-blue-500/50 transition-colors">
    <div class="flex items-start justify-between mb-2">
      <span class="text-xs font-medium px-2 py-0.5 rounded-full"
        :class="categoryClass">
        {{ item.category }}
      </span>
      <span class="text-xs text-slate-500">
        {{ formatDate(item.created_at) }}
      </span>
    </div>
    <h3 class="text-sm font-semibold text-white mb-1">{{ item.title }}</h3>
    <p v-if="item.summary" class="text-xs text-slate-400 line-clamp-2">{{ item.summary }}</p>
    <div v-if="item.metadata?.tags?.length" class="flex flex-wrap gap-1 mt-2">
      <span v-for="tag in item.metadata.tags" :key="tag"
        class="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
        #{{ tag }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { format, parseISO } from 'date-fns';

const props = defineProps({
  item: { type: Object, required: true },
});

const categoryClass = {
  TASK: 'bg-blue-900/50 text-blue-300',
  IDEA: 'bg-purple-900/50 text-purple-300',
  MEETING: 'bg-green-900/50 text-green-300',
  UNCATEGORIZED: 'bg-slate-700 text-slate-400',
}[props.item.category] || 'bg-slate-700 text-slate-400';

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), 'dd MMM HH:mm');
  } catch {
    return dateStr;
  }
}
</script>
