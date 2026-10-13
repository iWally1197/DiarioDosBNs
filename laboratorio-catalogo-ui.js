import { experiments } from "./laboratorio-catalogo.js?v=lab-publication-20261012-3";
import { laboratoryPublicationByExperimentId, laboratoryPublicationSlugs } from "./laboratorio-publicacao.js?v=lab-publication-20261013-1";
import { supabasePromise } from "./src-supabase.js?v=auth-fix-20261008";

function withDeadline(promise, timeoutMs, message) {
  let timer;
  return Promise.race([
    Promise.resolve(promise),
    new Promise((_, reject) => {
      timer = window.setTimeout(() => reject(new Error(message)), timeoutMs);
    })
  ]).finally(() => window.clearTimeout(timer));
}

const catalog = globalThis.document?.querySelector("#lab-cards");
const allowedExperiments = experiments.filter((item) => laboratoryPublicationByExperimentId.has(item.id));
export const experimentPageUrl = (id) => id === "lab-magnetic-field" ? "laboratorio-magnetismo.html" : id === "mru" ? "laboratorio-mru.html" : id === "muv" ? "laboratorio-mruv.html" : id === "freefall" ? "laboratorio-queda-livre.html" : id === "faraday-induction" ? "laboratorio-faraday.html" : `laboratorio-experimento.html?topico=${encodeURIComponent(id)}`;
if (catalog) initializeCatalog();

function initializeCatalog() {
  const search = document.querySelector("#lab-search");
  const category = document.querySelector("#lab-category");
  const level = document.querySelector("#lab-level");
  const mode = document.querySelector("#lab-mode");
  const count = document.querySelector("#lab-result-count");
  const empty = document.querySelector("#lab-empty");
  const status = document.querySelector("#lab-publication-status");

  const diagrams = {
    "lab-magnetic-field": '<path d="M23 30h38v18H23z"/><path class="secondary" d="M42 30v18M12 31c6-19 55-25 62 0M12 47c6 19 55 25 62 0M31 36h5m12 6h5"/>',
    "optics-reflection": '<path d="M51 12v52"/><path class="secondary" d="M12 39h36m0 0-7-6m7 6-7 6M51 21l21 18-21 18"/>',
    "optics-concave-mirror": '<path d="M49 11q-22 27 0 54"/><path class="secondary" d="M9 23h32m0 0-8-6m8 6-8 6M9 53h32m0 0-8-6m8 6-8 6M41 23 27 38M41 53 27 38"/><circle cx="27" cy="38" r="3"/>',
    "optics-convex-mirror": '<path d="M48 12q-19 26 0 52"/><path class="secondary" d="M14 39h30m0 0-6-6m6 6-6 6M52 25l20 14-20 14"/>',
    "lens-diverging": '<path d="M36 13q7 25 0 50m12-50q-7 25 0 50"/><path class="secondary" d="M10 39h25m0 0-6-6m6 6-6 6M49 39h25m-25-12-11-8m11 32-11 8"/>',
    projectile: '<path d="M12 56 Q39 4 72 37"/><circle cx="12" cy="56" r="3"/><circle class="secondary" cx="72" cy="37" r="4"/><path class="secondary" d="M16 57h62M16 59v-8"/>',
    mru: '<path d="M9 48h64"/><path d="m60 38 13 10-13 10"/><circle cx="24" cy="48" r="7"/><circle class="secondary" cx="49" cy="48" r="7"/>',
    muv: '<path d="M10 56 28 46l18-13 22-21"/><path class="secondary" d="M10 59h64M10 59V12"/>'
  };
  const svgFor = (id) => `<svg viewBox="0 0 86 76" aria-hidden="true">${diagrams[id] || ""}</svg>`;
  let visibleExperiments = [];
  let isSyncing = true;

  function populateOptions(select, values, label) {
    const previous = select.value;
    select.replaceChildren(new Option(label, ""));
    for (const value of values) select.add(new Option(value, value));
    if (values.includes(previous)) select.value = previous;
  }

  function populateFilters() {
    populateOptions(category, [...new Set(visibleExperiments.map((item) => item.category))], "Todas as categorias");
    populateOptions(level, [...new Set(visibleExperiments.map((item) => item.level))], "Todos os níveis");
    populateOptions(mode, [...new Set(visibleExperiments.map((item) => item.mode))], "Todas");
  }

  function drawCards() {
    if (isSyncing) {
      catalog.replaceChildren();
      count.textContent = "Sincronizando a publicação dos laboratórios…";
      empty.hidden = true;
      return;
    }
    const query = search.value.trim().toLocaleLowerCase("pt-BR");
    const filtered = visibleExperiments.filter((item) => {
      const haystack = `${item.title} ${item.category} ${item.level} ${item.description} ${item.objective || ""}`.toLocaleLowerCase("pt-BR");
      return haystack.includes(query) && (!category.value || item.category === category.value) && (!level.value || item.level === level.value) && (!mode.value || item.mode === mode.value);
    });
    catalog.innerHTML = filtered.map((item) => {
      const cardBody = `<span class="lab-card-art">${svgFor(item.id)}</span><span class="lab-card-body"><span class="lab-card-title">${item.title}<small>${item.status}</small></span><span class="lab-card-meta">${item.category} · ${item.level} · ${item.mode}</span><span class="lab-card-meta">${item.description}</span></span>`;
      const href = item.destination || experimentPageUrl(item.id);
      return `<a class="lab-card" href="${href}" aria-label="Abrir simulação: ${item.title}">${cardBody}<span class="lab-card-cta">Abrir experimento →</span></a>`;
    }).join("");
    count.textContent = `${filtered.length} ${filtered.length === 1 ? "laboratório disponível" : "laboratórios disponíveis"}.`;
    empty.hidden = filtered.length !== 0;
  }

  async function syncPublication() {
    try {
      const client = await withDeadline(supabasePromise, 5000, "O serviço de publicação demorou para iniciar.");
      if (!client) throw new Error("Supabase indisponível");
      const { data, error } = await withDeadline(
        client.from("animations").select("slug").in("slug", laboratoryPublicationSlugs),
        5000,
        "A consulta de publicação demorou para responder."
      );
      if (error) throw error;
      const published = new Set((data || []).map((row) => row.slug));
      visibleExperiments = allowedExperiments.filter((item) => published.has(laboratoryPublicationByExperimentId.get(item.id)?.slug));
      status.textContent = visibleExperiments.length
        ? "Esta lista acompanha os laboratórios marcados como “No ar” no painel administrativo."
        : "Nenhum laboratório está no ar no momento. Ative os que deseja exibir no painel administrativo.";
    } catch {
      visibleExperiments = [...allowedExperiments];
      status.textContent = "Não foi possível consultar a publicação agora. A lista permitida continua disponível; tente atualizar a página.";
    }
    isSyncing = false;
    populateFilters();
    drawCards();
  }

  populateFilters();
  count.textContent = "Sincronizando a publicação dos laboratórios…";
  drawCards();
  [search, category, level, mode].forEach((element) => element.addEventListener(element === search ? "input" : "change", drawCards));
  void syncPublication();
}
