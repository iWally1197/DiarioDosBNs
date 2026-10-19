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
  coil: makeCoil({ x: 0.24, y: -0.13 }), coilEnabled: false, coilVelocity: { x: 0, y: 0, angle: 0 },
  powerOutletEnabled: false, powerCableEnabled: false, coilConnected: false, coilPowerRequested: false, powerPlug: null,
  inductionMeterEnabled: false, inductionMeterEnergy: 0, inductionMeterVoltage: 0, inductionMeterPeakVoltage: 0,
  inductionMeterResistance: 10, inductionLastFlux: null, inductionLastTime: 0,
  metalBalls: [], selectedMetalBall: -1, sensor: { x: 0.18, y: 0.1 }, compasses: [{ x: -0.17, y: 0.11 }], selectedCompass: 0,
  showLines: true, showVectors: false, showHeatmap: false, showCurrent: true, showGrid: true, showInterior: true,
  showNumbers: true, earth: false, showMagnetSource: true, showCoilSource: false, density: 18,
  advanced: false, interactionMotion: false, interactionFixed: "first", simulationPaused: false,
  interactionVelocity: { x: 0, y: 0, angle: 0 }, interactionForce: null, reduceMotion: systemPrefersReducedMotion
});
let state = initial();
const POWER_OUTLET_POSITION = { x: 0.315, y: 0.17 };
function coilFluxPerTurn() {
  if (!state.coilEnabled) return 0;
  const coil = state.coil, field = makeFieldModel({ magnets: allActiveMagnets(), coil: null, useCoil: false, earth: false });
  const axis = { x: Math.cos(coil.angle), y: Math.sin(coil.angle) };
  const tangent = { x: -axis.y, y: axis.x }, radius = coil.radius * Math.sqrt(2 / 3);
  const sample = (offset, z = 0) => {
    const point = { x: coil.x + tangent.x * offset, y: coil.y + tangent.y * offset, z };
    const b = field.at(point);
    return b.x * axis.x + b.y * axis.y;
  };
  const average = 0.25 * sample(0)
    + 0.1875 * (sample(radius) + sample(-radius) + sample(0, radius) + sample(0, -radius));
  return Math.PI * coil.radius * coil.radius * average;
}
function resetInductionMeter() {
  state.inductionMeterEnergy = 0; state.inductionMeterVoltage = 0; state.inductionMeterPeakVoltage = 0;
  state.inductionLastFlux = null; state.inductionLastTime = 0;
}
function updateInductionMeter() {
  if (!state.inductionMeterEnabled || !state.coilEnabled) return;
  if (state.simulationPaused) {
    state.inductionLastFlux = null; state.inductionLastTime = 0; state.inductionMeterVoltage = 0; return;
  }
  const now = performance.now(), flux = coilFluxPerTurn();
  if (state.inductionLastFlux === null || !state.inductionLastTime) {
    state.inductionLastFlux = flux; state.inductionLastTime = now; state.inductionMeterVoltage = 0; return;
  }
  const dt = (now - state.inductionLastTime) / 1000;
  if (dt > 0.2) {
    state.inductionLastFlux = flux; state.inductionLastTime = now; state.inductionMeterVoltage = 0; return;
  }
  if (dt < 0.005) return;
  const voltage = -state.coil.turns * (flux - state.inductionLastFlux) / dt;
  state.inductionMeterVoltage = Math.abs(voltage) < 0.002 ? 0 : voltage;
  state.inductionMeterPeakVoltage = Math.max(state.inductionMeterPeakVoltage, Math.abs(state.inductionMeterVoltage));
  state.inductionMeterEnergy += state.inductionMeterVoltage ** 2 / state.inductionMeterResistance * dt;
  state.inductionLastFlux = flux; state.inductionLastTime = now;
}
function inductionEnergyLabel(joules = state.inductionMeterEnergy) {
  if (joules < 0.001) return `${formatter(2).format(joules * 1e6)} μJ`;
  if (joules < 1) return `${formatter(2).format(joules * 1e3)} mJ`;
  return `${formatter(3).format(joules)} J`;
}
function plugNearCoil() {
  const reach = state.coil.length / 2 + state.coil.radius + 0.11;
  return { x: clamp(state.coil.x - Math.cos(state.coil.angle) * reach, -0.36, 0.36), y: clamp(state.coil.y - Math.sin(state.coil.angle) * reach, -0.22, 0.22) };
}
function coilIsEnergized() {
  return state.coilEnabled && state.powerOutletEnabled && state.powerCableEnabled && state.coilConnected && state.coilPowerRequested;
}
function effectiveCoil() {
  return state.coilEnabled ? { ...state.coil, current: coilIsEnergized() ? state.coil.current : 0 } : null;
}
function plugPosition() { return state.coilConnected ? POWER_OUTLET_POSITION : (state.powerPlug || plugNearCoil()); }
function prepareElectromagnetKit() {
  const newlyAdded = !state.coilEnabled;
  state.coilEnabled = true; state.coil.core = true; state.showCoilSource = true; state.powerOutletEnabled = true;
  if (!state.powerCableEnabled) {
    state.powerCableEnabled = true; state.coilConnected = false; state.coilPowerRequested = false; state.powerPlug = plugNearCoil();
  } else if (newlyAdded) {
    state.coilConnected = false; state.coilPowerRequested = false; state.powerPlug = plugNearCoil();
  }
}
let magnetZoom = 1;
let view = { width: 0, height: 0, scale: 1, dpr: 1 };
let drag = null;
let redrawFrame = 0;
let simulationFrame = 0;
let lastSimulationTime = 0;
let lastSimulationRender = 0;
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
    : mode === "field" ? [state.showMagnetSource ? state.magnet : null]
    : [state.magnet];
  const coil = effectiveCoil();
  const useCoil = Boolean(coil && coilIsEnergized() && (mode !== "field" || state.showCoilSource));
  return makeFieldModel({ magnets, coil: state.coilEnabled ? (overrides.coil || coil) : null, useCoil, earth: state.earth, ...overrides });
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
  byId("interaction-motion").checked = state.interactionMotion;
  byId("interaction-fixed").value = state.interactionFixed;
  byId("coil-toggle").setAttribute("aria-pressed", String(state.coilEnabled));
  byId("coil-toggle").textContent = state.coilEnabled ? "− Retirar bobina" : "＋ Colocar bobina";
  byId("energy-meter-toggle").setAttribute("aria-pressed", String(state.inductionMeterEnabled));
  byId("energy-meter-toggle").textContent = state.inductionMeterEnabled ? "− Retirar medidor de energia" : "＋ Adicionar medidor de energia";
  byId("energy-meter-toggle").disabled = !state.coilEnabled;
  byId("energy-meter-reset").disabled = !state.inductionMeterEnabled;
  byId("induction-load").value = String(state.inductionMeterResistance);
  byId("induction-load-value").textContent = `${state.inductionMeterResistance} Ω`;
  byId("energy-meter-status").textContent = !state.coilEnabled ? "Coloque uma bobina para iniciar a medição."
    : !state.inductionMeterEnabled ? "Adicione o medidor e mova o ímã através da bobina."
    : `Energia na carga: ${inductionEnergyLabel()} · pico de tensão: ${formatter(3).format(state.inductionMeterPeakVoltage)} V.`;
  byId("power-outlet-toggle").setAttribute("aria-pressed", String(state.powerOutletEnabled));
  byId("power-outlet-toggle").textContent = state.powerOutletEnabled ? "− Retirar tomada" : "＋ Adicionar tomada";
  byId("power-cable-toggle").setAttribute("aria-pressed", String(state.powerCableEnabled));
  byId("power-cable-toggle").textContent = state.powerCableEnabled ? "− Retirar cabo e plugue" : "＋ Adicionar cabo e plugue";
  byId("power-cable-toggle").disabled = !state.coilEnabled;
  byId("electromagnet-power-toggle").setAttribute("aria-pressed", String(coilIsEnergized()));
  byId("electromagnet-power-toggle").textContent = state.coilPowerRequested ? "Desativar eletroímã" : "Ativar eletroímã";
  byId("electromagnet-power-toggle").disabled = !state.coilEnabled || !state.powerOutletEnabled || !state.powerCableEnabled || !state.coilConnected;
  byId("power-status").textContent = !state.coilEnabled ? "Coloque a bobina para começar a montagem."
    : !state.powerOutletEnabled ? "Adicione a tomada para fornecer energia."
    : !state.powerCableEnabled ? "Adicione o cabo com plugue ao eletroímã."
    : !state.coilConnected ? "Arraste o plugue até a tomada para conectar a energia."
    : !state.coilPowerRequested ? "Conectado à tomada. Ative o eletroímã para gerar corrente e campo."
    : "Eletroímã ligado: corrente, polos e campo magnético ativos.";
  const secondMagnetButton = byId("second-magnet-toggle");
  const secondMagnetEnabled = state.mode === "interaction";
  secondMagnetButton.setAttribute("aria-pressed", String(secondMagnetEnabled));
  secondMagnetButton.textContent = secondMagnetEnabled ? "− Retirar segundo ímã" : "＋ Adicionar segundo ímã";
  const motionButton = byId("interaction-motion-toggle");
  motionButton.setAttribute("aria-pressed", String(state.interactionMotion));
  motionButton.textContent = state.interactionMotion ? "Parar movimento do ímã livre" : "Simular movimento do ímã livre";
  byId("show-coil-source").checked = state.showCoilSource;
  byId("earth-field").checked = state.earth;
  byId("reduce-motion").checked = state.reduceMotion;
}

function updateModeUI() {
  const tabs = [...document.querySelectorAll(".magnet-modes [role=tab]")];
  tabs.forEach((button) => {
    const selected = button.dataset.mode === state.mode;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  const selectedTab = tabs.find((button) => button.dataset.mode === state.mode);
  if (selectedTab) byId("magnet-workspace").setAttribute("aria-labelledby", selectedTab.id);
  byId("permanent-controls").hidden = !["permanent", "interaction", "field"].includes(state.mode);
  byId("coil-controls").hidden = !state.coilEnabled;
  byId("field-controls").hidden = state.mode !== "field";
  byId("interaction-controls").hidden = state.mode !== "interaction";
  document.querySelectorAll(".magnet-secondary-control").forEach((node) => { node.hidden = state.mode !== "interaction"; });
  document.querySelectorAll(".magnet-advanced").forEach((node) => { node.hidden = !state.advanced; });
  byId("magnet-graphs").hidden = state.mode !== "graphs";
  syncKeyboardPositionControls();
  const titles = { permanent: "Ímã permanente", electromagnet: "Eletroímã", field: "Campo magnético", interaction: "Interação entre ímãs", graphs: "Experimentos e gráficos" };
  const descriptions = {
    permanent: "Arraste o ímã, a bússola ou o sensor. Você também pode inserir uma bobina e esferas metálicas para observar a interação magnética.",
    electromagnet: "A bobina com núcleo forma o eletroímã. O ímã permanente, a bobina e as esferas podem responder às forças magnéticas do modelo.",
    field: "Ative ou combine fontes e compare o vetor resultante no sensor. A densidade das linhas só muda a visualização.",
    interaction: "Arraste os ímãs, compare seus polos e, se desejar, ative o movimento calculado de um deles mantendo o outro fixo. A bobina e as esferas também respondem ao campo.",
    graphs: "Os gráficos vêm do mesmo cálculo do cenário. Inspecione pontos ou clique para posicionar o sensor."
  };
  byId("controls-title").textContent = titles[state.mode];
  byId("mode-description").textContent = descriptions[state.mode];
  byId("add-compass").hidden = false;
  const hasDynamicBodies = state.coilEnabled || state.metalBalls.length > 0 || (state.mode === "interaction" && state.interactionMotion);
  const pauseButton = byId("simulation-pause");
  pauseButton.disabled = false;
  pauseButton.textContent = state.simulationPaused ? "Retomar simulação" : "Pausar simulação";
  pauseButton.setAttribute("aria-pressed", String(state.simulationPaused));
  byId("metal-ball-count").textContent = state.metalBalls.length
    ? `${state.metalBalls.length} de 8 esferas. Arraste uma para reposicioná-la; a selecionada é removida pelo botão acima.`
    : "Nenhuma esfera adicionada. Até oito esferas podem ser atraídas pelo campo resultante.";
  byId("remove-metal-ball").disabled = state.selectedMetalBall < 0 || !state.metalBalls.length;
  document.body.classList.toggle("magnet-reduced-motion", state.reduceMotion);
  const motionStatus = byId("interaction-motion-status");
  if (!state.interactionMotion) motionStatus.textContent = "Ative o movimento do ímã livre. A pausa global congela o ímã, a bobina e as esferas metálicas.";
  else if (state.simulationPaused) motionStatus.textContent = `Simulação pausada. ${interactionSummary()}`;
  else if (state.reduceMotion) motionStatus.textContent = "Movimento automático suspenso pela preferência de movimento reduzido. Os objetos ainda podem ser arrastados.";
  else motionStatus.textContent = `O ímã livre responde à força e ao torque entre os prismas. ${interactionSummary()}`;
  const status = byId("simulation-status");
  if (state.simulationPaused) status.textContent = "Simulação pausada: o ímã livre, a bobina e as esferas ficam congelados; o campo permanece estático para consulta.";
  else if (state.reduceMotion) status.textContent = "A preferência de movimento reduzido suspendeu o movimento automático; arrastar e alterar parâmetros continuam disponíveis.";
  else if (hasDynamicBodies) status.textContent = "Simulação ativa: bobina, esferas e, quando habilitado, ímã livre respondem ao campo magnético.";
  else status.textContent = "Adicione uma bobina ou esferas de metal para iniciar a interação magnética.";
  const fullscreenActive = document.fullscreenElement === byId("magnet-workspace");
  byId("fullscreen-toggle").setAttribute("aria-pressed", String(fullscreenActive));
  byId("fullscreen-toggle").textContent = fullscreenActive ? "Sair da tela cheia" : "Tela cheia";
  byId("fullscreen-menu-toggle").hidden = !fullscreenActive;
  const menuOpen = !byId("magnet-workspace").classList.contains("magnet-controls-collapsed");
  byId("fullscreen-menu-toggle").setAttribute("aria-expanded", String(menuOpen));
  byId("fullscreen-menu-toggle").textContent = menuOpen ? "Ocultar gráficos e parâmetros" : "Mostrar gráficos e parâmetros";
  if (state.mode === "field") {
    state.showMagnetSource = byId("show-magnet-source").checked;
    state.showCoilSource = byId("show-coil-source").checked;
  }
}

function positionableObjects() {
  const objects = [
    { value: "sensor", label: "Sensor digital", type: "sensor", point: state.sensor },
    { value: "magnet-1", label: "Ímã permanente", type: "magnet", index: 0, point: state.magnet }
  ];
  if (state.mode === "interaction") objects.push({ value: "magnet-2", label: "Segundo ímã", type: "magnet", index: 1, point: state.secondMagnet });
  if (state.coilEnabled) objects.push({ value: "coil", label: "Bobina", type: "coil", point: state.coil });
  state.compasses.forEach((point, index) => objects.push({ value: `compass-${index}`, label: `Bússola ${index + 1}`, type: "compass", index, point }));
  state.metalBalls.forEach((point, index) => objects.push({ value: `metal-${index}`, label: `Bolinha de metal ${index + 1}`, type: "metal", index, point }));
  if (state.coilEnabled && state.powerCableEnabled) {
    objects.push({ value: "power-plug", label: "Plugue do eletroímã", type: "power-plug", point: state.powerPlug || plugNearCoil() });
  }
  return objects;
}

function syncKeyboardPositionControls() {
  const select = byId("magnet-position-target");
  if (!select) return;
  const objects = positionableObjects();
  const signature = objects.map(({ value, label }) => `${value}:${label}`).join("|");
  const previous = select.value;
  if (select.dataset.options !== signature) {
    select.replaceChildren(...objects.map(({ value, label }) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      return option;
    }));
    select.dataset.options = signature;
  }
  if (objects.some((object) => object.value === previous)) select.value = previous;
  else if (objects.length) select.value = objects[0].value;
  const object = objects.find((item) => item.value === select.value) || objects[0];
  const x = byId("magnet-position-x"), y = byId("magnet-position-y");
  if (!object || !x || !y) return;
  x.value = String(object.point.x);
  y.value = String(object.point.y);
  byId("magnet-position-x-value").textContent = `${formatter(2).format(object.point.x)} m`;
  byId("magnet-position-y-value").textContent = `${formatter(2).format(object.point.y)} m`;
}

function selectedPositionObject() {
  return positionableObjects().find((object) => object.value === byId("magnet-position-target").value) || null;
}

function applyKeyboardPosition(event) {
  const object = selectedPositionObject();
  if (!object) return;
  const movingX = event.currentTarget.id === "magnet-position-x";
  const x = clamp(movingX ? Number(byId("magnet-position-x").value) : object.point.x, -0.37, 0.37);
  const y = clamp(movingX ? object.point.y : Number(byId("magnet-position-y").value), -0.23, 0.23);
  const status = byId("magnet-position-status");
  if (object.type === "magnet" && state.mode === "interaction") {
    const other = object.index === 0 ? state.secondMagnet : state.magnet;
    if (magnetPrismsOverlap(other, makeMagnet({ ...object.point, x, y }))) {
      status.textContent = "Essa posição faria os ímãs se sobreporem. Escolha outra posição.";
      syncKeyboardPositionControls();
      return;
    }
  }
  object.point.x = x;
  object.point.y = y;
  if (object.type === "metal") { object.point.vx = 0; object.point.vy = 0; }
  if (object.type === "coil") state.coilVelocity = { x: 0, y: 0, angle: 0 };
  if (object.type === "magnet" && state.mode === "interaction") state.interactionVelocity = { x: 0, y: 0, angle: 0 };
  if (object.type === "compass") state.selectedCompass = object.index;
  if (object.type === "metal") state.selectedMetalBall = object.index;
  if (object.type === "power-plug") {
    state.powerPlug = object.point;
    const closeToOutlet = Math.hypot(x - POWER_OUTLET_POSITION.x, y - POWER_OUTLET_POSITION.y) <= 0.065;
    state.coilConnected = Boolean(state.powerOutletEnabled && closeToOutlet);
    state.coilPowerRequested = false;
    syncSimulationLoop();
  }
  syncKeyboardPositionControls();
  queueDraw();
}

byId("magnet-position-target").addEventListener("change", syncKeyboardPositionControls);
byId("magnet-position-x").addEventListener("input", applyKeyboardPosition);
byId("magnet-position-y").addEventListener("input", applyKeyboardPosition);
byId("magnet-position-x").addEventListener("change", () => {
  const object = selectedPositionObject();
  if (object) byId("magnet-position-status").textContent = `${object.label}: posição horizontal ${formatter(2).format(object.point.x)} m.`;
});
byId("magnet-position-y").addEventListener("change", () => {
  const object = selectedPositionObject();
  if (object) byId("magnet-position-status").textContent = `${object.label}: posição vertical ${formatter(2).format(object.point.y)} m.`;
});

document.querySelectorAll(".magnet-modes [role=tab]").forEach((tab) => tab.addEventListener("keydown", (event) => {
  const tabs = [...document.querySelectorAll(".magnet-modes [role=tab]")];
  const index = tabs.indexOf(tab);
  let next = index;
  if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
  else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = tabs.length - 1;
  else return;
  event.preventDefault();
  tabs[next].focus();
  tabs[next].click();
}));

function interactionSummary() {
  const result = state.interactionForce || magnetInteractionForceTorque(
    state.interactionFixed === "first" ? state.magnet : state.secondMagnet,
    state.interactionFixed === "first" ? state.secondMagnet : state.magnet
  );
  const fx = formatter(3).format(result.force.x), fy = formatter(3).format(result.force.y), torque = formatter(4).format(result.torque);
  return `Estimativa no ímã livre: Fx ${fx} N, Fy ${fy} N e τz ${torque} N·m.`;
}

function shouldRunSimulation() {
  const hasDynamicBodies = state.coilEnabled || state.metalBalls.length > 0 || (state.mode === "interaction" && state.interactionMotion);
  return hasDynamicBodies && !state.simulationPaused && !state.reduceMotion;
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

function makeDynamicsField(includeCoil = true) {
  const magnets = allActiveMagnets();
  const useCoil = includeCoil && coilIsEnergized() && (state.mode !== "field" || state.showCoilSource);
  return makeFieldModel({ magnets, coil: useCoil ? effectiveCoil() : null, useCoil, earth: false });
}

function limitVelocity(velocity, maxSpeed) {
  const speed = Math.hypot(velocity.x, velocity.y);
  if (speed > maxSpeed) { velocity.x *= maxSpeed / speed; velocity.y *= maxSpeed / speed; }
}

function coilForceAndTorque(field) {
  const coil = effectiveCoil() || state.coil, p = { x: coil.x, y: coil.y }, h = 0.0025;
  const b = field.at(p), xp = field.at({ x: p.x + h, y: p.y }), xm = field.at({ x: p.x - h, y: p.y });
  const yp = field.at({ x: p.x, y: p.y + h }), ym = field.at({ x: p.x, y: p.y - h });
  const dBxdx = (xp.x - xm.x) / (2 * h), dBydx = (xp.y - xm.y) / (2 * h);
  const dBxdy = (yp.x - ym.x) / (2 * h), dBydy = (yp.y - ym.y) / (2 * h);
  const moment = coil.turns * coil.current * Math.PI * coil.radius * coil.radius;
  const mx = moment * Math.cos(coil.angle), my = moment * Math.sin(coil.angle);
  let fx = mx * dBxdx + my * dBydx, fy = mx * dBxdy + my * dBydy;
  if (coil.core) {
    const magnitude = Math.hypot(b.x, b.y);
    const gradientX = (Math.hypot(xp.x, xp.y) - Math.hypot(xm.x, xm.y)) / (2 * h);
    const gradientY = (Math.hypot(yp.x, yp.y) - Math.hypot(ym.x, ym.y)) / (2 * h);
    const coreVolume = Math.PI * (coil.radius * 0.22) ** 2 * coil.length;
    const inducedMoment = 2.5e4 * coreVolume * Math.tanh(magnitude / 0.035);
    fx += inducedMoment * gradientX; fy += inducedMoment * gradientY;
  }
  const maxForce = 0.45, forceMagnitude = Math.hypot(fx, fy);
  if (forceMagnitude > maxForce) { fx *= maxForce / forceMagnitude; fy *= maxForce / forceMagnitude; }
  return { force: { x: fx, y: fy }, torque: mx * b.y - my * b.x };
}

function rectanglesOverlap(a, b) {
  const axes = [a.angle, a.angle + Math.PI / 2, b.angle, b.angle + Math.PI / 2];
  const halfA = [a.length / 2, a.height / 2], halfB = [b.length / 2, b.height / 2];
  for (const angle of axes) {
    const ux = Math.cos(angle), uy = Math.sin(angle);
    const centerDistance = Math.abs((b.x - a.x) * ux + (b.y - a.y) * uy);
    const radius = (halfA[0] * Math.abs(Math.cos(angle - a.angle)) + halfA[1] * Math.abs(Math.sin(angle - a.angle)))
      + (halfB[0] * Math.abs(Math.cos(angle - b.angle)) + halfB[1] * Math.abs(Math.sin(angle - b.angle)));
    if (centerDistance >= radius) return false;
  }
  return true;
}

function updateCoilMotion(dt, field) {
  const result = coilForceAndTorque(field), velocity = state.coilVelocity;
  velocity.x = (velocity.x + result.force.x / 0.18 * dt) * Math.exp(-2.2 * dt);
  velocity.y = (velocity.y + result.force.y / 0.18 * dt) * Math.exp(-2.2 * dt);
  limitVelocity(velocity, 0.42);
  velocity.angle = (velocity.angle + result.torque / 0.004 * dt) * Math.exp(-2.8 * dt);
  const next = { ...state.coil, x: clamp(state.coil.x + velocity.x * dt, -0.34, 0.34), y: clamp(state.coil.y + velocity.y * dt, -0.19, 0.19) };
  next.angle = ((state.coil.angle + velocity.angle * dt + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  const coilRect = { ...next, height: state.coil.radius * 2 };
  const blocked = allActiveMagnets().some((magnet) => rectanglesOverlap(coilRect, magnet));
  if (blocked) { velocity.x *= -0.18; velocity.y *= -0.18; }
  else { state.coil.x = next.x; state.coil.y = next.y; }
  state.coil.angle = next.angle;
}

function metalBallForce(ball, field) {
  const h = 0.002, p = { x: ball.x, y: ball.y }, saturation = 0.06, volume = 4 * Math.PI * ball.radius ** 3 / 3;
  const magnitude = (point) => { const b = field.at(point); return Math.hypot(b.x, b.y); };
  const b = magnitude(p), dBdx = (magnitude({ x: p.x + h, y: p.y }) - magnitude({ x: p.x - h, y: p.y })) / (2 * h);
  const dBdy = (magnitude({ x: p.x, y: p.y + h }) - magnitude({ x: p.x, y: p.y - h })) / (2 * h);
  const moment = 2.5e4 * volume * Math.tanh(b / saturation);
  let fx = moment * dBdx, fy = moment * dBdy;
  const maxForce = 0.22, forceMagnitude = Math.hypot(fx, fy);
  if (forceMagnitude > maxForce) { fx *= maxForce / forceMagnitude; fy *= maxForce / forceMagnitude; }
  return { x: fx, y: fy };
}

function keepBallOutsideMagnets(ball, magnets) {
  for (const magnet of magnets) {
    const dx = ball.x - magnet.x, dy = ball.y - magnet.y, c = Math.cos(magnet.angle), s = Math.sin(magnet.angle);
    let lx = dx * c + dy * s, ly = -dx * s + dy * c;
    const hx = magnet.length / 2 + ball.radius, hy = magnet.height / 2 + ball.radius;
    if (Math.abs(lx) >= hx || Math.abs(ly) >= hy) continue;
    const pushX = hx - Math.abs(lx), pushY = hy - Math.abs(ly);
    if (pushX < pushY) lx = (lx < 0 ? -1 : 1) * hx;
    else ly = (ly < 0 ? -1 : 1) * hy;
    ball.x = magnet.x + lx * c - ly * s; ball.y = magnet.y + lx * s + ly * c;
    ball.vx *= 0.12; ball.vy *= 0.12;
  }
}

function updateMetalBalls(dt, field, magnets) {
  const density = 7800;
  for (const ball of state.metalBalls) {
    const force = metalBallForce(ball, field), volume = 4 * Math.PI * ball.radius ** 3 / 3;
    const mass = Math.max(0.001, density * volume);
    ball.vx = (ball.vx + force.x / mass * dt) * Math.exp(-1.7 * dt);
    ball.vy = (ball.vy + force.y / mass * dt) * Math.exp(-1.7 * dt);
    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed > 0.24) { ball.vx *= 0.24 / speed; ball.vy *= 0.24 / speed; }
    ball.x = clamp(ball.x + ball.vx * dt, -0.385, 0.385);
    ball.y = clamp(ball.y + ball.vy * dt, -0.215, 0.215);
    keepBallOutsideMagnets(ball, magnets);
  }
  for (let i = 0; i < state.metalBalls.length; i++) for (let j = i + 1; j < state.metalBalls.length; j++) {
    const a = state.metalBalls[i], b = state.metalBalls[j], dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy), minDistance = a.radius + b.radius;
    if (distance >= minDistance) continue;
    const nx = distance > 1e-9 ? dx / distance : 1, ny = distance > 1e-9 ? dy / distance : 0;
    const overlap = minDistance - distance;
    a.x -= nx * overlap / 2; a.y -= ny * overlap / 2; b.x += nx * overlap / 2; b.y += ny * overlap / 2;
    a.vx *= 0.5; a.vy *= 0.5; b.vx *= 0.5; b.vy *= 0.5;
  }
}

function advanceSimulation(dt) {
  if (state.mode === "interaction" && state.interactionMotion) advanceInteraction(dt);
  const magnets = allActiveMagnets();
  if (state.coilEnabled) updateCoilMotion(dt, makeDynamicsField(false));
  if (state.metalBalls.length) updateMetalBalls(dt, makeDynamicsField(true), magnets);
}

function simulationIsSettled() {
  const slow = (value) => Math.abs(value) < 0.001;
  return (!state.coilEnabled || (slow(state.coilVelocity.x) && slow(state.coilVelocity.y) && slow(state.coilVelocity.angle)))
    && state.metalBalls.every((ball) => slow(ball.vx) && slow(ball.vy))
    && (!(state.mode === "interaction" && state.interactionMotion)
      || (slow(state.interactionVelocity.x) && slow(state.interactionVelocity.y) && slow(state.interactionVelocity.angle)));
}

function simulationLoop(timestamp) {
  if (!shouldRunSimulation()) { simulationFrame = 0; lastSimulationTime = 0; return; }
  const dt = lastSimulationTime ? Math.min(0.034, Math.max(0, (timestamp - lastSimulationTime) / 1000)) : 0;
  lastSimulationTime = timestamp;
  if (dt) advanceSimulation(dt);
  if (timestamp - lastSimulationRender >= 33) { render(); lastSimulationRender = timestamp; }
  if (dt && simulationIsSettled()) { simulationFrame = 0; lastSimulationTime = 0; return; }
  simulationFrame = requestAnimationFrame(simulationLoop);
}

function syncSimulationLoop() {
  if (shouldRunSimulation()) {
    if (!simulationFrame) { lastSimulationTime = 0; lastSimulationRender = 0; simulationFrame = requestAnimationFrame(simulationLoop); }
  } else if (simulationFrame) {
    cancelAnimationFrame(simulationFrame); simulationFrame = 0; lastSimulationTime = 0;
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
  view = { width, height, dpr, scale: Math.min((width - 58) / 0.82, (height - 56) / 0.52) * magnetZoom };
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

function drawPowerHardware() {
  const socket = toScreen(POWER_OUTLET_POSITION);
  if (state.powerOutletEnabled) {
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.38)"; ctx.shadowBlur = 12; ctx.shadowOffsetY = 5;
    ctx.fillStyle = "#dbe4ee"; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(socket.x - 28, socket.y - 39, 56, 78, 10); ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.fillStyle = "#bbc7d6"; ctx.beginPath(); ctx.roundRect(socket.x - 18, socket.y - 27, 36, 51, 17); ctx.fill();
    ctx.fillStyle = "#29384b";
    ctx.beginPath(); ctx.roundRect(socket.x - 8, socket.y - 15, 4, 12, 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(socket.x + 4, socket.y - 15, 4, 12, 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(socket.x, socket.y + 6, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#58687d"; ctx.font = "700 8px system-ui"; ctx.textAlign = "center"; ctx.fillText("ENERGIA", socket.x, socket.y + 33);
    ctx.restore();
  }
  if (!state.coilEnabled || !state.powerCableEnabled) return;
  const start = toScreen({
    x: state.coil.x - Math.cos(state.coil.angle) * (state.coil.length / 2 + .045),
    y: state.coil.y - Math.sin(state.coil.angle) * (state.coil.length / 2 + .045)
  });
  const plug = toScreen(plugPosition()), distance = Math.hypot(plug.x - start.x, plug.y - start.y);
  const sag = Math.min(50, Math.max(12, distance * .16)), controlY = Math.max(start.y, plug.y) + sag;
  const energized = coilIsEnergized();
  ctx.save(); ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(start.x, start.y);
  ctx.bezierCurveTo(start.x + (plug.x - start.x) * .28, controlY, start.x + (plug.x - start.x) * .72, controlY, plug.x - 17, plug.y);
  ctx.strokeStyle = "rgba(0,0,0,.42)"; ctx.lineWidth = 9; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(start.x, start.y);
  ctx.bezierCurveTo(start.x + (plug.x - start.x) * .28, controlY, start.x + (plug.x - start.x) * .72, controlY, plug.x - 17, plug.y);
  ctx.strokeStyle = energized ? "#c78b45" : "#59687b"; ctx.lineWidth = 5; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(start.x, start.y - 1);
  ctx.bezierCurveTo(start.x + (plug.x - start.x) * .28, controlY - 1, start.x + (plug.x - start.x) * .72, controlY - 1, plug.x - 17, plug.y - 1);
  ctx.strokeStyle = energized ? "#ffe0a0" : "#99a8b9"; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = "#e6b877"; ctx.beginPath(); ctx.arc(start.x, start.y, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#9baabd"; ctx.strokeStyle = "#e7edf5"; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.roundRect(plug.x - 22, plug.y - 11, 24, 22, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#303d50"; ctx.beginPath(); ctx.roundRect(plug.x - 15, plug.y - 7, 10, 14, 3); ctx.fill();
  ctx.strokeStyle = "#dfe6ee"; ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.moveTo(plug.x - 5, plug.y - 5); ctx.lineTo(plug.x + 5, plug.y - 5);
  ctx.moveTo(plug.x - 5, plug.y + 5); ctx.lineTo(plug.x + 5, plug.y + 5); ctx.stroke();
  ctx.fillStyle = "#f2c778"; ctx.beginPath(); ctx.arc(plug.x - 17, plug.y, 3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawCoil(model) {
  if (!model.coil) return;
  const coil = model.coil; const center = toScreen(coil); const width = coil.length * view.scale; const radius = coil.radius * view.scale;
  const energized = coilIsEnergized();
  ctx.save(); ctx.translate(center.x, center.y); ctx.rotate(-coil.angle);
  if (coil.core) {
    const metal = ctx.createLinearGradient(0, -Math.max(5, radius * .24), 0, Math.max(5, radius * .24));
    metal.addColorStop(0, energized ? "#dce6f2" : "#8793a4"); metal.addColorStop(.48, energized ? "#737f90" : "#4f5b6d"); metal.addColorStop(1, energized ? "#b9c6d7" : "#667387");
    ctx.fillStyle = metal; ctx.strokeStyle = energized ? "#ffe0a0" : "#c0c9d4"; ctx.lineWidth = 1.4;
    if (energized) { ctx.shadowColor = "rgba(255,190,96,.68)"; ctx.shadowBlur = 18; }
    ctx.beginPath(); ctx.roundRect(-width * .48, -Math.max(5, radius * .24), width * .96, Math.max(10, radius * .48), 6); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
  }
  for (let i = 0; i < coil.turns; i++) {
    const x = -width / 2 + (i / Math.max(1, coil.turns - 1)) * width;
    ctx.strokeStyle = i % 2 ? "#ad5e2d" : "#efb464"; ctx.lineWidth = Math.max(2.2, Math.min(4, width / coil.turns * .46));
    ctx.beginPath(); ctx.ellipse(x, 0, Math.max(3, width / coil.turns * .34), radius, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "rgba(255,235,190,.72)"; ctx.lineWidth = .8;
    ctx.beginPath(); ctx.ellipse(x - 1, 0, Math.max(2.4, width / coil.turns * .28), radius * .88, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
  }
  ctx.strokeStyle = "#ffe0a0"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-width / 2, -radius); ctx.lineTo(width / 2, -radius); ctx.moveTo(-width / 2, radius); ctx.lineTo(width / 2, radius); ctx.stroke();
  ctx.fillStyle = energized ? "#ffe0a0" : "#d4deeb"; ctx.font = "700 11px system-ui"; ctx.textAlign = "center";
  ctx.fillText(energized ? "ELETROÍMÃ · LIGADO" : "BOBINA · DESLIGADA", 0, -radius - 17);
  ctx.fillStyle = "#f5e0bd"; ctx.font = "12px system-ui";
  ctx.fillText(`${coil.turns} espiras · ${formatter(1).format(coil.current)} A${energized ? "" : " · sem corrente"}`, 0, radius + 23);
  if (energized && state.showCurrent && Math.abs(coil.current) > 0.02) {
    const sign = Math.sign(coil.current); ctx.font = "bold 14px system-ui"; ctx.textAlign = "center"; ctx.fillStyle = sign > 0 ? "#ffd57b" : "#a9c8ff";
    ctx.fillText(sign > 0 ? "⊙" : "⊗", -width / 2 - 9, -radius * .53);
    ctx.fillText(sign > 0 ? "⊗" : "⊙", width / 2 + 9, -radius * .53);
    drawArrow(-width / 2 - 28, 0, -width / 2 - 6, 0, sign > 0 ? "#ffd57b" : "#a9c8ff", 1.7, 5);
  }
  ctx.restore();
  if (energized) {
    const pole = Math.sign(coil.current) >= 0 ? "N" : "S";
    const plus = toScreen({ x: coil.x + Math.cos(coil.angle) * (coil.length / 2 + .025), y: coil.y + Math.sin(coil.angle) * (coil.length / 2 + .025) });
    ctx.fillStyle = pole === "N" ? "#e86161" : "#5d88e8"; ctx.font = "700 13px system-ui"; ctx.textAlign = "center"; ctx.fillText(pole, plus.x, plus.y);
  }
}
function drawInductionMeter() {
  if (!state.inductionMeterEnabled || !state.coilEnabled) return;
  const width = 188, height = 78, offset = state.coil.length / 2 + .17;
  const anchor = toScreen({
    x: state.coil.x - Math.cos(state.coil.angle) * offset,
    y: state.coil.y - Math.sin(state.coil.angle) * offset - .075
  });
  const x = clamp(anchor.x, width / 2 + 12, view.width - width / 2 - 12);
  const y = clamp(anchor.y, height / 2 + 12, view.height - height / 2 - 12);
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,.48)"; ctx.shadowBlur = 12; ctx.shadowOffsetY = 5;
  ctx.fillStyle = "#101b2b"; ctx.strokeStyle = "#d8b86b"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(x - width / 2, y - height / 2, width, height, 9); ctx.fill(); ctx.stroke();
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.fillStyle = "#07101d"; ctx.beginPath(); ctx.roundRect(x - width / 2 + 8, y - height / 2 + 8, width - 16, height - 16, 5); ctx.fill();
  ctx.fillStyle = "#9fb0c6"; ctx.font = "700 9px system-ui"; ctx.textAlign = "left";
  ctx.fillText("MEDIDOR DE ENERGIA INDUZIDA", x - width / 2 + 15, y - height / 2 + 21);
  const activePulse = Math.abs(state.inductionMeterVoltage) >= 0.002;
  ctx.fillStyle = activePulse ? "#66e4a3" : "#66758a"; ctx.beginPath(); ctx.arc(x + width / 2 - 17, y - height / 2 + 18, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#8df0b9"; ctx.font = "700 15px ui-monospace,Consolas,monospace";
  ctx.fillText(`ε ${formatter(3).format(state.inductionMeterVoltage)} V`, x - width / 2 + 15, y + 5);
  ctx.fillStyle = "#ffd878"; ctx.font = "700 14px ui-monospace,Consolas,monospace";
  ctx.fillText(`E ${inductionEnergyLabel()}`, x - width / 2 + 15, y + 25);
  ctx.fillStyle = "#9fb0c6"; ctx.font = "9px system-ui";
  ctx.fillText(`pico ${formatter(3).format(state.inductionMeterPeakVoltage)} V · carga ${state.inductionMeterResistance} Ω`, x - width / 2 + 15, y + height / 2 - 9);
  ctx.restore();
}

function drawMetalBalls() {
  state.metalBalls.forEach((ball, index) => {
    const p = toScreen(ball), radius = Math.max(7, ball.radius * view.scale);
    const gradient = ctx.createRadialGradient(p.x - radius * 0.34, p.y - radius * 0.42, radius * 0.08, p.x, p.y, radius);
    gradient.addColorStop(0, "#ffffff"); gradient.addColorStop(0.22, "#c9d3df"); gradient.addColorStop(0.56, "#65758a"); gradient.addColorStop(0.82, "#dce3eb"); gradient.addColorStop(1, "#39475a");
    ctx.save(); ctx.fillStyle = gradient; ctx.strokeStyle = index === state.selectedMetalBall ? "#ffd879" : "#edf2f8";
    ctx.lineWidth = index === state.selectedMetalBall ? 2.5 : 1.2; ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 5;
    ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.fillStyle = "#dbe5f3"; ctx.font = "10px system-ui"; ctx.textAlign = "center"; ctx.fillText(`Metal ${index + 1}`, p.x, p.y + radius + 12);
  });
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
  drawPowerHardware();
  drawCoil(model);
  drawInductionMeter();
  model.magnets.forEach((magnet, index) => drawMagnet(magnet, index + 1));
  drawMetalBalls();
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
  if (state.mode === "interaction") return [state.magnet, state.secondMagnet];
  if (state.mode === "field") return state.showMagnetSource ? [state.magnet] : [];
  return [state.magnet];
}

function graphData(kind) {
  const points = [];
  const magnets = allActiveMagnets();
  const graphCoil = effectiveCoil();
  const baseModel = makeFieldModel({
    magnets, coil: state.coilEnabled ? graphCoil : null,
    useCoil: coilIsEnergized() && (state.mode !== "field" || state.showCoilSource), earth: state.earth
  });
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
  byId("remove-metal-ball").disabled = state.metalBalls.length === 0 || state.selectedMetalBall < 0;
  const model = activeFieldModel();
  updateInductionMeter();
  renderScene(model); updateReadings(model); renderGraph();
}

function queueDraw() {
  syncSimulationLoop();
  if (redrawFrame) return;
  redrawFrame = requestAnimationFrame(() => { redrawFrame = 0; render(); });
}

function localPointer(event) {
  const rect = canvas.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function beginDrag(event) {
  const p = localPointer(event), world = toWorld(p), model = activeFieldModel();
  const items = [{ type: "sensor", point: state.sensor }, ...state.compasses.map((point, index) => ({ type: "compass", index, point })),
    ...state.metalBalls.map((point, index) => ({ type: "metal", index, point })),
    ...model.magnets.map((point, index) => ({ type: "magnet", index, point })), ...(model.coil ? [{ type: "coil", point: state.coil }] : []),
    ...(state.coilEnabled && state.powerCableEnabled ? [{ type: "power-plug", point: plugPosition() }] : [])];
  let nearest = null, best = Infinity;
  for (const item of items) {
    const screen = toScreen(item.point); const distance = Math.hypot(screen.x - p.x, screen.y - p.y);
    const radius = item.type === "magnet" ? Math.max(27, state.magnet.length * view.scale * 0.55)
      : item.type === "coil" ? Math.max(34, state.coil.radius * view.scale * 1.2)
      : item.type === "power-plug" ? 34
      : item.type === "metal" ? Math.max(15, state.metalBalls[item.index].radius * view.scale * 1.8) : 26;
    if (distance < radius && distance < best) { nearest = item; best = distance; }
  }
  if (!nearest) return;
  const fixedIndex = state.interactionFixed === "first" ? 0 : 1;
  if (state.mode === "interaction" && state.interactionMotion && !state.simulationPaused && !state.reduceMotion && nearest.type === "magnet" && nearest.index === fixedIndex) return;
  if (nearest.type === "compass") state.selectedCompass = nearest.index;
  if (nearest.type === "metal") state.selectedMetalBall = nearest.index;
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
  if (drag.type === "coil") { state.coil.x = x; state.coil.y = y; state.coilVelocity = { x: 0, y: 0, angle: 0 }; }
  if (drag.type === "power-plug") { state.powerPlug = { x, y }; state.coilConnected = false; state.coilPowerRequested = false; }
  if (drag.type === "metal") { const ball = state.metalBalls[drag.index]; ball.x = x; ball.y = y; ball.vx = 0; ball.vy = 0; }
  queueDraw();
}

function endDrag(event) {
  if (drag?.type === "power-plug") {
    const released = event?.type === "pointerup" ? toWorld(localPointer(event)) : null;
    const closeToOutlet = released && Math.hypot(released.x - POWER_OUTLET_POSITION.x, released.y - POWER_OUTLET_POSITION.y) <= 0.065;
    state.coilConnected = Boolean(state.powerOutletEnabled && closeToOutlet);
    state.powerPlug = state.coilConnected ? { ...POWER_OUTLET_POSITION } : (state.powerPlug || plugNearCoil());
    state.coilPowerRequested = false;
  }
  drag = null; canvas.classList.remove("is-dragging"); syncKeyboardPositionControls(); syncSimulationLoop(); queueDraw();
}

for (const button of document.querySelectorAll("[data-mode]")) button.addEventListener("click", () => {
  state.mode = button.dataset.mode;
  state.inductionLastFlux = null; state.inductionLastTime = 0; state.inductionMeterVoltage = 0;
  if (state.mode === "electromagnet") prepareElectromagnetKit();
  if (state.mode === "field") state.showCoilSource = state.coilEnabled;
  updateModeUI(); syncSimulationLoop(); queueDraw();
});
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
byId("coil-toggle").addEventListener("click", () => {
  state.coilEnabled = !state.coilEnabled;
  state.coilVelocity = { x: 0, y: 0, angle: 0 };
  if (!state.coilEnabled) {
    state.coilConnected = false; state.coilPowerRequested = false; state.powerCableEnabled = false;
    state.inductionMeterEnabled = false; resetInductionMeter();
  } else {
    state.powerPlug = plugNearCoil();
    if (state.mode === "electromagnet") { state.coil.core = true; state.powerOutletEnabled = true; state.powerCableEnabled = true; }
  }
  if (state.mode === "field") state.showCoilSource = state.coilEnabled;
  syncKeyboardPositionControls(); syncSimulationLoop(); queueDraw();
});
byId("power-outlet-toggle").addEventListener("click", () => {
  state.powerOutletEnabled = !state.powerOutletEnabled;
  if (!state.powerOutletEnabled) { state.coilConnected = false; state.coilPowerRequested = false; }
  syncSimulationLoop(); queueDraw();
});
byId("power-cable-toggle").addEventListener("click", () => {
  if (!state.coilEnabled) return;
  state.powerCableEnabled = !state.powerCableEnabled;
  if (state.powerCableEnabled) { state.powerPlug = plugNearCoil(); state.coilConnected = false; }
  else { state.coilConnected = false; state.coilPowerRequested = false; }
  syncKeyboardPositionControls(); syncSimulationLoop(); queueDraw();
});
byId("electromagnet-power-toggle").addEventListener("click", () => {
  if (!state.coilEnabled || !state.powerOutletEnabled || !state.powerCableEnabled || !state.coilConnected) return;
  state.coilPowerRequested = !state.coilPowerRequested;
  syncSimulationLoop(); queueDraw();
});
byId("energy-meter-toggle").addEventListener("click", () => {
  if (!state.coilEnabled) return;
  state.inductionMeterEnabled = !state.inductionMeterEnabled;
  resetInductionMeter(); queueDraw();
});
byId("energy-meter-reset").addEventListener("click", () => { resetInductionMeter(); queueDraw(); });
byId("induction-load").addEventListener("input", (event) => {
  state.inductionMeterResistance = Number(event.target.value);
  byId("induction-load-value").textContent = `${state.inductionMeterResistance} Ω`;
  queueDraw();
});
byId("interaction-motion-toggle").addEventListener("click", () => {
  if (state.mode !== "interaction") { state.mode = "interaction"; state.interactionMotion = true; }
  else state.interactionMotion = !state.interactionMotion;
  state.interactionVelocity = { x: 0, y: 0, angle: 0 };
  state.interactionForce = null;
  syncSimulationLoop(); queueDraw();
});
byId("second-magnet-toggle").addEventListener("click", () => {
  const adding = state.mode !== "interaction";
  state.mode = adding ? "interaction" : "permanent";
  state.interactionMotion = false;
  state.interactionVelocity = { x: 0, y: 0, angle: 0 };
  state.interactionForce = null;
  state.inductionLastFlux = null; state.inductionLastTime = 0; state.inductionMeterVoltage = 0;
  updateModeUI(); syncSimulationLoop(); queueDraw();
});
byId("add-metal-ball").addEventListener("click", () => {
  if (state.metalBalls.length >= 8) { byId("sensor-action-status").textContent = "O laboratório permite até oito esferas metálicas."; return; }
  const index = state.metalBalls.length;
  state.metalBalls.push({
    x: clamp(state.magnet.x - state.magnet.length / 2 - 0.04 - Math.floor(index / 3) * 0.035, -0.34, 0.34),
    y: clamp(state.magnet.y + ((index % 3) - 1) * 0.04, -0.19, 0.19),
    radius: 0.012, vx: 0, vy: 0
  });
  state.selectedMetalBall = state.metalBalls.length - 1;
  byId("sensor-action-status").textContent = "";
  syncKeyboardPositionControls(); syncSimulationLoop(); queueDraw();
});
byId("remove-metal-ball").addEventListener("click", () => {
  if (state.selectedMetalBall < 0 || !state.metalBalls.length) return;
  state.metalBalls.splice(state.selectedMetalBall, 1);
  state.selectedMetalBall = state.metalBalls.length ? Math.min(state.selectedMetalBall, state.metalBalls.length - 1) : -1;
  syncKeyboardPositionControls(); syncSimulationLoop(); queueDraw();
});
byId("sensor-x").addEventListener("input", (e) => { state.sensor.x = Number(e.target.value); queueDraw(); });
byId("sensor-y").addEventListener("input", (e) => { state.sensor.y = Number(e.target.value); queueDraw(); });
byId("line-density").addEventListener("input", (e) => { state.density = Number(e.target.value); queueDraw(); });
byId("interaction-motion").addEventListener("change", (event) => {
  state.interactionMotion = event.target.checked;
  state.interactionVelocity = { x: 0, y: 0, angle: 0 };
  state.interactionForce = null;
  syncSimulationLoop(); queueDraw();
});
byId("interaction-fixed").addEventListener("change", (event) => {
  state.interactionFixed = event.target.value;
  state.interactionVelocity = { x: 0, y: 0, angle: 0 };
  state.interactionForce = null;
  queueDraw();
});
byId("simulation-pause").addEventListener("click", () => {
  state.simulationPaused = !state.simulationPaused;
  syncSimulationLoop(); queueDraw();
});
byId("reduce-motion").addEventListener("change", (event) => {
  state.reduceMotion = event.target.checked;
  syncSimulationLoop(); queueDraw();
});
for (const [id, key] of [["show-lines", "showLines"], ["show-vectors", "showVectors"], ["show-heatmap", "showHeatmap"], ["show-current", "showCurrent"], ["show-grid", "showGrid"], ["show-numbers", "showNumbers"], ["show-interior", "showInterior"], ["earth-compass", "earth"], ["earth-field", "earth"], ["show-magnet-source", "showMagnetSource"], ["show-coil-source", "showCoilSource"]]) byId(id).addEventListener("change", (e) => { state[key] = e.target.checked; queueDraw(); });
byId("add-compass").addEventListener("click", () => { if (state.compasses.length >= 5) { byId("sensor-action-status").textContent = "O laboratório permite até cinco bússolas simultâneas."; return; } state.compasses.push({ x: clamp(state.sensor.x - 0.09, -0.34, 0.34), y: clamp(state.sensor.y - 0.08, -0.2, 0.2) }); state.selectedCompass = state.compasses.length - 1; byId("sensor-action-status").textContent = ""; syncKeyboardPositionControls(); queueDraw(); });
byId("remove-compass").addEventListener("click", () => { if (!state.compasses.length) return; state.compasses.splice(state.selectedCompass, 1); state.selectedCompass = Math.max(0, Math.min(state.selectedCompass, state.compasses.length - 1)); syncKeyboardPositionControls(); queueDraw(); });
byId("reset-lab").addEventListener("click", () => { state = initial(); graphComparison = null; chartInspection = "Passe o cursor ou toque em um ponto para inspecionar."; updateModeUI(); syncSimulationLoop(); queueDraw(); });
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
  const step = event.shiftKey ? 0.05 : 0.01;
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


const actionMenuButton = byId("action-menu-toggle");
const actionMenuPanel = byId("action-menu-panel");
actionMenuButton.setAttribute("aria-label", "Adicionar, remover e configurar objetos");
function setActionMenuOpen(open) {
  actionMenuPanel.hidden = !open;
  actionMenuButton.setAttribute("aria-expanded", String(open));
  actionMenuButton.textContent = open ? "Fechar objetos" : "Objetos";
}
actionMenuButton.addEventListener("click", () => setActionMenuOpen(actionMenuPanel.hidden));
document.addEventListener("pointerdown", (event) => {
  if (!actionMenuPanel.hidden && !event.target.closest(".magnet-action-menu")) setActionMenuOpen(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !actionMenuPanel.hidden) { setActionMenuOpen(false); actionMenuButton.focus(); }
});
const workspace = byId("magnet-workspace");
const controlsPanel = document.querySelector(".magnet-controls");
const fullscreenPanels = [document.querySelector(".magnet-readings"), byId("magnet-graphs")]
  .map((node) => ({ node, parent: node.parentNode, next: node.nextSibling }));
function placeFullscreenPanels(active) {
  if (active) {
    fullscreenPanels.forEach(({ node }) => controlsPanel.append(node));
  } else {
    [...fullscreenPanels].reverse().forEach(({ node, parent, next }) => {
      parent.insertBefore(node, next?.parentNode === parent ? next : null);
    });
  }
}
window.addEventListener("diario-lab-zoom", (event) => {
  if (document.fullscreenElement !== workspace) return;
  magnetZoom = clamp(magnetZoom * Number(event.detail?.factor || 1), 0.65, 2.5);
  queueDraw();
});
byId("fullscreen-toggle").addEventListener("click", async () => {
  try {
    if (document.fullscreenElement === workspace) await document.exitFullscreen();
    else await workspace.requestFullscreen();
  } catch {
    byId("simulation-status").textContent = "Não foi possível abrir a tela cheia neste navegador. Use o botão de menu do navegador ou tente novamente.";
  }
});
byId("fullscreen-menu-toggle").addEventListener("click", () => {
  workspace.classList.toggle("magnet-controls-collapsed");
  updateModeUI(); queueDraw();
});
document.addEventListener("fullscreenchange", () => {
  const active = document.fullscreenElement === workspace;
  workspace.classList.toggle("is-fullscreen", active);
  if (active) workspace.classList.add("magnet-controls-collapsed");
  setActionMenuOpen(false);
  placeFullscreenPanels(active);
  updateModeUI(); queueDraw();
});
window.addEventListener("resize", queueDraw);
if ("ResizeObserver" in window) new ResizeObserver(queueDraw).observe(canvas.parentElement);
updateModeUI(); render();


