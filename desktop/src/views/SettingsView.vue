<template>
  <div class="p-8 max-w-2xl mx-auto">
    <h1 class="text-3xl font-bold mb-8" style="font-family: var(--font-headline); color: var(--on-background);">Configuracion</h1>

    <!-- Apariencia -->
    <section class="glass p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4" style="color: var(--on-surface);">Apariencia</h2>

      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium" style="color: var(--on-surface);">Tema</p>
          <p class="text-xs mt-0.5" style="color: var(--on-surface-variant);">
            {{ theme === 'dark' ? 'Oscuro' : 'Claro' }} — Luminous Intelligence
          </p>
        </div>

        <button
          @click="store.toggle()"
          class="relative w-16 h-8 rounded-full transition-colors duration-300"
          :style="{ backgroundColor: theme === 'dark' ? 'var(--primary)' : 'var(--outline-variant)' }"
        >
          <span
            class="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center"
            :class="theme === 'dark' ? 'left-9' : 'left-1'"
          >
            <span v-if="theme === 'dark'" style="font-size: 14px;">🌙</span>
            <span v-else style="font-size: 14px;">☀️</span>
          </span>
        </button>
      </div>

      <!-- Preview colors -->
      <div class="mt-6 flex gap-3">
        <div class="w-8 h-8 rounded-full" style="background-color: var(--primary);"></div>
        <div class="w-8 h-8 rounded-full" style="background-color: var(--secondary);"></div>
        <div class="w-8 h-8 rounded-full" style="background-color: var(--tertiary);"></div>
        <div class="w-8 h-8 rounded-full" style="background-color: var(--surface); border: 1px solid var(--outline-variant);"></div>
        <div class="w-8 h-8 rounded-full" style="background-color: var(--surface-container-high);"></div>
      </div>
    </section>

    <!-- Tipografia -->
    <section class="glass p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4" style="color: var(--on-surface);">Tipografia</h2>
      <p class="text-sm mb-1" style="font-family: var(--font-headline); color: var(--on-surface);">
        Headline: Sora — La inteligencia veloz
      </p>
      <p class="text-sm mb-1" style="font-family: var(--font-body); color: var(--on-surface-variant);">
        Body: Inter — Lectura comoda y precisa
      </p>
      <p class="text-sm" style="font-family: var(--font-mono); color: var(--primary);">
        Mono: Geist — Datos y etiquetas tecnicas
      </p>
    </section>

    <!-- Cuenta -->
    <section class="glass p-6">
      <h2 class="text-lg font-semibold mb-4" style="color: var(--on-surface);">Cuenta</h2>
      <p class="text-sm mb-3" style="color: var(--on-surface-variant);">
        Sesion iniciada como <strong style="color: var(--on-surface);">{{ email || '...' }}</strong>
      </p>
      <button @click="handleLogout" class="btn-secondary text-sm">
        Cerrar sesion
      </button>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useThemeStore } from '../stores/theme.js';
import { supabase } from '../services/auth.js';

const router = useRouter();
const store = useThemeStore();
const theme = ref(store.theme);
const email = ref('');

// Sync local ref with store
store.$subscribe(() => { theme.value = store.theme; });

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  email.value = session?.user?.email || '';
});

async function handleLogout() {
  await supabase.auth.signOut();
  router.push('/login');
}
</script>
