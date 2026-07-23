import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { fetchItems } from '../services/api.js';
import { subscribeToItems } from '../services/realtime.js';

export const useItemsStore = defineStore('items', () => {
  const items = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const filter = ref('ALL');

  const filteredItems = computed(() => {
    if (filter.value === 'ALL') return items.value;
    return items.value.filter(i => i.category === filter.value);
  });

  // Computed by category
  const tasks = computed(() => items.value.filter(i => i.category === 'TASK'));
  const ideas = computed(() => items.value.filter(i => i.category === 'IDEA'));
  const meetings = computed(() => items.value.filter(i => i.category === 'MEETING'));
  const uncategorized = computed(() => items.value.filter(i => i.category === 'UNCATEGORIZED'));

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
    if (unsubscribe) return;
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

  function setFilter(value) {
    filter.value = value;
  }

  return {
    items, loading, error, filter, filteredItems,
    tasks, ideas, meetings, uncategorized,
    totalCount, inboxCount,
    loadItems, startRealtime, stopRealtime, setFilter,
  };
});
