import { supabasePromise } from './src-supabase.js';

const mascotImageSrc = 'assets/mascote-ia-fisica.png?v=bnzinho-art-20261013-1';
const webLlmModuleUrl = 'https://esm.run/@mlc-ai/web-llm@0.2.85';
const localModelId = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';
const localSystemPrompt = [
  'Você é o BNzinho, assistente virtual do Diário dos BNs. Ajude com perguntas de qualquer assunto, não somente Física ou sobre o site.',
  'Seja conversacional, gentil, direto e útil. Responda no idioma da pessoa, usando português do Brasil por padrão. Siga o pedido de formato e detalhe; não se apresente de novo em toda mensagem.',
  'Use o histórico para continuar naturalmente a conversa. Se o pedido estiver claro, responda sem perguntas desnecessárias. Se faltar uma informação essencial, pergunte somente o que falta.',
  'Em Física, matemática e ciências, confira os cálculos, explique unidades e deixe hipóteses claras. Não invente fatos atuais, fontes, medições nem informações que não recebeu; diga quando houver incerteza.',
  'Responda com segurança: não ajude a causar dano nem a expor credenciais ou dados pessoais. Para pedidos perigosos, explique brevemente e ofereça uma alternativa segura.'
].join('\n');

const loginGate = document.querySelector('#physics-ai-login-gate');
const statusBox = document.querySelector('#physics-ai-status');
const historyList = document.querySelector('#physics-ai-conversation-list');
const messagesBox = document.querySelector('#physics-ai-messages');
const form = document.querySelector('#physics-ai-form');
const input = document.querySelector('#physics-ai-input');
const sendButton = document.querySelector('#physics-ai-send');
const newChatButton = document.querySelector('#physics-ai-new-chat');
const accountLink = document.querySelector('#physics-ai-account-link');
const suggestionButtons = [...document.querySelectorAll('[data-physics-ai-prompt]')];

let supabase = null;
let user = null;
let activeConversationId = null;
let activeConversationLocal = true;
let conversations = [];
let messages = [];
let databaseReady = false;
let remoteHistoryReady = false;
let busy = false;
let localEngine = null;
let localEnginePromise = null;

function showStatus(message = '', isError = false) {
  statusBox.textContent = message;
  statusBox.classList.toggle('is-error', isError);
  statusBox.hidden = !message;
}

function localStorageKey() {
  return user ? 'diario-physics-ai:v1:' + user.id : null;
}

function readLocalConversations() {
  const key = localStorageKey();
  if (!key) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.id === 'string')
      .slice(0, 30)
      .map((item) => ({
        id: item.id,
        title: String(item.title || 'Conversa sem título').slice(0, 120),
        updated_at: item.updated_at || item.created_at || '',
        _local: true,
        messages: Array.isArray(item.messages) ? item.messages
          .filter((message) => message && ['user', 'assistant'].includes(message.role) && typeof message.content === 'string')
          .slice(-100)
          .map((message) => ({ role: message.role, content: message.content.slice(0, 5000), created_at: message.created_at || null })) : []
      }));
  } catch {
    return [];
  }
}

function saveLocalSnapshot() {
  const key = localStorageKey();
  if (!key || !activeConversationId) return;
  try {
    const cached = readLocalConversations().filter((item) => item.id !== activeConversationId);
    const existing = conversations.find((item) => item.id === activeConversationId);
    const firstQuestion = messages.find((item) => item.role === 'user')?.content || '';
    const current = {
      id: activeConversationId,
      title: existing?.title || firstQuestion.replace(/\s+/g, ' ').trim().slice(0, 72) || 'Nova conversa',
      updated_at: new Date().toISOString(),
      messages: messages.slice(-100),
      _local: true
    };
    localStorage.setItem(key, JSON.stringify([current, ...cached].slice(0, 30)));
  } catch {
    showStatus('O navegador não conseguiu guardar este histórico neste dispositivo.', true);
  }
}

function updateControls() {
  const enabled = Boolean(user && databaseReady && !busy);
  input.disabled = !enabled;
  newChatButton.disabled = !enabled;
  sendButton.disabled = !enabled || !input.value.trim();
  sendButton.textContent = busy ? 'Respondendo…' : 'Enviar';
  for (const button of suggestionButtons) button.disabled = !enabled;
}

function setSignedIn(nextUser) {
  const next = nextUser || null;
  const changed = next?.id !== user?.id;
  user = next;
  loginGate.hidden = Boolean(user);
  accountLink.textContent = user ? 'Minha conta' : 'Entrar';
  accountLink.href = user ? 'perfil.html' : 'login.html?next=ia';
  if (!user) {
    databaseReady = false;
    remoteHistoryReady = false;
    activeConversationId = null;
    activeConversationLocal = true;
    conversations = [];
    messages = [];
    renderConversationList();
    renderMessages();
  } else if (changed) {
    databaseReady = true;
    remoteHistoryReady = false;
    activeConversationId = null;
    activeConversationLocal = true;
    conversations = readLocalConversations();
    messages = [];
    renderConversationList();
    renderMessages();
  }
  updateControls();
}

function renderConversationList() {
  historyList.replaceChildren();
  if (!user) {
    const empty = document.createElement('p');
    empty.className = 'physics-ai-history-empty';
    empty.textContent = 'Entre na sua conta para ver suas conversas salvas.';
    historyList.append(empty);
    return;
  }
  if (!conversations.length) {
    const empty = document.createElement('p');
    empty.className = 'physics-ai-history-empty';
    empty.textContent = 'Suas conversas aparecerão aqui.';
    historyList.append(empty);
    return;
  }
  for (const conversation of conversations) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'physics-ai-conversation';
    button.textContent = conversation.title || 'Conversa sem título';
    button.setAttribute('aria-current', String(conversation.id === activeConversationId));
    button.addEventListener('click', () => void openConversation(conversation.id));
    historyList.append(button);
  }
}

function addMessage(role, content, createdAt = null, animate = false) {
  const article = document.createElement('article');
  article.className = 'physics-ai-message ' + (role === 'assistant' ? 'is-assistant' : 'is-user');
  if (animate) article.classList.add('is-message-entering');
  if (role === 'assistant') {
    const avatar = document.createElement('img');
    avatar.className = 'physics-ai-message-avatar';
    avatar.src = mascotImageSrc;
    avatar.alt = '';
    avatar.setAttribute('aria-hidden', 'true');
    article.append(avatar);
  }

  const body = document.createElement('div');
  body.className = 'physics-ai-message-body';
  const author = document.createElement('strong');
  author.textContent = role === 'assistant' ? 'BNzinho' : 'Você';
  const text = document.createElement('p');
  text.textContent = content;
  body.append(author, text);
  if (createdAt) {
    const time = document.createElement('time');
    const date = new Date(createdAt);
    if (!Number.isNaN(date.valueOf())) {
      time.dateTime = date.toISOString();
      time.textContent = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      body.append(time);
    }
  }
  article.append(body);
  messagesBox.append(article);
  return article;
}

function renderMessages(animateLatest = false) {
  messagesBox.replaceChildren();
  if (!messages.length) {
    const welcome = document.createElement('div');
    welcome.className = 'physics-ai-welcome';
    const mascot = document.createElement('img');
    mascot.src = mascotImageSrc;
    mascot.alt = '';
    mascot.setAttribute('aria-hidden', 'true');
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = 'Oi! Eu sou o BNzinho.';
    const description = document.createElement('p');
    description.textContent = 'Pode me perguntar sobre qualquer assunto ou pedir ajuda para criar, entender, revisar ou resolver algo. O que você precisa?';
    copy.append(title, description);
    welcome.append(mascot, copy);
    messagesBox.append(welcome);
  } else {
    messages.forEach((message, index) => {
      addMessage(message.role, message.content, message.created_at,
        animateLatest && index >= Math.max(0, messages.length - 2));
    });
  }
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

function renderConversations() {
  renderConversationList();
  updateControls();
}

function withTimeout(promise, milliseconds, message) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), milliseconds); })
  ]).finally(() => clearTimeout(timer));
}

async function refreshConversations(selectLatest = true) {
  if (!user) return false;
  const cached = readLocalConversations();
  try {
    const result = await withTimeout(
      supabase.from('physics_ai_conversations').select('id,title,updated_at').order('updated_at', { ascending: false }).limit(30),
      8000,
      'O histórico online demorou para responder.'
    );
    if (result.error) throw result.error;
    remoteHistoryReady = true;
    const remote = result.data || [];
    const remoteIds = new Set(remote.map((item) => item.id));
    conversations = [...remote, ...cached.filter((item) => !remoteIds.has(item.id))]
      .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
      .slice(0, 30);
    databaseReady = true;
    renderConversations();
    if (selectLatest && conversations.length) await openConversation(conversations[0].id);
    else if (!activeConversationId) {
      messages = [];
      renderMessages();
    }
    if (cached.length && remote.length) showStatus('Histórico online conectado. Conversas salvas neste dispositivo também estão disponíveis.');
    else showStatus('');
    updateControls();
    return true;
  } catch {
    remoteHistoryReady = false;
    databaseReady = true;
    conversations = cached;
    renderConversations();
    if (selectLatest && conversations.length) {
      await openConversation(conversations[0].id);
    } else if (!activeConversationId) {
      messages = [];
      renderMessages();
    }
    showStatus('O histórico online ainda não está configurado. As conversas serão guardadas neste dispositivo.');
    updateControls();
    return false;
  }
}

async function openConversation(conversationId) {
  if (!databaseReady) return;
  const conversation = conversations.find((item) => item.id === conversationId);
  if (conversation?._local || !remoteHistoryReady) {
    activeConversationId = conversationId;
    activeConversationLocal = true;
    messages = conversation?.messages || [];
    renderConversationList();
    renderMessages();
    showStatus(remoteHistoryReady ? 'Esta conversa está guardada neste dispositivo.' : 'Esta conversa está guardada neste dispositivo.');
    return;
  }
  showStatus('');
  let data;
  let error;
  try {
    ({ data, error } = await withTimeout(
      supabase.from('physics_ai_messages')
        .select('role,content,created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(200),
      8000,
      'O histórico demorou para abrir.'
    ));
  } catch (loadError) {
    error = loadError;
  }
  if (error) {
    remoteHistoryReady = false;
    conversations = readLocalConversations();
    activeConversationId = conversationId;
    activeConversationLocal = true;
    messages = conversations.find((item) => item.id === conversationId)?.messages || [];
    renderConversations();
    renderMessages();
    showStatus('Não foi possível abrir o histórico online. As mensagens deste dispositivo continuam disponíveis.', true);
    return;
  }
  activeConversationId = conversationId;
  activeConversationLocal = false;
  messages = data || [];
  saveLocalSnapshot();
  renderConversationList();
  renderMessages();
}

function startNewConversation() {
  if (!databaseReady || busy) return;
  activeConversationId = null;
  activeConversationLocal = true;
  messages = [];
  renderConversationList();
  renderMessages();
  showStatus('Nova conversa. Envie uma pergunta para começar.');
  input.focus();
}

async function ensureConversation(firstMessage) {
  if (activeConversationId) return activeConversationId;
  const title = firstMessage.replace(/\s+/g, ' ').trim().slice(0, 72) || 'Nova conversa';
  if (remoteHistoryReady) {
    try {
      const { data, error } = await withTimeout(
        supabase.from('physics_ai_conversations')
          .insert({ user_id: user.id, title })
          .select('id,title,updated_at')
          .single(),
        8000,
        'O histórico online demorou para criar a conversa.'
      );
      if (!error && data) {
        activeConversationId = data.id;
        activeConversationLocal = false;
        conversations.unshift(data);
        renderConversationList();
        return activeConversationId;
      }
    } catch {}
    remoteHistoryReady = false;
  }
  activeConversationId = (globalThis.crypto?.randomUUID?.() || 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  activeConversationLocal = true;
  const conversation = { id: activeConversationId, title, updated_at: new Date().toISOString(), _local: true, messages: [] };
  conversations.unshift(conversation);
  conversations = conversations.slice(0, 30);
  renderConversationList();
  return activeConversationId;
}

function localTutorAnswer(question) {
  const normalized = question.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/\bmruv?\b|movimento retilineo uniforme|movimento uniformemente variado/.test(normalized)) {
    if (/\bmruv\b|aceleracao|acelerado|desacelerado|velocidade varia/.test(normalized)) {
      return 'No MRUV, a aceleração é constante. As relações principais são v = v₀ + a·t e s = s₀ + v₀·t + (a·t²)/2. Aqui, v é a velocidade no instante t, v₀ é a velocidade inicial, a é a aceleração e s é a posição. O sinal de a indica se a velocidade aumenta ou diminui no sentido escolhido.';
    }
    return 'No MRU, a velocidade permanece constante e a aceleração é zero. A posição é s = s₀ + v·t: s₀ é a posição inicial, v é a velocidade e t é o tempo. Em um gráfico posição × tempo, a inclinação representa a velocidade.';
  }
  if (/lancamento obliquo|projetil|trajetoria parabolica/.test(normalized)) {
    return 'No lançamento oblíquo, separamos o movimento em dois eixos. Na horizontal: x = x₀ + v₀·cos(θ)·t, com velocidade constante. Na vertical: y = y₀ + v₀·sen(θ)·t − g·t²/2. Desprezando o ar, a aceleração horizontal é zero e a vertical vale −g.';
  }
  if (/espelho concavo|espelho esferico concavo/.test(normalized)) {
    return 'Para o espelho côncavo, f = R/2 e 1/f = 1/p + 1/p′, onde p é a distância do objeto, p′ é a distância da imagem e f é o foco. Fora do foco, a imagem é real e invertida; entre o foco e o espelho, é virtual, direita e ampliada. No foco, os raios refletidos saem paralelos.';
  }
  if (/espelho convexo|espelho divergente/.test(normalized)) {
    return 'O espelho convexo é divergente: para um objeto real, forma uma imagem virtual, direita e menor, atrás do espelho. Use 1/f = 1/p + 1/p′; na convenção usual, o foco do convexo é negativo. A imagem menor explica o campo de visão amplo.';
  }
  if (/espelho plano/.test(normalized)) {
    return 'No espelho plano, a imagem é virtual, direita e do mesmo tamanho do objeto. Ela aparece atrás do espelho à mesma distância que o objeto está à frente. A inversão percebida troca os lados laterais, mas não vira a imagem de cima para baixo.';
  }
  if (/\b(faraday|lenz|inducao|bobina|eletroima|imas|ima|magnetismo)\b/.test(normalized)) {
    return 'A indução eletromagnética acontece quando o fluxo magnético através de uma bobina muda. A fem induzida é ε = −N·ΔΦ/Δt: N é o número de espiras e o sinal negativo representa a lei de Lenz, que indica que a corrente induzida se opõe à variação do fluxo. Mover o ímã mais rápido costuma aumentar a tensão induzida.';
  }
  if (/laboratorio|grafico|vetor|tela cheia|pausar|animacao|site/.test(normalized)) {
    return 'No Diário dos BNs, abra Laboratórios e escolha um tópico para entrar na simulação. Dentro dela, use Controles para ajustar os parâmetros e Gráficos e parâmetros para consultar os dados. Em tela cheia, procure o botão de controles para abrir o painel lateral. Se algum controle não aparecer, atualize a página e tente novamente.';
  }
  return null;
}

function setTypingLabel(indicator, text) {
  const label = indicator?.querySelector('.physics-ai-typing-label');
  if (label) label.textContent = text;
}

function explainLocalModelError(error) {
  const detail = String(error?.message || '').toLocaleLowerCase('pt-BR');
  if (!navigator.gpu || /webgpu|adapter|gpu|memory|memoria|device|shader|feature/.test(detail)) {
    return 'Não consegui iniciar a IA neste aparelho. Use um navegador atualizado com suporte a WebGPU e feche outras abas para liberar recursos.';
  }
  if (/fetch|network|rede|download|load model|baixar|connection|conex/.test(detail)) {
    return 'Não consegui baixar o modelo gratuito. Confira sua conexão com a internet e tente novamente.';
  }
  return 'Não consegui iniciar o modelo local agora. Atualize a página e tente novamente; nenhuma API paga foi chamada.';
}

async function loadLocalEngine(indicator) {
  if (!navigator.gpu) {
    throw new Error('Este aparelho ou navegador não oferece WebGPU para executar a IA local. Tente um navegador atualizado em um computador compatível. Nenhuma API paga foi chamada.');
  }
  if (localEngine) return localEngine;
  if (!localEnginePromise) {
    setTypingLabel(indicator, 'Preparando a IA local pela primeira vez…');
    showStatus('Baixando o modelo gratuito para este navegador. A primeira preparação pode demorar; nas próximas conversas ele será reutilizado do cache.');
    localEnginePromise = import(webLlmModuleUrl)
      .then(({ CreateMLCEngine }) => {
        if (typeof CreateMLCEngine !== 'function') throw new Error('Não consegui carregar o mecanismo local de IA. Confira sua conexão e tente novamente.');
        return CreateMLCEngine(localModelId, {
          initProgressCallback: (progress) => {
            const ratio = Number(progress?.progress);
            const percent = Number.isFinite(ratio) && ratio > 0 ? ` ${Math.min(100, Math.round(ratio * 100))}%` : '';
            setTypingLabel(indicator, `Preparando a IA local${percent}…`);
            showStatus(`Preparando o modelo no seu dispositivo${percent}. O primeiro carregamento pode levar alguns minutos.`);
          }
        });
      })
      .then((engine) => {
        localEngine = engine;
        return engine;
      })
      .catch((error) => {
        localEnginePromise = null;
        throw error;
      });
  }
  return localEnginePromise;
}

async function streamLocalAnswer(question, history, indicator, onAssistantArticle) {
  const engine = await loadLocalEngine(indicator);
  setTypingLabel(indicator, 'BNzinho está escrevendo');
  const article = addMessage('assistant', '', null, true);
  onAssistantArticle(article);
  const answerElement = article.querySelector('.physics-ai-message-body p');
  indicator.remove();
  showStatus('');

  const priorMessages = history.slice(-6).map((message) => ({
    role: message.role,
    content: String(message.content || '').slice(-1200)
  }));
  const stream = await engine.chat.completions.create({
    messages: [
      { role: 'system', content: localSystemPrompt },
      ...priorMessages,
      { role: 'user', content: question }
    ],
    temperature: 0.7,
    top_p: 0.9,
    max_tokens: 700,
    stream: true
  });

  let answer = '';
  for await (const chunk of stream) {
    const part = chunk.choices?.[0]?.delta?.content;
    if (typeof part !== 'string' || !part) continue;
    answer += part;
    answerElement.textContent = answer;
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }
  answer = answer.trim();
  if (!answer) throw new Error('O modelo local não retornou uma resposta. Tente reformular a pergunta.');
  answerElement.textContent = answer;
  return answer;
}

function showTypingIndicator() {
  const indicator = document.createElement('article');
  indicator.className = 'physics-ai-message is-assistant physics-ai-typing is-message-entering';
  indicator.setAttribute('role', 'status');
  indicator.setAttribute('aria-label', 'BNzinho está escrevendo');

  const avatar = document.createElement('img');
  avatar.className = 'physics-ai-message-avatar';
  avatar.src = mascotImageSrc;
  avatar.alt = '';
  avatar.setAttribute('aria-hidden', 'true');

  const bubble = document.createElement('div');
  bubble.className = 'physics-ai-message-body physics-ai-typing-body';
  const label = document.createElement('strong');
  label.className = 'physics-ai-typing-label';
  label.textContent = 'Preparando a IA local…';
  const dots = document.createElement('span');
  dots.className = 'physics-ai-typing-dots';
  dots.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 3; i += 1) dots.append(document.createElement('i'));
  bubble.append(label, dots);
  indicator.append(avatar, bubble);
  messagesBox.append(indicator);
  messagesBox.scrollTop = messagesBox.scrollHeight;
  document.querySelector('.physics-ai-chat-panel')?.classList.add('is-thinking');
  return indicator;
}

async function sendMessage(event) {
  event.preventDefault();
  const question = input.value.trim();
  if (!question || !user || !databaseReady || busy) return;
  busy = true;
  input.value = '';
  updateControls();
  showStatus('');
  const pendingMessage = addMessage('user', question, null, true);
  pendingMessage.classList.add('is-sending');
  const typingIndicator = showTypingIndicator();
  const previousHistory = messages.slice(-10).map((message) => ({ role: message.role, content: message.content }));
  let streamedAssistant = null;
  try {
    let answer;
    let usedLocalTutor = false;
    try {
      answer = await streamLocalAnswer(question, previousHistory, typingIndicator, (article) => {
        streamedAssistant = article;
      });
    } catch (modelError) {
      streamedAssistant?.remove();
      streamedAssistant = null;
      answer = localTutorAnswer(question) || '';
      if (!answer) throw new Error(explainLocalModelError(modelError));
      usedLocalTutor = true;
    }

    const conversationId = await ensureConversation(question);
    const timestamp = new Date().toISOString();
    const userMessage = { role: 'user', content: question, created_at: timestamp };
    const assistantMessage = { role: 'assistant', content: answer, created_at: new Date().toISOString() };

    if (remoteHistoryReady && !activeConversationLocal) {
      try {
        const { error: questionError } = await withTimeout(supabase.from('physics_ai_messages').insert({
          conversation_id: conversationId, user_id: user.id, role: 'user', content: question
        }), 6000, 'O histórico online demorou para salvar a pergunta.');
        if (questionError) throw questionError;
        const { error: answerError } = await withTimeout(supabase.from('physics_ai_messages').insert({
          conversation_id: conversationId, user_id: user.id, role: 'assistant', content: answer
        }), 6000, 'O histórico online demorou para salvar a resposta.');
        if (answerError) throw answerError;
        await withTimeout(supabase.from('physics_ai_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId), 6000, 'O histórico online demorou para atualizar.');
      } catch {
        remoteHistoryReady = false;
        activeConversationLocal = true;
      }
    }

    messages.push(userMessage, assistantMessage);
    saveLocalSnapshot();
    const existing = conversations.find((item) => item.id === conversationId);
    if (existing) {
      existing.updated_at = new Date().toISOString();
      existing.messages = messages.slice(-100);
    }
    conversations.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
    renderConversations();
    renderMessages(true);
    if (usedLocalTutor) {
      showStatus('Resposta de apoio exibida. Para conversar sobre outros assuntos, este aparelho precisa oferecer WebGPU e carregar o modelo local.');
    } else {
      showStatus('');
    }
    if (remoteHistoryReady) void refreshConversations(false);
  } catch (error) {
    streamedAssistant?.remove();
    input.value = question;
    showStatus(error?.message || 'Não foi possível enviar a pergunta. Tente novamente.', true);
  } finally {
    pendingMessage.remove();
    typingIndicator.remove();
    document.querySelector('.physics-ai-chat-panel')?.classList.remove('is-thinking');
    busy = false;
    updateControls();
  }
}

function activateUser(nextUser) {
  const changed = nextUser?.id !== user?.id;
  setSignedIn(nextUser);
  if (!nextUser || !changed) return;
  databaseReady = true;
  conversations = readLocalConversations();
  renderConversations();
  showStatus('Verificando o histórico salvo…');
  void refreshConversations(true);
}

async function initialize() {
  try {
    supabase = await withTimeout(supabasePromise, 10000, 'O serviço de contas demorou para responder. Atualize a página e tente novamente.');
    if (!supabase) {
      showStatus('Não foi possível conectar ao serviço de contas. Atualize a página e tente novamente.', true);
      loginGate.hidden = false;
      return;
    }
    const { data, error } = await withTimeout(
      supabase.auth.getSession(),
      8000,
      'A verificação da sua conta demorou. Atualize a página e tente novamente.'
    );
    if (error) throw error;
    activateUser(data?.session?.user || null);
    supabase.auth.onAuthStateChange((_event, session) => activateUser(session?.user || null));
  } catch {
    setSignedIn(null);
    showStatus('Não foi possível verificar sua conta. Atualize a página e tente novamente.', true);
  }
}

input.addEventListener('input', updateControls);
input.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
  event.preventDefault();
  if (!sendButton.disabled) form.requestSubmit(sendButton);
});
form.addEventListener('submit', (event) => void sendMessage(event));
newChatButton.addEventListener('click', startNewConversation);
for (const button of suggestionButtons) {
  button.addEventListener('click', () => {
    input.value = button.dataset.physicsAiPrompt || '';
    updateControls();
    input.focus();
  });
}

void initialize();
