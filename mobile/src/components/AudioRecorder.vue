<template>
  <div class="flex flex-col items-center gap-6 pt-4">
    <!-- Record button -->
    <button
      @click="toggleRecording"
      :disabled="granting"
      class="w-24 h-24 rounded-full flex items-center justify-center transition-all"
      :class="isRecording ? 'recorder-active' : ''"
      :style="{
        backgroundColor: isRecording ? 'var(--error)' : 'var(--primary)',
        color: isRecording ? 'white' : 'var(--on-primary)',
        boxShadow: isRecording ? '0 0 40px color-mix(in srgb, var(--error) 30%, transparent)' : '0 0 30px color-mix(in srgb, var(--primary) 20%, transparent)',
      }"
    >
      <svg v-if="!isRecording" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z"/>
        <path d="M17 11a5 5 0 01-10 0H5a7 7 0 0014 0h-2z"/>
        <path d="M11 19.93V22h2v-2.07A7.93 7.93 0 0019 12h-2a6 6 0 01-12 0H5a7.93 7.93 0 006 7.93z"/>
      </svg>
      <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="4" width="4" height="16" rx="1"/>
        <rect x="14" y="4" width="4" height="16" rx="1"/>
      </svg>
    </button>

    <p class="text-sm" style="color: var(--on-surface-variant);">
      {{ isRecording ? 'Toca para detener' : granting ? 'Solicitando micrófono...' : 'Toca para grabar' }}
    </p>

    <!-- Duration -->
    <p v-if="isRecording || duration > 0" class="text-4xl font-bold tabular-nums" style="font-family: var(--font-mono); color: var(--on-surface); letter-spacing: 0.05em;">
      {{ formatDuration(duration) }}
    </p>

    <!-- Waveform animation when recording -->
    <div v-if="isRecording" class="flex items-center gap-0.5 h-8">
      <div v-for="n in 32" :key="n" class="w-1 rounded-full transition-all"
        :style="{
          height: Math.random() * 32 + 4 + 'px',
          backgroundColor: 'var(--primary)',
          opacity: 0.4 + Math.random() * 0.6,
        }">
      </div>
    </div>

    <!-- Status message -->
    <transition name="toast">
      <p v-if="status" class="text-sm" :style="{ color: statusColor }">{{ status }}</p>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['recording-complete']);

const isRecording = ref(false);
const granting = ref(false);
const duration = ref(0);
const status = ref('');
const statusColor = ref('');

let mediaRecorder = null;
let audioChunks = [];
let durationInterval = null;
let waveformInterval = null;

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
    granting.value = true;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    granting.value = false;

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    mediaRecorder = new MediaRecorder(stream, { mimeType });
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: mimeType });
      stream.getTracks().forEach(track => track.stop());
      clearInterval(durationInterval);
      clearInterval(waveformInterval);
      emit('recording-complete', audioBlob);
    };

    mediaRecorder.start();
    isRecording.value = true;
    status.value = '';
    duration.value = 0;

    durationInterval = setInterval(() => { duration.value++; }, 1000);

    // Force reactive update for waveform
    waveformInterval = setInterval(() => {
      // Trigger re-render by updating a dummy ref if needed
    }, 200);

  } catch (err) {
    granting.value = false;
    status.value = err.name === 'NotAllowedError'
      ? 'Permiso denegado. Habilita el microfono en Ajustes.'
      : `Error: ${err.message}`;
    statusColor.value = 'var(--error)';
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    isRecording.value = false;
  }
}
</script>
