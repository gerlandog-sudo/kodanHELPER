<template>
  <div class="flex items-center gap-2 mb-3 px-1 pt-2 select-none">
    <div class="flex items-center gap-2 min-w-0">
      <span
        v-if="dotColor"
        class="w-2 h-2 rounded-full flex-shrink-0"
        :style="{ backgroundColor: dotColor }"
      />
      <span class="font-bold text-xs tracking-wider uppercase truncate" style="color: var(--on-surface);">
        {{ label }}
      </span>
      <span
        class="text-[11px] font-bold px-2 py-0.5 rounded-full"
        :class="isOver ? 'kanban-badge-active' : 'kanban-badge'"
      >
        {{ count }}
      </span>
    </div>
    <slot name="header-extra" />
  </div>

  <div
    ref="dropZoneRef"
    class="flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto pb-2 pr-1 scrollbar-thin"
    :class="{ 'kanban-drop-over': isOver }"
  >
    <template v-if="loading">
      <div v-for="n in 3" :key="n" class="kanban-skeleton" />
    </template>

    <template v-else-if="items.length === 0">
      <div class="kanban-empty">
        <span v-if="emptyText">{{ emptyText }}</span>
        <span v-else>Arrastra aquí</span>
      </div>
    </template>

    <template v-else>
      <div v-for="item in items" :key="item.id" class="kanban-card-wrapper">
        <slot name="item" :item="item" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  label: { type: String, required: true },
  count: { type: Number, default: 0 },
  dotColor: { type: String, default: null },
  isOver: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: null },
});

const dropZoneRef = ref(null);

defineExpose({ dropZoneRef });
</script>

<style scoped>
.kanban-badge {
  background-color: color-mix(in srgb, var(--on-surface-variant) 12%, transparent);
  color: var(--on-surface-variant);
  border: 1px solid color-mix(in srgb, var(--outline-variant) 50%, transparent);
}

.kanban-badge-active {
  background-color: color-mix(in srgb, var(--primary) 15%, transparent);
  color: var(--primary);
  border: 1px solid color-mix(in srgb, var(--primary) 30%, transparent);
}

.kanban-drop-over {
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--primary) 5%, transparent);
  transition: background-color 0.2s ease;
}

.kanban-empty {
  height: 6rem;
  border-radius: 0.5rem;
  border: 1px dashed var(--outline-variant);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--on-surface-variant);
  user-select: none;
  background: color-mix(in srgb, var(--surface) 60%, transparent);
}

.kanban-skeleton {
  height: 4.5rem;
  border-radius: 0.5rem;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--on-surface-variant) 6%, transparent) 25%,
    color-mix(in srgb, var(--on-surface-variant) 15%, transparent) 50%,
    color-mix(in srgb, var(--on-surface-variant) 6%, transparent) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.kanban-card-wrapper {
  transition: transform 0.15s ease;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--on-surface-variant) 20%, transparent);
  border-radius: 2px;
}
</style>
