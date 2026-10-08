import { supabase, supabaseReady, supabasePromise, supabaseLoadError } from './src-supabase.js?v=auth-fix-20261008';

// Load the shared accessibility controls on every page that uses the app module.
if (!document.querySelector('script[data-diario-accessibility]')) {
  const accessibilityScript = document.createElement('script');
  accessibilityScript.src = new URL('./accessibility.js', document.baseURI).href;
  accessibilityScript.dataset.diarioAccessibility = 'true';
  document.head.append(accessibilityScript);
}

const siteRoot = new URL('./', document.baseURI).pathname;
const routePart = location.pathname.slice(siteRoot.length).replace(/^\/+|\/+$|\.html$/g, '');
const routeAliases = {'login':'/login','cadastro':'/cadastro','conta':'/perfil','recuperar-senha':'/recuperar-senha','auth-callback':'/auth/callback','auth/callback':'/auth/callback','aluno':'/aluno','professor':'/professor','admin':'/admin','perfil':'/perfil'};
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
  if (link) {
    const raw=link.getAttribute('href');
    const resolvedPath=new URL(raw,document.baseURI).pathname;
    if(siteRoot!=='/'&&resolvedPath.startsWith(siteRoot)&&/\.html$/i.test(resolvedPath))return;
    link.href=siteHref(raw);
  }
}, true);
const protectedRoutes = ['/aluno','/professor','/admin','/perfil'];
const accountLabels = {aluno:'Aluno',professor:'Professor',admin:'Administrador'};
const educationStages = ['Ensino Fundamental I','Ensino Fundamental II','Ensino Médio','Ensino Técnico','Ensino Superior','Pós-graduação','Outro'];
const degreeLevels = ['Bacharelado','Licenciatura','Tecnólogo','Especialização','Mestrado acadêmico','Mestrado profissional','Doutorado acadêmico','Doutorado profissional','Ainda cursando graduação','Outro'];
const higherEducationCourses = ['Administração','Agronomia','Análise e Desenvolvimento de Sistemas','Arquitetura e Urbanismo','Artes Visuais','Astronomia','Biblioteconomia','Biomedicina','Ciência da Computação','Ciência de Dados','Ciências Biológicas','Ciências Contábeis','Ciências Econômicas','Ciências Sociais','Cinema e Audiovisual','Design','Direito','Educação Física','Enfermagem','Engenharia Ambiental','Engenharia Biomédica','Engenharia Civil','Engenharia da Computação','Engenharia de Alimentos','Engenharia de Produção','Engenharia Elétrica','Engenharia Mecânica','Engenharia Química','Estatística','Farmácia','Filosofia','Física','Fisioterapia','Fonoaudiologia','Geografia','Geologia','História','Jornalismo','Letras','Matemática','Medicina','Medicina Veterinária','Meteorologia','Música','Nutrição','Odontologia','Pedagogia','Psicologia','Química','Relações Internacionais','Serviço Social','Sistemas de Informação','Sociologia','Teatro','Terapia Ocupacional','Turismo','Zootecnia','Outro curso (escrever abaixo)'];
// Para fixar a transmissão para todos, cole aqui o link público da live no YouTube.
const YOUTUBE_LIVE_URL = '';
const stageOptions = (selected='') => educationStages.map((stage)=>`<option value="${safeText(stage)}" ${stage===selected?'selected':''}>${safeText(stage)}</option>`).join('');
const degreeOptions = (selected='') => degreeLevels.map((degree)=>`<option value="${safeText(degree)}" ${degree===selected?'selected':''}>${safeText(degree)}</option>`).join('');
const main = document.querySelector('main#conteudo');
const AUTH_STARTUP_TIMEOUT_MS = 12000;
function withDeadline(promise, message, ms = AUTH_STARTUP_TIMEOUT_MS) {
  let timer;
  return Promise.race([
    Promise.resolve(promise),
    new Promise((_, reject) => {
      timer = window.setTimeout(() => reject(new Error(message)), ms);
    })
  ]).finally(() => window.clearTimeout(timer));
}
const escapeHtml = (value='') => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeText = (value) => escapeHtml(value).replace(/`/g,'&#96;');
const setStatus = (node, text, error=false) => { if (node) { node.textContent = text; node.dataset.state = error ? 'error' : 'ok'; } };
function validateAuthForm(form, status) {
  if (form.checkValidity()) return true;
  const field = form.querySelector(':invalid');
  const label = field?.labels?.[0]?.textContent?.replace(/\* obrigatório/g, '').trim();
  setStatus(status, label ? `Confira este campo: ${label}` : 'Confira os campos obrigatórios destacados antes de enviar.', true);
  field?.focus();
  return false;
}
const authErrorMessage = (error, fallback) => {
  const message = String(error?.message || '');
  if (/failed to fetch|networkerror|fetch failed|load failed/i.test(message)) return 'Não foi possível conectar ao Supabase. Confira a conexão com a internet e a URL do projeto em supabase-config.js.';
  if (/email not confirmed/i.test(message)) return 'Confirme seu e-mail pelo link enviado antes de entrar.';
  if (/redirect.*(url|allow|valid)|requested path is invalid/i.test(message)) return 'O Supabase bloqueou o endereço de retorno. Adicione a URL do site em Authentication → URL Configuration.';
  if (/database error|trigger|user_roles|profiles/i.test(message)) return `O banco do Supabase não concluiu esta ação. Confira se as migrações foram executadas. Detalhe: ${message}`;
  return message ? `${fallback} Detalhe: ${message}` : fallback;
};
const flash = (text) => { try { sessionStorage.setItem('diario-bns-flash', text); } catch {} };
const takeFlash = () => { try { const text=sessionStorage.getItem('diario-bns-flash');sessionStorage.removeItem('diario-bns-flash');return text||''; } catch { return ''; } };
const configureNotice = `<aside class="auth-notice" role="status"><strong>Supabase ainda não configurado</strong><p>Confira a configuração pública do Supabase em <code>supabase-config.js</code> e siga as instruções de instalação do projeto.</p><a href="/README.md">Abrir instruções</a></aside>`;

function replaceMain(title, content) {
  if (!main) return;
  document.title = `${title} — Diário dos BNs`;
  main.innerHTML = `<div class="auth-page section-wrap">${content}</div>`;
  main.dataset.diarioAuthReady = 'true';
}

async function getSignedUser() {
  await withDeadline(supabasePromise, 'O serviço de login demorou para responder. Atualize a página e tente de novo.');
  if (!supabase) {
    if (supabaseReady) throw new Error(supabaseLoadError || 'Não foi possível carregar o serviço de login.');
    return null;
  }
  const {data:sessionData,error:sessionError}=await withDeadline(
    supabase.auth.getSession(),
    'A verificação da sua sessão demorou demais. Tente entrar novamente.'
  );
  if (sessionError) throw sessionError;
  if (!sessionData.session) return null;
  const {data,error}=await withDeadline(
    supabase.auth.getUser(),
    'A confirmação da sua conta demorou demais. Confira a conexão e tente de novo.'
  );
  if (error) throw error;
  return data.user;
}

async function getRole(user) {
  if (!supabase || !user) return null;
  const {data,error}=await withDeadline(
    supabase.from('user_roles').select('role,status').eq('user_id',user.id).maybeSingle(),
    'A consulta do perfil demorou demais. Tente novamente em instantes.'
  );
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
  authShell('Fazer login','Entre com o e-mail e a senha da sua conta.',`<form id="login-form" class="auth-form"><label for="login-email">E-mail</label><input id="login-email" name="email" type="email" autocomplete="email" required><label for="login-password">Senha</label><input id="login-password" name="password" type="password" autocomplete="current-password" required><button class="button button-primary" type="submit">Entrar</button><p id="form-status" class="auth-message" role="status" aria-live="polite"></p></form><div class="auth-links"><a href="/recuperar-senha">Esqueci minha senha</a><a class="button button-primary signup-cta" href="/cadastro">Criar conta</a></div>`);
  const loginForm=document.querySelector('#login-form');
  if(loginForm) loginForm.noValidate=true;
  loginForm?.addEventListener('submit',async(event)=>{
    event.preventDefault();const form=event.currentTarget;const status=document.querySelector('#form-status');const button=form.querySelector('button');
    if(!validateAuthForm(form,status))return;
    button.disabled=true;setStatus(status,'Verificando seus dados…');
    try {
      await withDeadline(supabasePromise, 'O serviço de login demorou para responder. Atualize a página e tente novamente.');
      if(!supabase){setStatus(status,supabaseLoadError||'Configure o Supabase para ativar o login.',true);return;}
      const {data,error}=await withDeadline(
        supabase.auth.signInWithPassword({email:form.elements.namedItem('email').value.trim(),password:form.elements.namedItem('password').value}),
        'O Supabase demorou para responder ao login. Confira sua conexão e tente novamente.',
        22000
      );
      if(error){setStatus(status,authErrorMessage(error,'Não foi possível entrar. Confira o e-mail e a senha.'),true);return;}
      const role=await getRole(data.user);
      if(!role||role.status==='blocked'){await supabase.auth.signOut();setStatus(status,'A conta está indisponível. Procure o responsável pelo site.',true);return;}
      navigate(destination(role));
    } catch(err) {
      setStatus(status,authErrorMessage(err,`Conta autenticada, mas não foi possível consultar o perfil: ${err?.message||''}`),true);
    } finally { button.disabled=false; }
  });
}

function renderSignup() {
  authShell('Criar conta','Escolha o tipo de conta e informe sua etapa de ensino ou formação. Contas de administrador são configuradas pelo proprietário, fora do cadastro público.',`<form id="signup-form" class="auth-form"><label for="signup-name">Nome</label><input id="signup-name" name="name" autocomplete="name" maxlength="100" required><label for="signup-email">E-mail</label><input id="signup-email" name="email" type="email" autocomplete="email" required><label for="signup-age-range">Faixa etária</label><select id="signup-age-range" name="age_range" required><option value="">Selecione sua faixa etária</option><option>Até 12 anos</option><option>13 a 15 anos</option><option>16 a 17 anos</option><option>18 a 24 anos</option><option>25 a 39 anos</option><option>40 anos ou mais</option></select><small>Informamos apenas uma faixa etária, não a data de nascimento. Estudantes menores de idade devem realizar o cadastro com apoio de um responsável.</small><label for="signup-password">Senha</label><input id="signup-password" name="password" type="password" autocomplete="new-password" minlength="10" required><small>Use pelo menos 10 caracteres. O Supabase Auth armazena a credencial com hash.</small><label for="signup-confirm">Confirmação de senha</label><input id="signup-confirm" name="confirm" type="password" autocomplete="new-password" minlength="10" required><label for="signup-role">Tipo de conta</label><select id="signup-role" name="role"><option value="aluno">Aluno</option><option value="professor">Professor · aprovação pendente</option></select><fieldset id="student-education-fields" class="signup-fieldset"><legend>Etapa de ensino do aluno</legend><label for="signup-education-level">Etapa de ensino</label><select id="signup-education-level" name="education_level" required><option value="">Selecione sua etapa</option>${stageOptions()}</select><label for="signup-education-detail">Ano, série ou período <span>(opcional)</span></label><input id="signup-education-detail" name="education_detail" maxlength="100" placeholder="Ex.: 8º ano, 2º ano, 3º semestre"></fieldset><fieldset id="teacher-education-fields" class="signup-fieldset" hidden><legend>Formação do professor</legend><label for="signup-degree-level">Titulação ou etapa da formação</label><select id="signup-degree-level" name="teacher_degree_level">${degreeOptions()}</select><label for="signup-degree-program">Curso / área de formação</label><input id="signup-degree-program" name="teacher_degree_program" list="teacher-course-options" maxlength="160" placeholder="Escolha ou digite seu curso"><datalist id="teacher-course-options">${higherEducationCourses.map((course)=>`<option value="${safeText(course)}">`).join('')}</datalist><label for="signup-institution">Faculdade ou instituição <span>(opcional)</span></label><input id="signup-institution" name="teacher_institution" maxlength="160" placeholder="Nome da instituição"></fieldset><details class="accessibility-signup" id="signup-accessibility"><summary>Personalize sua experiência <span>(opcional)</span></summary><p>Estas informações são opcionais. Elas ficam apenas neste navegador, não são enviadas ao Supabase e não aparecem para professores ou outros estudantes. Em aparelhos compartilhados, prefira não informar condições pessoais.</p><fieldset><legend>Como você prefere personalizar sua experiência?</legend><label><input type="radio" name="a11y-profile" value="neurotypical"> Neurotípico</label><label><input type="radio" name="a11y-profile" value="neurodivergent"> Neurodivergente</label><label><input type="radio" name="a11y-profile" value="prefer-not"> Prefiro não informar</label></fieldset><fieldset id="signup-accessibility-conditions" hidden><legend>Quais características ou condições você gostaria de usar para personalizar a experiência? (opcional, múltipla escolha)</legend><p>Esta lista não é uma classificação médica universal. Não fazemos diagnósticos nem inferimos condições.</p><strong>Neurodesenvolvimento e aprendizagem</strong><label><input type="checkbox" name="a11y-conditions" value="TEA"> Transtorno do Espectro Autista (TEA)</label><label><input type="checkbox" name="a11y-conditions" value="TDAH"> TDAH</label><label><input type="checkbox" name="a11y-conditions" value="Dislexia"> Dislexia</label><label><input type="checkbox" name="a11y-conditions" value="Discalculia"> Discalculia</label><label><input type="checkbox" name="a11y-conditions" value="Disgrafia"> Disgrafia</label><label><input type="checkbox" name="a11y-conditions" value="Dispraxia / coordenação"> Dispraxia / Transtorno do Desenvolvimento da Coordenação</label><label><input type="checkbox" name="a11y-conditions" value="Desenvolvimento da linguagem"> Transtorno do Desenvolvimento da Linguagem</label><label><input type="checkbox" name="a11y-conditions" value="Outro perfil de aprendizagem"> Outros perfis relacionados à aprendizagem</label><strong>Comunicação e linguagem</strong><label><input type="checkbox" name="a11y-conditions" value="Dificuldades específicas de linguagem"> Dificuldades específicas de linguagem</label><label><input type="checkbox" name="a11y-conditions" value="Processamento da linguagem"> Dificuldades de processamento da linguagem</label><label><input type="checkbox" name="a11y-conditions" value="Outra condição de linguagem"> Outras</label><strong>Outras características</strong><label><input type="checkbox" name="a11y-conditions" value="Tourette"> Síndrome de Tourette</label><label><input type="checkbox" name="a11y-conditions" value="Transtornos específicos de aprendizagem"> Transtornos específicos de aprendizagem</label><label><input type="checkbox" name="a11y-conditions" value="Outra condição ou característica"> Outras condições ou características</label><label for="signup-a11y-other">Outra — especificar (opcional)</label><input id="signup-a11y-other" name="a11y-other" maxlength="120"><label><input type="checkbox" name="a11y-conditions" value="prefer-not"> Prefiro não informar</label></fieldset><small>Você pode alterar ou apagar essa escolha na Central de Acessibilidade. Os controles visuais e de leitura podem ser usados independentemente dessas respostas.</small></details><label class="consent-check"><input type="checkbox" name="consent" required><span>Li e aceito os <a href="/termos.html" target="_blank" rel="noopener">Termos de Uso</a> e a <a href="/privacidade.html" target="_blank" rel="noopener">Política de Privacidade</a>.</span></label><button class="button button-primary" type="submit">Criar conta</button><p id="form-status" class="auth-message" role="status" aria-live="polite"></p></form><div class="auth-links"><a href="/login">Já tenho uma conta</a></div><aside class="auth-note"><strong>Cadastro de professor</strong><p>A formação informada ajuda na identificação, mas não substitui a aprovação do responsável pelo site. O acesso docente só é liberado após aprovação.</p></aside>`);
  const form=document.querySelector('#signup-form');const roleSelect=form?.elements.namedItem('role');const studentFields=document.querySelector('#student-education-fields');const teacherFields=document.querySelector('#teacher-education-fields');
  form.noValidate=true;
  form.querySelector('button[type="submit"]')?.classList.add('signup-submit');
  roleSelect.required=true;roleSelect.insertAdjacentHTML('afterbegin','<option value="" selected>Selecione o tipo de conta</option>');
  const degreeSelect=teacherFields.querySelector('#signup-degree-level');degreeSelect.insertAdjacentHTML('afterbegin','<option value="" selected>Selecione sua formação</option>');
  const requiredNote=document.createElement('p');requiredNote.className='required-note';requiredNote.innerHTML='<span aria-hidden="true">*</span> Campos marcados com asterisco são obrigatórios.';form.prepend(requiredNote);
  const markRequiredFields=()=>{form.querySelectorAll('.required-marker').forEach((marker)=>marker.remove());form.querySelectorAll('[required]').forEach((field)=>{if(field.closest('[hidden]'))return;const label=field.closest('label')||[...form.querySelectorAll('label[for]')].find((item)=>item.htmlFor===field.id);if(!label)return;const marker=document.createElement('span');marker.className='required-marker';marker.setAttribute('aria-hidden','true');marker.textContent='* obrigatório';label.append(marker);});};
  const syncSignupFields=()=>{const teacher=roleSelect?.value==='professor';studentFields.hidden=teacher;teacherFields.hidden=!teacher;studentFields.querySelectorAll('select,input').forEach((field)=>field.required=!teacher&&field.id==='signup-education-level');degreeSelect.required=teacher;teacherFields.querySelector('#signup-degree-program').required=teacher;markRequiredFields();};
  roleSelect?.addEventListener('change',syncSignupFields);syncSignupFields();
  const accessibilityChoices=form?.querySelectorAll('input[name="a11y-profile"]');
  const syncAccessibilityChoices=()=>{const selected=form?.querySelector('input[name="a11y-profile"]:checked')?.value;const conditions=form?.querySelector('#signup-accessibility-conditions');if(conditions)conditions.hidden=selected!=='neurodivergent';};
  accessibilityChoices?.forEach((choice)=>choice.addEventListener('change',syncAccessibilityChoices));syncAccessibilityChoices();
  const conditionChoices=[...(form?.querySelectorAll('input[name="a11y-conditions"]')||[])];
  conditionChoices.forEach((choice)=>choice.addEventListener('change',()=>{const preferNot=conditionChoices.find((item)=>item.value==='prefer-not');if(choice===preferNot&&choice.checked)conditionChoices.filter((item)=>item!==preferNot).forEach((item)=>{item.checked=false;});else if(choice.checked&&preferNot)preferNot.checked=false;}));
  form?.addEventListener('submit',async(event)=>{
    event.preventDefault();const form=event.currentTarget;const status=document.querySelector('#form-status');const button=form.querySelector('button');
    if(!validateAuthForm(form,status))return;
    const values=new FormData(form);const password=String(values.get('password'));const confirmation=String(values.get('confirm'));
    if(password!==confirmation){setStatus(status,'As senhas digitadas não coincidem.',true);form.elements.namedItem('confirm').focus();return;}
    if(password.length<10){setStatus(status,'A senha deve ter pelo menos 10 caracteres.',true);form.elements.namedItem('password').focus();return;}
    button.disabled=true;setStatus(status,'Conectando ao serviço de cadastro…');
    try {
      await withDeadline(supabasePromise, 'O serviço de cadastro demorou para responder. Atualize a página e tente novamente.');
    } catch(err) {
      setStatus(status,authErrorMessage(err,'Não foi possível abrir o serviço de cadastro.'),true);button.disabled=false;return;
    }
    if(!supabase){setStatus(status,supabaseLoadError||'Configure o Supabase para ativar o cadastro.',true);button.disabled=false;return;}
    setStatus(status,'Criando sua conta…');
    const role=values.get('role')==='professor'?'professor':'aluno';
    const teacher=role==='professor';
    let data,error;
    try {
      ({data,error}=await withDeadline(supabase.auth.signUp({email:String(values.get('email')).trim(),password,options:{emailRedirectTo:`${location.origin}${siteHref('auth/callback/')}`,data:{display_name:String(values.get('name')).trim(),requested_role:role,age_range:String(values.get('age_range')),education_level:teacher?'':String(values.get('education_level')||''),education_detail:teacher?'':String(values.get('education_detail')||''),teacher_degree_level:teacher?String(values.get('teacher_degree_level')||''):'',teacher_degree_program:teacher?String(values.get('teacher_degree_program')||'').trim():'',teacher_institution:teacher?String(values.get('teacher_institution')||'').trim():'',teacher_verification_ack:teacher&&values.get('teacher_verification_ack')==='true'?'true':'false',terms_version:'1.0',privacy_version:'1.0'}}}), 'O Supabase demorou para responder ao cadastro. Confira sua conexão e tente novamente.', 22000));
    } catch(err) {
      setStatus(status,authErrorMessage(err,'Não foi possível criar a conta. Confira os dados e tente novamente.'),true);button.disabled=false;return;
    }
    button.disabled=false;
    if(error){setStatus(status,authErrorMessage(error,'Não foi possível criar a conta. Verifique os dados e as configurações de e-mail.'),true);return;}
    if(data.user?.id){try{const identity=String(values.get('a11y-profile')||'');if(identity){const selectedConditions=values.getAll('a11y-conditions');const preferNotConditions=selectedConditions.includes('prefer-not');const selfReport={identity,conditions:identity==='neurodivergent'&&!preferNotConditions?selectedConditions:[],preferNotConditions:identity==='neurodivergent'&&preferNotConditions,other:identity==='neurodivergent'&&!preferNotConditions?String(values.get('a11y-other')||'').trim():'',updatedAt:new Date().toISOString()};localStorage.setItem(`diario-bns:accessibility-profile:${data.user.id}`,JSON.stringify(selfReport));}}catch{}}
    if(data.session){flash(role==='professor'?'Conta criada. O acesso de professor aguarda aprovação.':'Conta criada.');navigate(role==='professor'?'/professor/':'/aluno/');}
    else setStatus(status,role==='professor'?'Conta criada. Confirme o endereço de e-mail; depois, o proprietário do site precisará aprovar o perfil de professor.':'Conta criada. Enviamos um link de confirmação para seu e-mail. Confirme-o antes de fazer login.');
  });
}

function renderRecovery() {
  const updating=new URLSearchParams(location.search).get('mode')==='update';
  if(updating){
    authShell('Definir nova senha','Escolha uma senha nova para sua conta.',`<form id="password-update-form" class="auth-form"><label for="new-password">Nova senha</label><input id="new-password" type="password" minlength="10" autocomplete="new-password" required><label for="new-password-confirm">Confirme a nova senha</label><input id="new-password-confirm" type="password" minlength="10" autocomplete="new-password" required><button class="button button-primary" type="submit">Salvar senha</button><p id="form-status" class="auth-message" role="status" aria-live="polite"></p></form>`);
    const code=new URLSearchParams(location.search).get('code');
    const status=document.querySelector('#form-status');
    const form=document.querySelector('#password-update-form');
    const submit=form?.querySelector('button[type="submit"]');
    if(form)form.noValidate=true;
    if(code){
      if(submit)submit.disabled=true;
      setStatus(status,'Validando o link de recuperação…');
      (async()=>{
        await supabasePromise;
        if(!supabase)throw new Error(supabaseLoadError||'O Supabase não está disponível.');
        const {error}=await supabase.auth.exchangeCodeForSession(code);
        if(error)throw error;
        setStatus(status,'Link validado. Agora escolha sua nova senha.');
      })().catch(()=>setStatus(status,'O link expirou ou não pôde ser validado. Solicite outro e abra-o no mesmo navegador.',true)).finally(()=>{if(submit)submit.disabled=false;});
    }
    form?.addEventListener('submit',async(event)=>{
      event.preventDefault();
      const status=form.querySelector('#form-status');
      const button=form.querySelector('button[type="submit"]');
      if(!validateAuthForm(form,status))return;
      const first=form.querySelector('#new-password').value;
      const second=form.querySelector('#new-password-confirm').value;
      if(first!==second){setStatus(status,'As senhas digitadas não coincidem.',true);form.querySelector('#new-password-confirm').focus();return;}
      button.disabled=true;setStatus(status,'Conectando ao serviço de login…');
      try{
        await supabasePromise;
        if(!supabase)throw new Error(supabaseLoadError||'Configure o Supabase para alterar sua senha.');
        setStatus(status,'Salvando sua nova senha…');
        const {error}=await supabase.auth.updateUser({password:first});
        if(error)throw error;
        await supabase.auth.signOut();flash('Senha atualizada. Faça login com a nova senha.');navigate('/login/');
      }catch(error){setStatus(status,authErrorMessage(error,'Falha de conexão ao salvar a senha. Tente novamente.'),true);}
      finally{button.disabled=false;}
    });
    return;
  }
  authShell('Recuperar senha','Informe o e-mail usado no cadastro. Se a conta existir, enviaremos um link.',`<form id="recovery-form" class="auth-form"><label for="recovery-email">E-mail</label><input id="recovery-email" type="email" autocomplete="email" required><button class="button button-primary" type="submit">Enviar link de recuperação</button><p id="form-status" class="auth-message" role="status" aria-live="polite"></p><p class="form-help">Se o e-mail não chegar, confira o spam e as configurações SMTP do projeto Supabase. O endereço cadastrado precisa estar confirmado.</p></form><div class="auth-links"><a href="/login">Voltar ao login</a></div>`);
  const recoveryForm=document.querySelector('#recovery-form');
  if(recoveryForm)recoveryForm.noValidate=true;
  recoveryForm?.addEventListener('submit',async(event)=>{
    event.preventDefault();
    const email=recoveryForm.querySelector('#recovery-email').value.trim();
    const status=recoveryForm.querySelector('#form-status');
    const button=recoveryForm.querySelector('button[type="submit"]');
    if(!validateAuthForm(recoveryForm,status))return;
    button.disabled=true;setStatus(status,'Conectando ao serviço de recuperação…');
    try{
      await supabasePromise;
      if(!supabase)throw new Error(supabaseLoadError||'Configure o Supabase para ativar a recuperação.');
      const redirectTo=`${location.origin}${siteHref('recuperar-senha/?mode=update')}`;
      const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo});
      if(error)throw error;
      setStatus(status,'Solicitação enviada. Confira a caixa de entrada e o spam. Se nada chegar, verifique o SMTP em Authentication → SMTP Settings.');
    }catch(error){setStatus(status,authErrorMessage(error,'Falha de conexão com o Supabase. Confira sua internet e tente novamente.'),true);}
    finally{button.disabled=false;}
  });
}

async function renderCallback() {
  replaceMain('Confirmando e-mail','<section class="auth-card"><h1>Confirmando seu e-mail…</h1><p id="callback-status" role="status">Aguarde enquanto validamos o link.</p></section>');
  const status=document.querySelector('#callback-status');
  try {
    await supabasePromise;
    if(!supabase)throw new Error(supabaseLoadError||'Configure o Supabase e reinicie o servidor.');
    const code=new URLSearchParams(location.search).get('code');
    if(code){const {error}=await supabase.auth.exchangeCodeForSession(code);if(error){setStatus(status,'O link expirou ou já foi utilizado. Solicite um link novo.',true);return;}}
    const user=await getSignedUser();if(!user){setStatus(status,'Não encontramos uma sessão. Faça login ou solicite outro link.',true);return;}
    const role=await getRole(user);flash('E-mail confirmado. Boas-vindas ao Diário dos BNs.');navigate(destination(role), true);
  } catch(error) { setStatus(status,authErrorMessage(error,'Não foi possível confirmar o e-mail. Tente abrir o link novamente.'),true); }
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
  const profileButton=route==='/perfil'?'':'<a class="button button-outline" href="/perfil/">Acessar perfil</a>';
  return `<section class="dashboard-heading"><div><div class="lesson-tag">${accountLabels[role.role]||'Conta'}${role.status==='pending'?' · APROVAÇÃO PENDENTE':''}</div><h1>${title}</h1><p>${lead}</p></div><div class="dashboard-actions">${profileButton}<button type="button" class="button button-outline" data-logout>Sair da conta</button></div></section>`;
}

function wireLogout() {
  document.querySelectorAll('[data-logout]').forEach((button)=>{
    if(button.dataset.logoutBound)return;
    button.dataset.logoutBound='true';
    button.addEventListener('click',async()=>{
      button.disabled=true;
      try{
        const {error}=await supabase.auth.signOut();
        if(error)throw error;
        navigate('/login/');
      }catch(error){
        button.disabled=false;
        button.title=error?.message||'Não foi possível sair. Confira sua conexão e tente novamente.';
        button.textContent='Tente sair novamente';
      }
    });
  });
}

async function renderProfile(user,role) {
  const {data:profile,error}=await supabase.from('profiles').select('display_name,bio,avatar_path,age_range,education_level,education_detail,teacher_degree_level,teacher_degree_program,teacher_institution,created_at').eq('id',user.id).single();
  if(error)throw error;
  const avatar=validAvatarData(profile.avatar_path)?profile.avatar_path:'';
  const avatarAlt=profile.display_name?`Foto de perfil de ${profile.display_name}`:'Foto de perfil';
  const fallbackAvatar=`data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 120 120%22%3E%3Crect width=%22120%22 height=%22120%22 rx=%2260%22 fill=%22%23172235%22/%3E%3Ctext x=%2260%22 y=%2276%22 text-anchor=%22middle%22 font-size=%2254%22 fill=%22%23d9bd7a%22%3E${encodeURIComponent((profile.display_name||user.email||'U').trim().slice(0,1).toUpperCase())}%3C/text%3E%3C/svg%3E`;
  const ageOptions=['Até 12 anos','13 a 15 anos','16 a 17 anos','18 a 24 anos','25 a 39 anos','40 anos ou mais'].map((value)=>`<option value="${value}" ${profile.age_range===value?'selected':''}>${value}</option>`).join('');
  const educationFields=role.role==='aluno'?`<label for="profile-education-level">Etapa de ensino</label><select id="profile-education-level">${stageOptions(profile.education_level)}</select><label for="profile-education-detail">Ano, série ou período</label><input id="profile-education-detail" maxlength="100" value="${safeText(profile.education_detail||'')}">`:role.role==='professor'?`<label for="profile-degree-level">Titulação ou etapa da formação</label><select id="profile-degree-level">${degreeOptions(profile.teacher_degree_level)}</select><label for="profile-degree-program">Curso / área de formação</label><input id="profile-degree-program" list="profile-teacher-course-options" maxlength="160" value="${safeText(profile.teacher_degree_program||'')}"><datalist id="profile-teacher-course-options">${higherEducationCourses.map((course)=>`<option value="${safeText(course)}">`).join('')}</datalist><label for="profile-institution">Faculdade ou instituição</label><input id="profile-institution" maxlength="160" value="${safeText(profile.teacher_institution||'')}">`:'';
  replaceMain('Meu perfil',`${profileHeader(user,role,'Meu perfil','Edite seus dados e sua foto de perfil. Seu e-mail e sua senha permanecem protegidos pelo Supabase Auth.')}
    <section class="auth-card profile-card"><form id="profile-form" class="auth-form"><div class="profile-avatar-editor"><img id="profile-avatar-preview" class="profile-avatar" src="${avatar||fallbackAvatar}" alt="${safeText(avatarAlt)}"><div><label for="profile-avatar-file">Foto de perfil</label><input id="profile-avatar-file" type="file" accept="image/jpeg,image/png,image/webp"><small>JPG, PNG ou WebP. A imagem será reduzida para até 512 × 512 pixels.</small><button class="button button-outline" type="button" id="remove-profile-avatar">Remover foto</button></div></div><label>E-mail da conta</label><input value="${safeText(user.email||'')}" readonly><label for="profile-name">Nome de exibição</label><input id="profile-name" maxlength="100" value="${safeText(profile.display_name||'')}" required><label for="profile-age-range">Faixa etária</label><select id="profile-age-range" required><option value="">Selecione</option>${ageOptions}</select>${educationFields}<label for="profile-bio">Sobre você</label><textarea id="profile-bio" maxlength="500" rows="4">${safeText(profile.bio||'')}</textarea><button class="button button-primary" type="submit">Salvar perfil</button><p id="form-status" class="auth-message" role="status" aria-live="polite"></p></form></section><p class="auth-links"><a href="${destination(role)}">Voltar para minha área</a></p>`);
  const form=document.querySelector('#profile-form');const fileInput=document.querySelector('#profile-avatar-file');const preview=document.querySelector('#profile-avatar-preview');let nextAvatar=avatar,removeAvatar=false;
  document.querySelector('#remove-profile-avatar').addEventListener('click',()=>{nextAvatar='';removeAvatar=true;preview.src=fallbackAvatar;preview.alt='Sem foto de perfil';});
  fileInput.addEventListener('change',async()=>{const file=fileInput.files?.[0];if(!file)return;if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>8*1024*1024){setStatus(document.querySelector('#form-status'),'Escolha uma imagem JPG, PNG ou WebP com até 8 MB.',true);fileInput.value='';return;}try{nextAvatar=await compressAvatar(file);if(nextAvatar.length>450000)throw new Error('Imagem ainda muito grande');removeAvatar=false;preview.src=nextAvatar;preview.alt='Prévia da foto de perfil';setStatus(document.querySelector('#form-status'),'Prévia pronta. Clique em Salvar perfil para guardar a foto.');}catch{setStatus(document.querySelector('#form-status'),'Não foi possível reduzir essa foto para o tamanho permitido. Escolha outra imagem menor.',true);fileInput.value='';}});
  form.addEventListener('submit',async(event)=>{event.preventDefault();const f=event.currentTarget;const status=document.querySelector('#form-status');const updates={display_name:f.querySelector('#profile-name').value.trim(),bio:f.querySelector('#profile-bio').value.trim(),age_range:f.querySelector('#profile-age-range').value};if(role.role==='aluno'){updates.education_level=f.querySelector('#profile-education-level').value;updates.education_detail=f.querySelector('#profile-education-detail').value.trim();}if(role.role==='professor'){updates.teacher_degree_level=f.querySelector('#profile-degree-level').value;updates.teacher_degree_program=f.querySelector('#profile-degree-program').value.trim();updates.teacher_institution=f.querySelector('#profile-institution').value.trim();}if(removeAvatar||nextAvatar)updates.avatar_path=nextAvatar||null;const {error}=await supabase.from('profiles').update(updates).eq('id',user.id);setStatus(status,error?`Não foi possível salvar o perfil: ${error.message}`:'Perfil atualizado.',Boolean(error));});wireLogout();
}

function validAvatarData(value='') { return typeof value==='string'&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value); }
function compressAvatar(file) { return new Promise((resolve,reject)=>{const image=new Image();const url=URL.createObjectURL(file);image.onload=()=>{const scale=Math.min(1,512/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);URL.revokeObjectURL(url);resolve(canvas.toDataURL('image/jpeg',0.72));};image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Imagem inválida'));};image.src=url;}); }

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
  root.querySelector('#join-class-form')?.addEventListener('submit',async(event)=>{event.preventDefault();const status=root.querySelector('#join-status');const {error}=await supabase.rpc('join_class_by_code',{p_code:event.currentTarget.code.value.trim().toUpperCase()});let message='Você entrou na turma.';if(error){message=error.message?.includes('não está mais aceitando')?'Esta turma não está mais aceitando novos alunos.':error.message?.includes('Código de turma inválido')?'Código de turma inválido.':'Não foi possível entrar na turma. Confira o código e tente novamente.';}setStatus(status,message,Boolean(error));if(!error)await loadLearningWorkspace(root,user,role);});
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
    supabase.from('teacher_classrooms').select('classroom_id,classrooms(id,name,join_code,education_level,created_at)').eq('user_id',user.id),
    supabase.from('activities').select('id,title,subject,description,is_published,approval_status,review_note,classroom_activities(classroom_id)').eq('created_by',user.id).order('created_at',{ascending:false}),
    supabase.from('activity_submissions').select('id,activity_id,classroom_id,student_id,response,submitted_at,activities(title),classrooms(name),profiles!activity_submissions_student_id_fkey(display_name),submission_feedback(feedback)').order('submitted_at',{ascending:false})
  ]);
  const issues=[classes,activities,submissions].find((item)=>item.error);
  if(issues){root.innerHTML=`<aside class="auth-notice" role="alert"><strong>Não foi possível carregar as ferramentas docentes</strong><p>${safeText(issues.error.message)}. Aplique as migrações e confira o status de aprovação do perfil.</p></aside>`;return;}
  const classIds=(classes.data||[]).map((item)=>item.classroom_id);
  const permissionResult=classIds.length?await supabase.from('class_permissions').select('classroom_id,can_publish_activities').in('classroom_id',classIds):{data:[],error:null};
  const canPublish=(activity)=>(activity.classroom_activities||[]).some((assignment)=>(permissionResult.data||[]).some((permission)=>permission.classroom_id===assignment.classroom_id&&permission.can_publish_activities));
  const classRows=(classes.data||[]).map((item)=>`<li><b>${safeText(item.classrooms?.name||'Turma')}</b><span>${safeText(item.classrooms?.education_level||'Etapa não informada')} · Código para estudantes: <code>${safeText(item.classrooms?.join_code||'')}</code></span></li>`).join('')||'<li>Você ainda não criou turmas.</li>';
  const activityOptions=(activities.data||[]).map((item)=>`<option value="${item.id}">${safeText(item.title)}</option>`).join('');
  const classOptions=(classes.data||[]).map((item)=>`<option value="${item.classroom_id}">${safeText(item.classrooms?.name||'Turma')}</option>`).join('');
  const activityRows=(activities.data||[]).map((item)=>`<li><b>${safeText(item.title)}</b> · ${{pending:'Aguardando aprovação',approved:item.is_published?'publicada':'aprovada, ainda não publicada',changes_requested:'Alterações solicitadas',rejected:'Recusada',draft:'Rascunho'}[item.approval_status]|| (item.is_published?'publicada':'rascunho')}${item.review_note?`<span>Observação do administrador: ${safeText(item.review_note)}</span>`:''}${['draft','changes_requested','rejected'].includes(item.approval_status)?` <button type="button" data-submit-existing-activity="${item.id}">Enviar para análise${item.approval_status==='draft'?'':' novamente'}</button>`:''}${item.approval_status==='approved'&&canPublish(item)?` <button type="button" data-teacher-publish="${item.id}" data-published="${Boolean(item.is_published)}">${item.is_published?'Despublicar':'Publicar'}</button>`:''}</li>`).join('')||'<li>Você ainda não criou atividades.</li>';
  const responseRows=(submissions.data||[]).map((item)=>`<article class="submission-row"><b>${safeText(item.activities?.title||'Atividade')} · ${safeText(item.classrooms?.name||'Turma')}</b><span>Estudante: ${safeText(item.profiles?.display_name||'perfil')} · ${new Date(item.submitted_at).toLocaleDateString('pt-BR')}</span><p>${safeText(item.response)}</p><form data-feedback-form="${item.id}"><label>Devolutiva<input name="feedback" maxlength="1000" value="${safeText(item.submission_feedback?.[0]?.feedback||'')}"></label><button class="button button-outline" type="submit">Salvar devolutiva</button><span role="status"></span></form></article>`).join('')||'<p>Ainda não há respostas nas suas turmas.</p>';
  root.innerHTML=`<div class="staff-grid"><section class="auth-card"><div class="section-kicker">TURMAS</div><h2>Criar turma</h2><form id="create-class-form" class="auth-form"><label for="class-name">Nome da turma</label><input id="class-name" name="name" required maxlength="100"><label for="class-stage">Etapa de ensino</label><select id="class-stage" name="education_level" required>${stageOptions()}</select><button class="button button-primary" type="submit">Criar turma</button><p class="auth-message" role="status"></p></form><ul class="private-list">${classRows}</ul></section><section class="auth-card"><div class="section-kicker">ATIVIDADES</div><h2>Criar atividade</h2><form id="create-activity-form" class="auth-form"><label>Título</label><input name="title" required maxlength="140"><label>Assunto de Física</label><input name="subject" required maxlength="100"><label>Instruções</label><textarea name="description" rows="4" maxlength="5000" required></textarea><button class="button button-primary">Salvar atividade</button><p class="auth-message" role="status"></p></form><ul class="private-list">${activityRows}</ul></section><section class="auth-card"><div class="section-kicker">COMPARTILHAR</div><h2>Enviar atividade à turma</h2><form id="assign-activity-form" class="auth-form"><label>Atividade</label><select name="activity" required>${activityOptions}</select><label>Turma</label><select name="classroom" required>${classOptions}</select><button class="button button-outline">Compartilhar</button><p class="auth-message" role="status"></p></form></section></div><section class="account-section"><div class="section-kicker">RESPOSTAS DA TURMA</div><h2>Acompanhamento de atividades</h2><div class="submission-list">${responseRows}</div><p class="privacy-note">Você vê somente respostas de atividades vinculadas às turmas em que tem permissão docente. Evite solicitar dados sensíveis aos estudantes.</p></section>`;
  root.querySelector('#create-class-form')?.addEventListener('submit',async(event)=>{event.preventDefault();const f=event.currentTarget;const values=new FormData(f);const status=f.querySelector('[role=status]');const {error}=await supabase.rpc('create_classroom',{p_name:String(values.get('name')).trim(),p_description:'',p_education_level:String(values.get('education_level'))});setStatus(status,error?`Não foi possível criar turma: ${error.message}`:'Turma criada com código de acesso.',Boolean(error));if(!error)await loadTeacherTools(root,user);});
  root.querySelector('#create-activity-form')?.addEventListener('submit',async(event)=>{event.preventDefault();const f=event.currentTarget;const values=new FormData(f);const status=f.querySelector('[role=status]');const {error}=await supabase.from('activities').insert({title:String(values.get('title')).trim(),subject:String(values.get('subject')).trim(),description:String(values.get('description')).trim(),created_by:user.id,is_published:true});setStatus(status,error?'Não foi possível salvar a atividade.':'Atividade criada.',Boolean(error));if(!error)await loadTeacherTools(root,user);});
  root.querySelector('#assign-activity-form')?.addEventListener('submit',async(event)=>{event.preventDefault();const f=event.currentTarget;const status=f.querySelector('[role=status]');const {error}=await supabase.from('classroom_activities').insert({activity_id:f.activity.value,classroom_id:f.classroom.value,assigned_by:user.id});setStatus(status,error?'Não foi possível compartilhar. Confira se a turma pertence a você.':'Atividade compartilhada com a turma.',Boolean(error));});
  root.querySelectorAll('[data-feedback-form]').forEach((form)=>form.addEventListener('submit',async(event)=>{event.preventDefault();const f=event.currentTarget;const values=new FormData(f);const status=f.querySelector('[role=status]');const {error}=await supabase.from('submission_feedback').upsert({submission_id:f.dataset.feedbackForm,teacher_id:user.id,feedback:String(values.get('feedback')).trim()});setStatus(status,error?'Não foi possível salvar a devolutiva.':'Devolutiva salva.',Boolean(error));}));
  root.querySelectorAll('[data-submit-existing-activity]').forEach((button)=>button.addEventListener('click',async()=>{button.disabled=true;const {data,error}=await supabase.rpc('teacher_submit_existing_activity',{p_activity:button.dataset.submitExistingActivity});if(error){button.disabled=false;button.title=error.message;alert('Não foi possível enviar a atividade: '+error.message);}else{button.textContent=data==='pending'?'Aguardando análise':'Atividade atualizada';setTimeout(()=>loadTeacherTools(root,user),600);}}));
  root.querySelectorAll('[data-teacher-publish]').forEach((button)=>button.addEventListener('click',async()=>{button.disabled=true;const {error}=await supabase.rpc('teacher_set_activity_published',{p_activity:button.dataset.teacherPublish,p_is_published:button.dataset.published!=='true'});if(error){button.disabled=false;button.title=error.message;alert('Não foi possível alterar a publicação: '+error.message);}else setTimeout(()=>loadTeacherTools(root,user),600);}));
}

async function renderAdmin(user) {
  replaceMain('Painel administrativo',`${profileHeader(user,{role:'admin'},'Painel administrativo','Gerencie publicação, usuários, cursos e arquivos. O cadastro público não pode criar administradores.')}
    <div class="account-shortcuts"><a href="/perfil">Meu perfil</a><a href="/">Ver site</a></div><div id="admin-tools" class="staff-workspace"><p role="status">Carregando dados administrativos…</p></div>`);wireLogout();
  await loadAdminTools(document.querySelector('#admin-tools'),user);
}

async function loadAdminTools(root,user) {
  const [users,animations,downloads,courses,classes,activities,lessons,teacherLinks]=await Promise.all([
    supabase.from('profiles').select('id,display_name,age_range,education_level,education_detail,teacher_degree_level,teacher_degree_program,teacher_institution,created_at,user_roles(role,status)'),
    supabase.from('animations').select('id,title,topic,slug,summary,level,duration_seconds,video_url,is_published,created_at').order('created_at',{ascending:false}),
    supabase.from('downloads').select('id,title,file_name,visibility,is_published,storage_bucket,storage_path').order('created_at',{ascending:false}),
    supabase.from('courses').select('id,title,description,is_published,created_at').order('created_at',{ascending:false}),
    supabase.from('classrooms').select('id,name,education_level,join_code,is_open,created_at').order('created_at',{ascending:false}),
    supabase.from('activities').select('id,title,subject,description,is_published,approval_status,review_note,points,requires_response,created_at').order('created_at',{ascending:false}),
    supabase.from('lessons').select('id,title,body,course_id,position,video_url,courses(title)').order('position'),
    supabase.from('teacher_classrooms').select('classroom_id,user_id')
  ]);
  const firstError=[users,animations,downloads,courses,classes,activities,lessons,teacherLinks].find((item)=>item.error);
  if(firstError){root.innerHTML=`<aside class="auth-notice" role="alert"><strong>O painel precisa do banco atualizado</strong><p>${safeText(firstError.error.message)}. Confira no tutorial se a migração principal e a atualização de perfis e turmas foram executadas no mesmo projeto Supabase.</p></aside>`;return;}
  const userRoleFor=(item)=>Array.isArray(item.user_roles)?item.user_roles[0]:item.user_roles;
  const userRows=(users.data||[]).map((item)=>{
    const role=userRoleFor(item);
    const pendingTeacher=role?.role==='professor'&&role?.status==='pending';
    const activeTeacher=role?.role==='professor'&&role?.status==='active';
    const action=role?.role==='admin'||item.id===user.id?'':pendingTeacher
      ?`<button data-user-status="${item.id}" data-status="active" data-review-teacher>Aprovar professor</button> <button data-user-status="${item.id}" data-status="blocked" data-review-teacher data-reject-teacher>Recusar professor</button>`
      :role?.status==='blocked'&&role?.role==='professor'?`<button data-user-status="${item.id}" data-status="active" data-review-teacher data-unblock-teacher>Reativar professor</button>`
      :role?.status==='blocked'?`<button data-user-status="${item.id}" data-status="active">Reativar conta</button>`
      :activeTeacher?`<button data-user-status="${item.id}" data-status="blocked" data-review-teacher data-remove-teacher>Retirar professor</button>`
      :`<button data-user-status="${item.id}" data-status="blocked">Bloquear conta</button>`;
    const age=safeText(item.age_range||'Faixa etária não informada');
    const identification=role?.role==='aluno'?`${age} · ${safeText(item.education_level||'Etapa não informada')}${item.education_detail?` · ${safeText(item.education_detail)}`:''}`:role?.role==='professor'?`${age} · ${safeText(item.teacher_degree_level||'Formação não informada')} · ${safeText(item.teacher_degree_program||'Curso não informado')}${item.teacher_institution?` · ${safeText(item.teacher_institution)}`:''}`:age;
    return `<tr><td>${safeText(item.display_name||'Sem nome')}<small class="admin-user-detail">${identification}</small></td><td>${accountLabels[role?.role]||'—'}</td><td>${safeText(role?.status||'—')} ${action}</td><td>${new Date(item.created_at).toLocaleDateString('pt-BR')}</td></tr>`;
  }).join('');
  const animationRows=(animations.data||[]).map((item)=>`<tr><td>${safeText(item.title)}</td><td>${safeText(item.topic)}</td><td>${item.is_published?'Publicado':'Rascunho'}</td><td><button data-edit-animation="${item.id}">Editar</button> <button data-publish-animation="${item.id}" data-published="${item.is_published}">${item.is_published?'Retirar do ar':'Publicar'}</button> <button data-delete-animation="${item.id}">Excluir</button></td></tr>`).join('');
  const downloadRows=(downloads.data||[]).map((item)=>`<tr><td>${safeText(item.title)}</td><td>${safeText(item.file_name)}</td><td>${safeText(item.visibility)}</td><td>${item.is_published?'Publicado':'Rascunho'} <button data-publish-download="${item.id}" data-published="${item.is_published}">${item.is_published?'Retirar':'Publicar'}</button> <button data-delete-download="${item.id}">Excluir</button></td></tr>`).join('');
  const courseRows=(courses.data||[]).map((item)=>`<tr><td>${safeText(item.title)}</td><td>${item.is_published?'Publicado':'Rascunho'}</td><td><button data-edit-course="${item.id}">Editar</button> <button data-publish-course="${item.id}" data-published="${item.is_published}">${item.is_published?'Retirar do ar':'Publicar'}</button> <button data-delete-course="${item.id}">Excluir curso</button></td></tr>`).join('');
  const animationOptions=(animations.data||[]).map((item)=>`<option value="${item.id}">${safeText(item.title)}</option>`).join('');
  const lessonOptions=(courses.data||[]).map((item)=>`<option value="${item.id}">${safeText(item.title)}</option>`).join('');
  const lessonRows=(lessons.data||[]).map((item)=>`<li><b>${safeText(item.courses?.title||'Curso')}</b> · ${safeText(item.title)} <button data-edit-lesson="${item.id}">Editar</button> <button data-delete-lesson="${item.id}">Excluir</button></li>`).join('')||'<li>Nenhuma aula cadastrada.</li>';
  const teacherName=(id)=>{const profile=(users.data||[]).find((entry)=>entry.id===id);return profile?.display_name||'Professor';};
  const classRows=(classes.data||[]).map((item)=>{const assigned=(teacherLinks.data||[]).filter((entry)=>entry.classroom_id===item.id).map((entry)=>teacherName(entry.user_id));return `<li><b>${safeText(item.name)}</b> <span>${safeText(item.education_level||'Etapa não informada')} · ${item.is_open?'Aberta':'Fechada'} · código ${safeText(item.join_code)}${assigned.length?` · Professor(es): ${safeText(assigned.join(', '))}`:''}</span><button data-toggle-class="${item.id}" data-open="${item.is_open}">${item.is_open?'Fechar':'Reabrir'}</button> <button data-delete-class="${item.id}">Excluir</button></li>`;}).join('')||'<li>Nenhuma turma cadastrada.</li>';
  const activityRows=(activities.data||[]).map((item)=>`<li><b>${safeText(item.title)}</b> · ${safeText(item.subject)} · ${safeText(item.approval_status||'approved')} · ${item.is_published?'Publicada':'Rascunho'} <button data-edit-activity="${item.id}">Editar</button> <button data-duplicate-activity="${item.id}">Duplicar</button> <button data-toggle-activity="${item.id}" data-published="${item.is_published}">${item.is_published?'Retirar':'Publicar'}</button> <button data-delete-activity="${item.id}">Excluir</button></li>`).join('')||'<li>Nenhuma atividade cadastrada.</li>';
  const activityOptions=(activities.data||[]).map((item)=>`<option value="${item.id}">${safeText(item.title)}</option>`).join('');
  const classOptions=(classes.data||[]).map((item)=>`<option value="${item.id}">${safeText(item.name)}</option>`).join('');
  const activeTeacherOptions=(users.data||[]).filter((item)=>{const role=userRoleFor(item);return role?.role==='professor'&&role.status==='active';}).map((item)=>`<option value="${item.id}">${safeText(item.display_name||'Professor')} · ${safeText(item.teacher_degree_program||'Formação não informada')}</option>`).join('');
  root.innerHTML=`<div class="dashboard-cards"><article><b>${users.data.length}</b><span>perfis cadastrados</span></article><article><b>${animations.data.length}</b><span>animações no banco</span></article><article><b>${classes.data.length}</b><span>turmas</span></article><article><b>${downloads.data.length}</b><span>downloads</span></article></div><section class="account-section"><div class="section-kicker">USUÁRIOS</div><h2>Gerenciar contas e aprovação docente</h2><div class="table-scroll"><table class="admin-table"><thead><tr><th>Perfil e identificação</th><th>Tipo</th><th>Status</th><th>Cadastro</th></tr></thead><tbody>${userRows}</tbody></table></div><p class="privacy-note">O painel não lê nem altera senhas ou e-mails de autenticação. Novos administradores são configurados no Supabase SQL Editor pelo proprietário.</p></section><section class="account-section"><div class="section-kicker">ANIMAÇÕES</div><h2>Adicionar conteúdo científico</h2><form id="admin-animation-form" class="admin-form"><label>Título<input name="title" required maxlength="160"></label><label>Assunto<input name="topic" required maxlength="100"></label><label>Slug único<input name="slug" required maxlength="180"></label><label>Nível<input name="level" maxlength="60" value="Ensino médio"></label><label>Duração em segundos<input name="duration" type="number" min="0" max="86400"></label><label>Vídeo MP4 ou YouTube URL<input name="video" type="url" placeholder="https://…"></label><label class="wide-field">Descrição<textarea name="summary" rows="3" maxlength="3000" required></textarea></label><label class="consent-check wide-field"><input name="published" type="checkbox"><span>Publicar agora</span></label><button class="button button-primary" type="submit">Salvar animação</button><button class="button button-outline" type="button" data-animation-cancel hidden>Cancelar edição</button><p class="auth-message wide-field" role="status"></p></form><div class="table-scroll"><table class="admin-table"><thead><tr><th>Animação</th><th>Tópico</th><th>Estado</th><th>Ações</th></tr></thead><tbody>${animationRows||'<tr><td colspan="4">Nenhuma animação cadastrada.</td></tr>'}</tbody></table></div></section><section class="account-section"><div class="section-kicker">DOWNLOADS PRIVADOS</div><h2>Enviar material para o Storage privado</h2><form id="admin-download-form" class="admin-form"><label>Nome do material<input name="title" required maxlength="160"></label><label>Vincular a animação<select name="animation"><option value="">Material geral</option>${animationOptions}</select></label><label>Arquivo<input name="file" type="file" required></label><label>Visibilidade<select name="visibility"><option value="students">Alunos e professores</option><option value="teachers">Somente professores aprovados</option></select></label><label>Descrição<input name="description" maxlength="500"></label><button class="button button-primary" type="submit">Enviar para downloads privados</button><p class="auth-message wide-field" role="status"></p></form><div class="table-scroll"><table class="admin-table"><thead><tr><th>Material</th><th>Arquivo</th><th>Acesso</th><th>Estado</th></tr></thead><tbody>${downloadRows||'<tr><td colspan="4">Nenhum arquivo privado cadastrado.</td></tr>'}</tbody></table></div></section><section class="account-section"><div class="section-kicker">CURSOS BLENDER</div><h2>Publicar um curso</h2><form id="admin-course-form" class="admin-form"><label>Título<input name="title" required maxlength="160"></label><label>Descrição<textarea name="description" rows="2" maxlength="1500"></textarea></label><label class="consent-check"><input name="published" type="checkbox"><span>Publicar</span></label><button class="button button-outline" type="submit">Criar curso</button><button class="button button-outline" type="button" data-course-cancel hidden>Cancelar edição</button><p class="auth-message wide-field" role="status"></p></form><div class="table-scroll"><table class="admin-table"><thead><tr><th>Curso</th><th>Estado</th><th>Ações</th></tr></thead><tbody>${courseRows||'<tr><td colspan="3">Nenhum curso publicado.</td></tr>'}</tbody></table></div></section><section class="account-section"><div class="section-kicker">AULAS BLENDER</div><h2>Organizar as aulas dos cursos</h2><form id="admin-lesson-form" class="admin-form"><label>Curso<select name="course_id" required>${lessonOptions}</select></label><label>Título<input name="title" required maxlength="160"></label><label>Posição<input name="position" type="number" min="0" value="0"></label><label>URL do vídeo<input name="video_url" type="url" placeholder="https://"/></label><label class="wide-field">Conteúdo da aula<textarea name="body" rows="5"></textarea></label><button class="button button-outline" type="submit">Salvar aula</button><button class="button button-outline" type="button" data-lesson-cancel hidden>Cancelar edição</button><p role="status"></p></form><ul class="private-list">${lessonRows}</ul></section><section class="account-section"><div class="section-kicker">TURMAS E ATIVIDADES</div><h2>Visão administrativa</h2><p>Turmas: ${classes.data.length} · Atividades: ${activities.data.length}.</p><div class="staff-grid"><section class="auth-card"><h3>Turmas</h3><form id="admin-class-form" class="auth-form"><label>Nome da turma<input name="name" required maxlength="100"></label><label>Etapa de ensino<select name="education_level" required>${stageOptions()}</select></label><label>Descrição<input name="description" maxlength="1000"></label><button class="button button-outline" type="submit">Criar turma</button><p role="status"></p></form><ul class="private-list">${classRows}</ul></section><section class="auth-card"><h3>Vincular professor à turma</h3><form id="admin-teacher-class-form" class="auth-form"><label>Professor aprovado<select name="teacher" required><option value="">Selecione</option>${activeTeacherOptions}</select></label><label>Turma<select name="classroom" required><option value="">Selecione</option>${classOptions}</select></label><button class="button button-outline" type="submit">Vincular</button><p role="status"></p></form><small>Somente professores aprovados aparecem nesta lista.</small></section><section class="auth-card"><h3>Atividades</h3><form id="admin-activity-form" class="auth-form"><label>Título<input name="title" required maxlength="160"></label><label>Assunto<input name="subject" maxlength="100"></label><label>Instruções<textarea name="description" rows="3" maxlength="5000"></textarea></label><button class="button button-outline" type="submit">Criar atividade</button><p role="status"></p></form><ul class="private-list">${activityRows}</ul></section><section class="auth-card"><h3>Compartilhar atividade</h3><form id="admin-assign-form" class="auth-form"><label>Atividade<select name="activity" required>${activityOptions}</select></label><label>Turma<select name="classroom" required>${classOptions}</select></label><button class="button button-outline" type="submit">Compartilhar</button><p role="status"></p></form></section></div><a href="/professores.html">Abrir materiais pedagógicos →</a></section>`;
  root.querySelectorAll('[data-user-status]').forEach((button)=>button.addEventListener('click',async()=>{const status=button.dataset.status;const rejecting=button.hasAttribute('data-reject-teacher');const removingTeacher=button.hasAttribute('data-remove-teacher');const reviewing=button.hasAttribute('data-review-teacher');const prompt=rejecting?'Recusar a inscrição deste professor? A conta ficará sem acesso às áreas protegidas.':removingTeacher?'Retirar o acesso docente? A conta será bloqueada, mas o perfil e os dados serão mantidos.':'Bloquear esta conta? O usuário perderá o acesso às áreas protegidas.';if(status==='blocked'&&!confirm(prompt))return;button.disabled=true;let update=supabase.from('user_roles').update({status}).eq('user_id',button.dataset.userStatus);if(reviewing)update=update.eq('role','professor').eq('status','pending');else if(removingTeacher)update=update.eq('role','professor').eq('status','active');else update=update.neq('role','admin');const {data,error}=await update.select('user_id,status').maybeSingle();if(error||!data){button.disabled=false;button.textContent='Falha';button.title=error?.message||'A conta não está mais no status esperado. Atualize o painel.';alert(error?`Não foi possível atualizar a conta: ${error.message}`:'A conta não está mais no status esperado. Atualize o painel.');return;}await loadAdminTools(root,user);}));
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
  root.querySelector('#admin-class-form')?.addEventListener('submit',async(event)=>{event.preventDefault();const f=event.currentTarget;const values=new FormData(f);const status=f.querySelector('[role=status]');const {error}=await supabase.from('classrooms').insert({name:String(values.get('name')).trim(),description:String(values.get('description')||'').trim(),education_level:String(values.get('education_level')),created_by:user.id});setStatus(status,error?`Não foi possível criar a turma: ${error.message}`:'Turma criada.',Boolean(error));if(!error)await loadAdminTools(root,user);});
  root.querySelector('#admin-teacher-class-form')?.addEventListener('submit',async(event)=>{event.preventDefault();const f=event.currentTarget;const values=new FormData(f);const status=f.querySelector('[role=status]');const {error}=await supabase.from('teacher_classrooms').upsert({classroom_id:String(values.get('classroom')),user_id:String(values.get('teacher'))},{onConflict:'classroom_id,user_id'});setStatus(status,error?`Não foi possível vincular: ${error.message}`:'Professor vinculado à turma.',Boolean(error));if(!error)await loadAdminTools(root,user);});
  root.querySelectorAll('[data-toggle-class]').forEach((button)=>button.addEventListener('click',async()=>{const {error}=await supabase.from('classrooms').update({is_open:button.dataset.open!=='true'}).eq('id',button.dataset.toggleClass);if(error)button.textContent='Falha';else await loadAdminTools(root,user);}));
  root.querySelectorAll('[data-delete-class]').forEach((button)=>button.addEventListener('click',async()=>{if(!confirm('Excluir a turma, matrículas e atividades relacionadas?'))return;const {error}=await supabase.from('classrooms').delete().eq('id',button.dataset.deleteClass);if(error)button.textContent='Falha';else await loadAdminTools(root,user);}));
  const activityForm=root.querySelector('#admin-activity-form');
  activityForm?.querySelector('button:not([type])')?.setAttribute('type','submit');
  activityForm?.insertAdjacentHTML('beforeend',`<label>Animação relacionada<select name="animation"><option value="">Nenhuma</option>${animationOptions}</select></label><label>Valor em pontos<input name="points" type="number" min="0" max="100000" value="0"></label><label class="consent-check"><input name="published" type="checkbox" checked><span>Publicar atividade</span></label><button class="button button-outline" type="button" data-activity-cancel hidden>Cancelar edição</button>`);
  activityForm?.addEventListener('submit',async(event)=>{event.preventDefault();const f=event.currentTarget;const v=new FormData(f);const status=f.querySelector('[role=status]');const values={title:String(v.get('title')).trim(),subject:String(v.get('subject')||'').trim(),description:String(v.get('description')||'').trim(),animation_id:String(v.get('animation')||'')||null,points:Number(v.get('points')||0),is_published:v.has('published'),approval_status:'approved',published_at:v.has('published')?new Date().toISOString():null};const {error}=f.dataset.activityId?await supabase.from('activities').update(values).eq('id',f.dataset.activityId):await supabase.from('activities').insert({...values,created_by:user.id});setStatus(status,error?`Não foi possível salvar a atividade: ${error.message}`:'Atividade salva.',Boolean(error));if(!error)await loadAdminTools(root,user);});
  activityForm?.querySelector('[data-activity-cancel]')?.addEventListener('click',()=>loadAdminTools(root,user));
  root.querySelectorAll('[data-edit-activity]').forEach((button)=>button.addEventListener('click',()=>{const item=activities.data.find((entry)=>entry.id===button.dataset.editActivity);if(!item||!activityForm)return;activityForm.dataset.activityId=item.id;activityForm.elements.namedItem('title').value=item.title;activityForm.elements.namedItem('subject').value=item.subject||'';activityForm.elements.namedItem('description').value=item.description||'';activityForm.elements.namedItem('animation').value=item.animation_id||'';activityForm.elements.namedItem('points').value=item.points||0;activityForm.elements.namedItem('published').checked=item.is_published;activityForm.querySelector('[type=submit]').textContent='Salvar alterações';activityForm.querySelector('[data-activity-cancel]').hidden=false;activityForm.scrollIntoView({behavior:'smooth',block:'center'});}));
  root.querySelectorAll('[data-duplicate-activity]').forEach((button)=>button.addEventListener('click',async()=>{const item=activities.data.find((entry)=>entry.id===button.dataset.duplicateActivity);if(!item)return;const {error}=await supabase.from('activities').insert({title:`${item.title} (cópia)`,subject:item.subject,description:item.description,animation_id:item.animation_id,points:item.points,requires_response:item.requires_response,is_published:false,approval_status:'draft',created_by:user.id});if(error)button.title=error.message;else await loadAdminTools(root,user);}));
  root.querySelectorAll('[data-toggle-activity]').forEach((button)=>button.addEventListener('click',async()=>{const publish=button.dataset.published!=='true';const {error}=await supabase.from('activities').update({is_published:publish,approval_status:publish?'approved':activities.data.find((item)=>item.id===button.dataset.toggleActivity)?.approval_status,published_at:publish?new Date().toISOString():null}).eq('id',button.dataset.toggleActivity);if(error)button.textContent='Falha';else await loadAdminTools(root,user);}));
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
  const textAlternative=document.createElement('details');textAlternative.className='animation-text-alternative';const alternativeTitle=document.createElement('summary');alternativeTitle.textContent='Descrição textual da animação';const alternativeText=document.createElement('p');alternativeText.textContent=`A animação ${data.title} aborda ${data.topic}. ${data.summary} Esta descrição acompanha a representação esquemática e deve ser lida junto com a explicação científica.`;textAlternative.append(alternativeTitle,alternativeText);const filesSection=detail.querySelector('.account-section');if(filesSection)detail.insertBefore(textAlternative,filesSection);
  detail.querySelectorAll('[data-private-download]').forEach((button)=>button.addEventListener('click',()=>downloadPrivate(button)));
  document.title=`${data.title} - Diário dos BNs`;
}

async function attachAuthNavigation() {
  const nav=document.querySelector('.site-header .nav');if(!nav)return;
  let links=nav.querySelector('[data-account-links]');
  if(!links){
    const oldItems=[...nav.querySelectorAll('.nav-account,[data-area-menu]')];
    links=document.createElement('div');links.className='nav-account nav-account-links';links.dataset.accountLinks='true';
    links.innerHTML='<a data-account-link data-area-profile href="/perfil/">Perfil</a><a data-account-link data-area-dashboard hidden></a><a data-account-link data-area-login href="/login/">Entrar</a><a data-account-link data-area-signup href="/cadastro/">Criar conta</a><button class="nav-signout" type="button" data-logout hidden>Sair</button>';
    if(oldItems.length){oldItems[0].replaceWith(links);oldItems.slice(1).forEach((item)=>item.remove());}
    else nav.append(links);
  }
  const profile=links.querySelector('[data-area-profile]');
  const dashboard=links.querySelector('[data-area-dashboard]');
  const login=links.querySelector('[data-area-login]');
  const signup=links.querySelector('[data-area-signup]');
  const logout=links.querySelector('[data-logout]');
  profile.href='/perfil/';login.href='/login/';signup.href='/cadastro/';
  const setAccountMenu=(user,role)=>{
    login.hidden=Boolean(user);
    signup.hidden=Boolean(user);
    logout.hidden=!user;
    dashboard.hidden=!user||!role||role.status==='blocked';
    if(user&&role){dashboard.href=destination(role)+'/';dashboard.textContent='Painel de '+(accountLabels[role.role]||'conta').toLocaleLowerCase('pt-BR');}
  };
  setAccountMenu(null,null);
  document.documentElement.classList.add('auth-nav-ready');
  if(!nav.dataset.accountLinksBound){
    nav.dataset.accountLinksBound='true';
    nav.addEventListener('click',(event)=>{
      if(!(event.target instanceof Element)||!event.target.closest('[data-account-link],[data-logout]'))return;
      nav.classList.remove('is-open');document.querySelector('.menu-toggle')?.setAttribute('aria-expanded','false');
    });
  }
  await supabasePromise;
  if(!supabase)return;
  try {
    const {data,error}=await supabase.auth.getSession();if(error)throw error;
    if(data.session){
      const role=await getRole(data.session.user).catch(()=>null);
      setAccountMenu(data.session.user,role);
      wireLogout();
    }
  } catch {} finally { document.documentElement.classList.add('auth-nav-ready'); }
}

function youtubeLiveMarkup(raw,title='Transmissão ao vivo do Diário dos BNs') {
  if(!raw)return '';
  try {
    const url=new URL(raw);
    if(url.protocol!=='https:'||!(url.hostname==='youtu.be'||url.hostname==='youtube.com'||url.hostname.endsWith('.youtube.com')||url.hostname==='youtube-nocookie.com'||url.hostname.endsWith('.youtube-nocookie.com')))return '';
    const parts=url.pathname.split('/').filter(Boolean);
    const id=url.hostname==='youtu.be'?parts[0]:url.searchParams.get('v')||parts.at(-1);
    if(!/^[A-Za-z0-9_-]{6,20}$/.test(id||''))return '';
    return `<iframe class="youtube-embed" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}" title="${safeText(title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
  } catch { return ''; }
}

async function renderClassroomHub() {
  document.title='Turmas e atividades — Diário dos BNs';
  replaceMain('Turmas e atividades',`<section class="classroom-hub-hero section-wrap"><div class="section-kicker">APRENDER EM GRUPO</div><h1>Turmas, atividades <span>e encontros.</span></h1><p>Veja suas turmas, acompanhe as atividades compartilhadas e assista às transmissões do projeto em um só lugar.</p><a class="button button-primary" href="#minhas-turmas">Ver minhas turmas <span aria-hidden="true">↓</span></a></section><section class="classroom-hub-section section-wrap" id="minhas-turmas"><div class="section-heading"><div><div class="section-kicker">ESPAÇO DE APRENDIZAGEM</div><h2>Minhas <span>turmas</span></h2></div><p>Os dados da turma aparecem apenas para quem tem acesso àquela turma.</p></div><div id="classroom-hub-list" class="db-grid" aria-live="polite"><p role="status">Carregando suas turmas…</p></div></section><section class="classroom-hub-section section-wrap"><div class="section-heading"><div><div class="section-kicker">ACOMPANHAMENTO</div><h2>Atividades <span>compartilhadas</span></h2></div><p>As atividades são exibidas conforme as permissões e sua participação nas turmas.</p></div><div id="classroom-hub-activities" class="db-grid" aria-live="polite"><p role="status">Carregando atividades…</p></div></section><section class="live-class-section section-wrap" aria-labelledby="live-class-title"><div class="section-heading"><div><div class="section-kicker">ENCONTROS AO VIVO</div><h2 id="live-class-title">Aula ao <span>vivo</span></h2></div><p>Quando houver transmissão, você poderá assistir sem sair do Diário dos BNs.</p></div><div id="live-class-player" class="live-class-player"></div></section>`);
  const classesRoot=document.querySelector('#classroom-hub-list');
  const activitiesRoot=document.querySelector('#classroom-hub-activities');
  const player=document.querySelector('#live-class-player');
  const liveMarkup=youtubeLiveMarkup(YOUTUBE_LIVE_URL);
  player.innerHTML=liveMarkup||`<div class="live-class-empty"><span aria-hidden="true">◉</span><h3>Espaço reservado para a transmissão</h3><p>Para exibir uma live para todos, cole o link público do YouTube na constante <code>YOUTUBE_LIVE_URL</code> no arquivo <code>src-app.js</code>. Use um endereço como <code>https://www.youtube.com/watch?v=ID_DO_VIDEO</code>.</p><form id="live-class-preview-form" class="live-class-preview-form"><label for="live-class-preview-url">Pré-visualizar um link do YouTube</label><div><input id="live-class-preview-url" name="url" type="url" inputmode="url" placeholder="https://www.youtube.com/watch?v=…" required><button class="button button-outline" type="submit">Carregar vídeo</button></div><p class="form-help" role="status" aria-live="polite">A pré-visualização vale para esta visita. Para publicar a transmissão no site, configure o link no arquivo indicado acima.</p></form></div>`;
  document.querySelector('#live-class-preview-form')?.addEventListener('submit',(event)=>{event.preventDefault();const form=event.currentTarget;const note=form.querySelector('[role="status"]');const markup=youtubeLiveMarkup(form.elements.url.value.trim());if(!markup){setStatus(note,'Cole um link público válido de vídeo ou transmissão do YouTube.',true);return;}player.innerHTML=markup;player.scrollIntoView({behavior:'smooth',block:'center'});});
  if(!supabaseReady){classesRoot.innerHTML=configureNotice;activitiesRoot.innerHTML='<p>As atividades aparecem depois que o Supabase estiver configurado.</p>';return;}
  try {
    const user=await getSignedUser();
    if(!user){classesRoot.innerHTML='<aside class="auth-notice"><strong>Entre na sua conta para ver suas turmas</strong><p>Os nomes das turmas e suas atividades são privados. Faça login para consultar o conteúdo ao qual você tem acesso.</p><a class="button button-primary" href="/login/">Entrar na conta</a> <a class="text-link" href="/cadastro/">Criar conta</a></aside>';activitiesRoot.innerHTML='<p>Depois de entrar, as atividades das suas turmas aparecem aqui.</p>';return;}
    const role=await getRole(user);
    if(!role||role.status==='blocked'){classesRoot.innerHTML='<p role="alert">Não foi possível validar o perfil desta conta. Atualize a página ou procure o responsável pelo site.</p>';activitiesRoot.replaceChildren();return;}
    if(role.role==='professor'&&role.status!=='active'){classesRoot.innerHTML='<aside class="auth-notice"><strong>Cadastro de professor em análise</strong><p>As turmas e ferramentas docentes ficam disponíveis após a aprovação da conta.</p></aside>';activitiesRoot.replaceChildren();return;}
    let classQuery;
    if(role.role==='aluno') classQuery=supabase.from('student_classrooms').select('classroom_id,joined_at,classrooms(id,name,description,discipline,grade_level,status)').eq('user_id',user.id).order('joined_at',{ascending:false});
    else if(role.role==='professor') classQuery=supabase.from('teacher_classrooms').select('classroom_id,classrooms(id,name,description,discipline,grade_level,status)').eq('user_id',user.id);
    else classQuery=supabase.from('classrooms').select('id,name,description,discipline,grade_level,status,created_at').order('created_at',{ascending:false});
    const [classResult,activityResult]=await Promise.all([classQuery,supabase.from('classroom_activities').select('classroom_id,activity_id,due_at,activities(id,title,subject,description,is_published,approval_status),classrooms(name)').order('created_at',{ascending:false})]);
    if(classResult.error){classesRoot.innerHTML=`<aside class="auth-notice" role="alert"><strong>Não foi possível carregar as turmas</strong><p>${safeText(classResult.error.message)}. Confira as migrações e as permissões do Supabase.</p></aside>`;}
    else {
      const rows=classResult.data||[];
      const cards=rows.map((row)=>{const classroom=row.classrooms||row;const id=classroom.id||row.classroom_id;return `<article class="db-card classroom-hub-card"><span class="lesson-tag">${safeText(classroom.discipline||classroom.grade_level||'Turma')}</span><h3>${safeText(classroom.name||'Turma')}</h3><p>${safeText(classroom.description||'Acesse os conteúdos, comunicados e atividades desta turma.')}</p><a class="button button-outline" href="turma.html?id=${encodeURIComponent(id)}">Acessar turma <span aria-hidden="true">→</span></a></article>`;}).join('');
      const empty=role.role==='aluno'?'<p>Você ainda não entrou em uma turma. Abra sua área do aluno e use o código recebido do professor.</p><a class="text-link" href="/aluno/">Ir para minha área de estudos →</a>':role.role==='professor'?'<p>Nenhuma turma está vinculada ao seu perfil. Peça ao administrador para criar ou vincular uma turma.</p>':'<p>Não há turmas cadastradas. Você pode criar e organizar turmas no painel administrativo.</p><a class="text-link" href="/admin/">Abrir painel administrativo →</a>';
      classesRoot.innerHTML=cards||empty;
    }
    if(activityResult.error) activitiesRoot.innerHTML=`<aside class="auth-notice" role="alert"><strong>Não foi possível carregar as atividades</strong><p>${safeText(activityResult.error.message)}</p></aside>`;
    else {
      const assignments=(activityResult.data||[]).filter((item)=>item.activities);
      const cards=assignments.map((item)=>{const activity=item.activities;const deadline=item.due_at?new Date(item.due_at).toLocaleString('pt-BR',{dateStyle:'medium',timeStyle:'short'}):'Sem prazo informado';return `<article class="db-card"><span class="lesson-tag">${safeText(item.classrooms?.name||'Turma')} · ${safeText(activity.subject||'Atividade')}</span><h3>${safeText(activity.title||'Atividade')}</h3><p>${safeText(activity.description||'Acesse a página da turma para ver as instruções e responder.')}</p><p class="form-help">Prazo: ${safeText(deadline)}</p><a class="text-link" href="turma.html?id=${encodeURIComponent(item.classroom_id)}">Abrir turma e atividade →</a></article>`;}).join('');
      activitiesRoot.innerHTML=cards||'<p>Nenhuma atividade foi compartilhada com as turmas vinculadas a esta conta.</p>';
    }
  } catch(error) {
    classesRoot.innerHTML=`<aside class="auth-notice" role="alert"><strong>Não foi possível consultar as turmas</strong><p>${safeText(error?.message||'Confira sua conexão e tente novamente.')}</p></aside>`;
    activitiesRoot.replaceChildren();
  }
}

async function syncLegacyFavorite(event) {
  const button=event.target.closest('[data-favorite-topic]');
  if(!button)return;
  try{
    await supabasePromise;
    if(!supabase)return;
    const {data}=await supabase.auth.getSession();if(!data.session)return;
    const role=await getRole(data.session.user).catch(()=>null);if(!role||role.status!=='active')return;
    const slug=`${button.dataset.favoriteTopic}--${button.dataset.favoriteFile}`;
    const {data:animation}=await supabase.from('animations').select('id').eq('slug',slug).maybeSingle();if(!animation)return;
    const {error}=button.getAttribute('aria-pressed')==='true'
      ? await supabase.from('favorites').insert({user_id:data.session.user.id,animation_id:animation.id})
      : await supabase.from('favorites').delete().eq('user_id',data.session.user.id).eq('animation_id',animation.id);
    if(error)button.title='Não foi possível atualizar a lista na conta.';
  }catch{button.title='Não foi possível sincronizar a favorita com sua conta agora.';}
}

document.querySelector('#print-resource')?.addEventListener('click',()=>window.print());

supabasePromise.then((client)=>{if(client&&document.querySelector('#animation-detail'))hydrateAnimationDetails().catch(()=>{});});
import('./features.js?v=conta-solta-20261005-3').catch(()=>{});

if (main) {
  attachAuthNavigation();
  document.addEventListener('click',syncLegacyFavorite);
  const recoveryIsUpdating=route==='/recuperar-senha'&&new URLSearchParams(location.search).get('mode')==='update';
  const isAuthEntry=['/login','/cadastro'].includes(route)||(route==='/recuperar-senha'&&!recoveryIsUpdating);
  const renderAuthEntry=()=>{if(route==='/login')renderLogin();else if(route==='/cadastro')renderSignup();else renderRecovery();};
  if (isAuthEntry) renderAuthEntry();
  else if (route==='/recuperar-senha') renderRecovery();
  else if (route==='/auth/callback') renderCallback();
  else if (route==='/turmas') renderClassroomHub();
  else if (protectedRoutes.includes(route)) protectRoute();
}
