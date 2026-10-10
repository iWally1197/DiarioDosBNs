import { experiments } from "./laboratorio-catalogo.js?v=motion-reference-20261009-1";

const catalog = globalThis.document?.querySelector("#lab-cards");
export const experimentPageUrl = (id) => `laboratorio-experimento.html?topico=${encodeURIComponent(id)}`;
if (catalog) initializeCatalog();

function initializeCatalog() {
  const search = document.querySelector("#lab-search");
  const category = document.querySelector("#lab-category");
  const level = document.querySelector("#lab-level");
  const mode = document.querySelector("#lab-mode");
  const count = document.querySelector("#lab-result-count");
  const empty = document.querySelector("#lab-empty");

  const diagrams = {
    projectile: '<path d="M12 56 Q39 4 72 37"/><circle cx="12" cy="56" r="3"/><circle class="secondary" cx="72" cy="37" r="4"/><path class="secondary" d="M16 57h62M16 59v-8"/>',
    mru: '<path d="M9 48h64"/><path d="m60 38 13 10-13 10"/><circle cx="24" cy="48" r="7"/><circle class="secondary" cx="49" cy="48" r="7"/>',
    muv: '<path d="M10 56 28 46l18-13 22-21"/><path class="secondary" d="M10 59h64M10 59V12"/>',
    newton: '<rect x="30" y="31" width="24" height="21" rx="3"/><path d="M9 42h19m0 0-6-5m6 5-6 5"/><path class="secondary" d="M35 26v-8m14 8v-8M22 54v7m40-7v7"/>',
    energy: '<path d="M8 17 69 56H8z"/><circle cx="24" cy="26" r="5"/><path class="secondary" d="m26 25 22 20m0 0-8-1m8 1-1-8"/>',
    collision: '<rect x="11" y="36" width="22" height="14" rx="3"/><rect x="54" y="36" width="20" height="14" rx="3"/><path d="M17 55a3 3 0 1 0 0 .1M28 55a3 3 0 1 0 0 .1M60 55a3 3 0 1 0 0 .1M69 55a3 3 0 1 0 0 .1"/><path class="secondary" d="M34 27h17m0 0-5-5m5 5-5 5"/>',
    spring: '<path d="M9 20v38m8-19h7l5-10 7 20 7-20 7 20 5-10h7"/><rect x="62" y="31" width="14" height="16" rx="2"/>',
    wave: '<path d="M7 38c8-30 16 30 24 0s16-30 24 0 16 30 24 0"/><path class="secondary" d="M7 57h72"/>',
    ohm: '<path d="M13 22v34h54V22H13zM13 39h13l6-9 10 18 8-9h17"/><path class="secondary" d="M30 13h20m0 0-5-5m5 5-5 5"/>',
    lens: '<path d="M45 12 Q31 38 45 64M51 12Q65 38 51 64"/><path class="secondary" d="M11 53V27m-5 5 5-5 5 5M17 40h58M75 53V27m-5 5 5-5 5 5"/>',
    calorimetry: '<path d="M18 15v31a10 10 0 1 0 15 0V15a7 7 0 1 0-15 0zM49 15v31a10 10 0 1 0 15 0V15a7 7 0 1 0-15 0z"/><path class="secondary" d="M25 31v21m31-14v14"/>',
    field: '<circle cx="24" cy="38" r="9"/><circle class="secondary" cx="62" cy="38" r="9"/><path d="M20 38h8m-4-4v8m34 0h8"/><path class="secondary" d="M34 22c8-8 14-8 20 0M34 54c8 8 14 8 20 0"/>',
    pendulum: '<path d="M41 10v10m0 0-18 35m18-35 18 35"/><circle cx="23" cy="55" r="7"/><circle class="secondary" cx="59" cy="55" r="7"/><path class="secondary" d="M26 13a25 25 0 0 1 29 5"/>'
  };
  const svgFor = (id) => `<svg viewBox="0 0 86 76" aria-hidden="true">${diagrams[id] || ""}</svg>`;

  for (const [select, values] of [
    [category, [...new Set(experiments.map((item) => item.category))]],
    [level, [...new Set(experiments.map((item) => item.level))]],
    [mode, [...new Set(experiments.map((item) => item.mode))]]
  ]) {
    for (const value of values) select.add(new Option(value, value));
  }

  function drawCards() {
    const query = search.value.trim().toLocaleLowerCase("pt-BR");
    const filtered = experiments.filter((item) => {
      const haystack = `${item.title} ${item.category} ${item.level} ${item.description} ${item.objective || ""}`.toLocaleLowerCase("pt-BR");
      return haystack.includes(query) && (!category.value || item.category === category.value) && (!level.value || item.level === level.value) && (!mode.value || item.mode === mode.value);
    });
    catalog.innerHTML = filtered.map((item) => {
      const href = experimentPageUrl(item.id);
      return `<a class="lab-card" href="${href}" aria-label="Abrir simulação: ${item.title}"><span class="lab-card-art">${svgFor(item.id)}</span><span class="lab-card-body"><span class="lab-card-title">${item.title}<small>${item.status}</small></span><span class="lab-card-meta">${item.category} · ${item.level} · ${item.mode}</span><span class="lab-card-meta">${item.description}</span><span class="lab-card-cta">Abrir experimento →</span></span></a>`;
    }).join("");
    count.textContent = `${filtered.length} ${filtered.length === 1 ? "experimento" : "experimentos"} disponíveis.`;
    empty.hidden = filtered.length !== 0;
  }

  [search, category, level, mode].forEach((element) => element.addEventListener(element === search ? "input" : "change", drawCards));
  drawCards();
}
