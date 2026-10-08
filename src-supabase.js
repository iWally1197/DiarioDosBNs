import { supabaseConfig } from './supabase-config.js';

export const supabaseReady = Boolean(supabaseConfig?.url && supabaseConfig?.publishableKey);
export let supabase = null;
export let supabaseLoadError = '';

const fetchWithTimeout = async (input, init = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  const callerSignal = init.signal;
  const abortFromCaller = () => controller.abort(callerSignal?.reason);
  if (callerSignal?.aborted) abortFromCaller();
  else callerSignal?.addEventListener('abort', abortFromCaller, { once: true });
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    callerSignal?.removeEventListener('abort', abortFromCaller);
  }
};

export const supabasePromise = (async () => {
  if (!supabaseReady) return null;
  let timer;
  try {
    const { createClient } = await Promise.race([
      import('https://esm.sh/@supabase/supabase-js@2'),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('O serviço de login demorou para responder.')), 12000);
      })
    ]);
    clearTimeout(timer);
    supabase = createClient(supabaseConfig.url, supabaseConfig.publishableKey, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      },
      global: { fetch: fetchWithTimeout }
    });
    if (typeof window !== 'undefined') window.diarioSupabase = supabase;
    return supabase;
  } catch (error) {
    clearTimeout(timer);
    supabaseLoadError = error?.message || 'Não foi possível carregar o serviço de login.';
    return null;
  }
})();

if (typeof window !== 'undefined') window.diarioSupabase = null;

