<template>
  <div class="px-4 pt-4 animate-in">
    <h1 class="text-2xl font-bold mb-6" style="font-family: var(--font-headline); color: var(--on-background);">Ajustes</h1>

    <!-- Theme -->
    <section class="glass p-5 mb-4 hover-lift">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold" style="color: var(--on-surface);">Tema</p>
          <p class="text-xs mt-0.5" style="color: var(--on-surface-variant);">
            {{ theme === 'dark' ? 'Oscuro' : 'Claro' }}
          </p>
        </div>
        <button
          @click="store.toggle()"
          class="relative w-14 h-7 rounded-full transition-colors duration-300"
          :style="{ backgroundColor: theme === 'dark' ? 'var(--primary)' : 'var(--outline-variant)' }"
        >
          <span
            class="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center"
            :class="theme === 'dark' ? 'left-7' : 'left-0.5'"
            style="font-size: 12px;"
          >
            {{ theme === 'dark' ? '🌙' : '☀️' }}
          </span>
        </button>
      </div>
    </section>

    <!-- Account -->
    <section class="glass p-5 mb-4 hover-lift">
      <p class="text-sm font-semibold mb-3" style="color: var(--on-surface);">Cuenta</p>
      <p class="text-xs mb-4" style="color: var(--on-surface-variant);">
        {{ email || 'Sesion iniciada' }}
      </p>
      <button @click="handleLogout" class="btn-secondary w-full text-center text-sm">
        Cerrar sesion
      </button>
    </section>

    <!-- App version -->
    <section class="glass p-5 hover-lift">
      <p class="text-xs font-mono" style="color: var(--on-surface-variant); letter-spacing: 0.05em;">
        kodanHELPER v1.0.0 &middot; PWA
      </p>
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
