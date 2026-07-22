<template>
  <div class="flex flex-col items-center gap-4">
    <button
      @click="toggleRecording"
      :class="[
        'w-20 h-20 rounded-full flex items-center justify-center transition-all',
        isRecording ? 'bg-red-600 animate-pulse' : 'bg-blue-600 hover:bg-blue-500'
      ]"
    >
      <svg v-if="!isRecording" class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z"/>
        <path d="M17 11a5 5 0 01-10 0H5a7 7 0 0014 0h-2z"/>
        <path d="M11 19.93V22h2v-2.07A7.93 7.93 0 0019 12h-2a6 6 0 01-12 0H5a7.93 7.93 0 006 7.93z"/>
      </svg>
      <svg v-else class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
        <rect x="6" y="4" width="4" height="16" rx="1"/>
        <rect x="14" y="4" width="4" height="16" rx="1"/>
      </svg>
    </button>

    <p class="text-sm text-slate-400">
      {{ isRecording ? 'Grabando... toca para detener' : 'Toca para grabar' }}
    </p>

    <p v-if="duration" class="text-2xl font-mono text-white">
      {{ formatDuration(duration) }}
    </p>

    <p v-if="status" class="text-sm" :class="statusClass">
      {{ status }}
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['recording-complete']);

const isRecording = ref(false);
const duration = ref(0);
const status = ref('');
const statusClass = ref('');

let mediaRecorder = null;
let audioChunks = [];
let durationInterval = null;

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

async function toggleRecording() {
  if (isRecording.value) {
    stopRecording();
  } else {
    await startRecording();
  }
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      stream.getTracks().forEach(track => track.stop());
      clearInterval(durationInterval);
      duration.value = 0;
      emit('recording-complete', audioBlob);
    };

    mediaRecorder.start();
    isRecording.value = true;
    status.value = '';
    duration.value = 0;

    durationInterval = setInterval(() => {
      duration.value++;
    }, 1000);
  } catch (err) {
    status.value = `Error: ${err.message}`;
    statusClass.value = 'text-red-400';
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    isRecording.value = false;
  }
}
</script>
