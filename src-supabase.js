import { supabaseConfig } from './supabase-config.js';

export const supabaseReady = Boolean(supabaseConfig?.url && supabaseConfig?.publishableKey);
const DEFAULT_TIMEOUT_MS = 30000;
const STORAGE_WRITE_TIMEOUT_MS = 120000;

function timeoutFetch(input, init = {}) {
  const baseFetch = globalThis.fetch.bind(globalThis);
  const requestUrl = typeof input === 'string' ? input : (input?.url || '');
  const requestMethod = String(init?.method || input?.method || 'GET').toUpperCase();
  const isStorageWrite = /\/storage\/v1\/object\//i.test(requestUrl) && /^(POST|PUT|PATCH)$/.test(requestMethod);
  const timeoutMs = isStorageWrite ? STORAGE_WRITE_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
  const externalSignal = init?.signal || (typeof Request !== 'undefined' && input instanceof Request ? input.signal : null);
  const controller = new AbortController();
  let timer = 0;
  let abortedByTimeout = false;

  const abortFromCaller = () => controller.abort(externalSignal?.reason);
  if (externalSignal) {
    if (externalSignal.aborted) abortFromCaller();
    else externalSignal.addEventListener('abort', abortFromCaller, { once: true });
  }
  timer = window.setTimeout(() => {
    abortedByTimeout = true;
    controller.abort(new DOMException('A solicitação ao Supabase excedeu o tempo limite.', 'TimeoutError'));
  }, timeoutMs);

  return baseFetch(input, { ...init, signal: controller.signal })
    .catch((error) => {
      if (abortedByTimeout && !externalSignal?.aborted) {
        const timeoutError = new Error(`O Supabase não respondeu em ${Math.round(timeoutMs / 1000)} segundos. Confira sua conexão e o status do projeto.`);
        timeoutError.name = 'SupabaseTimeoutError';
        timeoutError.cause = error;
        throw timeoutError;
      }
      throw error;
    })
    .finally(() => {
      window.clearTimeout(timer);
      externalSignal?.removeEventListener('abort', abortFromCaller);
    });
}

const activeInteractionButtons = new Set();
const interactionTimers = new WeakMap();
const RECOVERY_WINDOW_MS = 35000;

function trackInteraction(button) {
  if (!(button instanceof HTMLButtonElement) || button.dataset.countdownTimer) return;
  if (interactionTimers.has(button)) return;
  activeInteractionButtons.add(button);
  const timer = window.setTimeout(() => {
    interactionTimers.delete(button);
    activeInteractionButtons.delete(button);
    if (button.isConnected && button.disabled && !button.dataset.countdownTimer) {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  }, RECOVERY_WINDOW_MS);
  interactionTimers.set(button, timer);
}

function releaseInteraction(button) {
  const timer = interactionTimers.get(button);
  if (timer) window.clearTimeout(timer);
  interactionTimers.delete(button);
  activeInteractionButtons.delete(button);
  if (button?.isConnected && !button.dataset.countdownTimer) {
    button.disabled = false;
    button.removeAttribute('aria-busy');
  }
}

function humanError(error) {
  const message = String(error?.message || '').trim();
  return message || 'Não foi possível concluir a operação. Confira sua conexão e tente novamente.';
}

function recoverPendingInteractions(error) {
  const message = humanError(error);
  activeInteractionButtons.forEach((button) => {
    if (!button.isConnected) return;
    const form = button.closest('form');
    const status = form?.querySelector('[role="status"], .auth-message, .form-feedback');
    if (status && !status.textContent.trim()) {
      status.textContent = `Não foi possível concluir a operação. ${message}`;
      status.dataset.state = 'error';
    }
    releaseInteraction(button);
  });
}

if (typeof window !== 'undefined' && !window.__diarioBnsResilienceInstalled) {
  window.__diarioBnsResilienceInstalled = true;
  const watchButton = (button) => {
    if (!(button instanceof HTMLButtonElement) || button.disabled) return;
    window.setTimeout(() => {
      if (button.isConnected && button.disabled && !button.dataset.countdownTimer) {
        trackInteraction(button);
        button.setAttribute('aria-busy', 'true');
      }
    }, 0);
  };
  document.addEventListener('click', (event) => { watchButton(event.target?.closest?.('button')); }, true);
  document.addEventListener('submit', (event) => {
    const form = event.target;
    watchButton(event.submitter || form?.querySelector?.('button[type="submit"], button:not([type])'));
  }, true);
  window.addEventListener('unhandledrejection', (event) => {
    recoverPendingInteractions(event.reason);
  });
  window.addEventListener('error', (event) => {
    if (event.error) recoverPendingInteractions(event.error);
  });
}

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
      },
      global: { fetch: timeoutFetch }
    })
  : null;

export { timeoutFetch, recoverPendingInteractions };
if (typeof window !== 'undefined') window.diarioSupabase = supabase;
