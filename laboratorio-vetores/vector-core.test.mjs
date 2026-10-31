import test from "node:test";
import assert from "node:assert/strict";
import {
  accelerationFromForce, add, angleBetween, cross, dot, magnitude, multiply,
  nearlyEqual, positionAtTime, project3D, projectOnto, sum, torque, unit,
  vector3, velocityAtTime
} from "./vector-core.mjs";

test("1 — módulo de (3, 4) é 5", () => {
  assert.equal(magnitude({ x: 3, y: 4 }), 5);
});

test("2 — soma calcula componentes e módulo da resultante", () => {
  const result = add({ x: 3, y: 4 }, { x: 2, y: -1 });
  assert.deepEqual(result, { x: 5, y: 3, z: 0 });
  assert.ok(nearlyEqual(magnitude(result), Math.sqrt(34)));
});

test("3 — vetores opostos têm resultante nula e direção indefinida", () => {
  const result = add({ x: 3, y: 4 }, { x: -3, y: -4 });
  assert.ok(nearlyEqual(magnitude(result), 0));
  assert.equal(unit(result), null);
  assert.equal(angleBetween(result, { x: 1, y: 0 }), null);
});

test("4 — produto escalar de perpendiculares é zero e o ângulo é 90°", () => {
  const a = { x: 1, y: 0 }, b = { x: 0, y: 1 };
  assert.equal(dot(a, b), 0);
  assert.ok(nearlyEqual(angleBetween(a, b), Math.PI / 2));
});

test("5 — produto vetorial segue a regra da mão direita e troca o sinal", () => {
  assert.deepEqual(cross({ x: 1 }, { y: 1 }), { x: 0, y: 0, z: 1 });
  assert.deepEqual(cross({ y: 1 }, { x: 1 }), { x: 0, y: 0, z: -1 });
});

test("6 — segunda lei de Newton: F=(6,8) N, m=2 kg", () => {
  assert.deepEqual(accelerationFromForce({ x: 6, y: 8 }, 2), { x: 3, y: 4, z: 0 });
});

test("7 — torque: r=(2,0,0) m, F=(0,5,0) N", () => {
  assert.deepEqual(torque({ x: 2 }, { y: 5 }), { x: 0, y: 0, z: 10 });
});

test("8 — projeção visual 3D não modifica as componentes físicas", () => {
  const vector = vector3({ x: 3, y: -2, z: 5 });
  const before = { ...vector };
  const viewA = project3D(vector, { yaw: 0, pitch: 0 });
  const viewB = project3D(vector, { yaw: Math.PI / 3, pitch: Math.PI / 5 });
  assert.notDeepEqual(viewA, viewB);
  assert.deepEqual(vector, before);
  assert.ok(nearlyEqual(magnitude(vector), Math.sqrt(38), 1e-12));
});

test("9 — propriedades algébricas comutativa e distributiva", () => {
  const a = { x: 1.2, y: -4, z: 0.5 };
  const b = { x: -2, y: 3.5, z: 7 };
  const c = { x: 0.25, y: 1, z: -3 };
  assert.deepEqual(add(a, b), add(b, a));
  assert.deepEqual(
    multiply(add(a, b), 2.5),
    add(multiply(a, 2.5), multiply(b, 2.5))
  );
  assert.deepEqual(sum([a, b, c]), add(add(a, b), c));
});

test("10 — casos extremos bloqueiam NaN, divisões por zero e massa inválida", () => {
  assert.throws(() => vector3({ x: Number.NaN }), /finitos/);
  assert.throws(() => accelerationFromForce({ x: 1 }, 0), /positiva/);
  assert.equal(projectOnto({ x: 1, y: 2 }, { x: 0, y: 0 }), null);
  assert.equal(angleBetween({ x: 1 }, { x: -1 }), Math.PI);
});

test("cinemática vetorial calcula posição e velocidade com aceleração constante", () => {
  assert.deepEqual(
    positionAtTime({ x: 1 }, { x: 2 }, { x: 3 }, 2),
    { x: 11, y: 0, z: 0 }
  );
  assert.deepEqual(velocityAtTime({ x: 2 }, { x: 3 }, 2), { x: 8, y: 0, z: 0 });
});

test("produto vetorial 2D retorna o componente perpendicular ao plano xy", () => {
  const result = cross({ x: 4, y: 3 }, { x: -1, y: 2 });
  assert.ok(nearlyEqual(result.z, 11));
  assert.ok(nearlyEqual(result.x, 0));
  assert.ok(nearlyEqual(result.y, 0));
});
