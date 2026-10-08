import { supabaseConfig } from './supabase-config.js';

const root = document.querySelector('#pix-content');
if (root) {
  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  async function loadSupportInfo() {
    if (!supabaseConfig?.url || !supabaseConfig?.publishableKey) {
      root.innerHTML = '<p>As informações de apoio ainda não estão disponíveis.</p>';
      return;
    }

    try {
      const endpoint = new URL('/rest/v1/site_settings', supabaseConfig.url);
      endpoint.searchParams.set('select', 'value');
      endpoint.searchParams.set('key', 'eq.pix');
      endpoint.searchParams.set('limit', '1');
      const response = await fetch(endpoint, {
        headers: {
          apikey: supabaseConfig.publishableKey,
          Authorization: 'Bearer ' + supabaseConfig.publishableKey,
          Accept: 'application/json'
        }
      });
      if (!response.ok) throw new Error('A consulta pública falhou.');
      const rows = await response.json();
      const value = rows[0]?.value || {};
      const key = String(value.pix_key || '').trim();
      const qr = String(value.qr_image_url || '').trim();
      const validQr = /^https:\/\//i.test(qr);
      if (!key) {
        root.innerHTML = '<p>A chave PIX ainda não foi configurada. Volte mais tarde.</p>';
        return;
      }
      root.innerHTML = '<div class="pix-layout">' +
        (validQr
          ? '<figure class="pix-qr"><img src="' + escapeHtml(qr) + '" alt="QR Code para contribuir com o Diário dos BNs"><figcaption>Leia o QR Code com o aplicativo do seu banco.</figcaption></figure>'
          : '<div class="pix-qr pix-qr-empty">O QR Code ainda não foi adicionado.</div>') +
        '<div class="pix-key-block"><p>' + escapeHtml(value.instructions || 'Sua contribuição apoia a continuidade do projeto.') + '</p><p class="pix-key-label">Chave PIX</p><code class="pix-key-value">' + escapeHtml(key) + '</code><button class="button button-primary" type="button" data-copy-pix>Copiar chave PIX</button><p data-pix-copy-status role="status" aria-live="polite"></p></div></div>';
      root.querySelector('[data-copy-pix]')?.addEventListener('click', async (event) => {
        const button = event.currentTarget;
        const status = root.querySelector('[data-pix-copy-status]');
        try {
          await navigator.clipboard.writeText(key);
          status.textContent = 'Chave PIX copiada.';
        } catch {
          window.prompt('Copie a chave PIX:', key);
          status.textContent = 'Selecione e copie a chave PIX.';
        }
        button.focus();
      });
    } catch {
      root.innerHTML = '<p>Não foi possível carregar as informações de apoio. Tente novamente mais tarde.</p>';
    }
  }

  loadSupportInfo();
}
