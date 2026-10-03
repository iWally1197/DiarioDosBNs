import { supabaseConfig } from '/supabase-config.js';

export const supabaseReady = Boolean(supabaseConfig?.url && supabaseConfig?.publishableKey);
const { createClient } = supabaseReady
  ? await import('https://esm.sh/@supabase/supabase-js@2')
  : { createClient:null };
export const supabase = supabaseReady
  ? createClient(supabaseConfig.url, supabaseConfig.publishableKey, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    })
  : null;

if (typeof window !== 'undefined') window.diarioSupabase = supabase;
