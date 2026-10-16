export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Ponto aleatório em um anel ao redor de (cx, cy), entre rMin e rMax.
export function randomInRing(cx, cy, rMin, rMax) {
  const angle = Math.random() * Math.PI * 2;
  const r = rMin + Math.random() * (rMax - rMin);
  return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
}
