import { experiments } from "./laboratorio-catalogo.js?v=lab-catalog-25-20261011-1";

const catalog = globalThis.document?.querySelector("#lab-cards");
export const experimentPageUrl = (id) => id === "freefall" ? "laboratorio-queda-livre.html" : id === "faraday-induction" ? "laboratorio-faraday.html" : `laboratorio-experimento.html?topico=${encodeURIComponent(id)}`;
if (catalog) initializeCatalog();

function initializeCatalog() {
  const search = document.querySelector("#lab-search");
  const category = document.querySelector("#lab-category");
  const level = document.querySelector("#lab-level");
  const mode = document.querySelector("#lab-mode");
  const count = document.querySelector("#lab-result-count");
  const empty = document.querySelector("#lab-empty");

  const diagrams = {
    "optics-mirrors": '<path d="M35 12v50"/><path d="M45 14q-18 24 0 48"/><path d="M54 14q18 24 0 48"/><path class="secondary" d="M9 38h23m0 0-6-5m6 5-6 5"/>',
    "lab-friction-incline": '<path d="M12 61h62L25 20z"/><rect x="33" y="35" width="15" height="13" rx="2" transform="rotate(-34 40 41)"/><path class="secondary" d="M17 55h18"/>',
    "lab-circular-motion": '<circle cx="42" cy="40" r="22"/><circle cx="64" cy="40" r="4"/><path class="secondary" d="m58 22 9 1-2 9"/>',
    "lab-hydrostatics": '<path d="M24 15v47h38V15M25 34h36"/><path class="secondary" d="M33 39v17m0 0-4-5m4 5 4-5m10-12v12m0 0-4-5m4 5 4-5"/>',
    "lab-gas-thermodynamics": '<rect x="20" y="18" width="44" height="42" rx="4"/><path class="secondary" d="M27 49h30M42 14v12m0 0-4-5m4 5 4-5"/><circle cx="31" cy="34" r="2"/><circle cx="50" cy="40" r="2"/>',
    "lab-sound-resonance": '<path d="M18 14v48m50-48v48M20 38c8-23 16 23 24 0s16 23 24 0"/><path class="secondary" d="M25 67h36"/>',
    "lab-doppler-effect": '<path d="M12 43h27l12-12v30L39 49H12z"/><path class="secondary" d="M57 30q13 13 0 26m5-34q21 21 0 42"/>',
    "lab-interference-diffraction": '<path d="M18 17v46M38 31v7m0 6v7m0 6v7M64 18v44"/><path class="secondary" d="M18 35h19m4 0h22m-45 9h19m4 0h22"/>',
    "lab-magnetic-field": '<path d="M25 19v31a17 17 0 0 0 34 0V19"/><path class="secondary" d="M18 24c8-12 40-12 48 0M18 54c8 12 40 12 48 0"/><path d="M25 19h8m18 0h8"/>',
    "lab-radioactivity": '<circle cx="42" cy="39" r="7"/><path d="M39 31 31 17a25 25 0 0 0-13 11l16 6M48 37l16-6a25 25 0 0 0-8-13L43 32m-1 15 1 18a25 25 0 0 0 16-6l-10-13"/>',
    "faraday-induction": '<path d="M25 20v31a17 17 0 0 0 34 0V20"/><path class="secondary" d="M10 36h13m0 0-5-5m5 5-5 5m43-8h9m0 0-5-5m5 5-5 5"/><path d="m43 26-8 15h8l-4 12 11-17h-8z"/>',
    projectile: '<path d="M12 56 Q39 4 72 37"/><circle cx="12" cy="56" r="3"/><circle class="secondary" cx="72" cy="37" r="4"/><path class="secondary" d="M16 57h62M16 59v-8"/>',
    mru: '<path d="M9 48h64"/><path d="m60 38 13 10-13 10"/><circle cx="24" cy="48" r="7"/><circle class="secondary" cx="49" cy="48" r="7"/>',
    muv: '<path d="M10 56 28 46l18-13 22-21"/><path class="secondary" d="M10 59h64M10 59V12"/>',
    freefall: '<path d="M42 12v38m0 0-7-9m7 9 7-9"/><path class="secondary" d="M12 62h60"/><circle cx="42" cy="27" r="7"/>',
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
      const cardBody = `<span class="lab-card-art">${svgFor(item.id)}</span><span class="lab-card-body"><span class="lab-card-title">${item.title}<small>${item.status}</small></span><span class="lab-card-meta">${item.category} · ${item.level} · ${item.mode}</span><span class="lab-card-meta">${item.description}</span>`;
      if (item.links?.length) {
        const links = item.links.map((link) => `<a class="lab-card-link" href="laboratorio-experimento.html?topico=${encodeURIComponent(link.id)}">${link.label} →</a>`).join("");
        return `<article class="lab-card lab-card-multiple" aria-label="Experimento: ${item.title}">${cardBody}<span class="lab-card-links">${links}</span></span></article>`;
      }
      const href = experimentPageUrl(item.id);
      return `<a class="lab-card" href="${href}" aria-label="Abrir simulação: ${item.title}">${cardBody}<span class="lab-card-cta">Abrir experimento →</span></span></a>`;
    }).join("");
    count.textContent = `${filtered.length} ${filtered.length === 1 ? "experimento" : "experimentos"} disponíveis.`;
    empty.hidden = filtered.length !== 0;
  }

  [search, category, level, mode].forEach((element) => element.addEventListener(element === search ? "input" : "change", drawCards));
  drawCards();
}

