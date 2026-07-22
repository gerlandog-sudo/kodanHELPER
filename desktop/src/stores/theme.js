import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useThemeStore = defineStore('theme', () => {
  const STORAGE_KEY = 'kodan-helper-theme';

  const theme = ref(localStorage.getItem(STORAGE_KEY) || 'dark');

  function applyTheme(value) {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(value);
  }

  function setTheme(value) {
    theme.value = value;
    localStorage.setItem(STORAGE_KEY, value);
    applyTheme(value);
  }

  function toggle() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark');
  }

  // Apply on init
  applyTheme(theme.value);

  return { theme, setTheme, toggle };
});
