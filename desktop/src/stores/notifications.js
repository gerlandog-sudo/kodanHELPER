import { defineStore } from 'pinia';
import { toast } from 'vue-sonner';

export const useNotificationsStore = defineStore('notifications', () => {
  function showCaptureReceived() {
    toast('Captura recibida...', {
      duration: 2000,
      description: 'Preparando procesamiento',
    });
  }

  function showProcessing() {
    toast('Procesando con IA...', {
      duration: 2000,
      description: 'Clasificando contenido',
    });
  }

  function showClassified(category) {
    toast.success(`Clasificado como ${category}`, {
      duration: 3000,
      description: 'Elemento listo en tu tablero',
    });
  }

  function showError(message) {
    toast.error(message, {
      duration: 4000,
      description: 'Ocurrió un error inesperado',
    });
  }

  function showItemMoved(fromCategory, toCategory) {
    toast.success(`Movido de ${fromCategory} a ${toCategory}`, {
      duration: 2500,
    });
  }

  function showItemUpdated() {
    toast.success('Elemento actualizado', {
      duration: 2000,
    });
  }

  function showItemDeleted() {
    toast('Elemento eliminado', {
      duration: 2000,
    });
  }

  return {
    showCaptureReceived,
    showProcessing,
    showClassified,
    showError,
    showItemMoved,
    showItemUpdated,
    showItemDeleted,
  };
});
