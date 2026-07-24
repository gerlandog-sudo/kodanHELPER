<template>
  <div class="space-y-4 pt-2">
    <textarea
      v-model="text"
      placeholder="Escribe una idea rápida..."
      class="glass-input w-full resize-none"
      rows="5"
      maxlength="10000"
      style="min-height: 120px;"
    ></textarea>

    <!-- Category selector (null = Auto/IA) -->
    <div class="flex gap-2 overflow-x-auto pb-2" style="-webkit-overflow-scrolling: touch;">
      <button
        @click="selectedCategory = null"
        class="flex-shrink-0 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
        :style="{
          backgroundColor: selectedCategory === null ? 'var(--primary)' + '20' : 'var(--surface-container-high)',
          color: selectedCategory === null ? 'var(--primary)' : 'var(--on-surface-variant)',
          border: selectedCategory === null ? '1px solid ' + 'var(--primary)' + '40' : '1px solid transparent',
        }">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="inline mr-1" style="vertical-align: middle;">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><circle cx="12" cy="8" r="0.5" fill="currentColor"/>
        </svg>
        Auto (IA)
      </button>
      <button v-for="cat in categories" :key="cat.value"
        @click="selectedCategory = cat.value"
        class="flex-shrink-0 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
        :style="{
          backgroundColor: selectedCategory === cat.value ? cat.color + '20' : 'var(--surface-container-high)',
          color: selectedCategory === cat.value ? cat.color : 'var(--on-surface-variant)',
          border: selectedCategory === cat.value ? '1px solid ' + cat.color + '40' : '1px solid transparent',
        }">
        {{ cat.label }}
      </button>
    </div>

    <!-- Send button -->
    <div class="flex items-center justify-between">
      <span v-if="selectedCategory === null" class="text-[10px] font-mono" style="color: var(--on-surface-variant); letter-spacing: 0.02em;">
        Se clasificará con IA automáticamente
      </span>
      <span v-else class="text-xs font-mono" style="color: var(--on-surface-variant); letter-spacing: 0.02em;">{{ text.length }}/10000</span>
      <button
        @click="submit"
        :disabled="!text.trim() || sending"
        class="btn-primary"
        style="padding: 0.75rem 1.5rem;"
      >
        <template v-if="sending">Enviando...</template>
        <template v-else>
          {{ selectedCategory === null ? 'Enviar a IA' : 'Capturar' }}
        </template>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { createItem, ingestTextForAI } from '../services/api.js';
import { useNotificationsStore } from '../stores/notifications.js';
import { CATEGORIES } from '../config/categories.js';
import { supabase } from '../services/auth.js';

const notifications = useNotificationsStore();

const text = ref('');
const sending = ref(false);
const selectedCategory = ref(null); // null = Auto/IA

const categories = CATEGORIES;

let pollTimer = null;

async function submit() {
  const content = text.value.trim();
  if (!content || sending.value) return;

  sending.value = true;

  try {
    if (selectedCategory.value) {
      // Categoría manual: crear item directo a Supabase
      await createItem({
        title: content,
        category: selectedCategory.value,
      });
      notifications.showClassified(selectedCategory.value);
    } else {
      // Sin categoría: enviar a IA para clasificación
      const rawInput = await ingestTextForAI(content);
      notifications.showCaptureReceived();
      pollStatus(rawInput.id);
    }

    text.value = '';
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
      notifications.showError('Tardando más de lo esperado. Revisa tu lista más tarde.');
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
      notifications.showClassified('--');
      return;
    }

    if (data.status === 'failed') {
      notifications.showError(data.error_message || 'Error al procesar');
      return;
    }

    if (data.status === 'processing') {
      notifications.showProcessing();
    }

    pollTimer = setTimeout(poll, 5000);
  };

  pollTimer = setTimeout(poll, 5000);
}
</script>
