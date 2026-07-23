<template>
  <div class="flex flex-col items-center gap-6 pt-4">
    <!-- Camera button -->
    <button
      @click="capture"
      :disabled="capturing"
      class="w-24 h-24 rounded-full flex items-center justify-center transition-all"
      :style="{
        backgroundColor: 'var(--primary)',
        color: 'var(--on-primary)',
        boxShadow: '0 0 30px color-mix(in srgb, var(--primary) 20%, transparent)',
      }"
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
    </button>

    <p class="text-sm" style="color: var(--on-surface-variant);">
      {{ capturing ? 'Procesando...' : 'Toma una foto' }}
    </p>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      capture="environment"
      @change="onFileChange"
      class="hidden"
    />

    <!-- Preview -->
    <div v-if="preview" class="w-full max-w-sm rounded-lg overflow-hidden"
      style="border: 1px solid var(--outline-variant);">
      <img :src="preview" alt="Preview" class="w-full h-48 object-cover" />
      <div class="p-3 flex justify-between items-center" style="background-color: var(--surface-container);">
        <span class="text-xs font-mono" style="color: var(--on-surface-variant);">
          {{ previewSize }}
        </span>
        <button @click="sendPhoto" :disabled="sending" class="btn-primary text-sm" style="padding: 0.5rem 1rem;">
          {{ sending ? 'Enviando...' : 'Enviar foto' }}
        </button>
      </div>
    </div>

    <transition name="toast">
      <p v-if="status" class="text-sm" :style="{ color: statusColor }">{{ status }}</p>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { supabase } from '../services/auth.js';
import { createItem } from '../services/api.js';

const fileInput = ref(null);
const capturing = ref(false);
const sending = ref(false);
const preview = ref('');
const previewSize = ref('');
const photoFile = ref(null);
const status = ref('');
const statusColor = ref('');

function capture() {
  fileInput.value?.click();
}

function onFileChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  photoFile.value = file;
  previewSize.value = `${(file.size / 1024).toFixed(0)} KB`;

  const reader = new FileReader();
  reader.onload = (e) => {
    preview.value = e.target.result;
  };
  reader.readAsDataURL(file);

  // Reset input so same file can be re-selected
  event.target.value = '';
}

async function sendPhoto() {
  if (!photoFile.value || sending.value) return;

  sending.value = true;
  status.value = '';
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No session');

    // Upload to Supabase Storage
    const fileName = `photos/${session.user.id}/${Date.now()}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('captures')
      .upload(fileName, photoFile.value, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('captures')
      .getPublicUrl(fileName);

    // Create item with photo reference
    await createItem({
      title: 'Foto capturada',
      category: 'Nota',
      metadata: { photo: publicUrl, fileName },
    });

    status.value = 'Foto guardada!';
    statusColor.value = 'var(--primary)';
    preview.value = '';
    photoFile.value = null;

    setTimeout(() => { status.value = ''; }, 2500);
  } catch (err) {
    status.value = `Error: ${err.message}`;
    statusColor.value = 'var(--error)';
  } finally {
    sending.value = false;
  }
}
</script>
