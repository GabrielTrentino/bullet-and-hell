// Ondas: a partir de `at` segundos, inimigos do `pool` surgem a cada `interval`, até `max` na tela.
export const WAVES = [
  { at: 0, interval: 0.9, batch: 3, max: 35, pool: { bat: 5, skeleton: 1 } },
  { at: 40, interval: 0.85, batch: 3, max: 55, pool: { bat: 4, skeleton: 3 } },
  { at: 90, interval: 0.8, batch: 4, max: 75, pool: { bat: 3, skeleton: 3, slime: 2 } },
  { at: 150, interval: 0.8, batch: 4, max: 95, pool: { skeleton: 3, slime: 2, zombie: 3, bat: 2 } },
  { at: 210, interval: 0.8, batch: 4, max: 110, pool: { zombie: 3, ghost: 3, skeleton: 2, eye: 1 } },
  { at: 270, interval: 0.75, batch: 5, max: 130, pool: { ghost: 3, imp: 3, zombie: 2, eye: 1 } },
  { at: 330, interval: 0.7, batch: 5, max: 150, pool: { imp: 3, zombie: 3, slime: 2, brute: 1, eye: 1 } },
  { at: 420, interval: 0.65, batch: 6, max: 170, pool: { skeleton: 3, ghost: 3, brute: 1, eye: 2, imp: 2 } },
  { at: 510, interval: 0.6, batch: 6, max: 190, pool: { zombie: 3, brute: 2, imp: 3, eye: 2 } },
  { at: 600, interval: 0.55, batch: 7, max: 220, pool: { ghost: 3, brute: 2, imp: 3, eye: 2, slime: 2 } },
  { at: 690, interval: 0.5, batch: 7, max: 250, pool: { brute: 3, imp: 4, eye: 2, ghost: 2 } },
  { at: 780, interval: 0.45, batch: 8, max: 280, pool: { brute: 3, imp: 4, eye: 3, zombie: 3, ghost: 2 } },
  { at: 900, interval: 0.6, batch: 5, max: 160, pool: { skeleton: 4, ghost: 2, imp: 2 } },
];

// Eventos especiais: enxames que atravessam a tela, cercos e chefes.
export const EVENTS = [
  { at: 50, type: 'swarm', enemy: 'bat', count: 24 },
  { at: 140, type: 'ring', enemy: 'zombie', count: 32 },
  { at: 200, type: 'swarm', enemy: 'bat', count: 40 },
  { at: 240, type: 'boss', enemy: 'reaper', mult: 1 },
  { at: 300, type: 'swarm', enemy: 'imp', count: 34 },
  { at: 380, type: 'ring', enemy: 'skeleton', count: 44 },
  { at: 480, type: 'boss', enemy: 'demon', mult: 1 },
  { at: 560, type: 'swarm', enemy: 'ghost', count: 40 },
  { at: 620, type: 'ring', enemy: 'brute', count: 18 },
  { at: 660, type: 'boss', enemy: 'reaper', mult: 2.2 },
  { at: 720, type: 'swarm', enemy: 'imp', count: 60 },
  { at: 780, type: 'boss', enemy: 'demon', mult: 1.8 },
  { at: 830, type: 'ring', enemy: 'eye', count: 26 },
  { at: 860, type: 'swarm', enemy: 'bat', count: 80 },
  { at: 900, type: 'boss', enemy: 'lich', mult: 1 },
];

export const RUN_LENGTH = 900;
