import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { fetchItems } from '../services/api.js';
import { subscribeToItems } from '../services/realtime.js';
import { CATEGORIES } from '../config/categories.js';

export const useItemsStore = defineStore('items', () => {
  const items = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Computed por categoría — se genera automáticamente desde CATEGORIES
  const byCategory = {};
  for (const cat of CATEGORIES) {
    const key = cat.value[0].toLowerCase() + cat.value.slice(1);
    byCategory[key] = computed(() => items.value.filter(i => i.category === cat.value));
  }

  // Alias con nombres semánticos para componentes existentes
  const tasks = byCategory.tarea;
  const ideas = byCategory.idea;
  const meetings = byCategory.reunion;
  const reminders = byCategory.recordatorio;
  const notes = byCategory.nota;
  const toResearch = byCategory.investigar;
  const toCall = byCategory.llamar;

  // Counts
  const totalCount = computed(() => items.value.length);
  const inboxCount = computed(() => items.value.filter(i => i.status === 'inbox').length);

  let unsubscribe = null;

  async function loadItems() {
    loading.value = true;
    try {
      items.value = await fetchItems();
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  function startRealtime() {
    unsubscribe = subscribeToItems((event, item) => {
      if (event === 'insert') {
        items.value.unshift(item);
      } else if (event === 'update') {
        const idx = items.value.findIndex(i => i.id === item.id);
        if (idx !== -1) {
          items.value[idx] = item;
        }
      }
    });
  }

  function stopRealtime() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  }

  return {
    items, loading, error,
    ...byCategory,
    tasks, ideas, meetings, reminders, notes, toResearch, toCall,
    totalCount, inboxCount,
    loadItems, startRealtime, stopRealtime,
  };
});
