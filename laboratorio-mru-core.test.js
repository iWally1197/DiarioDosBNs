import test from "node:test";
import assert from "node:assert/strict";
import { crossingTime, meetEvents, mruAt, mruMetrics, sampleTimes, validateExperiment } from "./laboratorio-mru-core.js";

const near = (actual, expected, tolerance = 1e-10) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≠ ${expected}`);

test("x(t) = x0 + vt gives the expected position", () => {
  near(mruAt({ x0: 0, v: 2 }, 5).x, 10);
  near(mruAt({ x0: 5, v: -3 }, 2).x, -1);
});

test("rest has constant position and acceleration is always zero", () => {
  const atStart = mruAt({ x0: -4, v: 0 }, 0);
  const later = mruAt({ x0: -4, v: 0 }, 123.5);
  near(atStart.x, later.x);
  near(later.a, 0);
});

test("signed displacement and nonnegative distance stay distinct", () => {
  const state = mruAt({ x0: 5, v: -3 }, 2);
  near(state.displacement, -6);
  near(state.distance, 6);
  assert.equal(state.direction, "sentido negativo");
});

test("average velocity and average speed use the same endpoint states", () => {
  const result = mruMetrics({ x0: 10, v: -2 }, 1, 4);
  near(result.displacement, -6);
  near(result.distance, 6);
  near(result.averageVelocity, -2);
  near(result.averageSpeed, 2);
  near(result.acceleration, 0);
});

test("photogate crossing time handles direction and unreachable gates", () => {
  near(crossingTime({ x0: 0, v: 2 }, 10), 5);
  near(crossingTime({ x0: 5, v: -3 }, -1), 2);
  assert.equal(crossingTime({ x0: 0, v: 0 }, 3), null);
  assert.equal(crossingTime({ x0: 5, v: 1 }, 0), null);
});

test("meeting times are analytic and restricted to the experiment", () => {
  const carts = [{ id: "a", x0: 0, v: 2 }, { id: "b", x0: 10, v: 0 }];
  const meeting = meetEvents(carts, 8)[0];
  near(meeting.time, 5);
  near(meeting.position, 10);
  assert.equal(meetEvents(carts, 4).length, 0);
  assert.equal(meetEvents([{ id: "a", x0: 0, v: 1 }, { id: "b", x0: 0, v: 1 }], 5)[0].type, "same-trajectory");
});

test("measurement samples include the start and final instant", () => {
  assert.deepEqual(sampleTimes(5, 2), [0, 2, 4, 5]);
});

test("invalid configurations and non-finite values are rejected", () => {
  assert.throws(() => mruAt({ x0: Infinity, v: 2 }, 1), /finito/);
  assert.throws(() => mruAt({ x0: 0, v: 2 }, -1), /negativo/);
  assert.throws(() => sampleTimes(5, 0), /positivo/);
  assert.throws(() => validateExperiment({ duration: 5, sampleInterval: 1, carts: [] }), /um a cinco/);
});

