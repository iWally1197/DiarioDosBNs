export const FARADAY_REFERENCE = {
  title: "OpenStax, University Physics Volume 2, seção 13.1: Faraday’s Law",
  url: "https://openstax.org/books/university-physics-volume-2/pages/13-1-faradays-law"
};

const finite = (value, name) => {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new RangeError(`${name} deve ser finito.`);
  return number;
};

export function normalizeFaradayParameters(input = {}) {
  const turns = finite(input.turns ?? 20, "Número de espiras");
  const magneticField = finite(input.magneticField ?? 0.3, "Campo magnético");
  const area = finite(input.area ?? 0.25, "Área da espira");
  const frequency = finite(input.frequency ?? 0.5, "Frequência");
  const phaseDegrees = finite(input.phaseDegrees ?? 0, "Fase");
  if (!Number.isInteger(turns) || turns < 1 || turns > 1000) throw new RangeError("O número de espiras deve ser inteiro entre 1 e 1000.");
  if (magneticField < 0 || magneticField > 10) throw new RangeError("O campo magnético deve estar entre 0 e 10 T.");
  if (area <= 0 || area > 100) throw new RangeError("A área deve ser maior que 0 e não pode exceder 100 m².");
  if (frequency < 0 || frequency > 1000) throw new RangeError("A frequência deve estar entre 0 e 1000 Hz.");
  return { turns, magneticField, area, frequency, phaseDegrees };
}

export function faradayState(input, timeSeconds) {
  const p = normalizeFaradayParameters(input);
  const time = finite(timeSeconds, "Tempo");
  const omega = 2 * Math.PI * p.frequency;
  const angle = omega * time + p.phaseDegrees * Math.PI / 180;
  const fluxPerTurn = p.magneticField * p.area * Math.cos(angle);
  const fluxLinkage = p.turns * fluxPerTurn;
  const emf = p.turns * p.magneticField * p.area * omega * Math.sin(angle);
  return {
    time,
    omega,
    angle,
    angleDegrees: angle * 180 / Math.PI,
    fluxPerTurn,
    fluxLinkage,
    emf
  };
}
