(() => {
  const root = document.querySelector('#animation-detail');
  if (!root) return;
  const params = new URLSearchParams(location.search);
  const topic = (window.DIARIO_TOPICS || []).find((item) => item.id === params.get('topico'));
  const animation = topic?.animations.find((item) => item[2] === params.get('animacao'));
  if (!topic || !animation) {
    root.innerHTML = `<section class="section-wrap topic-not-found"><div class="section-kicker">BIBLIOTECA DE FÍSICA</div><h1>Animação não encontrada</h1><p>Volte ao tópico para escolher outra cena.</p><a class="button button-primary" href="index.html#animacoes">Ver tópicos</a></section>`;
    return;
  }
  const [title, description, file] = animation;
  const blendPath = `downloads/${topic.id}-${file}.blend`;
  const related = topic.ideas.map((idea) => `<li>${idea}</li>`).join('');
  root.innerHTML = `<nav class="breadcrumbs" aria-label="Você está em"><a href="index.html">Início</a><span aria-hidden="true">/</span><a href="index.html#animacoes">Tópicos de Física</a><span aria-hidden="true">/</span><a href="topico.html?topico=${encodeURIComponent(topic.id)}">${topic.name}</a><span aria-hidden="true">/</span><span>${title}</span></nav>
    <section class="animation-detail-hero"><div class="section-kicker">${topic.area.toUpperCase()} · PROJETO BLENDER</div><h1>${title}</h1><p>${description}</p><div class="animation-meta"><span>Tópico: ${topic.name}</span><span>Nível: material de apoio</span><span>Duração: controlada pelo estudante no Blender</span></div><button class="favorite-toggle" type="button" id="detail-favorite" aria-pressed="false">☆ Salvar favorita</button></section>
    <section class="animation-watch" aria-labelledby="watch-title"><div class="section-kicker">ASSISTIR NO BLENDER</div><h2 id="watch-title">Abra a cena e controle o ritmo.</h2><div class="watch-placeholder"><div class="watch-symbol" aria-hidden="true">▶</div><div><b>Vídeo MP4 ainda não publicado</b><p>Para assistir agora, baixe a cena Blender. Abra-a pelo menu Arquivo → Abrir e use Espaço para reproduzir ou pausar. Pressione 0 no teclado numérico para ver pela câmera.</p><a class="button button-primary" href="${blendPath}" download>Baixar animação .blend <span aria-hidden="true">↓</span></a></div></div></section>
    <section class="animation-science"><article><div class="section-kicker">EXPLICAÇÃO CIENTÍFICA</div><h2>O que observar</h2><p>${topic.intro}</p><p>${description} Compare a representação com diagramas, equações e outras formas de descrever o mesmo fenômeno. Os movimentos e dimensões da cena são esquemáticos.</p></article><article><div class="section-kicker">CONCEITOS RELACIONADOS</div><h2>Conecte ideias</h2><ul>${related}</ul><p>Pause a cena quando precisar e converse sobre o que cada elemento representa.</p></article></section>
    <section class="animation-files"><div class="section-kicker">ARQUIVOS E MATERIAIS</div><h2>O que está disponível</h2><div class="format-grid"><article><span class="format-status available">DISPONÍVEL</span><h3>Projeto .blend</h3><p>Abra e edite no Blender.</p><a class="text-link" href="${blendPath}" download>Baixar arquivo →</a></article><article><span class="format-status planned">A ADICIONAR</span><h3>Vídeo .mp4</h3><p>Arquivo de vídeo exportado desta animação.</p></article><article><span class="format-status planned">A ADICIONAR</span><h3>Modelo .glb</h3><p>Modelo para visualização 3D na web.</p></article><article><span class="format-status planned">A ADICIONAR</span><h3>Ficha PDF</h3><p>Material de apoio para atividade ou impressão.</p></article></div></section>
    <aside class="notice-card"><b>Acessibilidade e adaptação</b><p>Controle a velocidade de reprodução no Blender, pause, reveja trechos e ajuste estímulos conforme as necessidades individuais. As preferências variam entre estudantes; converse com quem participa da atividade.</p></aside><div class="animation-backlinks"><a href="topico.html?topico=${encodeURIComponent(topic.id)}">← Voltar a ${topic.name}</a><a href="downloads.html">Abrir central de downloads →</a></div>`;
  document.title = `${title} — Diário dos BNs`;
  try {
    const history = JSON.parse(localStorage.getItem('diario-bns-history') || '[]');
    localStorage.setItem('diario-bns-history', JSON.stringify([{id:topic.id,name:topic.name}, ...history.filter((item) => item.id !== topic.id)].slice(0, 20)));
  } catch {}
  const favoriteButton = document.querySelector('#detail-favorite');
  const readFavorites = () => { try { return JSON.parse(localStorage.getItem('diario-bns-favorites') || '[]'); } catch { return []; } };
  const isSaved = () => readFavorites().some((item) => item.topicId === topic.id && item.filename === file);
  const refresh = () => { const saved = isSaved(); favoriteButton.setAttribute('aria-pressed', String(saved)); favoriteButton.textContent = saved ? '★ Favorita' : '☆ Salvar favorita'; favoriteButton.setAttribute('aria-label', `${saved ? 'Remover dos favoritos' : 'Salvar como favorita'}: ${title}`); };
  refresh();
  favoriteButton.addEventListener('click', () => {
    let favorites = readFavorites();
    if (isSaved()) favorites = favorites.filter((item) => !(item.topicId === topic.id && item.filename === file));
    else favorites.unshift({topicId:topic.id, topicName:topic.name, filename:file, title});
    try { localStorage.setItem('diario-bns-favorites', JSON.stringify(favorites)); } catch {}
    refresh();
  });
})();
