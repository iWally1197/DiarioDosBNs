(() => {
  if (window.diarioQuickMenuLoaded) return;
  window.diarioQuickMenuLoaded = true;

  const essentials = [
    ['Início', 'index.html'],
    ['Física', 'index.html#animacoes'],
    ['Turmas', 'turmas.html'],
    ['Downloads', 'downloads.html'],
    ['Aprender Blender', 'blender.html'],
    ['Laboratório', 'laboratorio.html'],
    ['Assistente de Física', 'ia.html'],
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
      display: flex !important; flex: 0 0 46px; flex-direction: column;
      justify-content: center; gap: 5px; width: 46px; height: 46px;
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
    .bnzinho-widget, .bnzinho-restore {
      position: fixed; right: max(14px, env(safe-area-inset-right)); z-index: 10010;
    }
    .bnzinho-widget {
      bottom: max(82px, calc(env(safe-area-inset-bottom) + 72px)); width: 106px;
      transition: opacity .2s ease, transform .2s ease;
    }
    .bnzinho-widget[hidden], .bnzinho-restore[hidden] { display: none !important; }
    .bnzinho-widget__launcher {
      display: block; width: 100%; padding: 0; border: 0; border-radius: 18px;
      color: inherit; background: transparent; text-decoration: none; cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .bnzinho-widget__art {
      position: relative; display: block; width: 100%; aspect-ratio: 230 / 307;
      overflow: hidden; border: 1px solid rgba(219, 190, 119, .82); border-radius: 18px;
      background: #08152b; box-shadow: 0 12px 30px rgba(0,0,0,.4);
      transform-origin: 50% 84%; transition: box-shadow .24s cubic-bezier(.2,.8,.2,1), transform .24s cubic-bezier(.2,.8,.2,1);
    }
    .bnzinho-widget__image {
      display: block; width: 100%; height: 100%; object-fit: cover;
      animation: bnz-breathe 3.4s cubic-bezier(.45,0,.55,1) infinite;
      transform-origin: 50% 82%; will-change: transform;
    }
    .bnzinho-widget__paw {
      position: absolute; display: block; width: 27%; height: 20%; overflow: visible;
      filter: drop-shadow(0 1px 1px rgba(0,0,0,.35)); pointer-events: none;
    }
    .bnzinho-widget__paw--left { left: 17%; top: 55%; transform-origin: 70% 85%; animation: bnz-paw-rest 2.4s ease-in-out infinite; }
    .bnzinho-widget__paw--right { right: 15%; top: 61%; transform-origin: 30% 85%; animation: bnz-paw-rest 2.9s ease-in-out infinite reverse; }
    .bnzinho-widget__nose {
      position: absolute; left: 50%; top: 42%; width: 7px; height: 5px; border-radius: 50%;
      background: #f47b88; box-shadow: 0 0 0 1px rgba(255,255,255,.5);
      transform: translateX(-50%); animation: bnz-sniff 3.1s ease-in-out infinite;
      pointer-events: none;
    }
    .bnzinho-widget__bubble {
      position: absolute; right: 0; bottom: calc(100% + 9px); width: min(230px, calc(100vw - 30px));
      padding: 10px 13px; border: 1px solid var(--gold, #d9bd7a); border-radius: 14px;
      background: var(--surface, #111c30); color: var(--text, #f8fafc);
      box-shadow: 0 8px 26px rgba(0,0,0,.3); font-size: 13px; line-height: 1.45;
      opacity: 0; visibility: hidden; transform: translateY(5px); transition: .18s ease;
      pointer-events: none;
    }
    .bnzinho-widget__bubble::after {
      content: ""; position: absolute; right: 24px; top: 100%; width: 9px; height: 9px;
      border-right: 1px solid var(--gold, #d9bd7a); border-bottom: 1px solid var(--gold, #d9bd7a);
      background: var(--surface, #111c30); transform: translateY(-5px) rotate(45deg);
    }
    .bnzinho-widget__launcher:hover .bnzinho-widget__art,
    .bnzinho-widget__launcher:focus-visible .bnzinho-widget__art {
      box-shadow: 0 16px 36px rgba(0,0,0,.46), 0 0 0 3px rgba(217,189,122,.3);
      transform: translateY(-5px) rotate(-1.5deg) scale(1.04);
    }
    .bnzinho-widget__launcher:hover .bnzinho-widget__bubble,
    .bnzinho-widget__launcher:focus-visible .bnzinho-widget__bubble {
      opacity: 1; visibility: visible; transform: translateY(0);
    }
    .bnzinho-widget__launcher:hover .bnzinho-widget__image,
    .bnzinho-widget__launcher:focus-visible .bnzinho-widget__image { animation: bnz-greet 1.15s cubic-bezier(.35,.05,.55,.95) infinite; }
    .bnzinho-widget__launcher:hover .bnzinho-widget__paw--left,
    .bnzinho-widget__launcher:focus-visible .bnzinho-widget__paw--left { animation: bnz-paw-wave .68s ease-in-out infinite; }
    .bnzinho-widget__launcher:hover .bnzinho-widget__paw--right,
    .bnzinho-widget__launcher:focus-visible .bnzinho-widget__paw--right { animation: bnz-paw-wave .8s ease-in-out infinite reverse; }
    .bnzinho-widget__launcher:hover .bnzinho-widget__nose,
    .bnzinho-widget__launcher:focus-visible .bnzinho-widget__nose { animation: bnz-sniff .34s ease-in-out infinite; }
    .bnzinho-widget__controls { position: absolute; z-index: 2; top: -9px; right: -8px; display: flex; gap: 5px; }
    .bnzinho-widget__control {
      display: grid; width: 27px; height: 27px; place-items: center; padding: 0;
      border: 1px solid rgba(219,190,119,.9); border-radius: 50%;
      background: var(--surface, #111c30); color: var(--text, #f8fafc);
      box-shadow: 0 3px 10px rgba(0,0,0,.3); font: 700 15px/1 sans-serif; cursor: pointer;
    }
    .bnzinho-widget__control:hover, .bnzinho-widget__control:focus-visible { background: var(--gold, #d9bd7a); color: #111827; outline: 2px solid var(--text, #f8fafc); outline-offset: 2px; }
    .bnzinho-widget.is-unpinned { position: absolute; top: var(--bnzinho-page-top, 300px); bottom: auto; }
    .bnzinho-restore {
      bottom: max(82px, calc(env(safe-area-inset-bottom) + 72px)); display: grid;
      width: 54px; height: 54px; place-items: center; padding: 0; overflow: hidden;
      border: 2px solid var(--gold, #d9bd7a); border-radius: 50%;
      background: #08152b; box-shadow: 0 8px 24px rgba(0,0,0,.4); cursor: pointer;
    }
    .bnzinho-restore img { width: 100%; height: 100%; object-fit: cover; }
    .bnzinho-restore:focus-visible { outline: 3px solid var(--text, #f8fafc); outline-offset: 3px; }
    .bnzinho-restore.is-unpinned { position: absolute; top: var(--bnzinho-page-top, 300px); bottom: auto; }
    @keyframes bnz-breathe { 0%,100% { transform: translateY(0) rotate(-.4deg) scale(1); } 50% { transform: translateY(-3px) rotate(.5deg) scale(1.012); } }
    @keyframes bnz-greet { 0%,100% { transform: translateY(0) rotate(-1deg) scale(1); } 25% { transform: translateY(-6px) rotate(1.5deg) scale(1.018); } 55% { transform: translateY(-1px) rotate(-.8deg) scale(1.008); } 78% { transform: translateY(-4px) rotate(1deg) scale(1.014); } }
    @keyframes bnz-paw-rest { 0%,100% { transform: rotate(-4deg) translateY(0); } 50% { transform: rotate(5deg) translateY(-3px); } }
    @keyframes bnz-paw-wave { 0%,100% { transform: rotate(-13deg) translateY(1px); } 28% { transform: rotate(21deg) translateY(-5px); } 58% { transform: rotate(-5deg) translateY(-2px); } 82% { transform: rotate(17deg) translateY(-4px); } }
    @keyframes bnz-sniff { 0%,100% { transform: translateX(-50%) scale(1); } 25% { transform: translateX(-46%) scale(1.16,.86) translateY(-1px); } 52% { transform: translateX(-54%) scale(.92,1.12) translateY(1px); } 76% { transform: translateX(-48%) scale(1.14,.9); } }
    @media (max-width: 560px) {
      .bnzinho-widget { width: 84px; }
      .bnzinho-widget__art { border-radius: 15px; }
      .bnzinho-widget__controls { top: -8px; right: -7px; }
      .bnzinho-widget__bubble { width: min(205px, calc(100vw - 26px)); }
      .bnzinho-restore { width: 50px; height: 50px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .bnzinho-widget *, .bnzinho-widget::before, .bnzinho-widget::after { animation: none !important; transition: none !important; }
    }
    .a11y-motion-reduced .bnzinho-widget *, .a11y-motion-minimal .bnzinho-widget *,
    .a11y-stimulation-minimal .bnzinho-widget * { animation: none !important; transition: none !important; }
  `;
  document.head.append(style);

  const mobileMenu = window.matchMedia('(max-width: 850px)');
  document.querySelectorAll('header.site-header').forEach((header, headerIndex) => {
    let nav = header.querySelector('nav.nav');
    if (!nav) {
      nav = document.createElement('nav');
      nav.className = 'nav';
      nav.setAttribute('aria-label', 'Navegação principal');
      header.append(nav);
    }
    if (!nav.id) nav.id = `quick-site-nav-${headerIndex + 1}`;

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
      toggle.innerHTML = '<span class="sr-only">Abrir acesso rápido</span><span></span><span></span><span></span>';
      header.insertBefore(toggle, nav);
    }
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir acesso rápido');

    const themeToggle = header.querySelector('.theme-toggle');
    header.insertBefore(toggle, themeToggle || null);

    let quickPanel = header.querySelector('.quick-access-panel');
    if (!quickPanel) {
      quickPanel = document.createElement('nav');
      quickPanel.className = 'quick-access-panel';
      quickPanel.setAttribute('aria-label', 'Acesso rápido ao site');
      quickPanel.id = `quick-access-panel-${headerIndex + 1}`;
      essentials.forEach(([label, href]) => {
        const link = document.createElement('a');
        link.href = href;
        link.textContent = label;
        quickPanel.append(link);
      });
      header.append(quickPanel);
    } else if (!quickPanel.id) {
      quickPanel.id = `quick-access-panel-${headerIndex + 1}`;
    }
    toggle.setAttribute('aria-controls', `${nav.id} ${quickPanel.id}`);

    const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';
    const syncMenu = (open, { focus = false, restoreFocus = false } = {}) => {
      const mobile = mobileMenu.matches;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fechar acesso rápido' : 'Abrir acesso rápido');
      nav.hidden = mobile && !open;
      nav.classList.toggle('is-open', mobile && open);
      quickPanel.hidden = mobile || !open;
      quickPanel.classList.toggle('is-open', !mobile && open);
      if (focus) {
        const target = mobile ? nav : quickPanel;
        target.querySelector('a[href]:not([hidden])')?.focus();
      } else if (restoreFocus) {
        toggle.focus();
      }
    };

    syncMenu(false);
    toggle.addEventListener('click', (event) => {
      const open = !isOpen();
      syncMenu(open, { focus: open && event.detail === 0 });
    });

    [nav, quickPanel].forEach((region) => region.addEventListener('click', (event) => {
      if (event.target instanceof Element && event.target.closest('a[href]')) syncMenu(false);
    }));

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !isOpen()) return;
      event.preventDefault();
      syncMenu(false, { restoreFocus: true });
    });

    document.addEventListener('pointerdown', (event) => {
      if (!isOpen()) return;
      const target = event.target;
      if (target instanceof Node && (toggle.contains(target) || nav.contains(target) || quickPanel.contains(target))) return;
      syncMenu(false);
    });

    const onViewportChange = () => {
      const open = isOpen();
      const focusWasInHiddenRegion = mobileMenu.matches && quickPanel.contains(document.activeElement);
      syncMenu(open, { restoreFocus: focusWasInHiddenRegion });
    };
    mobileMenu.addEventListener?.('change', onViewportChange);
  });

  const mascotVisibleKey = 'diario-bnz-widget-visible:v1';
  const mascotPinnedKey = 'diario-bnz-widget-pinned:v1';
  if (!document.getElementById('bnzinho-widget')) {
    const dock = document.createElement('aside');
    dock.id = 'bnzinho-widget';
    dock.className = 'bnzinho-widget';
    dock.setAttribute('aria-label', 'Mascote BNzinho');
    dock.innerHTML = '<div class="bnzinho-widget__controls">' +
      '<button class="bnzinho-widget__control" type="button" data-bnz-pin aria-label="Desafixar BNzinho do canto" aria-pressed="true" title="Desafixar do canto">⌖</button>' +
      '<button class="bnzinho-widget__control" type="button" data-bnz-hide aria-label="Ocultar BNzinho" title="Ocultar">×</button>' +
      '</div><a class="bnzinho-widget__launcher" href="ia.html" aria-label="Abrir conversa com a IA do BNzinho">' +
      '<span class="bnzinho-widget__bubble" aria-hidden="true">Oi! Quer conversar sobre Física? Clique para abrir o chat.</span>' +
      '<span class="bnzinho-widget__art" aria-hidden="true">' +
      '<img class="bnzinho-widget__image" src="assets/mascote-ia-fisica.png" alt="" loading="lazy">' +
      '<svg class="bnzinho-widget__paw bnzinho-widget__paw--left" viewBox="0 0 32 26" aria-hidden="true"><g fill="#d8d2ca" stroke="#49484a" stroke-width="1.15"><ellipse cx="16" cy="18" rx="10.5" ry="7"/><ellipse cx="5.8" cy="10" rx="3.4" ry="4.2"/><ellipse cx="12.3" cy="6.3" rx="3.3" ry="4.2"/><ellipse cx="19.6" cy="6.7" rx="3.2" ry="4.1"/><ellipse cx="26" cy="11" rx="3.2" ry="4.1"/></g><ellipse cx="16" cy="18.5" rx="5" ry="3.2" fill="#ef9ba7"/></svg>' +
      '<svg class="bnzinho-widget__paw bnzinho-widget__paw--right" viewBox="0 0 32 26" aria-hidden="true"><g fill="#d8d2ca" stroke="#49484a" stroke-width="1.15"><ellipse cx="16" cy="18" rx="10.5" ry="7"/><ellipse cx="5.8" cy="10" rx="3.4" ry="4.2"/><ellipse cx="12.3" cy="6.3" rx="3.3" ry="4.2"/><ellipse cx="19.6" cy="6.7" rx="3.2" ry="4.1"/><ellipse cx="26" cy="11" rx="3.2" ry="4.1"/></g><ellipse cx="16" cy="18.5" rx="5" ry="3.2" fill="#ef9ba7"/></svg>' +
      '<span class="bnzinho-widget__nose"></span></span></a>';
    const restore = document.createElement('button');
    restore.type = 'button';
    restore.id = 'bnzinho-widget-restore';
    restore.className = 'bnzinho-restore';
    restore.setAttribute('aria-label', 'Mostrar BNzinho no canto da tela');
    restore.title = 'Mostrar BNzinho';
    restore.innerHTML = '<img src="assets/mascote-ia-fisica.png" alt="" loading="lazy"><span class="sr-only">Mostrar BNzinho</span>';
    document.body.append(dock, restore);

    const hideButton = dock.querySelector('[data-bnz-hide]');
    const pinButton = dock.querySelector('[data-bnz-pin]');
    const launcher = dock.querySelector('.bnzinho-widget__launcher');
    const isStored = (key, defaultValue) => {
      try { const value = localStorage.getItem(key); return value === null ? defaultValue : value === 'true'; } catch { return defaultValue; }
    };
    const save = (key, value) => { try { localStorage.setItem(key, String(value)); } catch {} };
    let visible = isStored(mascotVisibleKey, true);
    let pinned = isStored(mascotPinnedKey, true);
    const positionUnpinned = () => {
      const top = Math.max(16, window.scrollY + window.innerHeight - 210);
      dock.style.setProperty('--bnzinho-page-top', top + 'px');
      restore.style.setProperty('--bnzinho-page-top', top + 'px');
    };
    const syncPinned = () => {
      dock.classList.toggle('is-unpinned', !pinned);
      restore.classList.toggle('is-unpinned', !pinned);
      pinButton.setAttribute('aria-pressed', String(pinned));
      pinButton.setAttribute('aria-label', pinned ? 'Desafixar BNzinho do canto' : 'Fixar BNzinho no canto');
      pinButton.title = pinned ? 'Desafixar do canto' : 'Fixar no canto';
      if (!pinned) positionUnpinned();
    };
    const syncVisible = () => {
      dock.hidden = !visible;
      restore.hidden = visible;
      save(mascotVisibleKey, visible);
    };
    pinButton.addEventListener('click', () => { pinned = !pinned; save(mascotPinnedKey, pinned); syncPinned(); });
    hideButton.addEventListener('click', () => { visible = false; syncVisible(); restore.focus(); });
    restore.addEventListener('click', () => { visible = true; syncVisible(); launcher.focus(); });
    window.addEventListener('resize', () => { if (!pinned) positionUnpinned(); }, { passive: true });
    syncPinned();
    syncVisible();
    const syncFullscreen = () => {
      const fullscreenElement = document.fullscreenElement;
      const insidePageFullscreen = !fullscreenElement || fullscreenElement === document.body || fullscreenElement === document.documentElement || fullscreenElement.contains(dock);
      dock.classList.toggle('is-fullscreen-hidden', !insidePageFullscreen);
      restore.classList.toggle('is-fullscreen-hidden', !insidePageFullscreen);
      dock.hidden = !visible || !insidePageFullscreen;
      restore.hidden = visible || !insidePageFullscreen;
    };
    document.addEventListener('fullscreenchange', syncFullscreen);
  }
})();
