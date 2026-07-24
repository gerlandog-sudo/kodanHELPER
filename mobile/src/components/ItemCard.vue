<template>
  <div
    class="glass-card p-4 hover-lift"
    :class="{ 'opacity-60': isPressed }"
    @click="handleTap"
    @touchstart.passive="handleTouchStart"
    @touchend="handleTouchEnd"
    @touchmove="handleTouchMove"
  >
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

        <!-- Metadata compacto -->
        <div v-if="hasMetadata" class="flex flex-wrap gap-1 mt-1.5">
          <!-- Prioridad (Tarea) -->
          <span v-if="item.metadata.priority"
            class="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase"
            :style="getPriorityStyle(item.metadata.priority)">
            {{ item.metadata.priority }}
          </span>

          <!-- Deadline -->
          <span v-if="item.metadata.deadline"
            class="text-[10px] px-1.5 py-0.5 rounded" style="background-color: var(--surface-container-high); color: var(--on-surface-variant);">
            {{ formatDateShort(item.metadata.deadline) }}
          </span>

          <!-- Participantes -->
          <span v-if="item.metadata.participants?.length"
            class="text-[10px] px-1.5 py-0.5 rounded" style="background-color: var(--surface-container-high); color: var(--on-surface-variant);">
            {{ item.metadata.participants.length }} participantes
          </span>

          <!-- Contacto -->
          <span v-if="item.metadata.contact_name"
            class="text-[10px] px-1.5 py-0.5 rounded" style="background-color: var(--surface-container-high); color: var(--on-surface-variant);">
            {{ item.metadata.contact_name }}
          </span>

          <!-- Tags -->
          <span v-for="tag in (item.metadata.tags || []).slice(0, 2)" :key="tag"
            class="text-[10px] px-1.5 py-0.5 rounded" style="background-color: var(--surface-container-high); color: var(--on-surface-variant);">
            #{{ tag }}
          </span>
          <span v-if="item.metadata.tags?.length > 2"
            class="text-[10px] px-1.5 py-0.5 rounded" style="background-color: var(--surface-container-high); color: var(--on-surface-variant);">
            +{{ item.metadata.tags.length - 2 }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { format, parseISO } from 'date-fns';
import { getCategoryColor, getCategoryIcon } from '../config/categories.js';

const props = defineProps({
  item: { type: Object, required: true },
});

const emit = defineEmits(['edit', 'quick-action']);

const isPressed = ref(false);
const touchStartTime = ref(0);
const touchStartPos = ref({ x: 0, y: 0 });
const LONG_PRESS_DURATION = 500;
const touchMoved = ref(false);

const categoryColor = computed(() => getCategoryColor(props.item.category));
const categoryIcon = computed(() => getCategoryIcon(props.item.category));

const hasMetadata = computed(() => {
  return props.item.metadata && Object.keys(props.item.metadata).length > 0;
});

function handleTap() {
  emit('edit', props.item);
}

function handleTouchStart(event) {
  isPressed.value = true;
  touchMoved.value = false;
  touchStartTime.value = Date.now();
  touchStartPos.value = {
    x: event.touches[0].clientX,
    y: event.touches[0].clientY,
  };
}

function handleTouchEnd() {
  isPressed.value = false;
  const duration = Date.now() - touchStartTime.value;

  if (!touchMoved.value && duration >= LONG_PRESS_DURATION) {
    emit('quick-action', props.item);
  }
}

function handleTouchMove(event) {
  const moveX = Math.abs(event.touches[0].clientX - touchStartPos.value.x);
  const moveY = Math.abs(event.touches[0].clientY - touchStartPos.value.y);
  if (moveX > 10 || moveY > 10) {
    touchMoved.value = true;
    isPressed.value = false;
  }
}

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

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), 'dd/MM');
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
</script>
