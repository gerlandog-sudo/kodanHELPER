<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in" @click="close">
    <div class="glass-elevated w-full max-w-md mx-4 rounded-2xl p-6 shadow-2xl" @click.stop>
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-bold" style="color: var(--on-background);">Editar elemento</h3>
        <button @click="close" class="w-8 h-8 flex items-center justify-center rounded-full"
          style="background-color: var(--surface-container-high); color: var(--on-surface-variant);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="space-y-4">
        <!-- Title -->
        <div>
          <label class="text-xs font-semibold mb-1.5 block" style="color: var(--on-surface);">Título</label>
          <input
            v-model="editForm.title"
            type="text"
            class="glass-input w-full"
            placeholder="Título del elemento"
          />
        </div>

        <!-- Category -->
        <div>
          <label class="text-xs font-semibold mb-1.5 block" style="color: var(--on-surface);">Categoría</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="cat in categories" :key="cat.value"
              @click="editForm.category = cat.value"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              :style="{
                backgroundColor: editForm.category === cat.value ? cat.color + '20' : 'var(--surface-container-high)',
                color: editForm.category === cat.value ? cat.color : 'var(--on-surface-variant)',
                border: editForm.category === cat.value ? '1px solid ' + cat.color + '40' : '1px solid transparent',
              }"
            >
              {{ cat.label }}
            </button>
          </div>
        </div>

        <!-- Metadata JSON -->
        <div>
          <label class="text-xs font-semibold mb-1.5 block" style="color: var(--on-surface);">
            Metadata <span class="font-normal" style="color: var(--on-surface-variant);">(JSON)</span>
          </label>
          <textarea
            v-model="metadataJson"
            class="glass-input w-full resize-none font-mono text-xs leading-relaxed"
            rows="5"
            :placeholder="metadataPlaceholder"
          ></textarea>
          <p v-if="metadataError" class="text-xs mt-1 flex items-center gap-1" style="color: var(--error);">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {{ metadataError }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-2">
          <button @click="handleSave" :disabled="saving" class="btn-primary flex-1 flex items-center justify-center gap-2">
            <svg v-if="saving" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="animate-spin"><circle cx="12" cy="12" r="10" opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
            <template v-else>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </template>
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
          <button @click="close" class="btn-secondary flex-1">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { CATEGORIES } from '../config/categories.js';

const props = defineProps({
  visible: { type: Boolean, default: false },
  item: { type: Object, required: true },
});

const emit = defineEmits(['save', 'close']);

const saving = ref(false);
const metadataError = ref('');

const categories = CATEGORIES;

const editForm = ref({
  title: '',
  category: '',
});

const metadataJson = ref('');

const metadataPlaceholder = computed(() => {
  const schemas = {
    Tarea: '{\n  "priority": "high",\n  "deadline": "2026-08-01"\n}',
    Idea: '{\n  "area": "Frontend",\n  "next_steps": "Revisar diseño"\n}',
    Reunion: '{\n  "participants": ["Juan"],\n  "proposed_date": "2026-07-30T15:00:00Z"\n}',
    Recordatorio: '{\n  "description": "...",\n  "alert_at": "2026-07-25T09:00:00Z",\n  "recurrence": "once"\n}',
    Nota: '{\n  "tags": ["referencia"]\n}',
    Investigar: '{\n  "source_url": "https://...",\n  "success_criteria": "..."\n}',
    Llamar: '{\n  "contact_name": "Marcos",\n  "phone": "11...",\n  "objective": "...",\n  "deadline": "2026-08-01"\n}',
    Email: '{\n  "recipient": "juan@example.com",\n  "subject": "...",\n  "body": "..."\n}',
  };
  return schemas[editForm.value.category] || '{\n  "key": "value"\n}';
});

watch(() => props.item, (newItem) => {
  if (newItem) {
    editForm.value.title = newItem.title || '';
    editForm.value.category = newItem.category || 'Nota';
    metadataJson.value = JSON.stringify(newItem.metadata || {}, null, 2);
    metadataError.value = '';
  }
}, { immediate: true });

function handleSave() {
  try {
    const metadata = JSON.parse(metadataJson.value);
    emit('save', {
      title: editForm.value.title,
      category: editForm.value.category,
      metadata,
    });
  } catch (err) {
    metadataError.value = 'JSON inválido. Revisá el formato.';
  }
}

function close() {
  if (!saving.value) {
    emit('close');
  }
}
</script>
