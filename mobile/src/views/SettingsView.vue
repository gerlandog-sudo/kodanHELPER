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

    <!-- Actividad reciente -->
    <section class="glass p-5 mb-4 hover-lift">
      <div class="flex items-center justify-between mb-3">
        <p class="text-sm font-semibold" style="color: var(--on-surface);">Actividad reciente</p>
        <button v-if="activities.length > 0" @click="refreshActivity" class="text-xs" style="color: var(--primary);">Recargar</button>
      </div>

      <div v-if="loadingActivity" class="py-4 text-center text-xs" style="color: var(--on-surface-variant);">
        Cargando...
      </div>

      <div v-else-if="activities.length === 0" class="py-4 text-center text-xs" style="color: var(--on-surface-variant);">
        Aún no hay actividad
      </div>

      <div v-else class="space-y-2 max-h-64 overflow-y-auto">
        <div v-for="item in activities" :key="item.id"
          class="flex items-start gap-3 p-2.5 rounded-lg text-xs"
          :style="{ backgroundColor: 'var(--surface-container-high)' }">
          <!-- Icon -->
          <span class="mt-0.5" style="color: var(--on-surface-variant);">
            <svg v-if="item.type === 'audio'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
            </svg>
          </span>
          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-medium truncate" style="color: var(--on-surface);">
                {{ item.type === 'audio' ? 'Audio' : 'Texto' }}
              </span>
              <span class="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                :style="statusStyle(item.status)">
                {{ statusLabel(item.status) }}
              </span>
            </div>
            <p class="mt-0.5 font-mono" style="color: var(--on-surface-variant);">
              {{ formatTime(item.created_at) }}
            </p>
            <p v-if="item.status === 'failed' && item.error_message" class="mt-0.5" style="color: var(--error);">
              {{ item.error_message }}
            </p>
          </div>
        </div>
      </div>
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
const activities = ref([]);
const loadingActivity = ref(false);

store.$subscribe(() => { theme.value = store.theme; });

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  email.value = session?.user?.email || '';
  refreshActivity();
});

async function refreshActivity() {
  loadingActivity.value = true;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('raw_inputs')
      .select('id, type, status, error_message, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    activities.value = data || [];
  } catch {
    // silent
  } finally {
    loadingActivity.value = false;
  }
}

function statusLabel(status) {
  const map = { pending: 'Pendiente', processing: 'Procesando', processed: 'Completado', failed: 'Error' };
  return map[status] || status;
}

function statusStyle(status) {
  const colors = {
    pending: { backgroundColor: 'rgba(255,193,7,0.15)', color: '#ffc107' },
    processing: { backgroundColor: 'rgba(13,202,240,0.15)', color: '#0dcaf0' },
    processed: { backgroundColor: 'rgba(25,135,84,0.15)', color: '#198754' },
    failed: { backgroundColor: 'rgba(220,53,69,0.15)', color: '#dc3545' },
  };
  return colors[status] || colors.pending;
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

async function handleLogout() {
  await supabase.auth.signOut();
  router.push('/login');
}
</script>
