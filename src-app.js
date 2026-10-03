import { supabase, supabaseReady } from './src-supabase.js';

const siteRoot = new URL('./', document.baseURI).pathname;
const routePart = location.pathname.slice(siteRoot.length).replace(/^\/+|\/+$|\.html$/g, '');
const routeAliases = {'login':'/login','cadastro':'/cadastro','recuperar-senha':'/recuperar-senha','auth-callback':'/auth/callback','auth/callback':'/auth/callback','aluno':'/aluno','professor':'/professor','admin':'/admin','perfil':'/perfil'};
const route = routeAliases[routePart] || (routePart ? '/' + routePart : '/');
const flatPages = {'/login':'login.html','/cadastro':'cadastro.html','/recuperar-senha':'recuperar-senha.html','/auth/callback':'auth-callback.html','/aluno':'aluno.html','/professor':'professor.html','/admin':'admin.html','/perfil':'perfil.html'};
const siteHref = (path='') => {
  const raw=String(path); const split=raw.search(/[?#]/); const routePart=split<0?raw:raw.slice(0,split); const suffix=split<0?'':raw.slice(split);
  const clean=routePart.replace(/^\/+|\/+$/g,''); const page=flatPages['/'+clean];
  return siteRoot+(page || clean)+suffix;
};
const navigate = (path, replace=false) => {
  const clean = path === '/' ? '' : String(path).replace(/^\/+/, '');
  const target = clean && !clean.endsWith('/') && !clean.includes('.') && !clean.includes('?') ? `${clean}/` : clean;
  location[replace ? 'replace' : 'assign'](siteHref(target));
};
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="/"]');
  if (link) link.href = siteHref(link.getAttribute('href'));
}, true);
const protectedRoutes = ['/aluno','/professor','/admin','/perfil'];
const accountLabels = {aluno:'Aluno',professor:'Professor',admin:'Administrador'};
const main = document.querySelector('main#conteudo');
const escapeHtml = (value='') => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeText = (value) => escapeHtml(value).replace(/`/g,'&#96;');
const setStatus = (node, text, error=false) => { if (node) { node.textContent = text; node.dataset.state = error ? 'error' : 'ok'; } };
const flash = (text) => { try { sessionStorage.setItem('diario-bns-flash', text); } catch {} };
const takeFlash = () => { try { const text=sessionStorage.getItem('diario-bns-flash');sessionStorage.removeItem('diario-bns-flash');return text||''; } catch { return ''; } };
const configureNotice = `<aside class="auth-notice" role="status"><strong>Supabase ainda não configurado</strong><p>Confira a configuração pública do Supabase em <code>supabase-config.js</code> e siga as instruções de instalação do projeto.</p><a href="/README.md">Abrir instruções</a></aside>`;

function replaceMain(title, content) {
  if (!main) return;
  document.title = `${title} — Diário dos BNs`;
  main.innerHTML = `<div class="auth-page section-wrap">${content}</div>`;
  document.querySelectorAll('.nav-account').forEach((link) => { link.href='/perfil'; link.textContent='Minha área'; });
}

async function getSignedUser() {
  if (!supabase) return null;
  const {data:sessionData,error:sessionError}=await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session) return null;
  const {data,error}=await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

async function getRole(user) {
  if (!supabase || !user) return null;
  const {data,error}=await supabase.from('user_roles').select('role,status').eq('user_id',user.id).maybeSingle();
  if (error) throw error;
  return data;
}

function destination(roleRow) {
  if (!roleRow || roleRow.status==='blocked') return '/perfil';
  return roleRow.role==='admin' ? '/admin' : roleRow.role==='professor' ? '/professor' : '/aluno';
}

function configRequired(title) {
  replaceMain(title, `<section class="auth-card">${configureNotice}<a class="auth-back" href="/">Voltar à página inicial</a></section>`);
}

function authShell(title, description, inner) {
  const message=takeFlash();
  replaceMain(title, `<section class="auth-card"><a class="auth-back" href="/">← Diário dos BNs</a><div class="section-kicker">ÁREA SEGURA · SUPABASE AUTH</div><h1>${title}</h1><p class="auth-lede">${description}</p>${message?`<p class="auth-message" role="status">${safeText(message)}</p>`:''}${!supabaseReady?configureNotice:''}${inner}</section>`);
}

function renderLogin() {
  authShell('Fazer login','Entre com o e-mail e a senha da sua conta.',`<form id="login-form" class="auth-form"><label for="login-email">E-mail</label><input id="login-email" name="email" type="email" autocomplete="email" required><label for="login-password">Senha</label><input id="login-password" name="password" type="password" autocomplete="current-password" required><button class="button button-primary" type="submit">Entrar</button><p id="form-status" class="auth-message" role="status" aria-live="polite"></p></form><div class="auth-links"><a href="/recuperar-senha">Esqueci minha senha</a><a href="/cadastro">Criar uma conta</a></div>`);
  document.querySelector('#login-form')?.addEventListener('submit',async(event)=>{
    event.preventDefault();const form=event.currentTarget;const status=document.querySelector('#form-status');const button=form.querySelector('button');
    if(!supabase){setStatus(status,'Configure o Supabase para ativar o login.',true);return;}
    button.disabled=true;setStatus(status,'Verificando seus dados…');
    const {data,error}=await supabase.auth.signInWithPassword({email:form.elements.namedItem('email').value.trim(),password:form.elements.namedItem('password').value});
    if(error){button.disabled=false;setStatus(status,error.message==='Email not confirmed'?'Confirme seu e-mail pelo link enviado antes de entrar.':'Não foi possível entrar. Confira o e-mail e a senha.',true);return;}
    try{const role=await getRole(data.user);if(!role||role.status==='blocked'){await supabase.auth.signOut();setStatus(status,'A conta está indisponível. Procure o responsável pelo site.',true);button.disabled=false;return;}navigate(destination(role));}catch(err){setStatus(status,`Conta autenticada, mas não foi possível consultar o perfil: ${err.message}`,true);button.disabled=false;}
  });
}

function renderSignup() {
  authShell('Criar conta','Escolha Aluno ou Professor. Contas de administrador são configuradas pelo proprietário, fora do cadastro público.',`<form id="signup-form" class="auth-form"><label for="signup-name">Nome</label><input id="signup-name" name="name" autocomplete="name" maxlength="100" required><label for="signup-email">E-mail</label><input id="signup-email" name="email" type="email" autocomplete="email" required><label for="signup-password">Senha</label><input id="signup-password" name="password" type="password" autocomplete="new-password" minlength="10" required><small>Use pelo menos 10 caracteres. O Supabase Auth armazena a credencial com hash.</small><label for="signup-confirm">Confirmação de senha</label><input id="signup-confirm" name="confirm" type="password" autocomplete="new-password" minlength="10" required><label for="signup-role">Tipo de conta</label><select id="signup-role" name="role"><option value="aluno">Aluno</option><option value="professor">Professor · aprovação pendente</option></select><label class="consent-check"><input type="checkbox" name="consent" required><span>Li e aceito os <a href="/termos.html" target="_blank" rel="noopener">Termos de Uso</a> e a <a href="/privacidade.html" target="_blank" rel="noopener">Política de Privacidade</a>.</span></label><button class="button button-primary" type="submit">Criar conta</button><p id="form-status" class="auth-message" role="status" aria-live="polite"></p></form><div class="auth-links"><a href="/login">Já tenho uma conta</a></div><aside class="auth-note"><strong>Contas de professor</strong><p>O cadastro pode ser submetido, mas os downloads e ferramentas docentes só são liberados após aprovação por um administrador.</p></aside>`);
  document.querySelector('#signup-form')?.addEventListener('submit',async(event)=>{
    event.preventDefault();const form=event.currentTarget;const status=document.querySelector('#form-status');const button=form.querySelector('button');
    if(!supabase){setStatus(status,'Configure o Supabase para ativar o cadastro.',true);return;}
    const values=new FormData(form);const password=String(values.get('password'));const confirmation=String(values.get('confirm'));
    if(password!==confirmation){setStatus(status,'As senhas digitadas não coincidem.',true);form.elements.namedItem('confirm').focus();return;}
    if(password.length<10){setStatus(status,'A senha deve ter pelo menos 10 caracteres.',true);return;}
    button.disabled=true;setStatus(status,'Criando sua conta…');
    const role=values.get('role')==='professor'?'professor':'aluno';
    const {data,error}=await supabase.auth.signUp({email:String(values.get('email')).trim(),password,options:{emailRedirectTo:`${location.origin}${siteHref('auth/callback/')}`,data:{display_name:String(values.get('name')).trim(),requested_role:role,terms_version:'1.0',privacy_version:'1.0'}}});
    button.disabled=false;
    if(error){setStatus(status,'Não foi possível criar a conta. Verifique os dados, as configurações de e-mail e tente novamente.',true);return;}
    if(data.session){flash(role==='professor'?'Conta criada. O acesso de professor aguarda aprovação.':'Conta criada.');navigate(role==='professor'?'/professor/':'/aluno/');}
    else setStatus(status,role==='professor'?'Conta criada. Confirme o endereço de e-mail; depois, o proprietário do site precisará aprovar o perfil de professor.':'Conta criada. Enviamos um link de confirmação para seu e-mail. Confirme-o antes de fazer login.');
  });
}

function renderRecovery() {
  const updating=new URLSearchParams(location.search).get('mode')==='update';
  if(updating){authShell('Definir nova senha','Escolha uma senha nova para sua conta.',`<form id="password-update-form" class="auth-form"><label for="new-password">Nova senha</label><input id="new-password" type="password" minlength="10" autocomplete="new-password" required><label for="new-password-confirm">Confirme a nova senha</label><input id="new-password-confirm" type="password" minlength="10" autocomplete="new-password" required><button class="button button-primary" type="submit">Salvar senha</button><p id="form-status" class="auth-message" role="status" aria-live="polite"></p></form>`);
    const code=new URLSearchParams(location.search).get('code');const status=document.querySelector('#form-status');
    if(code&&supabase)supabase.auth.exchangeCodeForSession(code).then(({error})=>{if(error)setStatus(status,'O link expirou ou já foi utilizado. Solicite outro link de recuperação.',true);});
    document.querySelector('#password-update-form')?.addEventListener('submit',async(event)=>{event.preventDefault();const form=event.currentTarget;if(!supabase){setStatus(document.querySelector('#form-status'),'Configure o Supabase para alterar sua senha.',true);return;}const first=form.querySelector('#new-password').value;const second=form.querySelector('#new-password-confirm').value;if(first!==second){setStatus(document.querySelector('#form-status'),'As senhas digitadas não coincidem.',true);return;}const {error}=await supabase.auth.updateUser({password:first});if(error){setStatus(document.querySelector('#form-status'),'Não foi possível atualizar a senha. Solicite um link novo.',true);return;}await supabase.auth.signOut();flash('Senha atualizada. Faça login com a nova senha.');navigate('/login/');});
    return;
  }
  authShell('Recuperar senha','Enviaremos um link de recuperação para o e-mail cadastrado.',`<form id="recovery-form" class="auth-form"><label for="recovery-email">E-mail</label><input id="recovery-email" type="email" autocomplete="email" required><button class="button button-primary" type="submit">Enviar link de recuperação</button><p id="form-status" class="auth-message" role="status" aria-live="polite"></p></form><div class="auth-links"><a href="/login">Voltar ao login</a></div>`);
  document.querySelector('#recovery-form')?.addEventListener('submit',async(event)=>{event.preventDefault();const email=event.currentTarget.querySelector('#recovery-email').value.trim();const status=document.querySelector('#form-status');if(!supabase){setStatus(status,'Configure o Supabase para ativar a recuperação.',true);return;}setStatus(status,'Solicitando link…');const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${location.origin}${siteHref('recuperar-senha/?mode=update')}`});setStatus(status,error?'Não foi possível enviar o e-mail. Confira o endereço ou tente mais tarde.':'Se o endereço estiver cadastrado, você receberá as instruções de recuperação.');});
}

async function renderCallback() {
  replaceMain('Confirmando e-mail','<section class="auth-card"><h1>Confirmando seu e-mail…</h1><p id="callback-status" role="status">Aguarde enquanto validamos o link.</p></section>');
  const status=document.querySelector('#callback-status');if(!supabase){if(status)status.textContent='Configure o Supabase e reinicie o servidor.';return;}
  const code=new URLSearchParams(location.search).get('code');
  if(code){const {error}=await supabase.auth.exchangeCodeForSession(code);if(error){setStatus(status,'O link expirou ou já foi utilizado. Solicite um link novo.',true);return;}}
  const user=await getSignedUser();if(!user){setStatus(status,'Não encontramos uma sessão. Faça login ou solicite outro link.',true);return;}
  const role=await getRole(user);flash('E-mail confirmado. Boas-vindas ao Diário dos BNs.');navigate(destination(role), true);
}

function routeMessage(title,message,links='') { replaceMain(title,`<section class="auth-card"><div class="section-kicker">DIÁRIO DOS BNs</div><h1>${title}</h1><p>${message}</p>${links}</section>`); }

async function protectRoute() {
  if(!supabaseReady){configRequired('Acessar minha área');return;}
  try {
    const user=await getSignedUser();
    if(!user){flash('Entre na sua conta para continuar.');navigate('/login/', true);return;}
    const role=await getRole(user);
    if(!role){routeMessage('Perfil não encontrado','O cadastro ainda não terminou. Confirme o e-mail e tente entrar novamente.','<a href="/login">Voltar ao login</a>');return;}
    if(role.status==='blocked'){await supabase.auth.signOut();routeMessage('Conta indisponível','Entre em contato com o responsável pelo site.');return;}
    if(route==='/perfil'){await renderProfile(user,role);return;}
    const desired=route==='/admin'?'admin':route==='/professor'?'professor':'aluno';
    if(role.role!==desired){navigate(destination(role), true);return;}
    if(desired==='professor'&&role.status==='pending'){renderPendingTeacher(user);return;}
    if(role.status!=='active'){routeMessage('Acesso aguardando','Seu perfil aguarda análise do responsável pelo site.');return;}
    if(desired==='admin')await renderAdmin(user);else if(desired==='professor')await renderTeacher(user);else await renderStudent(user);
  } catch(error) { routeMessage('Não foi possível abrir sua área',`Tente entrar novamente. ${safeText(error.message||'')}`,'<a href="/login">Fazer login</a>'); }
}

function profileHeader(user,role,title,lead) {
  return `<section class="dashboard-heading"><div><div class="lesson-tag">${accountLabels[role.role]||'Conta'}${role.status==='pending'?' · APROVAÇÃO PENDENTE':''}</div><h1>${title}</h1><p>${lead}</p></div><button type="button" class="button button-outline" data-logout>Sair</button></section>`;
}

function wireLogout() { document.querySelectorAll('[data-logout]').forEach((button)=>button.addEventListener('click',async()=>{await supabase.auth.signOut();navigate('/login/');})); }

async function renderProfile(user,role) {
  const {data:profile,error}=await supabase.from('profiles').select('display_name,bio,avatar_path,created_at').eq('id',user.id).single();
  if(error)throw error;
  replaceMain('Meu perfil',`${profileHeader(user,role,'Meu perfil','Edite os dados públicos do perfil. O e-mail e a senha permanecem no Supabase Auth.')}
    <section class="auth-card profile-card"><form id="profile-form" class="auth-form"><label>E-mail da conta</label><input value="${safeText(user.email||'')}" readonly><label for="profile-name">Nome de exibição</label><input id="profile-name" maxlength="100" value="${safeText(profile.display_name||'')}" required><label for="profile-bio">Sobre você</label><textarea id="profile-bio" maxlength="500" rows="4">${safeText(profile.bio||'')}</textarea><button class="button button-primary" type="submit">Salvar perfil</button><p id="form-status" class="auth-message" role="status" aria-live="polite"></p></form></section><p class="auth-links"><a href="${destination(role)}">Voltar para minha área</a></p>`);
  document.querySelector('#profile-form').addEventListener('submit',async(event)=>{event.preventDefault();const f=event.currentTarget;const {error}=await supabase.from('profiles').update({display_name:f.querySelector('#profile-name').value.trim(),bio:f.querySelector('#profile-bio').value.trim()}).eq('id',user.id);setStatus(document.querySelector('#form-status'),error?'Não foi possível salvar o perfil.': 'Perfil atualizado.',Boolean(error));});wireLogout();
}

function renderPendingTeacher(user) {
  replaceMain('Conta de professor',`${profileHeader(user,{role:'professor',status:'pending'},'Seu cadastro foi recebido','A área de professor será liberada após a aprovação do responsável pelo site.')}
    <aside class="auth-notice"><strong>Aguardando aprovação</strong><p>Enquanto isso, você pode explorar materiais públicos, editar seu perfil e aprender Blender. Downloads exclusivos e gestão de turmas permanecem bloqueados.</p><a href="/perfil">Editar meu perfil</a> · <a href="/">Voltar à biblioteca</a></aside>`);wireLogout();
}

async function renderStudent(user) {
  replaceMain('Área do aluno',`${profileHeader(user,{role:'aluno'},'Minha área de estudos','Acompanhe favoritos, atividades e progresso. Suas respostas ficam visíveis a você e, quando relacionadas a uma turma, ao professor responsável.')}
    <div class="account-shortcuts"><a href="/perfil">Editar perfil</a><a href="/">Explorar animações</a><a href="/downloads.html">Downloads</a><a href="/blender.html">Aprenda Blender</a><a href="/laboratorio.html">Laboratório 3D</a></div><div id="student-workspace"><p role="status">Carregando seus conteúdos…</p></div>`);wireLogout();
  await loadLearningWorkspace(document.querySelector('#student-workspace'),user,'aluno');
}

async function loadLearningWorkspace(root,user,role) {
  const favoritesPromise=supabase.from('favorites').select('animation_id,animations(id,title,topic,slug)').eq('user_id',user.id);
  const animationsPromise=supabase.from('animations').select('id,title,topic,slug,summary,level,duration_seconds,video_url').eq('is_published',true).order('topic').order('title');
  const downloadsPromise=supabase.from('downloads').select('id,title,description,file_name,storage_bucket,storage_path,visibility').eq('is_published',true);
  const progressPromise=supabase.from('lesson_progress').select('lesson_id,completed_at,lessons(id,title,courses(title))').eq('user_id',user.id);
  const activitiesPromise=role==='aluno'?supabase.from('classroom_activities').select('classroom_id,activity_id,activities(id,title,description,subject),classrooms(name)').order('created_at',{ascending:false}):Promise.resolve({data:[],error:null});
  const coursesPromise=supabase.from('courses').select('id,title,description,lessons(id,title,body,position,video_url)').eq('is_published',true).order('title');
  const [favorites,animations,downloads,progress,activities,courses]=await Promise.all([favoritesPromise,animationsPromise,downloadsPromise,progressPromise,activitiesPromise,coursesPromise]);
  const dataErrors=[favorites,animations,downloads,progress,activities,courses].filter((result)=>result.error).map((result)=>result.error.message);
  const anims=animations.data||[], favIds=new Set((favorites.data||[]).map((item)=>item.animation_id));
  const animationCards=anims.map((item)=>`<article class="db-card"><span class="lesson-tag">${safeText(item.topic)}</span><h3>${safeText(item.title)}</h3><p>${safeText(item.summary||'Animação de apoio para estudar Física.')}</p><div class="db-card-actions"><a href="/animacao.html?topico=${encodeURIComponent(item.slug.split('--')[0]||'')}&amp;animacao=${encodeURIComponent(item.slug.split('--')[1]||'')}">Detalhes</a><button type="button" data-db-favorite="${item.id}" aria-pressed="${favIds.has(item.id)}">${favIds.has(item.id)?'★ Salva':'☆ Favoritar'}</button></div></article>`).join('')||'<p>Nenhuma animação publicada ainda. A biblioteca está disponível na página inicial.</p>';
  const favoriteCards=(favorites.data||[]).map((item)=>`<li><a href="/animacao.html?topico=${encodeURIComponent(item.animations?.slug?.split('--')[0]||'')}&amp;animacao=${encodeURIComponent(item.animations?.slug?.split('--')[1]||'')}">${safeText(item.animations?.title||'Animação')}</a><button type="button" data-db-favorite="${item.animation_id}" aria-pressed="true">Remover</button></li>`).join('')||'<li>Ainda não há favoritas.</li>';
  const progressRows=(progress.data||[]).map((item)=>`<li>${safeText(item.lessons?.courses?.title||'Curso')}: ${safeText(item.lessons?.title||'Aula')} ${item.completed_at?'· concluída':'· em andamento'}</li>`).join('')||'<li>Seu progresso de cursos aparecerá aqui.</li>';
  const progressByLesson=new Map((progress.data||[]).map((item)=>[item.lesson_id,item]));
  const courseCards=(courses.data||[]).map((course)=>`<article class="db-card"><h3>${safeText(course.title)}</h3><p>${safeText(course.description||'')}</p><ol>${(course.lessons||[]).sort((a,b)=>a.position-b.position).map((lesson)=>{const done=Boolean(progressByLesson.get(lesson.id)?.completed_at);return `<li><b>${safeText(lesson.title)}</b><p>${safeText(lesson.body||'')}</p>${videoMarkup(lesson.video_url,lesson.title)}<button type="button" data-mark-lesson="${lesson.id}" data-completed="${done}">${done?'Concluída — desfazer':'Marcar como concluída'}</button></li>`;}).join('')||'<li>Aulas em preparação.</li>'}</ol></article>`).join('')||'<p>Nenhum curso Blender publicado ainda.</p>';
  const activityCards=(activities.data||[]).map((assignment)=>`<article class="db-card"><span class="lesson-tag">${safeText(assignment.classrooms?.name||'Atividade')}</span><h3>${safeText(assignment.activities?.title||'Atividade')}</h3><p>${safeText(assignment.activities?.description||'')}</p><form class="submission-form" data-activity="${assignment.activity_id}" data-class="${assignment.classroom_id}"><label>Resposta<textarea name="response" rows="3" maxlength="5000" required placeholder="Escreva, descreva ou organize suas ideias."></textarea></label><button class="button button-outline" type="submit">Enviar atividade</button><span role="status"></span></form></article>`).join('')||'<p>Quando um professor compartilhar uma atividade com sua turma, ela aparecerá aqui.</p>';
  const teacherJoin=role==='aluno'?`<section class="auth-card"><h2>Entrar em uma turma</h2><form id="join-class-form" class="inline-form"><label for="join-code">Código fornecido pelo professor</label><input id="join-code" name="code" autocomplete="off" required maxlength="12"><button class="button button-outline" type="submit">Entrar na turma</button></form><p class="auth-message" id="join-status" role="status" aria-live="polite"></p></section>`:'';
  const protectedDownloads=(downloads.data||[]).map((item)=>`<li><span>${safeText(item.title)} <small>· ${safeText(item.file_name)}</small></span><button class="button button-outline" type="button" data-private-download="${item.id}">Baixar</button></li>`).join('')||'<li>Não há downloads privados publicados para seu perfil.</li>';
  root.innerHTML=`${dataErrors.length?`<aside class="auth-notice" role="alert"><strong>O banco ainda precisa ser configurado</strong><p>${safeText(dataErrors[0])} — aplique as migrações indicadas no README.</p></aside>`:''}<section class="dashboard-cards"><article><b>${favIds.size}</b><span>animações favoritas</span></article><article><b>${(progress.data||[]).length}</b><span>aulas registradas</span></article><article><b>${(activities.data||[]).length}</b><span>atividades compartilhadas</span></article></section><section class="account-section"><div class="section-kicker">BIBLIOTECA</div><h2>Animações publicadas</h2><div class="db-grid">${animationCards}</div></section><section class="account-section"><div class="section-kicker">MINHA LISTA</div><h2>Favoritas</h2><ul class="private-list">${favoriteCards}</ul></section><section class="account-section"><div class="section-kicker">APRENDER BLENDER</div><h2>Cursos e aulas</h2><div class="db-grid">${courseCards}</div><h3>Meu progresso</h3><ul class="private-list">${progressRows}</ul></section><section class="account-section"><div class="section-kicker">MINHA TURMA</div><h2>Atividades</h2><div class="db-grid">${activityCards}</div>${teacherJoin}</section><section class="account-section"><div class="section-kicker">MATERIAIS</div><h2>Downloads do meu perfil</h2><ul class="private-list">${protectedDownloads}</ul></section>`;
  root.querySelectorAll('[data-mark-lesson]').forEach((button)=>button.addEventListener('click',async()=>{button.disabled=true;const done=button.dataset.completed==='true';const {error}=await supabase.from('lesson_progress').upsert({user_id:user.id,lesson_id:button.dataset.markLesson,progress_percent:done?0:100,completed_at:done?null:new Date().toISOString(),updated_at:new Date().toISOString()},{onConflict:'user_id,lesson_id'});if(error){button.disabled=false;button.title='Não foi possível salvar o progresso.';return;}await loadLearningWorkspace(root,user,role);}));
  root.querySelectorAll('[data-db-favorite]').forEach((button)=>button.addEventListener('click',()=>toggleFavorite(button,user,root,role)));
  root.querySelectorAll('[data-private-download]').forEach((button)=>button.addEventListener('click',()=>downloadPrivate(button)));
  root.querySelectorAll('.submission-form').forEach((form)=>form.addEventListener('submit',async(event)=>{event.preventDefault();const f=event.currentTarget;const values=new FormData(f);const status=f.querySelector('[role=status]');const {error}=await supabase.from('activity_submissions').upsert({activity_id:f.dataset.activity,classroom_id:f.dataset.class,student_id:user.id,response:String(values.get('response')).trim()},{onConflict:'activity_id,classroom_id,student_id'});setStatus(status,error?'Não foi possível enviar. Confira se a atividade ainda está aberta.':'Resposta enviada ao professor responsável.',Boolean(error));}));
  root.querySelector('#join-class-form')?.addEventListener('submit',async(event)=>{event.preventDefault();const status=root.querySelector('#join-status');const {error}=await supabase.rpc('join_class_by_code',{p_code:event.currentTarget.code.value.trim().toUpperCase()});setStatus(status,error?'Código inválido ou turma indisponível.':'Você entrou na turma. Recarregue para ver as atividades.',Boolean(error));if(!error)await loadLearningWorkspace(root,user,role);});
}

async function toggleFavorite(button,user,workspace,role) {
  const id=button.dataset.dbFavorite;const pressed=button.getAttribute('aria-pressed')==='true';
  const result=pressed?await supabase.from('favorites').delete().eq('user_id',user.id).eq('animation_id',id):await supabase.from('favorites').insert({user_id:user.id,animation_id:id});
  if(result.error){button.title='Não foi possível salvar esta favorita.';return;}
  button.setAttribute('aria-pressed',String(!pressed));button.textContent=pressed?'☆ Favoritar':'★ Salva';
  await loadLearningWorkspace(workspace,user,role);
}

async function downloadPrivate(button) {
  const {data,error}=await supabase.from('downloads').select('storage_bucket,storage_path,file_name').eq('id',button.dataset.privateDownload).single();
  if(error){button.title='Seu perfil não tem permissão para baixar este material.';return;}
  const signed=await supabase.storage.from(data.storage_bucket).createSignedUrl(data.storage_path,60);
  if(signed.error){button.title='Não foi possível criar o link. Confira as políticas do bucket privado.';return;}
  const link=document.createElement('a');link.href=signed.data.signedUrl;link.download=data.file_name||'';link.rel='noopener';document.body.append(link);link.click();link.remove();
}

async function renderTeacher(user) {
  replaceMain('Área do professor',`${profileHeader(user,{role:'professor'},'Área do professor','Gerencie suas turmas e atividades. As respostas dos estudantes só aparecem para docentes vinculados à turma.')}
    <div class="account-shortcuts"><a href="/perfil">Editar perfil</a><a href="/professores.html">Materiais pedagógicos</a><a href="/downloads.html">Central de downloads</a><a href="/blender.html">Aprenda Blender</a></div><div id="teacher-tools" class="staff-workspace"><p role="status">Carregando turmas e conteúdos…</p></div><div id="student-workspace"></div>`);wireLogout();
  await loadLearningWorkspace(document.querySelector('#student-workspace'),user,'professor');
  await loadTeacherTools(document.querySelector('#teacher-tools'),user);
}

async function loadTeacherTools(root,user) {
  const [classes,activities,submissions]=await Promise.all([
    supabase.from('teacher_classrooms').select('classroom_id,classrooms(id,name,join_code,created_at)').eq('user_id',user.id),
    supabase.from('activities').select('id,title,subject,description,is_published').eq('created_by',user.id).order('created_at',{ascending:false}),
    supabase.from('activity_submissions').select('id,activity_id,classroom_id,student_id,response,submitted_at,activities(title),classrooms(name),profiles!activity_submissions_student_id_fkey(display_name),submission_feedback(feedback)').order('submitted_at',{ascending:false})
  ]);
  const issues=[classes,activities,submissions].find((item)=>item.error);
  if(issues){root.innerHTML=`<aside class="auth-notice" role="alert"><strong>Não foi possível carregar as ferramentas docentes</strong><p>${safeText(issues.error.message)}. Aplique as migrações e confira o status de aprovação do perfil.</p></aside>`;return;}
  const classRows=(classes.data||[]).map((item)=>`<li><b>${safeText(item.classrooms?.name||'Turma')}</b><span>Código para estudantes: <code>${safeText(item.classrooms?.join_code||'')}</code></span></li>`).join('')||'<li>Você ainda não criou turmas.</li>';
  const activityOptions=(activities.data||[]).map((item)=>`<option value="${item.id}">${safeText(item.title)}</option>`).join('');
  const classOptions=(classes.data||[]).map((item)=>`<option value="${item.classroom_id}">${safeText(item.classrooms?.name||'Turma')}</option>`).join('');
  const activityRows=(activities.data||[]).map((item)=>`<li>${safeText(item.title)} · ${item.is_published?'publicada':'rascunho'}</li>`).join('')||'<li>Você ainda não criou atividades.</li>';
  const responseRows=(submissions.data||[]).map((item)=>`<article class="submission-row"><b>${safeText(item.activities?.title||'Atividade')} · ${safeText(item.classrooms?.name||'Turma')}</b><span>Estudante: ${safeText(item.profiles?.display_name||'perfil')} · ${new Date(item.submitted_at).toLocaleDateString('pt-BR')}</span><p>${safeText(item.response)}</p><form data-feedback-form="${item.id}"><label>Devolutiva<input name="feedback" maxlength="1000" value="${safeText(item.submission_feedback?.[0]?.feedback||'')}"></label><button class="button button-outline" type="submit">Salvar devolutiva</button><span role="status"></span></form></article>`).join('')||'<p>Ainda não há respostas nas suas turmas.</p>';
  root.innerHTML=`<div class="staff-grid"><section class="auth-card"><div class="section-kicker">TURMAS</div><h2>Criar turma</h2><form id="create-class-form" class="auth-form"><label for="class-name">Nome da turma</label><input id="class-name" name="name" required maxlength="100"><button class="button button-primary">Criar turma</button><p class="auth-message" role="status"></p></form><ul class="private-list">${classRows}</ul></section><section class="auth-card"><div class="section-kicker">ATIVIDADES</div><h2>Criar atividade</h2><form id="create-activity-form" class="auth-form"><label>Título</label><input name="title" required maxlength="140"><label>Assunto de Física</label><input name="subject" required maxlength="100"><label>Instruções</label><textarea name="description" rows="4" maxlength="5000" required></textarea><button class="button button-primary">Salvar atividade</button><p class="auth-message" role="status"></p></form><ul class="private-list">${activityRows}</ul></section><section class="auth-card"><div class="section-kicker">COMPARTILHAR</div><h2>Enviar atividade à turma</h2><form id="assign-activity-form" class="auth-form"><label>Atividade</label><select name="activity" required>${activityOptions}</select><label>Turma</label><select name="classroom" required>${classOptions}</select><button class="button button-outline">Compartilhar</button><p class="auth-message" role="status"></p></form></section></div><section class="account-section"><div class="section-kicker">RESPOSTAS DA TURMA</div><h2>Acompanhamento de atividades</h2><div class="submission-list">${responseRows}</div><p class="privacy-note">Você vê somente respostas de atividades vinculadas às turmas em que tem permissão docente. Evite solicitar dados sensíveis aos estudantes.</p></section>`;
  root.querySelector('#create-class-form')?.addEventListener('submit',async(event)=>{event.preventDefault();const f=event.currentTarget;const values=new FormData(f);const status=f.querySelector('[role=status]');const {error}=await supabase.rpc('create_classroom',{p_name:String(values.get('name')).trim(),p_description:''});setStatus(status,error?'Não foi possível criar turma.':'Turma criada com código de acesso.',Boolean(error));if(!error)await loadTeacherTools(root,user);});
  root.querySelector('#create-activity-form')?.addEventListener('submit',async(event)=>{event.preventDefault();const f=event.currentTarget;const values=new FormData(f);const status=f.querySelector('[role=status]');const {error}=await supabase.from('activities').insert({title:String(values.get('title')).trim(),subject:String(values.get('subject')).trim(),description:String(values.get('description')).trim(),created_by:user.id,is_published:true});setStatus(status,error?'Não foi possível salvar a atividade.':'Atividade criada.',Boolean(error));if(!error)await loadTeacherTools(root,user);});
  root.querySelector('#assign-activity-form')?.addEventListener('submit',async(event)=>{event.preventDefault();const f=event.currentTarget;const status=f.querySelector('[role=status]');const {error}=await supabase.from('classroom_activities').insert({activity_id:f.activity.value,classroom_id:f.classroom.value,assigned_by:user.id});setStatus(status,error?'Não foi possível compartilhar. Confira se a turma pertence a você.':'Atividade compartilhada com a turma.',Boolean(error));});
  root.querySelectorAll('[data-feedback-form]').forEach((form)=>form.addEventListener('submit',async(event)=>{event.preventDefault();const f=event.currentTarget;const values=new FormData(f);const status=f.querySelector('[role=status]');const {error}=await supabase.from('submission_feedback').upsert({submission_id:f.dataset.feedbackForm,teacher_id:user.id,feedback:String(values.get('feedback')).trim()});setStatus(status,error?'Não foi possível salvar a devolutiva.':'Devolutiva salva.',Boolean(error));}));
}

async function renderAdmin(user) {
  replaceMain('Painel administrativo',`${profileHeader(user,{role:'admin'},'Painel administrativo','Gerencie publicação, usuários, cursos e arquivos. O cadastro público não pode criar administradores.')}
    <div class="account-shortcuts"><a href="/perfil">Meu perfil</a><a href="/">Ver site</a></div><div id="admin-tools" class="staff-workspace"><p role="status">Carregando dados administrativos…</p></div>`);wireLogout();
  await loadAdminTools(document.querySelector('#admin-tools'),user);
}

async function loadAdminTools(root,user) {
  const [users,animations,downloads,courses,classes,activities,lessons]=await Promise.all([
    supabase.from('profiles').select('id,display_name,created_at,user_roles(role,status)'),
    supabase.from('animations').select('id,title,topic,slug,summary,level,duration_seconds,video_url,is_published,created_at').order('created_at',{ascending:false}),
    supabase.from('downloads').select('id,title,file_name,visibility,is_published,storage_bucket,storage_path').order('created_at',{ascending:false}),
    supabase.from('courses').select('id,title,description,is_published,created_at').order('created_at',{ascending:false}),
    supabase.from('classrooms').select('id,name,join_code,is_open,created_at').order('created_at',{ascending:false}),
    supabase.from('activities').select('id,title,subject,description,is_published,created_at').order('created_at',{ascending:false}),
    supabase.from('lessons').select('id,title,body,course_id,position,video_url,courses(title)').order('position')
  ]);
  const firstError=[users,animations,downloads,courses,classes,activities,lessons].find((item)=>item.error);
  if(firstError){root.innerHTML=`<aside class="auth-notice" role="alert"><strong>O painel requer a migração inicial</strong><p>${safeText(firstError.error.message)}. Siga o README para criar o esquema e as políticas.</p></aside>`;return;}
  const userRows=(users.data||[]).map((item)=>{const role=item.user_roles?.[0];const action=role?.role==='admin'||item.id===user.id?'':role?.status==='pending'?`<button data-user-status="${item.id}" data-status="active">Aprovar professor</button>`:role?.status==='blocked'?`<button data-user-status="${item.id}" data-status="active">Reativar conta</button>`:`<button data-user-status="${item.id}" data-status="blocked">Bloquear conta</button>`;return `<tr><td>${safeText(item.display_name||'Sem nome')}</td><td>${accountLabels[role?.role]||'—'}</td><td>${safeText(role?.status||'—')} ${action}</td><td>${new Date(item.created_at).toLocaleDateString('pt-BR')}</td></tr>`;}).join('');
  const animationRows=(animations.data||[]).map((item)=>`<tr><td>${safeText(item.title)}</td><td>${safeText(item.topic)}</td><td>${item.is_published?'Publicado':'Rascunho'}</td><td><button data-edit-animation="${item.id}">Editar</button> <button data-publish-animation="${item.id}" data-published="${item.is_published}">${item.is_published?'Retirar do ar':'Publicar'}</button> <button data-delete-animation="${item.id}">Excluir</button></td></tr>`).join('');
  const downloadRows=(downloads.data||[]).map((item)=>`<tr><td>${safeText(item.title)}</td><td>${safeText(item.file_name)}</td><td>${safeText(item.visibility)}</td><td>${item.is_published?'Publicado':'Rascunho'} <button data-publish-download="${item.id}" data-published="${item.is_published}">${item.is_published?'Retirar':'Publicar'}</button> <button data-delete-download="${item.id}">Excluir</button></td></tr>`).join('');
  const courseRows=(courses.data||[]).map((item)=>`<tr><td>${safeText(item.title)}</td><td>${item.is_published?'Publicado':'Rascunho'}</td><td><button data-edit-course="${item.id}">Editar</button> <button data-publish-course="${item.id}" data-published="${item.is_published}">${item.is_published?'Retirar do ar':'Publicar'}</button> <button data-delete-course=${item.id}">Excluir curso</button></td></tr>`).join('');
  const animationOptions=(animations.data||[]).map((item)=>`<option value="${item.id}">${safeText(item.title)}</option>`).join('');
  const lessonOptions=(courses.data||[]).map((item)=>`<option value="${item.id}">${safeText(item.title)}</option>`).join('');
  const lessonRows=(lessons.data||[]).map((item)=>`<li><b>${safeText(item.courses?.title||'Curso')}</b> · ${safeText(item.title)} <button data-edit-lesson="${item.id}">Editar</button> <button data-delete-lesson="${item.id}">Excluir</button></li>`).join('')||'<li>Nenhuma aula cadastrada.</li>';
  const classRows=(classes.data||[]).map((item)=>`<li><b>${safeText(item.name)}</b> <span>${item.is_open?'Aberta':'Fechada'} · código ${safeText(item.join_code)}</span><button data-toggle-class="${item.id}" data-open="${item.is_open}">${item.is_open?'Fechar':'Reabrir'}</button> <button data-delete-class="${item.id}">Excluir</button></li>`).join('')||'<li>Nenhuma turma cadastrada.</li>';
  const activityRows=(activities.data||[]).map((item)=>`<li><b>${safeText(item.title)}</b> · ${safeText(item.subject)} · ${item.is_published?'Publicada':'Rascunho'} <button data-toggle-activity="${item.id}" data-published="${item.is_published}">${item.is_published?'Retirar':'Publicar'}</button> <button data-delete-activity="${item.id}">Excluir</button></li>`).join('')||'<li>Nenhuma atividade cadastrada.</li>';
  const activityOptions=(activities.data||[]).map((item)=>`<option value="${item.id}">${safeText(item.title)}</option>`).join('');
  const classOptions=(classes.data||[]).map((item)=>`<option value="${item.id}">${safeText(item.name)}</option>`).join('');
  root.innerHTML=`<div class="dashboard-cards"><article><b>${users.data.length}</b><span>perfis cadastrados</span></article><article><b>${animations.data.length}</b><span>animações no banco</span></article><article><b>${classes.data.length}</b><span>turmas</span></article><article><b>${downloads.data.length}</b><span>downloads</span></article></div><section class="account-section"><div class="section-kicker">USUÁRIOS</div><h2>Gerenciar contas e aprovação docente</h2><div class="table-scroll"><table class="admin-table"><thead><tr><th>Perfil</th><th>Tipo</th><th>Status</th><th>Cadastro</th></tr></thead><tbody>${userRows}</tbody></table></div><p class="privacy-note">O painel não lê nem altera senhas ou e-mails de autenticação. Novos administradores são configurados no Supabase SQL Editor pelo proprietário.</p></section><section class="account-section"><div class="section-kicker">ANIMAÇÕES</div><h2>Adicionar conteúdo científico</h2><form id="admin-animation-form" class="admin-form"><label>Título<input name="title" required maxlength="160"></label><label>Assunto<input name="topic" required maxlength="100"></label><label>Slug único<input name="slug" required maxlength="180"></label><label>Nível<input name="level" maxlength="60" value="Ensino médio"></label><label>Duração em segundos<input name="duration" type="number" min="0" max="86400"></label><label>Vídeo MP4 ou YouTube URL<input name="video" type="url" placeholder="https://…"></label><label class="wide-field">Descrição<textarea name="summary" rows="3" maxlength="3000" required></textarea></label><label class="consent-check wide-field"><input name="published" type="checkbox"><span>Publicar agora</span></label><button class="button button-primary" type="submit">Salvar animação</button><button class="button button-outline" type="button" data-animation-cancel hidden>Cancelar edição</button><p class="auth-message wide-field" role="status"></p></form><div class="table-scroll"><table class="admin-table"><thead><tr><th>Animação</th><th>Tópico</th><th>Estado</th><th>Ações</th></tr></thead><tbody>${animationRows||'<tr><td colspan="4">Nenhuma animação cadastrada.</td></tr>'}</tbody></table></div></section><section class="account-section"><div class="section-kicker">DOWNLOADS PRIVADOS</div><h2>Enviar material para o Storage privado</h2><form id="admin-download-form" class="admin-form"><label>Nome do material<input name="title" required maxlength="160"></label><label>Vincular a animação<select name="animation"><option value="">Material geral</option>${animationOptions}</select></label><label>Arquivo<input name="file" type="file" required></label><label>Visibilidade<select name="visibility"><option value="students">Alunos e professores</option><option value="teachers">Somente professores aprovados</option></select></label><label>Descrição<input name="description" maxlength="500"></label><button class="button button-primary" type="submit">Enviar para downloads privados</button><p class="auth-message wide-field" role="status"></p></form><div class="table-scroll"><table class="admin-table"><thead><tr><th>Material</th><th>Arquivo</th><th>Acesso</th><th>Estado</th></tr></thead><tbody>${downloadRows||'<tr><td colspan="4">Nenhum arquivo privado cadastrado.</td></tr>'}</tbody></table></div></section><section class="account-section"><div class="section-kicker">CURSOS BLENDER</div><h2>Publicar um curso</h2><form id="admin-course-form" class="admin-form"><label>Título<input name="title" required maxlength="160"></label><label>Descrição<textarea name="description" rows="2" maxlength="1500"></textarea></label><label class="consent-check"><input name="published" type="checkbox"><span>Publicar</span></label><button class="button button-outline" type="submit">Criar curso</button><button class="button button-outline" type="button" data-course-cancel hidden>Cancelar edição</button><p class="auth-message wide-field" role="status"></p></form><div class="table-scroll"><table class="admin-table"><thead><tr><th>Curso</th><th>Estado</th><th>Ações</th></tr></thead><tbody>${courseRows||'<tr><td colspan="3">Nenhum curso publicado.</td></tr>'}</tbody></table></div></section><section class="account-section"><div class="section-kicker">AULAS BLENDER</div><h2>Organizar as aulas dos cursos</h2><form id="admin-lesson-form" class="admin-form"><label>Curso<select name="course_id" required>${lessonOptions}</select></label><label>Título<input name="title" required maxlength="160"></label><label>Posição<input name="position" type="number" min="0" value="0"></label><label>URL do vídeo<input name="video_url" type="url" placeholder="https://"/></label><label class="wide-field">Conteúdo da aula<textarea name="body" rows="5"></textarea></label><button class="button button-outline" type="submit">Salvar aula</button><button class="button button-outline" type="button" data-lesson-cancel hidden>Cancelar edição</button><p role="status"></p></form><ul class="private-list">${lessonRows}</ul></section><section class="account-section"><div class="section-kicker">TURMAS E ATIVIDADES</div><h2>Visão administrativa</h2><p>Turmas: ${classes.data.length} · Atividades: ${activities.data.length}.</p><div class="staff-grid"><section class="auth-card"><h3>Turmas</h3><form id="admin-class-form" class="auth-form"><label>Nome da turma<input name="name" required maxlength="100"></label><button class="button button-outline" type="submit">Criar turma</button><p role="status"></p></form><ul class="private-list">${classRows}</ul></section><section class="auth-card"><h3>Atividades</h3><form id="admin-activity-form" class="auth-form"><label>Título<input name="title" required maxlength="160"></label><label>Assunto<input name="subject" maxlength="100"></label><label>Instruções<textarea name="description" rows="3" maxlength="5000"></textarea></label><button class="button button-outline" type="submit">Criar atividade</button><p role="status"></p></form><ul class="private-list">${activityRows}</ul></section><section class="auth-card"><h3>Compartilhar atividade</h3><form id="admin-assign-form" class="auth-form"><label>Atividade<select name="activity" required>${activityOptions}</select></label><label>Turma<select name="classroom" required>${classOptions}</select></label><button class="button button-outline" type="submit">Compartilhar</button><p role="status"></p></form></section></div><a href="/professores.html">Abrir materiais pedagógicos →</a></section>`;
  root.querySelectorAll('[data-user-status]').forEach((button)=>button.addEventListener('click',async()=>{const status=button.dataset.status;if(status==='blocked'&&!confirm('Bloquear esta conta? O usuário perderá o acesso às áreas protegidas.'))return;const {error}=await supabase.from('user_roles').update({status}).eq('user_id',button.dataset.userStatus).neq('role','admin');if(error)button.textContent='Falha';else await loadAdminTools(root,user);}));
  root.querySelectorAll('[data-publish-animation]').forEach((button)=>button.addEventListener('click',async()=>{const {error}=await supabase.from('animations').update({is_published:button.dataset.published!=='true'}).eq('id',button.dataset.publishAnimation);if(error)button.textContent='Falha';else await loadAdminTools(root,user);}));
  root.querySelectorAll('[data-edit-animation]').forEach((button)=>button.addEventListener('click',()=>{const item=animations.data.find((entry)=>entry.id===button.dataset.editAnimation);const form=root.querySelector('#admin-animation-form');if(!item||!form)return;form.dataset.animationId=item.id;for(const key of ['title','topic','slug','level','summary'])form.elements.namedItem(key).value=item[key]||'';form.elements.namedItem('duration').value=item.duration_seconds||'';form.elements.namedItem('video').value=item.video_url||'';form.elements.namedItem('published').checked=item.is_published;form.querySelector('[type="submit"]').textContent='Salvar alterações';form.querySelector('[data-animation-cancel]').hidden=false;form.scrollIntoView({behavior:'smooth',block:'center'});}));
  root.querySelector('[data-animation-cancel]')?.addEventListener('click',()=>loadAdminTools(root,user));
  root.querySelectorAll('[data-delete-animation]').forEach((button)=>button.addEventListener('click',async()=>{if(!confirm('Excluir esta animação? Favoritas vinculadas também serão removidas.'))return;const {error}=await supabase.from('animations').delete().eq('id',button.dataset.deleteAnimation);if(error)button.textContent='Falha';else await loadAdminTools(root,user);}));
  root.querySelectorAll('[data-publish-download]').forEach((button)=>button.addEventListener('click',async()=>{const {error}=await supabase.from('downloads').update({is_published:button.dataset.published!=='true'}).eq('id',button.dataset.publishDownload);if(error)button.textContent='Falha';else await loadAdminTools(root,user);}));
  root.querySelectorAll('[data-delete-download]').forEach((button)=>button.addEventListener('click',async()=>{if(!confirm('Excluir este material e seu arquivo privado?'))return;const item=downloads.data.find((entry)=>entry.id===button.dataset.deleteDownload);if(!item)return;const removed=await supabase.storage.from(item.storage_bucket).remove([item.storage_path]);if(removed.error){button.textContent='Falha ao excluir arquivo';return;}const {error}=await supabase.from('downloads').delete().eq('id',item.id);if(error)button.textContent='Falha ao excluir cadastro';else await loadAdminTools(root,user);}));
  root.querySelectorAll('[data-edit-course]').forEach((button)=>button.addEventListener('click',()=>{const item=courses.data.find((entry)=>entry.id===button.dataset.editCourse);const form=root.querySelector('#admin-course-form');if(!item||!form)return;form.dataset.courseId=item.id;form.elements.namedItem('title').value=item.title;form.elements.namedItem('description').value=item.description||'';form.elements.namedItem('published').checked=item.is_published;form.querySelector('[type="submit"]').textContent='Salvar alterações';form.querySelector('[data-course-cancel]').hidden=false;form.scrollIntoView({behavior:'smooth',block:'center'});}));
  root.querySelector('[data-course-cancel]')?.addEventListener('click',()=>loadAdminTools(root,user));
  root.querySelectorAll('[data-publish-course]').forEach((button)=>button.addEventListener('click',async()=>{const {error}=await supabase.from('courses').update({is_published:button.dataset.published!=='true'}).eq('id',button.dataset.publishCourse);if(error)button.textContent='Falha';else await loadAdminTools(root,user);}));
  root.querySelectorAll('[data-delete-course]').forEach((button)=>button.addEventListener('click',async()=>{if(!confirm('Excluir este curso e suas aulas?'))return;const {error}=await supabase.from('courses').delete().eq('id',button.dataset.deleteCourse);if(error)button.textContent='Falha';else await loadAdminTools(root,user);}));
  root.querySelectorAll('[data-edit-lesson]').forEach((button)=>button.addEventListener('click',()=>{const item=lessons.data.find((entry)=>entry.id===button.dataset.editLesson);const form=root.querySelector('#admin-lesson-form');if(!item||!form)return;form.dataset.lessonId=item.id;for(const key of ['course_id','title','position','video_url','body'])form.elements.namedItem(key).value=item[key]??'';form.querySelector('[type=submit]').textContent='Salvar alterações';form.querySelector('[data-lesson-cancel]').hidden=false;form.scrollIntoView({behavior:'smooth',block:'center'});}));
  root.querySelector('[data-lesson-cancel]')?.addEventListener('click',()=>loadAdminTools(root,user));
  root.querySelectorAll('[data-delete-lesson]').forEach((button)=>button.addEventListener('click',async()=>{if(!confirm('Excluir esta aula e o progresso relacionado?'))return;const {error}=await supabase.from('lessons').delete().eq('id',button.dataset.deleteLesson);if(error)button.textContent='Falha';else await loadAdminTools(root,user);}));
  root.querySelector('#admin-lesson-form')?.addEventListener('submit',async(event)=>{event.preventDefault();const f=event.currentTarget;const v=new FormData(f);const values={course_id:String(v.get('course_id')),title:String(v.get('title')).trim(),body:String(v.get('body')||'').trim(),position:Number(v.get('position'))||0,video_url:String(v.get('video_url')||'').trim()||null};const {error}=f.dataset.lessonId?await supabase.from('lessons').update(values).eq('id',f.dataset.lessonId):await supabase.from('lessons').insert(values);const status=f.querySelector('[role=status]');if(error)status.textContent='Não foi possível salvar a aula.';else await loadAdminTools(root,user);});
  root.querySelector('#admin-class-form')?.addEventListener('submit',async(event)=>{event.preventDefault();const f=event.currentTarget;const values=new FormData(f);const {error}=await supabase.from('classrooms').insert({name:String(values.get('name')).trim(),created_by:user.id});if(error)f.querySelector('[role=status]').textContent='Não foi possível criar a turma.';else await loadAdminTools(root,user);});
  root.querySelectorAll('[data-toggle-class]').forEach((button)=>button.addEventListener('click',async()=>{const {error}=await supabase.from('classrooms').update({is_open:button.dataset.open!=='true'}).eq('id',button.dataset.toggleClass);if(error)button.textContent='Falha';else await loadAdminTools(root,user);}));
  root.querySelectorAll('[data-delete-class]').forEach((button)=>button.addEventListener('click',async()=>{if(!confirm('Excluir a turma, matrículas e atividades relacionadas?'))return;const {error}=await supabase.from('classrooms').delete().eq('id',button.dataset.deleteClass);if(error)button.textContent='Falha';else await loadAdminTools(root,user);}));
  root.querySelector('#admin-activity-form')?.addEventListener('submit',async(event)=>{event.preventDefault();const f=event.currentTarget;const values=new FormData(f);const {error}=await supabase.from('activities').insert({title:String(values.get('title')).trim(),subject:String(values.get('subject')||'').trim(),description:String(values.get('description')||'').trim(),is_published:true,created_by:user.id});if(error)f.querySelector('[role=status]').textContent='Não foi possível criar a atividade.';else await loadAdminTools(root,user);});
  root.querySelectorAll('[data-toggle-activity]').forEach((button)=>button.addEventListener('click',async()=>{const {error}=await supabase.from('activities').update({is_published:button.dataset.published!=='true'}).eq('id',button.dataset.toggleActivity);if(error)button.textContent='Falha';else await loadAdminTools(root,user);}));
  root.querySelectorAll('[data-delete-activity]').forEach((button)=>button.addEventListener('click',async()=>{if(!confirm('Excluir esta atividade e compartilhamentos relacionados?'))return;const {error}=await supabase.from('activities').delete().eq('id',button.dataset.deleteActivity);if(error)button.textContent='Falha';else await loadAdminTools(root,user);}));
  root.querySelector('#admin-assign-form')?.addEventListener('submit',async(event)=>{event.preventDefault();const f=event.currentTarget;const values=new FormData(f);const {error}=await supabase.from('classroom_activities').insert({activity_id:values.get('activity'),classroom_id:values.get('classroom'),assigned_by:user.id});if(error)f.querySelector('[role=status]').textContent='Não foi possível compartilhar esta atividade.';else await loadAdminTools(root,user);});
  root.querySelector('#admin-animation-form')?.addEventListener('submit',async(event)=>{event.preventDefault();const f=event.currentTarget;const v=new FormData(f);const status=f.querySelector('[role=status]');const values={title:String(v.get('title')).trim(),topic:String(v.get('topic')).trim(),slug:String(v.get('slug')).trim().toLowerCase().replace(/\s+/g,'-'),level:String(v.get('level')).trim(),duration_seconds:Number(v.get('duration'))||null,video_url:String(v.get('video')).trim()||null,summary:String(v.get('summary')).trim(),is_published:v.has('published')};const {error}=f.dataset.animationId?await supabase.from('animations').update(values).eq('id',f.dataset.animationId):await supabase.from('animations').insert({...values,created_by:user.id});setStatus(status,error?'Não foi possível salvar; verifique se o slug já existe.':'Animação salva.',Boolean(error));if(!error)await loadAdminTools(root,user);});
  root.querySelector('#admin-download-form')?.addEventListener('submit',async(event)=>{event.preventDefault();const f=event.currentTarget;const v=new FormData(f);const status=f.querySelector('[role=status]');const file=v.get('file');if(!(file instanceof File)||!file.size)return;const path=`admin/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;const bucket=supabase.storage.from('downloads');const upload=await bucket.upload(path,file,{upsert:false});if(upload.error){setStatus(status,'Falha ao enviar. Confira se existe o bucket privado “downloads”.',true);return;}const {error}=await supabase.from('downloads').insert({animation_id:String(v.get('animation')||'')||null,title:String(v.get('title')).trim(),description:String(v.get('description')||'').trim(),file_name:file.name,storage_bucket:'downloads',storage_path:path,visibility:String(v.get('visibility')),is_published:false,created_by:user.id});if(error){await bucket.remove([path]);setStatus(status,'O arquivo foi enviado, mas o cadastro falhou. A operação foi revertida.',true);return;}setStatus(status,'Arquivo armazenado como rascunho privado. Publique quando estiver pronto.');await loadAdminTools(root,user);});
  root.querySelector('#admin-course-form')?.addEventListener('submit',async(event)=>{event.preventDefault();const f=event.currentTarget;const v=new FormData(f);const status=f.querySelector('[role=status]');const values={title:String(v.get('title')).trim(),description:String(v.get('description')||'').trim(),is_published:v.has('published')};const {error}=f.dataset.courseId?await supabase.from('courses').update(values).eq('id',f.dataset.courseId):await supabase.from('courses').insert({...values,created_by:user.id});setStatus(status,error?'Não foi possível salvar o curso.':'Curso salvo.',Boolean(error));if(!error)await loadAdminTools(root,user);});
}

function videoMarkup(raw,title) {
  if(!raw)return '';
  try {
    const url=new URL(raw);
    if(url.protocol!=='https:')return '';
    let videoId='';
    if(url.hostname==='youtu.be')videoId=url.pathname.split('/').filter(Boolean)[0]||'';
    else if(url.hostname.endsWith('youtube.com')||url.hostname.endsWith('youtube-nocookie.com'))videoId=url.searchParams.get('v')||url.pathname.split('/').filter(Boolean).at(-1)||'';
    if(/^[A-Za-z0-9_-]{6,20}$/.test(videoId))return `<iframe class="youtube-embed" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}" title="${safeText(title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
    if(/\.mp4$/i.test(url.pathname))return `<video class="animation-video" src="${safeText(url.href)}" controls preload="metadata"></video>`;
    return `<a class="text-link" href="${safeText(url.href)}" target="_blank" rel="noopener">Abrir vídeo em nova guia</a>`;
  } catch { return ''; }
}

async function hydrateAnimationDetails() {
  const detail=document.querySelector('#animation-detail');
  if(!detail||!supabase)return;
  const params=new URLSearchParams(location.search);
  const topic=params.get('topico'),animation=params.get('animacao');
  if(!topic||!animation)return;
  const {data,error}=await supabase.from('animations').select('id,title,topic,slug,summary,level,duration_seconds,video_url,downloads(id,title,file_name,storage_bucket,storage_path)').eq('slug',`${topic}--${animation}`).maybeSingle();
  if(error||!data)return;
  let downloads=(data.downloads||[]).map((file)=>`<li><span>${safeText(file.title)} · ${safeText(file.file_name)}</span><button class="button button-outline" type="button" data-private-download="${file.id}">Baixar arquivo</button></li>`).join('');
  if(!downloads){const path=siteHref(`downloads-${data.slug.replace('--','-')}.blend`);try{const exists=await fetch(path,{method:'HEAD'});if(exists.ok)downloads=`<li><span>Projeto Blender · ${safeText(data.slug.replace('--','-'))}.blend</span><a class="button button-outline" href="${path}" download>Baixar arquivo</a></li>`;}catch{}}
  const duration=data.duration_seconds?' · '+Math.floor(data.duration_seconds/60)+' min':'';
  detail.innerHTML=`<nav class="breadcrumbs" aria-label="Você está em"><a href="/">Início</a><span aria-hidden="true">/</span><a href="/topico.html?topico=${encodeURIComponent(topic)}">${safeText(data.topic)}</a><span aria-hidden="true">/</span><span>${safeText(data.title)}</span></nav><section class="animation-detail-hero"><div class="section-kicker">ANIMAÇÃO BLENDER · ${safeText(data.level||'Física')}</div><h1>${safeText(data.title)}</h1><p>${safeText(data.summary)}</p><p class="lesson-tag">${safeText(data.topic)}${duration}</p></section><section class="animation-video-panel"><h2>Vídeo e cena</h2>${videoMarkup(data.video_url,data.title)||'<p>Não há vídeo publicado. Baixe a cena e explore a animação diretamente no Blender.</p>'}</section><section class="account-section"><div class="section-kicker">ARQUIVOS</div><h2>Downloads desta animação</h2><ul class="private-list">${downloads||'<li>O arquivo Blender desta animação ainda não foi publicado.</li>'}</ul></section><aside class="blender-open-note"><p><strong>Abra no Blender:</strong> use <b>Arquivo → Abrir</b>, pressione <kbd>0</kbd> no teclado numérico para ver a câmera e <kbd>Espaço</kbd> para reproduzir ou pausar. A cena é uma representação didática e pode ser explorada no seu ritmo.</p></aside>`;
  detail.querySelectorAll('[data-private-download]').forEach((button)=>button.addEventListener('click',()=>downloadPrivate(button)));
  document.title=`${data.title} - Diário dos BNs`;
}

async function attachAuthNavigation() {
  document.querySelectorAll('.nav-account').forEach((link)=>{link.href='/login';link.textContent='Entrar';});
  if(!supabase)return;
  const {data}=await supabase.auth.getSession();
  if(data.session)document.querySelectorAll('.nav-account').forEach((link)=>{link.href='/perfil';link.textContent='Minha área';});
}

async function syncLegacyFavorite(event) {
  const button=event.target.closest('[data-favorite-topic]');
  if(!button||!supabase)return;
  const {data}=await supabase.auth.getSession();if(!data.session)return;
  const role=await getRole(data.session.user).catch(()=>null);if(!role||role.status!=='active')return;
  const slug=`${button.dataset.favoriteTopic}--${button.dataset.favoriteFile}`;
  const {data:animation}=await supabase.from('animations').select('id').eq('slug',slug).maybeSingle();if(!animation)return;
  const {error}=button.getAttribute('aria-pressed')==='true'
    ? await supabase.from('favorites').insert({user_id:data.session.user.id,animation_id:animation.id})
    : await supabase.from('favorites').delete().eq('user_id',data.session.user.id).eq('animation_id',animation.id);
  if(error)button.title='Não foi possível atualizar a lista na conta.';
}

document.querySelector('#print-resource')?.addEventListener('click',()=>window.print());

if (document.querySelector('#animation-detail')) hydrateAnimationDetails();

if (main) {
  attachAuthNavigation();
  document.addEventListener('click',syncLegacyFavorite);
  if (route==='/login'&&supabaseReady) getSignedUser().then(async(user)=>{if(user){const role=await getRole(user);navigate(destination(role), true);}}).catch(()=>{});
  if (route==='/login') renderLogin();
  else if (route==='/cadastro') renderSignup();
  else if (route==='/recuperar-senha') renderRecovery();
  else if (route==='/auth/callback') renderCallback();
  else if (protectedRoutes.includes(route)) protectRoute();
}
