function finite(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new RangeError(name + " deve ser um número finito.");
  return number;
}
function positive(value, name) {
  const number = finite(value, name);
  if (!(number > 0)) throw new RangeError(name + " deve ser maior que zero.");
  return number;
}

export function freeFallImpactTime(parameters) {
  const height = positive(parameters.height, "Altura inicial");
  const gravity = positive(parameters.gravity, "Aceleração gravitacional");
  return Math.sqrt((2 * height) / gravity);
}

export function freeFallAtTime(time, parameters) {
  const height = positive(parameters.height, "Altura inicial");
  const gravity = positive(parameters.gravity, "Aceleração gravitacional");
  const requestedTime = finite(time, "Tempo");
  if (requestedTime < 0) throw new RangeError("O tempo não pode ser negativo.");
  const impactTime = freeFallImpactTime({ height, gravity });
  const t = Math.min(requestedTime, impactTime);
  const displacement = Math.min(height, 0.5 * gravity * t * t);
  return {
    time: t,
    displacement,
    height: Math.max(0, height - displacement),
    velocity: gravity * t,
    acceleration: gravity,
    impactTime
  };
}
