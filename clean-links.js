(function(){
  const script = document.currentScript;
  if (!script) return;
  const siteRoot = new URL('.', script.src).pathname;
  const siteOrigin = location.origin;
  const files = {'acessar-conta.html':'login','admin-laboratorios.html':'admin-laboratorios','admin.html':'admin','aluno.html':'aluno','animacao.html':'animacao','apoie.html':'apoie','auth-callback.html':'auth-callback','auth.html':'login','biblioteca-fisica.html':'biblioteca-fisica','blender.html':'blender','cadastro.html':'cadastro','conta.html':'conta','criar-perfil.html':'cadastro','downloads.html':'downloads','ia.html':'ia','index.html':'','laboratorio-espelhos.html':'laboratorio-espelhos','laboratorio-experimento.html':'laboratorio-experimento','laboratorio-faraday.html':'laboratorio-faraday','laboratorio-magnetismo.html':'laboratorio-magnetismo','laboratorio-mru.html':'laboratorio-mru','laboratorio-mruv.html':'laboratorio-mruv','laboratorio-queda-livre.html':'laboratorio-queda-livre','laboratorio.html':'laboratorio','login.html':'login','minha-area.html':'minha-area','perfil.html':'perfil','pesquisa.html':'pesquisa','privacidade.html':'privacidade','professor.html':'professor','professores.html':'professores','recuperar senha.html':'recuperar-senha','recuperar-senha.html':'recuperar-senha','site.html':'','termos.html':'termos','topico.html':'topico','turma.html':'turma','turmas.html':'turmas'};
  const lower = value => String(value || '').toLocaleLowerCase('pt-BR');
  const routeAliases = Object.freeze({'acessar-conta':'login','auth':'login','criar-perfil':'cadastro'});
  function canonicalPath(pathname) {
    const relative = pathname.startsWith(siteRoot) ? pathname.slice(siteRoot.length) : pathname;
    let parts = relative.split('/').filter(Boolean);
    try { parts = parts.map(part => decodeURIComponent(part)); } catch {}
    let last = lower(parts[parts.length - 1]);
    if (last === 'index.html') parts.pop();
    if (!parts.length) return siteRoot;
    last = lower(parts[parts.length - 1]);
    if (parts.length === 1 && Object.prototype.hasOwnProperty.call(routeAliases, last)) return siteRoot + routeAliases[last] + '/';
    if (!Object.prototype.hasOwnProperty.call(files, last)) return null;
    const slug = files[last];
    return siteRoot + (slug ? encodeURIComponent(slug) + '/' : '');
  }
  function canonicalHref(value) {
    if (!value || value.startsWith('#') || value.startsWith('?')) return null;
    let url; try { url = new URL(value, document.baseURI); } catch { return null; }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    const host = lower(url.hostname);
    if (url.origin !== siteOrigin && host !== 'diariodosbns.com.br' && host !== 'www.diariodosbns.com.br') return null;
    const path = canonicalPath(url.pathname);
    return path ? path + url.search + url.hash : null;
  }
  const currentPath = canonicalPath(location.pathname);
  if (currentPath) { const next = currentPath + location.search + location.hash; if (next !== location.pathname + location.search + location.hash) history.replaceState(history.state, '', next); }
  function update(node) {
    if (!(node instanceof Element)) return;
    const links = node.matches('a[href],area[href]') ? [node] : [...node.querySelectorAll('a[href],area[href]')];
    for (const link of links) { const old = link.getAttribute('href'); if (!old) continue; const next = canonicalHref(old.replace(/&amp;/gi, '&')); if (next && next !== old) link.setAttribute('href', next); }
  }
  document.querySelectorAll('a[href],area[href]').forEach(update);
  new MutationObserver(records => records.forEach(record => { if (record.type === 'attributes') update(record.target); else record.addedNodes.forEach(update); })).observe(document.documentElement, {childList:true,subtree:true,attributes:true,attributeFilter:['href']});
  document.addEventListener('click', event => { const link = event.target instanceof Element ? event.target.closest('a[href],area[href]') : null; if (link) update(link); }, true);
})();
