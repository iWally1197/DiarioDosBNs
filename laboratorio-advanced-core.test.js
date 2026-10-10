import test from "node:test";
import assert from "node:assert/strict";
import { durationFor, graphFor, sampleValues, stateAt } from "./laboratorio-advanced-core.js";
import { experiments, initialParameters } from "./laboratorio-catalogo.js";

const params = (id) => initialParameters(experiments.find((item) => item.id === id));

test("MRU mantém velocidade constante e posição linear", () => {
  const state = stateAt("mru", { velocity: 4 }, 3);
  assert.equal(state.values.x, 12);
  assert.equal(state.values.v, 4);
  assert.equal(state.values.a, 0);
});

test("MUV usa as equações cinemáticas e respeita t=0", () => {
  const initial = stateAt("muv", { velocity: 2, acceleration: 1 }, 0);
  const later = stateAt("muv", { velocity: 2, acceleration: 1 }, 3);
  assert.deepEqual([initial.values.x, initial.values.v], [0, 2]);
  assert.deepEqual([later.values.x, later.values.v, later.values.a], [10.5, 5, 1]);
});

test("atrito estático mantém o bloco em repouso abaixo do limiar", () => {
  const p = { mass: 2, force: 2, muStatic: 0.25, muKinetic: 0.18 };
  const state = stateAt("newton", p, 5);
  assert.equal(state.values.a, 0);
  assert.equal(state.values.x, 0);
  assert.equal(state.values.friction, -2);
});

test("atrito cinético reduz a força resultante após o limiar", () => {
  const state = stateAt("newton", { mass: 2, force: 8, muStatic: 0.25, muKinetic: 0.18 }, 1);
  assert.ok(Math.abs(state.values.a - (8 - 0.18 * 2 * 9.81) / 2) < 1e-12);
});

test("atrito cinético continua se opondo ao movimento quando a força aponta para o sentido negativo", () => {
  const state = stateAt("newton", { mass: 2, force: -8, muStatic: 0.25, muKinetic: 0.18 }, 1);
  assert.ok(state.values.a < 0);
  assert.ok(state.values.friction > 0);
  assert.ok(Math.abs(state.values.a - (-8 + 0.18 * 2 * 9.81) / 2) < 1e-12);
});

test("rampa ideal conserva energia mecânica no início e no final", () => {
  const p = { mass: 1.7, length: 4, angle: 30 };
  const start = stateAt("energy", p, 0).values;
  const end = stateAt("energy", p, durationFor("energy", p)).values;
  assert.ok(Math.abs(start.total - end.total) < 1e-10);
  assert.ok(Math.abs(end.potential) < 1e-10);
});

test("rampa rejeita ângulos que não produzem o modelo de descida definido", () => {
  assert.throws(() => durationFor("energy", { length: 4, angle: 0 }), /entre 0° e 90°/);
  assert.throws(() => stateAt("energy", { mass: 1, length: 4, angle: 90 }, 1), /entre 0° e 90°/);
});

test("colisão elástica conserva momento e energia; inelástica conserva momento", () => {
  const elastic = stateAt("collision", { mass1: 1, mass2: 1.5, u1: 2, u2: -0.5, restitution: 1 }, 2.5).values;
  assert.ok(Math.abs(elastic.momentumBefore - elastic.momentumAfter) < 1e-12);
  assert.ok(Math.abs(elastic.kineticBefore - elastic.kineticAfter) < 1e-12);
  const inelastic = stateAt("collision", { mass1: 1, mass2: 1.5, u1: 2, u2: -0.5, restitution: 0 }, 2.5).values;
  assert.ok(Math.abs(inelastic.momentumBefore - inelastic.momentumAfter) < 1e-12);
  assert.ok(inelastic.kineticAfter < inelastic.kineticBefore);
});

test("oscilador massa-mola tem período teórico e energia constante", () => {
  const p = { mass: 1, k: 16, amplitude: 0.4 };
  const start = stateAt("spring", p, 0).values;
  const quarter = stateAt("spring", p, start.period / 4).values;
  assert.ok(Math.abs(start.period - Math.PI / 2) < 1e-12);
  assert.ok(Math.abs(start.total - quarter.total) < 1e-12);
  assert.ok(Math.abs(quarter.x) < 1e-12);
});

test("onda harmônica obedece v=λf e sincroniza deslocamento", () => {
  const p = { amplitude: 0.4, wavelength: 2, frequency: 0.5, xProbe: 0 };
  const state = stateAt("wave", p, 0.5).values;
  assert.equal(state.waveSpeed, 1);
  assert.ok(Math.abs(state.y + 0.4) < 1e-12);
  const graph = graphFor("wave", p, 0.5, "snapshot");
  assert.ok(graph.series[0].cursor);
});

test("Lei de Ohm calcula corrente e potência", () => {
  const values = stateAt("ohm", { voltage: 12, resistance: 24 }).values;
  assert.equal(values.current, 0.5);
  assert.equal(values.power, 6);
});

test("lente delgada identifica imagem real, virtual e foco singular", () => {
  assert.ok(stateAt("lens", { focalLength: 0.5, objectDistance: 1.5 }).values.imageDistance > 0);
  assert.ok(stateAt("lens", { focalLength: 0.5, objectDistance: 0.25 }).values.imageDistance < 0);
  assert.equal(stateAt("lens", { focalLength: 0.5, objectDistance: 0.5 }).values.image, "no infinito");
  assert.ok(stateAt("lens", { focalLength: 0.5, objectDistance: 1.5 }).values.magnification < 0);
  assert.throws(() => stateAt("lens", { focalLength: 0, objectDistance: 1 }), /Distância focal/);
  assert.throws(() => stateAt("lens", { focalLength: 0.5, objectDistance: 0 }), /Distância do objeto/);
});

test("calorimetria conserva energia e converge para a temperatura de equilíbrio", () => {
  const p = { temperature1: 80, temperature2: 20, mass1: 0.2, mass2: 0.3, conductance: 50 };
  const initial = stateAt("calorimetry", p, 0).values;
  const end = stateAt("calorimetry", p, durationFor("calorimetry", p)).values;
  assert.ok(Math.abs(initial.energyBalance) < 1e-10);
  assert.ok(Math.abs(end.temperature1 - end.equilibrium) < 0.5);
  assert.ok(Math.abs(end.temperature2 - end.equilibrium) < 0.5);
});

test("modelo de água líquida rejeita inversão de temperaturas e valores fora da faixa indicada", () => {
  const p = { temperature1: 80, temperature2: 20, mass1: 0.2, mass2: 0.3, conductance: 50 };
  assert.throws(() => stateAt("calorimetry", { ...p, temperature1: 10, temperature2: 30 }, 1), /temperatura fria/);
  assert.throws(() => stateAt("calorimetry", { ...p, temperature2: -5 }, 1), /temperatura fria/);
});

test("campo de cargas opostas aponta para a carga negativa e diverge nas cargas", () => {
  const p = { q1: 2, q2: -2, separation: 1, xProbe: 0 };
  assert.ok(stateAt("field", p).values.electricField > 0);
  assert.equal(stateAt("field", { ...p, xProbe: 0.5 }).values.singular, true);
});

test("todos os experimentos catalogados têm pergunta e metadados de modelo", () => {
  assert.ok(experiments.length >= 12);
  for (const experiment of experiments) {
    assert.ok(experiment.question, `${experiment.id} sem pergunta investigativa`);
    assert.ok(experiment.equation, `${experiment.id} sem equação`);
    assert.ok(experiment.assumptions, `${experiment.id} sem hipóteses`);
  }
});

test("gráficos saem do estado atual de cada modelo e contêm pontos finitos", () => {
  for (const experiment of experiments.filter((item) => !item.anchor)) {
    const p = params(experiment.id);
    const graph = graphFor(experiment.id, p, 0.2, experiment.charts[0].id);
    assert.ok(graph.series.length > 0, experiment.id);
    assert.ok(graph.series.some((series) => series.points.some((point) => point && Number.isFinite(point.y))), experiment.id);
  }
});

test("valores físicos e parâmetros inválidos geram erros explícitos", () => {
  assert.throws(() => stateAt("spring", { mass: 0, k: 4, amplitude: 1 }, 0), RangeError);
  assert.throws(() => stateAt("newton", { mass: 2, force: 8, muStatic: -0.1, muKinetic: 0 }, 1), /não pode ser negativa/);
  assert.throws(() => stateAt("newton", { mass: 2, force: 8, muStatic: 0.1, muKinetic: 0.5 }, 1), /maior ou igual/);
  assert.throws(() => stateAt("collision", { mass1: 1, mass2: 1, u1: 1, u2: 2, restitution: 1 }, 0), /alcançar/);
  assert.throws(() => durationFor("unknown", {}), /desconhecido/);
});

