(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const roles = {aluno:'Aluno', professor:'Professor', admin:'Administrador / dono do site'};
  const form = $('#demo-form');
  const dashboard = $('#portal-dashboard');
  const nameInput = $('#demo-name');
  const roleSelect = $('#demo-role');
  const existing = read('diario-bns-demo-profile', null);
  if (existing && nameInput) { nameInput.value = existing.name || ''; roleSelect.value = existing.role || 'aluno'; }

  const paint = (profile) => {
    if (!dashboard) return;
    const favorites = read('diario-bns-favorites', []);
    const history = read('diario-bns-history', []);
    const done = read('diario-bns-blender-progress', []);
    const classes = read('diario-bns-demo-classes', []);
    const activities = read('diario-bns-demo-activities', []);
    const contentDrafts = read('diario-bns-demo-content-drafts', []);
    const topics = window.DIARIO_TOPICS || [];
    const topicHref = (id) => `topico.html?topico=${encodeURIComponent(id)}`;
    const favoritesView = favorites.length ? favorites.map((item) => `<li><a href="${topicHref(item.topicId)}#animacao-${encodeURIComponent(item.filename)}">${esc(item.title)}</a><span>${esc(item.topicName)}</span></li>`).join('') : '<li class="empty-inline">Ainda não há animações salvas. Abra um tópico e toque em “Salvar favorita”.</li>';
    const historyView = history.length ? history.slice(0, 5).map((item) => `<li><a href="${topicHref(item.id)}">${esc(item.name)}</a><span>Visitado neste navegador</span></li>`).join('') : '<li class="empty-inline">Os tópicos que você visitar aparecerão aqui.</li>';
    const courseSteps = [['interface','Conhecer a interface e a Viewport 3D'],['vista','Navegar entre vistas'],['objetos','Selecionar e transformar objetos'],['animacao','Criar os primeiros quadros-chave']];
    const courseView = courseSteps.map(([id, label]) => `<label class="progress-check"><input type="checkbox" data-course-step="${id}" ${done.includes(id) ? 'checked' : ''}><span>${label}</span></label>`).join('');
    const learnerTools = `
      <section class="portal-card"><div class="lesson-tag">MINHA BIBLIOTECA</div><h3>Animações favoritas</h3><ul class="portal-list">${favoritesView}</ul><a class="text-link" href="index.html#animacoes">Explorar animações →</a></section><section class="portal-card"><div class="lesson-tag">HISTÓRICO</div><h3>Conteúdos recentes</h3><ul class="portal-list">${historyView}</ul></section>
      <section class="portal-card"><div class="lesson-tag">CURSO BLENDER</div><h3>Meu progresso</h3><p>Marque as etapas que você já estudou. O progresso fica salvo neste navegador.</p><div class="course-checklist">${courseView}</div><a class="text-link" href="blender.html#etapas">Continuar o tutorial →</a></section><section class="portal-card"><div class="lesson-tag">ATIVIDADE RÁPIDA</div><h3>Movimento uniforme</h3><p>Em um movimento retilíneo uniforme, a velocidade permanece…</p><form id="quick-activity"><label><input type="radio" name="answer" value="a"> Igual a zero.</label><label><input type="radio" name="answer" value="b"> Constante.</label><label><input type="radio" name="answer" value="c"> Sempre aumentando.</label><button class="button button-primary" type="submit">Conferir resposta</button></form><p id="activity-feedback" class="form-feedback" role="status" aria-live="polite"></p></section>`;
    const achievements = `<section class="portal-card achievement-card"><div class="lesson-tag">CONQUISTAS DE EXPLORAÇÃO</div><h3>Marcos pessoais</h3><div class="achievement-list"><span class="${history.length >= 3 ? 'is-earned' : ''}">◈ Explorador · visitar 3 tópicos</span><span class="${favorites.length >= 1 ? 'is-earned' : ''}">☆ Curador · salvar uma animação</span><span class="${done.length >= courseSteps.length ? 'is-earned' : ''}">✦ Trilha Blender · concluir as etapas</span></div><p>São lembretes locais de participação, não uma avaliação de aprendizagem.</p></section>`;
    const roleContent = profile.role === 'aluno' ? `
      <div class="portal-metrics"><article><b>${favorites.length}</b><span>favoritas</span></article><article><b>${history.length}</b><span>tópicos visitados</span></article><article><b>${done.length}/${courseSteps.length}</b><span>etapas Blender</span></article></div>
      <div class="portal-columns">${learnerTools}${achievements}</div>
      <div class="portal-link-row"><a href="downloads.html">Baixar materiais permitidos <span aria-hidden="true">↗</span></a><a href="laboratorio.html">Experimentar no laboratório <span aria-hidden="true">↗</span></a></div>` : profile.role === 'professor' ? `
      <div class="portal-metrics"><article><b>${favorites.length}</b><span>favoritas</span></article><article><b>${history.length}</b><span>tópicos explorados</span></article><article><b>${classes.length}</b><span>turmas de demonstração</span></article></div>
      <div class="portal-columns">${learnerTools}${achievements}<section class="portal-card"><div class="lesson-tag">RECURSOS DOCENTES</div><h3>Materiais pedagógicos</h3><p>Roteiros, atividade de interpretação e orientações para adaptar as cenas.</p><a class="text-link" href="professores.html">Abrir materiais para professores →</a><a class="text-link" href="downloads.html">Baixar projetos Blender →</a></section><section class="portal-card"><div class="lesson-tag">PLANEJAR AULA</div><h3>Nova turma de demonstração</h3><form id="class-form" class="portal-form"><label>Nome da turma<input name="className" maxlength="60" required placeholder="Ex.: 2º ano B"></label><button class="button button-outline" type="submit">Criar neste navegador</button></form><ul class="portal-list">${classes.map((item) => `<li><b>${esc(item.name)}</b><span>Código de exemplo: ${esc(item.code)}</span></li>`).join('') || '<li class="empty-inline">Nenhuma turma de demonstração criada.</li>'}</ul></section>
      <section class="portal-card"><div class="lesson-tag">ATIVIDADES</div><h3>Preparar uma proposta</h3><form id="assignment-form" class="portal-form"><label>Título da atividade<input name="title" maxlength="100" required placeholder="Ex.: Investigar uma órbita"></label><label>Tópico<select name="topic">${topics.map((topic) => `<option value="${esc(topic.id)}">${esc(topic.name)}</option>`).join('')}</select></label><button class="button button-outline" type="submit">Adicionar à lista local</button></form><ul class="portal-list">${activities.map((item) => `<li><b>${esc(item.title)}</b><span>${esc(item.topicName)} · rascunho local</span></li>`).join('') || '<li class="empty-inline">Seus rascunhos aparecem aqui.</li>'}</ul></section><section class="portal-card"><div class="lesson-tag">CONTEÚDOS PRÓPRIOS</div><h3>Rascunho de material</h3><form id="content-form" class="portal-form"><label>Título<input name="title" maxlength="100" required placeholder="Ex.: Campo magnético no cotidiano"></label><label>Tópico relacionado<select name="topic">${topics.map((topic) => `<option value="${esc(topic.id)}">${esc(topic.name)}</option>`).join('')}</select></label><button class="button button-outline" type="submit">Salvar rascunho local</button></form><ul class="portal-list">${contentDrafts.map((item) => `<li><b>${esc(item.title)}</b><span>${esc(item.topicName)} · não publicado</span></li>`).join('') || '<li class="empty-inline">Seus rascunhos aparecem aqui.</li>'}</ul></section><section class="portal-card"><div class="lesson-tag">ACOMPANHAMENTO DE TURMA</div><h3>Compartilhar e acompanhar</h3><p>O protótipo permite montar turmas e atividades no seu navegador. Para enviar aos alunos, receber respostas e acompanhar o progresso, será necessário conectar contas reais e um servidor.</p><a class="text-link" href="index.html#animacoes">Escolher conteúdos para a aula →</a></section></div>
      <aside class="notice-card"><b>Downloads para docentes</b><p>Os arquivos Blender estão disponíveis a todos nesta versão. Controle de acesso por perfil e compartilhamento seguro ainda precisam de backend.</p><a href="downloads.html">Abrir central de downloads →</a></aside>` : `
      <div class="portal-admin-grid"><article><span class="format-status available">CATÁLOGO ATUAL</span><h3>17 tópicos · 82 projetos</h3><p>Os conteúdos são mantidos nos arquivos locais do site.</p><a class="text-link" href="index.html#animacoes">Ver biblioteca →</a></article><article><span class="format-status planned">REQUER SERVIDOR</span><h3>Animações e vídeos</h3><p>Edição, publicação, exclusão e processamento de vídeos ainda não estão conectados a um painel protegido.</p><a class="text-link" href="downloads.html">Conferir arquivos existentes →</a></article><article><span class="format-status planned">REQUER SERVIDOR</span><h3>Usuários, professores e turmas</h3><p>Não há cadastro central nem banco de dados de estudantes nesta versão.</p><a class="text-link" href="conta.html#account-roadmap-title">Ver requisitos da conta →</a></article><article><span class="format-status planned">REQUER DADOS</span><h3>Estatísticas e moderação</h3><p>O site não envia métricas para nenhum serviço. Não há números de acesso a apresentar.</p><a class="text-link" href="pesquisa.html">Abrir estrutura de pesquisa →</a></article><article><span class="format-status available">CONFIGURAÇÃO LOCAL</span><h3>Conteúdo educativo</h3><p>Atualize textos e conceitos em <code>topicos.js</code>; edite estilo em <code>styles.css</code>.</p><a class="text-link" href="blender.html">Ver guia Blender →</a></article><article><span class="format-status available">MATERIAIS</span><h3>Cursos, atividades e apoio</h3><p>Revise os roteiros antes de usar em sala e adapte-os à turma.</p><a class="text-link" href="professores.html">Abrir área docente →</a></article></div>
      <aside class="notice-card"><b>Painel demonstrativo</b><p>Gerenciar usuários, publicar conteúdo e moderar materiais requer permissões no servidor. O perfil de administrador desta tela não concede acesso privilegiado nem altera o site.</p></aside>`;
    dashboard.innerHTML = `<section class="dashboard-heading"><div><div class="lesson-tag">${esc(roles[profile.role])} · DEMONSTRAÇÃO LOCAL</div><h2>Olá, ${esc(profile.name || roles[profile.role])}.</h2><p>A sessão de demonstração fica neste dispositivo. Favoritas, histórico e progresso permanecem salvos ao sair.</p></div><button id="demo-logout" class="button button-outline" type="button">Sair da demonstração</button></section>${roleContent}`;
    dashboard.hidden = false;
    dashboard.querySelectorAll('[data-course-step]').forEach((box) => box.addEventListener('change', () => {
      const current = read('diario-bns-blender-progress', []);
      const next = box.checked ? [...new Set([...current, box.dataset.courseStep])] : current.filter((item) => item !== box.dataset.courseStep);
      write('diario-bns-blender-progress', next);
      paint(profile);
      dashboard.querySelector('[data-course-step]')?.focus();
    }));
    $('#demo-logout')?.addEventListener('click', () => { localStorage.removeItem('diario-bns-demo-profile'); dashboard.hidden = true; dashboard.innerHTML = ''; $('#demo-feedback').textContent = 'Você saiu da demonstração. Favoritas, histórico e progresso continuam salvos neste navegador.'; });
    $('#quick-activity')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const answer = new FormData(event.currentTarget).get('answer');
      $('#activity-feedback').textContent = answer === 'b' ? 'Isso mesmo: no MRU, a velocidade é constante. O valor pode ser diferente de zero.' : answer ? 'Revise a definição de velocidade constante e tente novamente.' : 'Escolha uma alternativa para conferir.';
    });
    $('#class-form')?.addEventListener('submit', (event) => {
      event.preventDefault(); const field = event.currentTarget.elements.namedItem('className'); const list = read('diario-bns-demo-classes', []);
      list.unshift({name: field.value.trim(), code: `DEMO-${Math.random().toString(36).slice(2, 6).toUpperCase()}`}); write('diario-bns-demo-classes', list); paint(profile);
    });
    $('#assignment-form')?.addEventListener('submit', (event) => {
      event.preventDefault(); const data = new FormData(event.currentTarget); const topic = topics.find((item) => item.id === data.get('topic')); const list = read('diario-bns-demo-activities', []);
      list.unshift({title: String(data.get('title')).trim(), topicId: topic.id, topicName: topic.name}); write('diario-bns-demo-activities', list); paint(profile);
    });
    $('#content-form')?.addEventListener('submit', (event) => {
      event.preventDefault(); const data = new FormData(event.currentTarget); const topic = topics.find((item) => item.id === data.get('topic'));
      const list = read('diario-bns-demo-content-drafts', []); list.unshift({title:String(data.get('title')).trim(), topicId:topic.id, topicName:topic.name});
      write('diario-bns-demo-content-drafts', list); paint(profile);
    });
  };

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const profile = {name: nameInput.value.trim() || 'Visitante', role: roleSelect.value};
      write('diario-bns-demo-profile', profile);
      $('#demo-feedback').textContent = `Modo de demonstração aberto como ${roles[profile.role]}. Nenhuma senha foi solicitada ou armazenada.`;
      paint(profile);
      dashboard.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start'});
    });
  }
  if (existing) paint(existing);
  document.querySelectorAll('[data-account-info]').forEach((button) => button.addEventListener('click', () => {
    const messages = {cadastro:'Cadastro real ainda não está conectado. O modo de demonstração não cria uma identidade nem valida um e-mail.', login:'Login real ainda não está conectado. Use o seletor acima para visualizar uma área de demonstração sem senha.', recuperacao:'Recuperação de senha por e-mail depende de um serviço de autenticação que ainda não foi configurado.'};
    $('#account-info').textContent = messages[button.dataset.accountInfo];
  }));
})();
