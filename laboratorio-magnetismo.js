import {
  buildCoilSegments,
  finiteCoilFieldAt,
  fieldAngleDegrees,
  fieldMagnitude,
  makeCoil,
  makeFieldModel,
  makeMagnet,
  magnetContainsPoint,
  magnetInteractionForceTorque,
  magnetPrismsOverlap,
  stepMagnetInteraction,
  traceFieldLine
} from "./laboratorio-magnetismo-core.js";

const byId = (id) => document.getElementById(id);
const canvas = byId("magnet-canvas");
const ctx = canvas?.getContext("2d");
if (!canvas || !ctx) throw new Error("Não foi possível iniciar a cena do laboratório de magnetismo.");
const systemPrefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

const initial = () => ({
  mode: "permanent", magnet: makeMagnet(), secondMagnet: makeMagnet({ x: 0.2, y: 0.06, angle: Math.PI, polarity: 1 }),
  coil: makeCoil(), sensor: { x: 0.18, y: 0.1 }, compasses: [{ x: -0.17, y: 0.11 }], selectedCompass: 0,
  showLines: true, showVectors: false, showHeatmap: false, showCurrent: true, showGrid: true, showInterior: true,
  showNumbers: true, earth: false, showMagnetSource: true, showCoilSource: false, density: 18,
  advanced: false, interactionMotion: false, interactionPaused: false, interactionFixed: "first",
  interactionVelocity: { x: 0, y: 0, angle: 0 }, interactionForce: null, reduceMotion: systemPrefersReducedMotion
});
let state = initial();
let view = { width: 0, height: 0, scale: 1, dpr: 1 };
let drag = null;
let redrawFrame = 0;
let interactionFrame = 0;
let lastInteractionTime = 0;
let lastInteractionRender = 0;
let graphComparison = null;
let chartSnapshot = null;
let chartInspection = "Passe o cursor ou toque em um ponto para inspecionar.";
const graphNames = { distance: "Campo × distância", current: "Campo × corrente", turns: "Campo × número de espiras", components: "Componentes Bx e By × posição", axial: "Campo axial da bobina finita" };
const formatter = (digits = 2) => new Intl.NumberFormat("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const formatField = (tesla, digits = 2) => `${formatter(digits).format(tesla * (Math.abs(tesla) >= 1e-3 ? 1e3 : 1e6))} ${Math.abs(tesla) >= 1e-3 ? "mT" : "μT"}`;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function activeFieldModel(overrides = {}) {
  const mode = state.mode;
  const magnets = mode === "interaction" ? [state.magnet, state.secondMagnet]
    : mode === "permanent" ? [state.magnet]
    : mode === "field" ? [state.showMagnetSource ? state.magnet : null]
    : [];
  const useCoil = mode === "electromagnet" || mode === "graphs" || (mode === "field" && state.showCoilSource);
  return makeFieldModel({ magnets, coil: overrides.coil || state.coil, useCoil, earth: state.earth, ...overrides });
}

function setRange(id, value, output, text) {
  const input = byId(id); if (input) input.value = String(value);
  const node = byId(output); if (node) node.textContent = text;
}

function updateControlText() {
  setRange("magnet-angle", Math.round(state.magnet.angle * 180 / Math.PI), "magnet-angle-value", `${Math.round(state.magnet.angle * 180 / Math.PI)}°`);
  setRange("magnet-strength", state.magnet.magnetization, "magnet-strength-value", `${Math.round(state.magnet.magnetization / 1000)} kA/m`);
  setRange("second-angle", Math.round(state.secondMagnet.angle * 180 / Math.PI), "second-angle-value", `${Math.round(state.secondMagnet.angle * 180 / Math.PI)}°`);
  setRange("second-strength", state.secondMagnet.magnetization, "second-strength-value", `${Math.round(state.secondMagnet.magnetization / 1000)} kA/m`);
  setRange("coil-current", state.coil.current, "coil-current-value", `${formatter(1).format(state.coil.current)} A`);
  setRange("coil-turns", state.coil.turns, "coil-turns-value", String(state.coil.turns));
  setRange("coil-length", state.coil.length, "coil-length-value", `${formatter(2).format(state.coil.length)} m`);
  setRange("coil-radius", state.coil.radius, "coil-radius-value", `${formatter(3).format(state.coil.radius)} m`);
  setRange("coil-angle", Math.round(state.coil.angle * 180 / Math.PI), "coil-angle-value", `${Math.round(state.coil.angle * 180 / Math.PI)}°`);
  setRange("sensor-x", state.sensor.x, "sensor-x-value", `${formatter(2).format(state.sensor.x)} m`);
  setRange("sensor-y", state.sensor.y, "sensor-y-value", `${formatter(2).format(state.sensor.y)} m`);
  setRange("line-density", state.density, "line-density-value", String(state.density));
  byId("coil-core").checked = state.coil.core;
  byId("earth-compass").checked = state.earth;
  byId("show-lines").checked = state.showLines;
  byId("show-vectors").checked = state.showVectors;
  byId("show-heatmap").checked = state.showHeatmap;
  byId("show-current").checked = state.showCurrent;
  byId("show-grid").checked = state.showGrid;
  byId("show-numbers").checked = state.showNumbers;
  byId("show-interior").checked = state.showInterior;
  byId("show-magnet-source").checked = state.showMagnetSource;
  byId("show-coil-source").checked = state.showCoilSource;
  byId("earth-field").checked = state.earth;
  byId("interaction-motion").checked = state.interactionMotion;
  byId("interaction-fixed").value = state.interactionFixed;
  byId("reduce-motion").checked = state.reduceMotion;
}

function updateModeUI() {
  document.querySelectorAll("[data-mode]").forEach((button) => button.setAttribute("aria-selected", String(button.dataset.mode === state.mode)));
  byId("permanent-controls").hidden = !["permanent", "interaction", "field"].includes(state.mode);
  byId("coil-controls").hidden = !["electromagnet", "field", "graphs"].includes(state.mode);
  byId("field-controls").hidden = state.mode !== "field";
  byId("interaction-controls").hidden = state.mode !== "interaction";
  document.querySelectorAll(".magnet-secondary-control").forEach((node) => { node.hidden = state.mode !== "interaction"; });
  document.querySelectorAll(".magnet-advanced").forEach((node) => { node.hidden = !state.advanced; });
  byId("magnet-graphs").hidden = state.mode !== "graphs";
  const titles = { permanent: "Ímã permanente", electromagnet: "Eletroímã", field: "Campo magnético", interaction: "Interação entre ímãs", graphs: "Experimentos e gráficos" };
  const descriptions = {
    permanent: "Arraste o ímã, a bússola ou o sensor. A agulha se orienta pelo campo local calculado.",
    electromagnet: "Altere corrente e geometria. Inverter I inverte a polaridade; com I = 0, o campo da bobina desaparece.",
    field: "Ative ou combine fontes e compare o vetor resultante no sensor. A densidade das linhas só muda a visualização.",
    interaction: "Arraste os ímãs, compare seus polos e, se desejar, ative o movimento calculado de um deles mantendo o outro fixo.",
    graphs: "Os gráficos vêm do mesmo cálculo do cenário. Inspecione pontos ou clique para posicionar o sensor."
  };
  byId("controls-title").textContent = titles[state.mode];
  byId("mode-description").textContent = descriptions[state.mode];
  byId("add-compass").hidden = false;
  const pauseButton = byId("pause-interaction");
  pauseButton.hidden = !state.interactionMotion;
  pauseButton.disabled = state.reduceMotion;
  pauseButton.textContent = state.interactionPaused ? "Continuar movimento" : "Pausar movimento";
  document.body.classList.toggle("magnet-reduced-motion", state.reduceMotion);
  const motionStatus = byId("interaction-motion-status");
  if (!state.interactionMotion) motionStatus.textContent = "Ative o movimento para deixar um ímã responder à força e ao torque calculados a partir da interação dos dois prismas.";
  else if (state.reduceMotion) motionStatus.textContent = "Movimento automático suspenso pela opção de reduzir movimentos. Desative essa opção para continuar; arrastar e controles continuam disponíveis.";
  else if (state.interactionPaused) motionStatus.textContent = `Movimento pausado. ${interactionSummary()}`;
  else motionStatus.textContent = `Movimento ativo, com integração amortecida. ${interactionSummary()}`;
  if (state.mode === "field") {
    state.showMagnetSource = byId("show-magnet-source").checked;
    state.showCoilSource = byId("show-coil-source").checked;
  }
}

function interactionSummary() {
  const result = state.interactionForce || magnetInteractionForceTorque(
    state.interactionFixed === "first" ? state.magnet : state.secondMagnet,
    state.interactionFixed === "first" ? state.secondMagnet : state.magnet
  );
  const fx = formatter(3).format(result.force.x), fy = formatter(3).format(result.force.y), torque = formatter(4).format(result.torque);
  return `Estimativa no ímã livre: Fx ${fx} N, Fy ${fy} N e τz ${torque} N·m.`;
}

function shouldRunInteraction() {
  return state.mode === "interaction" && state.interactionMotion && !state.interactionPaused && !state.reduceMotion;
}

function advanceInteraction(dt) {
  const fixedIsFirst = state.interactionFixed === "first";
  const fixed = fixedIsFirst ? state.magnet : state.secondMagnet;
  const movingKey = fixedIsFirst ? "secondMagnet" : "magnet";
  const result = stepMagnetInteraction(fixed, state[movingKey], state.interactionVelocity, dt);
  state[movingKey] = result.magnet;
  state.interactionVelocity = result.velocity;
  state.interactionForce = result;
}

function interactionLoop(timestamp) {
  if (!shouldRunInteraction()) { interactionFrame = 0; lastInteractionTime = 0; return; }
  const dt = lastInteractionTime ? Math.min(0.034, Math.max(0, (timestamp - lastInteractionTime) / 1000)) : 0;
  lastInteractionTime = timestamp;
  if (dt) advanceInteraction(dt);
  if (timestamp - lastInteractionRender >= 33) { render(); lastInteractionRender = timestamp; }
  interactionFrame = requestAnimationFrame(interactionLoop);
}

function syncInteractionLoop() {
  if (shouldRunInteraction()) {
    if (!interactionFrame) { lastInteractionTime = 0; lastInteractionRender = 0; interactionFrame = requestAnimationFrame(interactionLoop); }
  } else if (interactionFrame) {
    cancelAnimationFrame(interactionFrame); interactionFrame = 0; lastInteractionTime = 0;
  }
}

function canvasSize() {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return false;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const width = rect.width, height = rect.height;
  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  view = { width, height, dpr, scale: Math.min((width - 58) / 0.82, (height - 56) / 0.52) };
  return true;
}

const toScreen = (point) => ({ x: view.width / 2 + point.x * view.scale, y: view.height / 2 - point.y * view.scale });
const toWorld = (point) => ({ x: (point.x - view.width / 2) / view.scale, y: (view.height / 2 - point.y) / view.scale });

function drawGrid() {
  if (!state.showGrid) return;
  const spacing = 0.05 * view.scale;
  ctx.save();
  ctx.lineWidth = 1;
  for (let x = view.width / 2 % spacing; x < view.width; x += spacing) {
    const major = Math.abs((x - view.width / 2) / spacing % 2) < 0.03;
    ctx.strokeStyle = major ? "rgba(130,157,192,.19)" : "rgba(130,157,192,.085)";
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, view.height); ctx.stroke();
    if (major && x > 28 && x < view.width - 10) { ctx.fillStyle = "#99a9c0"; ctx.font = "10px system-ui"; ctx.fillText(formatter(1).format((x - view.width / 2) / view.scale), x + 3, view.height / 2 + 14); }
  }
  for (let y = view.height / 2 % spacing; y < view.height; y += spacing) {
    const major = Math.abs((y - view.height / 2) / spacing % 2) < 0.03;
    ctx.strokeStyle = major ? "rgba(130,157,192,.19)" : "rgba(130,157,192,.085)";
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(view.width, y); ctx.stroke();
    if (major && y > 12 && y < view.height - 10) { ctx.fillStyle = "#99a9c0"; ctx.font = "10px system-ui"; ctx.fillText(formatter(1).format((view.height / 2 - y) / view.scale), view.width / 2 + 5, y - 3); }
  }
  ctx.strokeStyle = "rgba(202,215,236,.38)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, view.height / 2); ctx.lineTo(view.width, view.height / 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(view.width / 2, 0); ctx.lineTo(view.width / 2, view.height); ctx.stroke();
  ctx.restore();
}

function drawHeatmap(model) {
  if (!state.showHeatmap) return;
  const cols = Math.max(18, Math.min(32, Math.round(view.width / 32)));
  const rows = Math.max(12, Math.min(23, Math.round(view.height / 30)));
  const cw = view.width / cols, ch = view.height / rows;
  ctx.save();
  for (let iy = 0; iy < rows; iy++) for (let ix = 0; ix < cols; ix++) {
    const p = toWorld({ x: (ix + 0.5) * cw, y: (iy + 0.5) * ch });
    const mag = fieldMagnitude(model.at(p));
    const opacity = clamp(Math.log10(1 + mag * 1e5) * 0.16, 0.015, 0.26);
    ctx.fillStyle = `rgba(238,174,65,${opacity})`;
    ctx.fillRect(ix * cw, iy * ch, cw + 1, ch + 1);
  }
  ctx.restore();
}

function fieldSeeds(model) {
  const seeds = [];
  for (const magnet of model.magnets) {
    const end = magnet.polarity > 0 ? 1 : -1;
    for (let i = 0; i < state.density; i++) {
      const yy = ((i + 0.5) / state.density - 0.5) * magnet.height * 1.3;
      const local = { x: end * (magnet.length / 2 + 0.004), y: yy };
      const rotated = { x: magnet.x + local.x * Math.cos(magnet.angle) - local.y * Math.sin(magnet.angle), y: magnet.y + local.x * Math.sin(magnet.angle) + local.y * Math.cos(magnet.angle) };
      seeds.push(rotated);
    }
  }
  if (model.coil && Math.abs(model.coil.current) > 1e-6) {
    const coil = model.coil, end = Math.sign(coil.current);
    const count = Math.max(8, Math.floor(state.density * 0.65));
    for (let i = 0; i < count; i++) {
      const yy = ((i + 0.5) / count - 0.5) * coil.radius * 1.6;
      const xLocal = end * (coil.length / 2 + 0.006);
      seeds.push({ x: coil.x + xLocal * Math.cos(coil.angle) - yy * Math.sin(coil.angle), y: coil.y + xLocal * Math.sin(coil.angle) + yy * Math.cos(coil.angle) });
    }
  }
  return seeds;
}

function drawArrow(x1, y1, x2, y2, color, width = 1.4, head = 5) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - head * Math.cos(angle - 0.48), y2 - head * Math.sin(angle - 0.48)); ctx.lineTo(x2 - head * Math.cos(angle + 0.48), y2 - head * Math.sin(angle + 0.48)); ctx.closePath(); ctx.fill();
}

function drawFieldLines(model) {
  if (!state.showLines) return;
  const seeds = fieldSeeds(model);
  ctx.save(); ctx.strokeStyle = "rgba(238,199,111,.78)"; ctx.lineWidth = 1.2;
  const bounds = { x: Math.min(0.4, view.width / 2 / view.scale), y: Math.min(0.25, view.height / 2 / view.scale) };
  for (const seed of seeds) {
    const path = traceFieldLine(model, seed, { bounds, maxSteps: 240, step: 0.0045 });
    if (path.length < 3) continue;
    ctx.beginPath(); const first = toScreen(path[0]); ctx.moveTo(first.x, first.y);
    for (let i = 1; i < path.length; i++) { const p = toScreen(path[i]); ctx.lineTo(p.x, p.y); }
    ctx.stroke();
    const i = Math.floor(path.length * 0.62); if (i > 1 && i + 1 < path.length) { const a = toScreen(path[i]); const b = toScreen(path[i + 1]); drawArrow(a.x, a.y, b.x, b.y, "#f5d788", 1, 4); }
  }
  ctx.restore();
}

function drawVectors(model) {
  if (!state.showVectors) return;
  const cols = Math.max(7, Math.min(15, Math.round(view.width / 74)));
  const rows = Math.max(5, Math.min(10, Math.round(view.height / 72)));
  const dx = view.width / (cols + 1), dy = view.height / (rows + 1);
  ctx.save();
  for (let iy = 1; iy <= rows; iy++) for (let ix = 1; ix <= cols; ix++) {
    const start = { x: ix * dx, y: iy * dy }; const b = model.at(toWorld(start)); const mag = Math.hypot(b.x, b.y);
    if (mag < 1e-11) continue;
    const len = clamp(7 + 3.5 * Math.log10(1 + mag * 1e5), 7, 18);
    const ex = start.x + b.x / mag * len; const ey = start.y - b.y / mag * len;
    drawArrow(start.x, start.y, ex, ey, "#8ec9df", 1.2, 4);
  }
  ctx.restore();
}

function drawMagnet(magnet, index = 0) {
  const point = toScreen(magnet); const width = magnet.length * view.scale; const height = magnet.height * view.scale;
  ctx.save(); ctx.translate(point.x, point.y); ctx.rotate(-magnet.angle);
  ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 9; ctx.shadowOffsetY = 3;
  const northOnRight = magnet.polarity > 0;
  ctx.fillStyle = northOnRight ? "#4d73dc" : "#df5e58"; ctx.fillRect(-width / 2, -height / 2, width / 2, height);
  ctx.fillStyle = northOnRight ? "#df5e58" : "#4d73dc"; ctx.fillRect(0, -height / 2, width / 2, height);
  ctx.shadowColor = "transparent"; ctx.strokeStyle = "#e9eff8"; ctx.lineWidth = 1.5; ctx.strokeRect(-width / 2, -height / 2, width, height);
  ctx.fillStyle = "#fff"; ctx.font = `700 ${Math.max(12, Math.min(18, height * .48))}px system-ui`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(northOnRight ? "S" : "N", -width / 4, 0); ctx.fillText(northOnRight ? "N" : "S", width / 4, 0);
  if (state.showInterior) {
    const start = northOnRight ? -width * .31 : width * .31;
    const end = northOnRight ? width * .31 : -width * .31;
    drawArrow(start, 0, end, 0, "rgba(255,255,255,.75)", 1.1, 4);
  }
  ctx.restore();
  const label = toScreen({ x: magnet.x, y: magnet.y + magnet.height / 2 + 0.023 });
  ctx.fillStyle = "#d8e2f3"; ctx.font = "11px system-ui"; ctx.textAlign = "center"; ctx.fillText(index === 1 ? "Ímã A" : "Ímã B", label.x, label.y);
}

function drawCoil(model) {
  if (!model.coil) return;
  const coil = model.coil; const center = toScreen(coil); const width = coil.length * view.scale; const radius = coil.radius * view.scale;
  ctx.save(); ctx.translate(center.x, center.y); ctx.rotate(-coil.angle);
  if (coil.core) {
    ctx.fillStyle = "#777f8d"; ctx.strokeStyle = "#b3bac4"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(-width * .48, -Math.max(4, radius * .22), width * .96, Math.max(8, radius * .44), 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#e0e5ed"; ctx.font = "10px system-ui"; ctx.textAlign = "center"; ctx.fillText("núcleo · modelo saturável", 0, 4);
  }
  ctx.strokeStyle = "#d8994f"; ctx.lineWidth = 2.1;
  const turnsToDraw = coil.turns;
  for (let i = 0; i < turnsToDraw; i++) {
    const x = -width / 2 + (i / Math.max(1, turnsToDraw - 1)) * width;
    ctx.beginPath(); ctx.ellipse(x, 0, Math.max(3, width / turnsToDraw * .28), radius, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.strokeStyle = "#e8b36d"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-width / 2, -radius); ctx.lineTo(width / 2, -radius); ctx.moveTo(-width / 2, radius); ctx.lineTo(width / 2, radius); ctx.stroke();
  const batteryX = -width / 2 - 38;
  ctx.strokeStyle = "#9cabbf"; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-width / 2, -radius); ctx.lineTo(-width / 2 - 12, -radius); ctx.lineTo(-width / 2 - 12, -15); ctx.lineTo(batteryX + 18, -15);
  ctx.moveTo(-width / 2, radius); ctx.lineTo(-width / 2 - 12, radius); ctx.lineTo(-width / 2 - 12, 15); ctx.lineTo(batteryX + 18, 15); ctx.stroke();
  ctx.fillStyle = "#17263a"; ctx.strokeStyle = "#f0c977"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(batteryX, -20, 22, 40, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#f5e5bb"; ctx.font = "bold 12px system-ui"; ctx.textAlign = "center"; ctx.fillText(coil.current >= 0 ? "+" : "−", batteryX + 11, -7); ctx.fillText(coil.current >= 0 ? "−" : "+", batteryX + 11, 13);
  ctx.fillStyle = "#c9d4e4"; ctx.font = "9px system-ui"; ctx.fillText("CC", batteryX + 11, 31);
  ctx.fillStyle = "#f5e0bd"; ctx.font = "12px system-ui"; ctx.textAlign = "center"; ctx.fillText(`${coil.turns} espiras · ${formatter(1).format(coil.current)} A`, 0, radius + 23);
  if (state.showCurrent && Math.abs(coil.current) > 0.02) {
    // Current markers are conventional-current symbols in the screen projection, not electrons.
    const sign = Math.sign(coil.current); ctx.font = "bold 14px system-ui"; ctx.textAlign = "center";
    ctx.fillStyle = sign > 0 ? "#ffd57b" : "#a9c8ff";
    ctx.fillText(sign > 0 ? "⊙" : "⊗", -width / 2 - 9, -radius * .53);
    ctx.fillText(sign > 0 ? "⊗" : "⊙", width / 2 + 9, -radius * .53);
    drawArrow(-width / 2 - 28, 0, -width / 2 - 6, 0, sign > 0 ? "#ffd57b" : "#a9c8ff", 1.7, 5);
  }
  ctx.restore();
  const plus = toScreen({ x: coil.x + Math.cos(coil.angle) * (coil.length / 2 + .025), y: coil.y + Math.sin(coil.angle) * (coil.length / 2 + .025) });
  ctx.fillStyle = Math.sign(coil.current) >= 0 ? "#e86161" : "#5d88e8"; ctx.font = "700 13px system-ui"; ctx.textAlign = "center"; ctx.fillText(Math.sign(coil.current) >= 0 ? "N" : "S", plus.x, plus.y);
}

function drawCompass(compass, model, index) {
  const point = toScreen(compass); const field = model.at(compass); const magnitude = Math.hypot(field.x, field.y);
  ctx.save(); ctx.fillStyle = "rgba(246,248,252,.92)"; ctx.strokeStyle = index === state.selectedCompass ? "#e7c36f" : "#26384f"; ctx.lineWidth = index === state.selectedCompass ? 3 : 2;
  ctx.beginPath(); ctx.arc(point.x, point.y, 17, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (magnitude > 1e-10) {
    const angle = Math.atan2(-field.y, field.x); const tip = { x: point.x + 12 * Math.cos(angle), y: point.y + 12 * Math.sin(angle) }; const tail = { x: point.x - 10 * Math.cos(angle), y: point.y - 10 * Math.sin(angle) };
    ctx.lineCap = "round"; ctx.lineWidth = 4; ctx.strokeStyle = "#557be8"; ctx.beginPath(); ctx.moveTo(tail.x, tail.y); ctx.lineTo(point.x, point.y); ctx.stroke(); ctx.strokeStyle = "#df5e58"; ctx.beginPath(); ctx.moveTo(point.x, point.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
  } else { ctx.fillStyle = "#475569"; ctx.font = "10px system-ui"; ctx.textAlign = "center"; ctx.fillText("—", point.x, point.y + 3); }
  ctx.restore();
  ctx.fillStyle = "#e4eaf4"; ctx.font = "10px system-ui"; ctx.textAlign = "center"; ctx.fillText(`Bússola ${index + 1}`, point.x, point.y + 29);
}

function drawSensor() {
  const point = toScreen(state.sensor);
  ctx.save(); ctx.translate(point.x, point.y);
  ctx.fillStyle = "#101d30"; ctx.strokeStyle = "#f3cf78"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(-18, -17, 36, 34, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#fae1a1"; ctx.font = "700 10px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("B", 0, 0);
  ctx.restore();
  ctx.fillStyle = "#f0d58e"; ctx.font = "10px system-ui"; ctx.textAlign = "center"; ctx.fillText("Sensor", point.x, point.y + 29);
}

function renderScene(model) {
  if (!canvasSize()) return;
  ctx.fillStyle = "#0a1424"; ctx.fillRect(0, 0, view.width, view.height);
  drawGrid(); drawHeatmap(model); drawFieldLines(model); drawVectors(model);
  drawCoil(model);
  model.magnets.forEach((magnet, index) => drawMagnet(magnet, index + 1));
  state.compasses.forEach((compass, index) => drawCompass(compass, model, index));
  drawSensor();
  if (!model.magnets.length && !model.coil && !state.earth) {
    ctx.fillStyle = "#c3d0e1"; ctx.font = "15px system-ui"; ctx.textAlign = "center"; ctx.fillText("Ative ao menos uma fonte para visualizar o campo.", view.width / 2, 30);
  }
}

function sensorReading(model) {
  return { valid: true, insideMagnet: model.magnets.some((magnet) => magnetContainsPoint(state.sensor, magnet)), field: model.at(state.sensor) };
}

function updateReadings(model) {
  const reading = sensorReading(model);
  const b = reading.field, magnitude = fieldMagnitude(b), unit = magnitude >= 1e-3 ? 1e3 : 1e6, suffix = magnitude >= 1e-3 ? "mT" : "μT";
  byId("reading-magnitude").textContent = `${formatter(2).format(magnitude * unit)} ${suffix}`;
  byId("reading-bx").textContent = `${formatter(2).format(b.x * unit)} ${suffix}`;
  byId("reading-by").textContent = `${formatter(2).format(b.y * unit)} ${suffix}`;
  byId("reading-bz").textContent = `${formatter(2).format(b.z * unit)} ${suffix}`;
  byId("reading-angle").textContent = magnitude > 1e-10 ? `${formatter(1).format(fieldAngleDegrees(b))}°` : "indefinido";
  byId("sensor-status").textContent = reading.insideMagnet ? "Sensor dentro do prisma: o modelo finito inclui a magnetização uniforme do material; valores próximos à superfície são aproximados." : magnitude > 1e-10 ? `Leitura calculada no ponto (${formatter(2).format(state.sensor.x)} m; ${formatter(2).format(state.sensor.y)} m).` : "Campo resultante quase nulo; a bússola não recebe uma direção artificial.";
}

function allActiveMagnets() {
  if (state.mode === "permanent") return [state.magnet];
  if (state.mode === "interaction") return [state.magnet, state.secondMagnet];
  if (state.mode === "field" && state.showMagnetSource) return [state.magnet];
  return [];
}

function graphData(kind) {
  const points = [];
  const magnets = allActiveMagnets();
  const baseModel = makeFieldModel({ magnets, coil: state.coil, useCoil: ["electromagnet", "graphs"].includes(state.mode) || (state.mode === "field" && state.showCoilSource), earth: state.earth });
  const add = (x, y) => { if (Number.isFinite(x) && Number.isFinite(y)) points.push({ x, y }); };
  if (kind === "distance" || kind === "components" || kind === "axial") {
    const count = 72, xMin = -0.36, xMax = 0.36;
    for (let i = 0; i <= count; i++) {
      const x = xMin + (xMax - xMin) * i / count;
      let b, graphX = x;
      if (kind === "axial") {
        const ux = Math.cos(state.coil.angle), uy = Math.sin(state.coil.angle);
        b = finiteCoilFieldAt({ x: state.coil.x + x * ux, y: state.coil.y + x * uy, z: 0 }, state.coil, baseModel.segments);
        b = { ...b, x: b.x * ux + b.y * uy };
        graphX = x;
      } else b = baseModel.at({ x, y: state.sensor.y });
      add(graphX, kind === "distance" ? fieldMagnitude(b) * 1e3 : b.x * 1e3);
    }
    if (kind === "components") {
      const byPoints = [];
      for (let i = 0; i <= count; i++) { const x = xMin + (xMax - xMin) * i / count; byPoints.push({ x, y: baseModel.at({ x, y: state.sensor.y }).y * 1e3 }); }
      return { xLabel: "Posição x (m)", yLabel: "Componente do campo (mT)", series: [{ label: "Bx", points }, { label: "By", points: byPoints }], cursorX: state.sensor.x, xMin, xMax };
    }
    const axialCursor = (state.sensor.x - state.coil.x) * Math.cos(state.coil.angle) + (state.sensor.y - state.coil.y) * Math.sin(state.coil.angle);
    return { xLabel: kind === "axial" ? "Posição axial relativa (m)" : "Posição x (m)", yLabel: kind === "distance" ? "|B| (mT)" : kind === "axial" ? "B paralelo ao eixo (mT)" : "Bx (mT)", series: [{ label: kind === "axial" ? "Bobina finita" : "Campo resultante", points }], cursorX: kind === "axial" ? axialCursor : state.sensor.x, xMin, xMax };
  }
  if (kind === "current") {
    const coil = makeCoil(state.coil), segments = buildCoilSegments(coil);
    const fixed = makeFieldModel({ magnets, earth: state.earth }).at(state.sensor);
    for (let i = 0; i <= 80; i++) {
      const current = -5 + i * 0.125;
      const b = finiteCoilFieldAt(state.sensor, { ...coil, current }, segments);
      const axial = fixed.x * Math.cos(coil.angle) + fixed.y * Math.sin(coil.angle) + b.x * Math.cos(coil.angle) + b.y * Math.sin(coil.angle);
      add(current, axial * 1e3);
    }
    return { xLabel: "Corrente I (A)", yLabel: "B paralelo ao eixo no sensor (mT)", series: [{ label: "Componente axial total", points }], cursorX: coil.current, xMin: -5, xMax: 5 };
  }
  if (kind === "turns") {
    const coil = makeCoil(state.coil);
    const fixedModel = makeFieldModel({ magnets, earth: state.earth });
    const fixed = fixedModel.at(state.sensor);
    for (let turns = 1; turns <= 50; turns++) {
      const segments = buildCoilSegments(coil, turns);
      const b = finiteCoilFieldAt(state.sensor, coil, segments);
      add(turns, (fixed.x * Math.cos(coil.angle) + fixed.y * Math.sin(coil.angle) + b.x * Math.cos(coil.angle) + b.y * Math.sin(coil.angle)) * 1e3);
    }
    return { xLabel: "Número de espiras N", yLabel: "B paralelo ao eixo no sensor (mT)", series: [{ label: "Componente axial; demais parâmetros fixos", points }], cursorX: coil.turns, xMin: 1, xMax: 50 };
  }
  return { xLabel: "Posição x (m)", yLabel: "Campo (mT)", series: [{ label: "Campo", points: [] }], cursorX: 0, xMin: -0.36, xMax: 0.36 };
}

function niceTicks(min, max, count = 5) {
  const step = (max - min) / count;
  return Array.from({ length: count + 1 }, (_, i) => min + i * step);
}

function renderGraph() {
  const svg = byId("magnet-chart"); if (!svg || byId("magnet-graphs").hidden) return;
  const kind = byId("graph-select").value;
  const data = graphData(kind); chartSnapshot = { kind, data };
  const width = 900, height = 380, pad = { l: 82, r: 24, t: 32, b: 58 }, plotW = width - pad.l - pad.r, plotH = height - pad.t - pad.b;
  const allSeries = [...data.series, ...(graphComparison?.kind === kind ? graphComparison.series : [])];
  const allPoints = allSeries.flatMap((s) => s.points);
  let xMin = data.xMin ?? Math.min(...allPoints.map((p) => p.x)), xMax = data.xMax ?? Math.max(...allPoints.map((p) => p.x));
  if (xMax === xMin) xMax = xMin + 1;
  let yMax = Math.max(1e-6, ...allPoints.map((p) => Math.abs(p.y)));
  const scale = byId("graph-scale").value;
  if (scale !== "auto") yMax = Math.max(yMax / Number(scale), 1e-8);
  else yMax *= 1.14;
  const yMin = -yMax;
  const sx = (x) => pad.l + (x - xMin) / (xMax - xMin) * plotW;
  const sy = (y) => pad.t + (yMax - y) / (yMax - yMin) * plotH;
  const xTicks = niceTicks(xMin, xMax, 6), yTicks = niceTicks(yMin, yMax, 4);
  let markup = `<title>${graphNames[kind]}</title><desc>${data.yLabel} por ${data.xLabel}; valores calculados para os parâmetros atuais.</desc>`;
  for (const tick of xTicks) markup += `<line class="chart-grid" x1="${sx(tick)}" y1="${pad.t}" x2="${sx(tick)}" y2="${pad.t + plotH}"/><text class="chart-label" x="${sx(tick)}" y="${pad.t + plotH + 19}" text-anchor="middle">${formatter(2).format(tick)}</text>`;
  for (const tick of yTicks) markup += `<line class="chart-grid" x1="${pad.l}" y1="${sy(tick)}" x2="${pad.l + plotW}" y2="${sy(tick)}"/><text class="chart-label" x="${pad.l - 10}" y="${sy(tick) + 4}" text-anchor="end">${formatter(2).format(tick)}</text>`;
  markup += `<line class="chart-axis" x1="${pad.l}" y1="${pad.t + plotH}" x2="${pad.l + plotW}" y2="${pad.t + plotH}"/><line class="chart-axis" x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${pad.t + plotH}"/>`;
  markup += `<text class="chart-title" x="${pad.l}" y="19">${graphNames[kind]} · valores do modelo</text><text class="chart-label" x="${pad.l + plotW / 2}" y="${height - 8}" text-anchor="middle">${data.xLabel}</text><text class="chart-label" transform="translate(17 ${pad.t + plotH / 2}) rotate(-90)" text-anchor="middle">${data.yLabel}</text>`;
  const paths = [];
  const drawSeries = (series, comparison = false) => series.forEach((line) => {
    const path = line.points.map((p, i) => `${i ? "L" : "M"}${sx(p.x).toFixed(2)},${sy(p.y).toFixed(2)}`).join(" ");
    markup += `<path class="${comparison ? "chart-series chart-compare" : "chart-series"}" d="${path}"/>`;
    const points = line.points.map((p) => `<circle class="${comparison ? "chart-compare-point" : "chart-point"}" cx="${sx(p.x)}" cy="${sy(p.y)}" r="2.4"/>`).join("");
    markup += points;
    paths.push({ label: line.label, points: line.points, sx, sy });
  });
  drawSeries(data.series);
  if (graphComparison?.kind === kind) drawSeries(graphComparison.series, true);
  const cursorX = clamp(data.cursorX, xMin, xMax);
  markup += `<line class="chart-cursor" x1="${sx(cursorX)}" y1="${pad.t}" x2="${sx(cursorX)}" y2="${pad.t + plotH}"/>`;
  markup += `<rect class="chart-hit-area" x="${pad.l}" y="${pad.t}" width="${plotW}" height="${plotH}" data-plot-hit="true" tabindex="0" aria-label="Área de inspeção do gráfico"/>`;
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`); svg.innerHTML = markup;
  svg.dataset.plotLeft = String(pad.l); svg.dataset.plotTop = String(pad.t); svg.dataset.plotWidth = String(plotW); svg.dataset.plotHeight = String(plotH);
  svg.dataset.xMin = String(xMin); svg.dataset.xMax = String(xMax); svg.dataset.yMin = String(yMin); svg.dataset.yMax = String(yMax);
  byId("chart-inspection").textContent = chartInspection;
  svg.__paths = paths;
}

function inspectChart(event) {
  if (!chartSnapshot) return;
  const svg = byId("magnet-chart"), rect = svg.getBoundingClientRect();
  const scaleX = 900 / rect.width, scaleY = 380 / rect.height;
  const px = (event.clientX - rect.left) * scaleX, py = (event.clientY - rect.top) * scaleY;
  const left = Number(svg.dataset.plotLeft), top = Number(svg.dataset.plotTop), plotW = Number(svg.dataset.plotWidth), plotH = Number(svg.dataset.plotHeight);
  if (px < left || px > left + plotW || py < top || py > top + plotH) return;
  const fraction = clamp((px - left) / plotW, 0, 1), x = Number(svg.dataset.xMin) + fraction * (Number(svg.dataset.xMax) - Number(svg.dataset.xMin));
  const closest = chartSnapshot.data.series.flatMap((s) => s.points).reduce((best, point) => Math.abs(point.x - x) < Math.abs(best.x - x) ? point : best);
  chartInspection = `${chartSnapshot.data.xLabel}: ${formatter(3).format(closest.x)} · ${chartSnapshot.data.yLabel}: ${formatter(4).format(closest.y)}${chartSnapshot.kind === "distance" || chartSnapshot.kind === "components" || chartSnapshot.kind === "axial" ? " mT" : chartSnapshot.kind === "current" ? " mT" : " mT"}`;
  byId("chart-inspection").textContent = chartInspection;
  if (event.type === "click") {
    if (["distance", "components"].includes(chartSnapshot.kind)) state.sensor.x = clamp(closest.x, -0.38, 0.38);
    else if (chartSnapshot.kind === "axial") {
      state.sensor.x = clamp(state.coil.x + closest.x * Math.cos(state.coil.angle), -0.38, 0.38);
      state.sensor.y = clamp(state.coil.y + closest.x * Math.sin(state.coil.angle), -0.24, 0.24);
    }
    else if (chartSnapshot.kind === "current") state.coil.current = closest.x;
    else if (chartSnapshot.kind === "turns") state.coil.turns = Math.round(closest.x);
    updateControlText(); queueDraw();
  }
}

function exportCSV() {
  const kind = byId("graph-select").value, data = graphData(kind);
  const comparison = graphComparison?.kind === kind ? graphComparison.series : [];
  const csvCell = (value) => `"${String(value).replaceAll('"', '""')}"`;
  const lines = [[data.xLabel, data.yLabel, "Série"].map(csvCell).join(",")];
  for (const series of [...data.series, ...comparison]) for (const p of series.points) lines.push(`${p.x},${p.y},"${series.label.replaceAll('"', '""')}"`);
  const blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `laboratorio-magnetismo-${kind}.csv`; link.click(); URL.revokeObjectURL(url);
}

function render() {
  updateModeUI();
  updateControlText();
  document.querySelector(".magnet-reading-grid").hidden = !state.showNumbers;
  byId("remove-compass").disabled = state.compasses.length === 0;
  const model = activeFieldModel();
  renderScene(model); updateReadings(model); renderGraph();
}

function queueDraw() {
  if (redrawFrame) return;
  redrawFrame = requestAnimationFrame(() => { redrawFrame = 0; render(); });
}

function localPointer(event) {
  const rect = canvas.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function beginDrag(event) {
  const p = localPointer(event), world = toWorld(p), model = activeFieldModel();
  const items = [{ type: "sensor", point: state.sensor }, ...state.compasses.map((point, index) => ({ type: "compass", index, point })), ...model.magnets.map((point, index) => ({ type: "magnet", index, point })), ...(model.coil ? [{ type: "coil", point: state.coil }] : [])];
  let nearest = null, best = Infinity;
  for (const item of items) {
    const screen = toScreen(item.point); const distance = Math.hypot(screen.x - p.x, screen.y - p.y);
    const radius = item.type === "magnet" ? Math.max(27, state.magnet.length * view.scale * 0.55) : item.type === "coil" ? Math.max(34, state.coil.radius * view.scale * 1.2) : 26;
    if (distance < radius && distance < best) { nearest = item; best = distance; }
  }
  if (!nearest) return;
  const fixedIndex = state.interactionFixed === "first" ? 0 : 1;
  if (state.mode === "interaction" && state.interactionMotion && !state.interactionPaused && !state.reduceMotion && nearest.type === "magnet" && nearest.index === fixedIndex) return;
  if (nearest.type === "compass") state.selectedCompass = nearest.index;
  drag = { ...nearest, dx: nearest.point.x - world.x, dy: nearest.point.y - world.y };
  canvas.classList.add("is-dragging"); canvas.setPointerCapture(event.pointerId); event.preventDefault();
}

function moveDrag(event) {
  if (!drag) return;
  const world = toWorld(localPointer(event)); const x = clamp(world.x + drag.dx, -0.37, 0.37), y = clamp(world.y + drag.dy, -0.23, 0.23);
  if (drag.type === "sensor") { state.sensor.x = x; state.sensor.y = y; }
  if (drag.type === "compass") { state.compasses[drag.index].x = x; state.compasses[drag.index].y = y; }
  if (drag.type === "magnet") {
    const magnet = drag.index === 0 ? state.magnet : state.secondMagnet;
    if (state.mode === "interaction") {
      const other = drag.index === 0 ? state.secondMagnet : state.magnet;
      const candidate = makeMagnet({ ...magnet, x, y });
      if (magnetPrismsOverlap(other, candidate)) return;
    }
    magnet.x = x; magnet.y = y;
    const fixedIndex = state.interactionFixed === "first" ? 0 : 1;
    if (state.mode === "interaction" && state.interactionMotion && drag.index !== fixedIndex) state.interactionVelocity = { x: 0, y: 0, angle: 0 };
  }
  if (drag.type === "coil") { state.coil.x = x; state.coil.y = y; }
  queueDraw();
}

function endDrag() { drag = null; canvas.classList.remove("is-dragging"); }

for (const button of document.querySelectorAll("[data-mode]")) button.addEventListener("click", () => { state.mode = button.dataset.mode; updateModeUI(); syncInteractionLoop(); queueDraw(); });
byId("magnet-angle").addEventListener("input", (e) => { state.magnet.angle = Number(e.target.value) * Math.PI / 180; if (state.interactionFixed === "second") state.interactionVelocity.angle = 0; queueDraw(); });
byId("magnet-strength").addEventListener("input", (e) => { state.magnet.magnetization = Number(e.target.value); queueDraw(); });
byId("second-angle").addEventListener("input", (e) => { state.secondMagnet.angle = Number(e.target.value) * Math.PI / 180; if (state.interactionFixed === "first") state.interactionVelocity.angle = 0; queueDraw(); });
byId("second-strength").addEventListener("input", (e) => { state.secondMagnet.magnetization = Number(e.target.value); queueDraw(); });
byId("invert-magnet").addEventListener("click", () => { state.magnet.polarity *= -1; queueDraw(); });
byId("invert-second-magnet").addEventListener("click", () => { state.secondMagnet.polarity *= -1; queueDraw(); });
byId("coil-current").addEventListener("input", (e) => { state.coil.current = Number(e.target.value); queueDraw(); });
byId("coil-turns").addEventListener("input", (e) => { state.coil.turns = Number(e.target.value); queueDraw(); });
byId("coil-length").addEventListener("input", (e) => { state.coil.length = Number(e.target.value); queueDraw(); });
byId("coil-radius").addEventListener("input", (e) => { state.coil.radius = Number(e.target.value); queueDraw(); });
byId("coil-angle").addEventListener("input", (e) => { state.coil.angle = Number(e.target.value) * Math.PI / 180; queueDraw(); });
byId("coil-core").addEventListener("change", (e) => { state.coil.core = e.target.checked; queueDraw(); });
byId("sensor-x").addEventListener("input", (e) => { state.sensor.x = Number(e.target.value); queueDraw(); });
byId("sensor-y").addEventListener("input", (e) => { state.sensor.y = Number(e.target.value); queueDraw(); });
byId("line-density").addEventListener("input", (e) => { state.density = Number(e.target.value); queueDraw(); });
byId("interaction-motion").addEventListener("change", (event) => {
  state.interactionMotion = event.target.checked;
  state.interactionPaused = false;
  state.interactionVelocity = { x: 0, y: 0, angle: 0 };
  state.interactionForce = null;
  syncInteractionLoop(); queueDraw();
});
byId("interaction-fixed").addEventListener("change", (event) => {
  state.interactionFixed = event.target.value;
  state.interactionVelocity = { x: 0, y: 0, angle: 0 };
  state.interactionForce = null;
  queueDraw();
});
byId("pause-interaction").addEventListener("click", () => {
  if (state.reduceMotion) return;
  state.interactionPaused = !state.interactionPaused;
  syncInteractionLoop(); queueDraw();
});
byId("reduce-motion").addEventListener("change", (event) => {
  state.reduceMotion = event.target.checked;
  syncInteractionLoop(); queueDraw();
});
for (const [id, key] of [["show-lines", "showLines"], ["show-vectors", "showVectors"], ["show-heatmap", "showHeatmap"], ["show-current", "showCurrent"], ["show-grid", "showGrid"], ["show-numbers", "showNumbers"], ["show-interior", "showInterior"], ["earth-compass", "earth"], ["earth-field", "earth"], ["show-magnet-source", "showMagnetSource"], ["show-coil-source", "showCoilSource"]]) byId(id).addEventListener("change", (e) => { state[key] = e.target.checked; queueDraw(); });
byId("add-compass").addEventListener("click", () => { if (state.compasses.length >= 5) { byId("sensor-status").textContent = "O laboratório permite até cinco bússolas simultâneas."; return; } state.compasses.push({ x: clamp(state.sensor.x - 0.09, -0.34, 0.34), y: clamp(state.sensor.y - 0.08, -0.2, 0.2) }); state.selectedCompass = state.compasses.length - 1; queueDraw(); });
byId("remove-compass").addEventListener("click", () => { if (!state.compasses.length) return; state.compasses.splice(state.selectedCompass, 1); state.selectedCompass = Math.max(0, Math.min(state.selectedCompass, state.compasses.length - 1)); queueDraw(); });
byId("reset-lab").addEventListener("click", () => { state = initial(); graphComparison = null; chartInspection = "Passe o cursor ou toque em um ponto para inspecionar."; updateModeUI(); syncInteractionLoop(); queueDraw(); });
byId("complexity-toggle").addEventListener("click", (e) => { state.advanced = !state.advanced; e.currentTarget.setAttribute("aria-pressed", String(state.advanced)); e.currentTarget.textContent = state.advanced ? "Modo básico" : "Modo avançado"; document.querySelectorAll(".magnet-advanced").forEach((node) => { node.hidden = !state.advanced; }); });
byId("learning-toggle").addEventListener("click", (e) => { const body = byId("learning-body"), collapsed = !body.classList.contains("is-collapsed"); body.classList.toggle("is-collapsed", collapsed); e.currentTarget.setAttribute("aria-expanded", String(!collapsed)); e.currentTarget.textContent = collapsed ? "Mostrar detalhes" : "Ocultar detalhes"; });
byId("graph-select").addEventListener("change", () => { chartInspection = "Passe o cursor ou toque em um ponto para inspecionar."; renderGraph(); });
byId("graph-scale").addEventListener("change", renderGraph);
byId("compare-config").addEventListener("click", (event) => {
  const kind = byId("graph-select").value;
  if (graphComparison?.kind === kind) { graphComparison = null; event.currentTarget.textContent = "Comparar configuração"; }
  else { graphComparison = { kind, series: graphData(kind).series.map((series) => ({ label: `Comparação · ${series.label}`, points: series.points.map((point) => ({ ...point })) })) }; event.currentTarget.textContent = "Remover comparação"; }
  renderGraph();
});
byId("export-csv").addEventListener("click", exportCSV);
byId("reset-graph").addEventListener("click", () => { byId("graph-select").value = "distance"; byId("graph-scale").value = "auto"; graphComparison = null; byId("compare-config").textContent = "Comparar configuração"; chartInspection = "Passe o cursor ou toque em um ponto para inspecionar."; renderGraph(); });
byId("check-prediction").addEventListener("click", () => {
  const choice = byId("prediction-choice").value, feedback = byId("prediction-feedback");
  feedback.textContent = !choice ? "Escolha uma previsão antes de testar." : choice === "invert" ? "Sua previsão está de acordo com o modelo: inverter o sinal de I inverte a orientação do campo criado pela bobina. Teste no controle de corrente." : "Essa previsão não corresponde ao modelo. Inverta a corrente e observe o vetor no sensor; o campo da bobina muda de sentido.";
});

canvas.addEventListener("pointerdown", beginDrag);
canvas.addEventListener("pointermove", moveDrag);
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);
canvas.addEventListener("keydown", (event) => {
  const step = event.shiftKey ? 0.01 : 0.01;
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
  event.preventDefault();
  const target = event.shiftKey && state.compasses.length ? state.compasses[state.selectedCompass] : state.sensor;
  if (event.key === "ArrowLeft") target.x -= step;
  if (event.key === "ArrowRight") target.x += step;
  if (event.key === "ArrowUp") target.y += step;
  if (event.key === "ArrowDown") target.y -= step;
  target.x = clamp(target.x, -0.37, 0.37); target.y = clamp(target.y, -0.23, 0.23);
  queueDraw();
});
const chart = byId("magnet-chart");
chart.addEventListener("pointermove", inspectChart);
chart.addEventListener("click", inspectChart);
chart.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); const rect = chart.getBoundingClientRect(); inspectChart({ ...event, type: "click", clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }); } });
window.addEventListener("resize", queueDraw);
if ("ResizeObserver" in window) new ResizeObserver(queueDraw).observe(canvas.parentElement);
updateModeUI(); render();


