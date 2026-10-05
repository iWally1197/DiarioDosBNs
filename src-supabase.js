import { supabaseConfig } from './supabase-config.js';

export const supabaseReady = Boolean(supabaseConfig?.url && supabaseConfig?.publishableKey);
export let supabase = null;
export let supabaseLoadError = '';
export const supabasePromise = (async () => {
  if (!supabaseReady) return null;
  try {
    // Carrega em segundo plano: a tela de cadastro/login aparece sem esperar o CDN.
    const { createClient } = await Promise.race([
      import('https://esm.sh/@supabase/supabase-js@2'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('O serviço de login demorou para responder.')), 12000))
    ]);
    const fetchWithTimeout = (input, init = {}) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      const abortFromCaller = () => controller.abort(init.signal?.reason);
      if (init.signal?.aborted) abortFromCaller();
      else init.signal?.addEventListener('abort', abortFromCaller, { once: true });
      return fetch(input, { ...init, signal: controller.signal }).finally(() => {
        clearTimeout(timer);
        init.signal?.removeEventListener('abort', abortFromCaller);
      });
    };
    supabase = createClient(supabaseConfig.url, supabaseConfig.publishableKey, {
      auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      global: { fetch: fetchWithTimeout }
    });
    if (typeof window !== 'undefined') window.diarioSupabase = supabase;
    return supabase;
  } catch (error) {
    supabaseLoadError = error?.message || 'Não foi possível carregar o serviço de login.';
    return null;
  }
})();

if (typeof window !== 'undefined') window.diarioSupabase = supabase;
