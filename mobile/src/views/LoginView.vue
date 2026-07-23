<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-6" :style="{ backgroundColor: 'var(--background)' }">
    <div class="w-full max-w-sm animate-in">
      <h1 class="text-3xl font-bold mb-1 text-center" style="font-family: var(--font-headline); color: var(--primary);">kodanHELPER</h1>
      <p class="mb-10 text-sm text-center" style="color: var(--on-surface-variant);">Organizador Inteligente</p>

      <!-- Email -->
      <form @submit.prevent="loginPassword" class="space-y-3 mb-4">
        <input
          v-model="loginEmail"
          type="email"
          placeholder="tu@email.com"
          class="glass-input w-full"
          required
        />
        <input
          v-model="loginPasswordField"
          type="password"
          placeholder="Contraseña"
          class="glass-input w-full"
          required
        />
        <div class="flex gap-2">
          <button type="submit" :disabled="loading" class="btn-primary flex-1 text-center">
            {{ loading ? 'Entrando...' : 'Entrar' }}
          </button>
          <button type="button" @click="signUp" :disabled="loading" class="btn-secondary flex-1 text-center">
            Crear cuenta
          </button>
        </div>
      </form>

      <!-- Divider -->
      <div class="relative mb-4">
        <div class="absolute inset-0 flex items-center"><span class="w-full border-t" style="border-color: var(--outline-variant);"/></div>
        <div class="relative flex justify-center text-xs"><span class="px-3" style="background-color: var(--background); color: var(--on-surface-variant);">o</span></div>
      </div>

      <!-- Google -->
      <button @click="loginGoogle" :disabled="loading" class="w-full mb-4 px-4 py-3.5 rounded-lg font-medium flex items-center justify-center gap-3 transition-all"
        style="background-color: var(--surface-bright); color: var(--on-surface); border: 1px solid var(--outline-variant);">
        <svg class="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continuar con Google
      </button>

      <!-- Error/Success message -->
      <transition name="toast">
        <p v-if="message" class="mt-4 text-sm text-center" :style="{ color: messageColor }">{{ message }}</p>
      </transition>

      <!-- PWA Install banner (Android) -->
      <div v-if="installEvent" @click="installPWA"
        class="mt-6 p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all active:scale-[0.97]"
        style="background-color: var(--surface-container); border: 1px solid var(--outline-variant);">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style="background: linear-gradient(135deg, #6b38d4, #a855f7);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="6 17 12 23 18 17"/><polyline points="6 5 12 11 18 5"/></svg>
          </div>
          <div>
            <p class="text-sm font-medium" style="color: var(--on-surface);">Instalar kHELPER</p>
            <p class="text-xs" style="color: var(--on-surface-variant);">Acceso rápido desde tu pantalla de inicio</p>
          </div>
        </div>
        <span class="text-lg" style="color: var(--primary);">+</span>
      </div>

      <!-- iOS install hint -->
      <p v-if="isIOS"
        class="mt-5 text-xs text-center leading-relaxed" style="color: var(--on-surface-variant);">
        En iOS: toca <span style="font-weight: 600;">Compartir</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; vertical-align: middle;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        y selecciona <span style="font-weight: 600;">Agregar a pantalla de inicio</span>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { signInWithGoogle, signInWithPassword, signUpWithEmail } from '../services/auth.js';
import { useRouter } from 'vue-router';

const router = useRouter();
const loginEmail = ref('');
const loginPasswordField = ref('');
const loading = ref(false);
const message = ref('');
const messageColor = ref('var(--primary)');
const installEvent = ref(null);
const isIOS = ref(false);

onMounted(() => {
  // Detect iOS
  isIOS.value = /iphone|ipad|ipod/i.test(navigator.userAgent);

  // Listen for the PWA install prompt (Android Chrome)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installEvent.value = e;
  });

  // Track if app was already installed
  window.addEventListener('appinstalled', () => {
    installEvent.value = null;
  });
});

async function installPWA() {
  if (!installEvent.value) return;
  installEvent.value.prompt();
  const result = await installEvent.value.userChoice;
  if (result.outcome === 'accepted') {
    installEvent.value = null;
  }
}

async function loginPassword() {
  loading.value = true;
  message.value = '';
  try {
    await signInWithPassword(loginEmail.value, loginPasswordField.value);
    router.push('/home');
  } catch (err) {
    message.value = `Error: ${err.message}`;
    messageColor.value = 'var(--error)';
  } finally {
    loading.value = false;
  }
}

async function signUp() {
  loading.value = true;
  message.value = '';
  try {
    await signUpWithEmail(loginEmail.value, loginPasswordField.value);
    message.value = 'Cuenta creada! Revisa tu correo.';
    messageColor.value = 'var(--primary)';
  } catch (err) {
    message.value = `Error: ${err.message}`;
    messageColor.value = 'var(--error)';
  } finally {
    loading.value = false;
  }
}

async function loginGoogle() {
  try {
    await signInWithGoogle();
  } catch (err) {
    message.value = `Error: ${err.message}`;
    messageColor.value = 'var(--error)';
  }
}
</script>
