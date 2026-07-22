<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <header class="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
      <h1 class="text-lg font-bold">kodanHELPER</h1>
      <div class="flex items-center gap-2">
        <span v-if="userEmail" class="text-xs text-slate-500">{{ userEmail }}</span>
        <button v-if="isLoggedIn" @click="logout" class="text-xs text-slate-500 hover:text-slate-300">Salir</button>
      </div>
    </header>
    <main class="p-4">
      <LoginView v-if="!isLoggedIn" />
      <CaptureView v-else />
    </main>
  </div>
</template>

<script setup>
import { ref, inject, onMounted } from 'vue';
import LoginView from './views/LoginView.vue';
import CaptureView from './views/CaptureView.vue';
import { supabase } from './services/auth.js';

const user = inject('user', null);
const isLoggedIn = ref(false);
const userEmail = ref('');

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  isLoggedIn.value = !!session;
  userEmail.value = session?.user?.email || '';

  supabase.auth.onAuthStateChange((event, session) => {
    isLoggedIn.value = !!session;
    userEmail.value = session?.user?.email || '';
  });
});

async function logout() {
  await supabase.auth.signOut();
  isLoggedIn.value = false;
  userEmail.value = '';
}
</script>
