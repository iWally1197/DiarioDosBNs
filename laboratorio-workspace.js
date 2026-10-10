import { experiments, experimentById, initialParameters } from "./laboratorio-catalogo.js?v=lab-optics-20261010-1";
import { durationFor, graphFor, sampleValues, stateAt } from "./laboratorio-advanced-core.js?v=lab-optics-20261010-1";
import { drawOpticalScene, opticalPointerToWorld } from "./laboratorio-optica-render.js?v=lab-optics-fullscreen-20261010-1";
import { opticalViewFor } from "./laboratorio-optica-core.js?v=lab-optics-fullscreen-20261010-1";

const $ = (selector) => document.querySelector(selector);
const isSphericalMirror = (id) => id === "optics-concave-mirror" || id === "optics-convex-mirror";
const requestedId = new URLSearchParams(location.search).get("topico");
if ($("[data-lab-experiment-page]")) initializeExperimentPage(requestedId);

function initializeExperimentPage(topicId) {
  const workspace = $("#lab-workspace");
  const canvas = $("#workspace-canvas");
  const graphCanvas = $("#workspace-graph");
  const fullscreenButton = $("#workspace-fullscreen");
  const controlsToggleButton = $("#workspace-controls-toggle");
  const controlsSidebar = $("#workspace-controls-sidebar");
  const sceneContext = canvas.getContext("2d");
  const graphContext = graphCanvas.getContext("2d");
  const state = { id: null, parameters: {}, time: 0, running: false, lastFrame: 0, frame: 0, records: [], graph: null, plot: null };
  const palette = () => {
    const css = getComputedStyle(document.documentElement);
    const read = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
    return { bg: read("--surface-2", "#131f32"), surface: read("--surface", "#101a2c"), text: read("--text", "#f4f5f8"), muted: read("--muted", "#9aa6b9"), subtle: read("--subtle", "#6b7890"), gold: read("--gold", "#d6b87a"), blue: read("--blue", "#79a8ff"), line: read("--line", "rgba(206,218,240,.18)") };
  };
  const fmt = (value, digits = 2) => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "string") return value;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return numeric === Infinity ? "∞" : numeric === -Infinity ? "−∞" : "—";
    return numeric.toLocaleString("pt-BR", { maximumFractionDigits: digits, minimumFractionDigits: digits });
  };
  const currentTimeUnit = () => state.id?.startsWith("optics-") ? "ns" : experimentById.get(state.id)?.timeUnit || "s";
  function selectExperiment(id) {
    const experiment = experimentById.get(id);
    if (!experiment) return;
    stop();
    state.id = id;
    state.time = 0;
    state.records = [];
    state.parameters = initialParameters(experiment);
    $("#lab-topic-not-found").hidden = true;
    $("#lab-topic-kicker").textContent = `${experiments.findIndex((item) => item.id === id) + 1} · ${experiment.category.toLocaleUpperCase("pt-BR")}`;
    $("#lab-topic-name").textContent = experiment.title;
    $("#lab-topic-description").textContent = experiment.description;
    $("#lab-topic-crumb").textContent = experiment.title;
    document.title = `${experiment.title} — Laboratório Virtual de Física`;
    document.querySelectorAll("[data-lab-special]").forEach((section) => { section.hidden = section.dataset.labSpecial !== id; });
    if (experiment.anchor) {
      workspace.hidden = true;
      const special = document.querySelector(`[data-lab-special="${id}"]`);
      special?.scrollIntoView({ behavior: "auto", block: "start" });
      special?.focus({ preventScroll: true });
      return;
    }
    workspace.hidden = false;
    const mirrorWorkspace = isSphericalMirror(id);
    workspace.classList.toggle("lab-workspace--mirror", mirrorWorkspace);
    fullscreenButton.hidden = !mirrorWorkspace;
    controlsToggleButton.hidden = true;
    controlsSidebar.classList.remove("is-open");
    controlsToggleButton.setAttribute("aria-expanded", "false");
    controlsToggleButton.textContent = "Controles";
    $("#workspace-title").textContent = experiment.title;
    $("#workspace-description").textContent = experiment.description;
    const sceneCaptions = {
      mru: "O trilho e a régua ficam fixos. O é a origem do referencial; o carrinho avança com velocidade constante e sua posição é medida em relação à pista.",
      muv: "A pista, a origem O e a escala permanecem fixas durante toda a reprodução. Assim você vê o carrinho ganhar ou perder velocidade no mesmo referencial enquanto x(t) e v(t) mudam.",
      newton: "O carrinho está em uma pista fixa. As setas mostram as forças e o movimento é calculado em relação à origem O; se o atrito estático equilibrar a força, ele permanece em repouso.",
      energy: "Um carrinho desce a rampa ideal. A coordenada s parte da origem O no alto; altura, velocidade e energias vêm do mesmo movimento.",
      collision: "Os dois carrinhos percorrem uma pista e uma régua fixas. As posições e velocidades antes e depois do contato usam esse mesmo referencial.",
      spring: "Um carrinho oscila preso à mola. O é o ponto de equilíbrio fixo; x indica o deslocamento do carrinho em relação a essa origem.",
      wave: "A corda e o eixo x formam o referencial fixo: os pontos materiais da corda oscilam verticalmente enquanto o padrão da onda se desloca para +x.",
      "optics-reflection": "Espelho, normal e feixe são calculados pela geometria do raio. Arraste o centro para reposicionar o espelho, uma extremidade para girá-lo ou use os controles para mover o ponto de incidência.",
      "optics-refraction": "A direção do raio atravessando a interface é calculada pela lei de Snell. Se o ângulo crítico for ultrapassado, o modelo mostra reflexão interna total.",
      "optics-concave-mirror": "Os raios refletem em pontos de uma superfície esférica real. A posição da imagem indicada usa a aproximação paraxial, permitindo observar aberração fora do eixo.",
      "optics-convex-mirror": "O espelho convexo espalha os raios; seus prolongamentos tracejados localizam a imagem virtual. A posição calculada usa a aproximação paraxial."
    };
    $("#workspace-scene-caption").textContent = sceneCaptions[state.id] || "A cena, a animação e o gráfico representam o mesmo modelo físico e compartilham seus parâmetros.";
    canvas.setAttribute("aria-label", `${experiment.title}. ${sceneCaptions[state.id] || "Animação física interativa."}`);
    canvas.style.cursor = state.id === "optics-reflection" ? "grab" : "default";
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
    $("#workspace-step").textContent = `Avançar ${fmt(durationFor(state.id, state.parameters) / 20, 2)} ${currentTimeUnit()}`;
    $("#workspace-status").textContent = "Pronto. Inicie, avance em passos ou selecione um ponto do gráfico.";
    render();
    workspace.scrollIntoView({ behavior: "auto", block: "start" });
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
    $("#workspace-time-out").textContent = duration === 0 ? "sem evolução temporal" : `${fmt(state.time)} ${currentTimeUnit()}`;
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
    state.time = Math.min(duration, state.time + duration / 20);
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

  fullscreenButton.addEventListener("click", async () => {
    if (!isSphericalMirror(state.id)) return;
    try {
      if (document.fullscreenElement === workspace) await document.exitFullscreen();
      else await workspace.requestFullscreen({ navigationUI: "hide" });
    } catch {
      $("#workspace-status").textContent = "Não foi possível abrir em tela cheia neste navegador. Verifique se a permissão de tela cheia está liberada.";
    }
  });

  controlsToggleButton.addEventListener("click", () => {
    const open = controlsSidebar.classList.toggle("is-open");
    controlsToggleButton.setAttribute("aria-expanded", String(open));
    controlsToggleButton.textContent = open ? "Fechar controles" : "Controles";
  });

  document.addEventListener("fullscreenchange", () => {
    const isFullscreen = document.fullscreenElement === workspace;
    fullscreenButton.textContent = isFullscreen ? "Sair da tela cheia" : "Tela cheia";
    fullscreenButton.setAttribute("aria-label", isFullscreen ? "Sair da tela cheia" : "Abrir a simulação em tela cheia");
    controlsToggleButton.hidden = !(isFullscreen && isSphericalMirror(state.id));
    if (!isFullscreen) {
      controlsSidebar.classList.remove("is-open");
      controlsToggleButton.setAttribute("aria-expanded", "false");
      controlsToggleButton.textContent = "Controles";
    }
    if (state.id && !workspace.hidden) requestAnimationFrame(() => { try { render(); } catch (error) { showError(error); } });
  });

  function tick(timestamp) {
    if (!state.running) return;
    if (state.lastFrame) {
      const clockRate = state.id?.startsWith("optics-") ? 4 : 1;
      state.time += Math.min(0.05, (timestamp - state.lastFrame) / 1000) * Number($("#workspace-speed").value) * clockRate;
    }
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
  function roundedRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath(); context.moveTo(x + r, y); context.lineTo(x + width - r, y); context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r); context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height); context.quadraticCurveTo(x, y + height, x, y + height - r); context.lineTo(x, y + r); context.quadraticCurveTo(x, y, x + r, y); context.closePath();
  }
  function drawBackdrop(context, width, height, c) {
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, c.surface); gradient.addColorStop(0.58, c.bg); gradient.addColorStop(1, c.surface);
    context.fillStyle = gradient; context.fillRect(0, 0, width, height);
    context.strokeStyle = c.line; context.lineWidth = 1; context.globalAlpha = 0.4;
    for (let i = 1; i <= 3; i += 1) { const y = height * i / 5; context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); }
    context.globalAlpha = 1;
  }
  function drawCart(context, centerX, wheelLineY, bodyColor, c, label = "A", orientation = 0, wheelRotation = 0, size = 1) {
    context.save(); context.translate(centerX, wheelLineY); context.rotate(orientation); context.scale(size, size);
    context.fillStyle = "rgba(0,0,0,.28)"; context.beginPath(); context.ellipse(0, 9, 37, 7, 0, 0, 2 * Math.PI); context.fill();
    const body = context.createLinearGradient(0, -34, 0, -5); body.addColorStop(0, c.text); body.addColorStop(0.22, bodyColor); body.addColorStop(1, bodyColor);
    context.fillStyle = body; roundedRect(context, -34, -31, 68, 22, 7); context.fill();
    context.fillStyle = c.line; roundedRect(context, -15, -28, 25, 9, 3); context.fill();
    context.fillStyle = c.text; context.globalAlpha = 0.8; roundedRect(context, -13, -27, 20, 6, 2); context.fill(); context.globalAlpha = 1;
    context.fillStyle = bodyColor; roundedRect(context, 10, -25, 19, 13, 4); context.fill();
    context.fillStyle = c.muted; roundedRect(context, -37, -14, 75, 5, 2); context.fill();
    for (const wheelX of [-21, 21]) {
      context.fillStyle = "#111722"; context.beginPath(); context.arc(wheelX, -1, 8, 0, 2 * Math.PI); context.fill();
      context.fillStyle = c.text; context.beginPath(); context.arc(wheelX, -1, 3.5, 0, 2 * Math.PI); context.fill();
      context.save(); context.translate(wheelX, -1); context.rotate(wheelRotation); context.strokeStyle = c.muted; context.lineWidth = 1.2;
      for (let spoke = 0; spoke < 4; spoke += 1) { context.rotate(Math.PI / 2); context.beginPath(); context.moveTo(0, -2); context.lineTo(0, -6); context.stroke(); }
      context.restore();
    }
    context.fillStyle = c.bg; context.font = "bold 10px system-ui"; context.textAlign = "center"; context.fillText(label, 0, -15); context.textAlign = "start";
    context.restore();
  }
  function drawTrack(context, width, y, c, left = 18, right = width - 18) {
    context.fillStyle = "rgba(0,0,0,.13)"; context.fillRect(left, y + 5, right - left, 18);
    context.fillStyle = c.muted; context.globalAlpha = 0.7;
    for (let x = left + 3; x < right; x += 24) { roundedRect(context, x, y - 4, 5, 13, 2); context.fill(); }
    context.globalAlpha = 1;
    lineTo(context, { x: left, y }, { x: right, y }, c.text, 2);
    lineTo(context, { x: left, y: y + 5 }, { x: right, y: y + 5 }, c.line, 2);
  }
  function drawReferenceAxis(context, range, mapX, y, c, topY) {
    const left = mapX(range.min), right = mapX(range.max);
    lineTo(context, { x: left, y }, { x: right, y }, c.text, 1.5);
    arrow(context, right - 12, y, right, y, c.text, "x (m)");
    context.font = "10px system-ui"; context.fillStyle = c.muted; context.textAlign = "center";
    for (let i = 0; i <= 4; i += 1) {
      const value = range.min + (range.max - range.min) * i / 4; const x = mapX(value);
      lineTo(context, { x, y: y - 4 }, { x, y: y + 5 }, c.muted, 1);
      context.fillText(fmt(value, Math.abs(value) >= 10 ? 0 : 1), x, y + 18);
    }
    context.textAlign = "start";
    if (range.min <= 0 && range.max >= 0) {
      const origin = mapX(0); context.strokeStyle = c.blue; context.setLineDash([4, 4]); context.beginPath(); context.moveTo(origin, topY); context.lineTo(origin, y - 4); context.stroke(); context.setLineDash([]);
      context.fillStyle = c.blue; context.font = "bold 10px system-ui"; context.textAlign = "center"; context.fillText("O · origem fixa", origin, y - 9); context.textAlign = "start";
    }
  }
  function motionRange(id, p) {
    const duration = durationFor(id, p);
    const times = [0, duration];
    if (id === "muv" && Number(p.acceleration)) {
      const turningTime = -Number(p.velocity) / Number(p.acceleration);
      if (turningTime > 0 && turningTime < duration) times.push(turningTime);
    }
    const positions = times.map((time) => stateAt(id, p, time).values.x);
    let min = Math.min(0, ...positions), max = Math.max(0, ...positions);
    if (max - min < 2) { min -= 2; max += 2; }
    const padding = Math.max(1, (max - min) * 0.1);
    return { min: min - padding, max: max + padding };
  }
  function drawMotionCartScene(id, p, model, width, height, c) {
    drawBackdrop(sceneContext, width, height, c);
    const ctx = sceneContext; const trackY = height * 0.64; const axisY = height - 30; const range = motionRange(id, p);
    const left = 44, right = width - 22; const mapX = (x) => left + (x - range.min) / (range.max - range.min) * (right - left);
    drawTrack(ctx, width, trackY, c, left - 20, right);
    drawReferenceAxis(ctx, range, mapX, axisY, c, trackY - 58);
    const initialX = stateAt(id, p, 0).values.x; const x = mapX(model.values.x); const originX = mapX(initialX);
    if (Math.abs(x - originX) > 1) { ctx.strokeStyle = c.gold; ctx.globalAlpha = 0.7; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(originX, trackY - 39); ctx.lineTo(x, trackY - 39); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
    const startX = stateAt(id, p, 0).values.x;
    drawCart(ctx, x, trackY, id === "muv" ? c.blue : c.gold, c, id === "newton" ? "N" : "A", 0, (model.values.x - startX) / 0.16);
    const velocity = model.values.v; const acceleration = model.values.a;
    if (Math.abs(velocity) > 0.01) {
      const length = Math.min(66, 20 + Math.abs(velocity) * 3.5); const direction = Math.sign(velocity);
      arrow(ctx, x, trackY - 40, x + direction * length, trackY - 40, c.blue, `v ${fmt(velocity, 1)} m/s`);
    }
    if (id === "muv" && Math.abs(acceleration) > 0.01) {
      const accelerationLength = Math.min(48, 18 + Math.abs(acceleration) * 9);
      arrow(ctx, x, trackY - 57, x + Math.sign(acceleration) * accelerationLength, trackY - 57, c.gold, `a ${fmt(acceleration, 1)} m/s²`);
    }
    ctx.font = "12px system-ui"; ctx.fillStyle = c.text;
    ctx.fillText(`Referencial fixo da pista · t = ${fmt(model.time)} s`, 14, 21);
    ctx.fillStyle = c.muted; ctx.fillText(`x = ${fmt(model.values.x)} m   ·   v = ${fmt(velocity, 2)} m/s   ·   a = ${fmt(acceleration, 2)} m/s²`, 14, 41);
    if (id === "newton") {
      const forceScale = Math.min(58, 12 + Math.abs(model.values.force) * 1.4);
      if (Math.abs(model.values.force) > 0.01) arrow(ctx, x, trackY - 57, x + Math.sign(model.values.force) * forceScale, trackY - 57, c.gold, `F ${fmt(model.values.force, 1)} N`);
      if (Math.abs(acceleration) > 0.01) arrow(ctx, x, trackY - 73, x + Math.sign(acceleration) * Math.min(42, 18 + Math.abs(acceleration) * 4), trackY - 73, c.blue, `a ${fmt(acceleration, 1)} m/s²`);
      if (Math.abs(velocity) < 0.01) { ctx.fillStyle = c.muted; ctx.fillText("Carrinho em repouso neste referencial", 14, 61); }
    }
  }
  function drawMotionCollisionScene(p, model, width, height, c) {
    const ctx = sceneContext; drawBackdrop(ctx, width, height, c);
    const trackY = height * 0.64; const axisY = height - 30; const collisionTime = model.values.collisionTime;
    const times = [0, collisionTime, durationFor("collision", p)];
    const positions = times.flatMap((time) => { const values = stateAt("collision", p, time).values; return [values.x1, values.x2]; });
    let min = Math.min(0, ...positions), max = Math.max(0, ...positions); const padding = Math.max(2, (max - min) * 0.12); min -= padding; max += padding;
    const range = { min, max }; const left = 44, right = width - 22; const mapX = (x) => left + (x - min) / (max - min) * (right - left);
    drawTrack(ctx, width, trackY, c, left - 20, right); drawReferenceAxis(ctx, range, mapX, axisY, c, trackY - 58);
    const x1 = mapX(model.values.x1), x2 = mapX(model.values.x2);
    const initialState = stateAt("collision", p, 0).values;
    const wheelA = (model.values.x1 - initialState.x1) / 0.16; const wheelB = (model.values.x2 - initialState.x2) / 0.16;
    const cartsLocked = model.time >= collisionTime && Number(p.restitution) < 0.01;
    if (cartsLocked) {
      const groupX = (x1 + x2) / 2;
      drawCart(ctx, groupX - 22, trackY, c.gold, c, "A", 0, wheelA, 0.72);
      drawCart(ctx, groupX + 22, trackY, c.blue, c, "B", 0, wheelB, 0.72);
      lineTo(ctx, { x: groupX - 5, y: trackY - 15 }, { x: groupX + 5, y: trackY - 15 }, c.text, 3);
    } else {
      drawCart(ctx, x1, trackY, c.gold, c, "A", 0, wheelA, 0.72);
      drawCart(ctx, x2, trackY, c.blue, c, "B", 0, wheelB, 0.72);
    }
    const arrowLength1 = Math.min(52, 16 + Math.abs(model.values.v1) * 3); const arrowLength2 = Math.min(52, 16 + Math.abs(model.values.v2) * 3);
    if (cartsLocked) {
      if (Math.abs(model.values.v1) > 0.01) arrow(ctx, (x1 + x2) / 2, trackY - 47, (x1 + x2) / 2 + Math.sign(model.values.v1) * arrowLength1, trackY - 47, c.blue, `unidos · v ${fmt(model.values.v1, 1)} m/s`);
    } else {
      if (Math.abs(model.values.v1) > 0.01) arrow(ctx, x1, trackY - 43, x1 + Math.sign(model.values.v1) * arrowLength1, trackY - 43, c.gold, `vA ${fmt(model.values.v1, 1)}`);
      if (Math.abs(model.values.v2) > 0.01) arrow(ctx, x2, trackY - 59, x2 + Math.sign(model.values.v2) * arrowLength2, trackY - 59, c.blue, `vB ${fmt(model.values.v2, 1)}`);
    }
    ctx.fillStyle = c.text; ctx.font = "12px system-ui"; ctx.fillText(`Pista fixa · t = ${fmt(model.time)} s`, 14, 21);
    ctx.fillStyle = c.muted; ctx.fillText(cartsLocked ? "Após o contato inelástico, A e B seguem acoplados" : model.time < collisionTime ? "A se aproxima de B" : "Após o contato: velocidades recalculadas", 14, 41);
    if (Math.abs(model.time - collisionTime) < 0.12) {
      const impactX = (x1 + x2) / 2; ctx.strokeStyle = c.text; ctx.lineWidth = 2;
      for (let i = 0; i < 8; i += 1) { const angle = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(impactX + Math.cos(angle) * 13, trackY - 25 + Math.sin(angle) * 13); ctx.lineTo(impactX + Math.cos(angle) * 24, trackY - 25 + Math.sin(angle) * 24); ctx.stroke(); }
    }
  }
  function drawRollingRampCart(p, model, width, height, c) {
    const ctx = sceneContext; drawBackdrop(ctx, width, height, c);
    const start = { x: width * 0.17, y: height * 0.31 }; const end = { x: width * 0.83, y: height * 0.69 };
    const dx = end.x - start.x, dy = end.y - start.y; const angle = Math.atan2(dy, dx); const lengthPx = Math.hypot(dx, dy); const ratio = Math.max(0, Math.min(1, model.values.s / p.length));
    ctx.save(); ctx.translate(start.x, start.y); ctx.rotate(angle);
    ctx.fillStyle = "rgba(0,0,0,.14)"; ctx.fillRect(-8, 6, lengthPx + 18, 15);
    ctx.fillStyle = c.muted; ctx.globalAlpha = 0.7;
    for (let x = 0; x < lengthPx; x += 24) { roundedRect(ctx, x, -3, 5, 14, 2); ctx.fill(); }
    ctx.globalAlpha = 1; lineTo(ctx, { x: 0, y: 0 }, { x: lengthPx, y: 0 }, c.text, 3); lineTo(ctx, { x: 0, y: 5 }, { x: lengthPx, y: 5 }, c.line, 2);
    ctx.restore();
    const x = start.x + dx * ratio; const y = start.y + dy * ratio;
    drawCart(ctx, x, y, c.gold, c, "A", angle, model.values.s / 0.16);
    ctx.fillStyle = c.blue; ctx.font = "bold 11px system-ui"; ctx.fillText("O · s = 0", start.x - 10, start.y - 18);
    arrow(ctx, start.x + 24, start.y - 31, start.x + 65, start.y - 31, c.blue, "+s");
    ctx.fillStyle = c.text; ctx.font = "12px system-ui"; ctx.fillText(`Carrinho na rampa · s = ${fmt(model.values.s)} m · h = ${fmt(model.values.height)} m`, 14, 21);
    ctx.fillStyle = c.muted; ctx.fillText(`Eₘ = ${fmt(model.values.total)} J  ·  Eₖ = ${fmt(model.values.kinetic)} J  ·  Eₚ = ${fmt(model.values.potential)} J`, 14, 42);
    lineTo(ctx, { x: end.x + 4, y: start.y + 12 }, { x: end.x + 4, y: end.y + 15 }, c.blue, 1.5, [4, 4]);
  }
  function drawBall(context, x, y, radius, c) {
    const gradient = context.createRadialGradient(x - radius * 0.35, y - radius * 0.4, 1, x, y, radius * 1.2);
    gradient.addColorStop(0, "#fff0bc"); gradient.addColorStop(0.3, c.gold); gradient.addColorStop(1, "#9c581d");
    context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fillStyle = gradient; context.fill();
    context.save(); context.beginPath(); context.arc(x, y, radius - 0.5, 0, Math.PI * 2); context.clip(); context.strokeStyle = "rgba(35,24,14,.75)"; context.lineWidth = Math.max(1, radius * 0.09);
    context.beginPath(); context.arc(x - radius * 0.65, y, radius * 0.9, -1.15, 1.15); context.stroke();
    context.beginPath(); context.arc(x + radius * 0.65, y, radius * 0.9, Math.PI - 1.15, Math.PI + 1.15); context.stroke();
    context.beginPath(); context.moveTo(x - radius * 0.95, y - radius * 0.2); context.quadraticCurveTo(x, y - radius * 0.48, x + radius * 0.95, y - radius * 0.2); context.stroke();
    context.beginPath(); context.moveTo(x - radius * 0.95, y + radius * 0.2); context.quadraticCurveTo(x, y + radius * 0.48, x + radius * 0.95, y + radius * 0.2); context.stroke(); context.restore();
    context.strokeStyle = c.text; context.lineWidth = 1.3; context.beginPath(); context.arc(x, y, radius, 0, 2 * Math.PI); context.stroke();
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
    if (id.startsWith("optics-")) {
      drawOpticalScene(ctx, width, height, id, p, model, c);
      return;
    }
    if (["mru", "muv", "newton"].includes(id)) {
      drawMotionCartScene(id, p, model, width, height, c);
    } else if (id === "energy") {
      drawRollingRampCart(p, model, width, height, c);
    } else if (id === "collision") {
      drawMotionCollisionScene(p, model, width, height, c);
    } else if (id === "spring") {
      drawBackdrop(ctx, width, height, c);
      const trackY = height * 0.67; const center = width * 0.55; const amplitude = Math.max(0, Number(p.amplitude)); const scale = width * 0.28 / Math.max(amplitude, 0.08); const cartX = center + values.x * scale;
      drawTrack(ctx, width, trackY, c, 20, width - 16);
      lineTo(ctx, { x: center, y: trackY - 58 }, { x: center, y: height - 27 }, c.blue, 1.3, [4, 4]);
      ctx.fillStyle = c.blue; ctx.font = "bold 10px system-ui"; ctx.textAlign = "center"; ctx.fillText("O · x = 0", center, height - 40); ctx.textAlign = "start";
      const axisY = height - 27; const axisExtent = amplitude * scale; lineTo(ctx, { x: center - axisExtent, y: axisY }, { x: center + axisExtent, y: axisY }, c.text, 1.2);
      ctx.fillStyle = c.muted; ctx.font = "10px system-ui"; ctx.textAlign = "center";
      const springTicks = amplitude > 0 ? [[-1, `−${fmt(amplitude, 2)} m`], [0, "0"], [1, `+${fmt(amplitude, 2)} m`]] : [[0, "0"]];
      for (const [tick, label] of springTicks) { const x = center + tick * axisExtent; lineTo(ctx, { x, y: axisY - 4 }, { x, y: axisY + 4 }, c.muted, 1); ctx.fillText(label, x, axisY + 15); }
      ctx.textAlign = "start";
      const anchor = 38, springEnd = cartX - 37, segments = 14;
      lineTo(ctx, { x: anchor, y: trackY - 27 }, { x: anchor, y: trackY + 6 }, c.muted, 4);
      ctx.beginPath(); ctx.moveTo(anchor, trackY - 12);
      for (let i = 1; i <= segments; i += 1) { const x = anchor + (springEnd - anchor) * i / segments; const y = trackY - 12 + (i === segments ? 0 : (i % 2 ? -1 : 1) * 8); ctx.lineTo(x, y); }
      ctx.strokeStyle = c.gold; ctx.lineWidth = 3; ctx.stroke();
      drawCart(ctx, cartX, trackY, c.blue, c, "m", 0, values.x / 0.16);
      ctx.fillStyle = c.text; ctx.font = "12px system-ui"; ctx.fillText(`Carrinho-massa · x = ${fmt(values.x)} m · v = ${fmt(values.v)} m/s`, 14, 21);
      ctx.fillStyle = c.muted; ctx.fillText(`Referencial fixo no equilíbrio · T = ${fmt(values.period)} s`, 14, 41);
    } else if (id === "wave") {
      drawBackdrop(ctx, width, height, c);
      const amplitudeScale = Math.min(72, height * 0.22 / Math.max(p.amplitude, 0.01)); const mid = height * 0.57; const xMin = -p.wavelength; const xMax = p.wavelength; const left = 28, right = width - 26;
      const mapX = (x) => left + (x - xMin) / (xMax - xMin) * (right - left);
      lineTo(ctx, { x: left, y: mid }, { x: right, y: mid }, c.muted, 1.2);
      ctx.beginPath();
      for (let i = 0; i <= 240; i += 1) { const xValue = xMin + (xMax - xMin) * i / 240; const yValue = p.amplitude * Math.sin(2 * Math.PI * (xValue / p.wavelength - p.frequency * state.time)); const x = mapX(xValue); const y = mid - yValue * amplitudeScale; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.strokeStyle = c.gold; ctx.lineWidth = 3; ctx.stroke();
      for (let i = 0; i <= 24; i += 1) { const xValue = xMin + (xMax - xMin) * i / 24; const yValue = p.amplitude * Math.sin(2 * Math.PI * (xValue / p.wavelength - p.frequency * state.time)); const x = mapX(xValue), y = mid - yValue * amplitudeScale; const radius = i % 3 === 0 ? 4.5 : 2.3; ctx.beginPath(); ctx.arc(x, y, radius, 0, 2 * Math.PI); ctx.fillStyle = i % 3 === 0 ? c.blue : c.text; ctx.globalAlpha = i % 3 === 0 ? 0.95 : 0.52; ctx.fill(); ctx.globalAlpha = 1; }
      const markerX = mapX(p.xProbe); const markerY = mid - values.y * amplitudeScale;
      lineTo(ctx, { x: markerX, y: mid }, { x: markerX, y: markerY }, c.blue, 1.5, [4, 4]);
      ctx.fillStyle = c.blue; ctx.beginPath(); ctx.arc(markerX, markerY, 7, 0, 7); ctx.fill();
      ctx.fillStyle = c.text; ctx.font = "12px system-ui"; ctx.fillText("Corda com partículas · a onda propaga-se para +x", 14, 21);
      ctx.fillStyle = c.muted; ctx.fillText(`Cada ponto da corda oscila verticalmente · v = λf = ${fmt(values.waveSpeed)} m/s`, 14, 41);
      const axisY = height - 25; lineTo(ctx, { x: left, y: axisY }, { x: right, y: axisY }, c.text, 1.2);
      ctx.font = "10px system-ui"; ctx.fillStyle = c.muted; ctx.textAlign = "center";
      for (let i = 0; i <= 4; i += 1) { const value = xMin + (xMax - xMin) * i / 4; const x = mapX(value); lineTo(ctx, { x, y: axisY - 4 }, { x, y: axisY + 4 }, c.muted, 1); ctx.fillText(`${fmt(value, 1)} m`, x, axisY + 16); }
      ctx.textAlign = "start";
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
    "optics-reflection": [["angleIncident", "Ângulo de incidência", "°"], ["angleReflected", "Ângulo refletido", "°"], ["wavelengthVacuumNm", "Comprimento de onda no vácuo", "nm"], ["frequencyTHz", "Frequência da luz", "THz"], ["speed", "Velocidade no meio", "m/s"]],
    "optics-refraction": [["angleIncident", "Ângulo no meio 1", "°"], ["angleTransmitted", "Ângulo no meio 2", "°"], ["speed1", "Velocidade no meio 1", "m/s"], ["speed2", "Velocidade no meio 2", "m/s"], ["wavelength1Nm", "Comprimento de onda no meio 1", "nm"], ["wavelength2Nm", "Comprimento de onda no meio 2", "nm"], ["frequencyTHz", "Frequência constante", "THz"], ["criticalAngle", "Ângulo crítico", "°"]],
    "optics-concave-mirror": [["radius", "Raio assinado", "m"], ["focalLength", "Distância focal", "m"], ["imageDistance", "Distância da imagem", "m"], ["magnification", "Ampliação", "adimensional"], ["image", "Natureza da imagem", ""]],
    "optics-convex-mirror": [["radius", "Raio assinado", "m"], ["focalLength", "Distância focal", "m"], ["imageDistance", "Distância da imagem", "m"], ["magnification", "Ampliação", "adimensional"], ["image", "Natureza da imagem", ""]],
    calorimetry: [["temperature1", "Temperatura do corpo quente", "°C"], ["temperature2", "Temperatura do corpo frio", "°C"], ["equilibrium", "Equilíbrio previsto", "°C"], ["energyBalance", "Balanço de energia", "J"]],
    field: [["electricField", "Campo elétrico Eₓ", "N/C"], ["xProbe", "Posição do marcador", "m"], ["q1", "Carga 1", "nC"], ["q2", "Carga 2", "nC"]]
  };

  function renderReadouts(values) {
    const definitions = readoutDefinitions[state.id] || [];
    $("#workspace-readouts").innerHTML = definitions.map(([key, label, unit]) => `<div><span>${label}</span><b>${fmt(values[key])} ${unit}</b></div>`).join("");
    $("#workspace-time-label").textContent = durationFor(state.id, state.parameters) ? `t = ${fmt(state.time)} ${currentTimeUnit()}` : "modelo estático";
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
    if (["mru", "muv", "newton", "energy", "collision", "spring", "calorimetry", "optics-reflection", "optics-refraction", "optics-concave-mirror", "optics-convex-mirror"].includes(id)) {
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
  let opticalDrag = null;
  canvas.addEventListener("pointerdown", (event) => {
    if (state.id !== "optics-reflection") return;
    const model = stateAt(state.id, state.parameters, state.time);
    const rect = canvas.getBoundingClientRect();
    const view = opticalViewFor(model.geometry.bounds, rect.width, rect.height);
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const handleScreen = (handle) => view.toScreen(handle);
    const distanceTo = (handle) => {
      const screen = handleScreen(handle);
      return Math.hypot(screen.x - point.x, screen.y - point.y);
    };
    if (distanceTo(model.geometry.handles.top) < 24) opticalDrag = { kind: "tilt", endSign: 1 };
    else if (distanceTo(model.geometry.handles.bottom) < 24) opticalDrag = { kind: "tilt", endSign: -1 };
    else if (distanceTo(model.geometry.handles.center) < 24) opticalDrag = { kind: "move" };
    else if (distanceTo(model.geometry.handles.hit) < 24) opticalDrag = { kind: "impact" };
    else if (distanceTo(model.geometry.handles.source) < 24) opticalDrag = { kind: "source" };
    if (opticalDrag) {
      event.preventDefault();
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
    }
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!opticalDrag || state.id !== "optics-reflection") return;
    const model = stateAt(state.id, state.parameters, state.time);
    const rect = canvas.getBoundingClientRect();
    const view = opticalViewFor(model.geometry.bounds, rect.width, rect.height);
    const world = opticalPointerToWorld(event, canvas, view);
    const center = model.geometry.center;
    if (opticalDrag.kind === "source") {
      const hit = model.geometry.hit;
      const towardHit = { x: hit.x - world.x, y: hit.y - world.y };
      const angle = Math.atan2(towardHit.y, towardHit.x) * 180 / Math.PI;
      const controls = experimentById.get(state.id).controls;
      setParameter(controls.find((item) => item.id === "incidenceAngle"), angle);
      setParameter(controls.find((item) => item.id === "sourceDistance"), Math.hypot(towardHit.x, towardHit.y));
    } else if (opticalDrag.kind === "move") {
      const controls = experimentById.get(state.id).controls;
      setParameter(controls.find((item) => item.id === "mirrorX"), world.x);
      setParameter(controls.find((item) => item.id === "mirrorY"), world.y);
    } else if (opticalDrag.kind === "tilt") {
      const dx = (world.x - center.x) * opticalDrag.endSign;
      const dy = (world.y - center.y) * opticalDrag.endSign;
      const angle = Math.atan2(-dx, dy) * 180 / Math.PI;
      const control = experimentById.get(state.id).controls.find((item) => item.id === "mirrorTilt");
      setParameter(control, angle);
    } else {
      const tangent = model.geometry.tangent;
      const offset = (world.x - center.x) * tangent.x + (world.y - center.y) * tangent.y;
      const control = experimentById.get(state.id).controls.find((item) => item.id === "impactOffset");
      setParameter(control, offset);
    }
  });
  const stopOpticalDrag = (event) => {
    if (!opticalDrag) return;
    opticalDrag = null;
    canvas.style.cursor = "grab";
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  };
  canvas.addEventListener("pointerup", stopOpticalDrag);
  canvas.addEventListener("pointercancel", stopOpticalDrag);
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
    const current = ["mru", "muv", "newton", "energy", "collision", "spring", "calorimetry", "optics-reflection", "optics-refraction", "optics-concave-mirror", "optics-convex-mirror"].includes(state.id) ? state.time : Number(state.parameters[{ wave: "xProbe", lens: "objectDistance", field: "xProbe", ohm: "voltage" }[state.id]]);
    graphSelection(current + (event.key === "ArrowRight" ? step : -step));
  });

  $("#workspace-record").addEventListener("click", () => {
    const record = sampleValues(state.id, state.parameters, state.time);
    state.records.push(record);
    updateRecords();
    $("#workspace-status").textContent = `Medição ${state.records.length} registrada no instante ${fmt(state.time)} ${currentTimeUnit()}.`;
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
    const headings = { time: `Tempo (${currentTimeUnit()})`, x: "x (m)", v: "v (m/s)", a: "a (m/s²)", y: "y (m)", force: "Força (N)", friction: "Atrito (N)", normal: "Normal (N)", s: "Percurso (m)", kinetic: "E cinética (J)", potential: "E potencial (J)", total: "E total (J)", x1: "x₁ (m)", x2: "x₂ (m)", v1: "v₁ (m/s)", v2: "v₂ (m/s)", momentum: "Momento (kg·m/s)", period: "Período (s)", waveSpeed: "v onda (m/s)", wavelength: "λ (m)", frequency: "f (Hz)", voltage: "V (V)", resistance: "R (Ω)", current: "I (A)", power: "P (W)", imageDistance: "dᵢ (m)", magnification: "Ampliação", f: "foco (m)", temperature1: "T₁ (°C)", temperature2: "T₂ (°C)", equilibrium: "T equilíbrio (°C)", energyBalance: "Balanço (J)", electricField: "Eₓ (N/C)", xProbe: "x marcador (m)", q1: "q₁ (nC)", q2: "q₂ (nC)", restitution: "Restituição", kineticBefore: "E antes (J)", kineticAfter: "E depois (J)", momentumBefore: "p antes", momentumAfter: "p depois", collisionTime: "t colisão (s)", singular: "Singularidade", image: "Imagem", omega: "ω (rad/s)", angleIncident: "Ângulo incidente (°)", angleReflected: "Ângulo refletido (°)", angleTransmitted: "Ângulo refratado (°)", index1: "Índice n₁", index2: "Índice n₂", criticalAngle: "Ângulo crítico (°)", wavelengthVacuumNm: "λ no vácuo (nm)", wavelength1Nm: "λ no meio 1 (nm)", wavelength2Nm: "λ no meio 2 (nm)", frequencyTHz: "Frequência (THz)", speed: "Velocidade da luz (m/s)", speed1: "Velocidade no meio 1 (m/s)", speed2: "Velocidade no meio 2 (m/s)", pathPosition: "Posição do marcador (m)", pathLength: "Comprimento do feixe (m)", totalInternalReflection: "Reflexão total", radius: "Raio assinado (m)" };
    head.innerHTML = `<tr>${keys.map((key) => `<th scope="col">${headings[key] || key}</th>`).join("")}</tr>`;
    body.innerHTML = state.records.map((row) => `<tr>${keys.map((key) => `<td>${typeof row[key] === "boolean" ? (row[key] ? "sim" : "não") : typeof row[key] === "number" ? fmt(row[key], 3) : row[key] ?? "—"}</td>`).join("")}</tr>`).join("");
    $("#workspace-export").disabled = !state.records.length;
    $("#workspace-table-caption").textContent = state.records.length ? `${state.records.length} medição(ões) simulada(s); valores calculados, não observações de experimento real.` : "Medições simuladas; não são observações de um experimento real.";
  }

  const resizeObserver = new ResizeObserver(() => { if (state.id && !workspace.hidden) { try { render(); } catch { /* O próximo evento de controle informará erros do modelo. */ } } });
  resizeObserver.observe(workspace);
  if (experimentById.has(topicId)) selectExperiment(topicId);
  else {
    workspace.hidden = true;
    $("#lab-topic-not-found").hidden = false;
    $("#lab-topic-kicker").textContent = "LABORATÓRIO VIRTUAL DE FÍSICA";
    $("#lab-topic-name").textContent = "Experimento não encontrado";
    $("#lab-topic-description").textContent = "Escolha um tópico no catálogo para abrir a simulação.";
    document.title = "Experimento não encontrado — Laboratório de Física";
  }
  window.addEventListener("beforeunload", () => { stop(); resizeObserver.disconnect(); });
}
