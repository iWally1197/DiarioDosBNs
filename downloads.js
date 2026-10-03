(() => {
  const topics = window.DIARIO_TOPICS || [];
  const search = document.querySelector('#download-search');
  const topicFilter = document.querySelector('#download-topic');
  const results = document.querySelector('#download-results');
  const empty = document.querySelector('#download-empty');
  const summary = document.querySelector('#download-summary');
  if (!results) return;
  const animations = topics.flatMap((topic) => topic.animations.map(([title, description, file]) => ({topic, title, description, file})));
  topics.forEach((topic) => { const option = document.createElement('option'); option.value = topic.id; option.textContent = `${topic.name} · ${topic.animations.length}`; topicFilter.append(option); });
  summary.innerHTML = `<strong>${animations.length}</strong> projetos Blender disponíveis <span>· ${topics.length} tópicos de Física</span>`;
  const render = () => {
    const query = search.value.trim().toLocaleLowerCase('pt-BR');
    const selected = topicFilter.value;
    const filtered = animations.filter(({topic, title, description}) => (!selected || topic.id === selected) && (!query || `${title} ${description} ${topic.name} ${topic.area}`.toLocaleLowerCase('pt-BR').includes(query)));
    results.innerHTML = filtered.map(({topic, title, description, file}) => `<article class="download-result"><div class="download-result-topic">${topic.name}</div><div><h2>${title}</h2><p>${description}</p></div><a class="download-button" href="downloads/${encodeURIComponent(topic.id)}-${encodeURIComponent(file)}.blend" download aria-label="Baixar projeto ${title}, tópico ${topic.name}, arquivo Blender">Baixar <span>.blend</span> <b aria-hidden="true">↓</b></a></article>`).join('');
    empty.hidden = filtered.length > 0;
    summary.setAttribute('aria-label', `${filtered.length} projetos Blender encontrados`);
  };
  search.addEventListener('input', render); topicFilter.addEventListener('change', render); render();
  document.querySelector('#export-csv')?.addEventListener('click', () => {
    const rows = [['Tópico','Área','Animação','Descrição','Arquivo Blender'], ...animations.map(({topic,title,description,file}) => [topic.name,topic.area,title,description,`${topic.id}-${file}.blend`])];
    const csv = '\uFEFF' + rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g,'""')}"`).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8'})); const link = document.createElement('a'); link.href = url; link.download = 'diario-dos-bns-catalogo-fisica.csv'; link.click(); URL.revokeObjectURL(url);
  });
})();
