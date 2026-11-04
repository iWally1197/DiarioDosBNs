import { supabasePromise } from "/src-supabase.js?v=animation-login-20261104-1";

(() => {
  "use strict";

  const pageMode = document.body.dataset.animationAccessPage || "";
  const path = location.pathname.replace(/index\.html$/i, "").replace(/\.html$/i, "/").replace(/\/{2,}/g, "/");
  const protectedPaths = ["/topico/", "/animacao/", "/downloads/"];
  const isProtectedPage = pageMode === "protected" || protectedPaths.includes(path);
  const isHome = pageMode === "home";
  if (!isProtectedPage && !isHome) return;

  const main = document.querySelector("main#conteudo");
  const homeGate = document.getElementById("animation-access-gate");
  const returnTo = location.pathname + location.search + location.hash;
  let wasAuthenticated = false;

  function applyReturnLinks(root) {
    if (!root) return;
    const query = "?next=" + encodeURIComponent(returnTo);
    root.querySelector("[data-animation-login]")?.setAttribute("href", "/login/" + query);
    root.querySelector("[data-animation-signup]")?.setAttribute("href", "/cadastro/" + query);
  }

  function showHomeGate(message) {
    applyReturnLinks(homeGate);
    const notice = homeGate?.querySelector("[data-animation-access-message]");
    if (notice) {
      notice.textContent = message || "Entre ou crie uma conta para explorar as animações 2D e 3D.";
      notice.hidden = false;
    }
    document.documentElement.dataset.animationAccessState = "guest";
  }

  function showProtectedGate(message) {
    if (!main) return;
    const query = "?next=" + encodeURIComponent(returnTo);
    main.innerHTML =
      '<section class="animation-access-wall section-wrap" role="region" aria-labelledby="animation-access-title">' +
        '<div class="section-kicker">ÁREA DE ANIMAÇÕES</div>' +
        '<h1 id="animation-access-title">Entre para acessar as animações 2D e 3D</h1>' +
        '<p>' + (message || "Faça login ou crie sua conta para abrir os tópicos, as animações e os arquivos relacionados.") + '</p>' +
        '<div class="animation-access-actions">' +
          '<a class="button button-primary" href="/login/' + query + '">Fazer login</a>' +
          '<a class="button button-outline" href="/cadastro/' + query + '">Criar conta</a>' +
        '</div>' +
        '<p class="animation-access-public-note"><strong>Laboratórios digitais:</strong> continuam abertos ao público, sem login.</p>' +
        '<a class="text-link" href="/laboratorio/">Acessar os laboratórios digitais →</a>' +
      '</section>';
    document.documentElement.dataset.animationAccessState = "guest";
    main.removeAttribute("aria-busy");
  }

  async function initialize() {
    document.documentElement.dataset.animationAccessState = "checking";
    if (main && isProtectedPage) main.setAttribute("aria-busy", "true");
    try {
      const client = await supabasePromise;
      if (!client) {
        showHomeGate();
        if (isProtectedPage) showProtectedGate();
        return;
      }
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      wasAuthenticated = Boolean(data?.session?.user);
      if (wasAuthenticated) {
        document.documentElement.dataset.animationAccessState = "member";
        if (main) main.removeAttribute("aria-busy");
        return;
      }
      showHomeGate();
      if (isProtectedPage) showProtectedGate();
    } catch {
      const message = "Não foi possível confirmar sua sessão agora. Tente novamente ou entre na sua conta.";
      showHomeGate(message);
      if (isProtectedPage) showProtectedGate(message);
    }
  }

  initialize();
  supabasePromise.then((client) => {
    if (!client) return;
    const { data } = client.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT") return;
      const isAuthenticated = Boolean(session?.user);
      if (isAuthenticated !== wasAuthenticated) location.reload();
    });
    window.addEventListener("pagehide", () => data?.subscription?.unsubscribe(), { once: true });
  }).catch(() => {});
})();
