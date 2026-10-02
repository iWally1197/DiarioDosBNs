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
  }

  const topicPage = document.querySelector('#topic-page');
  if (topicPage) {
    const id = new URLSearchParams(window.location.search).get('topico');
    const topic = topics.find((item) => item.id === id);
    if (!topic) {
      topicPage.innerHTML = `<section class="section-wrap topic-not-found"><div class="section-kicker">BIBLIOTECA DE FÍSICA</div><h1>Escolha um tópico</h1><p>Não encontrei esse assunto. Volte à biblioteca para escolher entre os tópicos de Física.</p><a class="button button-primary" href="index.html#animacoes">Ver os tópicos <span aria-hidden="true">↗</span></a></section>`;
    } else {
      const ideas = topic.ideas.map((idea) => `<li>${idea}</li>`).join('');
      const animations = topic.animations.map(([title, description, filename], i) => `
        <article class="topic-animation-card">
          <div class="topic-animation-index">${String(i + 1).padStart(2, '0')}</div>
          <div class="topic-animation-copy"><span class="lesson-tag">ANIMAÇÃO BLENDER</span><h3>${title}</h3><p>${description}</p><span class="blend-filename">downloads/${topic.id}-${filename}.blend</span></div>
          <a class="blend-download" href="downloads/${topic.id}-${filename}.blend" download aria-label="Baixar projeto Blender: ${title}">Baixar projeto <span>.blend</span><b aria-hidden="true">↓</b></a>
        </article>`).join('');
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
    }
  }
})();
