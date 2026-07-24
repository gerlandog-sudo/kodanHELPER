import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { fetchItems, fetchRawInputs, updateItem } from '../services/api.js';
import { subscribeToItems, subscribeToRawInputs } from '../services/realtime.js';
import { CATEGORIES } from '../config/categories.js';

export const useItemsStore = defineStore('items', () => {
  const items = ref([]);
  const rawInputs = ref([]);
  const loading = ref(false);
  const loadingRaw = ref(false);
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
  const emails = byCategory.email;

  // Counts
  const totalCount = computed(() => items.value.length);
  const inboxCount = computed(() => items.value.filter(i => i.status === 'inbox').length);

  let unsubscribeItems = null;
  let unsubscribeRawInputs = null;

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

  async function loadRawInputs() {
    loadingRaw.value = true;
    try {
      rawInputs.value = await fetchRawInputs();
    } catch (err) {
      console.error('Error loading raw inputs:', err);
    } finally {
      loadingRaw.value = false;
    }
  }

  async function moveItem(itemId, newCategory, metadata) {
    const idx = items.value.findIndex(i => i.id === itemId);
    if (idx === -1) throw new Error('Item no encontrado');

    // Actualizar en DB
    await updateItem(itemId, {
      category: newCategory,
      metadata: metadata || items.value[idx].metadata,
      status: 'active',
    });

    // Actualizar en store local
    items.value[idx] = {
      ...items.value[idx],
      category: newCategory,
      metadata: metadata || items.value[idx].metadata,
      status: 'active',
    };
  }

  function startRealtime() {
    if (!unsubscribeItems) {
      unsubscribeItems = subscribeToItems((event, item) => {
        if (event === 'insert') {
          items.value.unshift(item);
          // Remover de rawInputs si estaba ahí
          if (item.raw_input_id) {
            rawInputs.value = rawInputs.value.filter(r => r.id !== item.raw_input_id);
          }
        } else if (event === 'update') {
          const idx = items.value.findIndex(i => i.id === item.id);
          if (idx !== -1) {
            items.value[idx] = item;
          }
        }
      });
    }

    if (!unsubscribeRawInputs) {
      unsubscribeRawInputs = subscribeToRawInputs((event, rawInput) => {
        if (event === 'insert') {
          rawInputs.value.unshift(rawInput);
        } else if (event === 'update') {
          const idx = rawInputs.value.findIndex(r => r.id === rawInput.id);
          if (idx !== -1) {
            rawInputs.value[idx] = rawInput;
          }
          // Si fue procesado o falló, remover después de un tiempo
          if (rawInput.status === 'processed' || rawInput.status === 'failed') {
            setTimeout(() => {
              rawInputs.value = rawInputs.value.filter(r => r.id !== rawInput.id);
            }, 3000);
          }
        }
      });
    }
  }

  function stopRealtime() {
    if (unsubscribeItems) {
      unsubscribeItems();
      unsubscribeItems = null;
    }
    if (unsubscribeRawInputs) {
      unsubscribeRawInputs();
      unsubscribeRawInputs = null;
    }
  }

  return {
    items, rawInputs, loading, loadingRaw, error,
    ...byCategory,
    tasks, ideas, meetings, reminders, notes, toResearch, toCall, emails,
    totalCount, inboxCount,
    loadItems, loadRawInputs, moveItem,
    startRealtime, stopRealtime,
  };
});
