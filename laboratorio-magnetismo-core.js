export const MU0 = 4 * Math.PI * 1e-7;
export const MAGNET_SCENE_LIMIT_M = 100;
const MU0_OVER_4PI = 1e-7;
const MAGNET_QUADRATURE = 8;
const INTERACTION_QUADRATURE = 4;
const INTERACTION_SOFTENING_M = 0.004;
const COIL_SEGMENTS_PER_TURN = 24;
const WIRE_CORE_RADIUS_M = 0.0025;

const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
const rotate = (x, y, angle) => ({ x: x * Math.cos(angle) - y * Math.sin(angle), y: x * Math.sin(angle) + y * Math.cos(angle) });

export function makeMagnet(overrides = {}) {
  return {
    x: 0, y: 0, angle: 0, polarity: 1, magnetization: 2.5e5,
    length: 0.12, height: 0.045, depth: 0.045,
    ...overrides,
    polarity: Number(overrides.polarity) < 0 ? -1 : 1
  };
}

export function makeCoil(overrides = {}) {
  return {
    x: 0, y: 0, angle: 0, current: 1.5, turns: 18,
    length: 0.24, radius: 0.06, core: false,
    ...overrides,
    current: clamp(overrides.current ?? 1.5, -5, 5),
    turns: Math.round(clamp(overrides.turns ?? 18, 1, 50)),
    length: clamp(overrides.length ?? 0.24, 0.08, 0.42),
    radius: clamp(overrides.radius ?? 0.06, 0.025, 0.12)
  };
}

function rotateVectorToLocal(x, y, angle) {
  return rotate(x, y, -angle);
}

/**
 * Field outside a uniformly magnetized rectangular prism, using its bound
 * magnetic surface charge on the two end faces. The effective pole density is
 * a mathematical representation of magnetization, not magnetic monopoles.
 * This 3-D surface integral is sampled numerically and projected onto z=0.
 */
export function finiteMagnetFieldAt(point, inputMagnet) {
  const magnet = makeMagnet(inputMagnet);
  const local = rotateVectorToLocal(point.x - magnet.x, point.y - magnet.y, magnet.angle);
  let bx = 0, by = 0;
  const n = MAGNET_QUADRATURE;
  const dy = magnet.height / n;
  const dz = magnet.depth / n;
  const area = dy * dz;
  const soft2 = 0.00035 ** 2;
  for (const end of [-1, 1]) {
    const pole = end * magnet.polarity * magnet.magnetization * area;
    const xFace = end * magnet.length / 2;
    for (let iy = 0; iy < n; iy++) {
      const py = -magnet.height / 2 + (iy + 0.5) * dy;
      for (let iz = 0; iz < n; iz++) {
        const pz = -magnet.depth / 2 + (iz + 0.5) * dz;
        const rx = local.x - xFace;
        const ry = local.y - py;
        const rz = -pz;
        const r2 = rx * rx + ry * ry + rz * rz + soft2;
        const scale = MU0_OVER_4PI * pole / (r2 * Math.sqrt(r2));
        bx += scale * rx;
        by += scale * ry;
      }
    }
  }
  const inside = Math.abs(local.x) < magnet.length / 2 && Math.abs(local.y) < magnet.height / 2;
  if (inside) bx += MU0 * magnet.polarity * magnet.magnetization;
  const world = rotate(bx, by, magnet.angle);
  return { x: world.x, y: world.y, z: 0 };
}

/** Build straight-segment Biot–Savart elements for a finite set of circular turns. */
export function buildCoilSegments(inputCoil, turnsOverride) {
  const coil = makeCoil(inputCoil);
  const turns = Math.round(clamp(turnsOverride ?? coil.turns, 1, 50));
  const count = COIL_SEGMENTS_PER_TURN;
  const segments = [];
  for (let turn = 0; turn < turns; turn++) {
    const along = turns === 1 ? 0 : ((turn + 0.5) / turns - 0.5) * coil.length;
    const vertices = [];
    for (let i = 0; i <= count; i++) {
      const angle = i / count * Math.PI * 2;
      vertices.push({ x: along, y: coil.radius * Math.cos(angle), z: coil.radius * Math.sin(angle) });
    }
    for (let i = 0; i < count; i++) {
      const a = vertices[i], b = vertices[i + 1];
      const mid = rotate(a.x + (b.x - a.x) / 2, a.y + (b.y - a.y) / 2, coil.angle);
      const worldOffset = rotate(along, 0, coil.angle);
      const dl = rotate(b.x - a.x, b.y - a.y, coil.angle);
      segments.push({
        x: coil.x + worldOffset.x + mid.x - rotate(along, 0, coil.angle).x,
        y: coil.y + worldOffset.y + mid.y - rotate(along, 0, coil.angle).y,
        z: (a.z + b.z) / 2,
        dlx: dl.x, dly: dl.y, dlz: b.z - a.z
      });
    }
  }
  return segments;
}

/** Biot–Savart field of the finite coil at an arbitrary point in the z=0 plane. */
export function finiteCoilFieldAt(point, inputCoil, segments = buildCoilSegments(inputCoil)) {
  const coil = makeCoil(inputCoil);
  if (Math.abs(coil.current) < 1e-12) return { x: 0, y: 0, z: 0 };
  let bx = 0, by = 0, bz = 0;
  const soft2 = WIRE_CORE_RADIUS_M ** 2;
  for (const element of segments) {
    const rx = point.x - element.x;
    const ry = point.y - element.y;
    const rz = (point.z || 0) - element.z;
    const r2 = rx * rx + ry * ry + rz * rz + soft2;
    const scale = MU0_OVER_4PI * coil.current / (r2 * Math.sqrt(r2));
    bx += (element.dly * rz - element.dlz * ry) * scale;
    by += (element.dlz * rx - element.dlx * rz) * scale;
    bz += (element.dlx * ry - element.dly * rx) * scale;
  }
  if (coil.core) {
    const magnitude = Math.hypot(bx, by, bz);
    if (magnitude > 0) {
      // Didactic saturating core response, not a material-specific B-H curve.
      const saturation = 0.0012;
      const susceptibility = 8;
      const enhancement = saturation * Math.tanh(susceptibility * magnitude / saturation);
      const factor = 1 + enhancement / magnitude;
      bx *= factor; by *= factor; bz *= factor;
    }
  }
  return { x: bx, y: by, z: bz };
}

export function makeFieldModel({ magnets = [], coil = null, useCoil = Boolean(coil), earth = false } = {}) {
  const activeMagnets = magnets.filter(Boolean).map(makeMagnet);
  const normalizedCoil = coil ? makeCoil(coil) : null;
  const segments = normalizedCoil && useCoil ? buildCoilSegments(normalizedCoil) : [];
  return {
    at(point) {
      const result = { x: 0, y: 0, z: 0 };
      for (const magnet of activeMagnets) {
        const field = finiteMagnetFieldAt(point, magnet);
        result.x += field.x; result.y += field.y; result.z += field.z;
      }
      if (normalizedCoil && useCoil) {
        const field = finiteCoilFieldAt(point, normalizedCoil, segments);
        result.x += field.x; result.y += field.y; result.z += field.z;
      }
      // Simplified uniform terrestrial contribution, shown separately in the UI.
      if (earth) result.y += 25e-6;
      return result;
    },
    magnets: activeMagnets,
    coil: normalizedCoil,
    segments
  };
}

export function magnetContainsPoint(point, inputMagnet, margin = 0) {
  const magnet = makeMagnet(inputMagnet);
  const local = rotateVectorToLocal(point.x - magnet.x, point.y - magnet.y, magnet.angle);
  return Math.abs(local.x) <= magnet.length / 2 + margin && Math.abs(local.y) <= magnet.height / 2 + margin;
}

function magnetSurfacePatches(inputMagnet, subdivisions = INTERACTION_QUADRATURE) {
  const magnet = makeMagnet(inputMagnet);
  const patchArea = magnet.height * magnet.depth / (subdivisions * subdivisions);
  const patches = [];
  for (const end of [-1, 1]) {
    const charge = end * magnet.polarity * magnet.magnetization * patchArea;
    const x = end * magnet.length / 2;
    for (let iy = 0; iy < subdivisions; iy++) {
      const y = -magnet.height / 2 + (iy + 0.5) * magnet.height / subdivisions;
      for (let iz = 0; iz < subdivisions; iz++) {
        const z = -magnet.depth / 2 + (iz + 0.5) * magnet.depth / subdivisions;
        const position = rotate(x, y, magnet.angle);
        patches.push({ x: magnet.x + position.x, y: magnet.y + position.y, z, charge });
      }
    }
  }
  return patches;
}

/**
 * Pair energy of two uniformly magnetized finite prisms, using their bound
 * magnetic surface charges. This is an interaction potential, not a claim
 * that magnetic monopoles exist. The 4 mm softening regularizes the discrete
 * quadrature near contact; results there are qualitative.
 */
export function magnetInteractionEnergy(firstInput, secondInput) {
  const first = magnetSurfacePatches(firstInput);
  const second = magnetSurfacePatches(secondInput);
  let energy = 0;
  const soft2 = INTERACTION_SOFTENING_M ** 2;
  for (const a of first) for (const b of second) {
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
    energy += MU0_OVER_4PI * a.charge * b.charge / Math.sqrt(dx * dx + dy * dy + dz * dz + soft2);
  }
  return energy;
}

/** Force and torque on the second prism from the gradient of finite-body energy. */
export function magnetInteractionForceTorque(firstInput, secondInput) {
  const first = makeMagnet(firstInput), second = makeMagnet(secondInput);
  const positionStep = 0.001;
  const angleStep = 0.002;
  const shifted = (dx, dy, da) => ({ ...second, x: second.x + dx, y: second.y + dy, angle: second.angle + da });
  const energy = magnetInteractionEnergy(first, second);
  const forceX = -(magnetInteractionEnergy(first, shifted(positionStep, 0, 0)) - magnetInteractionEnergy(first, shifted(-positionStep, 0, 0))) / (2 * positionStep);
  const forceY = -(magnetInteractionEnergy(first, shifted(0, positionStep, 0)) - magnetInteractionEnergy(first, shifted(0, -positionStep, 0))) / (2 * positionStep);
  const torque = -(magnetInteractionEnergy(first, shifted(0, 0, angleStep)) - magnetInteractionEnergy(first, shifted(0, 0, -angleStep))) / (2 * angleStep);
  return { force: { x: forceX, y: forceY }, torque, energy };
}

/** Interaction of one moving magnet with any number of fixed finite magnets. */
export function magnetInteractionForceTorqueWithSources(fixedInputs, movingInput) {
  const fixed = (Array.isArray(fixedInputs) ? fixedInputs : [fixedInputs]).filter(Boolean).map(makeMagnet);
  const moving = makeMagnet(movingInput);
  if (!fixed.length) return { force: { x: 0, y: 0 }, torque: 0, energy: 0 };
  const energyAt = (candidate) => fixed.reduce((sum, source) => sum + magnetInteractionEnergy(source, candidate), 0);
  const positionStep = 0.001, angleStep = 0.002;
  const shifted = (dx, dy, da) => ({ ...moving, x: moving.x + dx, y: moving.y + dy, angle: moving.angle + da });
  return {
    force: {
      x: -(energyAt(shifted(positionStep, 0, 0)) - energyAt(shifted(-positionStep, 0, 0))) / (2 * positionStep),
      y: -(energyAt(shifted(0, positionStep, 0)) - energyAt(shifted(0, -positionStep, 0))) / (2 * positionStep)
    },
    torque: -(energyAt(shifted(0, 0, angleStep)) - energyAt(shifted(0, 0, -angleStep))) / (2 * angleStep),
    energy: energyAt(moving)
  };
}

/** Damped motion under the combined force and torque from multiple fixed magnets. */
export function stepMagnetInteractionWithSources(fixedInputs, movingInput, velocityInput = {}, elapsedSeconds = 1 / 60, bounds = { x: MAGNET_SCENE_LIMIT_M, y: MAGNET_SCENE_LIMIT_M }) {
  const fixed = (Array.isArray(fixedInputs) ? fixedInputs : [fixedInputs]).filter(Boolean).map(makeMagnet);
  let moving = makeMagnet(movingInput);
  const velocity = { x: Number(velocityInput.x) || 0, y: Number(velocityInput.y) || 0, angle: Number(velocityInput.angle) || 0 };
  const dt = clamp(elapsedSeconds, 0, 0.04);
  const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / steps;
  const density = 7400;
  const mass = Math.max(0.05, moving.length * moving.height * moving.depth * density);
  const inertia = Math.max(1e-5, mass * (moving.length ** 2 + moving.height ** 2) / 12);
  const linearDamping = 1.4, angularDamping = 0.018;
  let interaction = magnetInteractionForceTorqueWithSources(fixed, moving);
  for (let i = 0; i < steps; i++) {
    interaction = magnetInteractionForceTorqueWithSources(fixed, moving);
    velocity.x = (velocity.x + interaction.force.x / mass * h) * Math.exp(-linearDamping / mass * h);
    velocity.y = (velocity.y + interaction.force.y / mass * h) * Math.exp(-linearDamping / mass * h);
    velocity.angle = (velocity.angle + interaction.torque / inertia * h) * Math.exp(-angularDamping / inertia * h);
    const candidate = makeMagnet({ ...moving, x: moving.x + velocity.x * h, y: moving.y + velocity.y * h, angle: moving.angle + velocity.angle * h });
    const extentX = Math.abs(Math.cos(candidate.angle)) * candidate.length / 2 + Math.abs(Math.sin(candidate.angle)) * candidate.height / 2;
    const extentY = Math.abs(Math.sin(candidate.angle)) * candidate.length / 2 + Math.abs(Math.cos(candidate.angle)) * candidate.height / 2;
    candidate.x = clamp(candidate.x, -bounds.x + extentX, bounds.x - extentX);
    candidate.y = clamp(candidate.y, -bounds.y + extentY, bounds.y - extentY);
    if (fixed.some((source) => magnetPrismsOverlap(source, candidate))) {
      velocity.x = 0; velocity.y = 0;
      candidate.x = moving.x; candidate.y = moving.y;
      if (fixed.some((source) => magnetPrismsOverlap(source, candidate))) { velocity.angle = 0; candidate.angle = moving.angle; }
    }
    moving = candidate;
  }
  return { magnet: moving, velocity, ...interaction, mass, inertia };
}

/** Two-dimensional oriented-rectangle collision check for the projected scene. */
export function magnetPrismsOverlap(firstInput, secondInput) {
  const first = makeMagnet(firstInput), second = makeMagnet(secondInput);
  const delta = { x: second.x - first.x, y: second.y - first.y };
  const axes = [first.angle, first.angle + Math.PI / 2, second.angle, second.angle + Math.PI / 2];
  const radius = (magnet, axis) => {
    const along = Math.cos(axis - magnet.angle), across = Math.sin(axis - magnet.angle);
    return Math.abs(along) * magnet.length / 2 + Math.abs(across) * magnet.height / 2;
  };
  return axes.every((axis) => Math.abs(delta.x * Math.cos(axis) + delta.y * Math.sin(axis)) < radius(first, axis) + radius(second, axis));
}

/**
 * Stable damped 2D step for one moving prism. The assumed magnet density and
 * damping describe a classroom model; near-contact motion is regularized.
 */
export function stepMagnetInteraction(fixedInput, movingInput, velocityInput = {}, elapsedSeconds = 1 / 60, bounds = { x: MAGNET_SCENE_LIMIT_M, y: MAGNET_SCENE_LIMIT_M }) {
  let fixed = makeMagnet(fixedInput), moving = makeMagnet(movingInput);
  const velocity = { x: Number(velocityInput.x) || 0, y: Number(velocityInput.y) || 0, angle: Number(velocityInput.angle) || 0 };
  const dt = clamp(elapsedSeconds, 0, 0.04);
  const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = steps ? dt / steps : 0;
  const density = 7400; // kg/m³, representative didactic NdFeB density
  const mass = Math.max(0.05, moving.length * moving.height * moving.depth * density);
  const inertia = Math.max(1e-5, mass * (moving.length ** 2 + moving.height ** 2) / 12);
  const linearDamping = 1.4, angularDamping = 0.018;
  let interaction = magnetInteractionForceTorque(fixed, moving);
  for (let i = 0; i < steps; i++) {
    interaction = magnetInteractionForceTorque(fixed, moving);
    velocity.x = (velocity.x + interaction.force.x / mass * h) * Math.exp(-linearDamping / mass * h);
    velocity.y = (velocity.y + interaction.force.y / mass * h) * Math.exp(-linearDamping / mass * h);
    velocity.angle = (velocity.angle + interaction.torque / inertia * h) * Math.exp(-angularDamping / inertia * h);
    const candidate = makeMagnet({ ...moving, x: moving.x + velocity.x * h, y: moving.y + velocity.y * h, angle: moving.angle + velocity.angle * h });
    const extentX = Math.abs(Math.cos(candidate.angle)) * candidate.length / 2 + Math.abs(Math.sin(candidate.angle)) * candidate.height / 2;
    const extentY = Math.abs(Math.sin(candidate.angle)) * candidate.length / 2 + Math.abs(Math.cos(candidate.angle)) * candidate.height / 2;
    candidate.x = clamp(candidate.x, -bounds.x + extentX, bounds.x - extentX);
    candidate.y = clamp(candidate.y, -bounds.y + extentY, bounds.y - extentY);
    if (magnetPrismsOverlap(fixed, candidate)) {
      velocity.x = 0; velocity.y = 0;
      candidate.x = moving.x; candidate.y = moving.y;
      if (magnetPrismsOverlap(fixed, candidate)) { velocity.angle = 0; candidate.angle = moving.angle; }
    }
    moving = candidate;
  }
  return { magnet: moving, velocity, ...interaction, mass, inertia };
}

export function coilAxisFieldAnalytic(inputCoil, x = 0, turnsOverride) {
  const coil = makeCoil(inputCoil);
  const turns = Math.round(clamp(turnsOverride ?? coil.turns, 1, 50));
  let field = 0;
  for (let i = 0; i < turns; i++) {
    const center = turns === 1 ? 0 : ((i + 0.5) / turns - 0.5) * coil.length;
    const dx = x - center;
    field += MU0 * coil.current * coil.radius ** 2 / (2 * (coil.radius ** 2 + dx ** 2) ** 1.5);
  }
  return field;
}

export function fieldMagnitude(field) {
  return Math.hypot(field.x, field.y, field.z);
}

export function fieldAngleDegrees(field) {
  return Math.atan2(field.y, field.x) * 180 / Math.PI;
}

export function traceFieldLine(model, start, { step = 0.006, maxSteps = 260, bounds = { x: 0.42, y: 0.27, centerX: 0, centerY: 0 } } = {}) {
  const points = [{ x: start.x, y: start.y }];
  let p = { x: start.x, y: start.y };
  const direction = (point) => {
    const b = model.at(point);
    const length = Math.hypot(b.x, b.y);
    return length > 1e-11 ? { x: b.x / length, y: b.y / length } : null;
  };
  const centerX = Number(bounds.centerX) || 0, centerY = Number(bounds.centerY) || 0;
  for (let i = 0; i < maxSteps; i++) {
    if (Math.abs(p.x - centerX) > bounds.x || Math.abs(p.y - centerY) > bounds.y) break;
    const k1 = direction(p);
    if (!k1) break;
    const k2 = direction({ x: p.x + k1.x * step / 2, y: p.y + k1.y * step / 2 });
    const k3 = k2 && direction({ x: p.x + k2.x * step / 2, y: p.y + k2.y * step / 2 });
    const k4 = k3 && direction({ x: p.x + k3.x * step, y: p.y + k3.y * step });
    if (!k2 || !k3 || !k4) break;
    p = { x: p.x + step * (k1.x + 2 * k2.x + 2 * k3.x + k4.x) / 6, y: p.y + step * (k1.y + 2 * k2.y + 2 * k3.y + k4.y) / 6 };
    if (model.magnets.some((magnet) => magnetContainsPoint(p, magnet, 0.001))) break;
    points.push(p);
  }
  return points;
}


