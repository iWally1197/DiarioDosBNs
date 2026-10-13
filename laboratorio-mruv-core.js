const number = (value, label) => {
  const result = Number(value);
  if (!Number.isFinite(result)) throw new RangeError(`${label} precisa ser um número finito.`);
  return result;
};
const EPS = 1e-9;

export function cartParameters(cart) {
  const values = { x0: number(cart.x0, "Posição inicial"), v0: number(cart.v0, "Velocidade inicial"), a: number(cart.a, "Aceleração") };
  if (Math.abs(values.x0) > 1e6) throw new RangeError("A posição inicial deve ficar entre −1.000.000 e 1.000.000 m.");
  if (Math.abs(values.v0) > 100) throw new RangeError("A velocidade inicial deve ficar entre −100 e 100 m/s.");
  if (Math.abs(values.a) > 20) throw new RangeError("A aceleração deve ficar entre −20 e 20 m/s².");
  return values;
}
export function stoppingTime(cart) {
  const { v0, a } = cartParameters(cart);
  return v0 * a < 0 ? -v0 / a : null;
}
function phaseAt(cart, t, options = {}) {
  const { x0, v0, a } = cartParameters(cart);
  const stop = options.brakingMode ? stoppingTime(cart) : null;
  if (stop !== null && t >= stop) {
    const xStop = x0 + v0 * stop + 0.5 * a * stop * stop;
    return { x0, x: xStop, v: 0, a: 0, phase: "parado", stopTime: stop };
  }
  return { x0, x: x0 + v0 * t + 0.5 * a * t * t, v: v0 + a * t, a, phase: "mruv", stopTime: stop };
}
export function turningTime(cart, options = {}) {
  if (options.brakingMode) return stoppingTime(cart);
  const { v0, a } = cartParameters(cart);
  if (Math.abs(a) < EPS) return null;
  const t = -v0 / a;
  return t >= 0 ? t : null;
}
export function mruvAt(cart, time, options = {}) {
  const t = number(time, "Tempo");
  if (t < 0) throw new RangeError("O tempo do experimento não pode ser negativo.");
  const values = phaseAt(cart, t, options);
  const turn = turningTime(cart, options);
  const displacement = values.x - values.x0;
  let distance = Math.abs(displacement);
  if (!options.brakingMode && turn !== null && turn > 0 && turn < t) {
    const xTurn = phaseAt(cart, turn, {}).x;
    distance = Math.abs(xTurn - values.x0) + Math.abs(values.x - xTurn);
  }
  const accelerating = Math.abs(values.v) < EPS ? "instante de repouso" : values.v * values.a > EPS ? "aumentando a rapidez" : values.v * values.a < -EPS ? "diminuindo a rapidez" : "rapidez constante";
  return { t, ...values, v0: cartParameters(cart).v0, displacement, distance, speed: Math.abs(values.v), turnTime: turn,
    direction: values.v > EPS ? "sentido positivo" : values.v < -EPS ? "sentido negativo" : "repouso instantâneo", behavior: accelerating };
}
export function distanceBetween(cart, startTime, endTime, options = {}) {
  let start = number(startTime, "Instante inicial"), end = number(endTime, "Instante final");
  if (start < 0 || end < 0) throw new RangeError("Os instantes não podem ser negativos.");
  if (end < start) [start, end] = [end, start];
  const cuts = [start, end], stop = options.brakingMode ? stoppingTime(cart) : null, turn = turningTime(cart, options);
  if (stop !== null && stop > start && stop < end) cuts.push(stop);
  if (turn !== null && turn > start && turn < end) cuts.push(turn);
  cuts.sort((a, b) => a - b);
  let distance = 0;
  for (let i = 1; i < cuts.length; i++) distance += Math.abs(mruvAt(cart, cuts[i], options).x - mruvAt(cart, cuts[i - 1], options).x);
  return distance;
}
export function mruvMetrics(cart, startTime, endTime, options = {}) {
  const start = number(startTime, "Instante inicial"), end = number(endTime, "Instante final");
  if (start < 0 || end < 0) throw new RangeError("Os instantes não podem ser negativos.");
  const first = mruvAt(cart, start, options), last = mruvAt(cart, end, options), interval = end - start;
  const displacement = last.x - first.x, distance = distanceBetween(cart, start, end, options);
  return { startTime: start, endTime: end, interval, xStart: first.x, xEnd: last.x, displacement, distance,
    averageVelocity: Math.abs(interval) < EPS ? 0 : displacement / interval,
    averageSpeed: Math.abs(interval) < EPS ? 0 : distance / Math.abs(interval),
    acceleration: Math.abs(interval) < EPS ? last.a : (last.v - first.v) / interval };
}
function solveQuadratic(c2, c1, c0) {
  if (Math.abs(c2) < EPS) return Math.abs(c1) < EPS ? [] : [-c0 / c1];
  const d = c1 * c1 - 4 * c2 * c0;
  if (d < -EPS) return [];
  if (Math.abs(d) <= EPS) return [-c1 / (2 * c2)];
  const root = Math.sqrt(Math.max(0, d));
  const q = -0.5 * (c1 + Math.sign(c1 || 1) * root);
  return [q / c2, c0 / q].sort((a, b) => a - b);
}
function intervalsFor(carts, end, options) {
  const cuts = [0, end];
  if (options.brakingMode) for (const cart of carts) { const stop = stoppingTime(cart); if (stop !== null && stop > 0 && stop < end) cuts.push(stop); }
  return [...new Set(cuts)].sort((a, b) => a - b).slice(0, 12);
}
function coefficients(cart, probeTime, options) {
  const current = phaseAt(cart, probeTime, options);
  return current.phase === "parado" ? { c0: current.x, c1: 0, c2: 0 } : { c0: cart.x0, c1: cart.v0, c2: cart.a / 2 };
}
export function crossingTimes(cart, sensorPosition, duration, options = {}) {
  const limit = number(duration, "Duração"), sensor = number(sensorPosition, "Posição do sensor");
  const cuts = intervalsFor([cart], limit, options), times = [];
  for (let i = 1; i < cuts.length; i++) {
    const start = cuts[i - 1], end = cuts[i], c = coefficients(cart, (start + end) / 2, options);
    for (const root of solveQuadratic(c.c2, c.c1, c.c0 - sensor)) if (root >= start - EPS && root <= end + EPS) times.push(Math.max(0, Math.min(limit, root)));
  }
  const stop = options.brakingMode ? stoppingTime(cart) : null;
  const isStoppedOnSensor = stop !== null && stop <= limit && Math.abs(mruvAt(cart, stop, options).x - sensor) < EPS;
  if (!isStoppedOnSensor && Math.abs(mruvAt(cart, limit, options).x - sensor) < EPS) times.push(limit);
  return [...new Set(times.sort((a, b) => a - b).map(t => Number(t.toPrecision(12))))];
}
export function crossingTime(cart, sensorPosition, duration = 3600, options = {}) {
  return crossingTimes(cart, sensorPosition, duration, options)[0] ?? null;
}
export function meetEvents(carts, duration, options = {}) {
  const limit = number(duration, "Duração");
  if (limit < 0) throw new RangeError("A duração não pode ser negativa.");
  const result = [], cuts = intervalsFor(carts, limit, options);
  for (let i = 0; i < carts.length; i++) for (let j = i + 1; j < carts.length; j++) {
    const a = carts[i], b = carts[j]; let same = true, found = [];
    for (let k = 1; k < cuts.length; k++) {
      const start = cuts[k - 1], end = cuts[k], probe = (start + end) / 2;
      const ca = coefficients(a, probe, options), cb = coefficients(b, probe, options);
      const c0 = ca.c0 - cb.c0, c1 = ca.c1 - cb.c1, c2 = ca.c2 - cb.c2;
      if (Math.abs(c0) > EPS || Math.abs(c1) > EPS || Math.abs(c2) > EPS) same = false;
      for (const root of solveQuadratic(c2, c1, c0)) if (root >= start - EPS && root <= end + EPS) found.push(Math.max(0, Math.min(limit, root)));
    }
    if (same) { result.push({ first: a.id, second: b.id, type: "same-trajectory" }); continue; }
    for (const time of [...new Set(found.map(t => Number(t.toPrecision(10))))].sort((x, y) => x - y)) {
      const position = mruvAt(a, time, options).x;
      result.push({ first: a.id, second: b.id, type: "meeting", time, position });
    }
  }
  return result;
}
export function torricelli(cart, displacement) {
  const { v0, a } = cartParameters(cart), dx = number(displacement, "Deslocamento");
  return { initialVelocity: v0, acceleration: a, displacement: dx, finalVelocitySquared: v0 * v0 + 2 * a * dx };
}
export function sampleTimes(duration, interval, maxRows = 240) {
  const end = number(duration, "Duração"), step = number(interval, "Intervalo de medição"), maximum = Math.max(2, Math.floor(number(maxRows, "Limite de linhas")));
  if (end < 0) throw new RangeError("A duração não pode ser negativa.");
  if (!(step > 0)) throw new RangeError("O intervalo de medição deve ser positivo.");
  const count = Math.min(maximum - 1, Math.floor(end / step));
  const times = Array.from({ length: count + 1 }, (_, i) => i * step);
  if (times.at(-1) < end - EPS && times.length < maximum) times.push(end); else if (times.length === maximum) times[times.length - 1] = end;
  return [...new Set(times.map(t => Number(t.toPrecision(12))))];
}
export function validateExperiment(config) {
  if (!config || typeof config !== "object") throw new TypeError("A configuração do experimento é inválida.");
  const duration = number(config.duration, "Duração"), sampleInterval = number(config.sampleInterval, "Intervalo de medição");
  if (!(duration > 0) || duration > 3600) throw new RangeError("A duração deve ficar entre 0 e 3.600 s.");
  if (!(sampleInterval > 0) || sampleInterval > duration) throw new RangeError("O intervalo deve ser positivo e não maior que a duração.");
  if (!Array.isArray(config.carts) || config.carts.length < 1 || config.carts.length > 5) throw new RangeError("O experimento precisa ter de um a cinco carrinhos.");
  const ids = new Set();
  for (const cart of config.carts) { if (!cart?.id || ids.has(cart.id)) throw new RangeError("Cada carrinho precisa ter identificador único."); ids.add(cart.id); cartParameters(cart); }
  return { duration, sampleInterval, carts: config.carts, brakingMode: config.brakingMode === true };
}
