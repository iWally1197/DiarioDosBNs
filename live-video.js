(() => {
  const section = document.querySelector('.live-video-section');
  const player = document.querySelector('#live-video-player');
  if (!section || !player) return;

  const status = document.querySelector('#live-video-status');
  const title = document.querySelector('#live-video-name');
  const description = document.querySelector('#live-video-description');

  function showOffline(message) {
    player.replaceChildren();
    const empty = document.createElement('div');
    empty.className = 'live-video-empty';
    empty.innerHTML = '<span aria-hidden="true">▶</span><strong>O vídeo ao vivo aparecerá aqui</strong>';
    const text = document.createElement('p');
    text.textContent = message || 'A transmissão ainda não foi configurada.';
    empty.append(text);
    player.append(empty);
    if (status) {
      status.textContent = 'AGUARDANDO TRANSMISSÃO';
      status.classList.remove('is-live');
    }
  }

  function youtubeEmbed(value) {
    let url;
    try { url = new URL(String(value || '').trim()); } catch { return ''; }
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id ? 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) : '';
    }
    if (!['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)) return '';
    if (url.pathname === '/watch') {
      const id = url.searchParams.get('v');
      return id ? 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) : '';
    }
    const parts = url.pathname.split('/').filter(Boolean);
    const marker = parts.findIndex((part) => ['live', 'embed', 'shorts'].includes(part));
    const id = marker >= 0 ? parts[marker + 1] : '';
    return id ? 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) : '';
  }

  async function loadConfig() {
    const module = await import('./src-supabase.js?v=live-admin-settings');
    const client = await module.supabasePromise;
    if (!client) throw new Error(module.supabaseLoadError || 'Serviço de configuração indisponível.');
    const { data, error } = await client.from('site_settings').select('value').eq('key', 'live_video').maybeSingle();
    if (error) throw error;
    return data?.value || { enabled: false };
  }

  loadConfig()
    .then((config) => {
      section.hidden = config.enabled !== true;
      if (section.hidden) return;
      if (title) title.textContent = config.title || 'Diário dos BNs ao vivo';
      if (description) description.textContent = config.description || 'Acompanhe as transmissões e aulas ao vivo do projeto.';
      const src = youtubeEmbed(config.youtube_url);
      if (!src) {
        showOffline(config.youtube_url ? 'O link configurado não é um vídeo válido do YouTube.' : 'A transmissão ainda não foi configurada.');
        return;
      }
      const frame = document.createElement('iframe');
      frame.src = src + '?rel=0&modestbranding=1';
      frame.title = config.title || 'Transmissão ao vivo do Diário dos BNs';
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.allowFullscreen = true;
      player.replaceChildren(frame);
      if (status) {
        status.textContent = 'VÍDEO CONFIGURADO';
        status.classList.add('is-live');
      }
    })
    .catch(() => {
      section.hidden = true;
    });
})();
