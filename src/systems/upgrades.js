import { WEAPONS, levelText } from '../data/weapons.js';
import { PASSIVES } from '../data/passives.js';

const MAX_SLOTS = 6;

function candidates(G, allowNew = true) {
  const P = G.player;
  const list = [];
  for (const w of P.weapons) {
    const evo = w.def.evolution;
    if (!w.evolved && evo && w.maxed && P.passives[evo.passive]) list.push({ type: 'evo', id: w.id, w: 100 });
  }
  // itens que você já tem pesam mais, como em Vampire Survivors
  for (const w of P.weapons) if (!w.maxed) list.push({ type: 'weapon', id: w.id, w: 30, owned: true });
  if (allowNew && P.weapons.length < MAX_SLOTS) {
    for (const id in WEAPONS) if (!P.weapon(id)) list.push({ type: 'weapon', id, w: 5 });
  }
  for (const id in P.passives) if (P.passives[id] < PASSIVES[id].max) list.push({ type: 'passive', id, w: 14, owned: true });
  if (allowNew && Object.keys(P.passives).length < MAX_SLOTS) {
    for (const id in PASSIVES) if (!(id in P.passives)) list.push({ type: 'passive', id, w: 3 });
  }
  return list;
}

function sample(list, n) {
  const out = [];
  const pool = list.slice();
  while (out.length < n && pool.length) {
    let total = 0;
    for (const c of pool) total += c.w;
    let r = Math.random() * total;
    let idx = 0;
    for (; idx < pool.length - 1; idx++) {
      r -= pool[idx].w;
      if (r <= 0) break;
    }
    out.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return out;
}

export function generateChoices(G, n = 3) {
  const list = candidates(G);
  if (!list.length) return [{ type: 'heal' }, { type: 'gold' }];
  const evos = list.filter((c) => c.type === 'evo').slice(0, n);
  const rest = list.filter((c) => c.type !== 'evo');
  const picks = sample(rest, n - evos.length);
  // garante pelo menos uma melhoria de arma que você já possui, se houver
  const ownedWeapon = rest.filter((c) => c.type === 'weapon' && c.owned);
  if (picks.length && ownedWeapon.length && !picks.some((c) => c.type === 'weapon' && c.owned)) {
    picks[picks.length - 1] = ownedWeapon[Math.floor(Math.random() * ownedWeapon.length)];
  }
  return [...evos, ...picks];
}

export function applyChoice(G, c) {
  const P = G.player;
  switch (c.type) {
    case 'weapon': {
      const w = P.weapon(c.id);
      if (w) {
        w.level++;
        w.recalc();
      } else {
        P.addWeapon(c.id);
      }
      break;
    }
    case 'passive':
      P.passives[c.id] = (P.passives[c.id] || 0) + 1;
      P.computeStats();
      break;
    case 'evo': {
      const w = P.weapon(c.id);
      w.evolved = true;
      w.recalc();
      w.timer = 0;
      G.onEvolve(w);
      break;
    }
    case 'heal':
      P.heal(40);
      break;
    case 'gold':
      G.run.gold += 30;
      break;
    default:
      break;
  }
}

export function describeChoice(G, c) {
  const P = G.player;
  switch (c.type) {
    case 'weapon': {
      const d = WEAPONS[c.id];
      const w = P.weapon(c.id);
      if (!w) return { icon: c.id, name: d.name, tag: 'NOVO!', tagColor: '#4ade80', desc: d.desc, kind: 'weapon' };
      const max = w.level + 1 >= d.maxLevel;
      return {
        icon: c.id, name: d.name, tag: max ? 'NÍVEL MÁX.' : `Nível ${w.level + 1}`, tagColor: max ? '#f472b6' : '#93c5fd',
        desc: levelText(d.levels[w.level - 1]), kind: 'weapon',
      };
    }
    case 'passive': {
      const d = PASSIVES[c.id];
      const lv = P.passives[c.id];
      return {
        icon: c.id, name: d.name, tag: lv ? `Nível ${lv + 1}` : 'NOVO!', tagColor: lv ? '#93c5fd' : '#4ade80', desc: d.desc, kind: 'passive',
      };
    }
    case 'evo': {
      const d = WEAPONS[c.id];
      return { icon: c.id, name: d.evolution.name, tag: 'EVOLUÇÃO', tagColor: '#fbbf24', desc: d.evolution.desc, kind: 'evo' };
    }
    case 'heal':
      return { icon: 'potion', name: 'Poção Restauradora', tag: '', desc: 'Recupera 40 de vida.', kind: 'item' };
    default:
      return { icon: 'coin', name: 'Saco de Ouro', tag: '', desc: '+30 de ouro.', kind: 'item' };
  }
}

// Baú: aplica melhorias automaticamente, priorizando evoluções.
export function openChest(G, count) {
  const rewards = [];
  for (let i = 0; i < count; i++) {
    const list = candidates(G, false);
    const evo = list.find((x) => x.type === 'evo');
    let c;
    if (evo) c = evo;
    else if (list.length) [c] = sample(list, 1);
    else c = { type: 'gold' };
    rewards.push(describeChoice(G, c));
    applyChoice(G, c);
  }
  return rewards;
}
