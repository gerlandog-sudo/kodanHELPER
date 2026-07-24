import { supabase } from './api.js';
import { useNotificationsStore } from '../stores/notifications.js';

export function subscribeToItems(callback) {
  const notifications = useNotificationsStore();

  const channel = supabase
    .channel('desktop-items')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'items',
      },
      (payload) => {
        notifications.showClassified(payload.new.category);
        callback('insert', payload.new);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'items',
      },
      (payload) => {
        callback('update', payload.new);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToRawInputs(callback) {
  const notifications = useNotificationsStore();

  const channel = supabase
    .channel('desktop-raw-inputs')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'raw_inputs',
      },
      (payload) => {
        notifications.showCaptureReceived();
        callback('insert', payload.new);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'raw_inputs',
      },
      (payload) => {
        if (payload.new.status === 'processing') {
          notifications.showProcessing();
        } else if (payload.new.status === 'failed') {
          notifications.showError(payload.new.error_message || 'Error al procesar');
        }
        callback('update', payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
