<template>
  <div class="px-4 pt-4 animate-in">
    <h1 class="text-2xl font-bold mb-6" style="font-family: var(--font-headline); color: var(--on-background);">Capturar</h1>

    <!-- Sub-tabs -->
    <div class="sub-tab-bar mb-6">
      <button v-for="tab in tabs" :key="tab.id"
        @click="activeTab = tab.id"
        class="sub-tab flex items-center justify-center gap-2"
        :class="activeTab === tab.id ? 'active' : ''">
        <span v-html="tab.icon"></span>
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab content -->
    <transition name="page" mode="out-in">
      <AudioRecorder v-if="activeTab === 'audio'" key="audio" @recording-complete="handleAudio" />
      <QuickTextInput v-else-if="activeTab === 'text'" key="text" />
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import AudioRecorder from '../components/AudioRecorder.vue';
import QuickTextInput from '../components/QuickTextInput.vue';
import { ingestTranscribedText } from '../services/api.js';
import { useNotificationsStore } from '../stores/notifications.js';
import { supabase } from '../services/auth.js';

const activeTab = ref('audio');
const notifications = useNotificationsStore();

const tabs = [
  { id: 'audio', label: 'Audio', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>' },
  { id: 'text', label: 'Texto', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>' },
];

let pollTimer = null;

async function pollStatus(rawInputId) {
  let attempts = 0;
  const maxAttempts = 12; // 60 seconds max

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

    if (error || !data) {
      return;
    }

    if (data.status === 'processed') {
      notifications.showClassified('--');
      return;
    }

    if (data.status === 'failed') {
      const reason = data.error_message || 'error desconocido';
      notifications.showError(`No se pudo procesar: ${reason}`);
      return;
    }

    if (data.status === 'processing') {
      notifications.showProcessing();
    }

    pollTimer = setTimeout(poll, 5000);
  };

  pollTimer = setTimeout(poll, 5000);
}

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
</script>
