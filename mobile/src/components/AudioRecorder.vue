<template>
  <div class="flex flex-col items-center gap-6 pt-4">
    <!-- Record button -->
    <button
      @click="toggleRecording"
      :disabled="!supported"
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
      {{ statusText }}
    </p>

    <!-- Transcribed text (live while recording, final when done) -->
    <div v-if="transcript" class="w-full glass p-4 rounded-lg text-sm leading-relaxed"
      style="color: var(--on-surface); min-height: 60px; border: 1px solid var(--outline-variant);">
      {{ transcript }}
      <span v-if="isRecording" class="inline-block w-1.5 h-4 ml-0.5 align-text-bottom"
        style="background-color: var(--primary); animation: blink 1s step-end infinite;"></span>
    </div>

    <!-- Send button (only when done transcribing and there's text) -->
    <button v-if="!isRecording && transcript && !sending"
      @click="sendTranscript"
      class="btn-primary"
      style="padding: 0.75rem 2rem;">
      Crear elemento
    </button>

    <!-- Status message -->
    <transition name="toast">
      <p v-if="status" class="text-sm" :style="{ color: statusColor }">{{ status }}</p>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';

const emit = defineEmits(['recording-complete']);

const isRecording = ref(false);
const transcript = ref('');
const status = ref('');
const statusColor = ref('');
const sending = ref(false);

let recognition = null;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const supported = !!SpeechRecognition;

function getStatusText() {
  if (!supported) return 'Dictado no disponible en este navegador';
  if (sending.value) return 'Enviando...';
  if (isRecording.value) return 'Grabando — toca para detener';
  if (transcript.value) return 'Revisa el texto y envíalo';
  return 'Toca para dictar';
}

const statusText = computed(getStatusText);

async function toggleRecording() {
  if (isRecording.value) {
    stopRecording();
  } else {
    await startRecording();
  }
}

async function startRecording() {
  if (!SpeechRecognition) {
    status.value = 'Dictado no soportado en este navegador';
    statusColor.value = 'var(--error)';
    return;
  }

  try {
    // Request mic permission
    await navigator.mediaDevices.getUserMedia({ audio: true });

    recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += text;
        } else {
          interim += text;
        }
      }
      transcript.value = final + interim;
    };

    recognition.onerror = (event) => {
      console.error('SpeechRecognition error:', event.error);
      if (event.error === 'not-allowed') {
        status.value = 'Permiso denegado. Habilita el micrófono.';
      } else if (event.error === 'no-speech') {
        status.value = 'No se detectó voz. Intenta de nuevo.';
      } else {
        status.value = `Error: ${event.error}`;
      }
      statusColor.value = 'var(--error)';
      isRecording.value = false;
    };

    recognition.onend = () => {
      if (isRecording.value) {
        // Restart if it ended unexpectedly (timeout, etc)
        try { recognition.start(); } catch {}
      }
    };

    recognition.start();
    isRecording.value = true;
    transcript.value = '';
    status.value = '';
  } catch (err) {
    status.value = err.name === 'NotAllowedError'
      ? 'Permiso denegado. Habilita el micrófono en Ajustes.'
      : `Error: ${err.message}`;
    statusColor.value = 'var(--error)';
  }
}

function stopRecording() {
  if (recognition) {
    recognition.continuous = false;
    recognition.stop();
    isRecording.value = false;
  }
}

function sendTranscript() {
  if (!transcript.value.trim() || sending.value) return;
  sending.value = true;
  emit('recording-complete', transcript.value.trim());
}

onUnmounted(() => {
  if (recognition) {
    try { recognition.stop(); } catch {}
  }
});
</script>

<script>
// computed is imported separately for the <script setup> above
import { computed } from 'vue';
</script>
