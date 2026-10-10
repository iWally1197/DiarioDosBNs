export function projectileAtTime(time, parameters) {
  const t = Math.max(0, Number(time) || 0);
  const speed = Number(parameters.speed);
  const angle = Number(parameters.angleDegrees) * Math.PI / 180;
  const gravity = Number(parameters.gravity);
  const height = Number(parameters.height);
  const vx = speed * Math.cos(angle);
  const vy = speed * Math.sin(angle);
  return {
    time: t,
    x: vx * t,
    y: height + vy * t - 0.5 * gravity * t * t,
    vx,
    vy
  };
}

export function projectileFlightTime(parameters) {
  const gravity = Number(parameters.gravity);
  if (!(gravity > 0)) throw new RangeError("A gravidade precisa ser maior que zero.");
  const angle = Number(parameters.angleDegrees) * Math.PI / 180;
  const vy = Number(parameters.speed) * Math.sin(angle);
  const height = Math.max(0, Number(parameters.height));
  return (vy + Math.sqrt(vy * vy + 2 * gravity * height)) / gravity;
}

export function projectileMetrics(parameters) {
  const angle = Number(parameters.angleDegrees) * Math.PI / 180;
  const speed = Number(parameters.speed);
  const flightTime = projectileFlightTime(parameters);
  const maxHeight = Math.max(0, Number(parameters.height)) +
    Math.pow(speed * Math.sin(angle), 2) / (2 * Number(parameters.gravity));
  return {
    flightTime,
    range: speed * Math.cos(angle) * flightTime,
    maxHeight
  };
}

export function pendulumStep(state, parameters, dt) {
  const length = Number(parameters.length);
  const gravity = Number(parameters.gravity);
  if (!(length > 0) || !(gravity > 0) || !(dt > 0)) {
    throw new RangeError("Comprimento, gravidade e passo de tempo devem ser positivos.");
  }
  const angularAcceleration = -(gravity / length) * Math.sin(state.theta);
  const theta = state.theta + state.omega * dt + 0.5 * angularAcceleration * dt * dt;
  const nextAngularAcceleration = -(gravity / length) * Math.sin(theta);
  const omega = state.omega + 0.5 * (angularAcceleration + nextAngularAcceleration) * dt;
  return { theta, omega };
}

export function pendulumEnergyPerMass(state, length, gravity) {
  const kinetic = 0.5 * Math.pow(Number(length) * Number(state.omega), 2);
  const potential = Number(gravity) * Number(length) * (1 - Math.cos(Number(state.theta)));
  return { kinetic, potential, total: kinetic + potential };
}
