(() => {
  if (window.diarioAccessibilityLoaded) return;
  window.diarioAccessibilityLoaded = true;

  const SETTINGS_KEY = 'diario-bns:accessibility-settings:v1';
  const defaults = {
    movement: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'normal',
    stimulation: 'complete', contrast: false, focus: false, simplified: false,
    readableFont: false, highlightParagraphs: false, textScale: 1, lineHeight: 1.7,
    letterSpacing: 0, textWidth: 72, playbackRate: 1, volume: 0.7, muted: false, captions: false,
    captionSize: 1.1, captionContrast: 'high',
    learningMode: 'conceptual'
  };
  let settings = readSettings();
  let guide = null;
  let speechActive = false;
  const safeStore = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  const safeRemove = (key) => { try { localStorage.removeItem(key); } catch {} };
  function readSettings() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') || {}; } catch {}
    const bounded = (value, fallback, min, max) => Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Number(value))) : fallback;
    return {
      ...defaults,
      movement: ['normal','reduced','minimal'].includes(saved.movement) ? saved.movement : defaults.movement,
      stimulation: ['complete','reduced','minimal'].includes(saved.stimulation) ? saved.stimulation : defaults.stimulation,
      contrast: Boolean(saved.contrast), focus: Boolean(saved.focus), simplified: Boolean(saved.simplified),
      readableFont: Boolean(saved.readableFont), highlightParagraphs: Boolean(saved.highlightParagraphs),
      textScale: bounded(saved.textScale, defaults.textScale, 1, 1.6), lineHeight: bounded(saved.lineHeight, defaults.lineHeight, 1.4, 2.2),
      letterSpacing: bounded(saved.letterSpacing, defaults.letterSpacing, 0, 0.12), textWidth: bounded(saved.textWidth, defaults.textWidth, 48, 95),
      playbackRate: [0.25,0.5,1,1.5,2].includes(Number(saved.playbackRate)) ? Number(saved.playbackRate) : defaults.playbackRate,
      volume: bounded(saved.volume, defaults.volume, 0, 1), muted: typeof saved.muted === 'boolean' ? saved.muted : defaults.muted,
      captions: Boolean(saved.captions), captionSize: bounded(saved.captionSize, defaults.captionSize, 0.8, 1.8),
      captionContrast: ['normal','high','yellow'].includes(saved.captionContrast) ? saved.captionContrast : defaults.captionContrast,
      learningMode: ['conceptual','visual','advanced'].includes(saved.learningMode) ? saved.learningMode : defaults.learningMode
    };
  }

  const launcher = document.createElement('button');
  launcher.type = 'button'; launcher.className = 'a11y-launcher'; launcher.id = 'a11y-launcher';
  launcher.setAttribute('aria-haspopup', 'dialog'); launcher.setAttribute('aria-controls', 'a11y-dialog'); launcher.setAttribute('aria-expanded', 'false');
  launcher.innerHTML = '<span aria-hidden="true">◉</span> Acessibilidade';

  const dialog = document.createElement('dialog');
  dialog.className = 'a11y-dialog'; dialog.id = 'a11y-dialog'; dialog.setAttribute('aria-labelledby', 'a11y-title');
  dialog.innerHTML = `
    <header class="a11y-dialog-header"><div><p class="section-kicker">DIÁRIO DOS BNs</p><h2 id="a11y-title">Central de Acessibilidade</h2><p>Escolha os recursos que funcionam para você. Cada controle pode ser ajustado separadamente.</p></div><button type="button" class="a11y-close" aria-label="Fechar acessibilidade" data-a11y-close>×</button></header>
    <div class="a11y-dialog-body">
      <section class="a11y-group" aria-labelledby="a11y-sensory-title"><h3 id="a11y-sensory-title">Movimento e estímulos</h3>
        <label class="a11y-control" for="a11y-movement"><span><strong>Movimento da página</strong><small>Reduz transições e movimentos decorativos. O movimento dos vídeos é controlado separadamente.</small></span><select id="a11y-movement" data-setting="movement"><option value="normal">Normal</option><option value="reduced">Reduzido</option><option value="minimal">Mínimo</option></select></label>
        <label class="a11y-control" for="a11y-stimulation"><span><strong>Estímulos visuais</strong><small>Controla estrelas, brilhos, partículas e efeitos de fundo.</small></span><select id="a11y-stimulation" data-setting="stimulation"><option value="complete">Completos</option><option value="reduced">Reduzidos</option><option value="minimal">Mínimos</option></select></label>
        <label class="a11y-check"><input type="checkbox" data-setting="focus"><span><strong>Modo foco</strong><small>Destaca o conteúdo principal e reduz elementos decorativos.</small></span></label>
        <p>Se quiser, aplique uma sugestão e depois ajuste cada controle. Nenhuma sugestão é ativada por informações de perfil.</p><div class="a11y-mode-options" aria-label="Sugestões de acessibilidade"><button type="button" data-a11y-preset="low-stimulation">Menos estímulos</button><button type="button" data-a11y-preset="low-vision">Baixa visão</button><button type="button" data-a11y-preset="screen-reader">Leitor de tela</button><button type="button" data-a11y-preset="deaf">Legendas</button></div>
      </section>
      <section class="a11y-group" aria-labelledby="a11y-reading-title"><h3 id="a11y-reading-title">Leitura e visão</h3>
        <label class="a11y-check"><input type="checkbox" data-setting="contrast"><span><strong>Alto contraste</strong><small>Texto claro, links destacados e contornos mais visíveis.</small></span></label>
        <label class="a11y-check"><input type="checkbox" data-setting="readableFont"><span><strong>Fonte sem serifa</strong><small>Usa uma fonte simples já disponível no aparelho.</small></span></label>
        <label class="a11y-check"><input type="checkbox" data-setting="simplified"><span><strong>Leitura confortável</strong><small>Melhora a largura e o espaçamento do texto. Não reescreve o conteúdo científico.</small></span></label>
        <label class="a11y-check"><input type="checkbox" data-setting="highlightParagraphs"><span><strong>Destacar parágrafo</strong><small>Realça o parágrafo sob o ponteiro ou foco do teclado.</small></span></label>
        <label class="a11y-control" for="a11y-text-scale"><span><strong>Tamanho do texto</strong><small><output data-output="textScale">100%</output></small></span><input id="a11y-text-scale" type="range" min="1" max="1.6" step="0.05" data-setting="textScale" aria-label="Tamanho geral do conteúdo"></label>
        <label class="a11y-control" for="a11y-line-height"><span><strong>Espaçamento entre linhas</strong><small><output data-output="lineHeight">1,7</output></small></span><input id="a11y-line-height" type="range" min="1.4" max="2.2" step="0.1" data-setting="lineHeight" aria-label="Espaçamento entre linhas"></label>
        <label class="a11y-control" for="a11y-letter-spacing"><span><strong>Espaçamento entre letras</strong><small><output data-output="letterSpacing">0</output></small></span><input id="a11y-letter-spacing" type="range" min="0" max="0.12" step="0.02" data-setting="letterSpacing" aria-label="Espaçamento entre letras"></label>
        <label class="a11y-control" for="a11y-text-width"><span><strong>Largura de leitura</strong><small><output data-output="textWidth">72 caracteres</output></small></span><input id="a11y-text-width" type="range" min="48" max="95" step="1" data-setting="textWidth" aria-label="Largura das linhas de texto"></label>
      </section>
      <section class="a11y-group" aria-labelledby="a11y-learning-title"><h3 id="a11y-learning-title">Forma de aprender</h3><p>Troque de modo quando quiser. Eles não dependem de qualquer informação de perfil.</p>
        <div class="a11y-mode-options" role="group" aria-label="Modo de aprendizagem"><button type="button" data-learning-mode="conceptual">Conceitual</button><button type="button" data-learning-mode="visual">Visual</button><button type="button" data-learning-mode="advanced">Aprofundado</button></div>
        <button class="a11y-action" type="button" data-start-guide>Iniciar modo passo a passo</button><p class="a11y-help">O guia acompanha os títulos da página, salva a etapa neste navegador e inclui uma pergunta para reflexão. A resposta não é enviada.</p>
      </section>
      <section class="a11y-group" aria-labelledby="a11y-media-title"><h3 id="a11y-media-title">Vídeos, áudio e narração</h3>
        <label class="a11y-check"><input type="checkbox" data-setting="muted"><span><strong>Manter som desligado</strong><small>Desativa o áudio de vídeos HTML desta página. Em vídeos incorporados, use o controle do próprio player. Nada começa a tocar automaticamente.</small></span></label>
        <label class="a11y-check"><input type="checkbox" data-setting="captions"><span><strong>Mostrar legendas disponíveis</strong><small>Ativa faixas de legenda já fornecidas junto ao vídeo.</small></span></label>
        <label class="a11y-control" for="a11y-caption-size"><span><strong>Tamanho das legendas</strong><small><output data-output="captionSize">110%</output></small></span><input id="a11y-caption-size" type="range" min="0.8" max="1.8" step="0.1" data-setting="captionSize" aria-label="Tamanho das legendas"></label>
        <label class="a11y-control" for="a11y-caption-contrast"><span><strong>Contraste das legendas</strong></span><select id="a11y-caption-contrast" data-setting="captionContrast"><option value="normal">Padrão</option><option value="high">Alto contraste</option><option value="yellow">Texto amarelo em fundo preto</option></select></label>
        <label class="a11y-control" for="a11y-speed"><span><strong>Velocidade dos vídeos</strong><small><output data-output="playbackRate">1×</output></small></span><select id="a11y-speed" data-setting="playbackRate"><option value="0.25">0,25×</option><option value="0.5">0,5×</option><option value="1">1×</option><option value="1.5">1,5×</option><option value="2">2×</option></select></label>
        <label class="a11y-control" for="a11y-volume"><span><strong>Volume máximo</strong><small><output data-output="volume">70%</output></small></span><input id="a11y-volume" type="range" min="0" max="1" step="0.05" data-setting="volume" aria-label="Volume máximo dos vídeos"></label>
        <div class="a11y-mode-options"><button type="button" data-speech>Ouvir conteúdo principal</button><button type="button" data-speech-stop disabled>Parar narração</button></div>
        <p class="a11y-help">Controles de velocidade e legenda valem para vídeos do site com esses recursos. Em vídeos incorporados, use também os controles do próprio player. A narração usa a voz disponível no seu aparelho.</p>
      </section>
      <section class="a11y-group a11y-self-report" aria-labelledby="a11y-profile-title"><h3 id="a11y-profile-title">Minha forma de aprender</h3><p>As respostas são opcionais e ficam somente neste navegador. Não são enviadas ao site. Em dispositivo compartilhado, evite registrar informações sensíveis.</p><div data-self-report-editor><p role="status">Estas informações são opcionais e ficam somente neste navegador.</p></div></section>
    </div>
    <footer class="a11y-dialog-footer"><button type="button" class="a11y-action a11y-reset" data-reset>Restaurar configurações de acessibilidade</button><button type="button" class="a11y-close-action" data-a11y-close>Fechar</button><p role="status" aria-live="polite" data-a11y-status></p></footer>`;

  document.body.append(launcher, dialog);
  const status = dialog.querySelector('[data-a11y-status]');
  const profileEditor = dialog.querySelector('[data-self-report-editor]');
  const guideRegion = document.createElement('section');
  guideRegion.className = 'a11y-guide'; guideRegion.setAttribute('aria-live', 'polite'); guideRegion.hidden = true;
  guideRegion.innerHTML = '<div><p class="a11y-guide-progress" data-guide-progress></p><h2 data-guide-title></h2><p data-guide-text></p><p data-guide-question hidden>O que você observou nesta etapa? Pense ou explique com suas palavras antes de avançar.</p></div><div class="a11y-guide-actions"><button type="button" data-guide-previous>Voltar</button><button type="button" data-guide-pause>Pausar</button><button type="button" data-guide-next>Avançar</button><button type="button" data-guide-restart>Recomeçar</button><button type="button" data-guide-exit>Encerrar</button></div>';
  document.body.append(guideRegion);

  function currentProfileKey() { return 'diario-bns:accessibility-profile:v1'; }
  function buildProfileEditor(profile = {}) {
    profileEditor.innerHTML = `<fieldset><legend>Como você prefere personalizar sua experiência?</legend>
      <label><input type="radio" name="a11y-edit-identity" value="neurotypical"> Neurotípico</label>
      <label><input type="radio" name="a11y-edit-identity" value="neurodivergent"> Neurodivergente</label>
      <label><input type="radio" name="a11y-edit-identity" value="prefer-not"> Prefiro não informar</label></fieldset>
      <fieldset data-edit-conditions hidden><legend>Características ou condições (múltipla escolha, opcional)</legend>
      <p>Lista informativa, não universal nem diagnóstica.</p>
      <strong>Neurodesenvolvimento e aprendizagem</strong>
      ${[['TEA','Transtorno do Espectro Autista (TEA)'],['TDAH','TDAH'],['Dislexia','Dislexia'],['Discalculia','Discalculia'],['Disgrafia','Disgrafia'],['Dispraxia / coordenação','Dispraxia / coordenação'],['Desenvolvimento da linguagem','Transtorno do Desenvolvimento da Linguagem'],['Outro perfil de aprendizagem','Outros perfis relacionados à aprendizagem']].map(([v,l])=>`<label><input type="checkbox" name="a11y-edit-condition" value="${v}"> ${l}</label>`).join('')}
      <strong>Comunicação e outras características</strong>
      ${[['Dificuldades específicas de linguagem','Dificuldades específicas de linguagem'],['Processamento da linguagem','Dificuldades de processamento da linguagem'],['Outra condição de linguagem','Outras relacionadas à linguagem'],['Tourette','Síndrome de Tourette'],['Transtornos específicos de aprendizagem','Transtornos específicos de aprendizagem'],['Outra condição ou característica','Outras condições ou características']].map(([v,l])=>`<label><input type="checkbox" name="a11y-edit-condition" value="${v}"> ${l}</label>`).join('')}
      <label for="a11y-edit-other">Outra — especificar (opcional)</label><input id="a11y-edit-other" maxlength="120">
      <label><input type="checkbox" data-edit-prefer-not> Prefiro não informar condições</label></fieldset>
      <div class="a11y-profile-actions"><button class="a11y-action" type="button" data-profile-save>Salvar neste navegador</button><button class="a11y-action" type="button" data-profile-delete>Apagar informação opcional</button></div>
      <p role="status" aria-live="polite" data-profile-status></p>`;
    const identity = ['neurotypical','neurodivergent','prefer-not'].includes(profile.identity) ? profile.identity : '';
    const radio = identity ? profileEditor.querySelector(`input[name="a11y-edit-identity"][value="${identity}"]`) : null;
    if (radio) radio.checked = true;
    const conditions = profileEditor.querySelector('[data-edit-conditions]');
    conditions.hidden = identity !== 'neurodivergent';
    const savedConditions = Array.isArray(profile.conditions) ? profile.conditions : [];
    profileEditor.querySelectorAll('input[name="a11y-edit-condition"]').forEach((input) => { input.checked = savedConditions.includes(input.value); });
    profileEditor.querySelector('#a11y-edit-other').value = profile.other || '';
    profileEditor.querySelectorAll('input[name="a11y-edit-identity"]').forEach((input) => input.addEventListener('change', () => { conditions.hidden = input.value !== 'neurodivergent' || !input.checked; }));
    const preferNot = profileEditor.querySelector('[data-edit-prefer-not]');
    preferNot.checked = Boolean(profile.preferNotConditions);
    const checkboxes = [...profileEditor.querySelectorAll('input[name="a11y-edit-condition"]')];
    preferNot.addEventListener('change', () => { if (preferNot.checked) checkboxes.forEach((input) => { input.checked = false; }); });
    checkboxes.forEach((input) => input.addEventListener('change', () => { if (input.checked) preferNot.checked = false; }));
    profileEditor.querySelector('[data-profile-save]').addEventListener('click', () => {
      const identityValue = profileEditor.querySelector('input[name="a11y-edit-identity"]:checked')?.value || '';
      const report = { identity: identityValue, conditions: identityValue === 'neurodivergent' && !preferNot.checked ? checkboxes.filter((input) => input.checked).map((input) => input.value) : [], preferNotConditions: identityValue === 'neurodivergent' && preferNot.checked, other: identityValue === 'neurodivergent' && !preferNot.checked ? profileEditor.querySelector('#a11y-edit-other').value.trim() : '', updatedAt: new Date().toISOString() };
      const key = currentProfileKey();
      if (!key) return;
      if (!identityValue) { safeRemove(key); profileEditor.querySelector('[data-profile-status]').textContent = 'Nenhuma informação pessoal foi selecionada ou guardada.'; return; }
      safeStore(key, report); profileEditor.querySelector('[data-profile-status]').textContent = 'Salvo neste navegador. Essa informação não foi enviada ao site.';
    });
    profileEditor.querySelector('[data-profile-delete]').addEventListener('click', () => {
      const key = currentProfileKey(); if (key) safeRemove(key);
      buildProfileEditor({});
      const message = profileEditor.querySelector('[data-profile-status]'); if (message) message.textContent = 'Informação opcional apagada deste navegador.';
    });
  }
  function refreshProfileEditor() {
    let profile = {};
    try { profile = JSON.parse(localStorage.getItem(currentProfileKey()) || '{}'); } catch {}
    buildProfileEditor(profile);
  }

  function updateOutputs() {
    dialog.querySelectorAll('[data-output]').forEach((node) => {
      const key = node.dataset.output; const value = settings[key];
      node.textContent = key === 'textScale' || key === 'volume' ? `${Math.round(Number(value) * 100)}%` : key === 'captionSize' ? `${Math.round(Number(value) * 100)}%` : key === 'lineHeight' ? Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : key === 'letterSpacing' ? `${Number(value).toLocaleString('pt-BR')} em` : key === 'textWidth' ? `${value} caracteres` : key === 'captionContrast' ? ({normal:'Padrão',high:'Alto contraste',yellow:'Amarelo/preto'}[value]||'Padrão') : `${value}×`;
    });
  }
  function syncControls() {
    dialog.querySelectorAll('[data-setting]').forEach((input) => {
      const key = input.dataset.setting; const value = settings[key];
      if (input.type === 'checkbox') input.checked = Boolean(value); else input.value = String(value);
    });
    dialog.querySelectorAll('[data-learning-mode]').forEach((button) => { button.setAttribute('aria-pressed', String(button.dataset.learningMode === settings.learningMode)); });
    updateOutputs();
  }
  function applySettings() {
    const body = document.body;
    body.classList.toggle('a11y-motion-reduced', settings.movement === 'reduced');
    body.classList.toggle('a11y-motion-minimal', settings.movement === 'minimal');
    body.classList.toggle('a11y-stimulation-reduced', settings.stimulation === 'reduced');
    body.classList.toggle('a11y-stimulation-minimal', settings.stimulation === 'minimal');
    body.classList.toggle('a11y-high-contrast', settings.contrast);
    body.classList.toggle('a11y-focus-mode', settings.focus);
    body.classList.toggle('a11y-reading-comfort', settings.simplified);
    body.classList.toggle('a11y-readable-font', settings.readableFont);
    body.classList.toggle('a11y-highlight-paragraphs', settings.highlightParagraphs);
    body.classList.toggle('a11y-caption-high', settings.captionContrast === 'high');
    body.classList.toggle('a11y-caption-yellow', settings.captionContrast === 'yellow');
    body.dataset.learningMode = settings.learningMode;
    document.documentElement.style.setProperty('--a11y-scale', String(settings.textScale));
    document.documentElement.style.setProperty('--a11y-line-height', String(settings.lineHeight));
    document.documentElement.style.setProperty('--a11y-letter-spacing', `${settings.letterSpacing}em`);
    document.documentElement.style.setProperty('--a11y-text-width', `${settings.textWidth}ch`);
    document.documentElement.style.setProperty('--a11y-caption-size', `${settings.captionSize}em`);
    document.documentElement.style.setProperty('--a11y-motion-duration', settings.movement === 'minimal' ? '0s' : settings.movement === 'reduced' ? '.01s' : '.25s');
    document.querySelectorAll('video,audio').forEach((media) => {
      media.muted = Boolean(settings.muted);
      media.volume = Number(settings.volume);
      if (media instanceof HTMLVideoElement) media.playbackRate = Number(settings.playbackRate);
      [...(media.textTracks || [])].forEach((track) => { if (['captions','subtitles'].includes(track.kind)) track.mode = settings.captions ? 'showing' : 'disabled'; });
      if (media.autoplay) { media.autoplay = false; media.pause(); }
    });
    dialog.querySelectorAll('[data-learning-mode]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.learningMode === settings.learningMode)));
    if (settings.learningMode === 'advanced') document.querySelectorAll('main details.concept-details').forEach((details) => { details.open = true; });
    if (settings.muted && speechActive && 'speechSynthesis' in window) speechSynthesis.cancel();
    updateOutputs();
    safeStore(SETTINGS_KEY, settings);
  }
  syncControls(); applySettings();

  launcher.addEventListener('click', async () => { await refreshProfileEditor(); dialog.showModal(); launcher.setAttribute('aria-expanded', 'true'); dialog.querySelector('[data-a11y-close]').focus(); });
  dialog.querySelectorAll('[data-a11y-close]').forEach((button) => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('close', () => { launcher.setAttribute('aria-expanded', 'false'); launcher.focus(); });
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog.querySelectorAll('[data-setting]').forEach((input) => input.addEventListener('input', () => {
    const key = input.dataset.setting;
    settings[key] = input.type === 'checkbox' ? input.checked : (input.type === 'range' || input.tagName === 'SELECT' && ['playbackRate','textScale','lineHeight','letterSpacing','textWidth','volume','captionSize'].includes(key) ? Number(input.value) : input.value);
    applySettings();
  }));
  dialog.querySelectorAll('[data-learning-mode]').forEach((button) => button.addEventListener('click', () => { settings.learningMode = button.dataset.learningMode; applySettings(); syncControls(); status.textContent = `Modo ${button.textContent.toLocaleLowerCase('pt-BR')} selecionado.`; }));
  dialog.querySelectorAll('[data-a11y-preset]').forEach((button) => button.addEventListener('click', () => {
    const preset = button.dataset.a11yPreset;
    if (preset === 'low-stimulation') settings = { ...settings, movement: 'reduced', stimulation: 'minimal', focus: true, muted: true };
    if (preset === 'low-vision') settings = { ...settings, contrast: true, textScale: Math.max(settings.textScale, 1.25), readableFont: true };
    if (preset === 'screen-reader') settings = { ...settings, stimulation: 'minimal', movement: 'minimal', focus: true, contrast: true, readableFont: true };
    if (preset === 'deaf') settings = { ...settings, captions: true };
    syncControls(); applySettings(); status.textContent = 'Sugestão aplicada. Você pode ajustar ou restaurar cada opção a qualquer momento.';
  }));

  dialog.querySelector('[data-reset]').addEventListener('click', () => {
    settings = { ...defaults }; safeStore(SETTINGS_KEY, settings); syncControls(); applySettings(); status.textContent = 'Configurações visuais e de leitura restauradas.';
  });
  const speechButton = dialog.querySelector('[data-speech]'); const speechStop = dialog.querySelector('[data-speech-stop]');
  speechButton.addEventListener('click', () => {
    const text = (document.querySelector('main')?.innerText || document.body.innerText).replace(/\s+/g, ' ').trim().slice(0, 12000);
    if (!text || !('speechSynthesis' in window)) { status.textContent = 'A narração não está disponível neste navegador.'; return; }
    speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'pt-BR'; utterance.rate = Number(settings.playbackRate); utterance.volume = settings.muted ? 0 : 0.8;
    utterance.onstart = () => { speechActive = true; speechStop.disabled = false; speechButton.disabled = true; };
    utterance.onend = utterance.onerror = () => { speechActive = false; speechStop.disabled = true; speechButton.disabled = false; };
    speechSynthesis.speak(utterance);
  });
  speechStop.addEventListener('click', () => { speechSynthesis.cancel(); speechActive = false; speechStop.disabled = true; speechButton.disabled = false; });

  // Prevent browser media and future embeds from starting without a user action.
  function disableAutoplay(root = document) {
    root.querySelectorAll?.('video[autoplay],audio[autoplay]').forEach((media) => { media.autoplay = false; media.removeAttribute('autoplay'); media.pause(); });
    root.querySelectorAll?.('iframe[src]').forEach((frame) => {
      try { const url = new URL(frame.src); if (url.searchParams.get('autoplay') === '1') { url.searchParams.set('autoplay','0'); frame.src = url.href; } } catch {}
    });
  }
  disableAutoplay();
  new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => { if (node.nodeType === 1) disableAutoplay(node); }))).observe(document.body, { childList: true, subtree: true });

  // Add pre-play controls to animation detail pages. Embedded platforms may expose fewer controls.
  function addPreparationPanel() {
    const target = document.querySelector('.animation-watch, .animation-video-panel');
    if (!target || target.querySelector('.a11y-prepare')) return;
    const panel = document.createElement('details'); panel.className = 'a11y-prepare';
    panel.innerHTML = `<summary>Preparar visualização</summary><p>Escolha os ajustes antes de iniciar. As opções são aplicadas a vídeos reproduzidos nesta página. Arquivos .blend precisam ser controlados dentro do Blender.</p><div class="a11y-prepare-grid"><label>Movimento<select data-setting="movement"><option value="normal">Normal</option><option value="reduced">Reduzido</option><option value="minimal">Mínimo</option></select></label><label>Estímulos<select data-setting="stimulation"><option value="complete">Completos</option><option value="reduced">Reduzidos</option><option value="minimal">Mínimos</option></select></label><label>Velocidade<select data-setting="playbackRate"><option value="0.25">0,25×</option><option value="0.5">0,5×</option><option value="1">1×</option><option value="1.5">1,5×</option><option value="2">2×</option></select></label><label><input type="checkbox" data-setting="muted"> Manter som desligado</label><label><input type="checkbox" data-setting="captions"> Mostrar legendas disponíveis</label><label><input type="checkbox" data-setting="narration"> Narração disponível</label></div><p class="a11y-help">O player pode não oferecer legendas ou controle de velocidade. O vídeo incorporado também não inicia automaticamente.</p>`;
    target.prepend(panel);
    panel.querySelectorAll('[data-setting]').forEach((input) => {
      const key = input.dataset.setting;
      if (key === 'narration') { input.checked = false; input.addEventListener('change', () => { if (input.checked) speechButton.click(); else speechStop.click(); }); return; }
      if (input.type === 'checkbox') input.checked = Boolean(settings[key]); else input.value = String(settings[key]);
      input.addEventListener('change', () => { settings[key] = input.type === 'checkbox' ? input.checked : key === 'movement' || key === 'stimulation' ? input.value : Number(input.value); applySettings(); syncControls(); panel.querySelectorAll(`[data-setting="${key}"]`).forEach((other) => { if (other !== input) { if (other.type === 'checkbox') other.checked = Boolean(settings[key]); else other.value = String(settings[key]); } }); });
    });
  }
  addPreparationPanel();
  new MutationObserver(addPreparationPanel).observe(document.body, { childList: true, subtree: true });

  function collectGuideSteps() {
    const main = document.querySelector('main'); if (!main) return [];
    const headings = [...main.querySelectorAll('h1,h2,h3')].filter((node) => !node.closest('.a11y-dialog,.a11y-guide,.site-header,.site-footer'));
    const used = new Set();
    const steps = headings.map((heading) => {
      const block = heading.closest('section,article') || heading.parentElement;
      const key = block;
      if (used.has(key)) return null; used.add(key);
      const paragraph = block?.querySelector('p');
      return { title: heading.textContent.trim(), text: (paragraph?.textContent || 'Leia esta parte no seu ritmo e avance quando quiser.').trim().slice(0, 300), element: block };
    }).filter(Boolean).slice(0, 30);
    steps.push({ title: 'Pausa para pensar', text: 'O que você observou? Explique com suas palavras a relação entre o conceito e a representação desta página.', element: null, question: true });
    return steps;
  }
  function guideStorageKey() { return `diario-bns:guided-reading:${location.pathname}${location.search}`; }
  function showGuideStep() {
    if (!guide) return;
    const step = guide.steps[guide.index];
    guideRegion.querySelector('[data-guide-progress]').textContent = `Etapa ${guide.index + 1} de ${guide.steps.length}`;
    guideRegion.querySelector('[data-guide-title]').textContent = step.title;
    guideRegion.querySelector('[data-guide-text]').textContent = step.text;
    guideRegion.querySelector('[data-guide-question]').hidden = !step.question;
    guideRegion.querySelector('[data-guide-previous]').disabled = guide.index === 0 || guide.paused;
    guideRegion.querySelector('[data-guide-next]').disabled = guide.paused;
    guideRegion.querySelector('[data-guide-pause]').textContent = guide.paused ? 'Continuar' : 'Pausar';
    try { localStorage.setItem(guideStorageKey(), String(guide.index)); } catch {}
    step.element?.scrollIntoView({ behavior: settings.movement === 'normal' ? 'smooth' : 'auto', block: 'center' });
  }
  function startGuide(reset = false) {
    const steps = collectGuideSteps();
    if (!steps.length) { status.textContent = 'Esta página ainda não tem etapas para percorrer.'; return; }
    let saved = 0; try { saved = Number(localStorage.getItem(guideStorageKey()) || 0); } catch {}
    guide = { steps, index: reset ? 0 : Math.min(saved, steps.length - 1), paused: false };
    guideRegion.hidden = false; showGuideStep(); guideRegion.querySelector('[data-guide-next]').focus();
  }
  dialog.querySelector('[data-start-guide]').addEventListener('click', () => { dialog.close(); startGuide(); });
  guideRegion.querySelector('[data-guide-previous]').addEventListener('click', () => { if (guide && guide.index > 0) { guide.index -= 1; showGuideStep(); } });
  guideRegion.querySelector('[data-guide-next]').addEventListener('click', () => { if (guide && guide.index < guide.steps.length - 1) { guide.index += 1; showGuideStep(); } else if (guide) { guideRegion.querySelector('[data-guide-text]').textContent = 'Você chegou ao fim deste percurso. Pode recomeçar ou encerrar.'; } });
  guideRegion.querySelector('[data-guide-pause]').addEventListener('click', () => { if (guide) { guide.paused = !guide.paused; showGuideStep(); } });
  guideRegion.querySelector('[data-guide-restart]').addEventListener('click', () => startGuide(true));
  guideRegion.querySelector('[data-guide-exit]').addEventListener('click', () => { guideRegion.hidden = true; guide = null; });

  window.addEventListener('storage', (event) => { if (event.key === SETTINGS_KEY) { settings = readSettings(); syncControls(); applySettings(); } });
})();
