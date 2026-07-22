import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

let _supabase = null;

function getSupabase() {
  if (!_supabase) {
    if (!config.supabase.url || !config.supabase.anonKey) {
      return null;
    }
    _supabase = createClient(config.supabase.url, config.supabase.anonKey);
  }
  return _supabase;
}

export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Auth service not configured' });
  }

  const token = header.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = user;
  next();
}
