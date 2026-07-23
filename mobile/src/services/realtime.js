import { supabase } from './auth.js';

export function subscribeToItems(callback) {
  const channel = supabase
    .channel('mobile-items')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'items',
      },
      (payload) => {
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

  return () => {
    supabase.removeChannel(channel);
  };
}
