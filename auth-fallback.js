(() => {
  const main = document.querySelector('main#conteudo');
  if (!main) return;

  const showStartupError = (detail = '') => {
    if (main.dataset.diarioAuthReady === 'true' || main.dataset.diarioStartupError === 'true') return;
    main.dataset.diarioStartupError = 'true';
    const message = document.createElement('section');
    message.className = 'auth-card';
    message.setAttribute('role', 'alert');

    const title = document.createElement('h1');
    title.textContent = 'Esta área está demorando para abrir';
    const description = document.createElement('p');
    description.textContent = 'O site não conseguiu carregar esta página. Atualize a página. Se continuar, volte para a tela de entrada e tente novamente.';
    message.append(title, description);

    if (detail) {
      const error = document.createElement('p');
      error.className = 'auth-message';
      error.textContent = `Detalhe para identificar o problema: ${detail}`;
      message.append(error);
    }

    const reload = document.createElement('button');
    reload.className = 'button button-primary';
    reload.type = 'button';
    reload.textContent = 'Atualizar página';
    reload.addEventListener('click', () => location.reload());
    message.append(reload);
    const login = document.createElement('a');
    login.className = 'button button-outline';
    login.href = new URL('login.html', document.baseURI).href;
    login.textContent = 'Voltar para entrar';
    message.append(login);
    main.replaceChildren(message);
  };

  window.addEventListener('error', (event) => {
    if (event instanceof ErrorEvent && event.message) showStartupError(event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const detail = typeof reason === 'string' ? reason : reason?.message;
    if (detail) showStartupError(detail);
  });

  window.setTimeout(() => showStartupError(), 15000);
})();
