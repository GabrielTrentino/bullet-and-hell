import { rand, TAU, dist2 } from '../core/utils.js';
import { gemSprite, pickupSprite, glow, GEM_COLORS } from '../render/sprites.js';

const MAX_PICKUPS = 450;

export function gemTier(v) {
  if (v >= 40) return 3;
  if (v >= 10) return 2;
  if (v >= 3) return 1;
  return 0;
}

export function dropGem(G, x, y, value) {
  if (G.pickups.length >= MAX_PICKUPS) {
    // junta a experiência na gema mais próxima para não sobrecarregar a tela
    let best = null;
    let bd = Infinity;
    for (const p of G.pickups) {
      if (p.kind !== 'gem') continue;
      const d = dist2(x, y, p.x, p.y);
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
    if (best) {
      best.value += value;
      best.tier = gemTier(best.value);
      return;
    }
  }
  G.pickups.push(makePickup('gem', x, y, { value, tier: gemTier(value) }));
}

function makePickup(kind, x, y, extra = {}) {
  const a = rand(0, TAU);
  const s = rand(10, 50);
  return { kind, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, attract: false, speed: 0, bob: rand(0, TAU), alive: true, value: 1, ...extra };
}

export function spawnPickup(G, kind, x, y, extra = {}) {
  if (kind === 'bigGem') return dropGem(G, x, y, 25);
  if (kind === 'coin') extra.value ??= 1 + Math.floor(Math.random() * 3);
  if (kind === 'coinbag') extra.value ??= 15;
  G.pickups.push(makePickup(kind, x, y, extra));
}

function collect(G, p) {
  const P = G.player;
  const r = G.run;
  p.alive = false;
  switch (p.kind) {
    case 'gem': {
      P.addXp(p.value);
      r.gemCombo = r.gemComboT > 0 ? r.gemCombo + 1 : 0;
      r.gemComboT = 0.45;
      G.sound.play('gem', 520 * Math.pow(2, Math.min(r.gemCombo, 24) / 24));
      break;
    }
    case 'coin':
    case 'coinbag': {
      const v = Math.round(p.value * P.stats.greed);
      r.gold += v;
      G.fx.text(p.x, p.y - 10, `+${v}`, false, '#fbbf24');
      G.sound.play('coin');
      break;
    }
    case 'potion':
      P.heal(30);
      G.fx.burst(P.x, P.y, '#4ade80', 14, 100, 0.6, 3, { add: true });
      G.sound.play('heal');
      break;
    case 'magnet':
      for (const o of G.pickups) if (o.kind === 'gem') o.attract = true;
      G.fx.ring(P.x, P.y, 10, 300, 0.5, '#f87171', 4);
      G.sound.play('heal');
      break;
    case 'bomb':
      G.holyBlast();
      break;
    case 'chest':
      G.openChestPickup(p.big);
      break;
    default:
      break;
  }
}

export function updatePickups(G, dt) {
  const P = G.player;
  const mr = P.magnetRange;
  const mr2 = mr * mr;
  const grab = P.radius + 10;
  if (G.run.gemComboT > 0) G.run.gemComboT -= dt;
  for (const p of G.pickups) {
    if (!p.alive) continue;
    p.bob += dt * 4;
    const drag = Math.max(0, 1 - dt * 6);
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= drag;
    p.vy *= drag;
    const dx = P.x - p.x;
    const dy = P.y - p.y;
    const d2 = dx * dx + dy * dy;
    if (!p.attract && p.kind !== 'chest' && d2 < mr2) p.attract = true;
    if (p.attract) {
      p.speed = Math.min(p.speed + 1100 * dt, 820);
      const d = Math.sqrt(d2) || 1;
      p.x += (dx / d) * p.speed * dt;
      p.y += (dy / d) * p.speed * dt;
    }
    if (d2 < grab * grab) collect(G, p);
  }
  G.pickups = G.pickups.filter((p) => p.alive);
}

export function renderPickups(G) {
  const c = G.ctx;
  const v = G.view(30);
  for (const p of G.pickups) {
    if (p.x < v.x0 || p.x > v.x1 || p.y < v.y0 || p.y > v.y1) continue;
    const bob = Math.sin(p.bob) * 2;
    if (p.kind === 'gem') {
      if (p.tier >= 2) {
        c.globalCompositeOperation = 'lighter';
        G.blit(glow(GEM_COLORS[p.tier]), p.x, p.y + bob, 0.45, false, 0.5);
        c.globalCompositeOperation = 'source-over';
      }
      G.blit(gemSprite(p.tier), p.x, p.y + bob, p.tier >= 2 ? 1.2 : 1);
    } else {
      if (p.kind === 'chest' || p.kind === 'bomb') {
        c.globalCompositeOperation = 'lighter';
        G.blit(glow('#fbbf24'), p.x, p.y, 0.9 + Math.sin(p.bob) * 0.1, false, 0.55);
        c.globalCompositeOperation = 'source-over';
      }
      G.blit(pickupSprite(p.kind), p.x, p.y + bob, p.kind === 'chest' ? 1.3 : 1.1);
    }
  }
}
