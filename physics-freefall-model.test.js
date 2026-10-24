import test from "node:test";
import assert from "node:assert/strict";
import { freeFallAtTime, freeFallImpactTime } from "./physics-freefall-model.js";

test("tempo de impacto de uma queda de 20 m usa a altura até o solo", () => {
  const expected = Math.sqrt((2 * 20) / 9.81);
  assert.ok(Math.abs(freeFallImpactTime({ height: 20, gravity: 9.81 }) - expected) < 1e-12);
});

test("no impacto, o centro do objeto chega à altura do raio acima do chão", () => {
  const height = 20, gravity = 9.81, t = freeFallImpactTime({ height, gravity });
  const result = freeFallAtTime(t, { height, gravity });
  assert.equal(result.height, 0);
  assert.equal(result.displacement, height);
  assert.ok(Math.abs(result.velocity - gravity * t) < 1e-12);
});

test("massas diferentes compartilham a mesma queda no modelo sem resistência do ar", () => {
  const parameters = { height: 13.5, gravity: 9.81 };
  const first = freeFallAtTime(0.7, { ...parameters, mass: 0.2 });
  const second = freeFallAtTime(0.7, { ...parameters, mass: 12 });
  assert.deepEqual(first, second);
});

test("o modelo rejeita valores físicos inválidos", () => {
  assert.throws(() => freeFallImpactTime({ height: 0, gravity: 9.81 }), RangeError);
  assert.throws(() => freeFallAtTime(-1, { height: 4, gravity: 9.81 }), RangeError);
});
