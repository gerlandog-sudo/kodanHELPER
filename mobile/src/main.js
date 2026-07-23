import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import { useThemeStore } from './stores/theme.js';
import { supabase } from './services/auth.js';
import './style.css';

// Views
import LoginView from './views/LoginView.vue';
import HomeView from './views/HomeView.vue';
import CaptureView from './views/CaptureView.vue';
import SettingsView from './views/SettingsView.vue';

const routes = [
  { path: '/login', component: LoginView, name: 'login' },
  { path: '/', redirect: '/home' },
  { path: '/home', component: HomeView, name: 'home', meta: { requiresAuth: true } },
  { path: '/capture', component: CaptureView, name: 'capture', meta: { requiresAuth: true } },
  { path: '/settings', component: SettingsView, name: 'settings', meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Auth guard
router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (to.meta.requiresAuth && !session) {
    next('/login');
  } else if (to.path === '/login' && session) {
    next('/home');
  } else {
    next();
  }
});

// Init theme store on app creation
const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

// Initialize theme
const themeStore = useThemeStore();

app.mount('#app');

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
