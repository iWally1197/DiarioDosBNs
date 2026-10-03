(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector('.theme-toggle');
  const themeLabel = document.querySelector('.theme-label');
  const themeIcon = document.querySelector('.theme-icon');
  const stored = localStorage.getItem('diario-bns-theme');
  const preferred = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  const setTheme = (theme) => {
    root.dataset.theme = theme;
    const light = theme === 'light';
    themeButton?.setAttribute('aria-label', light ? 'Ativar modo escuro' : 'Ativar modo claro');
    if (themeLabel) themeLabel.textContent = light ? 'Modo escuro' : 'Modo claro';
    if (themeIcon) themeIcon.textContent = light ? '☾' : '☼';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', light ? '#f7f8fc' : '#08101f');
  };
  setTheme(stored || preferred);
  themeButton?.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('diario-bns-theme', next);
  });

  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    nav?.classList.toggle('is-open', open);
  });
  nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    toggle?.setAttribute('aria-expanded', 'false');
  }));
  document.querySelectorAll('.year').forEach((year) => { year.textContent = new Date().getFullYear(); });

  const topics = window.DIARIO_TOPICS || [];
  const topicGrid = document.querySelector('#topic-grid');
  if (topicGrid) {
    const topicGroups = [
      {name:'Mecânica', ids:['cinematica','dinamica','estatica','gravitacao','trabalho-energia','quantidade-movimento']},
      {name:'Fluidos e termodinâmica', ids:['hidrostatica','termologia','termodinamica']},
      {name:'Ondas e luz', ids:['ondulatoria','acustica','optica']},
      {name:'Eletricidade e magnetismo', ids:['eletrostatica','eletrodinamica','magnetismo','eletromagnetismo']},
      {name:'Física moderna', ids:['fisica-moderna']},
    ];
    topicGrid.innerHTML = topicGroups.map((group) => {
      const members = group.ids.map((id) => topics.find((topic) => topic.id === id)).filter(Boolean);
      return `<section class="topic-group"><div class="topic-group-heading"><h3>${group.name}</h3><span>${members.length} ${members.length === 1 ? 'tópico' : 'tópicos'}</span></div><div class="topic-links">${members.map((topic) => `
        <a class="topic-link" href="topico.html?topico=${encodeURIComponent(topic.id)}"><span class="topic-link-name">${topic.name}</span><span class="topic-link-count">${topic.animations.length} animações <b aria-hidden="true">↗</b></span></a>`).join('')}
      </div></section>`;
    }).join('');
    const topicSearch = document.querySelector('#topic-search');
    const topicSearchResults = document.querySelector('#topic-search-results');
    topicSearch?.addEventListener('input', () => {
      const query = topicSearch.value.trim().toLocaleLowerCase('pt-BR');
      let shown = 0;
      topicGrid.querySelectorAll('.topic-link').forEach((link) => {
        const id = new URL(link.href).searchParams.get('topico');
        const topic = topics.find((item) => item.id === id);
        const text = topic ? `${topic.name} ${topic.area} ${topic.intro} ${topic.ideas.join(' ')} ${topic.animations.map((animation) => animation.slice(0, 2).join(' ')).join(' ')}` : link.textContent;
        link.hidden = Boolean(query) && !text.toLocaleLowerCase('pt-BR').includes(query);
        if (!link.hidden) shown += 1;
      });
      topicGrid.querySelectorAll('.topic-group').forEach((group) => { group.hidden = !group.querySelector('.topic-link:not([hidden])'); });
      topicSearchResults.textContent = query ? `${shown} ${shown === 1 ? 'tópico encontrado' : 'tópicos encontrados'}.` : '';
    });
  }

  const topicPage = document.querySelector('#topic-page');
  if (topicPage) {
    const id = new URLSearchParams(window.location.search).get('topico');
    const topic = topics.find((item) => item.id === id);
    if (!topic) {
      topicPage.innerHTML = `<section class="section-wrap topic-not-found"><div class="section-kicker">BIBLIOTECA DE FÍSICA</div><h1>Escolha um tópico</h1><p>Não encontrei esse assunto. Volte à biblioteca para escolher entre os tópicos de Física.</p><a class="button button-primary" href="index.html#animacoes">Ver os tópicos <span aria-hidden="true">↗</span></a></section>`;
    } else {
      const ideas = topic.ideas.map((idea) => `<li>${idea}</li>`).join('');
      const savedFavorites = (() => { try { return JSON.parse(localStorage.getItem('diario-bns-favorites') || '[]'); } catch { return []; } })();
      const animations = topic.animations.map(([title, description, filename], i) => {
        const saved = savedFavorites.some((item) => item.topicId === topic.id && item.filename === filename);
        return `
        <article class="topic-animation-card" id="animacao-${filename}">
          <div class="topic-animation-index">${String(i + 1).padStart(2, '0')}</div>
          <div class="topic-animation-copy"><span class="lesson-tag">ANIMAÇÃO BLENDER</span><h3>${title}</h3><p>${description}</p><details class="concept-details"><summary>Explicação e conceitos relacionados</summary><p>${topic.intro}</p><ul>${topic.ideas.map((idea) => `<li>${idea}</li>`).join('')}</ul><p>Use a cena como representação didática e compare o que aparece com equações, gráficos ou uma atividade prática. As dimensões e movimentos do modelo são esquemáticos.</p><p>Arquivo disponível: projeto Blender <strong>.blend</strong>. Vídeo <strong>.mp4</strong>, visualização web <strong>.glb</strong> e ficha <strong>PDF</strong> podem ser adicionados quando esses materiais forem publicados.</p></details><a class="text-link animation-detail-link" href="animacao.html?topico=${encodeURIComponent(topic.id)}&amp;animacao=${encodeURIComponent(filename)}">Ver página desta animação →</a><span class="blend-filename">Arquivo da cena: downloads/${topic.id}-${filename}.blend</span></div>
          <div class="animation-actions"><button class="favorite-toggle" type="button" data-favorite-topic="${topic.id}" data-favorite-file="${filename}" aria-pressed="${saved}" aria-label="${saved ? 'Remover dos favoritos' : 'Salvar como favorita'}: ${title}">${saved ? '★ Favorita' : '☆ Salvar favorita'}</button><a class="blend-download" href="downloads/${topic.id}-${filename}.blend" download aria-label="Baixar projeto Blender: ${title}">Baixar projeto <span>.blend</span><b aria-hidden="true">↓</b></a></div>
        </article>`;
      }).join('');
      topicPage.innerHTML = `
        <section class="topic-hero section-wrap">
          <nav class="breadcrumbs" aria-label="Você está em"><a href="index.html">Início</a><span aria-hidden="true">/</span><a href="index.html#animacoes">Tópicos de Física</a><span aria-hidden="true">/</span><span>${topic.name}</span></nav>
          <div class="topic-hero-grid"><div><div class="eyebrow"><span class="eyebrow-dot"></span>${topic.area.toUpperCase()}</div><h1>${topic.name}</h1><p>${topic.intro}</p></div><div class="topic-hero-mark" aria-hidden="true">${topic.symbol}</div></div>
          <div class="topic-key-ideas"><h2>Neste tópico</h2><ul>${ideas}</ul></div>
        </section>
        <section class="topic-animations"><div class="section-wrap"><div class="section-heading"><div><div class="section-kicker">PROJETOS 3D · ${topic.animations.length} ANIMAÇÕES</div><h2>Explore os <span>conceitos</span></h2></div><p>Baixe o projeto .blend, abra-o no Blender<br>e pressione Espaço para reproduzir.</p></div><div class="topic-animation-list">${animations}</div>
          <aside class="blender-open-note"><span class="note-icon" aria-hidden="true">✦</span><p><strong>Como assistir no Blender:</strong> baixe um projeto e abra-o pelo menu <b>Arquivo → Abrir</b>. Para mostrar o enquadramento final, pressione <kbd>0</kbd> no teclado numérico; pressione <kbd>Espaço</kbd> para reproduzir ou pausar. As cenas são modelos didáticos editáveis: dimensões, cores e movimentos podem ser ajustados.</p></aside>
        </div></section>`;
      document.title = `${topic.name} — Diário dos BNs`;
      try {
        const history = JSON.parse(localStorage.getItem('diario-bns-history') || '[]');
        localStorage.setItem('diario-bns-history', JSON.stringify([{id:topic.id,name:topic.name}, ...history.filter((item) => item.id !== topic.id)].slice(0, 20)));
      } catch {}
      topicPage.querySelectorAll('[data-favorite-topic]').forEach((button) => button.addEventListener('click', () => {
        let favorites = [];
        try { favorites = JSON.parse(localStorage.getItem('diario-bns-favorites') || '[]'); } catch {}
        const keyMatch = (item) => item.topicId === topic.id && item.filename === button.dataset.favoriteFile;
        const isSaved = button.getAttribute('aria-pressed') === 'true';
        if (isSaved) favorites = favorites.filter((item) => !keyMatch(item));
        else {
          const animation = topic.animations.find((item) => item[2] === button.dataset.favoriteFile);
          if (animation) favorites.unshift({topicId:topic.id, topicName:topic.name, filename:animation[2], title:animation[0]});
        }
        try { localStorage.setItem('diario-bns-favorites', JSON.stringify(favorites)); } catch {}
        const nowSaved = !isSaved;
        button.setAttribute('aria-pressed', String(nowSaved));
        button.textContent = nowSaved ? '★ Favorita' : '☆ Salvar favorita';
        button.setAttribute('aria-label', `${nowSaved ? 'Remover dos favoritos' : 'Salvar como favorita'}: ${topic.animations.find((item) => item[2] === button.dataset.favoriteFile)?.[0] || 'animação'}`);
      }));
      if (window.location.hash.startsWith('#animacao-')) requestAnimationFrame(() => topicPage.querySelector(window.location.hash)?.scrollIntoView());
    }
  }
})();
