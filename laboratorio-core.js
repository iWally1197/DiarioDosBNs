function finite(value, name) {
  const result = Number(value);
  if (!Number.isFinite(result)) throw new RangeError(`${name} deve ser um número finito.`);
  return result;
}

function nonNegative(value, name) {
  const result = finite(value, name);
  if (result < 0) throw new RangeError(`${name} não pode ser negativa.`);
  return result;
}

function positive(value, name) {
  const result = finite(value, name);
  if (!(result > 0)) throw new RangeError(`${name} deve ser maior que zero.`);
  return result;
}

export function projectileAtTime(time, parameters) {
  const t = Math.max(0, finite(time, "Tempo"));
  const speed = nonNegative(parameters.speed, "Velocidade inicial");
  const angle = finite(parameters.angleDegrees, "Ângulo de lançamento") * Math.PI / 180;
  const gravity = positive(parameters.gravity, "Gravidade");
  const height = nonNegative(parameters.height, "Altura inicial");
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
  const gravity = positive(parameters.gravity, "Gravidade");
  const angle = finite(parameters.angleDegrees, "Ângulo de lançamento") * Math.PI / 180;
  const vy = nonNegative(parameters.speed, "Velocidade inicial") * Math.sin(angle);
  const height = nonNegative(parameters.height, "Altura inicial");
  return (vy + Math.sqrt(vy * vy + 2 * gravity * height)) / gravity;
}

export function projectileMetrics(parameters) {
  const angle = finite(parameters.angleDegrees, "Ângulo de lançamento") * Math.PI / 180;
  const speed = nonNegative(parameters.speed, "Velocidade inicial");
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
  const length = positive(parameters.length, "Comprimento");
  const gravity = positive(parameters.gravity, "Gravidade");
  const step = positive(dt, "Passo de tempo");
  const theta0 = finite(state.theta, "Ângulo");
  const omega0 = finite(state.omega, "Velocidade angular");
  if (!(length > 0) || !(gravity > 0) || !(step > 0)) {
    throw new RangeError("Comprimento, gravidade e passo de tempo devem ser positivos.");
  }
  const angularAcceleration = -(gravity / length) * Math.sin(theta0);
  const theta = theta0 + omega0 * step + 0.5 * angularAcceleration * step * step;
  const nextAngularAcceleration = -(gravity / length) * Math.sin(theta);
  const omega = omega0 + 0.5 * (angularAcceleration + nextAngularAcceleration) * step;
  return { theta, omega };
}

export function pendulumEnergyPerMass(state, length, gravity) {
  const normalizedLength = positive(length, "Comprimento");
  const normalizedGravity = positive(gravity, "Gravidade");
  const theta = finite(state.theta, "Ângulo");
  const omega = finite(state.omega, "Velocidade angular");
  const kinetic = 0.5 * Math.pow(normalizedLength * omega, 2);
  const potential = normalizedGravity * normalizedLength * (1 - Math.cos(theta));
  return { kinetic, potential, total: kinetic + potential };
}


