const C = 299_792_458;
const C_METERS_PER_NS = C * 1e-9;
const OPTICS_DURATION_NS = 20;

function finite(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new RangeError(`${name} deve ser um número finito.`);
  return number;
}

function positive(value, name) {
  const number = finite(value, name);
  if (number <= 0) throw new RangeError(`${name} deve ser maior que zero.`);
  return number;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function unit(vector) {
  const length = Math.hypot(vector.x, vector.y);
  if (!(length > 0)) throw new RangeError("A direção do raio não pode ser nula.");
  return { x: vector.x / length, y: vector.y / length };
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

function reflect(direction, normal) {
  const projection = dot(direction, normal);
  return unit({ x: direction.x - 2 * projection * normal.x, y: direction.y - 2 * projection * normal.y });
}

function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function addScaled(origin, direction, amount) {
  return { x: origin.x + direction.x * amount, y: origin.y + direction.y * amount };
}

function rayToBounds(origin, direction, bounds) {
  const candidates = [];
  if (direction.x > 1e-10) candidates.push((bounds.xMax - origin.x) / direction.x);
  if (direction.x < -1e-10) candidates.push((bounds.xMin - origin.x) / direction.x);
  if (direction.y > 1e-10) candidates.push((bounds.yMax - origin.y) / direction.y);
  if (direction.y < -1e-10) candidates.push((bounds.yMin - origin.y) / direction.y);
  const t = candidates.filter((value) => value > 1e-8).sort((a, b) => a - b).find((value) => {
    const point = addScaled(origin, direction, value);
    return point.x >= bounds.xMin - 1e-8 && point.x <= bounds.xMax + 1e-8 && point.y >= bounds.yMin - 1e-8 && point.y <= bounds.yMax + 1e-8;
  });
  return addScaled(origin, direction, t ?? 0);
}

function makeView(bounds, width, height) {
  const margin = 36;
  const scale = Math.max(1, Math.min((width - margin * 2) / (bounds.xMax - bounds.xMin), (height - margin * 2) / (bounds.yMax - bounds.yMin)));
  const innerWidth = (bounds.xMax - bounds.xMin) * scale;
  const innerHeight = (bounds.yMax - bounds.yMin) * scale;
  const left = (width - innerWidth) / 2;
  const top = (height - innerHeight) / 2;
  return {
    bounds, scale, left, top, width, height,
    toScreen(point) { return { x: left + (point.x - bounds.xMin) * scale, y: top + (bounds.yMax - point.y) * scale }; },
    toWorld(point) { return { x: bounds.xMin + (point.x - left) / scale, y: bounds.yMax - (point.y - top) / scale }; }
  };
}

function visibleColor(wavelengthNm) {
  const wavelength = clamp(wavelengthNm, 380, 700);
  let r = 0, g = 0, b = 0;
  if (wavelength < 440) { r = (440 - wavelength) / 60; b = 1; }
  else if (wavelength < 490) { g = (wavelength - 440) / 50; b = 1; }
  else if (wavelength < 510) { g = 1; b = (510 - wavelength) / 20; }
  else if (wavelength < 580) { r = (wavelength - 510) / 70; g = 1; }
  else if (wavelength < 645) { r = 1; g = (645 - wavelength) / 65; }
  else r = 1;
  const intensity = wavelength < 420 ? 0.3 + 0.7 * (wavelength - 380) / 40 : wavelength > 645 ? 0.3 + 0.7 * (700 - wavelength) / 55 : 1;
  const channel = (value) => Math.round(255 * Math.pow(clamp(value * intensity, 0, 1), 0.8));
  return `#${[channel(r), channel(g), channel(b)].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function wavelengthInfo(p, refractiveIndex = 1) {
  const wavelengthVacuumNm = positive(p.wavelengthNm, "Comprimento de onda") ;
  if (wavelengthVacuumNm < 380 || wavelengthVacuumNm > 700) throw new RangeError("Use um comprimento de onda entre 380 nm e 700 nm para a luz visível.");
  const wavelengthVacuumM = wavelengthVacuumNm * 1e-9;
  const frequencyHz = C / wavelengthVacuumM;
  return {
    wavelengthVacuumNm,
    wavelengthMediumNm: wavelengthVacuumNm / positive(refractiveIndex, "Índice de refração"),
    frequencyHz,
    frequencyTHz: frequencyHz / 1e12,
    color: visibleColor(wavelengthVacuumNm)
  };
}

function particlePathPosition(segments, timeNs) {
  const lengths = segments.map((segment) => distance(segment.start, segment.end));
  const times = segments.map((segment, index) => lengths[index] / (C_METERS_PER_NS / segment.index));
  const totalTime = times.reduce((sum, value) => sum + value, 0);
  const totalLength = lengths.reduce((sum, value) => sum + value, 0);
  if (!(totalTime > 0) || !(totalLength > 0)) return 0;
  let elapsed = ((timeNs % totalTime) + totalTime) % totalTime;
  let travelled = 0;
  for (let index = 0; index < segments.length; index += 1) {
    if (elapsed <= times[index]) return travelled + elapsed * C_METERS_PER_NS / segments[index].index;
    elapsed -= times[index];
    travelled += lengths[index];
  }
  return 0;
}

function mirrorPlane(p) {
  const bounds = { xMin: 0, xMax: 4, yMin: 0, yMax: 3 };
  const incidence = finite(p.incidenceAngle, "Ângulo de incidência") * Math.PI / 180;
  const tilt = finite(p.mirrorTilt, "Inclinação do espelho") * Math.PI / 180;
  const impactOffset = finite(p.impactOffset, "Ponto de incidência");
  if (Math.abs(incidence) > Math.PI / 3 + 1e-9) throw new RangeError("O ângulo de incidência deve permanecer entre −60° e 60°.");
  if (Math.abs(tilt) > 25 * Math.PI / 180 + 1e-9) throw new RangeError("A inclinação do espelho deve permanecer entre −25° e 25°.");
  const center = { x: finite(p.mirrorX ?? 2.65, "Posição horizontal do espelho"), y: finite(p.mirrorY ?? 1.5, "Posição vertical do espelho") };
  if (center.x < 1.8 || center.x > 3.2 || center.y < 0.8 || center.y > 2.2) throw new RangeError("Mantenha o espelho dentro dos limites da cena.");
  const tangent = { x: -Math.sin(tilt), y: Math.cos(tilt) };
  const normal = { x: -Math.cos(tilt), y: -Math.sin(tilt) };
  const hit = addScaled(center, tangent, impactOffset);
  const incomingDirection = unit({ x: Math.cos(incidence), y: Math.sin(incidence) });
  const reflectedDirection = reflect(incomingDirection, normal);
  const sourceBoundary = rayToBounds(hit, { x: -incomingDirection.x, y: -incomingDirection.y }, bounds);
  const requestedSourceDistance = positive(p.sourceDistance ?? 1.8, "Distância da fonte");
  const sourceDistance = Math.min(requestedSourceDistance, distance(hit, sourceBoundary));
  const source = addScaled(hit, { x: -incomingDirection.x, y: -incomingDirection.y }, sourceDistance);
  const exit = rayToBounds(hit, reflectedDirection, bounds);
  const rays = [
    { role: "incidente", points: [source, hit], index: 1, color: "beam" },
    { role: "refletido", points: [hit, exit], index: 1, color: "beam" }
  ];
  const segments = [{ start: source, end: hit, index: 1 }, { start: hit, end: exit, index: 1 }];
  return {
    kind: "plane-mirror", bounds, center, tangent, normal, hit, source, exit, incomingDirection, reflectedDirection,
    rays, segments, handles: { top: addScaled(center, tangent, 1.05), bottom: addScaled(center, tangent, -1.05), center, hit, source },
    view: null
  };
}

function refractingInterface(p) {
  const bounds = { xMin: 0, xMax: 4, yMin: 0, yMax: 3 };
  const angle = finite(p.incidenceAngle, "Ângulo de incidência") * Math.PI / 180;
  const n1 = positive(p.index1, "Índice do meio 1");
  const n2 = positive(p.index2, "Índice do meio 2");
  const impact = finite(p.impactOffset, "Ponto de incidência");
  if (n1 < 1 || n1 > 2.4 || n2 < 1 || n2 > 2.4) throw new RangeError("Use índices de refração entre 1,00 e 2,40.");
  if (Math.abs(angle) > 75 * Math.PI / 180 + 1e-9) throw new RangeError("O ângulo de incidência deve permanecer entre 0° e 75°.");
  const hit = { x: 2 + impact, y: 1.5 };
  const incomingDirection = unit({ x: Math.sin(angle), y: Math.cos(angle) });
  const source = rayToBounds(hit, { x: -incomingDirection.x, y: -incomingDirection.y }, bounds);
  const reflectedDirection = unit({ x: Math.sin(angle), y: -Math.cos(angle) });
  const ratio = (n1 / n2) * Math.sin(angle);
  const totalInternalReflection = Math.abs(ratio) > 1 + 1e-12;
  const normal = { x: 0, y: 1 };
  const rays = [{ role: "incidente", points: [source, hit], index: n1, color: "beam" }];
  const segments = [{ start: source, end: hit, index: n1 }];
  let exit;
  let transmittedDirection = null;
  let angle2 = null;
  if (totalInternalReflection) {
    exit = rayToBounds(hit, reflectedDirection, bounds);
    rays.push({ role: "refletido · reflexão interna total", points: [hit, exit], index: n1, color: "beam" });
    segments.push({ start: hit, end: exit, index: n1 });
  } else {
    angle2 = Math.asin(clamp(ratio, -1, 1));
    transmittedDirection = unit({ x: Math.sin(angle2), y: Math.cos(angle2) });
    exit = rayToBounds(hit, transmittedDirection, bounds);
    rays.push({ role: "refratado", points: [hit, exit], index: n2, color: "beam" });
    segments.push({ start: hit, end: exit, index: n2 });
  }
  return { kind: "interface", bounds, hit, source, exit, normal, incomingDirection, reflectedDirection, transmittedDirection, angle1: angle, angle2, n1, n2, totalInternalReflection, rays, segments, handles: { hit }, view: null };
}

function sphericalMirror(id, p) {
  const radius = positive(p.radius, "Raio de curvatura");
  const objectDistance = positive(p.objectDistance, "Distância do objeto");
  const objectHeight = positive(p.objectHeight, "Altura do objeto");
  const sign = id === "optics-concave-mirror" ? 1 : -1;
  const signedRadius = sign * radius;
  const focalLength = signedRadius / 2;
  const denominator = 1 / focalLength - 1 / objectDistance;
  const imageDistance = Math.abs(denominator) < 1e-10 ? Infinity : 1 / denominator;
  const magnification = Number.isFinite(imageDistance) ? -imageDistance / objectDistance : -Infinity;
  const imageX = Number.isFinite(imageDistance) ? -imageDistance : null;
  const imageY = Number.isFinite(magnification) ? magnification * objectHeight : null;
  const center = { x: -signedRadius, y: 0 };
  const aperture = radius * 0.52;
  const xMin = Math.min(-objectDistance * 1.15, -radius * 1.25, imageX !== null && imageX < 0 ? Math.max(-8, imageX * 1.08) : -0.45);
  const xMax = Math.max(0.45, radius * 1.25, imageX !== null && imageX > 0 ? Math.min(8, imageX * 1.08) : 0.45);
  const yExtent = Math.max(aperture * 1.5, objectHeight * 1.5, Math.abs(imageY ?? 0) > 0 ? Math.min(Math.abs(imageY), 7) * 1.12 : 0.5);
  const bounds = { xMin, xMax, yMin: -yExtent, yMax: yExtent };
  const object = { x: -objectDistance, y: objectHeight };
  const sampleHeights = [-0.9, -0.55, -0.2, 0.2, 0.55, 0.9].map((factor) => factor * aperture);
  const rays = [];
  const particlePaths = [];
  for (const y of sampleHeights) {
    const surfaceX = -signedRadius + sign * Math.sqrt(Math.max(0, radius ** 2 - y ** 2));
    const hit = { x: surfaceX, y };
    const incomingDirection = unit({ x: hit.x - object.x, y: hit.y - object.y });
    const surfaceNormal = unit({ x: hit.x - center.x, y: hit.y - center.y });
    const outgoingDirection = reflect(incomingDirection, surfaceNormal);
    const end = rayToBounds(hit, outgoingDirection, bounds);
    const virtualEnd = rayToBounds(hit, { x: -outgoingDirection.x, y: -outgoingDirection.y }, bounds);
    rays.push({ role: "raio principal", points: [object, hit], index: 1, color: "beam" });
    rays.push({ role: "refletido", points: [hit, end], index: 1, color: "beam" });
    if (id === "optics-convex-mirror" || imageDistance < 0) rays.push({ role: "prolongamento virtual", points: [hit, virtualEnd], index: 1, color: "virtual" });
    particlePaths.push([{ start: object, end: hit, index: 1 }, { start: hit, end, index: 1 }]);
  }
  const surfacePoints = Array.from({ length: 65 }, (_, index) => {
    const y = -aperture + 2 * aperture * index / 64;
    return { x: -signedRadius + sign * Math.sqrt(Math.max(0, radius ** 2 - y ** 2)), y };
  });
  const primarySegments = particlePaths[Math.floor(particlePaths.length / 2)];
  return {
    kind: "spherical-mirror", bounds, center, radius, signedRadius, focalLength, object, image: imageX === null ? null : { x: imageX, y: imageY },
    imageDistance, magnification, surfacePoints, rays, segments: primarySegments, particlePaths, aperture,
    view: null, sign, imageType: imageDistance === Infinity ? "no infinito" : imageDistance > 0 ? "real" : "virtual"
  };
}

export function opticalModelFor(id, parameters, time = 0) {
  const t = clamp(finite(time, "Tempo"), 0, OPTICS_DURATION_NS);
  let geometry;
  let values;
  if (id === "optics-reflection") {
    geometry = mirrorPlane(parameters);
    const lambda = wavelengthInfo(parameters);
    const angle = Math.acos(clamp(Math.abs(dot(geometry.incomingDirection, geometry.normal)), -1, 1));
    values = {
      time: t, angleIncident: angle * 180 / Math.PI, angleReflected: angle * 180 / Math.PI,
      wavelengthVacuumNm: lambda.wavelengthVacuumNm, wavelengthMediumNm: lambda.wavelengthVacuumNm,
      frequencyTHz: lambda.frequencyTHz, speed: C, refractiveIndex: 1,
      pathPosition: particlePathPosition(geometry.segments, t), pathLength: geometry.segments.reduce((sum, segment) => sum + distance(segment.start, segment.end), 0),
      totalInternalReflection: false, imageDistance: null, image: "—"
    };
  } else if (id === "optics-refraction") {
    geometry = refractingInterface(parameters);
    const lambda1 = wavelengthInfo(parameters, geometry.n1);
    const lambda2 = wavelengthInfo(parameters, geometry.n2);
    const criticalAngle = geometry.n1 > geometry.n2 ? Math.asin(geometry.n2 / geometry.n1) * 180 / Math.PI : null;
    const pathLength = geometry.segments.reduce((sum, segment) => sum + distance(segment.start, segment.end), 0);
    values = {
      time: t, angleIncident: Math.abs(geometry.angle1 * 180 / Math.PI), angleTransmitted: geometry.angle2 === null ? null : Math.abs(geometry.angle2 * 180 / Math.PI),
      index1: geometry.n1, index2: geometry.n2, criticalAngle,
      wavelengthVacuumNm: lambda1.wavelengthVacuumNm, wavelength1Nm: lambda1.wavelengthMediumNm, wavelength2Nm: lambda2.wavelengthMediumNm,
      frequencyTHz: lambda1.frequencyTHz, speed1: C / geometry.n1, speed2: C / geometry.n2,
      totalInternalReflection: geometry.totalInternalReflection,
      pathPosition: particlePathPosition(geometry.segments, t), pathLength,
      imageDistance: null, image: "—"
    };
  } else if (id === "optics-concave-mirror" || id === "optics-convex-mirror") {
    geometry = sphericalMirror(id, parameters);
    const lambda = wavelengthInfo(parameters);
    values = {
      time: t, radius: geometry.signedRadius, focalLength: geometry.focalLength, objectDistance: Number(parameters.objectDistance),
      imageDistance: geometry.imageDistance, magnification: geometry.magnification, image: geometry.imageType,
      wavelengthVacuumNm: lambda.wavelengthVacuumNm, wavelengthMediumNm: lambda.wavelengthVacuumNm,
      frequencyTHz: lambda.frequencyTHz, speed: C, refractiveIndex: 1,
      pathPosition: particlePathPosition(geometry.segments, t), pathLength: geometry.segments.reduce((sum, segment) => sum + distance(segment.start, segment.end), 0),
      totalInternalReflection: false
    };
  } else {
    throw new RangeError(`Simulação óptica desconhecida: ${id}.`);
  }
  geometry.view = makeView(geometry.bounds, 600, 340);
  return { time: t, duration: OPTICS_DURATION_NS, values, geometry };
}

export function opticalDurationFor() {
  return OPTICS_DURATION_NS;
}

export function opticalGraphFor(id, parameters, time = 0) {
  const model = opticalModelFor(id, parameters, time);
  const duration = OPTICS_DURATION_NS;
  const points = Array.from({ length: 161 }, (_, index) => {
    const t = duration * index / 160;
    return { x: t, y: opticalModelFor(id, parameters, t).values.pathPosition };
  });
  return {
    xLabel: "Tempo da simulação (ns)",
    yLabel: "Posição do marcador no feixe (m)",
    xMin: 0,
    xMax: duration,
    series: [{ label: "Propagação calculada no caminho do raio", points, cursor: { x: time, y: model.values.pathPosition } }]
  };
}

export function wavelengthColor(wavelengthNm) {
  return visibleColor(wavelengthNm);
}

export function opticalRayBoundary(origin, direction, bounds) {
  return rayToBounds(origin, direction, bounds);
}

export function opticalDistance(a, b) {
  return distance(a, b);
}

export function opticalViewFor(bounds, width, height) {
  return makeView(bounds, width, height);
}

