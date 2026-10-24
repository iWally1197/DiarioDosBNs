import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { opticalModelFor, opticalViewFor } from "./laboratorio-optica-core.js";

const closeTo = (actual, expected, tolerance = 1e-8) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} deve estar próximo de ${expected} (±${tolerance})`);
const wave = { wavelengthNm: 550 };
const sphere = (id, overrides = {}) => opticalModelFor(id, {
  experimentMode: "human", radius: 1, apertureRatio: 0.6,
  objectDistance: 1.5, objectHeight: 0.2, ...wave, ...overrides
});
const reflectedInteractions = (model) => {
  const traced = model.geometry.flashlight?.interactions;
  if (traced?.length) return traced;
  return model.geometry.rays.filter((ray) => ray.role === "refletido" && ray.interaction).map((ray) => ray.interaction);
};
const cross = (a, b) => a.x * b.y - a.y * b.x;
const dot = (a, b) => a.x * b.x + a.y * b.y;

test("1 — espelho plano forma imagem virtual simétrica e com di = -do", () => {
  const model = opticalModelFor("optics-reflection", {
    experimentMode: "human", incidenceAngle: 0, mirrorTilt: 0,
    mirrorX: 2.65, mirrorY: 1.5, sourceDistance: 1.8,
    impactOffset: 0, objectDistance: 1, objectHeight: 1, ...wave
  });
  closeTo(model.values.imageDistance, -1);
  closeTo(model.values.magnification, 1);
  closeTo(model.values.imageHeight, 1);
  closeTo(model.values.objectImageSeparation, 2);
  closeTo(model.values.imageX, 2 * model.geometry.center.x - model.values.objectX);
  closeTo(model.values.imageY, model.values.objectY);
  assert.equal(model.values.imageNature, "virtual");
  assert.equal(model.values.orientation, "direita");
});

test("2 — espelho côncavo além do centro aplica f=R/2 e a equação paraxial", () => {
  const model = sphere("optics-concave-mirror", { radius: 1, objectDistance: 1.5, concaveModel: "paraxial" });
  closeTo(model.values.focalLength, 0.5);
  closeTo(model.values.imageDistance, 0.75);
  closeTo(model.values.magnification, -0.5);
  closeTo(model.values.imageHeight, -0.1);
  assert.equal(model.values.imageNature, "real");
  assert.equal(model.values.orientation, "invertida");
});

test("3 — objeto côncavo dentro do foco gera imagem virtual direita e ampliada", () => {
  const model = sphere("optics-concave-mirror", { radius: 1, objectDistance: 0.25, concaveModel: "paraxial" });
  closeTo(model.values.focalLength, 0.5);
  closeTo(model.values.imageDistance, -0.5);
  closeTo(model.values.magnification, 2);
  closeTo(model.values.imageHeight, 0.4);
  assert.equal(model.values.imageNature, "virtual");
  assert.equal(model.values.orientation, "direita");
  assert.equal(model.values.imageScale, "ampliada");
});

test("4 — espelho convexo mantém R e f negativos e imagem virtual reduzida", () => {
  const model = sphere("optics-convex-mirror", { radius: 1, objectDistance: 1 });
  closeTo(model.values.radius, -1);
  closeTo(model.values.focalLength, -0.5);
  closeTo(model.values.imageDistance, -1 / 3);
  closeTo(model.values.magnification, 1 / 3);
  assert.equal(model.values.imageNature, "virtual");
  assert.equal(model.values.orientation, "direita");
  assert.equal(model.values.imageScale, "reduzida");
});

test("5 — parábola focaliza feixe axial e colima fonte colocada no foco", () => {
  const parameters = {
    experimentMode: "lantern", beamMode: "parallel", focalLength: 0.5,
    apertureRatio: 0.6, objectDistance: 3, flashlightHeight: 0,
    objectHeight: 0, beamOpening: 20, flashlightAngle: 0, ...wave
  };
  const parallel = opticalModelFor("optics-concave-parabolic-mirror", parameters);
  closeTo(parallel.geometry.flashlight.focus.x, -0.5);
  closeTo(parallel.geometry.flashlight.focus.y, 0);
  assert.ok(parallel.geometry.flashlight.interactions.length >= 5);
  for (const interaction of parallel.geometry.flashlight.interactions) {
    const toFocus = { x: -0.5 - interaction.hit.x, y: -interaction.hit.y };
    closeTo(cross(interaction.reflectedDirection, toFocus), 0, 1e-8);
  }
  const fromFocus = opticalModelFor("optics-concave-parabolic-mirror", { ...parameters, beamMode: "focus" });
  assert.equal(fromFocus.geometry.flashlight.focusSource, true);
  for (const interaction of fromFocus.geometry.flashlight.interactions) {
    closeTo(interaction.reflectedDirection.y, 0, 1e-8);
    assert.ok(interaction.reflectedDirection.x < 0);
  }
});

test("6 — toda reflexão usa a normal local e conserva os ângulos", () => {
  const examples = [
    ["optics-reflection", {
      experimentMode: "lantern", beamMode: "divergent", incidenceAngle: 0,
      sourceDistance: 1.8, mirrorX: 2.65, mirrorY: 1.5, mirrorTilt: 0,
      impactOffset: 0, flashlightHeight: 0.2, beamOpening: 24, ...wave
    }],
    ["optics-concave-mirror", { ...wave, experimentMode: "lantern", beamMode: "divergent", radius: 1, apertureRatio: 0.55, objectDistance: 1.5, objectHeight: 0.3, flashlightHeight: 0.2 }],
    ["optics-convex-mirror", { ...wave, experimentMode: "lantern", beamMode: "divergent", radius: 1, objectDistance: 1.5, objectHeight: 0.3, flashlightHeight: 0.2 }],
    ["optics-concave-parabolic-mirror", { ...wave, experimentMode: "lantern", beamMode: "parallel", focalLength: 0.5, apertureRatio: 0.6, objectDistance: 3, objectHeight: 0, flashlightHeight: 0 }]
  ];
  for (const [id, parameters] of examples) {
    const interactions = reflectedInteractions(opticalModelFor(id, parameters));
    assert.ok(interactions.length >= 3, `${id}: faltam raios com colisão`);
    for (const item of interactions) {
      const { incomingDirection: d, normal: n, reflectedDirection: r } = item;
      const expected = { x: d.x - 2 * dot(d, n) * n.x, y: d.y - 2 * dot(d, n) * n.y };
      closeTo(r.x, expected.x, 1e-10);
      closeTo(r.y, expected.y, 1e-10);
      closeTo(Math.acos(Math.min(1, Math.abs(dot(d, n)))), Math.acos(Math.min(1, Math.abs(dot(r, n)))), 1e-8);
    }
  }
});

test("7 — abertura esférica ampla mostra aberração sem forçar o foco paraxial", () => {
  const model = opticalModelFor("optics-concave-mirror", {
    experimentMode: "lantern", beamMode: "parallel", radius: 1,
    apertureRatio: 0.8, objectDistance: 3, objectHeight: 0,
    flashlightHeight: 0, concaveModel: "exact", ...wave
  });
  assert.equal(model.values.rayModel, "Traçado exato");
  assert.ok(model.geometry.exactFocus);
  assert.ok(Math.abs(model.geometry.exactFocus.point.x + model.values.focalLength) > 1e-3);
  assert.ok(model.values.exactImageBlurRadius > 0);
});

test("8 — foco no infinito, limites e coordenadas inválidas são tratados com segurança", () => {
  const atFocus = sphere("optics-concave-mirror", { radius: 1, objectDistance: 0.5, concaveModel: "paraxial" });
  assert.equal(atFocus.values.imageDistance, Infinity);
  assert.equal(atFocus.geometry.image, null);
  assert.equal(atFocus.values.imageX, null);
  const convex = sphere("optics-convex-mirror", { radius: 1, objectDistance: 1 });
  assert.equal(convex.values.imageNature, "virtual");
  const assertNoNaN = (value, path = "modelo", seen = new Set()) => {
    if (typeof value === "number") assert.ok(!Number.isNaN(value), `NaN em ${path}`);
    if (!value || typeof value !== "object" || seen.has(value)) return;
    seen.add(value);
    for (const [key, child] of Object.entries(value)) assertNoNaN(child, `${path}.${key}`, seen);
  };
  for (const model of [atFocus, convex]) {
    assertNoNaN(model.values);
    assertNoNaN(model.geometry);
    for (const ray of model.geometry.rays) for (const point of ray.points) {
      assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
    }
  }
  assert.throws(() => opticalModelFor("optics-concave-parabolic-mirror", {
    focalLength: 0, apertureRatio: 0.5, objectDistance: 3, objectHeight: 0, ...wave
  }), RangeError);
});

test("lei de Snell e reflexão interna total continuam corretas", () => {
  const refracted = opticalModelFor("optics-refraction", { incidenceAngle: 35, index1: 1, index2: 1.5, impactOffset: 0, ...wave });
  closeTo(refracted.values.index1 * Math.sin(refracted.values.angleIncident * Math.PI / 180),
    refracted.values.index2 * Math.sin(refracted.values.angleTransmitted * Math.PI / 180), 1e-10);
  const total = opticalModelFor("optics-refraction", { incidenceAngle: 60, index1: 1.5, index2: 1, impactOffset: 0, ...wave });
  assert.equal(total.values.totalInternalReflection, true);
  assert.equal(total.values.angleTransmitted, null);
});

test("zoom e tamanho da tela não mudam as coordenadas físicas", () => {
  const geometry = sphere("optics-concave-mirror").geometry;
  const point = { x: -0.5, y: 0 };
  for (const [width, height] of [[320, 240], [768, 1024], [1440, 900]]) {
    const view = opticalViewFor(geometry.bounds, width, height);
    const roundTrip = view.toWorld(view.toScreen(point));
    closeTo(roundTrip.x, point.x, 1e-10);
    closeTo(roundTrip.y, point.y, 1e-10);
  }
});

test("página expõe quatro superfícies, modos didáticos e controles de foco e visualização", () => {
  const html = readFileSync(new URL("./laboratorio-experimento.html", import.meta.url), "utf8");
  const workspace = readFileSync(new URL("./laboratorio-workspace.js", import.meta.url), "utf8");
  for (const id of ["optics-reflection", "optics-concave-mirror", "optics-convex-mirror", "optics-concave-parabolic-mirror"]) assert.match(readFileSync(new URL("./laboratorio-espelhos.html", import.meta.url), "utf8"), new RegExp(id));
  assert.match(html, /mirror-didactic-mode/);
  assert.match(html, /value="focus"/);
  assert.match(html, /mirror-show-grid/);
  assert.match(html, /mirror-show-labels/);
  assert.match(html, /mirror-high-contrast/);
  assert.match(html, /mirror-reduced-motion/);
  assert.match(html, /mirror-keyboard-hint/);
  assert.match(html, /mirror-comparison-spherical/);
  assert.match(html, /mirror-comparison-parabolic/);
  assert.match(workspace, /function drawMirrorComparison/);
  assert.match(workspace, /canvas.addEventListener\("keydown"/);
  assert.match(workspace, /mirror-comparison-toggle/);
  assert.match(workspace, /function controlsForExperiment/);
  assert.match(workspace, /data-optics-level/);
});
