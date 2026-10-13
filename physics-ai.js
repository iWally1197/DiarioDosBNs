import { supabasePromise } from './src-supabase.js';

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
let conversations = [];
let messages = [];
let databaseReady = false;
let busy = false;

function showStatus(message = '', isError = false) {
  statusBox.textContent = message;
  statusBox.classList.toggle('is-error', isError);
  statusBox.hidden = !message;
}

function updateControls() {
  const enabled = Boolean(user && databaseReady && !busy);
  input.disabled = !enabled;
  newChatButton.disabled = !enabled;
  sendButton.disabled = !enabled || !input.value.trim();
  for (const button of suggestionButtons) button.disabled = !enabled;
}

function setSignedIn(nextUser) {
  user = nextUser || null;
  loginGate.hidden = Boolean(user);
  accountLink.textContent = user ? 'Minha conta' : 'Entrar';
  accountLink.href = user ? 'perfil.html' : 'login.html?next=ia';
  if (!user) {
    databaseReady = false;
    activeConversationId = null;
    conversations = [];
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

function addMessage(role, content, createdAt = null) {
  const article = document.createElement('article');
  article.className = 'physics-ai-message ' + (role === 'assistant' ? 'is-assistant' : 'is-user');
  const avatar = document.createElement('img');
  avatar.className = 'physics-ai-message-avatar';
  avatar.src = 'assets/mascote-ia-fisica.png';
  avatar.alt = '';
  avatar.setAttribute('aria-hidden', 'true');
  if (role === 'assistant') article.append(avatar);

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
}

function renderMessages() {
  messagesBox.replaceChildren();
  if (!messages.length) {
    const welcome = document.createElement('div');
    welcome.className = 'physics-ai-welcome';
    const mascot = document.createElement('img');
    mascot.src = 'assets/mascote-ia-fisica.png';
    mascot.alt = '';
    mascot.setAttribute('aria-hidden', 'true');
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = 'Oi! Eu sou o BNzinho.';
    const description = document.createElement('p');
    description.textContent = 'Posso ajudar com Física, com as animações dos laboratórios e com a navegação pelo Diário dos BNs. Qual é a sua dúvida?';
    copy.append(title, description);
    welcome.append(mascot, copy);
    messagesBox.append(welcome);
  } else {
    for (const message of messages) addMessage(message.role, message.content, message.created_at);
  }
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

function renderConversations() {
  renderConversationList();
  updateControls();
}

async function refreshConversations(selectLatest = true) {
  const { data, error } = await supabase
    .from('physics_ai_conversations')
    .select('id,title,updated_at')
    .order('updated_at', { ascending: false })
    .limit(30);
  if (error) {
    databaseReady = false;
    renderConversations();
    showStatus('O histórico do chat ainda não foi ativado no Supabase. O administrador precisa concluir a configuração.', true);
    return false;
  }
  databaseReady = true;
  conversations = data || [];
  renderConversations();
  if (selectLatest && conversations.length) await openConversation(conversations[0].id);
  else if (!conversations.length) {
    activeConversationId = null;
    messages = [];
    renderMessages();
  }
  updateControls();
  return true;
}

async function openConversation(conversationId) {
  if (!databaseReady) return;
  showStatus('');
  const { data, error } = await supabase
    .from('physics_ai_messages')
    .select('role,content,created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(200);
  if (error) {
    showStatus('Não foi possível abrir esta conversa. Atualize a página e tente novamente.', true);
    return;
  }
  activeConversationId = conversationId;
  messages = data || [];
  renderConversationList();
  renderMessages();
}

function startNewConversation() {
  if (!databaseReady || busy) return;
  activeConversationId = null;
  messages = [];
  renderConversationList();
  renderMessages();
  showStatus('Nova conversa. Envie uma pergunta para começar.');
  input.focus();
}

async function ensureConversation(firstMessage) {
  if (activeConversationId) return activeConversationId;
  const title = firstMessage.replace(/\s+/g, ' ').trim().slice(0, 72) || 'Nova conversa';
  const { data, error } = await supabase
    .from('physics_ai_conversations')
    .insert({ user_id: user.id, title })
    .select('id,title,updated_at')
    .single();
  if (error) throw new Error('Não foi possível criar uma conversa salva.');
  activeConversationId = data.id;
  conversations.unshift(data);
  renderConversationList();
  return activeConversationId;
}

function explainFunctionError(error) {
  const status = Number(error?.context?.status || error?.status || 0);
  if (status === 401) return 'Sua sessão expirou. Entre novamente para continuar.';
  if (status === 429) return 'Você enviou perguntas muito rapidamente. Aguarde um minuto e tente de novo.';
  if (status === 404) return 'O serviço de IA ainda não foi publicado no Supabase.';
  return 'Não consegui obter uma resposta agora. Tente novamente em instantes.';
}

async function sendMessage(event) {
  event.preventDefault();
  const question = input.value.trim();
  if (!question || !user || !databaseReady || busy) return;
  busy = true;
  updateControls();
  showStatus('O BNzinho está pensando…');
  const previousHistory = messages.slice(-10).map((message) => ({
    role: message.role,
    content: message.content
  }));
  try {
    const conversationId = await ensureConversation(question);
    const { data: savedQuestion, error: questionError } = await supabase
      .from('physics_ai_messages')
      .insert({ conversation_id: conversationId, user_id: user.id, role: 'user', content: question })
      .select('role,content,created_at')
      .single();
    if (questionError) throw new Error('Não foi possível salvar sua pergunta. Tente novamente.');
    messages.push(savedQuestion);
    input.value = '';
    renderMessages();
    updateControls();

    const { data, error } = await supabase.functions.invoke('physics-assistant', {
      body: { message: question, history: previousHistory }
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    const answer = typeof data?.answer === 'string' ? data.answer.trim() : '';
    if (!answer) throw new Error('O assistente não retornou uma resposta. Tente novamente.');
    const { data: savedAnswer, error: answerError } = await supabase
      .from('physics_ai_messages')
      .insert({ conversation_id: conversationId, user_id: user.id, role: 'assistant', content: answer })
      .select('role,content,created_at')
      .single();
    if (answerError) {
      messages.push({ role: 'assistant', content: answer, created_at: new Date().toISOString() });
      showStatus('Resposta recebida, mas não foi possível salvar no histórico. Confira a conexão.', true);
    } else {
      messages.push(savedAnswer);
      showStatus('');
    }
    await supabase
      .from('physics_ai_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
    renderMessages();
    await refreshConversations(false);
  } catch (error) {
    const message = error?.message && !error.context ? error.message : explainFunctionError(error);
    showStatus(message, true);
  } finally {
    busy = false;
    updateControls();
  }
}

async function initialize() {
  try {
    supabase = await supabasePromise;
    if (!supabase) {
      showStatus('Não foi possível conectar ao serviço de contas. Atualize a página e tente novamente.', true);
      loginGate.hidden = false;
      return;
    }
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    const session = data?.session;
    if (!session?.user) {
      setSignedIn(null);
      return;
    }
    setSignedIn(session.user);
    showStatus('Carregando seu histórico salvo…');
    const ready = await refreshConversations(true);
    if (ready) showStatus('');
  } catch {
    setSignedIn(null);
    showStatus('Não foi possível verificar sua conta. Atualize a página e tente novamente.', true);
  }
}

input.addEventListener('input', updateControls);
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
