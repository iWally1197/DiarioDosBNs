const number = (value, label) => {
  const result = Number(value);
  if (!Number.isFinite(result)) throw new RangeError(`${label} precisa ser um número finito.`);
  return result;
};

function cartParameters(cart) {
  return {
    x0: number(cart.x0, "Posição inicial"),
    v: number(cart.v, "Velocidade")
  };
}

export function mruAt(cart, time) {
  const { x0, v } = cartParameters(cart);
  const t = number(time, "Tempo");
  if (t < 0) throw new RangeError("O tempo do experimento não pode ser negativo.");
  const displacement = v * t;
  return {
    t,
    x0,
    x: x0 + displacement,
    v,
    a: 0,
    displacement,
    distance: Math.abs(displacement),
    speed: Math.abs(v),
    direction: v > 0 ? "sentido positivo" : v < 0 ? "sentido negativo" : "repouso"
  };
}

export function mruMetrics(cart, startTime, endTime) {
  const start = number(startTime, "Instante inicial");
  const end = number(endTime, "Instante final");
  if (start < 0 || end < 0) throw new RangeError("Os instantes não podem ser negativos.");
  const first = mruAt(cart, start);
  const last = mruAt(cart, end);
  const interval = end - start;
  const displacement = last.x - first.x;
  const distance = Math.abs(displacement);
  return {
    startTime: start,
    endTime: end,
    interval,
    xStart: first.x,
    xEnd: last.x,
    displacement,
    distance,
    averageVelocity: interval === 0 ? 0 : displacement / interval,
    averageSpeed: interval === 0 ? 0 : distance / Math.abs(interval),
    acceleration: 0
  };
}

export function crossingTime(cart, sensorPosition) {
  const { x0, v } = cartParameters(cart);
  const xSensor = number(sensorPosition, "Posição do sensor");
  if (v === 0) return null;
  const time = (xSensor - x0) / v;
  return time >= 0 ? time : null;
}

export function meetEvents(carts, duration) {
  const limit = number(duration, "Duração");
  if (limit < 0) throw new RangeError("A duração não pode ser negativa.");
  const result = [];
  for (let i = 0; i < carts.length; i += 1) {
    for (let j = i + 1; j < carts.length; j += 1) {
      const a = cartParameters(carts[i]);
      const b = cartParameters(carts[j]);
      const relativeSpeed = a.v - b.v;
      if (relativeSpeed === 0) {
        if (a.x0 === b.x0) result.push({ first: carts[i].id, second: carts[j].id, type: "same-trajectory" });
        continue;
      }
      const time = (b.x0 - a.x0) / relativeSpeed;
      if (time >= 0 && time <= limit) {
        result.push({
          first: carts[i].id,
          second: carts[j].id,
          type: "meeting",
          time,
          position: a.x0 + a.v * time
        });
      }
    }
  }
  return result;
}

export function sampleTimes(duration, interval, maxRows = 240) {
  const end = number(duration, "Duração");
  const step = number(interval, "Intervalo de medição");
  const maximum = Math.max(2, Math.floor(number(maxRows, "Limite de linhas")));
  if (end < 0) throw new RangeError("A duração não pode ser negativa.");
  if (!(step > 0)) throw new RangeError("O intervalo de medição deve ser positivo.");
  const count = Math.min(maximum - 1, Math.floor(end / step));
  const times = Array.from({ length: count + 1 }, (_, index) => index * step);
  if (times.at(-1) < end - 1e-9 && times.length < maximum) times.push(end);
  else if (times.length === maximum) times[times.length - 1] = end;
  return [...new Set(times.map((time) => Number(time.toPrecision(12))))];
}

export function validateExperiment(config) {
  if (!config || typeof config !== "object") throw new TypeError("A configuração do experimento é inválida.");
  const duration = number(config.duration, "Duração");
  const sampleInterval = number(config.sampleInterval, "Intervalo de medição");
  if (!(duration > 0) || duration > 3600) throw new RangeError("A duração deve ficar entre 0 e 3.600 s.");
  if (!(sampleInterval > 0) || sampleInterval > duration) throw new RangeError("O intervalo de medição deve ser positivo e não maior que a duração.");
  if (!Array.isArray(config.carts) || config.carts.length < 1 || config.carts.length > 5) {
    throw new RangeError("O experimento precisa ter de um a cinco carrinhos.");
  }
  const ids = new Set();
  for (const cart of config.carts) {
    if (!cart?.id || ids.has(cart.id)) throw new RangeError("Cada carrinho precisa ter um identificador único.");
    ids.add(cart.id);
    cartParameters(cart);
  }
  return { duration, sampleInterval, carts: config.carts };
}

