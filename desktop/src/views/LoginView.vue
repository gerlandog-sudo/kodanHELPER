<template>
  <div class="min-h-screen flex items-center justify-center" style="background-color: var(--background);">
    <div class="glass-elevated p-8 w-full max-w-md animate-in">
      <h1 class="text-2xl font-bold mb-2" style="font-family: var(--font-headline); color: var(--primary);">kodanHELPER</h1>
      <p class="mb-8 text-sm" style="color: var(--on-surface-variant);">Organizador Inteligente de Ideas, Tareas y Reuniones</p>

      <button
        @click="loginGoogle"
        class="w-full mb-4 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
        style="background-color: var(--surface-bright); color: var(--on-surface); border: 1px solid var(--outline-variant);"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continuar con Google
      </button>

      <div class="relative mb-4">
        <div class="absolute inset-0 flex items-center"><span class="w-full border-t" style="border-color: var(--outline-variant);"/></div>
        <div class="relative flex justify-center text-xs"><span class="px-2" style="background-color: var(--surface-container-low); color: var(--on-surface-variant);">o</span></div>
      </div>

      <!-- Email / Password -->
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
          <button type="submit" :disabled="loading" class="btn-primary flex-1">
            {{ loading ? 'Entrando...' : 'Iniciar sesión' }}
          </button>
          <button type="button" @click="signUp" :disabled="loading" class="btn-secondary flex-1">
            Registrarse
          </button>
        </div>
      </form>

      <div class="relative mb-4">
        <div class="absolute inset-0 flex items-center"><span class="w-full border-t" style="border-color: var(--outline-variant);"/></div>
        <div class="relative flex justify-center text-xs"><span class="px-2" style="background-color: var(--surface-container-low); color: var(--on-surface-variant);">o</span></div>
      </div>

      <form @submit.prevent="loginMagicLink" class="space-y-3">
        <input
          v-model="magicEmail"
          type="email"
          placeholder="tu@email.com"
          class="glass-input w-full"
          required
        />
        <button type="submit" :disabled="sending" class="btn-primary w-full">
          {{ sending ? 'Enviando...' : 'Enviar Magic Link' }}
        </button>
      </form>

      <p v-if="message" class="mt-4 text-sm text-center" :style="{ color: messageClass }">{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { signInWithGoogle, signInWithMagicLink, signInWithPassword, signUpWithEmail } from '../services/auth.js';
import { useRouter } from 'vue-router';

const router = useRouter();
const loginEmail = ref('');
const loginPasswordField = ref('');
const magicEmail = ref('');
const loading = ref(false);
const sending = ref(false);
const message = ref('');
const messageClass = ref('var(--primary)');

async function loginPassword() {
  loading.value = true;
  message.value = '';
  try {
    await signInWithPassword(loginEmail.value, loginPasswordField.value);
    router.push('/dashboard');
  } catch (err) {
    message.value = `Error: ${err.message}`;
    messageClass.value = 'var(--error)';
  } finally {
    loading.value = false;
  }
}

async function signUp() {
  loading.value = true;
  message.value = '';
  try {
    await signUpWithEmail(loginEmail.value, loginPasswordField.value);
    message.value = 'Cuenta creada! Revisa tu correo para confirmar.';
    messageClass.value = 'var(--primary)';
  } catch (err) {
    message.value = `Error: ${err.message}`;
    messageClass.value = 'var(--error)';
  } finally {
    loading.value = false;
  }
}

async function loginGoogle() {
  try {
    await signInWithGoogle();
  } catch (err) {
    message.value = `Error: ${err.message}`;
    messageClass.value = 'var(--error)';
  }
}

async function loginMagicLink() {
  sending.value = true;
  message.value = '';
  try {
    await signInWithMagicLink(magicEmail.value);
    message.value = 'Magic link enviado! Revisa tu correo.';
    messageClass.value = 'var(--primary)';
  } catch (err) {
    message.value = `Error: ${err.message}`;
    messageClass.value = 'var(--error)';
  } finally {
    sending.value = false;
  }
}
</script>
