import { freeFallAtTime, freeFallImpactTime } from "./physics-freefall-model.js?v=freefall-20261011-1";

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
  const state = { time: 0, running: false, lastFrame: 0, frame: 0, started: false, graph: "height" };
  const initial = { height: 20, gravity: 9.81, massA: 0.2, massB: 2, playback: 1 };
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

  function drawObject(context, x, y, fill, mass, velocity, palette) {
    const radius = 13;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = fill;
    context.fill();
    context.lineWidth = 2;
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
    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.58;
    ctx.beginPath();
    for (let x = 24; x < width; x += 44) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, height); }
    for (let y = 22; y < height; y += 44) { ctx.moveTo(0, y + 0.5); ctx.lineTo(width, y + 0.5); }
    ctx.stroke();
    ctx.globalAlpha = 1;

    const top = 55;
    const floor = height - 48;
    const scale = Math.max(1, (floor - top - 18) / p.height);
    const leftX = width * 0.37;
    const rightX = width * 0.63;
    const startY = top;
    const currentY = (top + at.displacement * scale);
    const floorY = floor;
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

    const stepMeters = Math.max(1, Math.ceil(p.height / 8));
    ctx.strokeStyle = palette.muted;
    ctx.fillStyle = palette.muted;
    ctx.font = "10px system-ui, sans-serif";
    ctx.textAlign = "right";
    for (let meter = 0; meter <= p.height; meter += stepMeters) {
      const y = startY + meter * scale;
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

    drawObject(ctx, leftX, Math.min(currentY, floorY - 13), palette.blue, p.massA, at.velocity, palette);
    drawObject(ctx, rightX, Math.min(currentY, floorY - 13), palette.gold, p.massB, at.velocity, palette);

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
    $('[data-out="height"]').textContent = fmt(p.height, 0) + " m";
    $('[data-out="gravity"]').textContent = fmt(p.gravity, 2) + " m/s²";
    $('[data-out="massA"]').textContent = fmt(p.massA, 1) + " kg";
    $('[data-out="massB"]').textContent = fmt(p.massB, 1) + " kg";
    $('[data-out="playback"]').textContent = fmt(p.playback, 1) + "×";
    playButton.textContent = state.running ? "Pausar" : (state.started ? (at.time >= at.impactTime ? "Recomeçar" : "Continuar") : "Iniciar");
    playButton.setAttribute("aria-pressed", String(state.running));
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
    if (state.frame) cancelAnimationFrame(state.frame);
    state.frame = 0;
    drawAll();
  }
  function animate(timestamp) {
    if (!state.running) return;
    if (!state.lastFrame) state.lastFrame = timestamp;
    const delta = Math.min(0.05, Math.max(0, (timestamp - state.lastFrame) / 1000));
    state.lastFrame = timestamp;
    state.time += delta * readParameters().playback;
    const impactTime = freeFallImpactTime(readParameters());
    if (state.time >= impactTime) {
      state.time = impactTime;
      state.running = false;
      state.lastFrame = 0;
      status.textContent = "Impacto no solo. Os dois objetos chegam juntos no modelo sem resistência do ar.";
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
  fullButton.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement === lab) await document.exitFullscreen();
      else await lab.requestFullscreen();
    } catch {
      status.textContent = "A tela cheia não está disponível neste navegador.";
    }
  });
  document.addEventListener("fullscreenchange", drawAll);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.running) {
      stopAnimation();
      status.textContent = "Simulação pausada porque a página ficou oculta.";
    }
  });
  window.addEventListener("resize", drawAll);
  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(drawAll);
    observer.observe(scene);
    observer.observe(chart);
  }
  drawAll();
}
