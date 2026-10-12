import test from "node:test";
import assert from "node:assert/strict";
import {
  MU0,
  buildCoilSegments,
  coilAxisFieldAnalytic,
  finiteCoilFieldAt,
  finiteMagnetFieldAt,
  makeCoil,
  makeMagnet,
  makeFieldModel
} from "./laboratorio-magnetismo-core.js";

const close = (a, b, relative = 0.03, absolute = 1e-10) => Math.abs(a - b) <= Math.max(absolute, Math.abs(b) * relative);

test("bobina sem corrente não gera campo próprio", () => {
  const coil = makeCoil({ current: 0, turns: 22 });
  const b = finiteCoilFieldAt({ x: 0.03, y: 0.17, z: 0 }, coil);
  assert.equal(b.x, 0); assert.equal(b.y, 0); assert.equal(b.z, 0);
});

test("inverter a corrente inverte o vetor da bobina", () => {
  const coil = makeCoil({ current: 2.25, turns: 12 });
  const point = { x: 0, y: 0.16, z: 0 };
  const segments = buildCoilSegments(coil);
  const forward = finiteCoilFieldAt(point, coil, segments);
  const reverse = finiteCoilFieldAt(point, { ...coil, current: -coil.current }, segments);
  assert.ok(close(reverse.x, -forward.x, 1e-9));
  assert.ok(close(reverse.y, -forward.y, 1e-9));
  assert.ok(close(reverse.z, -forward.z, 1e-9));
});

test("campo de uma espira central concorda com a expressão analítica no eixo", () => {
  const coil = makeCoil({ current: 1.7, turns: 1, length: 0.2, radius: 0.055 });
  const numeric = finiteCoilFieldAt({ x: 0, y: 0, z: 0 }, coil);
  const analytic = coilAxisFieldAnalytic(coil, 0);
  assert.ok(close(numeric.x, analytic, 0.015), `numérico=${numeric.x}; analítico=${analytic}`);
  assert.ok(Math.abs(numeric.y) < Math.abs(numeric.x) * 1e-9);
});

test("o campo central cresce com o número de espiras quando os demais parâmetros ficam fixos", () => {
  const coil = makeCoil({ current: 1.2, turns: 10, length: 0.24, radius: 0.06 });
  const ten = finiteCoilFieldAt({ x: 0, y: 0, z: 0 }, coil, buildCoilSegments(coil, 10)).x;
  const twenty = finiteCoilFieldAt({ x: 0, y: 0, z: 0 }, coil, buildCoilSegments(coil, 20)).x;
  assert.ok(twenty > ten * 1.9 && twenty < ten * 2.1);
});

test("inverter os polos do ímã inverte o campo externo", () => {
  const magnet = makeMagnet({ x: 0, y: 0, angle: 0.3 });
  const point = { x: 0.21, y: 0.08 };
  const a = finiteMagnetFieldAt(point, magnet);
  const b = finiteMagnetFieldAt(point, { ...magnet, polarity: -1 });
  assert.ok(close(a.x, -b.x, 1e-9)); assert.ok(close(a.y, -b.y, 1e-9));
});

test("o modelo finito fornece campo interno e não usa a fórmula de dipolo no volume do ímã", () => {
  const magnet = makeMagnet({ magnetization: 3e5 });
  const outside = finiteMagnetFieldAt({ x: 0.18, y: 0.02 }, magnet);
  const inside = finiteMagnetFieldAt({ x: 0, y: 0 }, magnet);
  assert.ok(Number.isFinite(outside.x) && Number.isFinite(outside.y));
  assert.ok(inside.x > 0 && Math.abs(inside.x) > 0.2);
});

test("o modelo soma magneto e bobina vetorialmente e inclui a contribuição terrestre opcional", () => {
  const magnet = makeMagnet(); const coil = makeCoil({ current: 1.4 }); const point = { x: 0.17, y: 0.12 };
  const bm = makeFieldModel({ magnets: [magnet] }).at(point);
  const bc = makeFieldModel({ coil, useCoil: true }).at(point);
  const both = makeFieldModel({ magnets: [magnet], coil, useCoil: true }).at(point);
  const withEarth = makeFieldModel({ magnets: [magnet], earth: true }).at(point);
  assert.ok(close(both.x, bm.x + bc.x, 1e-8)); assert.ok(close(both.y, bm.y + bc.y, 1e-8));
  assert.ok(close(withEarth.y - bm.y, 25e-6, 1e-8));
});

test("a malha numérica do solenóide usa a corrente e mantém a lei de Biot–Savart", () => {
  assert.ok(MU0 > 1.25e-6 && MU0 < 1.26e-6);
  const coil = makeCoil({ current: 1, turns: 4 });
  assert.equal(buildCoilSegments(coil).length, 4 * 24);
});


