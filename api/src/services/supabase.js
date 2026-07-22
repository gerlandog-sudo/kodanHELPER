import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

let _supabase = null;
let _supabaseAdmin = null;

export function getSupabase() {
  if (!_supabase) {
    if (!config.supabase.url || !config.supabase.anonKey) {
      return null;
    }
    _supabase = createClient(config.supabase.url, config.supabase.anonKey);
  }
  return _supabase;
}

export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    if (!config.supabase.url || !config.supabase.serviceKey) {
      return null;
    }
    _supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceKey);
  }
  return _supabaseAdmin;
}
