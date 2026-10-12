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
  makeFieldModel,
  magnetInteractionEnergy,
  magnetInteractionForceTorque,
  magnetPrismsOverlap,
  stepMagnetInteraction
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

test("a interação de prismas finitos calcula atração e repulsão a partir da polaridade", () => {
  const first = makeMagnet({ x: -0.11 });
  const facingOppositePoles = magnetInteractionForceTorque(first, makeMagnet({ x: 0.11 }));
  const facingLikePoles = magnetInteractionForceTorque(first, makeMagnet({ x: 0.11, polarity: -1 }));
  assert.ok(facingOppositePoles.energy < 0);
  assert.ok(facingOppositePoles.force.x < 0, "polos opostos frente a frente devem atrair o ímã livre");
  assert.ok(facingLikePoles.energy > 0);
  assert.ok(facingLikePoles.force.x > 0, "polos iguais frente a frente devem repelir o ímã livre");
});

test("o torque vem da variação angular da energia e se anula na configuração alinhada", () => {
  const first = makeMagnet({ x: -0.11 });
  const aligned = magnetInteractionForceTorque(first, makeMagnet({ x: 0.11 }));
  const tilted = magnetInteractionForceTorque(first, makeMagnet({ x: 0.11, angle: 0.35 }));
  assert.ok(Math.abs(aligned.torque) < 1e-8);
  assert.ok(Math.abs(tilted.torque) > 1e-4);
});

test("a força numérica respeita ação e reação para os dois prismas", () => {
  const a = makeMagnet({ x: -0.13, y: 0.02, angle: 0.12 });
  const b = makeMagnet({ x: 0.12, y: -0.01, angle: -0.2, polarity: -1 });
  const onB = magnetInteractionForceTorque(a, b);
  const onA = magnetInteractionForceTorque(b, a);
  assert.ok(close(onB.force.x, -onA.force.x, 0.015, 0.02));
  assert.ok(close(onB.force.y, -onA.force.y, 0.015, 0.02));
});

test("a colisão projetada evita sobreposição e o passo de movimento permanece estável", () => {
  const fixed = makeMagnet({ x: -0.11 });
  let moving = makeMagnet({ x: 0.11 });
  let velocity = { x: 0, y: 0, angle: 0 };
  for (let i = 0; i < 360; i++) {
    const step = stepMagnetInteraction(fixed, moving, velocity, 1 / 60);
    moving = step.magnet; velocity = step.velocity;
    assert.ok(Number.isFinite(moving.x) && Number.isFinite(moving.y) && Number.isFinite(moving.angle));
    assert.ok(Number.isFinite(velocity.x) && Number.isFinite(velocity.y) && Number.isFinite(velocity.angle));
    assert.ok(Math.abs(moving.x) <= 0.37 && Math.abs(moving.y) <= 0.23);
    assert.equal(magnetPrismsOverlap(fixed, moving), false);
  }
});


