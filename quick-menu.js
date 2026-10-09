(() => {
  const essentials = [
    ['Início', 'index.html'],
    ['Física', 'index.html#animacoes'],
    ['Turmas', 'turmas.html'],
    ['Downloads', 'downloads.html'],
    ['Aprender Blender', 'blender.html'],
    ['Laboratório', 'laboratorio.html'],
    ['Professores', 'professores.html'],
    ['Pesquisa', 'pesquisa.html'],
    ['Apoiar com Pix', 'apoie.html'],
    ['Entrar', 'login.html'],
    ['Criar conta', 'cadastro.html']
  ];

  const style = document.createElement('style');
  style.textContent = `
    .site-header { position: sticky; top: 0; z-index: 1000; }
    .site-header .menu-toggle {
      display: flex !important; flex: 0 0 42px; flex-direction: column;
      justify-content: center; gap: 5px; width: 42px; height: 42px;
      margin-left: 12px; padding: 0; border: 1px solid var(--line, #334155);
      border-radius: 8px; background: transparent; cursor: pointer;
    }
    .site-header .menu-toggle span:not(.sr-only) {
      display: block; width: 18px; height: 2px; margin-inline: auto;
      border-radius: 2px; background: var(--text, #f8fafc);
    }
    .quick-access-panel {
      display: none; position: absolute; top: 100%; right: 12px; z-index: 1002;
      width: min(320px, calc(100vw - 24px)); max-height: min(75vh, 560px);
      overflow-y: auto; padding: 10px 16px; background: var(--bg, #08101f);
      border: 1px solid var(--line, #334155); border-radius: 0 0 12px 12px;
      box-shadow: 0 14px 35px rgba(0,0,0,.32); flex-direction: column;
    }
    .quick-access-panel.is-open { display: flex; }
    .quick-access-panel a { min-height: 44px; padding: 12px 4px; color: var(--text, #f8fafc); text-decoration: none; border-bottom: 1px solid var(--line, #334155); }
    .quick-access-panel a:focus-visible { outline: 3px solid var(--accent, #e6c477); outline-offset: 2px; }
    @media (max-width: 850px) {
      .site-header .menu-toggle { margin-left: auto; }
      .site-header .nav {
        display: none !important; position: absolute; top: 100%; left: 0; right: 0;
        z-index: 1001; max-height: min(75vh, 560px); overflow-y: auto;
        padding: 12px 22px 18px; background: var(--bg, #08101f);
        border-bottom: 1px solid var(--line, #334155);
        flex-direction: column; align-items: stretch; gap: 0;
      }
      .site-header .nav.is-open { display: flex !important; }
      .site-header .nav > a { min-height: 44px; padding: 12px 4px; border-bottom: 1px solid var(--line, #334155); }
      .quick-access-panel { display: none !important; }
      .quick-menu-extra { display: block !important; }
    }
    @media (min-width: 851px) { .quick-menu-extra { display: none !important; } }
  `;
  document.head.append(style);

  document.querySelectorAll('header.site-header').forEach((header) => {
    let nav = header.querySelector('nav.nav');
    if (!nav) {
      nav = document.createElement('nav');
      nav.className = 'nav';
      nav.setAttribute('aria-label', 'Acesso rápido');
      header.append(nav);
    }
    if (!nav.id) nav.id = 'quick-site-nav';

    essentials.forEach(([label, href]) => {
      let target;
      try { target = new URL(href, document.baseURI); } catch { return; }
      const exists = Array.from(nav.querySelectorAll('a')).some((link) => {
        try {
          const current = new URL(link.getAttribute('href'), document.baseURI);
          return current.pathname === target.pathname && current.hash === target.hash;
        } catch { return false; }
      });
      if (exists) return;
      const link = document.createElement('a');
      link.className = 'quick-menu-extra';
      link.href = href;
      link.textContent = label;
      nav.append(link);
    });

    let toggle = header.querySelector('.menu-toggle');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.className = 'menu-toggle';
      toggle.type = 'button';
      toggle.setAttribute('aria-label', 'Abrir acesso rápido');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = '<span class="sr-only">Abrir menu</span><span></span><span></span><span></span>';
      header.insertBefore(toggle, nav);
    }
    const themeToggle = header.querySelector('.theme-toggle');
    header.insertBefore(toggle, themeToggle || null);

    let quickPanel = header.querySelector('.quick-access-panel');
    if (!quickPanel) {
      quickPanel = document.createElement('nav');
      quickPanel.className = 'quick-access-panel';
      quickPanel.setAttribute('aria-label', 'Acesso rápido ao site');
      quickPanel.id = 'quick-access-panel';
      essentials.forEach(([label, href]) => {
        const link = document.createElement('a');
        link.href = href;
        link.textContent = label;
        quickPanel.append(link);
      });
      header.append(quickPanel);
    }
    toggle.setAttribute('aria-controls', `${nav.id} ${quickPanel.id}`);

    if (toggle.dataset.diarioQuickPanelBound !== 'true') {
      toggle.dataset.diarioQuickPanelBound = 'true';
      toggle.addEventListener('click', () => {
        const open = !quickPanel.classList.contains('is-open');
        quickPanel.classList.toggle('is-open', open);
      });
    }
    quickPanel.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      quickPanel.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir acesso rápido');
    }));

    if (toggle.dataset.diarioMenuBound !== 'true') {
      toggle.dataset.diarioMenuBound = 'true';
      toggle.addEventListener('click', () => {
        const open = toggle.getAttribute('aria-expanded') !== 'true';
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Fechar acesso rápido' : 'Abrir acesso rápido');
        nav.classList.toggle('is-open', open);
      });
    }
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir acesso rápido');
    }));
  });
})();
