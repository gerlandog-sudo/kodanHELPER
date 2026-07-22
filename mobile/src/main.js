import { createApp } from 'vue';
import App from './App.vue';
import { supabase } from './services/auth.js';
import './style.css';

async function renderApp() {
  const app = createApp(App);

  const { data: { session } } = await supabase.auth.getSession();
  app.provide('user', session?.user ?? null);

  app.mount('#app');
}

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  // In a full implementation with a router, redirect based on session
  console.log('Auth state changed:', event, session?.user?.email);
});

renderApp();
