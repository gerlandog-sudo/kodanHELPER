<template>
  <div class="kanban-container">
    <div class="flex gap-5 overflow-x-auto pb-4 flex-1 min-h-0 w-full" style="background: transparent;">

      <!-- Inbox Column -->
      <div class="kanban-column-root">
        <div class="flex items-center gap-2 mb-3 px-1 pt-2 select-none">
          <span class="w-2 h-2 rounded-full flex-shrink-0" style="background-color: var(--on-surface-variant);" />
          <span class="font-bold text-xs tracking-wider uppercase truncate" style="color: var(--on-surface);">Por Clasificar</span>
          <span class="text-[11px] font-bold px-2 py-0.5 rounded-full kanban-badge">
            {{ rawInputs.length }}
          </span>
        </div>
        <div class="flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto pb-2 pr-1 scrollbar-thin">
          <template v-if="rawInputs.length === 0 && !isLoadingRaw">
            <div class="kanban-empty">
              <span>Esperando capturas...</span>
            </div>
          </template>
          <template v-else-if="isLoadingRaw">
            <div v-for="n in 3" :key="n" class="kanban-skeleton" />
          </template>
          <template v-else>
            <div
              v-for="raw in rawInputs"
              :key="raw.id"
              class="glass-card p-3 flex items-center gap-3"
            >
              <div class="w-2 h-2 rounded-full animate-pulse" style="background-color: var(--primary);" />
              <div class="flex-1 min-w-0">
                <p class="text-xs truncate" style="color: var(--on-surface);">{{ raw.content_text || 'Audio capturado' }}</p>
                <p class="text-[10px] mt-0.5" style="color: var(--on-surface-variant);">
                  {{ raw.status === 'processing' ? 'Procesando...' : 'Pendiente' }}
                </p>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Category Columns -->
      <div
        v-for="col in categoryColumns"
        :key="col.id"
        class="kanban-column-root"
      >
        <div class="flex items-center gap-2 mb-3 px-1 pt-2 select-none">
          <span class="w-2 h-2 rounded-full flex-shrink-0" :style="{ backgroundColor: col.color }" />
          <span class="font-bold text-xs tracking-wider uppercase truncate" style="color: var(--on-surface);">{{ col.label }}</span>
          <span class="text-[11px] font-bold px-2 py-0.5 rounded-full kanban-badge">{{ getItemsForColumn(col.id).length }}</span>
        </div>

        <div
          ref="dropZoneRefs"
          :data-column="col.id"
          class="flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto pb-2 pr-1 scrollbar-thin"
          :class="{ 'kanban-drop-over': draggedOverColumn === col.id }"
          @dragover.prevent="onDragOver(col.id)"
          @dragleave="onDragLeave(col.id)"
          @drop.prevent="onDrop($event, col.id)"
        >
          <div v-if="getItemsForColumn(col.id).length === 0" class="kanban-empty">
            <span>Arrastra aquí</span>
          </div>

          <div
            v-for="item in getItemsForColumn(col.id)"
            :key="item.id"
            :data-item-id="item.id"
            class="kanban-card-draggable"
            :class="{ 'kanban-card-dragging': draggedItemId === item.id }"
            :draggable="true"
            @dragstart="onDragStart($event, item, col.id)"
            @dragend="onDragEnd"
          >
            <ItemCard :item="item" />
          </div>
        </div>
      </div>

    </div>

    <!-- Confirm Modal -->
    <ConfirmModal
      v-if="pendingMove"
      :item="pendingMove.item"
      :from-category="pendingMove.fromColumn"
      :to-category="pendingMove.toColumn"
      @confirm="confirmMove"
      @cancel="cancelMove"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useItemsStore } from '../stores/items.js';
import { useNotificationsStore } from '../stores/notifications.js';
import { CATEGORIES } from '../config/categories.js';
import ItemCard from './ItemCard.vue';
import ConfirmModal from './ConfirmModal.vue';

const itemsStore = useItemsStore();
const notifications = useNotificationsStore();

// Raw inputs from store
const rawInputs = computed(() => itemsStore.rawInputs || []);
const isLoadingRaw = computed(() => itemsStore.loadingRaw);

// Category columns config
const categoryColumns = CATEGORIES.map(cat => ({
  id: cat.value,
  label: cat.label,
  color: cat.color,
}));

// Drag state
const draggedItemId = ref(null);
const draggedFromColumn = ref(null);
const draggedOverColumn = ref(null);
const pendingMove = ref(null);

function getItemsForColumn(columnId) {
  return itemsStore.items.filter(i => i.category === columnId && (i.status === 'active' || i.status === 'inbox'));
}

function onDragStart(event, item, fromColumn) {
  draggedItemId.value = item.id;
  draggedFromColumn.value = fromColumn;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', JSON.stringify({ id: item.id, fromColumn }));
}

function onDragEnd() {
  draggedItemId.value = null;
  draggedFromColumn.value = null;
  draggedOverColumn.value = null;
}

function onDragOver(columnId) {
  draggedOverColumn.value = columnId;
}

function onDragLeave(columnId) {
  if (draggedOverColumn.value === columnId) {
    draggedOverColumn.value = null;
  }
}

async function onDrop(event, toColumn) {
  draggedOverColumn.value = null;
  draggedItemId.value = null;

  const fromColumn = draggedFromColumn.value;

  if (!fromColumn || fromColumn === toColumn) {
    // Same column — no action
    return;
  }

  const itemId = event.dataTransfer.getData('text/plain');
  if (!itemId) return;

  let parsed;
  try { parsed = JSON.parse(itemId); } catch { return; }

  const item = itemsStore.items.find(i => i.id === parsed.id);
  if (!item) return;

  // Show confirmation modal
  pendingMove.value = {
    item,
    fromColumn: fromColumn,
    toColumn: toColumn,
  };
}

async function confirmMove({ metadata }) {
  if (!pendingMove.value) return;

  const { item, fromColumn, toColumn } = pendingMove.value;

  try {
    await itemsStore.moveItem(item.id, toColumn, metadata);
    notifications.showItemMoved(fromColumn, toColumn);
  } catch (err) {
    notifications.showError(`Error al mover: ${err.message}`);
  } finally {
    pendingMove.value = null;
  }
}

function cancelMove() {
  pendingMove.value = null;
}
</script>

<style scoped>
.kanban-container {
  display: flex;
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow: hidden;
}

.kanban-column-root {
  display: flex;
  flex-direction: column;
  min-width: 280px;
  width: 280px;
  flex-shrink: 0;
  background: transparent;
}

.kanban-badge {
  background-color: color-mix(in srgb, var(--on-surface-variant) 12%, transparent);
  color: var(--on-surface-variant);
  border: 1px solid color-mix(in srgb, var(--outline-variant) 50%, transparent);
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

.kanban-card-draggable {
  cursor: grab;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.kanban-card-draggable:active {
  cursor: grabbing;
}

.kanban-card-dragging {
  opacity: 0.4;
  transform: rotate(2deg) scale(0.95);
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
