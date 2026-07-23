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

export async function createItem({ title, category, metadata }) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { data, error } = await supabase
    .from('items')
    .insert({
      title,
      category: category || 'UNCATEGORIZED',
      user_id: user?.id,
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
    body: JSON.stringify({ type: 'text', content: text }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Ingest audio: upload to Supabase Storage + insert raw_input for processing
 */
export async function ingestAudio(audioBlob) {
  // 0. Get authenticated user first (need ID for storage path + insert)
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('No autenticado');

  // 1. Upload to Supabase Storage
  // RLS on audio-uploads requires path: {userId}/{filename}
  const ext = audioBlob.type?.includes('webm') ? 'webm' : 'webm';
  const fileName = `${user.id}/audio-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('audio-uploads')
    .upload(fileName, audioBlob, {
      contentType: audioBlob.type || 'audio/webm',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Error al subir audio: ${uploadError.message}`);
  }

  // 2. Insert into raw_inputs (worker picks it up for transcription + AI)
  const { data, error: insertError } = await supabase
    .from('raw_inputs')
    .insert({
      user_id: user.id,
      type: 'audio',
      content_url: uploadData.path,
      status: 'pending',
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Error al guardar: ${insertError.message}`);
  }

  return data;
}
