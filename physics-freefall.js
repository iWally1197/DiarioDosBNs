import { freeFallAtTime, freeFallImpactTime } from "./physics-freefall-model.js?v=freefall-20261011-1";
import { cameraScreenPoint, cameraWorldPoint, createCamera, panCameraBy, resetCamera, zoomCameraAtPoint } from "./laboratorio-camera.js?v=lab-camera-20261023-1";

const $ = (selector) => document.querySelector(selector);
const lab = $("#freefall-lab");
const scene = $("#freefall-scene");
const chart = $("#freefall-chart");
const sceneContext = scene?.getContext("2d");
const chartContext = chart?.getContext("2d");
const status = $("#freefall-status");
if (!lab || !sceneContext || !chartContext) {
  if (status) status.textContent = "Não foi possível preparar a animação neste navegador.";
} else {
  const inputs = {
    height: $('[data-param="height"]'),
    gravity: $('[data-param="gravity"]'),
    massA: $('[data-param="massA"]'),
    massB: $('[data-param="massB"]'),
    playback: $('[data-param="playback"]')
  };
  const chartSelect = $("#freefall-chart-select");
  const playButton = $("[data-play]");
  const resetButton = $("[data-reset]");
  const fullButton = $("[data-fullscreen]");
  const panelToggle = $("#freefall-panel-toggle");
  const panel = $("#freefall-controls");
  const panelPlay = $("#freefall-panel-play");
  const state = { time: 0, running: false, lastFrame: 0, frame: 0, started: false, graph: "height", loopDelayUntil: 0, camera: createCamera(), selectedBody: "" };
  const initial = { height: 20, gravity: 9.81, massA: 0.2, massB: 2, playback: 0.25 };
  const readParameters = () => ({
    height: Number(inputs.height.value),
    gravity: Number(inputs.gravity.value),
    massA: Number(inputs.massA.value),
    massB: Number(inputs.massB.value),
    playback: Number(inputs.playback.value)
  });
  const fmt = (value, digits) => Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
  const color = (name, fallback) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  const colors = () => ({
    bg: color("--bg-soft", "#0a1220"),
    text: color("--text", "#f4f5f8"),
    muted: color("--muted", "#9aa6b9"),
    gold: color("--gold", "#d6b87a"),
    blue: color("--blue", "#79a8ff"),
    grid: color("--line", "rgba(206,218,240,.18)")
  });

  function resizeCanvas(canvas, context) {
    const width = Math.max(1, canvas.clientWidth || 320);
    const height = Math.max(1, canvas.clientHeight || 240);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(width * ratio);
    const pixelHeight = Math.round(height * ratio);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { width, height };
  }

  function drawArrow(context, x1, y1, x2, y2, stroke) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    context.strokeStyle = stroke;
    context.fillStyle = stroke;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.beginPath();
    context.moveTo(x2, y2);
    context.lineTo(x2 - 8 * Math.cos(angle - Math.PI / 6), y2 - 8 * Math.sin(angle - Math.PI / 6));
    context.lineTo(x2 - 8 * Math.cos(angle + Math.PI / 6), y2 - 8 * Math.sin(angle + Math.PI / 6));
    context.closePath();
    context.fill();
  }

  function drawObject(context, x, y, fill, mass, velocity, palette, selected = false) {
    const radius = 13;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = fill;
    context.fill();
    context.lineWidth = 2;
    if (selected) { context.beginPath(); context.arc(x, y, radius + 5, 0, Math.PI * 2); context.strokeStyle = palette.gold; context.lineWidth = 2.5; context.stroke(); }
    context.strokeStyle = palette.text;
    context.stroke();
    context.fillStyle = palette.text;
    context.font = "600 12px system-ui, sans-serif";
    context.textAlign = "center";
    context.fillText("m = " + fmt(mass, 1) + " kg", x, y - 25);
    if (velocity > 0.15) {
      const length = Math.max(15, Math.min(54, velocity * 2.1));
      drawArrow(context, x, y + radius + 2, x, y + radius + 2 + length, palette.gold);
      context.fillStyle = palette.gold;
      context.textAlign = "left";
      context.fillText("v", x + 7, y + radius + length + 1);
    }
  }

  function drawScene() {
    const size = resizeCanvas(scene, sceneContext);
    const ctx = sceneContext;
    const p = readParameters();
    const at = freeFallAtTime(state.time, p);
    const palette = colors();
    const { width, height } = size;
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(state.camera.x, state.camera.y);
    ctx.scale(state.camera.zoom, state.camera.zoom);
    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.58;
    ctx.beginPath();
    for (let x = 24; x < width; x += 44) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, height); }
    for (let y = 22; y < height; y += 44) { ctx.moveTo(0, y + 0.5); ctx.lineTo(width, y + 0.5); }
    ctx.stroke();
    ctx.globalAlpha = 1;

    const top = 55;
    const floorY = height - 48;
    const radius = 13;
    const maximumHeight = Math.max(p.height, Number(inputs.height.max) || p.height);
    const scale = Math.max(1, (floorY - radius - top) / maximumHeight);
    const leftX = width * 0.37;
    const rightX = width * 0.63;
    const startY = floorY - radius - p.height * scale;
    const currentY = floorY - radius - at.height * scale;
    const floor = floorY;
    ctx.strokeStyle = palette.muted;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(28, floorY);
    ctx.lineTo(width - 28, floorY);
    ctx.stroke();
    ctx.fillStyle = palette.muted;
    ctx.fillRect(28, floorY + 2, width - 56, 5);
    ctx.fillStyle = palette.text;
    ctx.font = "600 12px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("SOLO · h = 0 m", width - 34, floorY - 10);

    ctx.strokeStyle = palette.muted;
    ctx.globalAlpha = 0.75;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(50, startY);
    ctx.lineTo(width - 50, startY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.fillStyle = palette.text;
    ctx.textAlign = "left";
    ctx.fillText("h₀ = " + fmt(p.height, 1) + " m", 16, startY - 10);

    const stepMeters = Math.max(1, Math.ceil(maximumHeight / 8));
    ctx.strokeStyle = palette.muted;
    ctx.fillStyle = palette.muted;
    ctx.font = "10px system-ui, sans-serif";
    ctx.textAlign = "right";
    for (let meter = 0; meter <= maximumHeight; meter += stepMeters) {
      const y = floorY - radius - meter * scale;
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.moveTo(53, y);
      ctx.lineTo(63, y);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillText(String(meter) + " m", 48, y + 3);
    }

    ctx.strokeStyle = palette.gold;
    ctx.globalAlpha = 0.55;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(leftX, startY + 13);
    ctx.lineTo(leftX, floorY - 14);
    ctx.moveTo(rightX, startY + 13);
    ctx.lineTo(rightX, floorY - 14);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.fillStyle = palette.blue;
    ctx.textAlign = "center";
    ctx.font = "600 11px system-ui, sans-serif";
    ctx.fillText("OBJETO A", leftX, 24);
    ctx.fillStyle = palette.gold;
    ctx.fillText("OBJETO B", rightX, 24);

    drawObject(ctx, leftX, currentY, palette.blue, p.massA, at.velocity, palette, state.selectedBody === "A");
    drawObject(ctx, rightX, currentY, palette.gold, p.massB, at.velocity, palette, state.selectedBody === "B");

    drawArrow(ctx, width - 54, 62, width - 54, 100, palette.blue);
    ctx.fillStyle = palette.blue;
    ctx.textAlign = "center";
    ctx.font = "600 12px system-ui, sans-serif";
    ctx.fillText("g", width - 54, 54);
    ctx.fillStyle = palette.muted;
    ctx.textAlign = "left";
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText("Eixo vertical positivo para baixo", 18, height - 15);
    ctx.textAlign = "right";
    ctx.fillText("t = " + fmt(at.time, 2) + " s", width - 18, height - 15);
    ctx.restore();
  }

  function drawGraph() {
    const size = resizeCanvas(chart, chartContext);
    const ctx = chartContext;
    const p = readParameters();
    const totalTime = freeFallImpactTime(p);
    const palette = colors();
    const { width, height } = size;
    const left = 62, right = 18, top = 18, bottom = 36;
    const plotW = Math.max(1, width - left - right);
    const plotH = Math.max(1, height - top - bottom);
    const isHeight = state.graph === "height";
    const maxY = isHeight ? p.height : Math.max(1, p.gravity * totalTime);
    const minY = 0;
    const yValue = (t) => {
      const at = freeFallAtTime(t, p);
      return isHeight ? at.height : at.velocity;
    };
    const yLabel = (value) => fmt(value, value >= 10 ? 0 : 1);
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, width, height);
    ctx.font = "10px system-ui, sans-serif";
    ctx.strokeStyle = palette.grid;
    ctx.fillStyle = palette.muted;
    ctx.lineWidth = 1;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= 4; i++) {
      const fraction = i / 4;
      const y = top + plotH * fraction;
      const value = maxY - (maxY - minY) * fraction;
      ctx.beginPath(); ctx.moveTo(left, y + 0.5); ctx.lineTo(width - right, y + 0.5); ctx.stroke();
      ctx.fillText(yLabel(value), left - 7, y);
    }
    for (let i = 0; i <= 4; i++) {
      const t = totalTime * i / 4;
      const x = left + plotW * i / 4;
      ctx.beginPath(); ctx.moveTo(x + 0.5, top); ctx.lineTo(x + 0.5, top + plotH); ctx.stroke();
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(fmt(t, 1), x, top + plotH + 5);
    }
    ctx.strokeStyle = palette.muted;
    ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, top + plotH); ctx.lineTo(width - right, top + plotH); ctx.stroke();
    ctx.fillStyle = palette.text;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText(isHeight ? "h (m)" : "v para baixo (m/s)", 8, 5);
    ctx.textAlign = "right";
    ctx.fillText("t (s)", width - 3, height - 15);

    ctx.strokeStyle = palette.gold;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const t = totalTime * i / 120;
      const x = left + plotW * t / totalTime;
      const fraction = (maxY - yValue(t)) / (maxY - minY || 1);
      const y = top + plotH * fraction;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    const markerX = left + plotW * Math.min(1, state.time / totalTime);
    const markerValue = yValue(Math.min(state.time, totalTime));
    const markerY = top + plotH * (maxY - markerValue) / (maxY - minY || 1);
    ctx.fillStyle = palette.blue;
    ctx.beginPath(); ctx.arc(markerX, markerY, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = palette.blue;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(markerX, top); ctx.lineTo(markerX, top + plotH); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = palette.muted;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.font = "10px system-ui, sans-serif";
    ctx.fillText("As massas coincidem no modelo ideal", left + 5, top + plotH - 5);
  }

  function updateReadouts() {
    const p = readParameters();
    const at = freeFallAtTime(state.time, p);
    $("#freefall-time").textContent = fmt(at.time, 2) + " s";
    $("#freefall-height").textContent = fmt(at.height, 2) + " m";
    $("#freefall-velocity").textContent = fmt(at.velocity, 2) + " m/s";
    $("#freefall-gravity").textContent = fmt(p.gravity, 2) + " m/s²";
    $("#freefall-impact").textContent = fmt(at.impactTime, 2) + " s";
    lab.dataset.simulationDuration = String(at.impactTime);
    $('[data-out="height"]').textContent = fmt(p.height, 0) + " m";
    $('[data-out="gravity"]').textContent = fmt(p.gravity, 2) + " m/s²";
    $('[data-out="massA"]').textContent = fmt(p.massA, 1) + " kg";
    $('[data-out="massB"]').textContent = fmt(p.massB, 1) + " kg";
    $('[data-out="playback"]').textContent = fmt(p.playback, 2) + "×";
    playButton.textContent = state.running ? "Pausar" : (state.started ? (at.time >= at.impactTime ? "Recomeçar" : "Continuar") : "Iniciar");
    playButton.setAttribute("aria-pressed", String(state.running));
    if (panelPlay) { panelPlay.textContent = playButton.textContent; panelPlay.setAttribute("aria-pressed", String(state.running)); panelPlay.disabled = playButton.disabled; }
    fullButton.textContent = document.fullscreenElement === lab ? "Fechar tela cheia" : "Tela cheia";
    fullButton.setAttribute("aria-pressed", String(document.fullscreenElement === lab));
  }

  function drawAll() {
    drawScene();
    drawGraph();
    updateReadouts();
  }
  function stopAnimation() {
    state.running = false;
    state.lastFrame = 0;
    state.loopDelayUntil = 0;
    if (state.frame) cancelAnimationFrame(state.frame);
    state.frame = 0;
    drawAll();
  }
  function animate(timestamp) {
    if (!state.running) return;
    if (state.loopDelayUntil) {
      if (timestamp < state.loopDelayUntil) { state.frame = requestAnimationFrame(animate); return; }
      state.time = 0; state.loopDelayUntil = 0; state.lastFrame = timestamp;
    }
    if (!state.lastFrame) state.lastFrame = timestamp;
    const delta = Math.min(0.05, Math.max(0, (timestamp - state.lastFrame) / 1000));
    state.lastFrame = timestamp;
    state.time += delta * readParameters().playback;
    const impactTime = freeFallImpactTime(readParameters());
    if (state.time >= impactTime) {
      state.time = impactTime;
      state.lastFrame = 0;
      state.loopDelayUntil = timestamp + 850;
      status.textContent = "Impacto no solo. Um novo ciclo começa em instantes.";
    }
    drawAll();
    if (state.running) state.frame = requestAnimationFrame(animate);
    else state.frame = 0;
  }
  function seek(time) {
    state.time = Math.max(0, Math.min(freeFallImpactTime(readParameters()), time));
    drawAll();
  }

  playButton.addEventListener("click", () => {
    if (state.running) {
      stopAnimation();
      status.textContent = "Simulação pausada.";
      return;
    }
    const total = freeFallImpactTime(readParameters());
    if (state.time >= total) state.time = 0;
    state.started = true;
    state.running = true;
    state.lastFrame = 0;
    status.textContent = "Queda em andamento. Os dois objetos têm a mesma aceleração.";
    state.frame = requestAnimationFrame(animate);
  });
  document.querySelectorAll("[data-step]").forEach((button) => {
    button.addEventListener("click", () => {
      stopAnimation();
      seek(state.time + Number(button.dataset.step));
      status.textContent = "Instante consultado no gráfico e na animação.";
    });
  });
  resetButton.addEventListener("click", () => {
    stopAnimation();
    for (const [key, value] of Object.entries(initial)) inputs[key].value = String(value);
    chartSelect.value = "height";
    state.graph = "height";
    state.time = 0;
    state.started = false;
    status.textContent = "Parâmetros e instante inicial restaurados.";
    drawAll();
  });
  for (const input of Object.values(inputs)) {
    input.addEventListener("input", () => {
      const maxTime = freeFallImpactTime(readParameters());
      if (state.time > maxTime) state.time = maxTime;
      drawAll();
    });
  }
  chartSelect.addEventListener("change", () => {
    state.graph = chartSelect.value;
    drawAll();
  });
  function seekFromPointer(event) {
    const rect = chart.getBoundingClientRect();
    const total = freeFallImpactTime(readParameters());
    const left = 62, right = 18;
    const x = event.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, (x - left) / Math.max(1, rect.width - left - right)));
    stopAnimation();
    seek(fraction * total);
    status.textContent = "Instante consultado no gráfico e na animação.";
  }
  chart.addEventListener("click", seekFromPointer);
  chart.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      stopAnimation();
      seek(state.time + (event.key === "ArrowRight" ? 0.1 : -0.1));
    } else if (event.key === "Home") {
      event.preventDefault();
      stopAnimation();
      seek(0);
    } else if (event.key === "End") {
      event.preventDefault();
      stopAnimation();
      seek(freeFallImpactTime(readParameters()));
    }
  });
  panelPlay?.addEventListener("click", () => playButton.click());
  panelToggle?.addEventListener("click", () => { const open = panel.classList.toggle("is-open"); panelToggle.setAttribute("aria-expanded", String(open)); });
  fullButton.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement === lab) await document.exitFullscreen();
      else await lab.requestFullscreen();
    } catch {
      status.textContent = "A tela cheia não está disponível neste navegador.";
    }
  });
  window.addEventListener("diario-lab-zoom", (event) => { if (document.fullscreenElement !== lab) return; zoomFreefallAt({ x: scene.clientWidth / 2, y: scene.clientHeight / 2 }, Number(event.detail?.factor || 1)); });
  window.addEventListener("diario-lab-seek", (event) => { if (document.fullscreenElement !== lab) return; const time = Number(event.detail?.time); if (!Number.isFinite(time)) return; stopAnimation(); seek(time); status.textContent = "Instante ajustado para t = " + fmt(state.time, 2) + " s."; });
  document.addEventListener("fullscreenchange", () => { const full = document.fullscreenElement === lab; panelToggle.hidden = !full; panelPlay.hidden = !full; if (!full) panel.classList.remove("is-open"); panelToggle.setAttribute("aria-expanded", String(panel.classList.contains("is-open"))); drawAll(); });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.running) {
      stopAnimation();
      status.textContent = "Simulação pausada porque a página ficou oculta.";
    }
  });
  function zoomFreefallAt(point, factor) { zoomCameraAtPoint(state.camera, factor, point); drawScene(); }
  function installFreefallViewControls() {
    const host = scene.parentElement;
    if (!host) return;
    host.style.position = host.style.position || "relative";
    const controls = document.createElement("div");
    controls.className = "lab-view-controls-overlay";
    controls.setAttribute("role", "group");
    controls.setAttribute("aria-label", "Controles da perspectiva da queda livre");
    Object.assign(controls.style, { position: "absolute", top: "54px", right: "8px", zIndex: "4", width: "min(720px, calc(100% - 16px))", flexWrap: "wrap", justifyContent: "flex-end" });
    const button = (text, label, cls = "lab-view-reset") => { const item = document.createElement("button"); item.type = "button"; item.className = cls; item.textContent = text; item.setAttribute("aria-label", label); return item; };
    const move = button("Mover", "Ativar ferramenta para mover a vista", "lab-view-pan-toggle");
    move.setAttribute("aria-pressed", "false");
    const out = button("−", "Afastar perspectiva", "lab-view-control-button");
    const zoom = document.createElement("output"); zoom.className = "lab-view-zoom"; zoom.setAttribute("aria-live", "polite");
    const into = button("+", "Aproximar perspectiva", "lab-view-control-button");
    const center = button("Centralizar", "Centralizar a queda");
    const fit = button("Enquadrar tudo", "Enquadrar objetos e restaurar perspectiva");
    const restore = button("Restaurar zoom", "Restaurar apenas o zoom");
    controls.append(move, out, zoom, into, center, fit, restore); host.append(controls);
    const updateZoom = () => { zoom.textContent = Math.round(state.camera.zoom * 100) + "%"; drawScene(); };
    const centerPoint = () => ({ x: scene.clientWidth / 2, y: scene.clientHeight / 2 });
    move.addEventListener("click", () => { const active = scene.classList.toggle("lab-view-pan-mode"); move.setAttribute("aria-pressed", String(active)); move.setAttribute("aria-label", active ? "Desativar ferramenta para mover a vista" : "Ativar ferramenta para mover a vista"); });
    out.addEventListener("click", () => zoomFreefallAt(centerPoint(), 1 / 1.2));
    into.addEventListener("click", () => zoomFreefallAt(centerPoint(), 1.2));
    center.addEventListener("click", () => { state.camera.x = 0; state.camera.y = 0; updateZoom(); });
    fit.addEventListener("click", () => { resetCamera(state.camera); updateZoom(); });
    restore.addEventListener("click", () => { resetCamera(state.camera, { position: false, zoom: true }); updateZoom(); });
    let drag = null, space = false, inside = false, pointers = new Map(), pinch = null;
    const local = (event) => { const rect = scene.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; };
    const intercept = (event) => { event.preventDefault(); event.stopImmediatePropagation(); };
    const isBody = (point) => {
      const p = readParameters(), at = freeFallAtTime(state.time, p), size = resizeCanvas(scene, sceneContext);
      const floorY = size.height - 48, radius = 13, maxHeight = Math.max(p.height, Number(inputs.height.max) || p.height);
      const scale = Math.max(1, (floorY - radius - 55) / maxHeight);
      const y = floorY - radius - at.height * scale;
      const a = cameraScreenPoint(state.camera, { x: size.width * 0.37, y });
      const b = cameraScreenPoint(state.camera, { x: size.width * 0.63, y });
      const da = Math.hypot(a.x - point.x, a.y - point.y), db = Math.hypot(b.x - point.x, b.y - point.y);
      return da <= 24 ? "A" : db <= 24 ? "B" : "";
    };
    scene.addEventListener("pointerenter", () => { inside = true; });
    scene.addEventListener("pointerleave", () => { inside = false; });
    document.addEventListener("keydown", (event) => { if (event.code !== "Space" || !inside || event.repeat || event.target.closest?.("input,textarea,select,button,[contenteditable=true]")) return; space = true; event.preventDefault(); });
    document.addEventListener("keyup", (event) => { if (event.code === "Space") space = false; });
    scene.addEventListener("wheel", (event) => {
      event.preventDefault();
      const point = local(event), factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? scene.clientHeight : 1;
      const dx = Math.max(-240, Math.min(240, event.deltaX * factor)), dy = Math.max(-240, Math.min(240, event.deltaY * factor));
      if (event.ctrlKey || event.metaKey) zoomFreefallAt(point, Math.exp(-dy * 0.002));
      else { panCameraBy(state.camera, -dx, -dy); updateZoom(); }
    }, { passive: false });
    scene.addEventListener("pointerdown", (event) => {
      const point = local(event);
      if (event.pointerType === "touch") {
        pointers.set(event.pointerId, point);
        if (pointers.size >= 2) {
          const pair = [...pointers.entries()].slice(-2), a = pair[0][1], b = pair[1][1];
          pinch = { ids: pair.map(([id]) => id), center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), camera: { ...state.camera } };
          drag = null; scene.classList.add("lab-view-multitouch"); pair.forEach(([id]) => { try { scene.setPointerCapture(id); } catch {} }); intercept(event); return;
        }
      }
      const body = isBody(point);
      if (!state.running && body && event.button === 0 && !scene.classList.contains("lab-view-pan-mode")) {
        state.selectedBody = body; state.time = 0; state.started = false; state.loopDelayUntil = 0;
        const p = readParameters(), floorY = scene.clientHeight - 48, radius = 13;
        const maxHeight = Math.max(p.height, Number(inputs.height.max) || p.height);
        const scale = Math.max(1, (floorY - radius - 55) / maxHeight);
        const heldWorldPoint = cameraWorldPoint(state.camera, point);
        const objectCenterY = floorY - radius - p.height * scale;
        drag = { type: "object", id: event.pointerId, offsetY: heldWorldPoint.y - objectCenterY };
        scene.classList.add("is-view-dragging"); try { scene.setPointerCapture(event.pointerId); } catch {} intercept(event); drawScene(); return;
      }
      if (state.running && body) { status.textContent = "Pause a simulação antes de reposicionar os objetos."; intercept(event); return; }
      const shouldPan = event.pointerType === "touch" ? scene.classList.contains("lab-view-pan-mode")
        : event.button === 1 || event.button === 2 || event.shiftKey || space || (scene.classList.contains("lab-view-pan-mode") && event.button === 0);
      if (!shouldPan) return;
      drag = { type: "camera", id: event.pointerId, x: event.clientX, y: event.clientY }; scene.classList.add("is-view-dragging"); try { scene.setPointerCapture(event.pointerId); } catch {} intercept(event);
    }, true);
    scene.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch" && pointers.has(event.pointerId)) pointers.set(event.pointerId, local(event));
      if (pinch?.ids.includes(event.pointerId)) {
        const a = pointers.get(pinch.ids[0]), b = pointers.get(pinch.ids[1]);
        if (a && b) {
          const centerNow = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, distance = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
          Object.assign(state.camera, pinch.camera); zoomCameraAtPoint(state.camera, distance / pinch.distance, pinch.center);
          panCameraBy(state.camera, centerNow.x - pinch.center.x, centerNow.y - pinch.center.y); updateZoom(); event.preventDefault(); return;
        }
      }
      if (!drag || drag.id !== event.pointerId) return;
      if (drag.type === "camera") { panCameraBy(state.camera, event.clientX - drag.x, event.clientY - drag.y); drag.x = event.clientX; drag.y = event.clientY; updateZoom(); return; }
      const p = readParameters(), maxHeight = Math.max(p.height, Number(inputs.height.max) || p.height);
      const floorY = scene.clientHeight - 48, radius = 13, scale = Math.max(1, (floorY - radius - 55) / maxHeight);
      const world = cameraWorldPoint(state.camera, local(event));
      const objectCenterY = world.y - (drag.offsetY || 0);
      const minHeight = Number(inputs.height.min) || 0, maxInputHeight = Number(inputs.height.max) || maxHeight;
      const step = Number(inputs.height.step) || 1;
      const requestedHeight = (floorY - radius - objectCenterY) / scale;
      const height = Math.max(minHeight, Math.min(maxInputHeight, minHeight + Math.round((requestedHeight - minHeight) / step) * step));
      inputs.height.value = String(height); state.time = 0; state.lastFrame = 0; state.loopDelayUntil = 0; drawAll();
    }, true);
    const finish = (event) => {
      if (event.pointerType === "touch") pointers.delete(event.pointerId);
      if (drag?.id === event.pointerId) { drag = null; scene.classList.remove("is-view-dragging"); drawAll(); }
      if (pinch?.ids.includes(event.pointerId)) { pinch = null; if (!pointers.size) scene.classList.remove("lab-view-multitouch"); }
    };
    scene.addEventListener("pointerup", finish, true); scene.addEventListener("pointercancel", finish, true); scene.addEventListener("lostpointercapture", finish, true);
    scene.addEventListener("contextmenu", (event) => event.preventDefault());
    updateZoom();
  }
  window.addEventListener("resize", drawAll);
  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(drawAll);
    observer.observe(scene);
    observer.observe(chart);
  }
  installFreefallViewControls();
  drawAll();
}
