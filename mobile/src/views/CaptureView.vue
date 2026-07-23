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
      <PhotoCapture v-else-if="activeTab === 'photo'" key="photo" />
    </transition>

    <!-- Toast feedback -->
    <transition name="toast">
      <div v-if="toast.visible" class="fixed left-4 right-4 bottom-24 px-4 py-3 rounded-lg text-sm text-center shadow-lg z-50"
        :style="{ backgroundColor: toast.type === 'success' ? 'var(--primary)' : 'var(--error)', color: 'var(--on-primary)' }">
        {{ toast.message }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import AudioRecorder from '../components/AudioRecorder.vue';
import QuickTextInput from '../components/QuickTextInput.vue';
import PhotoCapture from '../components/PhotoCapture.vue';

const activeTab = ref('audio');

const tabs = [
  { id: 'audio', label: 'Audio', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>' },
  { id: 'text', label: 'Texto', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>' },
  { id: 'photo', label: 'Foto', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>' },
];

const toast = reactive({ visible: false, message: '', type: 'success' });

function showToast(msg, type = 'success') {
  toast.message = msg;
  toast.type = type;
  toast.visible = true;
  setTimeout(() => { toast.visible = false; }, 3000);
}

function handleAudio(audioBlob) {
  showToast(`Audio capturado (${(audioBlob.size / 1024).toFixed(0)} KB)`);
}
</script>
