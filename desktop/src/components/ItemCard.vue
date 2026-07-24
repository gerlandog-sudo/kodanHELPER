<template>
  <div class="glass-card p-4 hover-lift cursor-pointer group">
    <!-- Línea 1: Categoría + Fecha -->
    <div class="flex items-start justify-between mb-2">
      <span class="text-xs font-medium px-2 py-0.5 rounded"
        :style="{ backgroundColor: categoryColor + '20', color: categoryColor }">
        {{ item.category }}
      </span>
      <span class="text-xs" style="color: var(--on-surface-variant);">
        {{ formatDate(item.created_at) }}
      </span>
    </div>

    <!-- Línea 2: Título -->
    <h3 class="text-sm font-semibold mb-1" style="color: var(--on-surface);">{{ item.title }}</h3>

    <!-- Línea 3: Resumen -->
    <p v-if="item.summary" class="text-xs line-clamp-2 mb-2" style="color: var(--on-surface-variant);">{{ item.summary }}</p>

    <!-- Línea 4: Metadata específica por categoría -->
    <div v-if="hasMetadata" class="space-y-1 mb-2">
      <!-- Tarea: prioridad + deadline -->
      <template v-if="item.category === 'Tarea'">
        <div v-if="item.metadata.priority" class="flex items-center gap-1.5 text-xs">
          <span class="font-medium" style="color: var(--on-surface-variant);">Prioridad:</span>
          <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
            :style="getPriorityStyle(item.metadata.priority)">
            {{ item.metadata.priority }}
          </span>
        </div>
        <div v-if="item.metadata.deadline" class="flex items-center gap-1.5 text-xs" style="color: var(--on-surface-variant);">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>{{ formatDate(item.metadata.deadline) }}</span>
        </div>
      </template>

      <!-- Reunión: participantes + fecha -->
      <template v-if="item.category === 'Reunion'">
        <div v-if="item.metadata.participants?.length" class="flex items-center gap-1.5 text-xs" style="color: var(--on-surface-variant);">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span>{{ item.metadata.participants.join(', ') }}</span>
        </div>
        <div v-if="item.metadata.proposed_date" class="flex items-center gap-1.5 text-xs" style="color: var(--on-surface-variant);">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>{{ formatDate(item.metadata.proposed_date) }}</span>
        </div>
      </template>

      <!-- Llamar: contacto + teléfono -->
      <template v-if="item.category === 'Llamar'">
        <div v-if="item.metadata.contact_name" class="flex items-center gap-1.5 text-xs" style="color: var(--on-surface-variant);">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span class="font-medium" style="color: var(--on-surface);">{{ item.metadata.contact_name }}</span>
        </div>
        <div v-if="item.metadata.phone" class="flex items-center gap-1.5 text-xs" style="color: var(--on-surface-variant);">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <span>{{ item.metadata.phone }}</span>
        </div>
        <div v-if="item.metadata.deadline" class="flex items-center gap-1.5 text-xs" style="color: var(--on-surface-variant);">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>Antes del {{ formatDate(item.metadata.deadline) }}</span>
        </div>
      </template>

      <!-- Email: destinatario + asunto -->
      <template v-if="item.category === 'Email'">
        <div v-if="item.metadata.recipient" class="flex items-center gap-1.5 text-xs" style="color: var(--on-surface-variant);">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          <span>{{ item.metadata.recipient }}</span>
        </div>
        <div v-if="item.metadata.subject" class="flex items-center gap-1.5 text-xs" style="color: var(--on-surface-variant);">
          <span class="font-medium">Asunto:</span>
          <span>{{ item.metadata.subject }}</span>
        </div>
      </template>

      <!-- Recordatorio: fecha de alerta -->
      <template v-if="item.category === 'Recordatorio'">
        <div v-if="item.metadata.alert_at" class="flex items-center gap-1.5 text-xs" style="color: var(--on-surface-variant);">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span>{{ formatDate(item.metadata.alert_at) }}</span>
          <span v-if="item.metadata.recurrence" class="text-[10px] px-1.5 py-0.5 rounded" style="background-color: var(--surface-container-high);">
            {{ recurrenceLabel(item.metadata.recurrence) }}
          </span>
        </div>
      </template>

      <!-- Investigar: URL -->
      <template v-if="item.category === 'Investigar'">
        <div v-if="item.metadata.source_url" class="flex items-center gap-1.5 text-xs">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          <span class="truncate max-w-[200px]" style="color: var(--primary);">{{ item.metadata.source_url }}</span>
        </div>
      </template>

      <!-- Idea: área -->
      <template v-if="item.category === 'Idea'">
        <div v-if="item.metadata.area" class="flex items-center gap-1.5 text-xs" style="color: var(--on-surface-variant);">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          <span>{{ item.metadata.area }}</span>
        </div>
      </template>
    </div>

    <!-- Línea 5: Tags -->
    <div v-if="item.metadata?.tags?.length" class="flex flex-wrap gap-1">
      <span v-for="tag in item.metadata.tags" :key="tag"
        class="text-xs px-1.5 py-0.5 rounded"
        style="background-color: var(--surface-container-high); color: var(--on-surface-variant);">
        #{{ tag }}
      </span>
    </div>

    <!-- Línea 6: Acciones (hover) -->
    <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2 mt-3 pt-3 border-t"
      style="border-color: var(--outline-variant);">
      <button @click.stop="emit('edit')" class="text-xs px-2 py-1 rounded flex items-center gap-1"
        style="background-color: var(--surface-container-high); color: var(--on-surface-variant);">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        Editar
      </button>
      <button @click.stop="emit('delete')" class="text-xs px-2 py-1 rounded flex items-center gap-1"
        style="background-color: var(--surface-container-high); color: var(--error);">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        Eliminar
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { format, parseISO } from 'date-fns';
import { getCategoryColor } from '../config/categories.js';

const props = defineProps({
  item: { type: Object, required: true },
});

const emit = defineEmits(['edit', 'delete']);

const categoryColor = getCategoryColor(props.item.category);

const hasMetadata = computed(() => {
  return props.item.metadata && Object.keys(props.item.metadata).length > 0;
});

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), 'dd MMM HH:mm');
  } catch {
    return dateStr;
  }
}

function getPriorityStyle(priority) {
  const map = {
    high: { backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    medium: { backgroundColor: 'rgba(234,179,8,0.15)', color: '#eab308' },
    low: { backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e' },
  };
  return map[priority] || map.medium;
}

function recurrenceLabel(value) {
  const map = { once: 'Única', daily: 'Diaria', weekly: 'Semanal' };
  return map[value] || value;
}
</script>
