import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stateAt } from "./laboratorio-advanced-core.js";

const degrees = (radians) => radians * 180 / Math.PI;
const closeTo = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} deve estar próximo de ${expected}`);

test("reflexão plana conserva o ângulo medido a partir da normal", () => {
  const parameters = { incidenceAngle: 37, mirrorTilt: 0, impactOffset: 0.2, wavelengthNm: 550 };
  const model = stateAt("optics-reflection", parameters, 4);
  closeTo(model.values.angleIncident, 37, 1e-8);
  closeTo(model.values.angleReflected, 37, 1e-8);
  const { incomingDirection: incoming, reflectedDirection: reflected, normal } = model.geometry;
  const incomingNormal = Math.acos(Math.abs(incoming.x * normal.x + incoming.y * normal.y));
  const reflectedNormal = Math.acos(Math.abs(reflected.x * normal.x + reflected.y * normal.y));
  closeTo(incomingNormal, reflectedNormal, 1e-10);
});

test("girar o espelho gira o raio refletido pelo dobro do ângulo", () => {
  const base = stateAt("optics-reflection", { incidenceAngle: 0, mirrorTilt: 0, impactOffset: 0, wavelengthNm: 550 }).geometry;
  const tilted = stateAt("optics-reflection", { incidenceAngle: 0, mirrorTilt: 10, impactOffset: 0, wavelengthNm: 550 }).geometry;
  const directionAngle = (direction) => Math.atan2(direction.y, direction.x);
  const rawDelta = Math.abs(degrees(directionAngle(tilted.reflectedDirection) - directionAngle(base.reflectedDirection))) % 360;
  closeTo(Math.min(rawDelta, 360 - rawDelta), 20, 1e-8);
});

test("lei de Snell, frequência constante e mudança de velocidade e comprimento de onda", () => {
  const values = stateAt("optics-refraction", { incidenceAngle: 35, index1: 1, index2: 1.5, wavelengthNm: 550, impactOffset: 0 }, 2).values;
  closeTo(values.index1 * Math.sin(values.angleIncident * Math.PI / 180), values.index2 * Math.sin(values.angleTransmitted * Math.PI / 180), 1e-10);
  closeTo(values.wavelength2Nm / values.wavelength1Nm, values.index1 / values.index2, 1e-10);
  closeTo(values.speed2 / values.speed1, values.index1 / values.index2, 1e-10);
  closeTo(values.frequencyTHz, 299_792_458 / (550e-9) / 1e12, 1e-8);
});

test("reflexão interna total ocorre apenas acima do ângulo crítico", () => {
  const params = { incidenceAngle: 60, index1: 1.5, index2: 1, wavelengthNm: 500, impactOffset: 0 };
  const model = stateAt("optics-refraction", params, 3);
  assert.equal(model.values.totalInternalReflection, true);
  assert.equal(model.values.angleTransmitted, null);
  assert.equal(model.geometry.rays.at(-1).role.startsWith("refletido"), true);
  const belowCritical = stateAt("optics-refraction", { ...params, incidenceAngle: 40 }, 3);
  assert.equal(belowCritical.values.totalInternalReflection, false);
});

test("equação de espelhos esféricos usa f=R/2 com sinais coerentes", () => {
  const concave = stateAt("optics-concave-mirror", { radius: 2, objectDistance: 3, objectHeight: 0.6, wavelengthNm: 550 }, 1).values;
  closeTo(concave.focalLength, 1);
  closeTo(concave.imageDistance, 1.5);
  closeTo(concave.magnification, -0.5);
  const convex = stateAt("optics-convex-mirror", { radius: 2, objectDistance: 3, objectHeight: 0.6, wavelengthNm: 550 }, 1).values;
  closeTo(convex.focalLength, -1);
  closeTo(convex.imageDistance, -0.75);
  closeTo(convex.magnification, 0.25);
  assert.equal(convex.image, "virtual");
});

test("raios em espelho esférico refletem na superfície com ângulos iguais", () => {
  const geometry = stateAt("optics-concave-mirror", { radius: 2, objectDistance: 3, objectHeight: 0.6, wavelengthNm: 550 }, 0).geometry;
  const incident = geometry.rays[0].points;
  const reflected = geometry.rays[1].points;
  const hit = incident.at(-1);
  const incoming = { x: hit.x - incident[0].x, y: hit.y - incident[0].y };
  const incomingLength = Math.hypot(incoming.x, incoming.y);
  incoming.x /= incomingLength; incoming.y /= incomingLength;
  const outgoing = { x: reflected.at(-1).x - hit.x, y: reflected.at(-1).y - hit.y };
  const outgoingLength = Math.hypot(outgoing.x, outgoing.y);
  outgoing.x /= outgoingLength; outgoing.y /= outgoingLength;
  const normal = { x: hit.x - geometry.center.x, y: hit.y - geometry.center.y };
  const normalLength = Math.hypot(normal.x, normal.y);
  normal.x /= normalLength; normal.y /= normalLength;
  const tangent = { x: -normal.y, y: normal.x };
  closeTo(incoming.x * tangent.x + incoming.y * tangent.y, outgoing.x * tangent.x + outgoing.y * tangent.y, 1e-10);
});

test("comprimento de onda visível fora dos limites e índices inválidos são rejeitados", () => {
  assert.throws(() => stateAt("optics-reflection", { incidenceAngle: 0, mirrorTilt: 0, impactOffset: 0, wavelengthNm: 760 }), /entre 380 nm e 700 nm/);
  assert.throws(() => stateAt("optics-refraction", { incidenceAngle: 30, index1: 0, index2: 1.5, wavelengthNm: 550, impactOffset: 0 }), /maior que zero/);
});

test("modo corpo humano calcula imagem e medidas nos três espelhos", () => {
  const plane = stateAt("optics-reflection", {
    experimentMode: "human", incidenceAngle: 0, mirrorTilt: 0, mirrorX: 2.65, mirrorY: 1.5,
    sourceDistance: 1.8, impactOffset: 0, wavelengthNm: 550, objectDistance: 1.4, objectHeight: 1.6
  }).values;
  closeTo(plane.imageDistance, 1.4);
  closeTo(plane.objectImageSeparation, 2.8);
  closeTo(plane.imageHeight, 1.6);
  assert.equal(plane.imageNature, "virtual");
  assert.equal(plane.orientation, "direita");

  const concave = stateAt("optics-concave-mirror", { experimentMode: "human", radius: 2, objectDistance: 3, objectHeight: 1.7, wavelengthNm: 550 }).values;
  closeTo(concave.imageDistance, 1.5);
  closeTo(concave.imageHeight, 0.85);
  closeTo(concave.objectImageSeparation, 1.5);
  assert.equal(concave.orientation, "invertida");
  assert.equal(concave.imageScale, "reduzida");

  const convex = stateAt("optics-convex-mirror", { experimentMode: "human", radius: 2, objectDistance: 3, objectHeight: 1.7, wavelengthNm: 550 }).values;
  closeTo(convex.imageDistance, -0.75);
  closeTo(convex.imageHeight, 0.425);
  closeTo(convex.objectImageSeparation, 3.75);
  assert.equal(convex.imageNature, "virtual");
  assert.equal(convex.orientation, "direita");
  assert.equal(convex.imageScale, "reduzida");
});

test("lanterna faz as bolinhas seguirem raios refletidos pelas normais locais", () => {
  const examples = [
    ["optics-reflection", { incidenceAngle: 0, mirrorTilt: 0, mirrorX: 2.65, mirrorY: 1.5, sourceDistance: 1.8, impactOffset: 0 }],
    ["optics-concave-mirror", { radius: 2, objectDistance: 3, flashlightHeight: 0.2 }],
    ["optics-convex-mirror", { radius: 2, objectDistance: 3, flashlightHeight: 0.2 }]
  ];
  for (const [id, specific] of examples) {
    const model = stateAt(id, {
      ...specific, experimentMode: "lantern", objectHeight: 0.6, wavelengthNm: 550,
      flashlightAngle: 0, beamOpening: 20, emissionRate: 0.65, visualSpeed: 1,
      beamMode: "divergent", showParticles: true, beamIntensity: 0.4
    }, 12);
    const geometry = model.geometry;
    assert.ok(geometry.flashlight.actualRayCount >= 3, id + " deve encontrar o espelho com vários raios");
    assert.ok(geometry.particlePaths.length >= 3, id + " deve ter trajetórias animáveis");
    assert.equal(geometry.flashlight.intensity, 0.4);
    assert.equal(geometry.flashlight.showImage, true);
    assert.ok(geometry.image, id + " deve calcular a imagem da fonte independente do corpo humano");
    for (const ray of geometry.rays.filter((item) => item.role === "raio incidente")) {
      const hit = ray.interaction.hit;
      const normal = ray.interaction.normal;
      const incoming = ray.interaction.incomingDirection;
      const outgoing = ray.interaction.reflectedDirection;
      closeTo(Math.hypot(outgoing.x, outgoing.y), 1, 1e-9);
      const angleIn = Math.acos(Math.abs(incoming.x * normal.x + incoming.y * normal.y));
      const angleOut = Math.acos(Math.abs(outgoing.x * normal.x + outgoing.y * normal.y));
      closeTo(angleIn, angleOut, 1e-9);
      assert.ok(Number.isFinite(hit.x) && Number.isFinite(hit.y));
    }
  }
});

test("feixe colimado mantém direções paralelas e modo divergente parte da lanterna", () => {
  const base = { radius: 2, objectDistance: 3, flashlightHeight: 0.2, experimentMode: "lantern", objectHeight: 0.6, wavelengthNm: 550, flashlightAngle: 0, beamOpening: 24, emissionRate: 0.65, visualSpeed: 1 };
  const parallel = stateAt("optics-concave-mirror", { ...base, beamMode: "parallel" }).geometry;
  const incidentParallel = parallel.rays.filter((ray) => ray.role === "raio incidente");
  assert.ok(incidentParallel.length >= 3);
  for (const ray of incidentParallel.slice(1)) {
    closeTo(ray.interaction.incomingDirection.x, incidentParallel[0].interaction.incomingDirection.x);
    closeTo(ray.interaction.incomingDirection.y, incidentParallel[0].interaction.incomingDirection.y);
  }
  assert.equal(parallel.flashlight.parallel, true);

  const divergent = stateAt("optics-concave-mirror", { ...base, beamMode: "divergent" }).geometry;
  const incidentDivergent = divergent.rays.filter((ray) => ray.role === "raio incidente");
  assert.ok(incidentDivergent.length >= 3);
  assert.ok(incidentDivergent.some((ray) => Math.abs(ray.interaction.incomingDirection.y - incidentDivergent[0].interaction.incomingDirection.y) > 1e-3));
  assert.equal(divergent.flashlight.parallel, false);
});

test("página expõe seletor de modos e controles para luz e corpo", () => {
  const html = readFileSync(new URL("./laboratorio-experimento.html", import.meta.url), "utf8");
  const workspace = readFileSync(new URL("./laboratorio-workspace.js", import.meta.url), "utf8");
  assert.match(html, /data-mirror-mode="human"/);
  assert.match(html, /data-mirror-mode="lantern"/);
  assert.match(html, /mirror-show-image/);
  assert.match(html, /mirror-show-lantern-image/);
  assert.match(html, /mirror-beam-mode/);
  assert.match(workspace, /function setMirrorMode/);
  assert.match(workspace, /function controlsForExperiment/);
  assert.match(workspace, /beamIntensity/);
  assert.match(workspace, /body-height/);
  assert.match(workspace, /function setParameter/);
});

