import { experiments, experimentById, initialParameters } from "./laboratorio-catalogo.js";
import { durationFor, graphFor, sampleValues, stateAt } from "./laboratorio-advanced-core.js";

const $ = (selector) => document.querySelector(selector);
const catalog = $("#lab-cards");
if (catalog) initializeLaboratory();

function initializeLaboratory() {
  const search = $("#lab-search");
  const category = $("#lab-category");
  const level = $("#lab-level");
  const mode = $("#lab-mode");
  const count = $("#lab-result-count");
  const empty = $("#lab-empty");
  const workspace = $("#lab-workspace");
  const canvas = $("#workspace-canvas");
  const graphCanvas = $("#workspace-graph");
  const sceneContext = canvas.getContext("2d");
  const graphContext = graphCanvas.getContext("2d");
  const state = { id: null, parameters: {}, time: 0, running: false, lastFrame: 0, frame: 0, records: [], graph: null, plot: null };
  const palette = () => {
    const css = getComputedStyle(document.documentElement);
    const read = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
    return { bg: read("--surface-2", "#131f32"), surface: read("--surface", "#101a2c"), text: read("--text", "#f4f5f8"), muted: read("--muted", "#9aa6b9"), subtle: read("--subtle", "#6b7890"), gold: read("--gold", "#d6b87a"), blue: read("--blue", "#79a8ff"), line: read("--line", "rgba(206,218,240,.18)") };
  };
  const fmt = (value, digits = 2) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return numeric === Infinity ? "∞" : numeric === -Infinity ? "−∞" : "—";
    return numeric.toLocaleString("pt-BR", { maximumFractionDigits: digits, minimumFractionDigits: digits });
  };
  const svgFor = (id) => {
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
    return `<svg viewBox="0 0 86 76" aria-hidden="true">${diagrams[id] || ""}</svg>`;
  };

  for (const [select, values] of [[category, [...new Set(experiments.map((item) => item.category))]], [level, [...new Set(experiments.map((item) => item.level))]], [mode, [...new Set(experiments.map((item) => item.mode))]]]) {
    for (const value of values) select.add(new Option(value, value));
  }

  function drawCards() {
    const query = search.value.trim().toLocaleLowerCase("pt-BR");
    const filtered = experiments.filter((item) => {
      const haystack = `${item.title} ${item.category} ${item.level} ${item.description}`.toLocaleLowerCase("pt-BR");
      return haystack.includes(query) && (!category.value || item.category === category.value) && (!level.value || item.level === level.value) && (!mode.value || item.mode === mode.value);
    });
    catalog.innerHTML = filtered.map((item) => `<button class="lab-card" type="button" data-lab-select="${item.id}" aria-pressed="${state.id === item.id}"><span class="lab-card-art">${svgFor(item.id)}</span><span class="lab-card-body"><span class="lab-card-title">${item.title}<small>${item.status}</small></span><span class="lab-card-meta">${item.category} · ${item.level} · ${item.mode}</span><span class="lab-card-meta">${item.description}</span></span></button>`).join("");
    count.textContent = `${filtered.length} ${filtered.length === 1 ? "experimento" : "experimentos"} disponíveis.`;
    empty.hidden = filtered.length !== 0;
  }

  function updateFilters() { drawCards(); }
  [search, category, level, mode].forEach((element) => element.addEventListener(element === search ? "input" : "change", updateFilters));
  catalog.addEventListener("click", (event) => {
    const button = event.target.closest("[data-lab-select]");
    if (button) selectExperiment(button.dataset.labSelect);
  });

  function selectExperiment(id) {
    const experiment = experimentById.get(id);
    if (!experiment) return;
    stop();
    state.id = id;
    state.time = 0;
    state.records = [];
    state.parameters = initialParameters(experiment);
    drawCards();
    if (experiment.anchor) {
      workspace.hidden = true;
      history.replaceState(null, "", `#${experiment.anchor}`);
      document.getElementById(experiment.anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById(experiment.anchor)?.focus({ preventScroll: true });
      return;
    }
    workspace.hidden = false;
    history.replaceState(null, "", `#lab-${id}`);
    $("#workspace-kicker").textContent = `${experiments.findIndex((item) => item.id === id) + 1} · ${experiment.category.toLocaleUpperCase("pt-BR")}`;
    $("#workspace-title").textContent = experiment.title;
    $("#workspace-description").textContent = experiment.description;
    $("#workspace-mode").textContent = experiment.mode;
    $("#workspace-equation").textContent = experiment.equation;
    $("#workspace-method").textContent = `Modelo analítico · unidades SI · ${experiment.assumptions}`;
    $("#workspace-question").textContent = experiment.question;
    $("#workspace-independent").textContent = experiment.independent;
    $("#workspace-dependent").textContent = experiment.dependent;
    $("#workspace-controlled").textContent = experiment.controlled;
    $("#workspace-assumptions").textContent = experiment.assumptions;
    $("#workspace-hypothesis").value = "";
    $("#workspace-chart").innerHTML = (experiment.charts || []).map((chart) => `<option value="${chart.id}">${chart.label}</option>`).join("");
    buildControls(experiment);
    syncProbeRange();
    updateTimeControls();
    updateRecords();
    $("#workspace-status").textContent = experiment.duration === 0 ? "Modelo estático: altere os parâmetros ou selecione um ponto do gráfico." : "Pronto. Inicie, avance em passos ou selecione um ponto do gráfico.";
    render();
    workspace.scrollIntoView({ behavior: "smooth", block: "start" });
    workspace.setAttribute("tabindex", "-1");
    workspace.focus({ preventScroll: true });
  }

  function buildControls(experiment) {
    const container = $("#workspace-controls");
    container.innerHTML = (experiment.controls || []).map((control) => `<label class="lab-dynamic-control" for="control-${control.id}"><span class="lab-control-header"><span>${control.label}</span><output id="control-out-${control.id}"></output></span><span class="lab-control-row"><input id="control-${control.id}" type="range" min="${control.min}" max="${control.max}" step="${control.step}" value="${control.value}" aria-label="${control.label}"><input id="control-number-${control.id}" type="number" min="${control.min}" max="${control.max}" step="${control.step}" value="${control.value}" aria-label="${control.label} em ${control.unit}"></span><span class="lab-control-unit">Unidade: ${control.unit}</span></label>`).join("");
    for (const control of experiment.controls || []) {
      const range = $(`#control-${control.id}`);
      const numeric = $(`#control-number-${control.id}`);
      range.addEventListener("input", () => setParameter(control, range.value));
      numeric.addEventListener("change", () => {
        const value = Number(numeric.value);
        if (!Number.isFinite(value)) { numeric.value = state.parameters[control.id]; return; }
        setParameter(control, Math.max(control.min, Math.min(control.max, value)));
      });
    }
  }

  function setParameter(control, rawValue) {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) return;
    const existingRange = $(`#control-${control.id}`);
    const minimum = existingRange ? Number(existingRange.min) : control.min;
    const maximum = existingRange ? Number(existingRange.max) : control.max;
    const step = Number(existingRange?.step || control.step || 0.01);
    const bounded = Math.max(minimum, Math.min(maximum, value));
    const snapped = Math.max(minimum, Math.min(maximum, minimum + Math.round((bounded - minimum) / step) * step));
    state.parameters[control.id] = snapped;
    let frictionAdjusted = false;
    if (state.id === "newton" && control.id === "muStatic" && state.parameters.muStatic < state.parameters.muKinetic) {
      state.parameters.muKinetic = state.parameters.muStatic;
      frictionAdjusted = true;
    } else if (state.id === "newton" && control.id === "muKinetic" && state.parameters.muKinetic > state.parameters.muStatic) {
      state.parameters.muStatic = state.parameters.muKinetic;
      frictionAdjusted = true;
    }
    for (const key of [control.id, ...(frictionAdjusted ? [control.id === "muStatic" ? "muKinetic" : "muStatic"] : [])]) {
      const range = $(`#control-${key}`);
      const numeric = $(`#control-number-${key}`);
      if (range && range.value !== String(state.parameters[key])) range.value = String(state.parameters[key]);
      if (numeric) numeric.value = String(state.parameters[key]);
    }
    syncProbeRange();
    state.time = 0;
    updateTimeControls();
    $("#workspace-status").textContent = frictionAdjusted ? "Os coeficientes foram ajustados para manter μₛ ≥ μₖ. Modelo, gráfico e animação foram recalculados." : "Parâmetro alterado. A visualização e o gráfico foram recalculados; o tempo voltou ao início.";
    try { render(); } catch (error) { showError(error); }
  }

  function syncProbeRange() {
    if (!state.id) return;
    const key = state.id === "wave" || state.id === "field" ? "xProbe" : null;
    if (!key) return;
    const range = $(`#control-${key}`);
    const numeric = $(`#control-number-${key}`);
    if (!range || !numeric) return;
    const extent = state.id === "wave" ? Number(state.parameters.wavelength) : 3 * Number(state.parameters.separation);
    range.min = numeric.min = String(-extent);
    range.max = numeric.max = String(extent);
    state.parameters.xProbe = Math.max(-extent, Math.min(extent, Number(state.parameters.xProbe)));
    range.value = numeric.value = String(state.parameters.xProbe);
  }

  function updateTimeControls() {
    const experiment = experimentById.get(state.id);
    if (!experiment || experiment.anchor) return;
    const duration = durationFor(state.id, state.parameters);
    const time = $("#workspace-time");
    time.min = "0";
    time.max = String(duration);
    time.step = String(Math.max(0.001, duration / 1000));
    time.value = String(Math.min(state.time, duration));
    time.disabled = duration === 0;
    $(".lab-time-control").hidden = duration === 0;
    $("#workspace-play").disabled = duration === 0;
    $("#workspace-step").disabled = duration === 0;
    $("#workspace-speed").disabled = duration === 0;
    $("#workspace-time-out").textContent = duration === 0 ? "sem evolução temporal" : `${fmt(state.time)} s`;
    $("#workspace-speed-out").textContent = `${fmt($("#workspace-speed").value, 2).replace(/,00$/, "")}×`;
  }

  $("#workspace-chart").addEventListener("change", () => { try { render(); } catch (error) { showError(error); } });
  $("#workspace-time").addEventListener("input", (event) => {
    state.time = Number(event.target.value);
    stop(false);
    updateTimeControls();
    try { render(); } catch (error) { showError(error); }
  });
  $("#workspace-speed").addEventListener("input", updateTimeControls);
  $("#workspace-play").addEventListener("click", () => {
    if (state.running) { stop(); $("#workspace-status").textContent = "Simulação pausada; o cursor permanece no instante atual."; }
    else {
      const duration = durationFor(state.id, state.parameters);
      if (state.time >= duration) state.time = 0;
      state.running = true;
      state.lastFrame = 0;
      $("#workspace-play").textContent = "Pausar";
      $("#workspace-play").setAttribute("aria-pressed", "true");
      $("#workspace-status").textContent = "Simulação em andamento. O estado é calculado pelas equações descritas.";
      state.frame = requestAnimationFrame(tick);
    }
  });
  $("#workspace-step").addEventListener("click", () => {
    const duration = durationFor(state.id, state.parameters);
    state.time = Math.min(duration, state.time + Math.min(0.1, duration / 20));
    stop(false); updateTimeControls(); render();
  });
  $("#workspace-reset").addEventListener("click", () => {
    stop(); state.time = 0; state.records = []; updateRecords(); updateTimeControls();
    $("#workspace-status").textContent = "Estado inicial restaurado e tabela de medições limpa.";
    try { render(); } catch (error) { showError(error); }
  });

  function stop(resetButton = true) {
    state.running = false;
    state.lastFrame = 0;
    cancelAnimationFrame(state.frame);
    const play = $("#workspace-play");
    if (play) { play.textContent = "Iniciar"; play.setAttribute("aria-pressed", "false"); }
    if (resetButton && state.id) updateTimeControls();
  }

  function tick(timestamp) {
    if (!state.running) return;
    if (state.lastFrame) state.time += Math.min(0.05, (timestamp - state.lastFrame) / 1000) * Number($("#workspace-speed").value);
    state.lastFrame = timestamp;
    const duration = durationFor(state.id, state.parameters);
    if (state.time >= duration) {
      state.time = duration;
      stop();
      $("#workspace-status").textContent = "Simulação concluída. O cursor chegou ao fim do intervalo definido.";
    }
    try { updateTimeControls(); render(); } catch (error) { showError(error); }
    if (state.running) state.frame = requestAnimationFrame(tick);
  }

  function prepareCanvas(element, context) {
    const box = element.getBoundingClientRect();
    const width = Math.max(280, box.width || 280);
    const height = Math.max(220, box.height || 220);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(width * ratio);
    const pixelHeight = Math.round(height * ratio);
    if (element.width !== pixelWidth || element.height !== pixelHeight) { element.width = pixelWidth; element.height = pixelHeight; }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { width, height };
  }

  function lineTo(context, a, b, color, width = 2, dash = []) {
    context.beginPath(); context.setLineDash(dash); context.strokeStyle = color; context.lineWidth = width; context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.stroke(); context.setLineDash([]);
  }
  function arrow(context, x1, y1, x2, y2, color, label = "") {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    lineTo(context, { x: x1, y: y1 }, { x: x2, y: y2 }, color, 2.5);
    context.beginPath(); context.moveTo(x2, y2); context.lineTo(x2 - 8 * Math.cos(angle - 0.48), y2 - 8 * Math.sin(angle - 0.48)); context.lineTo(x2 - 8 * Math.cos(angle + 0.48), y2 - 8 * Math.sin(angle + 0.48)); context.closePath(); context.fillStyle = color; context.fill();
    if (label) { context.fillStyle = color; context.font = "11px system-ui"; context.fillText(label, x2 + 5, y2 - 5); }
  }
  function drawScene(id, p, model) {
    const { width, height } = prepareCanvas(canvas, sceneContext);
    const c = palette();
    const ctx = sceneContext;
    ctx.fillStyle = c.bg; ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = c.line; ctx.lineWidth = 1;
    for (let i = 1; i < 5; i += 1) { const x = width * i / 5; ctx.beginPath(); ctx.moveTo(x, 14); ctx.lineTo(x, height - 24); ctx.stroke(); }
    ctx.font = "12px system-ui"; ctx.fillStyle = c.muted;
    const baseline = height * 0.72;
    const values = model.values;
    if (["mru", "muv", "newton"].includes(id)) {
      const span = Math.max(6, Math.abs(values.x) * 1.25, Math.abs(stateAt(id, p, 0).values.x) + 3);
      const x = width * 0.5 + Math.max(-1, Math.min(1, values.x / span)) * width * 0.38;
      lineTo(ctx, { x: 34, y: baseline + 16 }, { x: width - 24, y: baseline + 16 }, c.muted, 2);
      ctx.fillStyle = c.gold; ctx.fillRect(x - 19, baseline - 16, 38, 32); ctx.fillStyle = c.text; ctx.fillRect(x - 13, baseline - 22, 12, 7); ctx.fillRect(x + 2, baseline - 22, 12, 7);
      ctx.fillStyle = c.muted; ctx.fillText(`x = ${fmt(values.x)} m`, 15, 25);
      if (id === "newton") { const forceScale = Math.min(70, 2 + Math.abs(values.force) * 1.7); arrow(ctx, x, baseline - 2, x + Math.sign(values.force || 1) * forceScale, baseline - 2, c.blue, `F=${fmt(values.force, 1)} N`); ctx.fillText(`fₛ máximo = ${fmt(p.muStatic * p.mass * 9.81, 1)} N`, 15, 44); }
      if (id === "muv") ctx.fillText(`a = ${fmt(values.a)} m/s²`, 15, 44);
    } else if (id === "energy") {
      const left = 35, top = 40, right = width - 35, bottom = height - 35;
      lineTo(ctx, { x: left, y: top }, { x: right, y: bottom }, c.gold, 4);
      lineTo(ctx, { x: left, y: bottom }, { x: right, y: bottom }, c.muted, 2);
      const ratio = Math.min(1, values.s / p.length);
      const x = left + (right - left) * ratio;
      const y = top + (bottom - top) * ratio;
      ctx.fillStyle = c.blue; ctx.beginPath(); ctx.arc(x, y - 9, 11, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = c.text; ctx.fillText(`Eₘ = ${fmt(values.total)} J`, 14, 23);
      ctx.fillStyle = c.muted; ctx.fillText(`Eₚ ${fmt(values.potential)} J · E꜀ ${fmt(values.kinetic)} J`, 14, height - 9);
    } else if (id === "collision") {
      const pos1 = values.x1, pos2 = values.x2;
      const maxPosition = Math.max(2, Math.abs(pos1), Math.abs(pos2), Math.abs(values.x1 - values.x2)) * 1.2;
      const mapX = (x) => width / 2 + x / maxPosition * width * 0.42;
      lineTo(ctx, { x: 22, y: baseline + 17 }, { x: width - 22, y: baseline + 17 }, c.muted, 2);
      for (const [xValue, mass, color] of [[pos1, p.mass1, c.gold], [pos2, p.mass2, c.blue]]) {
        const x = mapX(xValue); ctx.fillStyle = color; ctx.fillRect(x - 22, baseline - 19, 44, 34); ctx.fillStyle = c.text; ctx.beginPath(); ctx.arc(x - 12, baseline + 17, 5, 0, 7); ctx.arc(x + 12, baseline + 17, 5, 0, 7); ctx.fill(); ctx.fillStyle = c.bg; ctx.fillText(`${fmt(mass, 1)} kg`, x - 17, baseline + 2);
      }
      ctx.fillStyle = c.muted; ctx.fillText(state.time < 2 ? "Antes do impacto" : "Depois do impacto", 14, 24);
      if (Math.abs(state.time - 2) < 0.18) ctx.fillText("Colisão", width / 2 - 18, baseline - 30);
    } else if (id === "spring") {
      const anchor = 48; const center = width * 0.59; const scale = Math.min(120, width * 0.25 / p.amplitude); const blockX = center + values.x * scale;
      lineTo(ctx, { x: anchor, y: baseline - 47 }, { x: anchor, y: baseline + 47 }, c.muted, 4);
      const start = anchor, end = blockX - 24; const segments = 12;
      ctx.beginPath(); ctx.moveTo(start, baseline);
      for (let i = 1; i <= segments; i += 1) { const x = start + (end - start) * i / segments; const y = baseline + (i === segments ? 0 : (i % 2 ? -1 : 1) * 10); ctx.lineTo(x, y); }
      ctx.strokeStyle = c.gold; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = c.blue; ctx.fillRect(blockX - 24, baseline - 21, 48, 42);
      ctx.fillStyle = c.muted; ctx.fillText(`x=${fmt(values.x)} m`, 13, 23); ctx.fillText(`T=${fmt(values.period)} s`, 13, 42);
    } else if (id === "wave") {
      const amplitudeScale = Math.min(100, height * 0.28 / p.amplitude); const mid = height / 2; const xMin = -p.wavelength; const xMax = p.wavelength;
      lineTo(ctx, { x: 20, y: mid }, { x: width - 20, y: mid }, c.muted, 1);
      ctx.beginPath();
      for (let i = 0; i <= 240; i += 1) { const xValue = xMin + (xMax - xMin) * i / 240; const yValue = p.amplitude * Math.sin(2 * Math.PI * (xValue / p.wavelength - p.frequency * state.time)); const x = 20 + (width - 40) * i / 240; const y = mid - yValue * amplitudeScale; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.strokeStyle = c.gold; ctx.lineWidth = 2.5; ctx.stroke();
      const markerX = 20 + (p.xProbe - xMin) / (xMax - xMin) * (width - 40); const markerY = mid - values.y * amplitudeScale; ctx.fillStyle = c.blue; ctx.beginPath(); ctx.arc(markerX, markerY, 6, 0, 7); ctx.fill();
      ctx.fillStyle = c.muted; ctx.fillText(`v = λf = ${fmt(values.waveSpeed)} m/s`, 14, 23);
    } else if (id === "ohm") {
      const left = 45, right = width - 44, top = 55, bottom = height - 55;
      ctx.strokeStyle = c.text; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, bottom); ctx.lineTo(right, bottom); ctx.lineTo(right, top); ctx.lineTo(left, top); ctx.stroke();
      ctx.fillStyle = c.gold; ctx.fillRect(left - 5, height / 2 - 18, 10, 36); ctx.strokeStyle = c.bg; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(left - 7, height / 2 - 8); ctx.lineTo(left + 7, height / 2 - 8); ctx.moveTo(left - 4, height / 2 + 6); ctx.lineTo(left + 4, height / 2 + 6); ctx.stroke();
      ctx.strokeStyle = c.blue; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(width * 0.52, height / 2 - 18); ctx.lineTo(width * 0.65, height / 2 - 18); ctx.lineTo(width * 0.69, height / 2 - 27); ctx.lineTo(width * 0.75, height / 2 - 9); ctx.lineTo(width * 0.81, height / 2 - 27); ctx.lineTo(width * 0.87, height / 2 - 9); ctx.lineTo(width * 0.91, height / 2 - 18); ctx.stroke();
      ctx.fillStyle = c.text; ctx.font = "13px system-ui"; ctx.fillText("+", left - 4, height / 2 - 25); ctx.fillText("−", left - 4, height / 2 + 29); ctx.fillStyle = c.muted; ctx.fillText(`V=${fmt(values.voltage, 1)} V`, width * 0.54, height / 2 + 12); ctx.fillText(`R=${fmt(values.resistance, 1)} Ω`, width * 0.71, height / 2 + 13); ctx.fillText(`I=${fmt(values.current, 3)} A · P=${fmt(values.power, 2)} W`, 14, 24);
    } else if (id === "lens") {
      const center = width * 0.54; const axisY = height * 0.67; const scale = Math.min(60, (width * 0.42) / Math.max(p.objectDistance, Math.abs(Number.isFinite(values.imageDistance) ? values.imageDistance : 0), p.focalLength, 0.5));
      lineTo(ctx, { x: 12, y: axisY }, { x: width - 12, y: axisY }, c.muted, 1.5);
      ctx.strokeStyle = c.blue; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(center, axisY - 42, 9, 52, 0, 0, 2 * Math.PI); ctx.stroke();
      const objectX = center - p.objectDistance * scale; const objectH = 43; arrow(ctx, objectX, axisY, objectX, axisY - objectH, c.gold, "objeto");
      if (Number.isFinite(values.imageDistance) && Math.abs(values.imageDistance) < 30) {
        const imageX = center + values.imageDistance * scale; const imageH = objectH * values.magnification; const imageTop = axisY - imageH; const objectTop = axisY - objectH; const rightEdge = width - 10; const lensPoint = { x: center, y: objectTop };
        if (values.imageDistance > 0) {
          lineTo(ctx, { x: objectX, y: objectTop }, { x: imageX, y: imageTop }, c.gold, 1.4);
          lineTo(ctx, { x: objectX, y: objectTop }, lensPoint, c.blue, 1.4);
          lineTo(ctx, lensPoint, { x: imageX, y: imageTop }, c.blue, 1.4);
        } else {
          const centralSlope = (axisY - objectTop) / (center - objectX);
          lineTo(ctx, { x: objectX, y: objectTop }, { x: rightEdge, y: axisY + centralSlope * (rightEdge - center) }, c.gold, 1.4);
          lineTo(ctx, { x: imageX, y: imageTop }, { x: center, y: axisY }, c.gold, 1.2, [4, 4]);
          lineTo(ctx, { x: objectX, y: objectTop }, lensPoint, c.blue, 1.4);
          const outgoingY = lensPoint.y + (rightEdge - center) * (lensPoint.y - imageTop) / (center - imageX);
          lineTo(ctx, lensPoint, { x: rightEdge, y: outgoingY }, c.blue, 1.4);
          lineTo(ctx, { x: imageX, y: imageTop }, lensPoint, c.blue, 1.2, [4, 4]);
        }
        arrow(ctx, imageX, axisY, imageX, imageTop, c.blue, `imagem ${values.image}`);
        const f = p.focalLength * scale; ctx.fillStyle = c.muted; ctx.fillText("F", center - f - 3, axisY + 17); ctx.fillText("F", center + f - 3, axisY + 17);
      } else { ctx.fillStyle = c.blue; ctx.fillText("Imagem no infinito (objeto no foco)", center + 12, 25); }
      ctx.fillStyle = c.muted; ctx.fillText(`f=${fmt(p.focalLength)} m · dᵢ=${fmt(values.imageDistance)} m · m=${fmt(values.magnification)}`, 12, 24);
    } else if (id === "calorimetry") {
      const valuesRange = [0, 100]; const lefts = [width * 0.28, width * 0.68]; const temps = [values.temperature1, values.temperature2];
      for (let i = 0; i < 2; i += 1) {
        const x = lefts[i]; const top = 48, bottom = height - 46, barHeight = bottom - top; ctx.strokeStyle = c.line; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke(); const y = bottom - (temps[i] - valuesRange[0]) / (valuesRange[1] - valuesRange[0]) * barHeight; ctx.strokeStyle = i ? c.blue : c.gold; ctx.beginPath(); ctx.moveTo(x, bottom); ctx.lineTo(x, y); ctx.stroke(); ctx.fillStyle = i ? c.blue : c.gold; ctx.beginPath(); ctx.arc(x, y, 10, 0, 7); ctx.fill(); ctx.fillStyle = c.text; ctx.fillText(`${fmt(temps[i], 1)} °C`, x - 26, top - 10); ctx.fillStyle = c.muted; ctx.fillText(i ? "Corpo frio" : "Corpo quente", x - 28, bottom + 22);
      }
      ctx.fillStyle = c.muted; ctx.fillText(`Equilíbrio previsto: ${fmt(values.equilibrium, 1)} °C`, 12, 23);
    } else if (id === "field") {
      const separation = p.separation; const center = width / 2; const scale = Math.min(100, width * 0.32 / (3 * separation)); const y = height * 0.55; const chargeX = [-separation / 2, separation / 2].map((x) => center + x * scale);
      lineTo(ctx, { x: 22, y }, { x: width - 22, y }, c.muted, 1.5);
      for (let i = 0; i < 2; i += 1) { const charge = Number(i ? p.q2 : p.q1); ctx.fillStyle = charge > 0 ? c.gold : charge < 0 ? c.blue : c.muted; ctx.beginPath(); ctx.arc(chargeX[i], y, 12, 0, 7); ctx.fill(); ctx.fillStyle = c.bg; ctx.font = "bold 14px system-ui"; ctx.fillText(charge > 0 ? "+" : charge < 0 ? "−" : "0", chargeX[i] - 4, y + 5); }
      const probeX = center + p.xProbe * scale; ctx.strokeStyle = c.text; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(probeX, 25); ctx.lineTo(probeX, height - 25); ctx.stroke(); ctx.setLineDash([]);
      if (Number.isFinite(values.electricField)) arrow(ctx, probeX, y - 35, probeX + Math.sign(values.electricField) * Math.min(75, 16 + Math.log10(1 + Math.abs(values.electricField)) * 12), y - 35, c.blue, `Eₓ=${fmt(values.electricField, 1)} N/C`);
      else { ctx.fillStyle = c.text; ctx.fillText("Campo singular na posição da carga ideal", 14, 24); }
      ctx.fillStyle = c.muted; ctx.fillText(`q₁=${fmt(p.q1, 2)} nC · q₂=${fmt(p.q2, 2)} nC`, 12, height - 10);
    }
  }

  function drawGraph(id, p, time) {
    const { width, height } = prepareCanvas(graphCanvas, graphContext);
    const ctx = graphContext; const c = palette();
    ctx.fillStyle = c.bg; ctx.fillRect(0, 0, width, height);
    const graph = graphFor(id, p, time, $("#workspace-chart").value);
    const valid = graph.series.flatMap((series) => series.points.filter(Boolean));
    let xMin = graph.xMin ?? Math.min(...valid.map((point) => point.x));
    let xMax = graph.xMax ?? Math.max(...valid.map((point) => point.x));
    let yMin = graph.valueRange?.[0] ?? Math.min(...valid.map((point) => point.y));
    let yMax = graph.valueRange?.[1] ?? Math.max(...valid.map((point) => point.y));
    const cursors = graph.series.map((series) => series.cursor).filter((point) => point && Number.isFinite(point.y));
    if (cursors.length) { yMin = Math.min(yMin, ...cursors.map((point) => point.y)); yMax = Math.max(yMax, ...cursors.map((point) => point.y)); }
    if (!Number.isFinite(xMin) || !Number.isFinite(xMax)) { xMin = 0; xMax = 1; }
    if (Math.abs(xMax - xMin) < 1e-12) { xMin -= 1; xMax += 1; }
    if (!Number.isFinite(yMin) || !Number.isFinite(yMax)) { yMin = -1; yMax = 1; }
    if (Math.abs(yMax - yMin) < 1e-10) { const pad = Math.max(1, Math.abs(yMin) * 0.15); yMin -= pad; yMax += pad; }
    else { const pad = (yMax - yMin) * 0.1; yMin -= pad; yMax += pad; }
    const plot = { left: 48, right: width - 13, top: 18, bottom: height - 42 };
    const px = (x) => plot.left + (x - xMin) / (xMax - xMin) * (plot.right - plot.left);
    const py = (y) => plot.bottom - (y - yMin) / (yMax - yMin) * (plot.bottom - plot.top);
    ctx.font = "10px system-ui"; ctx.lineWidth = 1; ctx.strokeStyle = c.line; ctx.fillStyle = c.muted;
    for (let i = 0; i <= 4; i += 1) {
      const x = plot.left + (plot.right - plot.left) * i / 4; const y = plot.top + (plot.bottom - plot.top) * i / 4;
      ctx.beginPath(); ctx.moveTo(x, plot.top); ctx.lineTo(x, plot.bottom); ctx.stroke(); ctx.beginPath(); ctx.moveTo(plot.left, y); ctx.lineTo(plot.right, y); ctx.stroke();
      ctx.fillText(fmt(xMin + (xMax - xMin) * i / 4, 2), x - 12, plot.bottom + 15);
      ctx.fillText(fmt(yMax - (yMax - yMin) * i / 4, 2), 3, y + 3);
    }
    ctx.strokeStyle = c.text; ctx.beginPath(); ctx.moveTo(plot.left, plot.top); ctx.lineTo(plot.left, plot.bottom); ctx.lineTo(plot.right, plot.bottom); ctx.stroke();
    graph.series.forEach((series, index) => {
      ctx.beginPath(); let drawing = false;
      for (const point of series.points) {
        if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) { drawing = false; continue; }
        const x = px(point.x), y = py(point.y);
        if (!drawing) { ctx.moveTo(x, y); drawing = true; } else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = index % 2 ? c.blue : c.gold; ctx.lineWidth = 2.2; ctx.stroke();
      if (series.cursor && Number.isFinite(series.cursor.y)) {
        const x = px(series.cursor.x), y = py(series.cursor.y);
        if (Number.isFinite(x) && Number.isFinite(y) && x >= plot.left && x <= plot.right && y >= plot.top && y <= plot.bottom) {
          ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fillStyle = index % 2 ? c.blue : c.gold; ctx.fill(); ctx.strokeStyle = c.text; ctx.lineWidth = 1.5; ctx.stroke();
        }
      }
    });
    if (graph.reference && Number.isFinite(graph.reference.y)) { const y = py(graph.reference.y); ctx.strokeStyle = c.subtle; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(plot.left, y); ctx.lineTo(plot.right, y); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = c.muted; ctx.fillText(graph.reference.label, plot.left + 3, Math.max(12, y - 4)); }
    ctx.fillStyle = c.text; ctx.font = "10px system-ui"; ctx.fillText(graph.xLabel, Math.max(plot.left, (plot.left + plot.right) / 2 - 38), height - 5); ctx.save(); ctx.translate(11, (plot.top + plot.bottom) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(graph.yLabel, -42, 0); ctx.restore();
    if (graph.series.length > 1) { graph.series.forEach((series, index) => { ctx.fillStyle = index % 2 ? c.blue : c.gold; ctx.fillRect(plot.left + index * 110, 3, 8, 8); ctx.fillStyle = c.muted; ctx.fillText(series.label, plot.left + index * 110 + 12, 11); }); }
    state.graph = graph; state.plot = { ...plot, xMin, xMax };
  }

  const readoutDefinitions = {
    mru: [["x", "Posição", "m"], ["v", "Velocidade", "m/s"], ["a", "Aceleração", "m/s²"]],
    muv: [["x", "Posição", "m"], ["v", "Velocidade", "m/s"], ["a", "Aceleração", "m/s²"]],
    newton: [["force", "Força aplicada", "N"], ["friction", "Atrito resultante", "N"], ["normal", "Força normal", "N"], ["a", "Aceleração", "m/s²"], ["x", "Deslocamento", "m"]],
    energy: [["kinetic", "Energia cinética", "J"], ["potential", "Energia potencial", "J"], ["total", "Energia mecânica", "J"], ["v", "Velocidade", "m/s"]],
    collision: [["v1", "Velocidade carrinho 1", "m/s"], ["v2", "Velocidade carrinho 2", "m/s"], ["momentum", "Momento linear total", "kg·m/s"], ["kinetic", "Energia cinética total", "J"]],
    spring: [["x", "Posição", "m"], ["v", "Velocidade", "m/s"], ["kinetic", "Energia cinética", "J"], ["potential", "Energia potencial elástica", "J"], ["period", "Período", "s"]],
    wave: [["y", "Deslocamento no marcador", "m"], ["waveSpeed", "Velocidade da onda", "m/s"], ["wavelength", "Comprimento de onda", "m"], ["frequency", "Frequência", "Hz"]],
    ohm: [["voltage", "Tensão", "V"], ["resistance", "Resistência", "Ω"], ["current", "Corrente", "A"], ["power", "Potência", "W"]],
    lens: [["imageDistance", "Distância da imagem", "m"], ["magnification", "Ampliação", "adimensional"], ["f", "Distância focal", "m"]],
    calorimetry: [["temperature1", "Temperatura do corpo quente", "°C"], ["temperature2", "Temperatura do corpo frio", "°C"], ["equilibrium", "Equilíbrio previsto", "°C"], ["energyBalance", "Balanço de energia", "J"]],
    field: [["electricField", "Campo elétrico Eₓ", "N/C"], ["xProbe", "Posição do marcador", "m"], ["q1", "Carga 1", "nC"], ["q2", "Carga 2", "nC"]]
  };

  function renderReadouts(values) {
    const definitions = readoutDefinitions[state.id] || [];
    $("#workspace-readouts").innerHTML = definitions.map(([key, label, unit]) => `<div><span>${label}</span><b>${fmt(values[key])} ${unit}</b></div>`).join("");
    $("#workspace-time-label").textContent = durationFor(state.id, state.parameters) ? `t = ${fmt(state.time)} s` : "modelo estático";
  }

  function render() {
    const model = stateAt(state.id, state.parameters, state.time);
    drawScene(state.id, state.parameters, model);
    drawGraph(state.id, state.parameters, state.time);
    renderReadouts(model.values);
    updateTimeControls();
  }

  function showError(error) {
    stop();
    $("#workspace-status").textContent = `Não foi possível atualizar esta simulação: ${error.message}`;
  }

  function graphSelection(x) {
    const id = state.id;
    if (["mru", "muv", "newton", "energy", "collision", "spring", "calorimetry"].includes(id)) {
      state.time = Math.max(0, Math.min(durationFor(id, state.parameters), x)); stop(false); updateTimeControls();
    } else {
      const key = { wave: "xProbe", lens: "objectDistance", field: "xProbe", ohm: "voltage" }[id];
      if (!key) return;
      const control = experimentById.get(id).controls.find((item) => item.id === key);
      const input = $(`#control-${key}`);
      const min = Math.max(Number(input.min), state.plot.xMin); const max = Math.min(Number(input.max), state.plot.xMax);
      const value = Math.max(min, Math.min(max, x));
      setParameter(control, value);
    }
    try { render(); } catch (error) { showError(error); }
  }
  graphCanvas.addEventListener("click", (event) => {
    if (!state.plot) return;
    const rect = graphCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    if (x < state.plot.left || x > state.plot.right) return;
    graphSelection(state.plot.xMin + (x - state.plot.left) / (state.plot.right - state.plot.left) * (state.plot.xMax - state.plot.xMin));
  });
  graphCanvas.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const step = (state.plot.xMax - state.plot.xMin) / 100 * (event.shiftKey ? 10 : 1);
    const current = ["mru", "muv", "newton", "energy", "collision", "spring", "calorimetry"].includes(state.id) ? state.time : Number(state.parameters[{ wave: "xProbe", lens: "objectDistance", field: "xProbe", ohm: "voltage" }[state.id]]);
    graphSelection(current + (event.key === "ArrowRight" ? step : -step));
  });

  $("#workspace-record").addEventListener("click", () => {
    const record = sampleValues(state.id, state.parameters, state.time);
    state.records.push(record);
    updateRecords();
    $("#workspace-status").textContent = `Medição ${state.records.length} registrada no instante ${fmt(state.time)} s.`;
  });
  $("#workspace-export").addEventListener("click", () => {
    if (!state.records.length) return;
    const keys = [...new Set(state.records.flatMap((row) => Object.keys(row)))];
    const csv = [keys.join(","), ...state.records.map((row) => keys.map((key) => {
      const value = row[key];
      return typeof value === "string" ? `"${value.replaceAll('"', '""')}"` : Number.isFinite(value) ? String(value) : "";
    }).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `medicoes-${state.id}.csv`; link.click(); URL.revokeObjectURL(url);
  });

  function updateRecords() {
    const head = $("#workspace-table-head"); const body = $("#workspace-table-body");
    const keys = state.records.length ? [...new Set(state.records.flatMap((row) => Object.keys(row)))] : ["time"];
    const headings = { time: "Tempo (s)", x: "x (m)", v: "v (m/s)", a: "a (m/s²)", y: "y (m)", force: "Força (N)", friction: "Atrito (N)", normal: "Normal (N)", s: "Percurso (m)", kinetic: "E cinética (J)", potential: "E potencial (J)", total: "E total (J)", x1: "x₁ (m)", x2: "x₂ (m)", v1: "v₁ (m/s)", v2: "v₂ (m/s)", momentum: "Momento (kg·m/s)", period: "Período (s)", waveSpeed: "v onda (m/s)", wavelength: "λ (m)", frequency: "f (Hz)", voltage: "V (V)", resistance: "R (Ω)", current: "I (A)", power: "P (W)", imageDistance: "dᵢ (m)", magnification: "Ampliação", f: "foco (m)", temperature1: "T₁ (°C)", temperature2: "T₂ (°C)", equilibrium: "T equilíbrio (°C)", energyBalance: "Balanço (J)", electricField: "Eₓ (N/C)", xProbe: "x marcador (m)", q1: "q₁ (nC)", q2: "q₂ (nC)", restitution: "Restituição", kineticBefore: "E antes (J)", kineticAfter: "E depois (J)", momentumBefore: "p antes", momentumAfter: "p depois", collisionTime: "t colisão (s)", singular: "Singularidade", image: "Imagem", omega: "ω (rad/s)" };
    head.innerHTML = `<tr>${keys.map((key) => `<th scope="col">${headings[key] || key}</th>`).join("")}</tr>`;
    body.innerHTML = state.records.map((row) => `<tr>${keys.map((key) => `<td>${typeof row[key] === "boolean" ? (row[key] ? "sim" : "não") : typeof row[key] === "number" ? fmt(row[key], 3) : row[key] ?? "—"}</td>`).join("")}</tr>`).join("");
    $("#workspace-export").disabled = !state.records.length;
    $("#workspace-table-caption").textContent = state.records.length ? `${state.records.length} medição(ões) simulada(s); valores calculados, não observações de experimento real.` : "Medições simuladas; não são observações de um experimento real.";
  }

  const resizeObserver = new ResizeObserver(() => { if (state.id && !workspace.hidden) { try { render(); } catch { /* O próximo evento de controle informará erros do modelo. */ } } });
  resizeObserver.observe(workspace);
  const hash = decodeURIComponent(location.hash.slice(1));
  const initialId = hash.startsWith("lab-") ? hash.slice(4) : null;
  drawCards();
  if (experimentById.has(initialId) && !experimentById.get(initialId).anchor) selectExperiment(initialId);
  window.addEventListener("beforeunload", () => { stop(); resizeObserver.disconnect(); });
}

