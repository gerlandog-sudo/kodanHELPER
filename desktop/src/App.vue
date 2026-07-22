<template>
  <div class="min-h-screen flex">
    <!-- Sidebar (solo visible si hay sesion) -->
    <aside v-if="isLoggedIn" class="w-64 glass border-r border-outline-variant p-4 flex flex-col">
      <h1 class="text-xl font-bold" style="color: var(--primary); font-family: var(--font-headline); margin-bottom: 2rem;">kodanHELPER</h1>
      <nav class="space-y-1 flex-1">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
          :class="$route.path === item.path
            ? 'text-white font-medium' 
            : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'"
          :style="$route.path === item.path ? { backgroundColor: 'var(--primary)', color: 'var(--on-primary)' } : {}"
        >
          <span v-html="item.icon"></span>
          {{ item.label }}
        </router-link>
      </nav>
      <div class="pt-4 border-t border-outline-variant space-y-2">
        <router-link
          to="/settings"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
        >
          <span v-html="settingsIcon"></span>
          Configuracion
        </router-link>
        <button @click="handleLogout" class="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-all text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface text-left">
          <span v-html="logoutIcon"></span>
          Cerrar sesion
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-auto">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase, onAuthChange } from './services/auth.js';

const router = useRouter();
const isLoggedIn = ref(false);

onMounted(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    isLoggedIn.value = !!session;
  });

  onAuthChange((event, session) => {
    isLoggedIn.value = !!session;
  });
});

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' },
  { path: '/inbox', label: 'Inbox', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>' },
];

const settingsIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
const logoutIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>';

async function handleLogout() {
  await supabase.auth.signOut();
  router.push('/login');
}
</script>
