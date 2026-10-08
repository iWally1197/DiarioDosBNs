/* Sistema independente de conta e turmas do Diário dos BNs.
   Os formulários já estão no HTML; este arquivo só conecta seus eventos.
   Não usa interceptação global de cliques nem espera pelo Supabase para mostrar a página. */
(() => {
  'use strict';

  const page = document.body.dataset.accountPage || '';
  const deadlineMs = 12000;
  let clientPromise;

  const byId = (id) => document.getElementById(id);
  const setText = (node, value) => { if (node) node.textContent = String(value ?? ''); };
  const show = (node, visible = true) => { if (node) node.hidden = !visible; };
  const pageUrl = (file) => new URL(file, document.baseURI);
  const go = (file) => window.location.assign(pageUrl(file).href);
  const roleName = (role) => ({ aluno: 'Aluno', professor: 'Professor', admin: 'Administrador' }[role] || 'Conta');
  const destinationFor = (role) => ({ admin: 'admin.html', professor: 'professor.html', aluno: 'aluno.html' }[role?.role] || 'minha-area.html');

  function withDeadline(promise, message, ms = deadlineMs) {
    let timer;
    return Promise.race([
      promise,
      new Promise((_, reject) => { timer = window.setTimeout(() => reject(new Error(message)), ms); })
    ]).finally(() => window.clearTimeout(timer));
  }

  function fetchWithDeadline(input, init = {}) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 15000);
    const parentSignal = init.signal;
    const abortFromParent = () => controller.abort(parentSignal?.reason);
    if (parentSignal?.aborted) abortFromParent();
    else parentSignal?.addEventListener('abort', abortFromParent, { once: true });
    return fetch(input, { ...init, signal: controller.signal }).finally(() => {
      window.clearTimeout(timer);
      parentSignal?.removeEventListener('abort', abortFromParent);
    });
  }

  function getClient() {
    if (!clientPromise) {
      clientPromise = withDeadline(Promise.all([
        import('./supabase-config.js'),
        import('https://esm.sh/@supabase/supabase-js@2')
      ]), 'O serviço de conta demorou para abrir. Confira a internet e tente de novo.')
        .then(([configModule, sdk]) => {
          const config = configModule.supabaseConfig;
          if (!config?.url || !config?.publishableKey) throw new Error('Falta configurar o Supabase neste site.');
          return sdk.createClient(config.url, config.publishableKey, {
            auth: {
              flowType: 'pkce',
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true
            },
            global: { fetch: fetchWithDeadline }
          });
        })
        .catch((error) => { clientPromise = null; throw error; });
    }
    return clientPromise;
  }

  function messageFor(error, fallback = 'Não foi possível concluir. Confira sua conexão e tente novamente.') {
    const raw = String(error?.message || error || '');
    const lower = raw.toLowerCase();
    if (lower.includes('invalid login') || lower.includes('invalid credentials')) return 'E-mail ou senha não conferem.';
    if (lower.includes('email not confirmed')) return 'Confirme seu e-mail pelo link enviado antes de entrar.';
    if (lower.includes('already registered') || lower.includes('user already registered')) return 'Não foi possível concluir o cadastro. Se você já tiver uma conta, tente entrar ou recuperar a senha.';
    if (lower.includes('signup is disabled') || lower.includes('signups not allowed')) return 'O cadastro está desativado no Supabase. O responsável precisa ativar novos cadastros.';
    if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('abort')) return 'A conexão demorou ou caiu. Atualize a página e tente novamente.';
    if (lower.includes('demorou para responder') || lower.includes('timed out') || lower.includes('timeout')) return raw;
    if (lower.includes('redirect') && lower.includes('not allowed')) return 'O endereço de retorno ainda não foi liberado nas configurações do Supabase.';
    if (raw.includes('A senha precisa') || raw.includes('As senhas digitadas')) return raw;
    if (raw.includes('Esta conta está indisponível')) return raw;
    if (raw.includes('Aprovação docente necessária') || raw.includes('aguarda aprovação')) return 'A conta de professor ainda aguarda aprovação do responsável pelo site.';
    if (raw.includes('Somente o administrador') || raw.includes('Apenas o administrador')) return 'Essa ação só pode ser feita pelo administrador do site.';
    if (raw.includes('Código inválido') || raw.includes('código de turma')) return 'O código não confere ou a turma não está aceitando novos alunos.';
    if (/aceite vigente dos termos/i.test(raw)) return 'Marque que leu e aceitou os Termos de Uso e a Política de Privacidade.';
    if (/escolha aluno ou professor/i.test(raw)) return 'Escolha se a conta será de aluno ou professor.';
    if (/informe seu nome/i.test(raw)) return 'Digite seu nome para continuar.';
    if (/selecione sua faixa etária/i.test(raw)) return 'Escolha sua faixa etária.';
    if (/selecione sua etapa de ensino/i.test(raw)) return 'Escolha sua etapa de ensino.';
    if (/informe sua formação docente/i.test(raw)) return 'Preencha sua formação e seu curso ou área.';
    if (/confirme.*conta de professor/i.test(raw)) return 'Confirme que o cadastro de professor precisa de aprovação.';
    if (/permission denied|database error|trigger|profiles|user_roles|row-level security|rls/i.test(raw)) return 'O banco precisa de um ajuste para concluir esta ação. Avise o responsável pelo site.';
    return fallback;
  }

  function bindPasswordToggles() {
    document.querySelectorAll('[data-password-toggle]').forEach((button) => {
      const input = byId(button.dataset.passwordToggle);
      if (!input) return;
      button.addEventListener('click', () => {
        const reveal = input.type === 'password';
        input.type = reveal ? 'text' : 'password';
        button.textContent = reveal ? 'Ocultar senha' : 'Mostrar senha';
        button.setAttribute('aria-pressed', String(reveal));
      });
    });
  }

  function status(node, text, kind = '') {
    if (!node) return;
    node.textContent = text;
    node.classList.remove('is-error', 'is-success', 'is-busy');
    if (kind) node.classList.add(`is-${kind}`);
    node.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  }

  function bindSubmit(form, run) {
    if (!form) return;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const button = form.querySelector('button[type="submit"]');
      const notice = form.querySelector('[data-status]');
      if (button?.disabled) return;
      if (button) button.disabled = true;
      if (notice) status(notice, 'Conectando…', 'busy');
      try {
        const client = await getClient();
        await run(form, client, notice);
      } catch (error) {
        console.error('Falha no sistema de conta:', error);
        status(notice, messageFor(error), 'error');
      } finally {
        if (button) button.disabled = false;
      }
    });
  }

  async function readRole(client, userId) {
    const result = await withDeadline(
      client.from('user_roles').select('role,status').eq('user_id', userId).maybeSingle(),
      'A consulta do perfil demorou demais.'
    );
    if (result.error) throw result.error;
    return result.data;
  }

  async function currentSession(client) {
    const result = await withDeadline(client.auth.getSession(), 'A verificação da sessão demorou demais.');
    if (result.error) throw result.error;
    return result.data.session;
  }

  function initLogin() {
    bindSubmit(byId('login-form'), async (form, client, notice) => {
      const { data, error } = await withDeadline(
        client.auth.signInWithPassword({
          email: form.elements.email.value.trim(),
          password: form.elements.password.value
        }),
        'O login demorou para responder. Confira sua conexão e tente novamente.',
        18000
      );
      if (error) throw error;
      const role = await readRole(client, data.user.id);
      if (!role || role.status === 'blocked') {
        await client.auth.signOut();
        throw new Error('Esta conta está indisponível. Fale com o responsável pelo site.');
      }
      status(notice, 'Entrada realizada. Abrindo suas turmas…', 'success');
      go(destinationFor(role));
    });
  }

  function initSignup() {
    const form = byId('signup-form');
    const role = byId('signup-role');
    const studentFields = byId('student-fields');
    const teacherFields = byId('teacher-fields');
    const syncRole = () => {
      const isTeacher = role?.value === 'professor';
      show(studentFields, !isTeacher);
      show(teacherFields, isTeacher);
      const education = byId('signup-education');
      const degree = byId('signup-degree');
      const course = byId('signup-course');
      const ack = byId('teacher-ack-check');
      if (education) education.required = !isTeacher;
      if (degree) degree.required = isTeacher;
      if (course) course.required = isTeacher;
      if (ack) ack.required = isTeacher;
    };
    role?.addEventListener('change', syncRole);
    syncRole();

    bindSubmit(form, async (currentForm, client, notice) => {
      const values = new FormData(currentForm);
      const password = String(values.get('password') || '');
      const confirm = String(values.get('confirm') || '');
      if (password.length < 10) throw new Error('A senha precisa ter pelo menos 10 caracteres.');
      if (password !== confirm) throw new Error('As senhas digitadas não são iguais.');
      const requestedRole = String(values.get('role'));
      const teacher = requestedRole === 'professor';
      const callback = pageUrl('auth-callback.html').href;
      const { data, error } = await withDeadline(
        client.auth.signUp({
        email: String(values.get('email') || '').trim(),
        password,
        options: {
          emailRedirectTo: callback,
          data: {
            display_name: String(values.get('name') || '').trim(),
            requested_role: teacher ? 'professor' : 'aluno',
            age_range: String(values.get('age_range') || ''),
            education_level: teacher ? '' : String(values.get('education_level') || ''),
            education_detail: teacher ? '' : String(values.get('education_detail') || '').trim(),
            teacher_degree_level: teacher ? String(values.get('teacher_degree_level') || '') : '',
            teacher_degree_program: teacher ? String(values.get('teacher_degree_program') || '').trim() : '',
            teacher_institution: teacher ? String(values.get('teacher_institution') || '').trim() : '',
            teacher_verification_ack: teacher ? 'true' : 'false',
            terms_version: '1.0',
            privacy_version: '1.0'
          }
        }
        }),
        'O cadastro demorou para responder. Confira sua conexão e tente novamente.',
        22000
      );
      if (error) throw error;
      if (data.session) {
        const userRole = await readRole(client, data.user.id);
        status(notice, teacher ? 'Conta criada. A conta de professor precisa ser aprovada.' : 'Conta criada com sucesso.', 'success');
        go(destinationFor(userRole));
        return;
      }
      status(notice, 'Cadastro iniciado. Abra o e-mail de confirmação para ativar a conta. Se a mensagem não chegar, confira o spam.', 'success');
    });
  }

  function initRecovery() {
    const requestForm = byId('recovery-form');
    const updateForm = byId('password-update-form');
    const updating = new URLSearchParams(location.search).get('mode') === 'update';
    show(requestForm, !updating);
    show(updateForm, updating);
    if (updating) {
      const notice = byId('recovery-link-status');
      getClient().then(currentSession).then((session) => {
        if (!session) status(notice, 'O link não abriu uma sessão. Peça um link novo e abra-o no mesmo navegador.', 'error');
        else status(notice, 'Link confirmado. Escolha sua nova senha.', 'success');
      }).catch((error) => status(notice, messageFor(error), 'error'));
    }
    bindSubmit(requestForm, async (form, client, notice) => {
      const redirectTo = pageUrl('recuperar-senha.html?mode=update').href;
      const { error } = await client.auth.resetPasswordForEmail(form.elements.email.value.trim(), { redirectTo });
      if (error) throw error;
      status(notice, 'Pedido enviado. Confira sua caixa de entrada e a pasta de spam.', 'success');
      form.reset();
    });
    bindSubmit(updateForm, async (form, client, notice) => {
      const password = form.elements.password.value;
      if (password.length < 10) throw new Error('A senha precisa ter pelo menos 10 caracteres.');
      if (password !== form.elements.confirm.value) throw new Error('As senhas digitadas não são iguais.');
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
      await client.auth.signOut();
      status(notice, 'Senha alterada. Entre novamente com a nova senha.', 'success');
      window.setTimeout(() => go('login.html'), 1200);
    });
  }

  function initCallback() {
    const notice = byId('callback-status');
    getClient().then(currentSession).then((session) => {
      if (!session) {
        status(notice, 'Não conseguimos confirmar este link. Ele pode ter expirado ou já ter sido usado. Peça outro.', 'error');
        show(byId('callback-links'), true);
        return;
      }
      status(notice, 'E-mail confirmado. Abrindo sua conta…', 'success');
      getClient().then((client) => readRole(client, session.user.id)).then((role) => {
        window.setTimeout(() => go(destinationFor(role)), 700);
      }).catch(() => {
        window.setTimeout(() => go('minha-area.html'), 700);
      });
    }).catch((error) => {
      status(notice, messageFor(error), 'error');
      show(byId('callback-links'), true);
    });
  }

  function node(tag, text = '', className = '') {
    const item = document.createElement(tag);
    if (text !== '') item.textContent = String(text);
    if (className) item.className = className;
    return item;
  }

  function safeLink(href, label, className = 'account-link-button') {
    const link = node('a', label, className);
    link.href = href;
    return link;
  }

  function mountClassCards(container, rows, role) {
    if (!container) return;
    container.replaceChildren();
    if (!rows?.length) {
      container.append(node('p', role === 'aluno'
        ? 'Você ainda não entrou em uma turma. Use o código recebido do professor.'
        : 'Nenhuma turma está vinculada a esta conta.'));
      return;
    }
    rows.forEach((row) => {
      const classroom = row.classrooms || row;
      const id = classroom.id || row.classroom_id;
      if (!id) return;
      const card = node('article', '', 'account-card class-card');
      card.append(node('h3', classroom.name || 'Turma'));
      if (classroom.discipline || classroom.grade_level) card.append(node('p', [classroom.discipline, classroom.grade_level].filter(Boolean).join(' · ')));
      if (classroom.description) card.append(node('p', classroom.description));
      const isStaff = role === 'admin' || role === 'professor';
      if (isStaff && classroom.join_code) {
        const code = node('p', `Código: ${classroom.join_code}`, 'class-code');
        card.append(code);
        const copy = node('button', 'Copiar código', 'account-button account-button-light');
        copy.type = 'button';
        copy.addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(classroom.join_code); copy.textContent = 'Copiado'; }
          catch { copy.textContent = classroom.join_code; }
        });
        card.append(copy);
      }
      card.append(safeLink(`turma.html?id=${encodeURIComponent(id)}`, 'Abrir turma'));
      if (role === 'aluno') {
        const leave = node('button', 'Sair da turma', 'account-button account-button-light');
        leave.type = 'button';
        leave.addEventListener('click', async () => {
          leave.disabled = true;
          try {
            const client = await getClient();
            const { error } = await client.from('student_classrooms').delete().eq('classroom_id', id).eq('user_id', row.user_id);
            if (error) throw error;
            await loadWorkspace();
          } catch (error) { leave.disabled = false; window.alert(messageFor(error)); }
        });
        card.append(leave);
      }
      container.append(card);
    });
  }

  async function loadWorkspace() {
    const notice = byId('workspace-status');
    const signInLink = byId('workspace-signin');
    try {
      const client = await getClient();
      const session = await currentSession(client);
      if (!session) {
        status(notice, 'Entre na sua conta para abrir o painel.', 'error');
        show(signInLink, true);
        show(byId('workspace-content'), false);
        return;
      }
      show(signInLink, false);
      show(byId('workspace-content'), true);
      status(notice, 'Carregando seu perfil…', 'busy');
      const user = session.user;
      const [profileResult, role] = await Promise.all([
        client.from('profiles').select('display_name').eq('id', user.id).maybeSingle(),
        readRole(client, user.id)
      ]);
      if (profileResult.error) throw profileResult.error;
      if (!role) throw new Error('Esta conta ainda não tem um perfil ativo. Confirme o e-mail ou peça ajuda ao responsável pelo site.');
      if (role.status === 'blocked') throw new Error('Esta conta está suspensa. Fale com o responsável pelo site.');
      setText(byId('workspace-name'), profileResult.data?.display_name || user.email || 'Sua conta');
      setText(byId('workspace-email'), user.email || '');
      setText(byId('workspace-role'), `${roleName(role.role)}${role.status === 'pending' ? ' · aguardando aprovação' : ''}`);
      show(byId('student-tools'), role.role === 'aluno' && role.status === 'active');
      show(byId('admin-tools'), role.role === 'admin' && role.status === 'active');
      show(byId('class-list-section'), role.status === 'active');
      show(byId('teacher-pending'), role.role === 'professor' && role.status !== 'active');
      show(byId('teacher-tools'), role.role === 'professor' && role.status === 'active');

      if (role.role === 'professor') {
        const verification = await client.from('teacher_verifications').select('status,admin_note').eq('user_id', user.id).maybeSingle();
        if (verification.error) throw verification.error;
        setText(byId('teacher-note'), verification.data?.admin_note || 'A aprovação é feita pelo administrador do site.');
        show(byId('teacher-reanalysis-form'), ['rejected', 'review'].includes(verification.data?.status));
        if (role.status === 'active') {
          const result = await client.from('teacher_classrooms').select('classroom_id,user_id,classrooms(id,name,description,discipline,grade_level,status,join_code)').eq('user_id', user.id);
          if (result.error) throw result.error;
          mountClassCards(byId('class-list'), result.data, role.role);
        }
      } else if (role.role === 'aluno' && role.status === 'active') {
        const result = await client.from('student_classrooms').select('classroom_id,user_id,joined_at,classrooms(id,name,description,discipline,grade_level,status)').eq('user_id', user.id).order('joined_at', { ascending: false });
        if (result.error) throw result.error;
        mountClassCards(byId('class-list'), result.data, role.role);
      } else if (role.role === 'admin' && role.status === 'active') {
        await loadAdminTools(client);
      }
      status(notice, 'Tudo pronto.', 'success');
    } catch (error) {
      console.error('Falha ao abrir o painel:', error);
      status(notice, messageFor(error, 'Não foi possível abrir o painel.'), 'error');
    }
  }

  async function loadAdminTools(client) {
    const classList = byId('class-list');
    const teacherList = byId('teacher-requests');
    const classSelect = byId('teacher-class-select');
    const permissionSelect = byId('permission-class-select');
    const [classesResult, teacherResult] = await Promise.all([
      client.from('classrooms').select('id,name,description,join_code,is_open,status').order('created_at', { ascending: false }),
      client.rpc('admin_teacher_verifications')
    ]);
    if (classesResult.error) throw classesResult.error;
    if (teacherResult.error) throw teacherResult.error;
    mountClassCards(classList, classesResult.data, 'admin');
    [classSelect, permissionSelect].forEach((select) => {
      if (!select) return;
      const previous = select.value;
      select.replaceChildren(new Option('Escolha uma turma', ''));
      (classesResult.data || []).forEach((item) => select.add(new Option(item.name, item.id)));
      if ([...select.options].some((option) => option.value === previous)) select.value = previous;
    });

    if (teacherList) {
      teacherList.replaceChildren();
      const teachers = teacherResult.data || [];
      const ids = teachers.map((item) => item.user_id).filter(Boolean);
      let profileMap = new Map();
      if (ids.length) {
        const profiles = await client.from('profiles').select('id,age_range,education_level,education_detail,teacher_degree_level,teacher_degree_program,teacher_institution').in('id', ids);
        if (!profiles.error) profileMap = new Map((profiles.data || []).map((item) => [item.id, item]));
      }
      if (!teachers.length) teacherList.append(node('p', 'Nenhuma solicitação de professor.'));
      teachers.forEach((teacher) => {
        const card = node('article', '', 'account-card teacher-request');
        card.append(node('h3', teacher.display_name || teacher.email || 'Professor'));
        card.append(node('p', teacher.email || ''));
        card.append(node('p', `Situação: ${teacher.status}`));
        const profile = profileMap.get(teacher.user_id);
        const details = [profile?.teacher_degree_level, profile?.teacher_degree_program, profile?.teacher_institution].filter(Boolean).join(' · ');
        if (details) card.append(node('p', details));
        if (teacher.admin_note) card.append(node('p', `Observação: ${teacher.admin_note}`));
        if (['pending', 'review', 'rejected'].includes(teacher.status)) {
          [['verified', 'Aprovar'], ['review', 'Pedir informação'], ['rejected', 'Recusar']].forEach(([value, label]) => {
            const button = node('button', label, 'account-button account-button-light');
            button.type = 'button';
            button.addEventListener('click', async () => {
              button.disabled = true;
              try {
                const { error } = await client.rpc('admin_review_teacher', { p_user_id: teacher.user_id, p_status: value, p_note: '' });
                if (error) throw error;
                await loadAdminTools(client);
              } catch (error) { button.disabled = false; window.alert(messageFor(error)); }
            });
            card.append(button);
          });
        }
        teacherList.append(card);
      });
      const teacherSelect = byId('teacher-select');
      if (teacherSelect) {
        const previous = teacherSelect.value;
        teacherSelect.replaceChildren(new Option('Escolha um professor aprovado', ''));
        teachers.filter((item) => item.status === 'verified').forEach((item) => {
          teacherSelect.add(new Option(item.display_name || item.email || 'Professor', item.user_id));
        });
        if ([...teacherSelect.options].some((option) => option.value === previous)) teacherSelect.value = previous;
      }
    }

    await loadActivityReviews(client);

    const createClass = byId('create-class-form');
    bindSubmitOnce(createClass, async (form, notice) => {
      const { error, data } = await client.rpc('create_classroom', {
        p_name: form.elements.name.value.trim(),
        p_description: form.elements.description.value.trim()
      });
      if (error) throw error;
      const created = Array.isArray(data) ? data[0] : data;
      status(notice, created?.join_code ? `Turma criada. Código para alunos: ${created.join_code}` : 'Turma criada.', 'success');
      form.reset();
      await loadAdminTools(client);
    });
    const assignTeacher = byId('assign-teacher-form');
    bindSubmitOnce(assignTeacher, async (form, notice) => {
      const { error } = await client.from('teacher_classrooms').upsert({
        classroom_id: form.elements.classroom.value,
        user_id: form.elements.teacher.value
      }, { onConflict: 'classroom_id,user_id' });
      if (error) throw error;
      status(notice, 'Professor vinculado à turma.', 'success');
      form.reset();
    });
    initPermissionForm(client);
  }

  async function loadActivityReviews(client) {
    const container = byId('activity-reviews');
    if (!container) return;
    container.replaceChildren();
    const { data, error } = await client.from('activities')
      .select('id,title,subject,description,approval_status,is_published')
      .or('approval_status.eq.pending,is_published.eq.false')
      .order('created_at', { ascending: false }).limit(100);
    if (error) { container.append(node('p', `Não foi possível consultar atividades pendentes: ${messageFor(error)}`)); return; }
    const items = data || [];
    if (!items.length) { container.append(node('p', 'Nenhuma atividade precisa de revisão.')); return; }
    items.forEach((activity) => {
      const card = node('article', '', 'account-card');
      card.append(node('h3', activity.title));
      if (activity.subject) card.append(node('p', activity.subject));
      if (activity.description) card.append(node('p', activity.description));
      card.append(node('p', `Estado: ${activity.approval_status}${activity.is_published ? ' · publicada' : ' · não publicada'}`));
      [['approved', 'Aprovar e publicar'], ['changes_requested', 'Pedir alteração'], ['rejected', 'Recusar']].forEach(([value, label]) => {
        const button = node('button', label, 'account-button account-button-light');
        button.type = 'button';
        button.addEventListener('click', async () => {
          button.disabled = true;
          try {
            const { error: reviewError } = await client.rpc('admin_review_activity', { p_activity: activity.id, p_status: value, p_note: '' });
            if (reviewError) throw reviewError;
            await loadActivityReviews(client);
          } catch (reviewError) { button.disabled = false; window.alert(messageFor(reviewError)); }
        });
        card.append(button);
      });
      container.append(card);
    });
  }

  const boundForms = new WeakSet();
  function bindSubmitOnce(form, run) {
    if (!form || boundForms.has(form)) return;
    boundForms.add(form);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const button = form.querySelector('button[type="submit"]');
      const notice = form.querySelector('[data-status]');
      if (button) button.disabled = true;
      try { await run(form, notice); }
      catch (error) { console.error(error); status(notice, messageFor(error), 'error'); }
      finally { if (button) button.disabled = false; }
    });
  }

  function initPermissionForm(client) {
    const select = byId('permission-class-select');
    const form = byId('permissions-form');
    if (!select || !form || select.dataset.bound) return;
    select.dataset.bound = 'true';
    select.addEventListener('change', async () => {
      const notice = byId('permission-status');
      if (!select.value) { show(form, false); return; }
      try {
        const { data, error } = await client.from('class_permissions').select('*').eq('classroom_id', select.value).maybeSingle();
        if (error) throw error;
        for (const field of form.querySelectorAll('input[type="checkbox"][name]')) field.checked = Boolean(data?.[field.name]);
        show(form, true);
      } catch (error) { status(notice, messageFor(error), 'error'); }
    });
    bindSubmitOnce(form, async (currentForm, notice) => {
      const values = new FormData(currentForm);
      const { error } = await client.rpc('admin_set_class_permissions', {
        p_classroom: select.value,
        p_can_create_activities: values.has('can_create_activities'),
        p_can_edit_activities: values.has('can_edit_activities'),
        p_can_publish_activities: values.has('can_publish_activities'),
        p_require_activity_approval: values.has('require_activity_approval'),
        p_can_create_lessons: values.has('can_create_lessons'),
        p_can_edit_lessons: values.has('can_edit_lessons'),
        p_can_send_materials: values.has('can_send_materials'),
        p_can_view_progress: values.has('can_view_progress')
      });
      if (error) throw error;
      status(notice, 'Permissões salvas.', 'success');
    });
  }

  function bindWorkspaceForms() {
    const joinForm = byId('join-class-form');
    bindSubmit(joinForm, async (form, client, notice) => {
      const { error } = await client.rpc('join_class_by_code', { p_code: form.elements.code.value.trim().toUpperCase() });
      if (error) throw error;
      status(notice, 'Você entrou na turma.', 'success');
      form.reset();
      await loadWorkspace();
    });
    const reanalysis = byId('teacher-reanalysis-form');
    bindSubmit(reanalysis, async (_form, client, notice) => {
      const { error } = await client.rpc('request_teacher_reanalysis');
      if (error) throw error;
      status(notice, 'Pedido enviado para o administrador.', 'success');
      await loadWorkspace();
    });
    const logout = byId('logout-button');
    logout?.addEventListener('click', async () => {
      logout.disabled = true;
      try {
        const client = await getClient();
        const { error } = await client.auth.signOut();
        if (error) throw error;
        go('login.html');
      } catch (error) { logout.disabled = false; window.alert(messageFor(error)); }
    });
  }

  function insertContentForm(root, title, fields, onSave) {
    const form = node('form', '', 'account-form class-content-form');
    form.method = 'post';
    form.append(node('h3', title));
    fields.forEach((field) => {
      const label = node('label', field.label);
      const input = field.multiline ? node('textarea') : node('input');
      input.name = field.name;
      input.required = field.required !== false;
      if (field.type) input.type = field.type;
      if (field.maxLength) input.maxLength = field.maxLength;
      if (field.placeholder) input.placeholder = field.placeholder;
      label.append(input);
      form.append(label);
    });
    const button = node('button', 'Publicar', 'account-button account-button-primary');
    button.type = 'submit';
    form.append(button);
    const notice = node('p', '', 'account-message');
    notice.dataset.status = '';
    form.append(notice);
    root.append(form);
    bindSubmitOnce(form, async (currentForm, statusNode) => {
      await onSave(new FormData(currentForm));
      status(statusNode, 'Salvo.', 'success');
      currentForm.reset();
      window.setTimeout(() => window.location.reload(), 500);
    });
  }

  async function initClassroom() {
    const root = byId('classroom-content');
    const notice = byId('classroom-status');
    const classId = new URLSearchParams(location.search).get('id');
    if (!classId) { status(notice, 'Falta o código da turma no endereço.', 'error'); return; }
    try {
      const client = await getClient();
      const session = await currentSession(client);
      if (!session) { status(notice, 'Entre na sua conta para abrir esta turma.', 'error'); show(byId('classroom-signin'), true); return; }
      const role = await readRole(client, session.user.id);
      if (!role || role.status !== 'active') throw new Error('Esta conta ainda não tem acesso ativo às turmas.');
      const { data: classroom, error: classError } = await client.from('classrooms')
        .select('id,name,description,discipline,grade_level,status,is_open')
        .eq('id', classId).maybeSingle();
      if (classError) throw classError;
      if (!classroom) throw new Error('Turma não encontrada ou sua conta não está inscrita nela.');
      setText(byId('classroom-title'), classroom.name);
      setText(byId('classroom-description'), [classroom.discipline, classroom.grade_level, classroom.description].filter(Boolean).join(' · '));
      status(notice, 'Carregando materiais e atividades…', 'busy');

      const [announcements, lessons, resources, assignments, permissions] = await Promise.all([
        client.from('class_announcements').select('id,title,body,created_at').eq('classroom_id', classId).order('created_at', { ascending: false }),
        client.from('class_lessons').select('id,title,body,is_published,created_at').eq('classroom_id', classId).order('created_at', { ascending: false }),
        client.from('class_resources').select('id,title,description,resource_url,created_at').eq('classroom_id', classId).order('created_at', { ascending: false }),
        client.from('classroom_activities').select('activity_id,due_at,activities(id,title,subject,description,is_published,approval_status,points,requires_response,activity_questions(prompt,position),activity_resources(title,resource_url))').eq('classroom_id', classId).order('created_at', { ascending: false }),
        client.from('class_permissions').select('can_create_activities,can_create_lessons,can_send_materials,can_view_progress').eq('classroom_id', classId).maybeSingle()
      ]);
      const sections = [
        ['Avisos', announcements, 'class-announcements-list'],
        ['Aulas', lessons, 'class-lessons-list'],
        ['Materiais', resources, 'class-resources-list']
      ];
      sections.forEach(([title, result, target]) => {
        const section = byId(target);
        if (!section) return;
        section.replaceChildren();
        if (result.error) { section.append(node('p', `Não foi possível carregar ${title.toLowerCase()}: ${messageFor(result.error)}`)); return; }
        const rows = result.data || [];
        if (!rows.length) section.append(node('p', `Ainda não há ${title.toLowerCase()} nesta turma.`));
        rows.forEach((item) => {
          const article = node('article', '', 'account-card');
          article.append(node('h3', item.title));
          if (item.body) article.append(node('p', item.body, 'account-prewrap'));
          if (item.description) article.append(node('p', item.description));
          if (item.resource_url && /^https:\/\//i.test(item.resource_url)) article.append(safeLink(item.resource_url, 'Abrir material'));
          section.append(article);
        });
      });
      await renderClassActivities(client, session.user, role, classId, assignments, byId('class-activities-list'));

      const isAdmin = role.role === 'admin';
      let canLessons = isAdmin, canMaterials = isAdmin, canActivities = isAdmin;
      if (role.role === 'professor' && role.status === 'active') {
        const [lessonPermission, materialPermission, activityPermission] = await Promise.all([
          client.rpc('teacher_class_can', { p_classroom: classId, p_permission: 'create_lessons' }),
          client.rpc('teacher_class_can', { p_classroom: classId, p_permission: 'send_materials' }),
          client.rpc('teacher_class_can', { p_classroom: classId, p_permission: 'create_activities' })
        ]);
        canLessons = Boolean(lessonPermission.data) && !lessonPermission.error;
        canMaterials = Boolean(materialPermission.data) && !materialPermission.error;
        canActivities = Boolean(activityPermission.data) && !activityPermission.error;
      }
      const authoring = byId('class-authoring');
      authoring?.replaceChildren();
      if (canLessons && authoring) insertContentForm(authoring, 'Publicar uma aula', [
        { name: 'title', label: 'Título', maxLength: 160 },
        { name: 'body', label: 'Texto da aula', multiline: true, required: false, maxLength: 8000 }
      ], async (values) => {
        const { error } = await client.from('class_lessons').insert({ classroom_id: classId, created_by: session.user.id, title: String(values.get('title')).trim(), body: String(values.get('body') || ''), is_published: true });
        if (error) throw error;
      });
      if (canMaterials && authoring) {
        insertContentForm(authoring, 'Publicar um aviso', [
          { name: 'title', label: 'Título', maxLength: 160 },
          { name: 'body', label: 'Aviso', multiline: true, maxLength: 5000 }
        ], async (values) => {
          const { error } = await client.from('class_announcements').insert({ classroom_id: classId, created_by: session.user.id, title: String(values.get('title')).trim(), body: String(values.get('body')).trim() });
          if (error) throw error;
        });
        insertContentForm(authoring, 'Compartilhar um material', [
          { name: 'title', label: 'Título', maxLength: 160 },
          { name: 'description', label: 'Descrição', required: false, maxLength: 1000 },
          { name: 'resource_url', label: 'Link seguro (https://)', type: 'url', placeholder: 'https://…', maxLength: 2000 }
        ], async (values) => {
          const url = String(values.get('resource_url') || '').trim();
          if (!/^https:\/\//i.test(url)) throw new Error('Use um link que comece com https://.');
          const { error } = await client.from('class_resources').insert({ classroom_id: classId, created_by: session.user.id, title: String(values.get('title')).trim(), description: String(values.get('description') || '').trim(), resource_url: url });
          if (error) throw error;
        });
      }
      if (canActivities && authoring) insertContentForm(authoring, 'Criar uma atividade', [
        { name: 'title', label: 'Título', maxLength: 160 },
        { name: 'subject', label: 'Assunto', required: false, maxLength: 100 },
        { name: 'description', label: 'Orientações', multiline: true, required: false, maxLength: 5000 },
        { name: 'due_at', label: 'Prazo (opcional)', type: 'datetime-local', required: false }
      ], async (values) => {
        const due = String(values.get('due_at') || '');
        if (isAdmin) {
          const { data, error } = await client.from('activities').insert({
            title: String(values.get('title')).trim(), subject: String(values.get('subject') || '').trim(),
            description: String(values.get('description') || '').trim(), created_by: session.user.id,
            approval_status: 'approved', is_published: true, published_at: new Date().toISOString()
          }).select('id').single();
          if (error) throw error;
          const assignment = await client.from('classroom_activities').insert({
            activity_id: data.id, classroom_id: classId, assigned_by: session.user.id,
            due_at: due ? new Date(due).toISOString() : null
          });
          if (assignment.error) throw new Error(`A atividade foi criada, mas não pôde ser vinculada: ${messageFor(assignment.error)}`);
        } else {
          const { error } = await client.rpc('teacher_submit_activity', {
            p_classroom: classId,
            p_title: String(values.get('title')).trim(),
            p_subject: String(values.get('subject') || '').trim(),
            p_description: String(values.get('description') || '').trim(),
            p_due_at: due ? new Date(due).toISOString() : null,
            p_points: 0,
            p_requires_response: true,
            p_is_draft: false,
            p_related_lesson: null
          });
          if (error) throw error;
        }
      });
      if (permissions.error) console.warn('Não foi possível consultar as permissões da turma:', permissions.error.message);
      status(notice, 'Turma aberta.', 'success');
    } catch (error) {
      console.error('Falha ao abrir a turma:', error);
      status(notice, messageFor(error, 'Não foi possível abrir esta turma.'), 'error');
    }
  }

  async function renderClassActivities(client, user, role, classId, result, container) {
    if (!container) return;
    container.replaceChildren();
    if (result.error) { container.append(node('p', `Não foi possível carregar as atividades: ${messageFor(result.error)}`)); return; }
    const assigned = result.data || [];
    if (!assigned.length) { container.append(node('p', 'Ainda não há atividades nesta turma.')); return; }
    let submissions = [];
    if (role.role === 'aluno') {
      const prior = await client.from('activity_submissions').select('activity_id,response,submitted_at').eq('classroom_id', classId).eq('student_id', user.id);
      if (prior.error) console.warn('Não foi possível buscar suas respostas salvas:', prior.error.message);
      submissions = prior.data || [];
    }
    const submittedByActivity = new Map(submissions.map((item) => [item.activity_id, item]));
    assigned.forEach((assignment) => {
      const activity = Array.isArray(assignment.activities) ? assignment.activities[0] : assignment.activities;
      if (!activity) return;
      const card = node('article', '', 'account-card');
      card.append(node('h3', activity.title || 'Atividade'));
      if (activity.subject) card.append(node('p', activity.subject, 'account-kicker'));
      if (activity.description) card.append(node('p', activity.description, 'account-prewrap'));
      if (assignment.due_at) card.append(node('p', `Prazo: ${new Date(assignment.due_at).toLocaleString('pt-BR')}`));
      const questions = activity.activity_questions || [];
      if (questions.length) {
        const list = node('ol');
        questions.sort((a, b) => a.position - b.position).forEach((question) => list.append(node('li', question.prompt)));
        card.append(list);
      }
      (activity.activity_resources || []).forEach((resource) => {
        if (resource.resource_url && /^https:\/\//i.test(resource.resource_url)) card.append(safeLink(resource.resource_url, resource.title || 'Abrir material'));
      });
      if (role.role === 'aluno' && activity.requires_response) {
        const form = node('form', '', 'account-form');
        form.method = 'post';
        const label = node('label', 'Sua resposta');
        const textarea = node('textarea');
        textarea.name = 'response'; textarea.required = true; textarea.maxLength = 5000; textarea.rows = 4;
        textarea.value = submittedByActivity.get(assignment.activity_id)?.response || '';
        label.append(textarea); form.append(label);
        const button = node('button', 'Enviar resposta', 'account-button account-button-primary'); button.type = 'submit'; form.append(button);
        const notice = node('p', '', 'account-message'); notice.dataset.status = ''; form.append(notice);
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          if (!form.reportValidity()) return;
          button.disabled = true;
          try {
            const { error } = await client.from('activity_submissions').upsert({
              activity_id: assignment.activity_id, classroom_id: classId, student_id: user.id,
              response: textarea.value.trim()
            }, { onConflict: 'activity_id,classroom_id,student_id' });
            if (error) throw error;
            status(notice, 'Resposta enviada.', 'success');
          } catch (error) { status(notice, messageFor(error), 'error'); }
          finally { button.disabled = false; }
        });
        card.append(form);
      }
      container.append(card);
    });
  }

  function init() {
    bindPasswordToggles();
    if (page === 'login') initLogin();
    else if (page === 'signup') initSignup();
    else if (page === 'recovery') initRecovery();
    else if (page === 'callback') initCallback();
    else if (page === 'workspace' || page === 'classes') { bindWorkspaceForms(); loadWorkspace(); }
    else if (page === 'classroom') initClassroom();
  }

  init();
})();
