// Heróis jogáveis. `stats` soma aos atributos base do jogador (ver entities/player.js).
export const CHARACTERS = [
  {
    id: 'lyra', name: 'Lyra', title: 'A Maga Arcana', weapon: 'wand', cost: 0,
    desc: 'Todas as armas recarregam 10% mais rápido.',
    stats: { cooldown: -0.1 },
  },
  {
    id: 'bram', name: 'Bram', title: 'O Paladino', weapon: 'sword', cost: 0,
    desc: '+30 de vida máxima e +1 de armadura, mas é 10% mais lento.',
    stats: { maxHp: 30, armor: 1, speed: -0.1 },
  },
  {
    id: 'aria', name: 'Aria', title: 'A Caçadora', weapon: 'knife', cost: 0,
    desc: '+15% de velocidade e projéteis 15% mais rápidos.',
    stats: { speed: 0.15, projSpeed: 0.15 },
  },
  {
    id: 'kael', name: 'Kael', title: 'O Piromante', weapon: 'fireball', cost: 300,
    desc: '+15% de área e +10% de dano.',
    stats: { area: 0.15, might: 0.1 },
  },
  {
    id: 'nyx', name: 'Nyx', title: 'A Necromante', weapon: 'orbs', cost: 600,
    desc: '+20% de experiência, +40% de alcance de coleta e regenera 0,3 de vida/s.',
    stats: { growth: 0.2, magnet: 0.4, regen: 0.3 },
  },
  {
    id: 'volt', name: 'Volt', title: 'O Tempestuoso', weapon: 'lightning', cost: 1000,
    desc: '+1 projétil em todas as armas e +8% de crítico, mas tem 20 de vida a menos.',
    stats: { amount: 1, luck: 0.08, maxHp: -20 },
  },
];
