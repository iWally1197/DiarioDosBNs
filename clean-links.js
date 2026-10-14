(function(){
  const script = document.currentScript;
  const siteRoot = new URL('.', script.src);
  const origin = siteRoot.origin;
  const rootPath = siteRoot.pathname;
  const files = {"acessar-conta.html":"acessar-conta","admin-laboratorios.html":"admin-laboratorios","admin.html":"admin","aluno.html":"aluno","animacao.html":"animacao","apoie.html":"apoie","auth-callback.html":"auth-callback","auth.html":"auth","biblioteca-fisica.html":"biblioteca-fisica","blender.html":"blender","cadastro.html":"cadastro","conta.html":"conta","criar-perfil.html":"criar-perfil","downloads.html":"downloads","ia.html":"ia","index.html":"","laboratorio-espelhos.html":"laboratorio-espelhos","laboratorio-experimento.html":"laboratorio-experimento","laboratorio-faraday.html":"laboratorio-faraday","laboratorio-magnetismo.html":"laboratorio-magnetismo","laboratorio-mru.html":"laboratorio-mru","laboratorio-mruv.html":"laboratorio-mruv","laboratorio-queda-livre.html":"laboratorio-queda-livre","laboratorio.html":"laboratorio","login.html":"login","minha-area.html":"minha-area","perfil.html":"perfil","pesquisa.html":"pesquisa","privacidade.html":"privacidade","professor.html":"professor","professores.html":"professores","recuperar senha.html":"recuperar-senha","recuperar-senha.html":"recuperar-senha","site.html":"site","termos.html":"termos","topico.html":"topico","turma.html":"turma","turmas.html":"turmas"};
  let relativePath = location.pathname.slice(rootPath.length);
  try { relativePath = decodeURIComponent(relativePath); } catch {}
  const fileKey = relativePath.toLowerCase();
  let currentSlug;
  if (Object.prototype.hasOwnProperty.call(files, fileKey)) {
    currentSlug = files[fileKey];
    const target = rootPath + (currentSlug ? encodeURIComponent(currentSlug) + '/' : '');
    const cleanAddress = target + location.search + location.hash;
    if (location.pathname + location.search + location.hash !== cleanAddress) {
      history.replaceState(history.state, '', cleanAddress);
    }
  } else {
    const parts = relativePath.split('/').filter(Boolean);
    if (parts.length && parts[parts.length - 1].toLowerCase() === 'index.html') parts.pop();
    currentSlug = parts.join('/');
  }
  const currentRoute = rootPath + (currentSlug ? currentSlug.split('/').map(encodeURIComponent).join('/') + '/' : '');
  function clean(value) {
    if (!value || /^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith('//')) return null;
    if (value[0] === '#') return currentRoute + value;
    if (value[0] === '?') return currentRoute + value;
    let url;
    try { url = new URL(value, document.baseURI); } catch { return null; }
    if (url.origin !== origin) return null;
    let relative = url.pathname.slice(rootPath.length);
    try { relative = decodeURIComponent(relative); } catch {}
    if (!Object.prototype.hasOwnProperty.call(files, relative.toLowerCase())) return null;
    const slug = files[relative.toLowerCase()];
    return rootPath + (slug ? encodeURIComponent(slug) + '/' : '') + url.search + url.hash;
  }
  function update(node) {
    if (!(node instanceof Element)) return;
    const links = node.matches('a[href],area[href]') ? [node] : [...node.querySelectorAll('a[href],area[href]')];
    for (const link of links) {
      const old = link.getAttribute('href');
      if (!old) continue;
      const next = clean(old.replace(/&amp;/gi, '&'));
      if (next && next !== old) link.setAttribute('href', next);
    }
  }
  document.querySelectorAll('a[href],area[href]').forEach(update);
  new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(update))).observe(document.documentElement, { childList: true, subtree: true });
})();
