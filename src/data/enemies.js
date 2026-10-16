// Inimigos. `ai` define o comportamento (systems/ai.js); `sprite` reusa o desenho de outro tipo.
export const ENEMIES = {
  bat: { name: 'Morcego', hp: 6, speed: 95, damage: 5, radius: 10, xp: 1, ai: 'bat', blood: '#a855f7', anim: 10 },
  skeleton: { name: 'Esqueleto', hp: 16, speed: 62, damage: 8, radius: 11, xp: 2, blood: '#e7e5e4' },
  zombie: { name: 'Carniçal', hp: 38, speed: 42, damage: 12, radius: 12, xp: 3, knockRes: 0.3, blood: '#65a30d', anim: 4 },
  ghost: { name: 'Espectro', hp: 22, speed: 80, damage: 9, radius: 12, xp: 3, ai: 'ghost', alpha: 0.82, blood: '#c7d2fe' },
  slime: { name: 'Gosma', hp: 28, speed: 48, damage: 8, radius: 13, xp: 3, split: 'slimelet', blood: '#84cc16', anim: 5 },
  slimelet: { name: 'Gosminha', hp: 8, speed: 75, damage: 5, radius: 8, xp: 1, sprite: 'slime', scale: 0.6, blood: '#84cc16', anim: 7 },
  eye: {
    name: 'Olho Vigia', hp: 30, speed: 55, damage: 8, radius: 13, xp: 5, ai: 'ranged', blood: '#e11d48',
    shoot: { cd: 3, speed: 165 },
  },
  imp: { name: 'Diabrete', hp: 14, speed: 125, damage: 9, radius: 10, xp: 2, blood: '#ef4444', anim: 12 },
  brute: { name: 'Ogro', hp: 180, speed: 38, damage: 22, radius: 22, xp: 15, knockRes: 0.8, blood: '#c2410c', anim: 4 },
  reaper: { name: 'O Ceifador', boss: true, hp: 1600, speed: 72, damage: 25, radius: 30, xp: 200, ai: 'reaper', blood: '#6366f1', anim: 3 },
  demon: { name: 'Lorde Demônio', boss: true, hp: 4200, speed: 55, damage: 30, radius: 38, xp: 400, ai: 'demon', blood: '#ef4444', anim: 3 },
  lich: { name: 'O Rei Lich', boss: true, final: true, hp: 12000, speed: 48, damage: 35, radius: 32, xp: 1000, ai: 'lich', blood: '#4ade80', anim: 3 },
};
