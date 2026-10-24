import { supabasePromise } from './src-supabase.js';

const mirrors = Object.freeze([
  { tab: 'tab-plano', slug: 'lab-espelho-plano' },
  { tab: 'tab-concavo', slug: 'lab-espelho-concavo' },
  { tab: 'tab-convexo', slug: 'lab-espelho-convexo' },
  { tab: 'tab-parabolico', slug: 'lab-espelho-parabolico' }
]);

const status = document.getElementById('mirror-publication-status');
const retry = document.getElementById('mirror-publication-retry');

async function loadPublishedMirrors() {
  if (!status || !retry) return;
  retry.hidden = true;
  status.hidden = false;
  status.textContent = 'Verificando quais laboratórios de espelhos estão publicados…';

  try {
    const supabase = await supabasePromise;
    if (!supabase) throw new Error('O serviço de publicação não está disponível.');

    const { data, error } = await supabase
      .from('animations')
      .select('slug,is_published')
      .in('slug', mirrors.map((mirror) => mirror.slug))
      .eq('is_published', true);

    if (error) throw error;

    const published = new Set((data || [])
      .filter((record) => record?.is_published === true)
      .map((record) => record.slug));

    for (const mirror of mirrors) {
      const tab = document.getElementById(mirror.tab);
      const panel = tab && document.getElementById(tab.getAttribute('aria-controls'));
      const visible = published.has(mirror.slug);
      if (tab) tab.hidden = !visible;
      if (panel) panel.hidden = true;
    }

    if (!published.size) {
      status.textContent = 'No momento, nenhum laboratório de espelhos está publicado.';
      return;
    }

    const firstPublished = mirrors.find((mirror) => published.has(mirror.slug));
    status.hidden = true;
    window.dispatchEvent(new CustomEvent('mirror-labs-available', {
      detail: { selectedTabId: firstPublished?.tab }
    }));
  } catch {
    for (const mirror of mirrors) {
      const tab = document.getElementById(mirror.tab);
      const panel = tab && document.getElementById(tab.getAttribute('aria-controls'));
      if (tab) tab.hidden = true;
      if (panel) panel.hidden = true;
    }
    status.textContent = 'Não foi possível consultar quais laboratórios estão publicados. Verifique sua conexão e tente novamente.';
    retry.hidden = false;
  }
}

retry?.addEventListener('click', () => {
  retry.disabled = true;
  void loadPublishedMirrors().finally(() => { retry.disabled = false; });
});

void loadPublishedMirrors();
