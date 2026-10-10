import {
  projectileAtTime,
  projectileMetrics,
  pendulumStep,
  pendulumEnergyPerMass
} from "./laboratorio-core.js";

const byId = (id) => document.getElementById(id);
const activeTopic = new URLSearchParams(location.search).get("topico");
document.querySelectorAll("[data-lab-special]").forEach((section) => {
  section.hidden = section.dataset.labSpecial !== activeTopic;
});
const number = (value, digits = 1) => Number(value).toLocaleString("pt-BR", {
  minimumFractionDigits: digits,
  maximumFractionDigits: digits
});
const cssColor = (name, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
const palette = () => ({
  text: cssColor("--text", "#f4f5f8"),
  muted: cssColor("--muted", "#9aa6b9"),
  gold: cssColor("--gold", "#d6b87a"),
  blue: cssColor("--blue", "#79a8ff"),
  line: cssColor("--line", "rgba(206,218,240,.18)"),
  surface: cssColor("--surface-2", "#131f32")
});

function canvasContext(canvas) {
  const context = canvas?.getContext("2d", { alpha: false });
  if (!context) return null;
  return context;
}

function resizeCanvas(canvas, context) {
  const box = canvas.getBoundingClientRect();
  const width = Math.max(320, box.width || 320);
  const height = Math.max(180, box.height || 240);
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

const projectileCanvas = byId("projectile-canvas");
const projectileContext = canvasContext(projectileCanvas);
const projectileChart = byId("projectile-chart");
const projectileChartContext = canvasContext(projectileChart);
const projectileGraphSelect = byId("projectile-graph");
const projectileSpeed = byId("projectile-speed");
const projectileAngle = byId("projectile-angle");
const projectileHeight = byId("projectile-height");
const projectileGravity = byId("projectile-gravity");
const projectilePlayback = byId("projectile-speed-playback");
const projectilePlay = byId("projectile-play");
const projectileReset = byId("projectile-reset");
let projectileTime = 0;
let projectileRunning = false;
let projectileLastFrame = 0;
let projectileFrame = 0;

function projectileParameters() {
  return {
    speed: Number(projectileSpeed.value),
    angleDegrees: Number(projectileAngle.value),
    height: Number(projectileHeight.value),
    gravity: Number(projectileGravity.value)
  };
}

function drawSportBall(context, x, y, radius, color) {
  const sphere = context.createRadialGradient(x - radius * 0.35, y - radius * 0.42, 1, x, y, radius * 1.15);
  sphere.addColorStop(0, "#fff0bd"); sphere.addColorStop(0.28, color.gold); sphere.addColorStop(1, "#92501b");
  context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fillStyle = sphere; context.fill();
  context.save(); context.beginPath(); context.arc(x, y, radius - 0.5, 0, Math.PI * 2); context.clip();
  context.strokeStyle = "rgba(36,24,12,.72)"; context.lineWidth = Math.max(1, radius * 0.09);
  context.beginPath(); context.arc(x - radius * 0.65, y, radius * 0.9, -1.15, 1.15); context.stroke();
  context.beginPath(); context.arc(x + radius * 0.65, y, radius * 0.9, Math.PI - 1.15, Math.PI + 1.15); context.stroke();
  context.beginPath(); context.moveTo(x - radius, y - radius * 0.18); context.quadraticCurveTo(x, y - radius * 0.48, x + radius, y - radius * 0.18); context.stroke();
  context.beginPath(); context.moveTo(x - radius, y + radius * 0.18); context.quadraticCurveTo(x, y + radius * 0.48, x + radius, y + radius * 0.18); context.stroke();
  context.restore(); context.strokeStyle = color.text; context.lineWidth = 1.3; context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.stroke();
}

function drawVector(context, x1, y1, x2, y2, color, label) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  context.strokeStyle = color; context.fillStyle = color; context.lineWidth = 2.3;
  context.beginPath(); context.moveTo(x1, y1); context.lineTo(x2, y2); context.stroke();
  context.beginPath(); context.moveTo(x2, y2); context.lineTo(x2 - 8 * Math.cos(angle - 0.46), y2 - 8 * Math.sin(angle - 0.46)); context.lineTo(x2 - 8 * Math.cos(angle + 0.46), y2 - 8 * Math.sin(angle + 0.46)); context.closePath(); context.fill();
  context.font = "11px system-ui, sans-serif"; context.fillText(label, x2 + 4, y2 - 4);
}

function drawProjectile() {
  if (!projectileContext || !projectileCanvas) return;
  const { width, height } = resizeCanvas(projectileCanvas, projectileContext);
  const context = projectileContext;
  const color = palette();
  const parameters = projectileParameters();
  const metrics = projectileMetrics(parameters);
  const left = 52;
  const right = width - 20;
  const top = 22;
  const bottom = height - 40;
  const ballRadius = 9;
  const plotWidth = Math.max(1, right - left);
  const plotHeight = Math.max(1, bottom - top);
  const maxX = Math.max(metrics.range * 1.08, 1);
  const maxY = Math.max(metrics.maxHeight * 1.16, 1);
  const px = (x) => left + x / maxX * plotWidth;
  const py = (y) => bottom - ballRadius - y / maxY * Math.max(1, plotHeight - ballRadius);

  const backdrop = context.createLinearGradient(0, 0, 0, height);
  backdrop.addColorStop(0, color.surface); backdrop.addColorStop(0.72, color.surface); backdrop.addColorStop(1, "#182b2c");
  context.fillStyle = backdrop;
  context.fillRect(0, 0, width, height);
  context.font = "12px system-ui, sans-serif";
  context.lineWidth = 1;
  context.strokeStyle = color.line;
  context.fillStyle = color.muted;
  for (let i = 0; i <= 4; i += 1) {
    const gx = left + plotWidth * i / 4;
    const gy = top + plotHeight * i / 4;
    context.beginPath(); context.moveTo(gx, top); context.lineTo(gx, bottom); context.stroke();
    context.beginPath(); context.moveTo(left, gy); context.lineTo(right, gy); context.stroke();
    context.fillText(number(maxX * i / 4, 0), gx - 10, bottom + 18);
    context.fillText(number(maxY * (4 - i) / 4, 0), 7, gy + 4);
  }

  context.fillStyle = "rgba(78,133,102,.22)"; context.fillRect(left, bottom, plotWidth, height - bottom);
  context.strokeStyle = color.text;
  context.beginPath(); context.moveTo(left, top); context.lineTo(left, bottom); context.lineTo(right, bottom); context.stroke();
  context.strokeStyle = "rgba(220,208,159,.42)"; context.lineWidth = 2;
  for (let x = left + 8; x < right; x += 23) { context.beginPath(); context.moveTo(x, bottom + 7); context.lineTo(x + 9, bottom + 7); context.stroke(); }
  const launcherX = px(0);
  context.fillStyle = color.blue; context.globalAlpha = 0.75; context.fillRect(launcherX - 15, py(parameters.height) + 10, 30, Math.max(4, bottom - py(parameters.height) - 10)); context.globalAlpha = 1;
  context.fillStyle = color.text;
  context.fillText("x (m)", right - 32, height - 8);
  context.fillText("y (m)", 8, 15);
  context.fillStyle = color.muted; context.font = "10px system-ui"; context.fillText("Referencial fixo do solo · O no lançamento", left + 5, top + 13);

  const steps = 180;
  context.beginPath();
  for (let i = 0; i <= steps; i += 1) {
    const point = projectileAtTime(metrics.flightTime * i / steps, parameters);
    if (i === 0) context.moveTo(px(point.x), py(Math.max(0, point.y)));
    else context.lineTo(px(point.x), py(Math.max(0, point.y)));
  }
  context.setLineDash([5, 5]);
  context.strokeStyle = color.gold;
  context.globalAlpha = 0.55;
  context.lineWidth = 1.5;
  context.stroke();
  context.setLineDash([]);
  context.globalAlpha = 1;

  const elapsed = Math.min(projectileTime, metrics.flightTime);
  const point = projectileAtTime(elapsed, parameters);
  context.beginPath();
  context.moveTo(px(0), py(parameters.height));
  context.lineTo(px(point.x), py(Math.max(0, point.y)));
  context.lineWidth = 3;
  context.strokeStyle = color.gold;
  context.stroke();

  const ballX = px(point.x), ballY = py(Math.max(0, point.y));
  context.strokeStyle = color.blue; context.setLineDash([3, 4]); context.beginPath(); context.moveTo(ballX, ballY); context.lineTo(ballX, bottom); context.stroke(); context.setLineDash([]);
  drawSportBall(context, ballX, ballY, ballRadius, color);
  if (elapsed < metrics.flightTime - 0.03) {
    const vectorLength = 34; const scale = vectorLength / Math.max(parameters.speed, 0.01);
    const vxPixels = point.vx * scale, vyPixels = -point.vy * scale;
    if (Math.abs(vxPixels) > 1) drawVector(context, ballX + 2, ballY - 13, ballX + 2 + vxPixels, ballY - 13, color.blue, "vₓ");
    if (Math.abs(vyPixels) > 1) drawVector(context, ballX + 5, ballY - 7, ballX + 5, ballY - 7 + vyPixels, color.text, "vᵧ");
  }

  byId("projectile-time").textContent = number(elapsed, 2) + " s";
  byId("projectile-x").textContent = number(point.x, 1) + " m";
  byId("projectile-y").textContent = number(Math.max(0, point.y), 1) + " m";
  byId("projectile-range").textContent = number(metrics.range, 1) + " m";
  byId("projectile-apex").textContent = number(metrics.maxHeight, 1) + " m";
  byId("projectile-speed-out").textContent = number(parameters.speed, 1) + " m/s";
  byId("projectile-angle-out").textContent = number(parameters.angleDegrees, 0) + "°";
  byId("projectile-height-out").textContent = number(parameters.height, 1) + " m";
  byId("projectile-gravity-out").textContent = number(parameters.gravity, 2) + " m/s²";
  byId("projectile-playback-out").textContent = number(projectilePlayback.value, 2).replace(/,00$/, "") + "×";
  drawProjectileChart();
}

const projectileCharts = {
  x: { xLabel: "Tempo (s)", yLabel: "Posição x (m)", value: (point) => point.x },
  y: { xLabel: "Tempo (s)", yLabel: "Posição y (m)", value: (point) => point.y },
  vx: { xLabel: "Tempo (s)", yLabel: "Velocidade vx (m/s)", value: (point) => point.vx },
  vy: { xLabel: "Tempo (s)", yLabel: "Velocidade vy (m/s)", value: (point) => point.vy },
  trajectory: { xLabel: "Posição x (m)", yLabel: "Altura y (m)", value: (point) => point.y }
};
let projectilePlot = null;

if (projectileGraphSelect) {
  projectileGraphSelect.innerHTML = '<option value="x">x(t)</option><option value="y">y(t)</option><option value="vx">vx(t)</option><option value="vy">vy(t)</option><option value="trajectory">Trajetória y(x)</option>';
  projectileGraphSelect.addEventListener("change", drawProjectile);
}

function drawProjectileChart() {
  if (!projectileChartContext || !projectileChart) return;
  const { width, height } = resizeCanvas(projectileChart, projectileChartContext);
  const context = projectileChartContext;
  const color = palette();
  const parameters = projectileParameters();
  const metrics = projectileMetrics(parameters);
  const type = projectileGraphSelect?.value || "x";
  const config = projectileCharts[type] || projectileCharts.x;
  const trajectory = type === "trajectory";
  const xMax = trajectory ? Math.max(metrics.range, 1) : Math.max(metrics.flightTime, 0.1);
  const samples = Array.from({ length: 121 }, (_, i) => {
    const t = metrics.flightTime * i / 120;
    const point = projectileAtTime(t, parameters);
    return { x: trajectory ? point.x : t, y: config.value(point) };
  });
  const currentTime = Math.min(projectileTime, metrics.flightTime);
  const current = projectileAtTime(currentTime, parameters);
  const cursor = { x: trajectory ? current.x : currentTime, y: config.value(current) };
  const yValues = samples.map((sample) => sample.y).concat(cursor.y);
  let yMin = Math.min(...yValues), yMax = Math.max(...yValues);
  if (Math.abs(yMax - yMin) < 1e-9) { yMin -= 1; yMax += 1; }
  const yPadding = (yMax - yMin) * 0.12;
  yMin -= yPadding; yMax += yPadding;
  const plot = { left: 48, right: width - 16, top: 17, bottom: height - 41 };
  const px = (x) => plot.left + x / xMax * (plot.right - plot.left);
  const py = (y) => plot.bottom - (y - yMin) / (yMax - yMin) * (plot.bottom - plot.top);
  context.fillStyle = color.surface; context.fillRect(0, 0, width, height);
  context.font = "10px system-ui, sans-serif"; context.lineWidth = 1; context.strokeStyle = color.line; context.fillStyle = color.muted;
  for (let i = 0; i <= 4; i += 1) {
    const x = plot.left + (plot.right - plot.left) * i / 4;
    const y = plot.top + (plot.bottom - plot.top) * i / 4;
    context.beginPath(); context.moveTo(x, plot.top); context.lineTo(x, plot.bottom); context.stroke();
    context.beginPath(); context.moveTo(plot.left, y); context.lineTo(plot.right, y); context.stroke();
    context.fillText(number(xMax * i / 4, 1), x - 10, plot.bottom + 15);
    context.fillText(number(yMax - (yMax - yMin) * i / 4, 1), 2, y + 3);
  }
  context.strokeStyle = color.text; context.beginPath(); context.moveTo(plot.left, plot.top); context.lineTo(plot.left, plot.bottom); context.lineTo(plot.right, plot.bottom); context.stroke();
  context.beginPath();
  samples.forEach((sample, index) => { if (index === 0) context.moveTo(px(sample.x), py(sample.y)); else context.lineTo(px(sample.x), py(sample.y)); });
  context.strokeStyle = color.gold; context.lineWidth = 2.2; context.stroke();
  const cursorX = px(cursor.x), cursorY = py(cursor.y);
  context.strokeStyle = color.blue; context.setLineDash([4, 4]); context.beginPath(); context.moveTo(cursorX, plot.top); context.lineTo(cursorX, plot.bottom); context.stroke(); context.setLineDash([]);
  context.fillStyle = color.blue; context.beginPath(); context.arc(cursorX, cursorY, 5, 0, 2 * Math.PI); context.fill(); context.strokeStyle = color.text; context.lineWidth = 1.5; context.stroke();
  context.fillStyle = color.text; context.fillText(trajectory ? "Posição x (m)" : config.xLabel, Math.max(plot.left, width / 2 - 36), height - 5); context.fillText(config.yLabel, 4, 12);
  projectilePlot = { ...plot, xMax, trajectory, flightTime: metrics.flightTime };
}

projectileChart?.addEventListener("click", (event) => {
  if (!projectilePlot) return;
  const bounds = projectileChart.getBoundingClientRect();
  const x = event.clientX - bounds.left;
  if (x < projectilePlot.left || x > projectilePlot.right) return;
  const fraction = (x - projectilePlot.left) / (projectilePlot.right - projectilePlot.left);
  const value = fraction * projectilePlot.xMax;
  projectileTime = projectilePlot.trajectory
    ? Math.min(projectilePlot.flightTime, value / Math.max(1e-9, projectileParameters().speed * Math.cos(projectileParameters().angleDegrees * Math.PI / 180)))
    : fraction * projectilePlot.flightTime;
  if (projectileRunning) {
    projectileRunning = false;
    cancelAnimationFrame(projectileFrame);
    projectilePlay.textContent = "Continuar";
    projectilePlay.setAttribute("aria-pressed", "false");
    byId("projectile-status").textContent = "Instante selecionado no gráfico; simulação pausada.";
  }
  drawProjectile();
});
projectileChart?.addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) || !projectilePlot) return;
  event.preventDefault();
  if (event.key === "Home") projectileTime = 0;
  else if (event.key === "End") projectileTime = projectilePlot.flightTime;
  else {
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const step = projectilePlot.flightTime / 100 * (event.shiftKey ? 10 : 1);
    projectileTime = Math.max(0, Math.min(projectilePlot.flightTime, projectileTime + direction * step));
  }
  if (projectileRunning) {
    projectileRunning = false;
    cancelAnimationFrame(projectileFrame);
    projectilePlay.textContent = "Continuar";
    projectilePlay.setAttribute("aria-pressed", "false");
    byId("projectile-status").textContent = "Instante selecionado no gráfico; simulação pausada.";
  }
  drawProjectile();
});

function resetProjectile(message = "Pronto para iniciar. Ajuste os controles para alterar o lançamento.") {
  projectileRunning = false;
  projectileTime = 0;
  projectileLastFrame = 0;
  cancelAnimationFrame(projectileFrame);
  projectilePlay.textContent = "Iniciar";
  projectilePlay.setAttribute("aria-pressed", "false");
  byId("projectile-status").textContent = message;
  drawProjectile();
}

function projectileTick(timestamp) {
  if (!projectileRunning) return;
  if (projectileLastFrame) {
    projectileTime += Math.min(0.05, (timestamp - projectileLastFrame) / 1000) * Number(projectilePlayback.value);
  }
  projectileLastFrame = timestamp;
  const flightTime = projectileMetrics(projectileParameters()).flightTime;
  if (projectileTime >= flightTime) {
    projectileTime = flightTime;
    projectileRunning = false;
    projectilePlay.textContent = "Executar novamente";
    projectilePlay.setAttribute("aria-pressed", "false");
    byId("projectile-status").textContent = "Simulação concluída. O modelo prevê que o projétil retorna ao solo neste instante.";
  }
  drawProjectile();
  if (projectileRunning) projectileFrame = requestAnimationFrame(projectileTick);
}

projectilePlay.addEventListener("click", () => {
  if (projectileRunning) {
    projectileRunning = false;
    projectilePlay.textContent = "Continuar";
    projectilePlay.setAttribute("aria-pressed", "false");
    byId("projectile-status").textContent = "Simulação pausada.";
    cancelAnimationFrame(projectileFrame);
    return;
  }
  if (projectileTime >= projectileMetrics(projectileParameters()).flightTime) projectileTime = 0;
  projectileRunning = true;
  projectileLastFrame = 0;
  projectilePlay.textContent = "Pausar";
  projectilePlay.setAttribute("aria-pressed", "true");
  byId("projectile-status").textContent = "Simulação em andamento. Os valores são calculados pelas equações do movimento.";
  projectileFrame = requestAnimationFrame(projectileTick);
});
projectileReset.addEventListener("click", () => resetProjectile());
[projectileSpeed, projectileAngle, projectileHeight, projectileGravity].forEach((control) =>
  control.addEventListener("input", () => resetProjectile("Parâmetros atualizados. A simulação voltou ao instante inicial."))
);
projectilePlayback.addEventListener("input", drawProjectile);

const pendulumCanvas = byId("pendulum-canvas");
const pendulumContext = canvasContext(pendulumCanvas);
const pendulumChart = byId("pendulum-chart");
const pendulumChartContext = canvasContext(pendulumChart);
const pendulumTimeScrubber = byId("pendulum-time-scrubber");
const pendulumTimeOutput = byId("pendulum-time-out");
const pendulumLength = byId("pendulum-length");
const pendulumInitialAngle = byId("pendulum-angle");
const pendulumGravity = byId("pendulum-gravity");
const pendulumPlayback = byId("pendulum-playback");
const pendulumPlay = byId("pendulum-play");
const pendulumReset = byId("pendulum-reset");
const fixedStep = 1 / 480;
const sampleStep = 1 / 30;
const maxPendulumTime = 12;
let pendulumState = { theta: 35 * Math.PI / 180, omega: 0 };
let pendulumTime = 0;
let pendulumRunning = false;
let pendulumLastFrame = 0;
let pendulumAccumulator = 0;
let pendulumSampleAccumulator = 0;
let pendulumFrame = 0;
let pendulumHistory = [];
let initialPendulumEnergy = 0;
let cameraAzimuth = -0.7;
let cameraElevation = 0.38;
let pointerPosition = null;

function pendulumParameters() {
  return {
    length: Number(pendulumLength.value),
    angleDegrees: Number(pendulumInitialAngle.value),
    gravity: Number(pendulumGravity.value)
  };
}

function resetPendulum(message = "Em repouso. O modelo usa a equação não linear do pêndulo, sem a aproximação de ângulo pequeno.") {
  pendulumRunning = false;
  pendulumTime = 0;
  pendulumLastFrame = 0;
  pendulumAccumulator = 0;
  pendulumSampleAccumulator = 0;
  cancelAnimationFrame(pendulumFrame);
  const parameters = pendulumParameters();
  pendulumState = { theta: parameters.angleDegrees * Math.PI / 180, omega: 0 };
  initialPendulumEnergy = pendulumEnergyPerMass(pendulumState, parameters.length, parameters.gravity).total;
  pendulumHistory = [{ time: 0, theta: pendulumState.theta }];
  pendulumPlay.textContent = "Iniciar";
  pendulumPlay.setAttribute("aria-pressed", "false");
  byId("pendulum-status").textContent = message;
  drawPendulum();
}

function project3D(x, y, z, originX, originY, scale) {
  const ca = Math.cos(cameraAzimuth);
  const sa = Math.sin(cameraAzimuth);
  const ce = Math.cos(cameraElevation);
  const se = Math.sin(cameraElevation);
  const right = x * ca + y * sa;
  const up = x * se * sa - y * se * ca + z * ce;
  return { x: originX + right * scale, y: originY - up * scale };
}

function drawPendulumModel() {
  if (!pendulumContext || !pendulumCanvas) return;
  const { width, height } = resizeCanvas(pendulumCanvas, pendulumContext);
  const context = pendulumContext;
  const color = palette();
  const parameters = pendulumParameters();
  const length = parameters.length;
  const originX = width / 2;
  const originY = Math.max(52, height * 0.28);
  const scale = Math.max(24, Math.min((width - 76) / (2.55 * length), (height - 92) / (1.72 * length)));
  context.fillStyle = color.surface;
  context.fillRect(0, 0, width, height);

  const point = (x, y, z) => project3D(x, y, z, originX, originY, scale);
  const floor = -length * 1.12;
  context.lineWidth = 1;
  context.strokeStyle = color.line;
  context.globalAlpha = 0.72;
  for (let i = -2; i <= 2; i += 1) {
    const offset = i * length * 0.42;
    let a = point(offset, -length, floor);
    let b = point(offset, length, floor);
    context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.stroke();
    a = point(-length, offset, floor);
    b = point(length, offset, floor);
    context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.stroke();
  }
  context.globalAlpha = 1;

  const xAxis = point(length * 0.68, 0, 0);
  const yAxis = point(0, length * 0.68, 0);
  const zAxis = point(0, 0, -length * 0.78);
  const drawAxis = (end, label, axisColor) => {
    context.beginPath(); context.moveTo(originX, originY); context.lineTo(end.x, end.y);
    context.strokeStyle = axisColor; context.lineWidth = 1.5; context.stroke();
    context.fillStyle = axisColor; context.fillText(label, end.x + 5, end.y);
  };
  context.font = "12px system-ui, sans-serif";
  drawAxis(xAxis, "x", color.gold);
  drawAxis(yAxis, "y", color.blue);
  drawAxis(zAxis, "z", color.muted);

  const theta = pendulumState.theta;
  const bobWorld = { x: length * Math.sin(theta), y: 0, z: -length * Math.cos(theta) };
  const bob = point(bobWorld.x, bobWorld.y, bobWorld.z);
  const pivot = point(0, 0, 0);
  context.beginPath();
  context.moveTo(pivot.x, pivot.y);
  context.lineTo(bob.x, bob.y);
  context.strokeStyle = color.text;
  context.lineWidth = 3;
  context.stroke();

  context.beginPath();
  context.ellipse(originX, originY, Math.abs(scale * length * Math.sin(theta)), Math.max(3, scale * length * 0.08), 0, 0, Math.PI * 2);
  context.strokeStyle = color.gold;
  context.globalAlpha = 0.38;
  context.setLineDash([4, 5]);
  context.stroke();
  context.setLineDash([]);
  context.globalAlpha = 1;

  context.beginPath();
  context.arc(pivot.x, pivot.y, 6, 0, Math.PI * 2);
  context.fillStyle = color.text;
  context.fill();

  const radius = Math.max(10, Math.min(17, scale * length * 0.11));
  const gradient = context.createRadialGradient(bob.x - radius * 0.35, bob.y - radius * 0.4, 1, bob.x, bob.y, radius * 1.2);
  gradient.addColorStop(0, color.text);
  gradient.addColorStop(0.32, color.gold);
  gradient.addColorStop(1, "#735426");
  context.beginPath();
  context.arc(bob.x, bob.y, radius, 0, Math.PI * 2);
  context.fillStyle = gradient;
  context.fill();
  context.lineWidth = 1.5;
  context.strokeStyle = color.text;
  context.stroke();

  context.fillStyle = color.muted;
  context.font = "11px system-ui, sans-serif";
  context.fillText("Plano de referência z = −L", 12, height - 14);
  pendulumCanvas.setAttribute("aria-label", "Projeção espacial 2D interativa de um pêndulo com comprimento " + number(length, 2) + " metros e ângulo " + number(theta * 180 / Math.PI, 1) + " graus.");
}

function drawPendulumChart() {
  if (!pendulumChartContext || !pendulumChart) return;
  const { width, height } = resizeCanvas(pendulumChart, pendulumChartContext);
  const context = pendulumChartContext;
  const color = palette();
  const left = 48;
  const right = width - 18;
  const top = 18;
  const bottom = height - 34;
  const plotWidth = right - left;
  const plotHeight = bottom - top;
  const maxAngle = Math.max(45, Number(pendulumInitialAngle.value) + 10);
  context.fillStyle = color.surface;
  context.fillRect(0, 0, width, height);
  context.font = "11px system-ui, sans-serif";
  context.strokeStyle = color.line;
  context.fillStyle = color.muted;
  for (let i = 0; i <= 4; i += 1) {
    const y = top + plotHeight * i / 4;
    context.beginPath(); context.moveTo(left, y); context.lineTo(right, y); context.stroke();
    context.fillText(number(maxAngle - 2 * maxAngle * i / 4, 0) + "°", 3, y + 4);
    const x = left + plotWidth * i / 4;
    context.beginPath(); context.moveTo(x, top); context.lineTo(x, bottom); context.stroke();
    context.fillText(number(maxPendulumTime * i / 4, 0), x - 4, height - 10);
  }
  const toX = (time) => left + Math.min(maxPendulumTime, time) / maxPendulumTime * plotWidth;
  const toY = (theta) => top + (maxAngle - theta * 180 / Math.PI) / (2 * maxAngle) * plotHeight;
  context.strokeStyle = color.muted;
  context.lineWidth = 1;
  context.beginPath(); context.moveTo(left, toY(0)); context.lineTo(right, toY(0)); context.stroke();
  if (pendulumHistory.length) {
    context.beginPath();
    pendulumHistory.forEach((sample, index) => {
      const x = toX(sample.time);
      const y = toY(sample.theta);
      if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
    });
    if (pendulumTime < maxPendulumTime) {
      const x = toX(pendulumTime);
      const y = toY(pendulumState.theta);
      context.lineTo(x, y);
    }
    context.strokeStyle = color.gold;
    context.lineWidth = 2;
    context.stroke();
  }
  context.fillStyle = color.text;
  context.fillText("t (s)", right - 24, height - 10);
  context.fillText("θ", 8, 13);
  const cursorX = toX(pendulumTime);
  const cursorY = toY(pendulumState.theta);
  context.strokeStyle = color.blue;
  context.setLineDash([4, 4]);
  context.beginPath(); context.moveTo(cursorX, top); context.lineTo(cursorX, bottom); context.stroke();
  context.setLineDash([]);
  context.fillStyle = color.blue;
  context.beginPath(); context.arc(cursorX, cursorY, 5, 0, 2 * Math.PI); context.fill();
  context.lineWidth = 1.5; context.strokeStyle = color.text; context.stroke();
}

function drawPendulum() {
  const parameters = pendulumParameters();
  drawPendulumModel();
  drawPendulumChart();
  const energy = pendulumEnergyPerMass(pendulumState, parameters.length, parameters.gravity);
  const drift = initialPendulumEnergy > 0 ? Math.abs((energy.total - initialPendulumEnergy) / initialPendulumEnergy) * 100 : 0;
  byId("pendulum-time").textContent = number(pendulumTime, 2) + " s";
  byId("pendulum-angle-readout").textContent = number(pendulumState.theta * 180 / Math.PI, 1) + "°";
  byId("pendulum-omega").textContent = number(pendulumState.omega, 2) + " rad/s";
  byId("pendulum-kinetic").textContent = number(energy.kinetic, 2) + " J/kg";
  byId("pendulum-potential").textContent = number(energy.potential, 2) + " J/kg";
  byId("pendulum-energy-drift").textContent = number(drift, 3) + "%";
  byId("pendulum-length-out").textContent = number(parameters.length, 2) + " m";
  byId("pendulum-angle-out").textContent = number(parameters.angleDegrees, 0) + "°";
  byId("pendulum-gravity-out").textContent = number(parameters.gravity, 2) + " m/s²";
  byId("pendulum-playback-out").textContent = number(pendulumPlayback.value, 2).replace(/,00$/, "") + "×";
  if (pendulumTimeScrubber) pendulumTimeScrubber.value = String(pendulumTime);
  if (pendulumTimeOutput) pendulumTimeOutput.textContent = number(pendulumTime, 2) + " s";
}

function seekPendulum(targetTime) {
  pendulumRunning = false;
  pendulumLastFrame = 0;
  pendulumAccumulator = 0;
  cancelAnimationFrame(pendulumFrame);
  const parameters = pendulumParameters();
  pendulumState = { theta: parameters.angleDegrees * Math.PI / 180, omega: 0 };
  pendulumTime = 0;
  pendulumHistory = [{ time: 0, theta: pendulumState.theta }];
  let nextSample = sampleStep;
  const target = Math.max(0, Math.min(maxPendulumTime, Number(targetTime) || 0));
  while (pendulumTime < target) {
    const dt = Math.min(fixedStep, target - pendulumTime);
    pendulumState = pendulumStep(pendulumState, parameters, dt);
    pendulumTime += dt;
    if (pendulumTime + 1e-10 >= nextSample) {
      pendulumHistory.push({ time: pendulumTime, theta: pendulumState.theta });
      nextSample += sampleStep;
    }
  }
  pendulumPlay.textContent = "Iniciar";
  pendulumPlay.setAttribute("aria-pressed", "false");
  byId("pendulum-status").textContent = "Instante selecionado. Estado, energia e marcador foram reconstruídos pelo mesmo integrador.";
  drawPendulum();
}

pendulumTimeScrubber?.addEventListener("input", (event) => seekPendulum(Number(event.target.value)));
pendulumChart?.addEventListener("click", (event) => {
  const rect = pendulumChart.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const left = 48, right = rect.width - 18;
  if (x < left || x > right) return;
  seekPendulum((x - left) / (right - left) * maxPendulumTime);
});
pendulumChart?.addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  if (event.key === "Home") seekPendulum(0);
  else if (event.key === "End") seekPendulum(maxPendulumTime);
  else seekPendulum(pendulumTime + (event.key === "ArrowRight" ? 1 : -1) * (event.shiftKey ? 1.2 : 0.12));
});

function pendulumTick(timestamp) {
  if (!pendulumRunning) return;
  if (pendulumLastFrame) {
    const elapsed = Math.min(0.05, (timestamp - pendulumLastFrame) / 1000) * Number(pendulumPlayback.value);
    pendulumAccumulator += elapsed;
    pendulumSampleAccumulator += elapsed;
    const parameters = pendulumParameters();
    while (pendulumAccumulator >= fixedStep && pendulumTime < maxPendulumTime) {
      pendulumState = pendulumStep(pendulumState, parameters, fixedStep);
      pendulumTime += fixedStep;
      pendulumAccumulator -= fixedStep;
      if (pendulumSampleAccumulator >= sampleStep) {
        pendulumHistory.push({ time: pendulumTime, theta: pendulumState.theta });
        pendulumSampleAccumulator %= sampleStep;
      }
    }
  }
  pendulumLastFrame = timestamp;
  if (pendulumTime >= maxPendulumTime) {
    pendulumTime = maxPendulumTime;
    pendulumRunning = false;
    pendulumHistory.push({ time: maxPendulumTime, theta: pendulumState.theta });
    pendulumPlay.textContent = "Executar novamente";
    pendulumPlay.setAttribute("aria-pressed", "false");
    byId("pendulum-status").textContent = "Trecho de 12 segundos concluído. Recomece ou altere os parâmetros para outra observação.";
  }
  drawPendulum();
  if (pendulumRunning) pendulumFrame = requestAnimationFrame(pendulumTick);
}

pendulumPlay.addEventListener("click", () => {
  if (pendulumRunning) {
    pendulumRunning = false;
    pendulumPlay.textContent = "Continuar";
    pendulumPlay.setAttribute("aria-pressed", "false");
    byId("pendulum-status").textContent = "Simulação pausada.";
    cancelAnimationFrame(pendulumFrame);
    return;
  }
  if (pendulumTime >= maxPendulumTime) resetPendulum("Reiniciada. A simulação será executada por até 12 segundos.");
  pendulumRunning = true;
  pendulumLastFrame = 0;
  pendulumPlay.textContent = "Pausar";
  pendulumPlay.setAttribute("aria-pressed", "true");
  byId("pendulum-status").textContent = "Simulação em andamento. Energia e gráfico vêm do estado integrado do pêndulo.";
  pendulumFrame = requestAnimationFrame(pendulumTick);
});
pendulumReset.addEventListener("click", () => resetPendulum());
[pendulumLength, pendulumInitialAngle, pendulumGravity].forEach((control) =>
  control.addEventListener("input", () => resetPendulum("Parâmetros atualizados. Estado, gráfico e energia foram reiniciados."))
);
pendulumPlayback.addEventListener("input", drawPendulum);

document.querySelectorAll("[data-pendulum-view]").forEach((button) => {
  button.addEventListener("click", () => {
    const view = button.dataset.pendulumView;
    if (view === "front") { cameraAzimuth = 0; cameraElevation = 0.28; }
    if (view === "side") { cameraAzimuth = Math.PI / 2; cameraElevation = 0.28; }
    if (view === "orbit") { cameraAzimuth = -0.7; cameraElevation = 0.38; }
    document.querySelectorAll("[data-pendulum-view]").forEach((other) =>
      other.setAttribute("aria-pressed", String(other === button))
    );
    byId("pendulum-status").textContent = "Perspectiva " + button.textContent.toLowerCase() + " selecionada.";
    drawPendulum();
  });
});

pendulumCanvas.addEventListener("pointerdown", (event) => {
  pointerPosition = { x: event.clientX, y: event.clientY };
  pendulumCanvas.setPointerCapture(event.pointerId);
});
pendulumCanvas.addEventListener("pointermove", (event) => {
  if (!pointerPosition) return;
  const dx = event.clientX - pointerPosition.x;
  const dy = event.clientY - pointerPosition.y;
  pointerPosition = { x: event.clientX, y: event.clientY };
  cameraAzimuth += dx * 0.01;
  cameraElevation = Math.max(-0.25, Math.min(1.05, cameraElevation + dy * 0.006));
  document.querySelectorAll("[data-pendulum-view]").forEach((button) =>
    button.setAttribute("aria-pressed", "false")
  );
  drawPendulumModel();
});
const finishPointer = () => { pointerPosition = null; };
pendulumCanvas.addEventListener("pointerup", finishPointer);
pendulumCanvas.addEventListener("pointercancel", finishPointer);
pendulumCanvas.addEventListener("keydown", (event) => {
  const step = 0.12;
  if (event.key === "ArrowLeft") cameraAzimuth -= step;
  else if (event.key === "ArrowRight") cameraAzimuth += step;
  else if (event.key === "ArrowUp") cameraElevation = Math.min(1.05, cameraElevation + step);
  else if (event.key === "ArrowDown") cameraElevation = Math.max(-0.25, cameraElevation - step);
  else return;
  event.preventDefault();
  drawPendulumModel();
});

window.addEventListener("resize", () => {
  if (activeTopic === "projectile") drawProjectile();
  if (activeTopic === "pendulum") drawPendulum();
});
if (activeTopic === "projectile") drawProjectile();
if (activeTopic === "pendulum") resetPendulum();

