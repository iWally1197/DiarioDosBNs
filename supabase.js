import { supabaseConfig } from '../supabase-config.js';

export const supabaseReady = Boolean(supabaseConfig?.url && supabaseConfig?.publishableKey);
export let supabaseLoadError = '';
let createClient = null;
if (supabaseReady) {
  try {
    // Evita que um bloqueio ou falha no CDN deixe a página de conta presa para sempre.
    const sdk = await Promise.race([
      import('https://esm.sh/@supabase/supabase-js@2'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('O serviço de login demorou para responder.')), 12000))
    ]);
    createClient = sdk.createClient;
  } catch (error) {
    supabaseLoadError = error?.message || 'Não foi possível carregar o serviço de login.';
  }
}
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
export const supabase = supabaseReady && createClient
  ? createClient(supabaseConfig.url, supabaseConfig.publishableKey, {
      auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      global: { fetch: fetchWithTimeout }
    })
  : null;

if (typeof window !== 'undefined') window.diarioSupabase = supabase;
