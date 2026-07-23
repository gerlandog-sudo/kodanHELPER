<template>
  <div class="min-h-screen" :style="{ backgroundColor: 'var(--background)' }">
    <!-- Main content -->
    <div class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>

    <!-- Bottom Navigation (solo si hay sesion) -->
    <nav v-if="isLoggedIn" class="bottom-nav">
      <router-link to="/home" class="bottom-nav-item" :class="$route.path === '/home' ? 'active' : ''">
        <span class="nav-icon" v-html="icons.home"></span>
        <span class="nav-label">Inbox</span>
      </router-link>

      <router-link to="/capture" class="bottom-nav-item" :class="$route.path === '/capture' ? 'active' : ''">
        <span class="capture-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </span>
      </router-link>

      <router-link to="/settings" class="bottom-nav-item" :class="$route.path === '/settings' ? 'active' : ''">
        <span class="nav-icon" v-html="icons.settings"></span>
        <span class="nav-label">Ajustes</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase, onAuthChange } from './services/auth.js';
import { useThemeStore } from './stores/theme.js';

const router = useRouter();
const isLoggedIn = ref(false);

// Init theme (ensures CSS vars are applied)
useThemeStore();

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  isLoggedIn.value = !!session;

  onAuthChange((event, session) => {
    isLoggedIn.value = !!session;
    if (!session && router.currentRoute.value.path !== '/login') {
      router.push('/login');
    }
  });
});

const icons = {
  home: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
  settings: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
};
</script>
