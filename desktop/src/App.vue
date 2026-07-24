<template>
  <div class="min-h-screen flex">
    <!-- Sidebar (solo visible si hay sesion) -->
    <aside v-if="isLoggedIn" ref="sidebarRef" class="w-64 glass border-r border-outline-variant p-4 flex flex-col animate-in">
      <h1 class="text-xl font-bold mb-8" style="color: var(--primary); font-family: var(--font-headline);">kodanHELPER</h1>

      <nav ref="navRef" class="relative flex-1 py-1">
        <!-- Sliding indicator bar -->
        <div
          ref="indicatorRef"
          class="absolute left-0 right-0 h-[40px] px-1 pointer-events-none"
          :style="{
            top: indicatorTop + 'px',
            opacity: indicatorTop >= 0 ? 1 : 0,
            transition: 'top 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease',
          }"
        >
          <div class="h-full w-full rounded-lg" style="background: linear-gradient(135deg, var(--primary), var(--primary-container)); box-shadow: 0 0 24px color-mix(in srgb, var(--primary) 30%, transparent);"></div>
        </div>

        <!-- Nav links — direct children of nav para offsetTop correcto -->
        <router-link
          v-for="(item, idx) in navItems"
          :key="item.path"
          :to="item.path"
          :data-nav-index="idx"
          class="nav-link relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-200"
          style="z-index: 1;"
          :class="$route.path === item.path
            ? 'text-white'
            : 'text-on-surface-variant hover:text-on-surface'"
        >
          <span class="flex-shrink-0 w-5 h-5 flex items-center justify-center" v-html="item.icon"></span>
          <span class="truncate">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="pt-4 border-t border-outline-variant space-y-2">
        <router-link
          to="/settings"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-200 text-on-surface-variant hover:text-on-surface"
        >
          <span v-html="settingsIcon"></span>
          Configuracion
        </router-link>
        <button @click="handleLogout" class="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors duration-200 text-on-surface-variant hover:text-on-surface text-left">
          <span v-html="logoutIcon"></span>
          Cerrar sesion
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-auto">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Toast notifications -->
    <AppToast />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase, onAuthChange } from './services/auth.js';
import AppToast from './components/AppToast.vue';

const route = useRoute();
const router = useRouter();
const isLoggedIn = ref(false);
const indicatorTop = ref(-100);
const navRef = ref(null);

onMounted(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    isLoggedIn.value = !!session;
  });

  onAuthChange((event, session) => {
    isLoggedIn.value = !!session;
  });
});

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' },
  { path: '/inbox', label: 'Inbox', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>' },
];

const settingsIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
const logoutIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>';

function updateIndicator() {
  nextTick(() => {
    const navEl = navRef.value;
    if (!navEl) return;
    const activeIdx = navItems.findIndex(item => item.path === route.path);
    if (activeIdx < 0) {
      indicatorTop.value = -100;
      return;
    }
    // Ahora .nav-link son hijos DIRECTOS de navRef — offsetTop es correcto
    const linkEls = navEl.querySelectorAll(':scope > .nav-link');
    const activeLink = linkEls[activeIdx];
    if (activeLink) {
      indicatorTop.value = activeLink.offsetTop;
    }
  });
}

// Watch con flush:'post' para esperar al DOM actualizado
watch(() => route.path, updateIndicator, { flush: 'post' });

onMounted(() => {
  setTimeout(updateIndicator, 150);
});

async function handleLogout() {
  await supabase.auth.signOut();
  router.push('/login');
}
</script>
