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
    @media (max-width: 850px) {
      .site-header { position: sticky; top: 0; z-index: 1000; }
      .site-header .menu-toggle {
        display: flex !important; flex: 0 0 42px; flex-direction: column;
        justify-content: center; gap: 5px; width: 42px; height: 42px;
        margin-left: auto; padding: 0; border: 1px solid var(--line, #334155);
        border-radius: 8px; background: transparent; cursor: pointer;
      }
      .site-header .menu-toggle span:not(.sr-only) {
        display: block; width: 18px; height: 2px; margin-inline: auto;
        border-radius: 2px; background: var(--text, #f8fafc);
      }
      .site-header .nav {
        display: none !important; position: absolute; top: 100%; left: 0; right: 0;
        z-index: 1001; max-height: min(75vh, 560px); overflow-y: auto;
        padding: 12px 22px 18px; background: var(--bg, #08101f);
        border-bottom: 1px solid var(--line, #334155);
        flex-direction: column; align-items: stretch; gap: 0;
      }
      .site-header .nav.is-open { display: flex !important; }
      .site-header .nav > a { min-height: 44px; padding: 12px 4px; border-bottom: 1px solid var(--line, #334155); }
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
    toggle.setAttribute('aria-controls', nav.id);

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
