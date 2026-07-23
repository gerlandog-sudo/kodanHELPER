import { supabase } from './auth.js';

export async function fetchItems() {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchItemsByCategory(category) {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createItem({ title, category, source, metadata }) {
  const { data, error } = await supabase
    .from('items')
    .insert({
      title,
      category: category || 'UNCATEGORIZED',
      source: source || 'mobile',
      metadata: metadata || {},
      status: 'inbox',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Ingest text via the helper API (AI processing on server)
 */
export async function ingestText(text, token) {
  const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://helper-api.kodan.software'}/api/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text, source: 'mobile' }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Ingest audio via the helper API (transcription + AI processing)
 */
export async function ingestAudio(audioBlob, token) {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('source', 'mobile');

  const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://helper-api.kodan.software'}/api/ingest/audio`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}
