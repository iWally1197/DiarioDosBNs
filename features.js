import { supabase, supabasePromise, supabaseLoadError } from './src-supabase.js';

const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statusText = (node, text, error) => { if (node) { node.textContent = text; node.dataset.state = error ? 'error' : 'ok'; } };
const COOLDOWN = 60;
const cooldownKey = (kind) => 'diario-bns:email-cooldown:' + kind;
const cooldownEnd = (kind) => { try { return Number(localStorage.getItem(cooldownKey(kind)) || 0); } catch { return 0; } };
const beginCooldown = (kind) => { const until = Date.now() + COOLDOWN * 1000; try { localStorage.setItem(cooldownKey(kind), String(until)); } catch {} return until; };
const clearCooldown = (kind) => { try { localStorage.removeItem(cooldownKey(kind)); } catch {} };

function attachCountdown(button, kind, label) {
  if (!button) return;
  button.dataset.countdownBound = 'true';
  attachCountdownUpdate(button, kind, label);
  if (cooldownEnd(kind) > Date.now() && !button.dataset.countdownTimer) {
    button.dataset.countdownTimer = String(setInterval(() => attachCountdownUpdate(button, kind, label), 1000));
  }
}

function setupTeacherSignup() {
  const form = document.querySelector('#signup-form');
  const fields = form && form.querySelector('#teacher-education-fields');
  const role = form && form.elements.namedItem('role');
  if (!form || !fields) return;
  if (!fields.querySelector('[data-teacher-ack]')) {
    fields.insertAdjacentHTML('beforeend',
      '<aside class="teacher-verification-message"><strong>Verificação de professor</strong><p>Para proteger as turmas e os estudantes, precisamos confirmar sua condição de professor. Após criar sua conta, envie informações que comprovem sua atuação para <a href="mailto:enzoraphael1197@gmail.com">enzoraphael1197@gmail.com</a>. Aguarde a análise do administrador. Enquanto isso, as funções docentes ficam bloqueadas.</p></aside><label class="consent-check teacher-ack"><input data-teacher-ack name="teacher_verification_ack" type="checkbox" value="true" required><span>Li e estou ciente da necessidade de verificação.</span></label>');
    role.addEventListener('change', sync);
  }
  function sync() {
    const ack = form.querySelector('[data-teacher-ack]');
    if (!ack) return;
    ack.required = role.value === 'professor';
    if (role.value !== 'professor') ack.checked = false;
  }
  sync();
}

function setupAuthMessages() {
  const signup = document.querySelector('#signup-form');
  const login = document.querySelector('#login-form');
  if (signup) {
    const status = signup.querySelector('#form-status');
    let actions = signup.querySelector('[data-signup-resend-wrap]');
    if (!actions && status) {
      status.insertAdjacentHTML('afterend', '<div data-signup-resend-wrap hidden><button class="button button-outline" type="button" data-email-action="signup">Reenviar confirmação de e-mail</button><span class="form-help" role="status" aria-live="polite"></span></div>');
      actions = signup.querySelector('[data-signup-resend-wrap]');
    }
    if (actions) {
      const needs = /confirme|enviamos|link de confirmação/i.test(status && status.textContent || '');
      actions.hidden = !needs;
      if (needs && !signup.dataset.initialConfirmationCooldown) {
        signup.dataset.initialConfirmationCooldown = 'true';
        if (cooldownEnd('signup') <= Date.now()) beginCooldown('signup');
      }
      attachCountdown(actions.querySelector('[data-email-action]'), 'signup', 'Reenviar confirmação de e-mail');
    }
  }
  if (login) {
    const status = login.querySelector('#form-status');
    let actions = login.querySelector('[data-login-resend-wrap]');
    if (!actions && status) {
      status.insertAdjacentHTML('afterend', '<div data-login-resend-wrap hidden><button class="button button-outline" type="button" data-email-action="signup">Reenviar confirmação de e-mail</button><span class="form-help" role="status" aria-live="polite"></span></div>');
      actions = login.querySelector('[data-login-resend-wrap]');
    }
    if (actions) {
      actions.hidden = !/confirme seu e-mail|email not confirmed/i.test(status && status.textContent || '');
      attachCountdown(actions.querySelector('[data-email-action]'), 'signup', 'Reenviar confirmação de e-mail');
    }
  }
}

async function sendConfirmation(button) {
  const form = button.closest('form');
  const email = form && form.querySelector('input[type="email"]') && form.querySelector('input[type="email"]').value.trim();
  const note = button.parentElement.querySelector('[role="status"]');
  if (!email) { statusText(note, 'Informe o e-mail usado no cadastro.', true); return; }
  await supabasePromise;
  if (!supabase) { statusText(note, supabaseLoadError || 'O serviço de login não está disponível. Atualize a página e tente novamente.', true); return; }
  if (button.dataset.sending === 'true') return;
  const label = 'Reenviar confirmação de e-mail';
  if (cooldownEnd('signup') > Date.now()) {
    attachCountdown(button, 'signup', label);
    statusText(note, 'Aguarde o contador terminar antes de solicitar outro envio.', true);
    return;
  }
  button.disabled = true;
  button.dataset.sending = 'true';
  button.textContent = 'Enviando…';
  try {
    const redirect = new URL('auth-callback.html', document.baseURI).href;
    const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirect } });
    if (error) throw error;
    startButtonCooldown(button, 'signup', label);
    statusText(note, 'Solicitação enviada. Confira a caixa de entrada e o spam.', false);
  } catch (error) {
    const detail = String(error?.message || '');
    if (/rate.?limit|too many requests|429/i.test(detail)) {
      startButtonCooldown(button, 'signup', label);
      statusText(note, 'O Supabase ainda está limitando os envios. Aguarde o contador e tente novamente.', true);
    } else {
      stopButtonCooldown(button, 'signup', label);
      statusText(note, confirmationErrorMessage(detail), true);
    }
  } finally {
    delete button.dataset.sending;
  }
}

function attachCountdownUpdate(button, kind, label) {
  const remaining = Math.max(0, Math.ceil((cooldownEnd(kind) - Date.now()) / 1000));
  if (remaining) { button.disabled = true; button.textContent = label + ' disponível em ' + remaining + 's'; }
  else { button.disabled = false; button.textContent = label; clearInterval(Number(button.dataset.countdownTimer)); delete button.dataset.countdownTimer; }
}

function startButtonCooldown(button, kind, label) {
  const previousTimer = Number(button.dataset.countdownTimer);
  if (previousTimer) clearInterval(previousTimer);
  beginCooldown(kind);
  attachCountdownUpdate(button, kind, label);
  button.dataset.countdownTimer = String(setInterval(() => attachCountdownUpdate(button, kind, label), 1000));
}

function stopButtonCooldown(button, kind, label) {
  const timer = Number(button.dataset.countdownTimer);
  if (timer) clearInterval(timer);
  delete button.dataset.countdownTimer;
  clearCooldown(kind);
  button.disabled = false;
  button.textContent = label;
}

function confirmationErrorMessage(detail) {
  if (/email address not authorized|not authorized/i.test(detail)) {
    return 'O SMTP padrão do Supabase só envia para endereços autorizados. Configure um SMTP próprio em Authentication → Emails → SMTP Settings.';
  }
  if (/already confirmed|already verified|email confirmed/i.test(detail)) {
    return 'Este e-mail já foi confirmado. Faça login na sua conta.';
  }
  if (/smtp|email.*send|mail/i.test(detail)) {
    return 'O Supabase não conseguiu enviar a mensagem. Confira o SMTP e os modelos de e-mail em Authentication → Emails.';
  }
  return detail ? 'O Supabase recusou o reenvio: ' + detail : 'Não foi possível reenviar. Confira o e-mail e as configurações do Supabase.';
}

document.addEventListener('click', async (event) => {
  const copyPix = event.target.closest('[data-copy-pix]');
  if (copyPix) {
    const key = copyPix.dataset.copyPix || '';
    const message = document.querySelector('[data-pix-copy-status]');
    try { await navigator.clipboard.writeText(key); statusText(message, 'Chave PIX copiada.', false); }
    catch { window.prompt('Copie a chave PIX:', key); statusText(message, 'Selecione e copie a chave PIX.', false); }
    return;
  }
  const legacyReview = event.target.closest('[data-review-teacher][data-user-status]');
  if (legacyReview) {
    event.preventDefault(); event.stopImmediatePropagation();
    const removing = legacyReview.hasAttribute('data-remove-teacher');
    const unblocking = legacyReview.hasAttribute('data-unblock-teacher');
    const isApproval = legacyReview.dataset.status === 'active';
    const state = removing ? 'blocked' : isApproval ? 'verified' : 'rejected';
    if (removing && !confirm('Suspender o acesso docente desta conta?')) return;
    if (!isApproval && !removing && !confirm('Recusar esta solicitação docente?')) return;
    const note = removing || (!isApproval && !unblocking) ? (prompt(removing ? 'Motivo da suspensão (opcional):' : 'Motivo da recusa (opcional):') || '') : '';
    legacyReview.disabled = true;
    const { error } = await supabase.rpc('admin_review_teacher', { p_user_id: legacyReview.dataset.userStatus, p_status: state, p_note: note });
    if (error) { legacyReview.disabled = false; legacyReview.title = error.message; alert('Não foi possível atualizar a verificação. Aplique a migração de turmas/PIX.'); }
    else location.reload();
    return;
  }
  const button = event.target.closest('[data-email-action]');
  if (!button || button.disabled) return;
  event.preventDefault();
  await sendConfirmation(button);
}, true);

document.addEventListener('submit', async (event) => {
  const form = event.target;
  if (form && form.id === 'create-activity-form' && document.querySelector('#teacher-tools')) {
    event.preventDefault(); event.stopImmediatePropagation();
    const f = form, v = new FormData(f), note = f.querySelector('[role="status"]');
    const classroom = f.querySelector('[name="classroom"]');
    if (!classroom || !classroom.value) { statusText(note, 'Escolha uma turma em que o administrador liberou a criação de atividades.', true); return; }
    const files = Array.from(f.querySelector('[name="files"]')?.files || []);
    if (files.some((file) => file.size > 50 * 1024 * 1024)) { statusText(note, 'Cada arquivo pode ter no máximo 50 MB.', true); return; }
    const uploadedFiles = [];
    for (const file of files) {
      const safeName = file.name.normalize('NFKD').replace(/[^\w.-]/g, '_').slice(-180) || 'material';
      const path = classroom.value + '/' + (await supabase.auth.getUser()).data.user.id + '/' + crypto.randomUUID() + '_' + safeName;
      const uploaded = await supabase.storage.from('class-materials').upload(path, file, { upsert: false });
      if (uploaded.error) {
        if (uploadedFiles.length) await supabase.storage.from('class-materials').remove(uploadedFiles.map((item) => item.path));
        statusText(note, 'Não foi possível enviar o arquivo privado. Confira se a migração criou o bucket class-materials e tente novamente.', true); return;
      }
      uploadedFiles.push({ path, title: file.name.slice(0, 160) || 'Material complementar' });
    }
    const { data, error } = await supabase.rpc('teacher_submit_activity', {
      p_classroom: classroom.value,
      p_title: String(v.get('title') || '').trim(),
      p_subject: String(v.get('subject') || '').trim(),
      p_description: String(v.get('description') || '').trim(),
      p_animation: String(v.get('animation') || '') || null,
      p_due_at: v.get('due_at') ? new Date(String(v.get('due_at'))).toISOString() : null,
      p_points: Number(v.get('points') || 0),
      p_requires_response: v.has('requires_response'),
      p_is_draft: event.submitter && event.submitter.value === 'draft',
      p_related_lesson: String(v.get('related_lesson') || '') || null
    });
    if (error && uploadedFiles.length) await supabase.storage.from('class-materials').remove(uploadedFiles.map((item) => item.path));
    if (!error && String(v.get('question') || '').trim()) {
      const questions = String(v.get('question')).split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
      for (const [position, prompt] of questions.entries()) {
        const questionResult = await supabase.rpc('teacher_add_activity_question', { p_activity: data, p_prompt: prompt, p_position: position });
        if (questionResult.error) { statusText(note, 'Atividade enviada, mas uma questão não foi salva: ' + questionResult.error.message, true); return; }
      }
    }
    if (!error && String(v.get('resource_url') || '').trim()) {
      const resourceResult = await supabase.rpc('teacher_add_activity_resource', {
        p_activity: data,
        p_title: String(v.get('resource_title') || '').trim() || 'Material complementar',
        p_url: String(v.get('resource_url') || '').trim()
      });
      if (resourceResult.error) { statusText(note, 'Atividade criada, mas o link não foi salvo: ' + resourceResult.error.message, true); return; }
    }
    if (!error) {
      for (const file of uploadedFiles) {
        const fileResult = await supabase.rpc('teacher_add_activity_file', { p_activity: data, p_classroom: classroom.value, p_title: file.title, p_path: file.path });
        if (fileResult.error) { statusText(note, 'Atividade criada, mas um arquivo não foi associado: ' + fileResult.error.message, true); return; }
      }
    }
    statusText(note, error ? error.message : (event.submitter && event.submitter.value === 'draft' ? 'Rascunho salvo na sua conta.' : 'Atividade enviada. Se a turma exigir análise, ela ficará aguardando aprovação.'), Boolean(error));
    if (!error) { f.reset(); setTimeout(() => location.reload(), 900); }
  }
}, true);

function notificationPanel(root) {
  if (!root || root.querySelector('[data-notification-panel]') || root.dataset.notificationsLoading) return;
  root.dataset.notificationsLoading = 'true';
  Promise.resolve(supabase.rpc('notify_student_upcoming_deadlines')).catch(() => null).then(() => supabase.from('notifications').select('id,kind,title,body,href,created_at,read_at').order('created_at', { ascending: false }).limit(8))
    .then(({ data, error }) => {
      delete root.dataset.notificationsLoading;
      if (error || !root.isConnected || root.querySelector('[data-notification-panel]')) return;
      const rows = (data || []).map((item) => {
        const candidate = String(item.href || '');
        const href = /^(?:admin|professor|aluno)\.html$/.test(candidate) || /^turma\.html\?id=[0-9a-f-]{36}$/i.test(candidate) ? candidate : '#';
        return '<li class="' + (item.read_at ? '' : 'is-unread') + '"><a href="' + esc(href) + '">' + esc(item.title) + '</a><p>' + esc(item.body) + '</p><small>' + new Date(item.created_at).toLocaleString('pt-BR') + '</small>' +
        (item.read_at ? '' : ' <button type="button" data-notification-read="' + esc(item.id) + '">Marcar como lida</button>') + '</li>';
      }).join('');
      const section = document.createElement('section');
      section.className = 'account-section';
      section.dataset.notificationPanel = 'true';
      section.innerHTML = '<div class="section-kicker">AVISOS</div><h2>Notificações</h2><ul class="private-list">' + (rows || '<li>Nenhuma notificação por enquanto.</li>') + '</ul>';
      root.prepend(section);
    });
}

document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-notification-read]');
  if (!button) return;
  const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', button.dataset.notificationRead);
  if (!error) button.closest('li').classList.remove('is-unread'), button.remove();
});

async function studentClasses(root) {
  if (!root || root.querySelector('[data-extra-classes]') || root.dataset.classesLoading) return;
  root.dataset.classesLoading = 'true';
  const { data, error } = await supabase.from('student_classrooms')
    .select('classroom_id,classrooms(id,name,description,discipline,grade_level,status)')
    .order('joined_at', { ascending: false });
  if (error || !root.isConnected) { delete root.dataset.classesLoading; return; }
  const records = data || [];
  const cards = records.map((row) => {
    const c = row.classrooms || {};
    return '<article class="db-card"><span class="lesson-tag">' + esc(c.discipline || c.grade_level || 'Turma') + '</span><h3>' + esc(c.name) + '</h3><p>Abra a turma para ver professores, aulas e atividades.</p><a class="button button-primary" href="turma.html?id=' + encodeURIComponent(c.id || row.classroom_id) + '">Entrar na turma</a></article>';
  }).join('');
  const section = document.createElement('section');
  section.dataset.extraClasses = 'true';
  section.className = 'account-section';
  section.innerHTML = '<div class="section-kicker">MINHAS TURMAS</div><h2>Turmas em que estou inscrito</h2><div class="db-grid">' + (cards || '<p>Depois de entrar com um código, suas turmas aparecerão aqui.</p>') + '</div>';
  root.prepend(section);
  delete root.dataset.classesLoading;
}

async function teacherVerification(root) {
  if (!root || root.querySelector('[data-teacher-verification-status]') || root.dataset.verificationLoading) return;
  root.dataset.verificationLoading = 'true';
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) { delete root.dataset.verificationLoading; return; }
  const { data } = await supabase.from('teacher_verifications').select('status,admin_note,requested_at').eq('user_id', userData.user.id).maybeSingle();
  delete root.dataset.verificationLoading;
  if (!root.isConnected || root.querySelector('[data-teacher-verification-status]')) return;
  const state = data && data.status || 'pending';
  const label = {pending:'Aguardando análise',verified:'Perfil docente verificado',rejected:'Solicitação recusada',review:'O administrador solicitou mais informações',blocked:'Acesso docente suspenso'}[state] || 'Aguardando análise';
  const box = document.createElement('aside');
  box.className = 'auth-notice';
  box.dataset.teacherVerificationStatus = 'true';
  box.innerHTML = '<strong>' + esc(label) + '</strong><p>' + (state === 'verified' ? 'Acesso às ferramentas docentes liberado conforme as permissões de cada turma.' : state === 'blocked' ? 'O administrador suspendeu o acesso às ferramentas docentes. Entre em contato com o responsável pelo site para entender os próximos passos.' : 'Envie as informações de verificação para <a href="mailto:enzoraphael1197@gmail.com">enzoraphael1197@gmail.com</a>.') + (data && data.admin_note ? '<br>Observação: ' + esc(data.admin_note) : '') + '</p>' + (['rejected','review'].includes(state) ? '<button class="button button-primary" type="button" data-request-teacher-reanalysis>Solicitar reanálise</button><p role="status" aria-live="polite"></p>' : '');
  root.prepend(box);
  box.querySelector('[data-request-teacher-reanalysis]')?.addEventListener('click', async (event) => {
    const button = event.currentTarget, status = box.querySelector('[role="status"]');
    button.disabled = true;
    const { error } = await supabase.rpc('request_teacher_reanalysis');
    statusText(status, error ? 'Não foi possível enviar o pedido: ' + error.message : 'Pedido de reanálise enviado ao administrador.', Boolean(error));
    if (error) button.disabled = false;
    else button.textContent = 'Pedido enviado';
  });
}

async function teacherActivityForm(root) {
  const form = root && root.querySelector('#create-activity-form');
  if (!form || form.dataset.scopedActivityForm) return;
  const teacherClassCreation = root.querySelector('#create-class-form');
  if (teacherClassCreation) teacherClassCreation.closest('.auth-card').hidden = true;
  form.dataset.scopedActivityForm = 'true';
  const submitButton = form.querySelector('button[type="submit"],button:not([type])');
  if (submitButton) {
    submitButton.type = 'submit'; submitButton.name = 'submit_mode'; submitButton.value = 'submit'; submitButton.textContent = 'Enviar atividade';
    submitButton.insertAdjacentHTML('beforebegin', '<button class="button button-outline" type="submit" name="submit_mode" value="draft">Salvar rascunho</button>');
  }
  form.insertAdjacentHTML('beforeend', '<label>Turma<select name="classroom" required><option value="">Carregando turmas permitidas…</option></select></label><label>Animação relacionada (opcional)<select name="animation"><option value="">Nenhuma</option></select></label><label>Aula relacionada (opcional)<select name="related_lesson"><option value="">Nenhuma</option></select></label><label>Questões (opcional; uma por linha)<textarea name="question" maxlength="9000" rows="4"></textarea></label><label>Link externo seguro (opcional)<input name="resource_url" type="url" maxlength="2000" placeholder="https://…"></label><label>Título do link<input name="resource_title" maxlength="160" placeholder="Ex.: página de apoio"></label><label>Arquivos privados (até 50 MB cada)<input name="files" type="file" multiple accept=".pdf,.blend,.mp4,.glb,.png,.jpg,.jpeg,.webp,.zip"></label><label>Prazo (opcional)<input name="due_at" type="datetime-local"></label><label>Pontuação<input name="points" type="number" min="0" max="100000" step="0.5" value="0"></label><label class="consent-check"><input name="requires_response" type="checkbox" checked><span>Solicitar resposta dos estudantes</span></label><small>A publicação e a revisão dependem das permissões que o administrador definiu para cada turma. Arquivos ficam em armazenamento privado; links externos precisam começar com https://.</small>');
  const select = form.querySelector('[name="classroom"]');
  const lessonSelect = form.querySelector('[name="related_lesson"]');
  const animationSelect = form.querySelector('[name="animation"]');
  const { data: animations } = await supabase.from('animations').select('id,title').eq('is_published', true).order('title');
  animationSelect.innerHTML = '<option value="">Nenhuma</option>' + (animations || []).map((a) => '<option value="' + esc(a.id) + '">' + esc(a.title) + '</option>').join('');
  const { data: links } = await supabase.from('teacher_classrooms').select('classroom_id,classrooms(id,name,status)');
  const ids = (links || []).map((item) => item.classroom_id);
  let allowed = [];
  if (ids.length) {
    const { data: permissions } = await supabase.from('class_permissions').select('classroom_id,can_create_activities').in('classroom_id', ids);
    const idsAllowed = (permissions || []).filter((p) => p.can_create_activities).map((p) => p.classroom_id);
    allowed = (links || []).filter((l) => idsAllowed.includes(l.classroom_id) && l.classrooms && l.classrooms.status === 'active');
  }
  select.innerHTML = '<option value="">Selecione</option>' + allowed.map((l) => '<option value="' + esc(l.classroom_id) + '">' + esc(l.classrooms.name) + '</option>').join('');
  const loadLessons = async () => {
    lessonSelect.innerHTML = '<option value="">Nenhuma</option>';
    if (!select.value) return;
    const { data: lessons } = await supabase.from('class_lessons').select('id,title').eq('classroom_id', select.value).order('position');
    lessonSelect.insertAdjacentHTML('beforeend', (lessons || []).map((item) => '<option value="' + esc(item.id) + '">' + esc(item.title) + '</option>').join(''));
  };
  select.addEventListener('change', loadLessons);
  if (!allowed.length) {
    const help = document.createElement('p');
    help.className = 'form-help';
    help.textContent = 'Nenhuma turma liberou a criação de atividades para você.';
    select.after(help);
  }
}

async function adminWorkspace(root) {
  if (!root || root.querySelector('[data-admin-extra]') || root.dataset.adminExtraLoading) return;
  const legacyClassPanel = root.querySelector('#admin-class-form')?.closest('.account-section');
  if (legacyClassPanel) legacyClassPanel.hidden = true;
  root.dataset.adminExtraLoading = 'true';
  const results = await Promise.all([
    supabase.from('classrooms').select('id,name,description,discipline,grade_level,starts_on,ends_on,status,is_open,join_code,join_code_enabled').order('created_at', { ascending: false }),
    supabase.from('user_roles').select('user_id,status').eq('role', 'professor').eq('status', 'active'),
    supabase.from('site_settings').select('value').eq('key', 'pix').maybeSingle(),
    supabase.rpc('admin_teacher_verifications'),
    supabase.from('activities').select('id,title,subject,description,animation_id,created_by,review_note,created_at,approval_status,is_published,points,requires_response,activity_questions(id,prompt,position),activity_resources(id,title,resource_url,storage_bucket,storage_path),classroom_activities(classroom_id,due_at,related_lesson_id,classrooms(name))').order('created_at', { ascending: false }).limit(100),
    supabase.from('teacher_classrooms').select('classroom_id,user_id'),
    supabase.from('animations').select('id,title').eq('is_published', true).order('title')
  ]);
  const [{ data: classes }, { data: roles }, { data: pixRow }, { data: verification }, { data: allActivities }, { data: teacherLinks }, { data: animations }] = results;
  delete root.dataset.adminExtraLoading;
  if (!root.isConnected || root.querySelector('[data-admin-extra]')) return;
  const schemaError = results.find((result) => result.error);
  if (schemaError) {
    const warning = document.createElement('aside');
    warning.className = 'auth-notice'; warning.dataset.adminExtra = 'true';
    warning.innerHTML = '<strong>Novas ferramentas aguardam a migração do banco</strong><p>' + esc(schemaError.error.message) + '. Execute supabase-migrations-20261005120000_classrooms_pix_approvals.sql no SQL Editor do Supabase. Esse arquivo não deve ser publicado junto com o site.</p>';
    root.append(warning); return;
  }
  const teacherIds = Array.from(new Set((roles || []).map((r) => r.user_id).concat((verification || []).map((r) => r.user_id))));
  let profiles = [];
  if (teacherIds.length) {
    const { data } = await supabase.from('profiles').select('id,display_name,teacher_degree_program').in('id', teacherIds);
    profiles = data || [];
  }
  const teacherLabel = (id) => { const p = profiles.find((row) => row.id === id); return p ? p.display_name : 'Professor'; };
  const classOptions = (classes || []).map((c) => '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>').join('');
  const activeTeacherIds = new Set((roles || []).map((r) => r.user_id));
  const verifiedTeacherIds = new Set((verification || []).filter((v) => v.status === 'verified').map((v) => v.user_id));
  const teacherOptions = profiles.filter((p) => activeTeacherIds.has(p.id) && verifiedTeacherIds.has(p.id)).map((p) => '<option value="' + esc(p.id) + '">' + esc(p.display_name || 'Professor') + ' · ' + esc(p.teacher_degree_program || 'Formação não informada') + '</option>').join('') || '<option disabled>Nenhum professor verificado disponível</option>';
  const classRows = (classes || []).map((c) => {
    const assigned = (teacherLinks || []).filter((link) => link.classroom_id === c.id).map((link) => '<span>' + esc(teacherLabel(link.user_id)) + ' <button type="button" data-remove-class-teacher="' + esc(c.id) + '" data-user="' + esc(link.user_id) + '" aria-label="Remover professor desta turma">Remover</button></span>').join(' ');
    return '<li><b>' + esc(c.name) + '</b><span>' + esc(c.discipline || 'Disciplina não informada') + ' · código ' + esc(c.join_code) +
      ' · ' + esc(c.status) + ' · código ' + (c.join_code_enabled ? 'ativo' : 'desativado') + '</span><span>Professor(es): ' + (assigned || 'Nenhum vinculado') + '</span><a href="turma.html?id=' + encodeURIComponent(c.id) + '">Abrir turma</a> <button type="button" data-edit-class="' + esc(c.id) + '">Editar turma</button> ' +
      '<button type="button" data-copy-code="' + esc(c.join_code) + '">Copiar código</button> <button type="button" data-regenerate-code="' + esc(c.id) + '">Gerar outro código</button> ' +
      '<button type="button" data-toggle-code="' + esc(c.id) + '" data-enabled="' + c.join_code_enabled + '">' + (c.join_code_enabled ? 'Desativar código' : 'Ativar código') + '</button> ' +
      '<button type="button" data-toggle-class-status="' + esc(c.id) + '" data-status="' + esc(c.status) + '">' + (c.status === 'active' ? 'Encerrar turma' : 'Ativar turma') + '</button></li>';
  }).join('');
  const verificationRows = (verification || []).map((v) => {
    const approve = '<button type="button" data-review-teacher="' + esc(v.user_id) + '" data-review-status="verified">' + (v.status === 'blocked' ? 'Desbloquear professor' : 'Aprovar / liberar') + '</button> ';
    const block = v.status === 'verified' ? '<button class="button-danger" type="button" data-review-teacher="' + esc(v.user_id) + '" data-review-status="blocked">Bloquear</button> ' : '';
    const review = ['pending','review','rejected'].includes(v.status) ? '<button type="button" data-review-teacher="' + esc(v.user_id) + '" data-review-status="review">Solicitar informações</button> <button class="button-danger" type="button" data-review-teacher="' + esc(v.user_id) + '" data-review-status="rejected">Recusar</button> ' : '';
    return '<li><b>' + esc(v.display_name || teacherLabel(v.user_id)) + '</b><span>' + esc(v.email || 'E-mail indisponível') + ' · ' + esc(v.status) + ' · ' + new Date(v.requested_at).toLocaleDateString('pt-BR') + (v.admin_note ? ' · ' + esc(v.admin_note) : '') + '</span> ' + approve + block + review + '</li>';
  }).join('');
  const pending = (allActivities || []).filter((a) => a.approval_status === 'pending');
  const animationOptions = '<option value="">Nenhuma</option>' + (animations || []).map((animation) => '<option value="' + esc(animation.id) + '">' + esc(animation.title) + '</option>').join('');
  const managementRows = (allActivities || []).map((a) => {
    const assignment = a.classroom_activities && a.classroom_activities[0];
    const className = assignment && assignment.classrooms && assignment.classrooms.name || 'Sem turma associada';
    const due = assignment && assignment.due_at ? new Date(assignment.due_at).toISOString().slice(0,16) : '';
    const selectedAnimationOptions = animationOptions.replace('value="' + esc(a.animation_id || '') + '"', 'value="' + esc(a.animation_id || '') + '" selected');
    return '<li><b>' + esc(a.title) + '</b><span>' + esc(className) + ' · ' + esc(a.approval_status || 'approved') + ' · ' + (a.is_published ? 'publicada' : 'não publicada') + '</span>' +
      '<details><summary>Editar atividade</summary><form class="admin-form" data-admin-edit-activity="' + esc(a.id) + '"><label>Título<input name="title" maxlength="160" required value="' + esc(a.title) + '"></label><label>Disciplina<input name="subject" maxlength="100" value="' + esc(a.subject || '') + '"></label><label>Instruções<textarea name="description" maxlength="5000" rows="3">' + esc(a.description || '') + '</textarea></label><label>Animação relacionada<select name="animation_id">' + selectedAnimationOptions + '</select></label><label>Questões (uma por linha)<textarea name="questions" maxlength="9000" rows="4">' + esc((a.activity_questions || []).sort((x,y) => x.position-y.position).map((q) => q.prompt).join('\n')) + '</textarea></label><label>Prazo<input name="due_at" type="datetime-local" value="' + esc(due) + '"></label><label>Pontuação<input name="points" type="number" min="0" max="100000" step="0.5" value="' + esc(a.points || 0) + '"></label><button class="button button-primary" type="submit">Salvar alterações</button><p role="status" aria-live="polite"></p></form></details>' +
      '<button type="button" data-toggle-activity="' + esc(a.id) + '" data-published="' + Boolean(a.is_published) + '">' + (a.is_published ? 'Despublicar' : 'Publicar') + '</button> <button type="button" data-duplicate-activity="' + esc(a.id) + '">Duplicar</button> <button class="button-danger" type="button" data-delete-activity="' + esc(a.id) + '">Excluir</button></li>';
  }).join('');
  const pendingRows = pending.map((a) => {
    const cls = a.classroom_activities && a.classroom_activities[0] && a.classroom_activities[0].classrooms;
    return '<li><b>' + esc(a.title) + '</b><span>Professor: ' + esc(teacherLabel(a.created_by)) + ' · Turma: ' + esc(cls && cls.name || 'Turma') + '</span> ' +
      '<button type="button" data-review-activity="' + esc(a.id) + '" data-review-status="approved">Aprovar e publicar</button> ' +
      '<button type="button" data-review-activity="' + esc(a.id) + '" data-review-status="changes_requested">Solicitar alterações</button> ' +
      '<button type="button" data-review-activity="' + esc(a.id) + '" data-review-status="rejected">Recusar</button></li>';
  }).join('');
  const pix = pixRow && pixRow.value || {};
  const section = document.createElement('section');
  section.className = 'account-section';
  section.dataset.adminExtra = 'true';
  section.innerHTML =
    '<div class="section-kicker">CONFIGURAÇÃO DO PIX</div><h2>Apoie o Diário dos BNs</h2><form data-pix-settings class="admin-form">' +
    '<label>Chave PIX<input name="pix_key" maxlength="200" value="' + esc(pix.pix_key || '') + '"></label>' +
    '<label>Link HTTPS da imagem do QR Code<input name="qr_image_url" type="url" placeholder="https://…" value="' + esc(pix.qr_image_url || '') + '"></label>' +
    '<label>Texto de apoio<textarea name="instructions" maxlength="500">' + esc(pix.instructions || '') + '</textarea></label><button class="button button-primary" type="submit">Salvar PIX</button><p role="status" aria-live="polite"></p></form>' +
    '<div class="section-kicker">TURMAS</div><h2>Criar turma e definir responsáveis</h2>' +
    '<form data-enhanced-class-form class="admin-form"><label>Nome<input name="name" maxlength="100" required></label><label>Descrição<textarea name="description" maxlength="1000"></textarea></label>' +
    '<label>Disciplina<input name="discipline" maxlength="100" placeholder="Física"></label><label>Ano/série<input name="grade_level" maxlength="100" placeholder="2º ano do Ensino Médio"></label>' +
    '<label>Início<input name="starts_on" type="date"></label><label>Encerramento<input name="ends_on" type="date"></label><label>Status<select name="status"><option value="active">Ativa</option><option value="closed">Fechada</option><option value="completed">Encerrada</option></select></label>' +
    '<label>Professores responsáveis<select name="teachers" multiple size="5">' + teacherOptions + '</select><small>Use Ctrl ou Command para selecionar mais de um professor.</small></label>' +
    '<button class="button button-primary" type="submit">Criar turma</button><button class="button button-outline" type="button" data-enhanced-class-cancel hidden>Cancelar edição</button><p role="status" aria-live="polite"></p></form>' +
    '<ul class="private-list">' + (classRows || '<li>Nenhuma turma cadastrada.</li>') + '</ul>' +
    '<form data-add-class-teacher class="admin-form"><h3>Adicionar professor a uma turma existente</h3><label>Professor<select name="teacher" required>' + teacherOptions + '</select></label><label>Turma<select name="classroom" required>' + classOptions + '</select></label><button class="button button-primary" type="submit">Vincular professor</button><p role="status"></p></form>' +
    '<h3>Permissões da turma</h3><form data-class-permissions class="admin-form"><label>Turma<select name="classroom" required>' + classOptions + '</select></label>' +
    '<div class="permission-checks">' +
    '<label><input type="checkbox" name="can_create_activities"> Professor pode criar atividades</label><label><input type="checkbox" name="can_edit_activities"> Professor pode editar atividades</label><label><input type="checkbox" name="can_publish_activities"> Professor pode publicar atividades</label><label><input type="checkbox" name="require_activity_approval" checked> Exigir aprovação das atividades</label><label><input type="checkbox" name="can_create_lessons"> Professor pode criar aulas</label><label><input type="checkbox" name="can_edit_lessons"> Professor pode editar aulas</label><label><input type="checkbox" name="can_send_materials"> Professor pode enviar materiais e avisos</label><label><input type="checkbox" name="can_view_progress"> Professor pode acompanhar o progresso</label></div>' +
    '<button class="button button-primary" type="submit">Salvar permissões</button><p role="status" aria-live="polite"></p></form>' +
    '<h3>Adicionar atividade diretamente a uma turma</h3><form data-admin-direct-activity class="admin-form"><label>Turma<select name="classroom" required>' + classOptions + '</select></label><label>Título<input name="title" required maxlength="160"></label><label>Disciplina<input name="subject" maxlength="100"></label><label>Instruções<textarea name="description" maxlength="5000"></textarea></label><label>Animação relacionada<select name="animation_id">' + animationOptions + '</select></label><label>Aula relacionada<select name="related_lesson"><option value="">Nenhuma</option></select></label><label>Questões (uma por linha)<textarea name="questions" maxlength="9000" rows="4"></textarea></label><label>Link externo HTTPS (opcional)<input name="resource_url" type="url" maxlength="2000" placeholder="https://…"></label><label>Título do link (opcional)<input name="resource_title" maxlength="160"></label><label>Arquivos privados (até 50 MB cada)<input name="files" type="file" multiple accept=".pdf,.blend,.mp4,.glb,.png,.jpg,.jpeg,.webp,.zip"></label><label>Prazo<input name="due_at" type="datetime-local"></label><label>Pontuação<input name="points" type="number" min="0" max="100000" step="0.5" value="0"></label><button class="button button-primary">Criar e publicar</button><p role="status" aria-live="polite"></p></form>' +
    '<div class="section-kicker">GERENCIAR ATIVIDADES</div><h2>Editar, publicar, duplicar ou excluir</h2><ul class="private-list">' + (managementRows || '<li>Nenhuma atividade cadastrada.</li>') + '</ul>' +
    '<div class="section-kicker">VERIFICAÇÃO DE PROFESSORES</div><h2>Solicitações e acesso docente</h2><ul class="private-list">' + (verificationRows || '<li>Nenhuma solicitação de verificação.</li>') + '</ul>' +
    '<div class="section-kicker">ATIVIDADES PENDENTES</div><h2>Revisar atividades enviadas</h2><ul class="private-list">' + (pendingRows || '<li>Nenhuma atividade aguardando aprovação.</li>') + '</ul>';
  root.append(section);
  bindAdminExtras(section, classes || [], teacherLinks || [], allActivities || []);
}

async function bindAdminExtras(section, classes, teacherLinks, allActivities) {
  section.querySelector('[data-pix-settings]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget, v = new FormData(form), note = form.querySelector('[role="status"]');
    const qr = String(v.get('qr_image_url') || '').trim();
    if (qr && !/^https:\/\//i.test(qr)) { statusText(note, 'Use um endereço HTTPS para o QR Code.', true); return; }
    const value = { pix_key: String(v.get('pix_key') || '').trim(), qr_image_url: qr, instructions: String(v.get('instructions') || '').trim() };
    const { error } = await supabase.from('site_settings').upsert({ key: 'pix', value: value, updated_at: new Date().toISOString() });
    statusText(note, error ? 'Não foi possível salvar. Aplique a migração de turmas/PIX.' : 'Configuração PIX salva.', Boolean(error));
  });
  section.querySelector('[data-enhanced-class-form]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget, v = new FormData(form), note = form.querySelector('[role="status"]');
    const start = String(v.get('starts_on') || ''), end = String(v.get('ends_on') || '');
    if (start && end && end < start) { statusText(note, 'A data de encerramento precisa ser posterior ao início.', true); return; }
    const classStatus = String(v.get('status') || 'active');
    const classroomId = form.dataset.classroomId || '';
    let row = null;
    if (classroomId) row = classes.find((item) => item.id === classroomId);
    else {
      const { data, error } = await supabase.rpc('create_classroom', { p_name: String(v.get('name')).trim(), p_description: String(v.get('description') || '').trim() });
      if (error) { statusText(note, 'Falha ao criar turma: ' + error.message, true); return; }
      row = Array.isArray(data) ? data[0] : data;
    }
    const targetId = classroomId || row && row.id;
    if (!targetId) { statusText(note, 'A turma foi criada, mas o banco não retornou seu identificador. Atualize o painel.', true); return; }
    const update = await supabase.from('classrooms').update({
      discipline: String(v.get('discipline') || '').trim(), grade_level: String(v.get('grade_level') || '').trim(),
      starts_on: start || null, ends_on: end || null, status: classStatus, is_open: classStatus === 'active', join_code_enabled: true
      ,name:String(v.get('name')).trim(),description:String(v.get('description')||'').trim()
    }).eq('id', targetId);
    const teachers = form.querySelector('[name="teachers"]');
    const ids = teachers ? Array.from(teachers.selectedOptions).map((o) => o.value) : [];
    let linked = { error: null };
    if (!classroomId && ids.length) linked = await supabase.from('teacher_classrooms').insert(ids.map((id) => ({ classroom_id: targetId, user_id: id })));
    if (classroomId) {
      const existingIds = teacherLinks.filter((link) => link.classroom_id === classroomId).map((link) => link.user_id);
      const addIds = ids.filter((id) => !existingIds.includes(id)), removeIds = existingIds.filter((id) => !ids.includes(id));
      if (addIds.length) linked = await supabase.from('teacher_classrooms').insert(addIds.map((id) => ({ classroom_id: targetId, user_id: id })));
      if (!linked.error && removeIds.length) linked = await supabase.from('teacher_classrooms').delete().eq('classroom_id', targetId).in('user_id', removeIds);
    }
    if (update.error || linked.error) { statusText(note, 'A turma foi criada com o código ' + row.join_code + ', mas faltou salvar um detalhe. Confira as permissões e atualize o painel.', true); return; }
    statusText(note, classroomId ? 'Dados da turma atualizados.' : 'Turma criada. Código: ' + row.join_code, false);
    setTimeout(() => location.reload(), 1000);
  });
  section.querySelectorAll('[data-edit-class]').forEach((button) => button.addEventListener('click', () => {
    const item = classes.find((row) => row.id === button.dataset.editClass), form = section.querySelector('[data-enhanced-class-form]');
    if (!item || !form) return;
    form.dataset.classroomId = item.id;
    for (const key of ['name','description','discipline','grade_level','starts_on','ends_on','status']) form.elements.namedItem(key).value = item[key] || (key === 'status' ? 'active' : '');
    const assignedIds = teacherLinks.filter((link) => link.classroom_id === item.id).map((link) => link.user_id);
    Array.from(form.elements.teachers.options).forEach((option) => { option.selected = assignedIds.includes(option.value); });
    form.querySelector('[type=submit]').textContent = 'Salvar alterações';
    form.querySelector('[data-enhanced-class-cancel]').hidden = false;
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));
  section.querySelector('[data-enhanced-class-cancel]')?.addEventListener('click', () => location.reload());
  const permissionForm = section.querySelector('[data-class-permissions]');
  permissionForm?.elements.classroom.addEventListener('change', async () => {
    const { data, error } = await supabase.from('class_permissions').select('*').eq('classroom_id', permissionForm.elements.classroom.value).maybeSingle();
    if (error || !data) return;
    for (const key of ['can_create_activities','can_edit_activities','can_publish_activities','require_activity_approval','can_create_lessons','can_edit_lessons','can_send_materials','can_view_progress']) permissionForm.elements[key].checked = Boolean(data[key]);
  });
  if (permissionForm?.elements.classroom.value) permissionForm.elements.classroom.dispatchEvent(new Event('change'));
  permissionForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const f = event.currentTarget, id = f.elements.classroom.value, note = f.querySelector('[role="status"]');
    const val = (key) => f.elements[key].checked;
    const { error } = await supabase.rpc('admin_set_class_permissions', {
      p_classroom: id, p_can_create_activities: val('can_create_activities'), p_can_edit_activities: val('can_edit_activities'),
      p_can_publish_activities: val('can_publish_activities'), p_require_activity_approval: val('require_activity_approval'),
      p_can_create_lessons: val('can_create_lessons'), p_can_edit_lessons: val('can_edit_lessons'),
      p_can_send_materials: val('can_send_materials'), p_can_view_progress: val('can_view_progress')
    });
    statusText(note, error ? 'Não foi possível salvar as permissões: ' + error.message : 'Permissões salvas.', Boolean(error));
  });
  section.querySelector('[data-add-class-teacher]')?.addEventListener('submit', async (event) => {
    event.preventDefault(); const f = event.currentTarget, note = f.querySelector('[role="status"]');
    const { error } = await supabase.from('teacher_classrooms').insert({ user_id: f.elements.teacher.value, classroom_id: f.elements.classroom.value });
    if (error && error.code === '23505') { statusText(note, 'Este professor já está vinculado à turma.', true); return; }
    statusText(note, error ? 'Não foi possível vincular o professor: ' + error.message : 'Professor vinculado à turma.', Boolean(error));
    if (!error) setTimeout(() => location.reload(), 600);
  });
  section.querySelectorAll('[data-remove-class-teacher]').forEach((button) => button.addEventListener('click', async () => {
    if (!confirm('Remover este professor da turma?')) return;
    const { error } = await supabase.from('teacher_classrooms').delete().eq('classroom_id', button.dataset.removeClassTeacher).eq('user_id', button.dataset.user);
    if (error) { button.title = error.message; alert('Não foi possível remover o professor.'); } else location.reload();
  }));
  section.querySelector('[data-admin-direct-activity]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const f = event.currentTarget, v = new FormData(f), note = f.querySelector('[role="status"]');
    const resourceUrl = String(v.get('resource_url') || '').trim();
    if (resourceUrl && !/^https:\/\//i.test(resourceUrl)) { statusText(note, 'Use um endereço HTTPS para o material.', true); return; }
    const { data: auth } = await supabase.auth.getUser();
    const classroomId = String(v.get('classroom'));
    const files = Array.from(f.querySelector('[name="files"]')?.files || []);
    if (files.some((file) => file.size > 50 * 1024 * 1024)) { statusText(note, 'Cada arquivo pode ter no máximo 50 MB.', true); return; }
    const uploadedFiles = [];
    for (const file of files) {
      const safeName = file.name.normalize('NFKD').replace(/[^\w.-]/g, '_').slice(-180) || 'material';
      const path = classroomId + '/' + auth.user.id + '/' + crypto.randomUUID() + '_' + safeName;
      const uploaded = await supabase.storage.from('class-materials').upload(path, file, { upsert: false });
      if (uploaded.error) {
        if (uploadedFiles.length) await supabase.storage.from('class-materials').remove(uploadedFiles.map((item) => item.path));
        statusText(note, 'Não foi possível enviar o arquivo privado. Confira o bucket class-materials e as políticas de Storage.', true); return;
      }
      uploadedFiles.push({ path, title: file.name.slice(0,160) || 'Material complementar' });
    }
    const activity = await supabase.from('activities').insert({ title: String(v.get('title')).trim(), subject: String(v.get('subject') || '').trim(), description: String(v.get('description') || '').trim(), animation_id: String(v.get('animation_id') || '') || null, created_by: auth.user.id, is_published: true, approval_status: 'approved', points: Number(v.get('points') || 0), published_at: new Date().toISOString() }).select('id').single();
    if (activity.error) { if (uploadedFiles.length) await supabase.storage.from('class-materials').remove(uploadedFiles.map((item) => item.path)); statusText(note, 'Não foi possível criar: ' + activity.error.message, true); return; }
    const questions = String(v.get('questions') || '').split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    if (questions.length) {
      const result = await supabase.from('activity_questions').insert(questions.map((prompt, position) => ({ activity_id: activity.data.id, prompt, position })));
      if (result.error) { await supabase.from('activities').delete().eq('id', activity.data.id); if (uploadedFiles.length) await supabase.storage.from('class-materials').remove(uploadedFiles.map((item) => item.path)); statusText(note, 'A atividade foi revertida porque não foi possível salvar as questões.', true); return; }
    }
    const resourceRows = [];
    if (resourceUrl) resourceRows.push({ activity_id: activity.data.id, title: String(v.get('resource_title') || '').trim() || 'Material complementar', resource_url: resourceUrl, created_by: auth.user.id });
    uploadedFiles.forEach((file) => resourceRows.push({ activity_id: activity.data.id, title: file.title, resource_url: null, storage_bucket: 'class-materials', storage_path: file.path, created_by: auth.user.id }));
    if (resourceRows.length) {
      const resource = await supabase.from('activity_resources').insert(resourceRows);
      if (resource.error) { await supabase.from('activities').delete().eq('id', activity.data.id); if (uploadedFiles.length) await supabase.storage.from('class-materials').remove(uploadedFiles.map((item) => item.path)); statusText(note, 'A atividade foi revertida porque os materiais não puderam ser associados.', true); return; }
    }
    const assignment = await supabase.from('classroom_activities').insert({ activity_id: activity.data.id, classroom_id: classroomId, assigned_by: auth.user.id, due_at: v.get('due_at') ? new Date(String(v.get('due_at'))).toISOString() : null, related_lesson_id: String(v.get('related_lesson') || '') || null });
    if (assignment.error) { await supabase.from('activities').delete().eq('id', activity.data.id); if (uploadedFiles.length) await supabase.storage.from('class-materials').remove(uploadedFiles.map((item) => item.path)); statusText(note, 'Atividade removida porque não foi possível vinculá-la à turma: ' + assignment.error.message, true); return; }
    statusText(note, 'Atividade publicada para a turma.', false);
    setTimeout(() => location.reload(), 700);
  });
  const directActivityForm = section.querySelector('[data-admin-direct-activity]');
  directActivityForm?.elements.classroom.addEventListener('change', async () => {
    const lessonSelect = directActivityForm.elements.related_lesson;
    lessonSelect.innerHTML = '<option value="">Nenhuma</option>';
    const { data } = await supabase.from('class_lessons').select('id,title').eq('classroom_id', directActivityForm.elements.classroom.value).order('position');
    lessonSelect.insertAdjacentHTML('beforeend', (data || []).map((lesson) => '<option value="' + esc(lesson.id) + '">' + esc(lesson.title) + '</option>').join(''));
  });
  if (directActivityForm?.elements.classroom.value) directActivityForm.elements.classroom.dispatchEvent(new Event('change'));
  section.querySelectorAll('[data-admin-edit-activity]').forEach((form) => form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const f = event.currentTarget, v = new FormData(f), note = f.querySelector('[role="status"]'), id = f.dataset.adminEditActivity;
    const { error } = await supabase.from('activities').update({ title: String(v.get('title')).trim(), subject: String(v.get('subject') || '').trim(), description: String(v.get('description') || '').trim(), animation_id: String(v.get('animation_id') || '') || null, points: Number(v.get('points') || 0) }).eq('id', id);
    if (!error) {
      const questions = String(v.get('questions') || '').split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
      const removed = await supabase.from('activity_questions').delete().eq('activity_id', id);
      if (removed.error) { statusText(note, 'Os dados principais foram salvos, mas as questões antigas não puderam ser substituídas.', true); return; }
      if (questions.length) {
        const savedQuestions = await supabase.from('activity_questions').insert(questions.map((prompt, position) => ({ activity_id: id, prompt, position })));
        if (savedQuestions.error) { statusText(note, 'Os dados principais foram salvos, mas as questões não foram atualizadas: ' + savedQuestions.error.message, true); return; }
      }
      const item = allActivities.find((row) => row.id === id), assignment = item && item.classroom_activities && item.classroom_activities[0];
      if (assignment) {
        const due = String(v.get('due_at') || '');
        const result = await supabase.from('classroom_activities').update({ due_at: due ? new Date(due).toISOString() : null }).eq('activity_id', id).eq('classroom_id', assignment.classroom_id);
        if (result.error) { statusText(note, 'A atividade foi editada, mas o prazo não mudou: ' + result.error.message, true); return; }
      }
    }
    statusText(note, error ? 'Não foi possível salvar a atividade: ' + error.message : 'Atividade atualizada.', Boolean(error));
    if (!error) setTimeout(() => location.reload(), 700);
  }));
  section.querySelectorAll('[data-toggle-activity]').forEach((button) => button.addEventListener('click', async () => {
    const publish = button.dataset.published !== 'true';
    const result = publish
      ? await supabase.rpc('admin_review_activity', { p_activity: button.dataset.toggleActivity, p_status: 'approved', p_note: '' })
      : await supabase.from('activities').update({ is_published: false, published_at: null }).eq('id', button.dataset.toggleActivity);
    if (result.error) { button.title = result.error.message; alert('Não foi possível alterar a publicação: ' + result.error.message); }
    else location.reload();
  }));
  section.querySelectorAll('[data-duplicate-activity]').forEach((button) => button.addEventListener('click', async () => {
    const source = allActivities.find((item) => item.id === button.dataset.duplicateActivity);
    if (!source) return;
    const { data: auth } = await supabase.auth.getUser();
    const copy = await supabase.from('activities').insert({ title: source.title + ' — cópia', subject: source.subject || '', description: source.description || '', animation_id: source.animation_id || null, created_by: auth.user.id, is_published: false, approval_status: 'draft', points: source.points || 0, requires_response: source.requires_response !== false }).select('id').single();
    if (copy.error) { alert('Não foi possível duplicar: ' + copy.error.message); return; }
    const assignments = (source.classroom_activities || []).map((item) => ({ activity_id: copy.data.id, classroom_id: item.classroom_id, assigned_by: auth.user.id, due_at: item.due_at, related_lesson_id: item.related_lesson_id || null }));
    if (assignments.length) {
      const linked = await supabase.from('classroom_activities').insert(assignments);
      if (linked.error) { await supabase.from('activities').delete().eq('id', copy.data.id); alert('A cópia foi removida porque não foi possível replicar a turma associada.'); return; }
    }
    const sourceQuestions = (source.activity_questions || []).map((item) => ({ activity_id: copy.data.id, prompt: item.prompt, position: item.position }));
    if (sourceQuestions.length) {
      const saved = await supabase.from('activity_questions').insert(sourceQuestions);
      if (saved.error) { await supabase.from('activities').delete().eq('id', copy.data.id); alert('A cópia foi removida porque as questões não puderam ser duplicadas.'); return; }
    }
    const sourceResources = (source.activity_resources || []).map((item) => ({ activity_id: copy.data.id, title: item.title, resource_url: item.resource_url, storage_bucket: item.storage_bucket || 'class-materials', storage_path: item.storage_path || null, created_by: auth.user.id }));
    if (sourceResources.length) {
      const saved = await supabase.from('activity_resources').insert(sourceResources);
      if (saved.error) { await supabase.from('activities').delete().eq('id', copy.data.id); alert('A cópia foi removida porque os materiais não puderam ser duplicados.'); return; }
    }
    location.reload();
  }));
  section.querySelectorAll('[data-delete-activity]').forEach((button) => button.addEventListener('click', async () => {
    if (!confirm('Excluir esta atividade e suas respostas associadas? Essa ação não pode ser desfeita.')) return;
    button.disabled = true;
    const { error } = await supabase.from('activities').delete().eq('id', button.dataset.deleteActivity);
    if (error) { button.disabled = false; button.title = error.message; alert('Não foi possível excluir a atividade: ' + error.message); }
    else location.reload();
  }));
  section.querySelectorAll('[data-review-teacher]').forEach((button) => button.addEventListener('click', async () => {
    const state = button.dataset.reviewStatus;
    const note = state === 'review' || state === 'rejected' ? (prompt(state === 'review' ? 'Quais informações devem ser enviadas?' : 'Motivo da recusa (opcional):') || '') : '';
    if (state === 'rejected' && !confirm('Recusar esta solicitação? O acesso docente continuará bloqueado.')) return;
    button.disabled = true;
    const { error } = await supabase.rpc('admin_review_teacher', { p_user_id: button.dataset.reviewTeacher, p_status: state, p_note: note });
    if (error) { button.disabled = false; button.title = error.message; alert('Não foi possível atualizar a solicitação. Confira a migração e as permissões.'); }
    else location.reload();
  }));
  section.querySelectorAll('[data-review-activity]').forEach((button) => button.addEventListener('click', async () => {
    const state = button.dataset.reviewStatus;
    const note = state === 'approved' ? '' : (prompt(state === 'rejected' ? 'Motivo da recusa (opcional):' : 'O que deve ser alterado?') || '');
    if (state !== 'approved' && !note && state === 'changes_requested') return;
    if (state === 'rejected' && !confirm('Recusar esta atividade?')) return;
    button.disabled = true;
    const { error } = await supabase.rpc('admin_review_activity', { p_activity: button.dataset.reviewActivity, p_status: state, p_note: note });
    if (error) { button.disabled = false; button.title = error.message; alert('Não foi possível revisar a atividade: ' + error.message); }
    else location.reload();
  }));
  section.querySelectorAll('[data-copy-code]').forEach((button) => button.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(button.dataset.copyCode); button.textContent = 'Código copiado'; }
    catch { window.prompt('Copie o código da turma:', button.dataset.copyCode); }
  }));
  section.querySelectorAll('[data-regenerate-code]').forEach((button) => button.addEventListener('click', async () => {
    if (!confirm('Gerar um novo código? O código atual deixará de funcionar.')) return;
    const { data, error } = await supabase.rpc('admin_regenerate_class_code', { p_classroom: button.dataset.regenerateCode });
    if (error) { button.title = error.message; alert('Não foi possível gerar outro código.'); return; }
    alert('Novo código: ' + data); location.reload();
  }));
  section.querySelectorAll('[data-toggle-code]').forEach((button) => button.addEventListener('click', async () => {
    const { error } = await supabase.from('classrooms').update({ join_code_enabled: button.dataset.enabled !== 'true' }).eq('id', button.dataset.toggleCode);
    if (error) { button.title = error.message; alert('Não foi possível alterar o código da turma.'); } else location.reload();
  }));
  section.querySelectorAll('[data-toggle-class-status]').forEach((button) => button.addEventListener('click', async () => {
    const next = button.dataset.status === 'active' ? 'completed' : 'active';
    const { error } = await supabase.from('classrooms').update({ status: next, is_open: next === 'active' }).eq('id', button.dataset.toggleClassStatus);
    if (error) { button.title = error.message; alert('Não foi possível alterar a turma.'); } else location.reload();
  }));
}

function enhance() {
  setupTeacherSignup();
  setupAuthMessages();
  const student = document.querySelector('#student-workspace');
  if (student && document.querySelector('#aluno-area')) studentClasses(student);
  if (student && document.querySelector('[data-logout]') && location.pathname.includes('aluno')) studentClasses(student);
  const teacher = document.querySelector('#teacher-tools');
  if (teacher) { teacherActivityForm(teacher); teacherVerification(teacher); notificationPanel(teacher); }
  if (!teacher && location.pathname.includes('professor') && document.querySelector('[data-logout]')) teacherVerification(document.querySelector('main#conteudo'));
  const admin = document.querySelector('#admin-tools');
  if (admin) { adminWorkspace(admin); notificationPanel(admin); }
  if (student) notificationPanel(student);
  const page = document.querySelector('#classroom-root');
  if (page && !page.dataset.loaded) { page.dataset.loaded = 'true'; loadClassroom(page); }
  const pix = document.querySelector('#pix-content');
  if (pix && !pix.dataset.loaded) { pix.dataset.loaded = 'true'; loadPix(pix); }
}

async function loadPix(root) {
  if (!supabase) { root.innerHTML = '<p>As informações PIX ainda não estão disponíveis.</p>'; return; }
  const { data, error } = await supabase.from('site_settings').select('value').eq('key', 'pix').maybeSingle();
  if (error || !root.isConnected) { root.innerHTML = '<p>Não foi possível carregar a configuração PIX. O responsável pelo site precisa aplicar a migração no Supabase.</p>'; return; }
  const value = data && data.value || {};
  const key = String(value.pix_key || '').trim();
  const qr = String(value.qr_image_url || '').trim();
  const validQr = /^https:\/\//i.test(qr);
  root.innerHTML = key ? '<div class="pix-layout">' + (validQr ? '<figure class="pix-qr"><img src="' + esc(qr) + '" alt="QR Code para contribuir com o Diário dos BNs"><figcaption>Leia o QR Code com o aplicativo do seu banco.</figcaption></figure>' : '<div class="pix-qr pix-qr-empty">O administrador ainda não adicionou um QR Code.</div>') +
    '<div class="pix-key-block"><p>' + esc(value.instructions || 'Sua contribuição apoia a continuidade do projeto.') + '</p><p class="pix-key-label">Chave PIX</p><code class="pix-key-value">' + esc(key) + '</code><button class="button button-primary" type="button" data-copy-pix="' + esc(key) + '">Copiar chave PIX</button><p data-pix-copy-status role="status" aria-live="polite"></p></div></div>' : '<p>A chave PIX ainda não foi configurada. Volte mais tarde ou entre em contato com o responsável pelo site.</p>';
}

async function loadClassroom(root) {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { root.innerHTML = '<section class="auth-card"><h1>Turma não encontrada</h1><p>Abra o link recebido pelo professor ou administrador.</p></section>'; return; }
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) { location.href = 'login.html'; return; }
  const { data: role, error: roleError } = await supabase.from('user_roles').select('role,status').eq('user_id', auth.user.id).maybeSingle();
  if (roleError || !role || role.status === 'blocked') { root.innerHTML = '<section class="auth-card"><h1>Acesso indisponível</h1><p>Entre com uma conta ativa para abrir esta turma.</p><a href="login.html">Fazer login</a></section>'; return; }
  const [classResult, studentResult, teacherResult, permissionResult, activityResult, lessonResult, resourceResult, announcementResult, rosterResult, studentCountResult] = await Promise.all([
    supabase.from('classrooms').select('id,name,description,discipline,grade_level,status,starts_on,ends_on,join_code,join_code_enabled').eq('id', id).single(),
    supabase.from('student_classrooms').select('user_id,joined_at').eq('classroom_id', id),
    supabase.from('teacher_classrooms').select('user_id').eq('classroom_id', id),
    supabase.from('class_permissions').select('*').eq('classroom_id', id).maybeSingle(),
    supabase.from('classroom_activities').select('activity_id,due_at,related_lesson_id,class_lessons(title),activities(id,title,subject,description,created_by,is_published,approval_status,points,requires_response,activity_questions(id,prompt,position),activity_resources(id,title,resource_url,storage_bucket,storage_path))').eq('classroom_id', id),
    supabase.from('class_lessons').select('id,title,body,position,is_published,created_by').eq('classroom_id', id).order('position'),
    supabase.from('class_resources').select('id,title,description,resource_url,created_at').eq('classroom_id', id).order('created_at', { ascending: false }),
    supabase.from('class_announcements').select('id,title,body,created_at').eq('classroom_id', id).order('created_at', { ascending: false }),
    supabase.rpc('get_classroom_roster', { p_classroom: id }),
    supabase.rpc('get_classroom_student_count', { p_classroom: id })
  ]);
  if (classResult.error) { root.innerHTML = '<section class="auth-card"><h1>Você não tem acesso a esta turma</h1><p>O link pode estar incorreto ou sua conta não está vinculada.</p><a href="index.html">Voltar ao site</a></section>'; return; }
  const c = classResult.data, isAdmin = role.role === 'admin', isTeacher = role.role === 'professor' && role.status === 'active' && (teacherResult.data || []).some((t) => t.user_id === auth.user.id);
  const isStudent = role.role === 'aluno' && (studentResult.data || []).some((s) => s.user_id === auth.user.id);
  if (!isAdmin && !isTeacher && !isStudent) { root.innerHTML = '<section class="auth-card"><h1>Você não está inscrito nesta turma</h1><p>Peça o código de acesso ao professor e use a opção Entrar em uma turma na sua área.</p><a href="aluno.html">Voltar à minha área</a></section>'; return; }
  const p = permissionResult.data || {};
  const submissionResult = isStudent
    ? await supabase.from('activity_submissions').select('student_id,activity_id,response,submitted_at,submission_feedback(feedback)').eq('classroom_id', id).eq('student_id', auth.user.id)
    : (isAdmin || (isTeacher && p.can_view_progress)
      ? await supabase.from('activity_submissions').select('student_id,activity_id,response,submitted_at,activities(title),profiles!activity_submissions_student_id_fkey(display_name)').eq('classroom_id', id)
      : { data: [], error: null });
  const roster = rosterResult.data || [];
  const teacherRoster = roster.filter((item) => item.participant_role === 'professor');
  const studentRoster = roster.filter((item) => item.participant_role === 'aluno');
  const teachers = teacherRoster.map((t) => esc(t.display_name || 'Professor')).join(', ') || 'Sem professor vinculado';
  const students = studentRoster;
  const studentCount = Number(studentCountResult.data || 0);
  const visibleActivities = (activityResult.data || []).filter((row) => isAdmin || isTeacher || row.activities && row.activities.is_published && row.activities.approval_status === 'approved');
  const visibleLessons = (lessonResult.data || []).filter((l) => isAdmin || isTeacher || l.is_published);
  const submitted = new Map((submissionResult.data || []).map((row) => [row.activity_id, row]));
  const requiredActivityIds = new Set(visibleActivities.filter((row) => row.activities && row.activities.requires_response).map((row) => row.activity_id));
  const submittedByStudent = new Map();
  (submissionResult.data || []).forEach((row) => {
    if (!submittedByStudent.has(row.student_id)) submittedByStudent.set(row.student_id, new Set());
    submittedByStudent.get(row.student_id).add(row.activity_id);
  });
  const progressAccess = isAdmin || (isTeacher && p.can_view_progress);
  const participantStudents = progressAccess
    ? (students.map((s) => '<li>' + esc(s.display_name || 'Aluno') + '</li>').join('') || '<li>Nenhum aluno inscrito.</li>')
    : isStudent ? '<li>Você está inscrito. Os nomes dos outros estudantes ficam protegidos.</li>'
      : '<li>' + studentCount + ' estudante(s). Os dados individuais exigem permissão de acompanhamento.</li>';
  const progressSummary = progressAccess
    ? '<ul class="private-list">' + students.map((student) => {
      const submittedCount = Array.from(submittedByStudent.get(student.person_id) || []).filter((activityId) => requiredActivityIds.has(activityId)).length;
      const percent = requiredActivityIds.size ? Math.round(submittedCount * 100 / requiredActivityIds.size) : 0;
      return '<li><b>' + esc(student.display_name || 'Aluno') + '</b><span>' + submittedCount + ' de ' + requiredActivityIds.size + ' respostas · ' + percent + '%</span></li>';
    }).join('') + '</ul>'
    : '<p>Você enviou ' + Array.from(submittedByStudent.get(auth.user.id) || []).filter((activityId) => requiredActivityIds.has(activityId)).length + ' de ' + requiredActivityIds.size + ' respostas solicitadas.</p>';
  const responseReview = progressAccess
    ? '<h3>Respostas enviadas</h3><div class="db-grid">' + ((submissionResult.data || []).map((row) => '<article class="db-card"><h4>' + esc(row.profiles && row.profiles.display_name || 'Aluno') + ' · ' + esc(row.activities && row.activities.title || 'Atividade') + '</h4><p>' + esc(row.response || 'Resposta em branco.') + '</p><small>Enviada em ' + new Date(row.submitted_at).toLocaleString('pt-BR') + '</small></article>').join('') || '<p>Ainda não há respostas registradas.</p>') + '</div>'
    : '';
  const activityCards = visibleActivities.map((row) => {
    const activity = row.activities || {}, prior = submitted.get(row.activity_id);
    const questions = (activity.activity_questions || []).sort((a, b) => a.position - b.position).map((q) => '<li>' + esc(q.prompt) + '</li>').join('');
    const resources = (activity.activity_resources || []).map((resource) => {
      if (resource.storage_path) return '<li><button type="button" data-download-activity-resource="' + esc(resource.storage_path) + '" data-bucket="' + esc(resource.storage_bucket || 'class-materials') + '">' + esc(resource.title) + ' · baixar arquivo</button></li>';
      return /^https:\/\//i.test(resource.resource_url || '') ? '<li><a href="' + esc(resource.resource_url) + '" target="_blank" rel="noopener">' + esc(resource.title) + '</a></li>' : '';
    }).join('');
    const responseForm = isStudent && activity.requires_response ? '<form class="class-answer-form" data-answer-activity="' + esc(row.activity_id) + '"><label>Sua resposta<textarea name="response" rows="4" maxlength="5000" required>' + esc(prior && prior.response || '') + '</textarea></label><button class="button button-primary" type="submit">' + (prior ? 'Atualizar resposta' : 'Enviar resposta') + '</button><p role="status" aria-live="polite">' + (prior && prior.submission_feedback && prior.submission_feedback[0] ? 'Devolutiva: ' + esc(prior.submission_feedback[0].feedback) : '') + '</p></form>' : '';
    const editForm = isTeacher && p.can_edit_activities && activity.created_by === auth.user.id ? '<details class="activity-edit"><summary>Editar atividade</summary><form data-edit-class-activity="' + esc(row.activity_id) + '"><label>Título<input name="title" required maxlength="160" value="' + esc(activity.title) + '"></label><label>Disciplina<input name="subject" maxlength="100" value="' + esc(activity.subject || '') + '"></label><label>Instruções<textarea name="description" maxlength="5000" rows="4">' + esc(activity.description || '') + '</textarea></label><button class="button button-primary" type="submit">Salvar alterações</button><p role="status" aria-live="polite"></p></form></details>' : '';
    return '<article class="db-card"><span class="lesson-tag">' + esc(activity.subject || '') + '</span><h3>' + esc(activity.title || 'Atividade') + '</h3><p>' + esc(activity.description || '') + '</p>' + (row.class_lessons && row.class_lessons.title ? '<p>Aula relacionada: ' + esc(row.class_lessons.title) + '</p>' : '') + (questions ? '<ol>' + questions + '</ol>' : '') + (resources ? '<h4>Materiais relacionados</h4><ul>' + resources + '</ul>' : '') + '<p>Prazo: ' + esc(row.due_at ? new Date(row.due_at).toLocaleString('pt-BR') : 'não definido') + ' · ' + esc(activity.points || 0) + ' pontos</p>' + responseForm + editForm + '</article>';
  }).join('');
  const lessonCards = visibleLessons.map((lesson) => {
    const canEdit = isAdmin || (isTeacher && p.can_edit_lessons && lesson.created_by === auth.user.id);
    const editor = canEdit ? '<details class="activity-edit"><summary>Editar aula</summary><form data-edit-class-lesson="' + esc(lesson.id) + '"><label>Título<input name="title" required maxlength="160" value="' + esc(lesson.title) + '"></label><label>Conteúdo<textarea name="body" maxlength="8000" rows="5">' + esc(lesson.body || '') + '</textarea></label><button class="button button-primary" type="submit">Salvar aula</button><p role="status" aria-live="polite"></p></form></details>' : '';
    return '<article class="db-card"><h3>' + esc(lesson.title) + '</h3><p>' + esc(lesson.body) + '</p>' + editor + '</article>';
  }).join('');
  const tabs = [['lessons','Aulas'],['activities','Atividades'],['resources','Materiais'],['announcements','Avisos'],['participants','Participantes'],['progress','Progresso']];
  root.innerHTML = '<section class="dashboard-heading"><div><div class="lesson-tag">' + esc(c.discipline || 'Turma') + ' · ' + esc(c.grade_level || '') + '</div><h1>' + esc(c.name) + '</h1><p>' + esc(c.description || 'Espaço de aprendizagem da turma.') + '</p><p>Professor(es): ' + teachers + ' · ' + studentCount + ' aluno(s)</p></div><div class="dashboard-actions"><a class="button button-outline" href="' + (isTeacher ? 'professor.html' : isAdmin ? 'admin.html' : 'aluno.html') + '">Minha área</a><button class="button button-outline" type="button" data-class-logout>Sair</button></div></section>' +
    (isAdmin || isTeacher ? '<p class="auth-notice">Código da turma: <strong>' + esc(c.join_code) + '</strong> · ' + (c.join_code_enabled ? 'ativo' : 'desativado') + '</p>' : '') +
    '<div class="classroom-tabs" role="tablist" aria-label="Conteúdo da turma">' + tabs.map((t, i) => '<button type="button" role="tab" id="tab-' + t[0] + '" aria-controls="panel-' + t[0] + '" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? '0' : '-1') + '" data-class-tab="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>' +
    '<div id="panel-lessons" role="tabpanel" aria-labelledby="tab-lessons"><h2>Aulas</h2><div class="db-grid">' + (lessonCards || '<p>As aulas desta turma serão publicadas aqui.</p>') + '</div>' +
    (isAdmin || (isTeacher && p.can_create_lessons) ? '<form data-class-lesson class="admin-form"><h3>Adicionar aula</h3><label>Título<input name="title" required maxlength="160"></label><label>Conteúdo<textarea name="body" maxlength="8000"></textarea></label><button class="button button-primary">Salvar aula</button><p role="status"></p></form>' : '') + '</div>' +
    '<div id="panel-activities" role="tabpanel" aria-labelledby="tab-activities" hidden><h2>Atividades</h2><div class="db-grid">' + (activityCards || '<p>Nenhuma atividade liberada para exibição.</p>') + '</div></div>' +
    '<div id="panel-resources" role="tabpanel" aria-labelledby="tab-resources" hidden><h2>Materiais</h2><ul class="private-list">' + ((resourceResult.data || []).map((r) => '<li><a href="' + esc(r.resource_url) + '" target="_blank" rel="noopener">' + esc(r.title) + '</a><span>' + esc(r.description) + '</span></li>').join('') || '<li>Nenhum material publicado.</li>') + '</ul>' +
    (isAdmin || (isTeacher && p.can_send_materials) ? '<form data-class-resource class="admin-form"><h3>Compartilhar material</h3><label>Título<input name="title" required maxlength="160"></label><label>Descrição<input name="description" maxlength="1000"></label><label>Link HTTPS<input name="resource_url" type="url" required placeholder="https://…"></label><button class="button button-primary">Adicionar material</button><p role="status"></p></form>' : '') + '</div>' +
    '<div id="panel-announcements" role="tabpanel" aria-labelledby="tab-announcements" hidden><h2>Avisos</h2><div class="db-grid">' + ((announcementResult.data || []).map((a) => '<article class="db-card"><h3>' + esc(a.title) + '</h3><p>' + esc(a.body) + '</p><small>' + new Date(a.created_at).toLocaleDateString('pt-BR') + '</small></article>').join('') || '<p>Nenhum aviso publicado.</p>') + '</div>' +
    (isAdmin || (isTeacher && p.can_send_materials) ? '<form data-class-announcement class="admin-form"><h3>Publicar aviso</h3><label>Título<input name="title" required maxlength="160"></label><label>Texto<textarea name="body" required maxlength="5000"></textarea></label><button class="button button-primary">Publicar aviso</button><p role="status"></p></form>' : '') + '</div>' +
    '<div id="panel-participants" role="tabpanel" aria-labelledby="tab-participants" hidden><h2>Participantes</h2><h3>Professores</h3><ul class="private-list">' + teacherRoster.map((t) => '<li>' + esc(t.display_name || 'Professor') + '</li>').join('') + '</ul><h3>Alunos</h3><ul class="private-list">' + participantStudents + '</ul></div>' +
    '<div id="panel-progress" role="tabpanel" aria-labelledby="tab-progress" hidden><h2>Progresso</h2>' + progressSummary + responseReview + '</div>';
  root.querySelectorAll('[data-class-tab]').forEach((button) => button.addEventListener('click', () => {
    root.querySelectorAll('[data-class-tab]').forEach((tab) => { const active = tab === button; tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1; });
    root.querySelectorAll('[role="tabpanel"]').forEach((panel) => { panel.hidden = panel.id !== 'panel-' + button.dataset.classTab; });
  }));
  root.querySelector('.classroom-tabs')?.addEventListener('keydown', (event) => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    const controls = Array.from(root.querySelectorAll('[data-class-tab]')), current = controls.indexOf(document.activeElement);
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? controls.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : controls.length - 1)) % controls.length;
    event.preventDefault(); controls[index].focus(); controls[index].click();
  });
  root.querySelector('[data-class-logout]')?.addEventListener('click', async () => { await supabase.auth.signOut(); location.href = 'login.html'; });
  root.querySelector('[data-class-lesson]')?.addEventListener('submit', async (event) => {
    event.preventDefault(); const f = event.currentTarget, v = new FormData(f);
    const { error } = await supabase.from('class_lessons').insert({ classroom_id: id, created_by: auth.user.id, title: String(v.get('title')).trim(), body: String(v.get('body') || '') });
    statusText(f.querySelector('[role="status"]'), error ? 'Não foi possível salvar a aula: ' + error.message : 'Aula publicada.', Boolean(error));
    if (!error) setTimeout(() => location.reload(), 600);
  });
  root.querySelectorAll('[data-edit-class-lesson]').forEach((form) => form.addEventListener('submit', async (event) => {
    event.preventDefault(); const f = event.currentTarget, v = new FormData(f);
    const { error } = await supabase.from('class_lessons').update({ title: String(v.get('title')).trim(), body: String(v.get('body') || '').trim() }).eq('id', f.dataset.editClassLesson);
    statusText(f.querySelector('[role="status"]'), error ? 'Não foi possível atualizar a aula: ' + error.message : 'Aula atualizada.', Boolean(error));
    if (!error) setTimeout(() => location.reload(), 600);
  }));
  root.querySelector('[data-class-resource]')?.addEventListener('submit', async (event) => {
    event.preventDefault(); const f = event.currentTarget, v = new FormData(f), url = String(v.get('resource_url') || '').trim();
    if (!/^https:\/\//i.test(url)) { statusText(f.querySelector('[role="status"]'), 'Use um link HTTPS válido.', true); return; }
    const { error } = await supabase.from('class_resources').insert({ classroom_id: id, created_by: auth.user.id, title: String(v.get('title')).trim(), description: String(v.get('description') || ''), resource_url: url });
    statusText(f.querySelector('[role="status"]'), error ? 'Não foi possível salvar o material: ' + error.message : 'Material compartilhado.', Boolean(error));
    if (!error) setTimeout(() => location.reload(), 600);
  });
  root.querySelector('[data-class-announcement]')?.addEventListener('submit', async (event) => {
    event.preventDefault(); const f = event.currentTarget, v = new FormData(f);
    const { error } = await supabase.from('class_announcements').insert({ classroom_id: id, created_by: auth.user.id, title: String(v.get('title')).trim(), body: String(v.get('body')).trim() });
    statusText(f.querySelector('[role="status"]'), error ? 'Não foi possível publicar o aviso: ' + error.message : 'Aviso publicado.', Boolean(error));
    if (!error) setTimeout(() => location.reload(), 600);
  });
  root.querySelectorAll('[data-answer-activity]').forEach((form) => form.addEventListener('submit', async (event) => {
    event.preventDefault(); const f = event.currentTarget, v = new FormData(f);
    const { error } = await supabase.from('activity_submissions').upsert({ activity_id: f.dataset.answerActivity, classroom_id: id, student_id: auth.user.id, response: String(v.get('response') || '').trim() }, { onConflict: 'activity_id,classroom_id,student_id' });
    statusText(f.querySelector('[role="status"]'), error ? 'Não foi possível enviar. A atividade pode ter sido encerrada.' : 'Resposta enviada ao professor.', Boolean(error));
  }));
  root.querySelectorAll('[data-download-activity-resource]').forEach((button) => button.addEventListener('click', async () => {
    button.disabled = true;
    const { data, error } = await supabase.storage.from(button.dataset.bucket).createSignedUrl(button.dataset.downloadActivityResource, 60, { download: true });
    if (error) { button.disabled = false; button.title = error.message; alert('Não foi possível preparar o download. Confira sua inscrição e as permissões do arquivo.'); return; }
    const link = document.createElement('a'); link.href = data.signedUrl; link.download = ''; link.rel = 'noopener'; document.body.append(link); link.click(); link.remove();
    button.disabled = false;
  }));
  root.querySelectorAll('[data-edit-class-activity]').forEach((form) => form.addEventListener('submit', async (event) => {
    event.preventDefault(); const f = event.currentTarget, v = new FormData(f), current = visibleActivities.find((row) => row.activity_id === f.dataset.editClassActivity), activity = current && current.activities;
    if (!activity) return;
    const requiresReview = Boolean(p.require_activity_approval) || ['rejected','changes_requested'].includes(activity.approval_status);
    const values = { title: String(v.get('title')).trim(), subject: String(v.get('subject') || '').trim(), description: String(v.get('description') || '').trim() };
    if (requiresReview) Object.assign(values, { approval_status: 'pending', is_published: false, review_note: '', reviewed_by: null, reviewed_at: null, published_at: null });
    const { error } = await supabase.from('activities').update(values).eq('id', f.dataset.editClassActivity);
    statusText(f.querySelector('[role="status"]'), error ? 'Não foi possível salvar: ' + error.message : (requiresReview ? 'Alterações enviadas para aprovação.' : 'Atividade atualizada.'), Boolean(error));
    if (!error) setTimeout(() => location.reload(), 700);
  }));
}

if (document.body) {
  const observer = new MutationObserver(() => enhance());
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  enhance();
}
