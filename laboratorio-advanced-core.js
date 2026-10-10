const G = 9.81;
const COULOMB = 8.9875517923e9;

function finite(value, name) {
  const result = Number(value);
  if (!Number.isFinite(result)) throw new RangeError(`${name} deve ser um número finito.`);
  return result;
}

function positive(value, name) {
  const result = finite(value, name);
  if (!(result > 0)) throw new RangeError(`${name} deve ser maior que zero.`);
  return result;
}

export function durationFor(id, p) {
  switch (id) {
    case "mru":
    case "muv": return 10;
    case "newton": return 8;
    case "energy": {
      const a = G * Math.sin(finite(p.angle, "Ângulo") * Math.PI / 180);
      return Math.sqrt(2 * positive(p.length, "Comprimento") / a);
    }
    case "collision": return 4;
    case "spring": return 8 * 2 * Math.PI * Math.sqrt(positive(p.mass, "Massa") / positive(p.k, "Constante elástica"));
    case "wave": return 4 / positive(p.frequency, "Frequência");
    case "calorimetry": {
      const c1 = positive(p.mass1, "Massa 1") * 4186;
      const c2 = positive(p.mass2, "Massa 2") * 4186;
      const conductance = positive(p.conductance, "Condutância térmica");
      return 5 / (conductance * (1 / c1 + 1 / c2));
    }
    case "ohm":
    case "lens":
    case "field": return 0;
    default: throw new RangeError(`Experimento desconhecido: ${id}.`);
  }
}

function collisionResult(p) {
  const m1 = positive(p.mass1, "Massa 1");
  const m2 = positive(p.mass2, "Massa 2");
  const e = finite(p.restitution, "Coeficiente de restituição");
  if (e < 0 || e > 1) throw new RangeError("O coeficiente de restituição deve estar entre 0 e 1.");
  const u1 = finite(p.u1, "Velocidade inicial 1");
  const u2 = finite(p.u2, "Velocidade inicial 2");
  const totalMass = m1 + m2;
  return {
    v1: ((m1 - e * m2) * u1 + (1 + e) * m2 * u2) / totalMass,
    v2: ((m2 - e * m1) * u2 + (1 + e) * m1 * u1) / totalMass,
    momentumBefore: m1 * u1 + m2 * u2,
    momentumAfter: null,
    kineticBefore: 0.5 * m1 * u1 ** 2 + 0.5 * m2 * u2 ** 2,
    kineticAfter: null,
    time: 2
  };
}

export function stateAt(id, p, time = 0) {
  const duration = durationFor(id, p);
  const t = duration > 0 ? Math.max(0, Math.min(duration, finite(time, "Tempo"))) : 0;
  switch (id) {
    case "mru": {
      const x = finite(p.x0 ?? 0, "Posição inicial") + finite(p.velocity, "Velocidade") * t;
      return { time: t, duration, values: { x, v: Number(p.velocity), a: 0 } };
    }
    case "muv": {
      const x = finite(p.x0 ?? 0, "Posição inicial") + finite(p.velocity, "Velocidade") * t + 0.5 * finite(p.acceleration, "Aceleração") * t ** 2;
      const v = finite(p.velocity, "Velocidade") + finite(p.acceleration, "Aceleração") * t;
      return { time: t, duration, values: { x, v, a: Number(p.acceleration) } };
    }
    case "newton": {
      const mass = positive(p.mass, "Massa");
      const force = finite(p.force, "Força aplicada");
      const normal = mass * G;
      const staticMax = finite(p.muStatic, "Atrito estático") * normal;
      const kinetic = finite(p.muKinetic, "Atrito cinético") * normal;
      if (staticMax < kinetic) throw new RangeError("O coeficiente de atrito estático deve ser maior ou igual ao cinético.");
      let net = 0;
      if (Math.abs(force) > staticMax) net = force - Math.sign(force) * kinetic;
      const a = net / mass;
      return { time: t, duration, values: { x: 0.5 * a * t ** 2, v: a * t, a, force, friction: net - force, normal } };
    }
    case "energy": {
      const length = positive(p.length, "Comprimento da rampa");
      const angle = finite(p.angle, "Ângulo") * Math.PI / 180;
      const mass = positive(p.mass, "Massa");
      const acceleration = G * Math.sin(angle);
      const duration = Math.sqrt(2 * length / acceleration);
      const s = Math.min(length, 0.5 * acceleration * t ** 2);
      const v = acceleration * t;
      const potential = mass * G * (length - s) * Math.sin(angle);
      const kinetic = 0.5 * mass * v ** 2;
      return { time: t, duration, values: { s, v, a: acceleration, kinetic, potential, total: kinetic + potential, height: (length - s) * Math.sin(angle) } };
    }
    case "collision": {
      const result = collisionResult(p);
      const u1 = Number(p.u1);
      const u2 = Number(p.u2);
      if (!(u1 > u2)) throw new RangeError("O carrinho 1 deve alcançar o carrinho 2 para ocorrer a colisão.");
      const gap = (u1 - u2) * result.time;
      const x10 = -gap / 2;
      const x20 = gap / 2;
      const collided = t >= result.time;
      const x1 = collided ? (x10 + u1 * result.time) + result.v1 * (t - result.time) : x10 + u1 * t;
      const x2 = collided ? (x20 + u2 * result.time) + result.v2 * (t - result.time) : x20 + u2 * t;
      const m1 = Number(p.mass1);
      const m2 = Number(p.mass2);
      const momentumAfter = m1 * result.v1 + m2 * result.v2;
      const kineticAfter = 0.5 * m1 * result.v1 ** 2 + 0.5 * m2 * result.v2 ** 2;
      return { time: t, duration, values: { x1, x2, v1: collided ? result.v1 : u1, v2: collided ? result.v2 : u2, momentum: collided ? momentumAfter : result.momentumBefore, kinetic: collided ? kineticAfter : result.kineticBefore, momentumBefore: result.momentumBefore, momentumAfter, kineticBefore: result.kineticBefore, kineticAfter, restitution: Number(p.restitution), collisionTime: result.time } };
    }
    case "spring": {
      const mass = positive(p.mass, "Massa");
      const k = positive(p.k, "Constante elástica");
      const amplitude = positive(p.amplitude, "Amplitude");
      const omega = Math.sqrt(k / mass);
      const x = amplitude * Math.cos(omega * t);
      const v = -amplitude * omega * Math.sin(omega * t);
      const potential = 0.5 * k * x ** 2;
      const kinetic = 0.5 * mass * v ** 2;
      return { time: t, duration, values: { x, v, a: -(omega ** 2) * x, kinetic, potential, total: kinetic + potential, omega, period: 2 * Math.PI / omega } };
    }
    case "wave": {
      const amplitude = positive(p.amplitude, "Amplitude");
      const wavelength = positive(p.wavelength, "Comprimento de onda");
      const frequency = positive(p.frequency, "Frequência");
      const xProbe = finite(p.xProbe, "Posição de medição");
      const phase = 2 * Math.PI * (xProbe / wavelength - frequency * t);
      return { time: t, duration, values: { y: amplitude * Math.sin(phase), waveSpeed: wavelength * frequency, wavelength, frequency, period: 1 / frequency, xProbe } };
    }
    case "ohm": {
      const voltage = finite(p.voltage, "Tensão");
      const resistance = positive(p.resistance, "Resistência");
      const current = voltage / resistance;
      return { time: 0, duration, values: { voltage, resistance, current, power: voltage * current } };
    }
    case "lens": {
      const f = finite(p.focalLength, "Distância focal");
      const doDistance = finite(p.objectDistance, "Distância do objeto");
      if (Math.abs(1 / f - 1 / doDistance) < 1e-10) {
        return { time: 0, duration, values: { f, objectDistance: doDistance, imageDistance: Infinity, magnification: -Infinity, image: "no infinito" } };
      }
      const imageDistance = 1 / (1 / f - 1 / doDistance);
      return { time: 0, duration, values: { f, objectDistance: doDistance, imageDistance, magnification: -imageDistance / doDistance, image: imageDistance > 0 ? "real" : "virtual" } };
    }
    case "calorimetry": {
      const m1 = positive(p.mass1, "Massa quente");
      const m2 = positive(p.mass2, "Massa fria");
      const hot = finite(p.temperature1, "Temperatura inicial quente");
      const cold = finite(p.temperature2, "Temperatura inicial fria");
      const c = 4186;
      const c1 = m1 * c;
      const c2 = m2 * c;
      const equilibrium = (c1 * hot + c2 * cold) / (c1 + c2);
      const tau = 1 / (positive(p.conductance, "Condutância térmica") * (1 / c1 + 1 / c2));
      const difference = (hot - cold) * Math.exp(-t / tau);
      const temperature1 = equilibrium + c2 / (c1 + c2) * difference;
      const temperature2 = equilibrium - c1 / (c1 + c2) * difference;
      return { time: t, duration, values: { temperature1, temperature2, equilibrium, tau, energyBalance: c1 * (temperature1 - hot) + c2 * (temperature2 - cold) } };
    }
    case "field": {
      const q1 = finite(p.q1, "Carga 1") * 1e-9;
      const q2 = finite(p.q2, "Carga 2") * 1e-9;
      const separation = positive(p.separation, "Distância entre cargas");
      const xProbe = finite(p.xProbe, "Posição de medição");
      const x1 = -separation / 2;
      const x2 = separation / 2;
      const r1 = xProbe - x1;
      const r2 = xProbe - x2;
      if (Math.abs(r1) < 1e-9 || Math.abs(r2) < 1e-9) {
        return { time: 0, duration, values: { xProbe, electricField: Infinity, q1: q1 * 1e9, q2: q2 * 1e9, singular: true } };
      }
      const electricField = COULOMB * (q1 * Math.sign(r1) / r1 ** 2 + q2 * Math.sign(r2) / r2 ** 2);
      return { time: 0, duration, values: { xProbe, electricField, q1: q1 * 1e9, q2: q2 * 1e9, singular: false } };
    }
    default: throw new RangeError(`Experimento desconhecido: ${id}.`);
  }
}

function line(id, p, time, yKey, yLabel, yUnit, count = 121) {
  const duration = durationFor(id, p);
  return {
    label: yLabel,
    points: Array.from({ length: count }, (_, i) => {
      const t = duration * i / (count - 1);
      const value = stateAt(id, p, t).values[yKey];
      return Number.isFinite(value) ? { x: t, y: value } : null;
    }),
    cursor: { x: time, y: stateAt(id, p, time).values[yKey] }
  };
}

export function graphFor(id, p, time = 0, chart = "") {
  if (["mru", "muv", "newton", "energy", "collision", "spring"].includes(id)) {
    const options = {
      mru: { x: "t", xu: "s", charts: { position: ["x", "Posição", "m"], velocity: ["v", "Velocidade", "m/s"] } },
      muv: { x: "t", xu: "s", charts: { position: ["x", "Posição", "m"], velocity: ["v", "Velocidade", "m/s"], acceleration: ["a", "Aceleração", "m/s²"] } },
      newton: { x: "t", xu: "s", charts: { position: ["x", "Posição", "m"], velocity: ["v", "Velocidade", "m/s"], acceleration: ["a", "Aceleração", "m/s²"] } },
      energy: { x: "t", xu: "s", charts: { energies: ["total", "Energia total", "J"], kinetic: ["kinetic", "Energia cinética", "J"], potential: ["potential", "Energia potencial", "J"] } },
      collision: { x: "t", xu: "s", charts: { position: ["x1", "Carrinho 1 · posição", "m"], velocity: ["v1", "Carrinho 1 · velocidade", "m/s"], momentum: ["momentum", "Momento linear total", "kg·m/s"] } },
      spring: { x: "t", xu: "s", charts: { position: ["x", "Posição", "m"], velocity: ["v", "Velocidade", "m/s"], energies: ["total", "Energia mecânica", "J"] } }
    }[id];
    const [key, label, unit] = options.charts[chart] || Object.values(options.charts)[0];
    const series = line(id, p, time, key, label, unit);
    return { xLabel: `Tempo (${options.xu})`, yLabel: `${label} (${unit})`, xMin: 0, xMax: durationFor(id, p), series: [series] };
  }
  if (id === "wave") {
    const wavelength = positive(p.wavelength, "Comprimento de onda");
    const amplitude = positive(p.amplitude, "Amplitude");
    const frequency = positive(p.frequency, "Frequência");
    const points = Array.from({ length: 181 }, (_, i) => {
      const x = -wavelength + 2 * wavelength * i / 180;
      return { x, y: amplitude * Math.sin(2 * Math.PI * (x / wavelength - frequency * time)) };
    });
    const state = stateAt(id, p, time).values;
    return { xLabel: "Posição (m)", yLabel: "Deslocamento (m)", xMin: -wavelength, xMax: wavelength, series: [{ label: "y(x,t)", points, cursor: { x: Number(p.xProbe), y: state.y } }] };
  }
  if (id === "ohm") {
    const voltage = finite(p.voltage, "Tensão");
    const resistance = positive(p.resistance, "Resistência");
    const maxVoltage = Math.max(1, Math.abs(voltage) * 1.5);
    const points = Array.from({ length: 101 }, (_, i) => {
      const x = maxVoltage * i / 100;
      return { x, y: x / resistance };
    });
    return { xLabel: "Tensão (V)", yLabel: "Corrente (A)", xMin: 0, xMax: maxVoltage, series: [{ label: `I=V/R · R=${resistance} Ω`, points, cursor: { x: voltage, y: voltage / resistance } }] };
  }
  if (id === "lens") {
    const f = finite(p.focalLength, "Distância focal");
    const doDistance = finite(p.objectDistance, "Distância do objeto");
    const lo = Math.max(0.05, Math.min(0.25 * f, doDistance));
    const hi = Math.max(lo + 0.1, 3 * f, doDistance);
    const points = Array.from({ length: 241 }, (_, i) => {
      const x = lo + (hi - lo) * i / 240;
      const denominator = 1 / f - 1 / x;
      if (Math.abs(denominator) < 0.035 / f) return null;
      const y = 1 / denominator;
      return Number.isFinite(y) && Math.abs(y) <= 12 * f ? { x, y } : null;
    });
    const state = stateAt(id, p).values;
    return { xLabel: "Distância do objeto (m)", yLabel: "Distância da imagem (m)", xMin: lo, xMax: hi, series: [{ label: "Equação das lentes delgadas", points, cursor: Number.isFinite(state.imageDistance) ? { x: doDistance, y: state.imageDistance } : null }] };
  }
  if (id === "calorimetry") {
    const duration = durationFor(id, p);
    const s1 = line(id, p, time, "temperature1", "Corpo inicialmente quente", "°C");
    const s2 = line(id, p, time, "temperature2", "Corpo inicialmente frio", "°C");
    const values = [Number(p.temperature1), Number(p.temperature2)];
    return { xLabel: "Tempo (s)", yLabel: "Temperatura (°C)", xMin: 0, xMax: duration, series: [s1, s2], reference: { y: stateAt(id, p).values.equilibrium, label: "Equilíbrio térmico" }, valueRange: [Math.min(...values) - 4, Math.max(...values) + 4] };
  }
  if (id === "field") {
    const separation = positive(p.separation, "Distância entre cargas");
    const q1 = finite(p.q1, "Carga 1") * 1e-9;
    const q2 = finite(p.q2, "Carga 2") * 1e-9;
    const x1 = -separation / 2;
    const x2 = separation / 2;
    const points = Array.from({ length: 241 }, (_, i) => {
      const x = -3 * separation + 6 * separation * i / 240;
      const r1 = x - x1;
      const r2 = x - x2;
      if (Math.abs(r1) < 0.045 * separation || Math.abs(r2) < 0.045 * separation) return null;
      return { x, y: COULOMB * (q1 * Math.sign(r1) / r1 ** 2 + q2 * Math.sign(r2) / r2 ** 2) };
    });
    const state = stateAt(id, p).values;
    return { xLabel: "Posição (m)", yLabel: "Campo elétrico Eₓ (N/C)", xMin: -3 * separation, xMax: 3 * separation, series: [{ label: "Superposição de duas cargas", points, cursor: Number.isFinite(state.electricField) ? { x: Number(p.xProbe), y: state.electricField } : null }] };
  }
  throw new RangeError(`Gráfico indisponível para ${id}.`);
}

export function sampleValues(id, p, time = 0) {
  const state = stateAt(id, p, time);
  return { ...state.values, time: state.time };
}

