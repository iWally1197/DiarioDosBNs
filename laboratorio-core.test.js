import test from "node:test";
import assert from "node:assert/strict";
import {
  projectileAtTime,
  projectileFlightTime,
  projectileMetrics,
  pendulumStep,
  pendulumEnergyPerMass
} from "./laboratorio-core.js";

const closeTo = (actual, expected, tolerance = 1e-9) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, actual + " is not within " + tolerance + " of " + expected);

test("projectile trajectory matches the analytic equations", () => {
  const parameters = { speed: 20, angleDegrees: 30, height: 0, gravity: 10 };
  const point = projectileAtTime(1, parameters);
  closeTo(point.x, 10 * Math.sqrt(3));
  closeTo(point.y, 5);
  closeTo(projectileFlightTime(parameters), 2);
  const metrics = projectileMetrics(parameters);
  closeTo(metrics.range, 20 * Math.sqrt(3));
  closeTo(metrics.maxHeight, 5);
});

test("projectile launched above ground has the correct positive flight root", () => {
  const parameters = { speed: 8, angleDegrees: 45, height: 3, gravity: 9.81 };
  const flightTime = projectileFlightTime(parameters);
  assert.ok(flightTime > 0);
  closeTo(projectileAtTime(flightTime, parameters).y, 0, 1e-10);
});

test("zero-angle pendulum equilibrium remains stationary", () => {
  const next = pendulumStep({ theta: 0, omega: 0 }, { length: 1, gravity: 9.81 }, 1 / 240);
  closeTo(next.theta, 0);
  closeTo(next.omega, 0);
});

test("velocity-Verlet pendulum integration conserves energy within 0.1% at high amplitude", () => {
  const parameters = { length: 1.2, gravity: 9.81 };
  const dt = 1 / 480;
  let state = { theta: 75 * Math.PI / 180, omega: 0 };
  const initialEnergy = pendulumEnergyPerMass(state, parameters.length, parameters.gravity).total;
  let maxRelativeError = 0;
  for (let i = 0; i < 10 / dt; i += 1) {
    state = pendulumStep(state, parameters, dt);
    const energy = pendulumEnergyPerMass(state, parameters.length, parameters.gravity).total;
    maxRelativeError = Math.max(maxRelativeError, Math.abs(energy - initialEnergy) / initialEnergy);
  }
  assert.ok(maxRelativeError < 0.001, "relative energy deviation was " + maxRelativeError);
});

test("small-angle pendulum period approaches 2π√(L/g)", () => {
  const parameters = { length: 1.2, gravity: 9.81 };
  const dt = 1 / 480;
  let state = { theta: 0.1, omega: 0 };
  let previousTheta = state.theta;
  let crossingTime = 0;
  for (let i = 1; i < 5000; i += 1) {
    state = pendulumStep(state, parameters, dt);
    if (state.theta <= 0) {
      const fraction = previousTheta / (previousTheta - state.theta);
      crossingTime = (i - 1 + fraction) * dt;
      break;
    }
    previousTheta = state.theta;
  }
  const simulatedPeriod = 4 * crossingTime;
  const smallAnglePeriod = 2 * Math.PI * Math.sqrt(parameters.length / parameters.gravity);
  assert.ok(Math.abs(simulatedPeriod - smallAnglePeriod) / smallAnglePeriod < 0.002);
});

test("invalid pendulum parameters are rejected", () => {
  assert.throws(() => pendulumStep({ theta: 0, omega: 0 }, { length: 0, gravity: 9.81 }, 1 / 240), RangeError);
});
