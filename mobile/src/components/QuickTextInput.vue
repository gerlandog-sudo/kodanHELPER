<template>
  <div class="space-y-4 pt-2">
    <textarea
      v-model="text"
      placeholder="Escribe una idea rapida..."
      class="glass-input w-full resize-none"
      rows="5"
      maxlength="10000"
      style="min-height: 120px;"
    ></textarea>

    <!-- Category selector -->
    <div class="flex gap-2">
      <button v-for="cat in categories" :key="cat.value"
        @click="selectedCategory = cat.value"
        class="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
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
      <span class="text-xs font-mono" style="color: var(--on-surface-variant); letter-spacing: 0.02em;">{{ text.length }}/10000</span>
      <button
        @click="submit"
        :disabled="!text.trim() || sending"
        class="btn-primary"
        style="padding: 0.75rem 1.5rem;"
      >
        {{ sending ? 'Enviando...' : 'Capturar' }}
      </button>
    </div>

    <transition name="toast">
      <p v-if="status" class="text-sm text-center" :style="{ color: statusColor }">{{ status }}</p>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { createItem, ingestText } from '../services/api.js';
import { getSupabaseToken } from '../services/auth.js';

const text = ref('');
const sending = ref(false);
const selectedCategory = ref('IDEA');
const status = ref('');
const statusColor = ref('');

const categories = [
  { label: 'Idea', value: 'IDEA', color: 'var(--secondary)' },
  { label: 'Tarea', value: 'TASK', color: 'var(--primary)' },
  { label: 'Reunion', value: 'MEETING', color: 'var(--tertiary)' },
];

async function submit() {
  const content = text.value.trim();
  if (!content || sending.value) return;

  sending.value = true;
  status.value = '';
  try {
    // First save directly to Supabase (fast)
    await createItem({
      title: content,
      category: selectedCategory.value,
    });
    status.value = 'Capturado!';
    statusColor.value = 'var(--primary)';
    text.value = '';

    // Then try AI processing via API (non-blocking)
    try {
      const token = await getSupabaseToken();
      if (token) {
        ingestText(content, token).catch(() => {});
      }
    } catch {
      // Silent - direct save already worked
    }

    setTimeout(() => { status.value = ''; }, 2500);
  } catch (err) {
    status.value = `Error: ${err.message}`;
    statusColor.value = 'var(--error)';
  } finally {
    sending.value = false;
  }
}
</script>
