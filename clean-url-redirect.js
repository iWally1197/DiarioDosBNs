(function(){
  const script = document.currentScript;
  const siteRoot = new URL('.', script.src);
  let name = window.location.pathname.split('/').filter(Boolean).pop() || '';
  try { name = decodeURIComponent(name); } catch {}
  if (!/\.html$/i.test(name)) return;
  const stem = name.replace(/\.html$/i, '').trim().toLowerCase();
  const slug = stem === 'index' ? '' : stem.replace(/\s+/g, '-');
  const target = slug ? new URL(encodeURIComponent(slug) + '/', siteRoot).pathname : siteRoot.pathname;
  window.location.replace(target + window.location.search + window.location.hash);
})();
