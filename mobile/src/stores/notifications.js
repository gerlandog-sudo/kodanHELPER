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

  function showItemCompleted() {
    toast.success('Elemento completado', {
      duration: 2500,
    });
  }

  function showItemCancelled() {
    toast('Elemento cancelado', {
      duration: 2500,
    });
  }

  function showItemUpdated() {
    toast.success('Elemento actualizado', {
      duration: 2000,
    });
  }

  return {
    showCaptureReceived,
    showProcessing,
    showClassified,
    showError,
    showItemCompleted,
    showItemCancelled,
    showItemUpdated,
  };
});
