const API_BASE = import.meta.env.VITE_API_URL || 'https://helper-api.kodan.software';

export async function getSupabaseToken() {
  const { data: { session } } = await import('./auth.js').then(m => m.supabase.auth.getSession());
  return session?.access_token || null;
}

export async function ingestText(text, token) {
  const response = await fetch(`${API_BASE}/api/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ type: 'text', content: text }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to ingest');
  }

  return response.json();
}
