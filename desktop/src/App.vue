<template>
  <div class="min-h-screen flex">
    <!-- Sidebar (solo visible si hay sesion) -->
    <aside v-if="isLoggedIn" class="w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col">
      <h1 class="text-xl font-bold text-white mb-8">kodanHELPER</h1>
      <nav class="space-y-2 flex-1">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="block px-3 py-2 rounded-lg text-sm transition-colors"
          :class="$route.path === item.path ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'"
        >
          {{ item.label }}
        </router-link>
      </nav>
      <button @click="handleLogout" class="text-xs text-slate-500 hover:text-slate-300 pt-4 border-t border-slate-800 text-left">
        Cerrar sesion
      </button>
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
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/inbox', label: 'Inbox' },
];

async function handleLogout() {
  await supabase.auth.signOut();
  router.push('/login');
}
</script>
// trigger redeploy 2026-07-22 18:12

<!-- trigger redeploy 2026-07-22 18:12 -->
