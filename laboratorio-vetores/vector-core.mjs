export const ZERO_TOLERANCE = 1e-10;

export function vector3(value = {}) {
  const out = {
    x: Number(value.x ?? 0),
    y: Number(value.y ?? 0),
    z: Number(value.z ?? 0)
  };
  if (!Number.isFinite(out.x) || !Number.isFinite(out.y) || !Number.isFinite(out.z)) {
    throw new TypeError("As componentes do vetor devem ser números finitos.");
  }
  return out;
}

export function add(a, b) {
  a = vector3(a); b = vector3(b);
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function subtract(a, b) {
  a = vector3(a); b = vector3(b);
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function multiply(a, scalar) {
  a = vector3(a); scalar = Number(scalar);
  if (!Number.isFinite(scalar)) throw new TypeError("O escalar deve ser finito.");
  return { x: a.x * scalar, y: a.y * scalar, z: a.z * scalar };
}

export function dot(a, b) {
  a = vector3(a); b = vector3(b);
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function cross(a, b) {
  a = vector3(a); b = vector3(b);
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

export function magnitude(a) {
  a = vector3(a);
  return Math.hypot(a.x, a.y, a.z);
}

export function unit(a, tolerance = ZERO_TOLERANCE) {
  a = vector3(a);
  const length = magnitude(a);
  return length <= tolerance ? null : multiply(a, 1 / length);
}

export function angleBetween(a, b, tolerance = ZERO_TOLERANCE) {
  const ma = magnitude(a), mb = magnitude(b);
  if (ma <= tolerance || mb <= tolerance) return null;
  const cosine = Math.max(-1, Math.min(1, dot(a, b) / (ma * mb)));
  return Math.acos(cosine);
}

export function projectOnto(a, b, tolerance = ZERO_TOLERANCE) {
  const denominator = dot(b, b);
  if (denominator <= tolerance * tolerance) return null;
  const coefficient = dot(a, b) / denominator;
  const vector = multiply(b, coefficient);
  return {
    vector,
    scalar: dot(a, b) / magnitude(b),
    perpendicular: subtract(a, vector)
  };
}

export function sum(vectors) {
  return vectors.reduce((result, item) => add(result, item), vector3());
}

export function torque(position, force, pivot = vector3()) {
  return cross(subtract(position, pivot), force);
}

export function accelerationFromForce(force, mass) {
  mass = Number(mass);
  if (!(mass > 0) || !Number.isFinite(mass)) {
    throw new RangeError("A massa deve ser positiva e finita.");
  }
  return multiply(force, 1 / mass);
}

export function positionAtTime(r0, v0, acceleration, time) {
  time = Number(time);
  if (!Number.isFinite(time)) throw new TypeError("O tempo deve ser finito.");
  r0 = vector3(r0); v0 = vector3(v0); acceleration = vector3(acceleration);
  return add(add(r0, multiply(v0, time)), multiply(acceleration, 0.5 * time * time));
}

export function velocityAtTime(v0, acceleration, time) {
  time = Number(time);
  if (!Number.isFinite(time)) throw new TypeError("O tempo deve ser finito.");
  return add(v0, multiply(acceleration, time));
}

export function relativeVelocity(aOverB, bOverC) {
  return add(aOverB, bOverC);
}

export function project3D(point, camera = {}) {
  const p = vector3(point);
  const yaw = Number(camera.yaw ?? -Math.PI / 4);
  const pitch = Number(camera.pitch ?? Math.PI / 6);
  if (!Number.isFinite(yaw) || !Number.isFinite(pitch)) {
    throw new TypeError("A orientação da câmera deve ser finita.");
  }
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  return {
    x: cy * p.x - sy * p.y,
    y: sy * sp * p.x + cy * sp * p.y + cp * p.z,
    depth: -sy * cp * p.x + cy * cp * p.y - sp * p.z
  };
}

export function nearlyEqual(a, b, tolerance = ZERO_TOLERANCE) {
  return Math.abs(Number(a) - Number(b)) <= tolerance;
}
