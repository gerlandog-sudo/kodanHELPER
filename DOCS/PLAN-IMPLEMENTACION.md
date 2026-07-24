# Plan de Implementación: kodanHELPER - Fase de Expansión

**Fecha**: 24 de julio de 2026  
**Versión**: 1.0  
**Propósito**: Plan detallado para implementar las mejoras de UX Core, Kanban, Toasts, y Mobile

---

## Resumen Ejecutivo

Este plan aborda 5 áreas principales de mejora:

1. **Agregar categoría Email** (8 categorías en total)
2. **Sistema de Toast unificado** (Desktop & Mobile) usando `sonner`
3. **Kanban Desktop completo** con drag & drop y confirmación
4. **Gestos Mobile** (long press, bottom sheet, edición rápida)
5. **Flujo de texto por IA** (cuando no se selecciona categoría manual)

---

## Fase 1: Base de Datos - Agregar Categoría Email

**Objetivo**: Agregar `Email` como 8va categoría en el sistema.

**Archivos a modificar**:
- `scripts/setup-supabase.mjs` (actualizar CHECK constraint)
- `worker/src/config/categories.js` (agregar Email)
- `desktop/src/config/categories.js` (agregar Email)
- `mobile/src/config/categories.js` (agregar Email)

**Tareas**:

### 1.1 Actualizar constraint de DB
```sql
-- Migración: Agregar 'Email' al CHECK de items.category
ALTER TABLE public.items DROP CONSTRAINT IF EXISTS items_category_check;
ALTER TABLE public.items ADD CONSTRAINT items_category_check 
  CHECK (category IN ('Tarea', 'Idea', 'Reunion', 'Recordatorio', 'Nota', 'Investigar', 'Llamar', 'Email'));
```

### 1.2 Actualizar CATEGORIES en worker
```javascript
// worker/src/config/categories.js
{
  value: 'Email',
  description: 'Redacción y envío de correos electrónicos.',
  rule: 'extraer destinatario, asunto y cuerpo del mensaje',
}
```

### 1.3 Actualizar CATEGORIES en desktop
```javascript
// desktop/src/config/categories.js
{ value: 'Email', label: 'Email', color: '#3498db' }
```

### 1.4 Actualizar CATEGORIES en mobile
```javascript
// mobile/src/config/categories.js
{ value: 'Email', label: 'Email', color: '#3498db' }
```

**Criterios de aceptación**:
- [ ] DB acepta `Email` como categoría válida
- [ ] Worker clasifica emails correctamente
- [ ] Desktop muestra columna "Email" en Dashboard
- [ ] Mobile muestra filtro "Email" en Home

---

## Fase 2: Worker IA - Taxonomía Detallada

**Objetivo**: Instruir a la IA para extraer campos específicos según la categoría.

**Archivos a modificar**:
- `worker/src/config/categories.js` (actualizar reglas de extracción)
- `worker/src/prompts/classifier.js` (actualizar prompt)

**Tareas**:

### 2.1 Actualizar reglas de extracción por categoría

```javascript
// worker/src/config/categories.js
export const CATEGORIES = [
  {
    value: 'Tarea',
    description: 'Acciones ejecutables inmediatas o pendientes de trabajo.',
    rule: 'extraer: priority (high/medium/low), deadline (YYYY-MM-DD o null)',
    metadataSchema: {
      priority: 'high | medium | low',
      deadline: 'YYYY-MM-DD | null',
    },
  },
  {
    value: 'Idea',
    description: 'Conceptos, proyectos o hallazgos creativos.',
    rule: 'extraer: area (proyecto/área), next_steps (acción inicial)',
    metadataSchema: {
      area: 'string',
      next_steps: 'string',
    },
  },
  {
    value: 'Reunion',
    description: 'Coordinación, agendamiento y minutas.',
    rule: 'extraer: participants (array), proposed_date (YYYY-MM-DDTHH:MM:SSZ)',
    metadataSchema: {
      participants: ['string'],
      proposed_date: 'ISO8601 | null',
    },
  },
  {
    value: 'Recordatorio',
    description: 'Avisos o alertas en momentos puntuales.',
    rule: 'extraer: description, alert_at (ISO8601), recurrence (once/daily/weekly)',
    metadataSchema: {
      description: 'string',
      alert_at: 'ISO8601',
      recurrence: 'once | daily | weekly',
    },
  },
  {
    value: 'Nota',
    description: 'Información pasiva, apuntes o referencias.',
    rule: 'extraer: body (detalle), tags (array de palabras clave)',
    metadataSchema: {
      body: 'string',
      tags: ['string'],
    },
  },
  {
    value: 'Investigar',
    description: 'Dudas, temas a consultar o bookmarks.',
    rule: 'extraer: source_url, success_criteria (respuesta buscada)',
    metadataSchema: {
      source_url: 'string | null',
      success_criteria: 'string',
    },
  },
  {
    value: 'Llamar',
    description: 'Contactos pendientes de comunicación.',
    rule: 'extraer: contact_name, phone, objective, deadline',
    metadataSchema: {
      contact_name: 'string',
      phone: 'string',
      objective: 'string',
      deadline: 'YYYY-MM-DD | null',
    },
  },
  {
    value: 'Email',
    description: 'Redacción y envío de correos.',
    rule: 'extraer: recipient, subject, body',
    metadataSchema: {
      recipient: 'string',
      subject: 'string',
      body: 'string',
    },
  },
];
```

### 2.2 Actualizar prompt del clasificador

```javascript
// worker/src/prompts/classifier.js
export function buildClassifierPrompt() {
  const categoryLines = CATEGORIES
    .map((c, i) => `${i + 1}. "${c.value}": ${c.description}`)
    .join('\n');

  const categoryUnion = CATEGORIES.map(c => `"${c.value}"`).join(' | ');

  const rules = CATEGORIES
    .filter(c => c.rule)
    .map(c => `- Para "${c.value}": ${c.rule}`)
    .join('\n');

  return `Eres un asistente ejecutivo de IA. Tu trabajo es analizar notas de audio/texto del usuario y clasificarlas estrictamente en una de estas categorías:

### CATEGORÍAS PERMITIDAS:
${categoryLines}

Devuelve SIEMPRE un objeto JSON válido. No incluyas texto adicional fuera del JSON.

ESQUEMA DE SALIDA:
{
  "category": ${categoryUnion},
  "title": "Título conciso (máx 8-10 palabras)",
  "summary": "Resumen o cuerpo principal de la nota (1-3 oraciones)",
  "metadata": {
    // Campos específicos según la categoría (ver REGLAS ESPECÍFICAS)
  }
}

REGLAS DE CLASIFICACIÓN:
- Si incluye una acción concreta ("hacer", "enviar", "programar", "llamar", "revisar") -> Priorizar "Tarea"
- Si es una acción pero tiene un horario o fecha explícita ("a las 15hs", "mañana a la mañana", "el lunes") -> Priorizar "Recordatorio" o "Reunion"
- Si menciona un correo electrónico o redacción de mensaje -> Priorizar "Email"
- Si no encaja con ninguna categoría clara de acción -> Usar "Nota" como fallback por defecto

REGLAS ESPECÍFICAS POR CATEGORÍA:
${rules}

REGLAS GENERALES:
- Los tags deben ser relevantes y consistentes (ej: "trabajo", "personal", "salud", "proyecto-x")
- Si no hay participantes, due_date, etc., devolver null o [] según corresponda
- Extraer la mayor cantidad de información estructurada posible según el schema de cada categoría`;
}
```

**Criterios de aceptación**:
- [ ] Worker extrae metadata específica por categoría
- [ ] Tests del clasificador pasan con ejemplos de cada categoría
- [ ] Metadata se guarda correctamente en DB (JSONB)

---

## Fase 3: Desktop - Sistema de Toast (sonner)

**Objetivo**: Implementar sistema de notificaciones toast unificado usando `sonner/vue`.

**Archivos a crear/modificar**:
- `desktop/package.json` (agregar dependencia `sonner`)
- `desktop/src/components/AppToast.vue` (nuevo)
- `desktop/src/App.vue` (montar `<AppToast />`)
- `desktop/src/stores/notifications.js` (nuevo, store de notificaciones)
- `desktop/src/services/realtime.js` (emitir toasts en eventos)

**Tareas**:

### 3.1 Instalar dependencia

```bash
cd desktop
npm install sonner
```

### 3.2 Crear componente AppToast

```vue
<!-- desktop/src/components/AppToast.vue -->
<script setup>
import { Toaster } from 'sonner/vue';
</script>

<template>
  <Toaster 
    richColors 
    position="top-right"
    :toastOptions="{
      style: {
        fontFamily: 'var(--font-body)',
        fontSize: '0.875rem',
      },
    }"
  />
</template>
```

### 3.3 Montar AppToast en App.vue

```vue
<!-- desktop/src/App.vue -->
<template>
  <div class="min-h-screen flex">
    <!-- Sidebar -->
    <aside v-if="isLoggedIn">...</aside>
    
    <!-- Main Content -->
    <main class="flex-1 overflow-auto">
      <router-view />
    </main>
    
    <!-- Toast notifications -->
    <AppToast />
  </div>
</template>

<script setup>
import AppToast from './components/AppToast.vue';
// ... resto del código
</script>
```

### 3.4 Crear store de notificaciones

```javascript
// desktop/src/stores/notifications.js
import { defineStore } from 'pinia';
import { toast } from 'sonner/vue';

export const useNotificationsStore = defineStore('notifications', () => {
  function showCaptureReceived() {
    toast('Captura recibida...', { duration: 2000 });
  }
  
  function showProcessing() {
    toast('Procesando con IA...', { duration: 2000 });
  }
  
  function showClassified(category) {
    toast.success(`Clasificado como ${category}`, { duration: 3000 });
  }
  
  function showError(message) {
    toast.error(message, { duration: 4000 });
  }
  
  function showItemMoved(fromCategory, toCategory) {
    toast.success(`Movido de ${fromCategory} a ${toCategory}`, { duration: 2500 });
  }
  
  return {
    showCaptureReceived,
    showProcessing,
    showClassified,
    showError,
    showItemMoved,
  };
});
```

### 3.5 Integrar con Realtime

```javascript
// desktop/src/services/realtime.js
import { supabase } from './api.js';
import { useNotificationsStore } from '../stores/notifications.js';

export function subscribeToItems(callback) {
  const notifications = useNotificationsStore();
  
  const channel = supabase
    .channel('desktop-items')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'items' }, (payload) => {
      notifications.showClassified(payload.new.category);
      callback('insert', payload.new);
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'items' }, (payload) => {
      callback('update', payload.new);
    })
    .subscribe();
  
  return () => { supabase.removeChannel(channel); };
}

export function subscribeToRawInputs(callback) {
  const notifications = useNotificationsStore();
  
  const channel = supabase
    .channel('desktop-raw-inputs')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'raw_inputs' }, (payload) => {
      notifications.showCaptureReceived();
      callback('insert', payload.new);
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'raw_inputs' }, (payload) => {
      if (payload.new.status === 'processing') {
        notifications.showProcessing();
      } else if (payload.new.status === 'failed') {
        notifications.showError(payload.new.error_message || 'Error al procesar');
      }
      callback('update', payload.new);
    })
    .subscribe();
  
  return () => { supabase.removeChannel(channel); };
}
```

**Criterios de aceptación**:
- [ ] Toasts aparecen en esquina superior derecha
- [ ] Toasts tienen colores según tipo (success, error, info)
- [ ] Toasts se auto-ocultan después de 3-4 segundos
- [ ] Realtime emite toasts al clasificar items
- [ ] Realtime emite toasts al recibir capturas

---

## Fase 4: Desktop - Kanban Completo con Drag & Drop

**Objetivo**: Implementar Kanban con 9 columnas (Inbox + 8 categorías) y drag & drop con confirmación.

**Archivos a crear/modificar**:
- `desktop/package.json` (agregar dependencia `vue-draggable-plus`)
- `desktop/src/components/KanbanBoard.vue` (reescribir completo)
- `desktop/src/components/KanbanColumn.vue` (nuevo)
- `desktop/src/components/ConfirmModal.vue` (nuevo)
- `desktop/src/components/ItemCard.vue` (mejorar con draggable)
- `desktop/src/views/DashboardView.vue` (usar nuevo KanbanBoard)
- `desktop/src/stores/items.js` (agregar método `moveItem`)

**Tareas**:

### 4.1 Instalar dependencia

```bash
cd desktop
npm install vue-draggable-plus
```

### 4.2 Reescribir KanbanBoard.vue

```vue
<!-- desktop/src/components/KanbanBoard.vue -->
<template>
  <div class="kanban-board flex gap-4 overflow-x-auto pb-4">
    <KanbanColumn
      v-for="column in columns"
      :key="column.id"
      :column="column"
      :items="getItemsForColumn(column.id)"
      @drop="handleDrop"
    />
    
    <ConfirmModal
      v-if="pendingMove"
      :item="pendingMove.item"
      :from-category="pendingMove.fromCategory"
      :to-category="pendingMove.toCategory"
      @confirm="confirmMove"
      @cancel="cancelMove"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import KanbanColumn from './KanbanColumn.vue';
import ConfirmModal from './ConfirmModal.vue';
import { useItemsStore } from '../stores/items.js';
import { useNotificationsStore } from '../stores/notifications.js';
import { CATEGORIES } from '../config/categories.js';

const itemsStore = useItemsStore();
const notifications = useNotificationsStore();

const pendingMove = ref(null);

// 9 columnas: Inbox + 8 categorías
const columns = computed(() => [
  { id: 'inbox', label: 'Por Clasificar', color: 'var(--on-surface-variant)', isRaw: true },
  ...CATEGORIES.map(cat => ({
    id: cat.value,
    label: cat.label,
    color: cat.color,
    isRaw: false,
  })),
]);

function getItemsForColumn(columnId) {
  if (columnId === 'inbox') {
    // Mostrar raw_inputs pendientes
    return itemsStore.rawInputs || [];
  }
  return itemsStore.items.filter(i => i.category === columnId && i.status === 'active');
}

function handleDrop({ itemId, fromColumnId, toColumnId }) {
  const item = itemsStore.items.find(i => i.id === itemId);
  if (!item) return;
  
  // Abrir modal de confirmación
  pendingMove.value = {
    item,
    fromCategory: fromColumnId,
    toCategory: toColumnId,
  };
}

async function confirmMove({ metadata }) {
  if (!pendingMove.value) return;
  
  const { item, toCategory } = pendingMove.value;
  
  try {
    await itemsStore.moveItem(item.id, toCategory, metadata);
    notifications.showItemMoved(pendingMove.value.fromCategory, toCategory);
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
```

### 4.3 Crear KanbanColumn.vue

```vue
<!-- desktop/src/components/KanbanColumn.vue -->
<template>
  <div class="kanban-column flex flex-col min-w-[280px] w-[280px] flex-shrink-0">
    <!-- Header -->
    <div class="sticky top-0 z-10 flex items-center justify-between pb-3 px-1 pt-3"
      :style="{ background: 'var(--background)' }">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: column.color }"></span>
        <span class="font-bold text-xs tracking-wider uppercase" style="color: var(--on-surface);">
          {{ column.label }}
        </span>
        <span class="text-xs font-mono px-1.5 py-0.5 rounded"
          style="background-color: var(--surface-container-high); color: var(--on-surface-variant);">
          {{ items.length }}
        </span>
      </div>
    </div>
    
    <!-- Droppable zone -->
    <div ref="dropZoneRef" class="flex-1 min-h-0 flex flex-col gap-3 pt-3 pb-1 overflow-y-auto">
      <ItemCard
        v-for="item in items"
        :key="item.id"
        :item="item"
        :draggable="!column.isRaw"
        @drag-start="onDragStart(item)"
      />
      
      <div v-if="!items.length" class="h-24 rounded-lg border border-dashed flex items-center justify-center text-xs uppercase tracking-widest"
        style="border-color: var(--outline-variant); color: var(--on-surface-variant);">
        {{ column.isRaw ? 'Esperando capturas...' : 'Arrastra aquí' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useDraggable } from 'vue-draggable-plus';
import ItemCard from './ItemCard.vue';

const props = defineProps({
  column: { type: Object, required: true },
  items: { type: Array, default: () => [] },
});

const emit = defineEmits(['drop']);

const dropZoneRef = ref(null);
const draggedItem = ref(null);

// Configurar droppable
useDraggable(dropZoneRef, {
  group: 'kanban',
  animation: 150,
  onEnd: (evt) => {
    if (draggedItem.value) {
      emit('drop', {
        itemId: draggedItem.value.id,
        fromColumnId: draggedItem.value.category || 'inbox',
        toColumnId: props.column.id,
      });
      draggedItem.value = null;
    }
  },
});

function onDragStart(item) {
  draggedItem.value = item;
}
</script>
```

### 4.4 Crear ConfirmModal.vue

```vue
<!-- desktop/src/components/ConfirmModal.vue -->
<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div class="glass-elevated p-6 w-full max-w-md animate-in">
      <h2 class="text-xl font-bold mb-4" style="color: var(--on-background);">
        Confirmar movimiento
      </h2>
      
      <p class="text-sm mb-6" style="color: var(--on-surface-variant);">
        ¿Mover "<strong>{{ item.title }}</strong>" de <strong>{{ fromCategory }}</strong> a <strong>{{ toCategory }}</strong>?
      </p>
      
      <!-- Editor de metadata (opcional) -->
      <div class="mb-6">
        <label class="text-xs font-medium mb-2 block" style="color: var(--on-surface);">
          Metadata (opcional)
        </label>
        <textarea
          v-model="metadataJson"
          class="glass-input w-full resize-none font-mono text-xs"
          rows="6"
          placeholder='{"priority": "high", "deadline": "2026-08-01"}'
        ></textarea>
        <p v-if="metadataError" class="text-xs mt-1" style="color: var(--error);">
          {{ metadataError }}
        </p>
      </div>
      
      <!-- Acciones -->
      <div class="flex gap-3">
        <button @click="handleConfirm" class="btn-primary flex-1">
          Confirmar
        </button>
        <button @click="emit('cancel')" class="btn-secondary flex-1">
          Cancelar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  item: { type: Object, required: true },
  fromCategory: { type: String, required: true },
  toCategory: { type: String, required: true },
});

const emit = defineEmits(['confirm', 'cancel']);

const metadataJson = ref(JSON.stringify(props.item.metadata || {}, null, 2));
const metadataError = ref('');

function handleConfirm() {
  // Validar JSON
  try {
    const metadata = JSON.parse(metadataJson.value);
    emit('confirm', { metadata });
  } catch (err) {
    metadataError.value = 'JSON inválido';
  }
}
</script>
```

### 4.5 Actualizar ItemCard.vue (agregar draggable)

```vue
<!-- desktop/src/components/ItemCard.vue -->
<template>
  <div 
    class="glass-card p-4 hover-lift cursor-pointer"
    :class="{ 'opacity-50': isDragging }"
    @mousedown="onMouseDown"
  >
    <!-- Contenido de la tarjeta -->
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
import { ref } from 'vue';
import { format, parseISO } from 'date-fns';
import { getCategoryColor } from '../config/categories.js';

const props = defineProps({
  item: { type: Object, required: true },
  draggable: { type: Boolean, default: false },
});

const emit = defineEmits(['drag-start']);

const isDragging = ref(false);

const categoryColor = getCategoryColor(props.item.category);

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), 'dd MMM HH:mm');
  } catch {
    return dateStr;
  }
}

function onMouseDown() {
  if (props.draggable) {
    isDragging.value = true;
    emit('drag-start');
  }
}
</script>
```

### 4.6 Actualizar store de items (agregar moveItem)

```javascript
// desktop/src/stores/items.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { fetchItems, updateItem } from '../services/api.js';
import { subscribeToItems, subscribeToRawInputs } from '../services/realtime.js';
import { CATEGORIES } from '../config/categories.js';

export const useItemsStore = defineStore('items', () => {
  const items = ref([]);
  const rawInputs = ref([]); // NUEVO: raw_inputs pendientes
  const loading = ref(false);
  const error = ref(null);
  
  // ... resto del código existente ...
  
  async function moveItem(itemId, newCategory, metadata) {
    const item = items.value.find(i => i.id === itemId);
    if (!item) throw new Error('Item no encontrado');
    
    // Actualizar en DB
    await updateItem(itemId, {
      category: newCategory,
      metadata: metadata || item.metadata,
      status: 'active',
    });
    
    // Actualizar en store local
    item.category = newCategory;
    item.metadata = metadata || item.metadata;
  }
  
  async function loadRawInputs() {
    const { data, error } = await supabase
      .from('raw_inputs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    rawInputs.value = data || [];
  }
  
  function startRealtime() {
    unsubscribeItems = subscribeToItems((event, item) => {
      if (event === 'insert') {
        items.value.unshift(item);
        // Remover de rawInputs si estaba ahí
        rawInputs.value = rawInputs.value.filter(r => r.id !== item.raw_input_id);
      } else if (event === 'update') {
        const idx = items.value.findIndex(i => i.id === item.id);
        if (idx !== -1) items.value[idx] = item;
      }
    });
    
    unsubscribeRawInputs = subscribeToRawInputs((event, rawInput) => {
      if (event === 'insert') {
        rawInputs.value.unshift(rawInput);
      } else if (event === 'update') {
        const idx = rawInputs.value.findIndex(r => r.id === rawInput.id);
        if (idx !== -1) rawInputs.value[idx] = rawInput;
        
        // Si fue procesado, remover de rawInputs
        if (rawInput.status === 'processed') {
          rawInputs.value = rawInputs.value.filter(r => r.id !== rawInput.id);
        }
      }
    });
  }
  
  function stopRealtime() {
    if (unsubscribeItems) unsubscribeItems();
    if (unsubscribeRawInputs) unsubscribeRawInputs();
  }
  
  return {
    items, rawInputs, loading, error,
    // ... resto ...
    moveItem, loadRawInputs,
    loadItems, startRealtime, stopRealtime,
  };
});
```

### 4.7 Actualizar DashboardView.vue

```vue
<!-- desktop/src/views/DashboardView.vue -->
<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold" style="font-family: var(--font-headline); color: var(--on-background);">
        Dashboard
      </h1>
      <div class="flex gap-4 text-sm" style="color: var(--on-surface-variant);">
        <span>Total: {{ store.totalCount }}</span>
        <span>Por clasificar: {{ store.rawInputs.length }}</span>
      </div>
    </div>
    
    <div v-if="store.loading" style="color: var(--on-surface-variant);">Cargando...</div>
    <KanbanBoard v-else />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useItemsStore } from '../stores/items.js';
import KanbanBoard from '../components/KanbanBoard.vue';

const store = useItemsStore();

onMounted(async () => {
  await store.loadItems();
  await store.loadRawInputs();
  store.startRealtime();
});

onUnmounted(() => {
  store.stopRealtime();
});
</script>
```

**Criterios de aceptación**:
- [ ] Kanban muestra 9 columnas (Inbox + 8 categorías)
- [ ] Columna "Inbox" muestra raw_inputs pendientes
- [ ] Drag & drop funciona entre columnas
- [ ] Modal de confirmación aparece al soltar
- [ ] Metadata se puede editar en el modal
- [ ] Item se mueve correctamente tras confirmar
- [ ] Toast notifica el movimiento

---

## Fase 5: Mobile - Sistema de Toast (unificado)

**Objetivo**: Reemplazar FeedbackToast con sistema sonner unificado.

**Archivos a crear/modificar**:
- `mobile/package.json` (agregar dependencia `sonner`)
- `mobile/src/components/AppToast.vue` (nuevo)
- `mobile/src/App.vue` (montar `<AppToast />`)
- `mobile/src/stores/notifications.js` (nuevo)
- `mobile/src/views/CaptureView.vue` (usar toasts)
- `mobile/src/components/FeedbackToast.vue` (eliminar)

**Tareas**:

### 5.1 Instalar dependencia

```bash
cd mobile
npm install sonner
```

### 5.2 Crear AppToast.vue

```vue
<!-- mobile/src/components/AppToast.vue -->
<script setup>
import { Toaster } from 'sonner/vue';
</script>

<template>
  <Toaster 
    richColors 
    position="bottom"
    :toastOptions="{
      style: {
        fontFamily: 'var(--font-body)',
        fontSize: '0.875rem',
      },
    }"
  />
</template>
```

### 5.3 Montar en App.vue

```vue
<!-- mobile/src/App.vue -->
<template>
  <div class="min-h-screen" :style="{ backgroundColor: 'var(--background)' }">
    <div class="main-content">
      <router-view />
    </div>
    
    <nav v-if="isLoggedIn" class="bottom-nav">...</nav>
    
    <!-- Toast notifications -->
    <AppToast />
  </div>
</template>

<script setup>
import AppToast from './components/AppToast.vue';
// ... resto del código
</script>
```

### 5.4 Crear store de notificaciones

```javascript
// mobile/src/stores/notifications.js
import { defineStore } from 'pinia';
import { toast } from 'sonner/vue';

export const useNotificationsStore = defineStore('notifications', () => {
  function showCaptureReceived() {
    toast('Captura recibida...', { duration: 2000 });
  }
  
  function showProcessing() {
    toast('Procesando con IA...', { duration: 2000 });
  }
  
  function showClassified(category) {
    toast.success(`Clasificado como ${category}`, { duration: 3000 });
  }
  
  function showError(message) {
    toast.error(message, { duration: 4000 });
  }
  
  function showItemCompleted() {
    toast.success('Item completado', { duration: 2500 });
  }
  
  function showItemCancelled() {
    toast('Item cancelado', { duration: 2500 });
  }
  
  return {
    showCaptureReceived,
    showProcessing,
    showClassified,
    showError,
    showItemCompleted,
    showItemCancelled,
  };
});
```

### 5.5 Actualizar CaptureView.vue

```vue
<!-- mobile/src/views/CaptureView.vue -->
<script setup>
import { ref } from 'vue';
import AudioRecorder from '../components/AudioRecorder.vue';
import QuickTextInput from '../components/QuickTextInput.vue';
import { ingestTranscribedText } from '../services/api.js';
import { useNotificationsStore } from '../stores/notifications.js';

const notifications = useNotificationsStore();

async function handleAudio(transcribedText) {
  if (!transcribedText || !transcribedText.trim()) return;
  
  try {
    const rawInput = await ingestTranscribedText(transcribedText);
    notifications.showCaptureReceived();
    pollStatus(rawInput.id);
  } catch (err) {
    notifications.showError(`Error: ${err.message}`);
  }
}

async function pollStatus(rawInputId) {
  let attempts = 0;
  const maxAttempts = 12;
  
  const poll = async () => {
    if (attempts >= maxAttempts) {
      notifications.showError('Tardando más de lo esperado');
      return;
    }
    attempts++;
    
    const { data, error } = await supabase
      .from('raw_inputs')
      .select('status, error_message')
      .eq('id', rawInputId)
      .single();
    
    if (error || !data) return;
    
    if (data.status === 'processed') {
      notifications.showClassified('Tarea'); // O la categoría que sea
      return;
    }
    
    if (data.status === 'failed') {
      notifications.showError(data.error_message || 'Error al procesar');
      return;
    }
    
    setTimeout(poll, 5000);
  };
  
  setTimeout(poll, 5000);
}
</script>
```

### 5.6 Eliminar FeedbackToast.vue

```bash
rm mobile/src/components/FeedbackToast.vue
```

**Criterios de aceptación**:
- [ ] Toasts aparecen en la parte inferior (mobile)
- [ ] Toasts tienen colores según tipo
- [ ] Toasts se auto-ocultan después de 3-4 segundos
- [ ] CaptureView usa toasts en lugar de FeedbackToast
- [ ] FeedbackToast.vue eliminado

---

## Fase 6: Mobile - Gestos (Long Press, Bottom Sheet)

**Objetivo**: Implementar gestos en ItemCard: tap para editar, long press para acciones rápidas.

**Archivos a crear/modificar**:
- `mobile/src/components/ItemCard.vue` (agregar gestos)
- `mobile/src/components/QuickActionSheet.vue` (nuevo)
- `mobile/src/components/EditItemModal.vue` (nuevo)
- `mobile/src/stores/items.js` (agregar métodos `completeItem`, `cancelItem`)

**Tareas**:

### 6.1 Actualizar ItemCard.vue con gestos

```vue
<!-- mobile/src/components/ItemCard.vue -->
<template>
  <div 
    class="glass-card p-4 hover-lift"
    @click="handleTap"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
    @touchmove="handleTouchMove"
  >
    <!-- Contenido de la tarjeta -->
    <div class="flex items-start gap-3">
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
import { ref } from 'vue';
import { format, parseISO } from 'date-fns';
import { getCategoryColor, getCategoryIcon } from '../config/categories.js';

const props = defineProps({
  item: { type: Object, required: true },
});

const emit = defineEmits(['edit', 'quick-action']);

const categoryColor = computed(() => getCategoryColor(props.item.category));
const categoryIcon = computed(() => getCategoryIcon(props.item.category));

const touchStartTime = ref(0);
const touchStartPos = ref({ x: 0, y: 0 });
const LONG_PRESS_DURATION = 500; // ms

function handleTap() {
  emit('edit', props.item);
}

function handleTouchStart(e) {
  touchStartTime.value = Date.now();
  touchStartPos.value = {
    x: e.touches[0].clientX,
    y: e.touches[0].clientY,
  };
}

function handleTouchEnd(e) {
  const duration = Date.now() - touchStartTime.value;
  
  if (duration >= LONG_PRESS_DURATION) {
    // Long press detectado
    emit('quick-action', props.item);
  }
}

function handleTouchMove(e) {
  // Si el usuario mueve el dedo, cancelar long press
  const moveX = Math.abs(e.touches[0].clientX - touchStartPos.value.x);
  const moveY = Math.abs(e.touches[0].clientY - touchStartPos.value.y);
  
  if (moveX > 10 || moveY > 10) {
    touchStartTime.value = 0;
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
</script>
```

### 6.2 Crear QuickActionSheet.vue

```vue
<!-- mobile/src/components/QuickActionSheet.vue -->
<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" @click="close">
    <div class="glass-elevated w-full max-w-md rounded-t-2xl p-4 animate-in" @click.stop>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold" style="color: var(--on-background);">Acciones rápidas</h3>
        <button @click="close" class="text-2xl" style="color: var(--on-surface-variant);">×</button>
      </div>
      
      <div class="space-y-2">
        <button @click="handleComplete" class="w-full px-4 py-3 rounded-lg text-left flex items-center gap-3 transition-colors"
          style="background-color: var(--surface-container-high); color: var(--on-surface);">
          <span class="text-2xl">🟢</span>
          <span>Completar / Terminado</span>
        </button>
        
        <button @click="handleCancel" class="w-full px-4 py-3 rounded-lg text-left flex items-center gap-3 transition-colors"
          style="background-color: var(--surface-container-high); color: var(--on-surface);">
          <span class="text-2xl">🔴</span>
          <span>Cancelar / Descartar</span>
        </button>
        
        <button @click="close" class="w-full px-4 py-3 rounded-lg text-left flex items-center gap-3 transition-colors"
          style="background-color: var(--surface-container-high); color: var(--on-surface);">
          <span class="text-2xl">⚪</span>
          <span>Volver</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  item: { type: Object, required: true },
});

const emit = defineEmits(['complete', 'cancel', 'close']);

function handleComplete() {
  emit('complete', props.item);
  close();
}

function handleCancel() {
  emit('cancel', props.item);
  close();
}

function close() {
  emit('close');
}
</script>
```

### 6.3 Crear EditItemModal.vue

```vue
<!-- mobile/src/components/EditItemModal.vue -->
<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" @click="close">
    <div class="glass-elevated w-full max-w-md rounded-2xl p-6 animate-in" @click.stop>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold" style="color: var(--on-background);">Editar item</h3>
        <button @click="close" class="text-2xl" style="color: var(--on-surface-variant);">×</button>
      </div>
      
      <div class="space-y-4">
        <div>
          <label class="text-xs font-medium mb-2 block" style="color: var(--on-surface);">Título</label>
          <input v-model="editForm.title" type="text" class="glass-input w-full" />
        </div>
        
        <div>
          <label class="text-xs font-medium mb-2 block" style="color: var(--on-surface);">Categoría</label>
          <select v-model="editForm.category" class="glass-input w-full">
            <option v-for="cat in categories" :key="cat.value" :value="cat.value">
              {{ cat.label }}
            </option>
          </select>
        </div>
        
        <div>
          <label class="text-xs font-medium mb-2 block" style="color: var(--on-surface);">Metadata (JSON)</label>
          <textarea v-model="metadataJson" class="glass-input w-full resize-none font-mono text-xs" rows="6"></textarea>
          <p v-if="metadataError" class="text-xs mt-1" style="color: var(--error);">{{ metadataError }}</p>
        </div>
        
        <div class="flex gap-3">
          <button @click="handleSave" class="btn-primary flex-1">Guardar</button>
          <button @click="close" class="btn-secondary flex-1">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { CATEGORIES } from '../config/categories.js';

const props = defineProps({
  visible: { type: Boolean, default: false },
  item: { type: Object, required: true },
});

const emit = defineEmits(['save', 'close']);

const categories = CATEGORIES;

const editForm = ref({
  title: '',
  category: '',
});

const metadataJson = ref('');
const metadataError = ref('');

watch(() => props.item, (newItem) => {
  if (newItem) {
    editForm.value = {
      title: newItem.title || '',
      category: newItem.category || 'Nota',
    };
    metadataJson.value = JSON.stringify(newItem.metadata || {}, null, 2);
  }
}, { immediate: true });

function handleSave() {
  try {
    const metadata = JSON.parse(metadataJson.value);
    emit('save', {
      ...editForm.value,
      metadata,
    });
  } catch (err) {
    metadataError.value = 'JSON inválido';
  }
}

function close() {
  emit('close');
}
</script>
```

### 6.4 Actualizar HomeView.vue

```vue
<!-- mobile/src/views/HomeView.vue -->
<template>
  <div class="px-4 pt-4">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold" style="font-family: var(--font-headline); color: var(--on-background);">Inbox</h1>
      <span class="text-xs font-mono" style="color: var(--on-surface-variant);">
        {{ store.inboxCount }} pendientes
      </span>
    </div>
    
    <!-- Filter chips -->
    <div class="flex gap-2 mb-5 overflow-x-auto pb-1">
      <button v-for="f in filters" :key="f.value"
        @click="store.setFilter(f.value)"
        class="sub-tab px-4 py-1.5 text-xs font-medium whitespace-nowrap"
        :class="store.filter === f.value ? 'active' : ''">
        {{ f.label }}
      </button>
    </div>
    
    <!-- Items list -->
    <div v-else class="space-y-3 pb-4 stagger-enter">
      <ItemCard 
        v-for="item in store.filteredItems" 
        :key="item.id" 
        :item="item"
        @edit="openEditModal"
        @quick-action="openQuickAction"
      />
    </div>
    
    <!-- Modals -->
    <EditItemModal
      :visible="editModalVisible"
      :item="selectedItem"
      @save="handleSaveEdit"
      @close="editModalVisible = false"
    />
    
    <QuickActionSheet
      :visible="quickActionVisible"
      :item="selectedItem"
      @complete="handleComplete"
      @cancel="handleCancel"
      @close="quickActionVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useItemsStore } from '../stores/items.js';
import { useNotificationsStore } from '../stores/notifications.js';
import ItemCard from '../components/ItemCard.vue';
import EditItemModal from '../components/EditItemModal.vue';
import QuickActionSheet from '../components/QuickActionSheet.vue';
import { CATEGORIES } from '../config/categories.js';

const store = useItemsStore();
const notifications = useNotificationsStore();

const filters = [
  { label: 'Todo', value: 'ALL' },
  ...CATEGORIES.map(c => ({ label: c.label, value: c.value })),
];

const editModalVisible = ref(false);
const quickActionVisible = ref(false);
const selectedItem = ref(null);

function openEditModal(item) {
  selectedItem.value = item;
  editModalVisible.value = true;
}

function openQuickAction(item) {
  selectedItem.value = item;
  quickActionVisible.value = true;
}

async function handleSaveEdit(formData) {
  try {
    await store.updateItem(selectedItem.value.id, formData);
    notifications.showClassified(formData.category);
    editModalVisible.value = false;
  } catch (err) {
    notifications.showError(`Error al guardar: ${err.message}`);
  }
}

async function handleComplete(item) {
  try {
    await store.completeItem(item.id);
    notifications.showItemCompleted();
  } catch (err) {
    notifications.showError(`Error: ${err.message}`);
  }
}

async function handleCancel(item) {
  try {
    await store.cancelItem(item.id);
    notifications.showItemCancelled();
  } catch (err) {
    notifications.showError(`Error: ${err.message}`);
  }
}

onMounted(async () => {
  await store.loadItems();
  store.startRealtime();
});

onUnmounted(() => {
  store.stopRealtime();
});
</script>
```

### 6.5 Actualizar store de items (agregar métodos)

```javascript
// mobile/src/stores/items.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { fetchItems, updateItem } from '../services/api.js';
import { subscribeToItems } from '../services/realtime.js';
import { CATEGORIES } from '../config/categories.js';
import { supabase } from '../services/auth.js';

export const useItemsStore = defineStore('items', () => {
  const items = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const filter = ref('ALL');
  
  const filteredItems = computed(() => {
    if (filter.value === 'ALL') return items.value;
    return items.value.filter(i => i.category === filter.value);
  });
  
  async function loadItems() {
    loading.value = true;
    try {
      items.value = await fetchItems();
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }
  
  async function updateItem(itemId, data) {
    const { error } = await supabase
      .from('items')
      .update(data)
      .eq('id', itemId);
    
    if (error) throw error;
    
    // Actualizar en store local
    const idx = items.value.findIndex(i => i.id === itemId);
    if (idx !== -1) {
      items.value[idx] = { ...items.value[idx], ...data };
    }
  }
  
  async function completeItem(itemId) {
    await updateItem(itemId, { status: 'completed' });
  }
  
  async function cancelItem(itemId) {
    await updateItem(itemId, { status: 'cancelled' });
  }
  
  function startRealtime() {
    if (unsubscribe) return;
    unsubscribe = subscribeToItems((event, item) => {
      if (event === 'insert') {
        items.value.unshift(item);
      } else if (event === 'update') {
        const idx = items.value.findIndex(i => i.id === item.id);
        if (idx !== -1) items.value[idx] = item;
      }
    });
  }
  
  function stopRealtime() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  }
  
  function setFilter(value) {
    filter.value = value;
  }
  
  return {
    items, loading, error, filter, filteredItems,
    totalCount: computed(() => items.value.length),
    inboxCount: computed(() => items.value.filter(i => i.status === 'inbox').length),
    loadItems, updateItem, completeItem, cancelItem,
    startRealtime, stopRealtime, setFilter,
  };
});
```

**Criterios de aceptación**:
- [ ] Tap en ItemCard abre modal de edición
- [ ] Long press (500ms) abre bottom sheet de acciones rápidas
- [ ] Bottom sheet tiene 3 opciones: Completar, Cancelar, Volver
- [ ] Completar actualiza status a 'completed'
- [ ] Cancelar actualiza status a 'cancelled'
- [ ] Modal de edición permite editar título, categoría, metadata
- [ ] Toasts notifican las acciones

---

## Fase 7: Mobile - Flujo de Texto por IA

**Objetivo**: Que el texto escrito pase por el worker de IA si no se selecciona categoría manual.

**Archivos a modificar**:
- `mobile/src/components/QuickTextInput.vue` (modificar lógica de submit)
- `mobile/src/services/api.js` (agregar método `ingestTextForAI`)

**Tareas**:

### 7.1 Actualizar QuickTextInput.vue

```vue
<!-- mobile/src/components/QuickTextInput.vue -->
<script setup>
import { ref } from 'vue';
import { createItem, ingestTextForAI } from '../services/api.js';
import { getSupabaseToken } from '../services/auth.js';
import { CATEGORIES, DEFAULT_CATEGORY } from '../config/categories.js';
import { useNotificationsStore } from '../stores/notifications.js';

const notifications = useNotificationsStore();

const text = ref('');
const sending = ref(false);
const selectedCategory = ref(null); // NUEVO: null por defecto (usar IA)
const status = ref('');
const statusColor = ref('');

const categories = [
  { value: null, label: 'Auto (IA)', color: 'var(--primary)' }, // NUEVO
  ...CATEGORIES,
];

async function submit() {
  const content = text.value.trim();
  if (!content || sending.value) return;
  
  sending.value = true;
  status.value = '';
  
  try {
    if (selectedCategory.value) {
      // Categoría manual: crear item directo
      await createItem({
        title: content,
        category: selectedCategory.value,
      });
      notifications.showClassified(selectedCategory.value);
    } else {
      // Sin categoría: pasar por IA
      const rawInput = await ingestTextForAI(content);
      notifications.showCaptureReceived();
      pollStatus(rawInput.id);
    }
    
    text.value = '';
    selectedCategory.value = null;
  } catch (err) {
    notifications.showError(`Error: ${err.message}`);
  } finally {
    sending.value = false;
  }
}

async function pollStatus(rawInputId) {
  let attempts = 0;
  const maxAttempts = 12;
  
  const poll = async () => {
    if (attempts >= maxAttempts) {
      notifications.showError('Tardando más de lo esperado');
      return;
    }
    attempts++;
    
    const { data, error } = await supabase
      .from('raw_inputs')
      .select('status, error_message')
      .eq('id', rawInputId)
      .single();
    
    if (error || !data) return;
    
    if (data.status === 'processed') {
      notifications.showClassified('Tarea'); // O la categoría que sea
      return;
    }
    
    if (data.status === 'failed') {
      notifications.showError(data.error_message || 'Error al procesar');
      return;
    }
    
    setTimeout(poll, 5000);
  };
  
  setTimeout(poll, 5000);
}
</script>
```

### 7.2 Agregar método ingestTextForAI

```javascript
// mobile/src/services/api.js
export async function ingestTextForAI(text) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('No autenticado');
  
  const { data, error: insertError } = await supabase
    .from('raw_inputs')
    .insert({
      user_id: user.id,
      type: 'text',
      content_text: text,
      status: 'pending',
    })
    .select()
    .single();
  
  if (insertError) {
    throw new Error(`Error al guardar: ${insertError.message}`);
  }
  
  return data;
}
```

**Criterios de aceptación**:
- [ ] QuickTextInput muestra opción "Auto (IA)" por defecto
- [ ] Si se selecciona categoría manual → crear item directo
- [ ] Si no se selecciona categoría → pasar por worker IA
- [ ] Toasts notifican el progreso del procesamiento

---

## Fase 8: ItemCard Mejorado (Adaptado de EntityCard)

**Objetivo**: Mejorar ItemCard con diseño más rico (inspirado en EntityCard de UX Core).

**Archivos a modificar**:
- `desktop/src/components/ItemCard.vue` (mejorar diseño)
- `mobile/src/components/ItemCard.vue` (mejorar diseño)

**Tareas**:

### 8.1 Mejorar ItemCard.vue (Desktop)

```vue
<!-- desktop/src/components/ItemCard.vue -->
<template>
  <div 
    class="glass-card p-4 hover-lift cursor-pointer group"
    :class="{ 'opacity-50': isDragging }"
    @mousedown="onMouseDown"
  >
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
    <div v-if="hasMetadata" class="text-xs mb-2 space-y-1" style="color: var(--on-surface-variant);">
      <div v-if="item.metadata.priority" class="flex items-center gap-1">
        <span class="font-medium">Prioridad:</span>
        <span :style="{ color: getPriorityColor(item.metadata.priority) }">
          {{ item.metadata.priority }}
        </span>
      </div>
      <div v-if="item.metadata.deadline" class="flex items-center gap-1">
        <span class="font-medium">Deadline:</span>
        <span>{{ formatDate(item.metadata.deadline) }}</span>
      </div>
      <div v-if="item.metadata.participants?.length" class="flex items-center gap-1">
        <span class="font-medium">Participantes:</span>
        <span>{{ item.metadata.participants.join(', ') }}</span>
      </div>
      <div v-if="item.metadata.contact_name" class="flex items-center gap-1">
        <span class="font-medium">Contacto:</span>
        <span>{{ item.metadata.contact_name }}</span>
      </div>
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
      <button @click.stop="emit('edit')" class="text-xs px-2 py-1 rounded"
        style="background-color: var(--surface-container-high); color: var(--on-surface-variant);">
        Editar
      </button>
      <button @click.stop="emit('delete')" class="text-xs px-2 py-1 rounded"
        style="background-color: var(--surface-container-high); color: var(--error);">
        Eliminar
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { format, parseISO } from 'date-fns';
import { getCategoryColor } from '../config/categories.js';

const props = defineProps({
  item: { type: Object, required: true },
  draggable: { type: Boolean, default: false },
});

const emit = defineEmits(['drag-start', 'edit', 'delete']);

const isDragging = ref(false);

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

function getPriorityColor(priority) {
  const colors = {
    high: 'var(--error)',
    medium: 'var(--tertiary)',
    low: 'var(--on-surface-variant)',
  };
  return colors[priority] || 'var(--on-surface-variant)';
}

function onMouseDown() {
  if (props.draggable) {
    isDragging.value = true;
    emit('drag-start');
  }
}
</script>
```

**Criterios de aceptación**:
- [ ] ItemCard muestra metadata específica por categoría
- [ ] ItemCard muestra acciones en hover (Editar, Eliminar)
- [ ] ItemCard soporta drag & drop
- [ ] Diseño es consistente con el sistema de diseño "Luminous Intelligence"

---

## Resumen de Fases

| Fase | Descripción | Dependencias | Estimación |
|------|-------------|--------------|------------|
| 1 | DB: Agregar categoría Email | Ninguna | 1 hora |
| 2 | Worker: Taxonomía detallada | Fase 1 | 2 horas |
| 3 | Desktop: Sistema de Toast | Ninguna | 2 horas |
| 4 | Desktop: Kanban completo | Fase 3 | 4 horas |
| 5 | Mobile: Sistema de Toast | Ninguna | 1 hora |
| 6 | Mobile: Gestos (long press) | Fase 5 | 3 horas |
| 7 | Mobile: Flujo de texto por IA | Fase 2, 5 | 2 horas |
| 8 | ItemCard mejorado | Fase 4, 6 | 2 horas |

**Total estimado**: 17 horas de desarrollo

---

## Próximos Pasos

1. **Validar este plan** con el usuario
2. **Comenzar con Fase 1** (DB: agregar Email)
3. **Continuar con Fase 2** (Worker: taxonomía)
4. **Implementar Fases 3-4** (Desktop: Toast + Kanban)
5. **Implementar Fases 5-7** (Mobile: Toast + Gestos + IA)
6. **Finalizar con Fase 8** (ItemCard mejorado)

Cada fase debe incluir:
- Implementación del código
- Tests manuales
- Documentación de cambios
- Commit en git
