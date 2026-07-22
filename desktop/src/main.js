import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import LoginView from './views/LoginView.vue';
import DashboardView from './views/DashboardView.vue';
import InboxView from './views/InboxView.vue';
import SettingsView from './views/SettingsView.vue';
import { supabase } from './services/auth.js';
import './style.css';

const routes = [
  { path: '/login', component: LoginView, name: 'login' },
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: DashboardView, name: 'dashboard', meta: { requiresAuth: true } },
  { path: '/inbox', component: InboxView, name: 'inbox', meta: { requiresAuth: true } },
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
    next('/dashboard');
  } else {
    next();
  }
});

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');
