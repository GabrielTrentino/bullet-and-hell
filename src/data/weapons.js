import { fmtNum } from '../core/utils.js';

// Armas como dados. `levels[i]` é o incremento ao subir para o nível i + 2.
// A evolução fica disponível com a arma no nível máximo e a passiva indicada.
// O comportamento de cada arma está em systems/weapons.js.
export const WEAPONS = {
  wand: {
    name: 'Varinha Mágica', desc: 'Dispara projéteis arcanos no inimigo mais próximo.', color: '#818cf8', maxLevel: 8,
    base: { damage: 10, cooldown: 1.1, amount: 1, speed: 380, pierce: 0, area: 1, duration: 2 },
    levels: [{ amount: 1 }, { cooldown: -0.15 }, { amount: 1 }, { damage: 8 }, { amount: 1 }, { pierce: 1 }, { damage: 10 }],
    evolution: {
      passive: 'cooldown', name: 'Cajado do Arquimago', color: '#e879f9',
      desc: 'Uma torrente incessante de energia arcana que atravessa inimigos.',
      changes: { cooldown: -0.55, amount: 2, damage: 6, pierce: 1 },
    },
  },
  knife: {
    name: 'Adagas', desc: 'Arremessa adagas rápidas na direção em que você olha.', color: '#e2e8f0', maxLevel: 8,
    base: { damage: 7, cooldown: 0.85, amount: 1, speed: 580, pierce: 0, area: 1, duration: 1 },
    levels: [{ amount: 1 }, { damage: 5 }, { amount: 1 }, { pierce: 1 }, { amount: 1 }, { damage: 5 }, { pierce: 1 }],
    evolution: {
      passive: 'speed', name: 'Tempestade de Lâminas', color: '#c4b5fd',
      desc: 'Uma chuva contínua de lâminas que perfuram tudo.',
      changes: { cooldown: -0.7, amount: 2, pierce: 2 },
    },
  },
  sword: {
    name: 'Lâmina Crescente', desc: 'Golpe horizontal largo que atinge vários inimigos.', color: '#f1f5f9', maxLevel: 8,
    base: { damage: 15, cooldown: 1.3, amount: 1, area: 1, knockback: 1 },
    levels: [{ amount: 1 }, { damage: 6 }, { area: 0.15 }, { damage: 6 }, { area: 0.15 }, { damage: 8 }, { cooldown: -0.25 }],
    evolution: {
      passive: 'maxHp', name: 'Ceifadora Carmesim', color: '#f43f5e',
      desc: 'Cortes enormes que roubam vida dos inimigos.',
      changes: { damage: 20, area: 0.35, lifesteal: 0.12 },
    },
  },
  fireball: {
    name: 'Bola de Fogo', desc: 'Projétil lento que explode e queima uma área.', color: '#f97316', maxLevel: 8,
    base: { damage: 16, cooldown: 2.0, amount: 1, speed: 250, area: 1, duration: 3 },
    levels: [{ damage: 8 }, { amount: 1 }, { area: 0.2 }, { damage: 10 }, { cooldown: -0.3 }, { amount: 1 }, { area: 0.25 }],
    evolution: {
      passive: 'area', name: 'Chuva de Meteoros', color: '#fb923c',
      desc: 'Meteoros caem do céu sobre os inimigos.',
      changes: { damage: 25, amount: 3, area: 0.4, meteor: 1 },
    },
  },
  orbs: {
    name: 'Orbes Sombrios', desc: 'Orbes que giram ao seu redor e ferem quem tocam.', color: '#a855f7', maxLevel: 8,
    base: { damage: 9, cooldown: 3.0, amount: 2, speed: 3.2, area: 1, duration: 3 },
    levels: [{ amount: 1 }, { damage: 5 }, { duration: 0.6 }, { amount: 1 }, { area: 0.2 }, { damage: 6 }, { speed: 0.8 }],
    evolution: {
      passive: 'duration', name: 'Eclipse Eterno', color: '#c084fc',
      desc: 'Os orbes nunca desaparecem.',
      changes: { permanent: 1, damage: 10, amount: 1 },
    },
  },
  aura: {
    name: 'Aura Sagrada', desc: 'Fere continuamente os inimigos ao seu redor.', color: '#fbbf24', maxLevel: 8,
    base: { damage: 4, cooldown: 0.6, area: 1, knockback: 0.35 },
    levels: [{ area: 0.2 }, { damage: 2 }, { cooldown: -0.08 }, { area: 0.2 }, { damage: 3 }, { area: 0.2 }, { damage: 3 }],
    evolution: {
      passive: 'armor', name: 'Santuário', color: '#fde68a',
      desc: 'Uma aura imensa que também desacelera os inimigos.',
      changes: { area: 0.4, damage: 5, slow: 0.45 },
    },
  },
  lightning: {
    name: 'Relâmpago', desc: 'Raios caem sobre inimigos aleatórios na tela.', color: '#fde047', maxLevel: 8,
    base: { damage: 18, cooldown: 2.4, amount: 2, area: 1 },
    levels: [{ amount: 1 }, { damage: 8 }, { area: 0.25 }, { amount: 1 }, { cooldown: -0.4 }, { damage: 10 }, { amount: 1 }],
    evolution: {
      passive: 'luck', name: 'Fúria da Tempestade', color: '#67e8f9',
      desc: 'Cada raio salta em cadeia para inimigos próximos.',
      changes: { chain: 3, amount: 2, damage: 10 },
    },
  },
  boomerang: {
    name: 'Foice Bumerangue', desc: 'Vai e volta, atravessando tudo pelo caminho.', color: '#cbd5e1', maxLevel: 8,
    base: { damage: 12, cooldown: 1.6, amount: 1, speed: 480, area: 1, duration: 2.5 },
    levels: [{ damage: 6 }, { amount: 1 }, { area: 0.2 }, { speed: 80 }, { amount: 1 }, { damage: 8 }, { area: 0.2 }],
    evolution: {
      passive: 'might', name: 'Lua Sangrenta', color: '#ef4444',
      desc: 'Foices enormes e ferozes cortam a horda.',
      changes: { amount: 2, damage: 15, area: 0.4 },
    },
  },
  frost: {
    name: 'Nova Glacial', desc: 'Onda de gelo que fere e desacelera os inimigos.', color: '#7dd3fc', maxLevel: 8,
    base: { damage: 8, cooldown: 3.0, area: 1, duration: 2, slow: 0.5 },
    levels: [{ damage: 5 }, { area: 0.2 }, { cooldown: -0.4 }, { duration: 0.8 }, { area: 0.2 }, { damage: 8 }, { cooldown: -0.4 }],
    evolution: {
      passive: 'regen', name: 'Zero Absoluto', color: '#e0f2fe',
      desc: 'A onda congela completamente os inimigos.',
      changes: { slow: 0.5, damage: 15, area: 0.3 },
    },
  },
};

const LABELS = {
  damage: (v) => `+${v} de dano`,
  cooldown: (v) => `Recarga ${v < 0 ? '−' : '+'}${fmtNum(Math.abs(v))}s`,
  amount: (v) => `+${v} ${v > 1 ? 'projéteis' : 'projétil'}`,
  pierce: (v) => `+${v} ${v > 1 ? 'perfurações' : 'perfuração'}`,
  area: (v) => `+${Math.round(v * 100)}% de área`,
  speed: () => 'Mais velocidade',
  duration: (v) => `+${fmtNum(v)}s de duração`,
};

export function levelText(changes) {
  return Object.entries(changes)
    .map(([k, v]) => (LABELS[k] ? LABELS[k](v) : ''))
    .filter(Boolean)
    .join(' · ');
}
