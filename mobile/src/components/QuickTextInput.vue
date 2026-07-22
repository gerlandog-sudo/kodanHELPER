<template>
  <div class="space-y-3">
    <textarea
      v-model="text"
      placeholder="Escribe una idea rapida..."
      class="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-blue-500"
      rows="3"
      maxlength="10000"
    ></textarea>
    <div class="flex items-center justify-between">
      <span class="text-xs text-slate-500">{{ text.length }}/10000</span>
      <button
        @click="submit"
        :disabled="!text.trim() || sending"
        class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {{ sending ? 'Enviando...' : 'Enviar' }}
      </button>
    </div>
    <p v-if="status" class="text-sm" :class="statusClass">{{ status }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ingestText, getSupabaseToken } from '../services/api.js';

const text = ref('');
const sending = ref(false);
const status = ref('');
const statusClass = ref('');

async function submit() {
  if (!text.value.trim() || sending.value) return;

  sending.value = true;
  status.value = '';
  try {
    const token = await getSupabaseToken();
    if (!token) {
      status.value = 'Debes iniciar sesion primero';
      statusClass.value = 'text-yellow-400';
      return;
    }
    const result = await ingestText(text.value, token);
    status.value = 'Capturado!';
    statusClass.value = 'text-green-400';
    text.value = '';
    setTimeout(() => { status.value = ''; }, 3000);
  } catch (err) {
    status.value = `Error: ${err.message}`;
    statusClass.value = 'text-red-400';
  } finally {
    sending.value = false;
  }
}
</script>
