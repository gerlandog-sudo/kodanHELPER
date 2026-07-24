<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in" @click.self="emit('cancel')">
    <div class="glass-elevated p-6 w-full max-w-md rounded-2xl shadow-2xl">
      <h2 class="text-xl font-bold mb-2" style="color: var(--on-background);">
        Mover elemento
      </h2>
      <p class="text-sm mb-6" style="color: var(--on-surface-variant);">
        ¿Mover "<strong>{{ item.title }}</strong>" de
        <strong>{{ fromCategory }}</strong> a <strong>{{ toCategory }}</strong>?
      </p>

      <!-- Metadata editor -->
      <div class="mb-6">
        <label class="text-xs font-semibold mb-2 block" style="color: var(--on-surface);">
          Metadata <span class="font-normal" style="color: var(--on-surface-variant);">(opcional, JSON)</span>
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
      <div class="flex gap-3">
        <button
          @click="handleConfirm"
          class="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
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
  return schemas[props.toCategory] || '{\n  "key": "value"\n}';
});

function handleConfirm() {
  try {
    const metadata = JSON.parse(metadataJson.value);
    emit('confirm', { metadata });
  } catch (err) {
    metadataError.value = 'JSON inválido. Revisá el formato.';
  }
}
</script>
