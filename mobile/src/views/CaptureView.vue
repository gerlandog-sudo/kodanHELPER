<template>
  <div class="space-y-8">
    <section>
      <h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Grabar Audio</h2>
      <AudioRecorder @recording-complete="handleAudio" />
    </section>

    <section>
      <h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Escribir Texto</h2>
      <QuickTextInput />
    </section>

    <FeedbackToast :message="toast.message" :type="toast.type" />
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import AudioRecorder from '../components/AudioRecorder.vue';
import QuickTextInput from '../components/QuickTextInput.vue';
import FeedbackToast from '../components/FeedbackToast.vue';

const toast = reactive({ message: '', type: 'success' });

function handleAudio(audioBlob) {
  toast.message = `Audio capturado (${(audioBlob.size / 1024).toFixed(0)} KB)`;
  toast.type = 'success';
  // Full upload implementation: upload to Supabase Storage, then POST /api/ingest with URL
}
</script>
