import { WEAPONS } from '../data/weapons.js';
import { rand, TAU, shuffle, dist2 } from '../core/utils.js';
import { rgba } from '../render/sprites.js';

export const AURA_RADIUS = 58;

export class WeaponInstance {
  constructor(id, t = 0) {
    this.id = id;
    this.def = WEAPONS[id];
    this.level = 1;
    this.evolved = false;
    this.timer = 0.35;
    this.dealt = 0;
    this.kills = 0;
    this.acquired = t;
    this.tick = 0;
    this.pulse = 0;
    this.orbs = [];
    this.recalc();
  }

  recalc() {
    const s = { ...this.def.base };
    const add = (ch) => {
      for (const k in ch) s[k] = (s[k] || 0) + ch[k];
    };
    for (let i = 0; i < this.level - 1; i++) add(this.def.levels[i]);
    if (this.evolved) add(this.def.evolution.changes);
    this.s = s;
  }

  get name() {
    return this.evolved ? this.def.evolution.name : this.def.name;
  }

  get color() {
    return this.evolved ? this.def.evolution.color : this.def.color;
  }

  get maxed() {
    return this.level >= this.def.maxLevel;
  }
}

// Valores efetivos já combinados com os atributos do jogador.
export function eff(w, G) {
  const P = G.player.stats;
  const s = w.s;
  return {
    dmg: s.damage * P.might,
    cd: Math.max(0.08, s.cooldown * P.cooldown),
    amt: Math.max(1, Math.round((s.amount || 1) + P.amount)),
    area: (s.area || 1) * P.area,
    dur: (s.duration || 1) * P.duration,
    spd: (s.speed || 0) * P.projSpeed,
    pierce: s.pierce || 0,
    kb: s.knockback ?? 1,
  };
}

function nearestEnemies(G, x, y, n, maxR = 700) {
  const list = [];
  const r2 = maxR * maxR;
  for (const e of G.enemies) {
    if (!e.alive) continue;
    const d = dist2(x, y, e.x, e.y);
    if (d < r2) list.push([d, e]);
  }
  list.sort((a, b) => a[0] - b[0]);
  return list.slice(0, n).map((p) => p[1]);
}

const BEHAVIORS = {
  wand: {
    fire(w, G, e) {
      const P = G.player;
      const targets = nearestEnemies(G, P.x, P.y, e.amt);
      if (!targets.length) return false;
      for (let i = 0; i < e.amt; i++) {
        const t = targets[i % targets.length];
        G.schedule(i * 0.08, () => {
          const a = Math.atan2(t.y - P.y, t.x - P.x) + (i >= targets.length ? rand(-0.15, 0.15) : 0);
          G.addProjectile({
            kind: 'bolt', x: P.x, y: P.y - 6, vx: Math.cos(a) * e.spd, vy: Math.sin(a) * e.spd,
            r: 7 * Math.sqrt(e.area), dmg: e.dmg, pierce: e.pierce, life: e.dur, w, color: w.color,
          });
          G.sound.play('shoot');
        });
      }
      return true;
    },
  },

  knife: {
    fire(w, G, e) {
      const P = G.player;
      let fx = P.facing.x;
      let fy = P.facing.y;
      // mira assistida: inimigo mais próximo dentro de um cone de ~55° à frente
      let best = null;
      let bd = 520 * 520;
      for (const en of G.enemies) {
        if (!en.alive) continue;
        const dx = en.x - P.x;
        const dy = en.y - P.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= bd) continue;
        const d = Math.sqrt(d2) || 1;
        if ((dx * fx + dy * fy) / d > 0.57) {
          bd = d2;
          best = [dx / d, dy / d];
        }
      }
      if (best) [fx, fy] = best;
      for (let i = 0; i < e.amt; i++) {
        G.schedule(i * 0.05, () => {
          const off = (i - (e.amt - 1) / 2) * 9;
          const a = Math.atan2(fy, fx) + rand(-0.05, 0.05);
          G.addProjectile({
            kind: 'knife', x: P.x - fy * off, y: P.y + fx * off - 4, vx: Math.cos(a) * e.spd, vy: Math.sin(a) * e.spd,
            angle: a, r: 7 * Math.sqrt(e.area), dmg: e.dmg, pierce: e.pierce, life: 0.9 * e.dur, w, color: w.color,
          });
          G.sound.play('knife');
        });
      }
      return true;
    },
  },

  sword: {
    fire(w, G, e) {
      const P = G.player;
      for (let i = 0; i < e.amt; i++) {
        G.schedule(i * 0.16, () => {
          const side = i % 2 === 0 ? P.faceSign : -P.faceSign;
          G.addProjectile({
            kind: 'slash', side, rx: 84 * e.area, ry: 36 * e.area, ox: side * 54 * e.area, x: P.x, y: P.y,
            life: 0.22, lifeMax: 0.22, dmg: e.dmg, kb: e.kb, w, color: w.color, pierce: Infinity,
          });
          G.sound.play('slash');
        });
      }
      return true;
    },
  },

  fireball: {
    fire(w, G, e) {
      const P = G.player;
      if (w.s.meteor) {
        const targets = shuffle(G.enemiesInView());
        if (!targets.length) return false;
        for (let i = 0; i < e.amt; i++) {
          const t = targets[i % targets.length];
          G.schedule(i * 0.12, () => {
            G.addProjectile({ kind: 'meteor', x: t.x, y: t.y, fall: 0.55, radius: 70 * e.area, dmg: e.dmg * 1.4, w, color: w.color, life: 2 });
          });
        }
        G.sound.play('fire');
        return true;
      }
      const targets = nearestEnemies(G, P.x, P.y, 6);
      for (let i = 0; i < e.amt; i++) {
        const t = targets.length ? targets[(Math.random() * targets.length) | 0] : null;
        const a = t ? Math.atan2(t.y - P.y, t.x - P.x) + rand(-0.12, 0.12) : rand(0, TAU);
        G.schedule(i * 0.1, () => {
          G.addProjectile({
            kind: 'fireball', x: P.x, y: P.y - 6, vx: Math.cos(a) * e.spd, vy: Math.sin(a) * e.spd,
            r: 9 * Math.sqrt(e.area), dmg: e.dmg, life: e.dur, explodeR: 58 * e.area, w, color: w.color, pierce: 0,
          });
        });
      }
      G.sound.play('fire');
      return true;
    },
  },

  orbs: {
    addDuration: true,
    update(w, G) {
      w.orbs = w.orbs.filter((p) => p.alive);
      // forma permanente: refaz o anel se a quantidade mudou
      if (w.s.permanent && w.orbs.length !== eff(w, G).amt) w.timer = 0;
    },
    fire(w, G, e) {
      for (const p of w.orbs) p.alive = false;
      w.orbs = [];
      const base = rand(0, TAU);
      for (let i = 0; i < e.amt; i++) {
        const p = G.addProjectile({
          kind: 'orb', angle: base + (i / e.amt) * TAU, orbitR: 78 * e.area, angSpeed: e.spd,
          r: 10 * Math.sqrt(e.area), scale: Math.sqrt(e.area), dmg: e.dmg, life: w.s.permanent ? Infinity : e.dur,
          w, color: w.color, pierce: Infinity, rehit: 0.45, x: G.player.x, y: G.player.y,
        });
        w.orbs.push(p);
      }
      G.sound.play('orbs');
      return true;
    },
    cooldown(w, e) {
      return w.s.permanent ? 9999 : e.cd + e.dur;
    },
  },

  aura: {
    continuous: true,
    update(w, G, dt) {
      w.pulse = Math.max(0, w.pulse - dt * 3);
      w.tick -= dt;
      if (w.tick > 0) return;
      const e = eff(w, G);
      w.tick = e.cd;
      w.pulse = 1;
      const P = G.player;
      const R = AURA_RADIUS * e.area;
      for (const en of G.queryEnemies(P.x, P.y, R + 30)) {
        if (!en.alive) continue;
        const dx = en.x - P.x;
        const dy = en.y - P.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d > R + en.radius) continue;
        G.hitEnemy(en, e.dmg, w, dx / d, dy / d, e.kb);
        if (w.s.slow) {
          en.slow = Math.max(en.slow, 0.8);
          en.slowAmt = Math.max(en.slowAmt, w.s.slow);
        }
      }
    },
  },

  lightning: {
    fire(w, G, e) {
      const targets = shuffle(G.enemiesInView());
      if (!targets.length) return false;
      const n = Math.min(e.amt, targets.length);
      for (let i = 0; i < n; i++) {
        const t = targets[i];
        G.schedule(i * 0.07, () => {
          if (!t.alive) return;
          strike(G, w, e, t.x, t.y);
          let last = t;
          const hit = new Set([t]);
          for (let c = 0; c < (w.s.chain || 0); c++) {
            let best = null;
            let bd = 170 * 170;
            for (const o of G.queryEnemies(last.x, last.y, 170)) {
              if (!o.alive || hit.has(o)) continue;
              const d = dist2(last.x, last.y, o.x, o.y);
              if (d < bd) {
                bd = d;
                best = o;
              }
            }
            if (!best) break;
            G.fx.bolt(last.x, last.y, best.x, best.y, w.color, 2);
            G.hitEnemy(best, e.dmg * 0.7, w, 0, 0, 0);
            hit.add(best);
            last = best;
          }
        });
      }
      return true;
    },
  },

  boomerang: {
    fire(w, G, e) {
      const P = G.player;
      const t = nearestEnemies(G, P.x, P.y, 1)[0];
      const base = t ? Math.atan2(t.y - P.y, t.x - P.x) : Math.atan2(P.facing.y, P.facing.x);
      for (let i = 0; i < e.amt; i++) {
        G.schedule(i * 0.12, () => {
          const a = base + (i - (e.amt - 1) / 2) * 0.35;
          G.addProjectile({
            kind: 'boomerang', x: P.x, y: P.y - 4, dx: Math.cos(a), dy: Math.sin(a), speed: e.spd, decel: e.spd * 1.35,
            spin: 0, r: 13 * e.area, scale: e.area, dmg: e.dmg, life: e.dur * 2, w, color: w.color, pierce: Infinity, rehit: 0.35,
          });
          G.sound.play('boomerang');
        });
      }
      return true;
    },
  },

  frost: {
    fire(w, G, e) {
      const P = G.player;
      G.addProjectile({
        kind: 'nova', x: P.x, y: P.y, radius: 0, maxR: 155 * e.area, grow: 0.45, life: 0.6, lifeMax: 0.6,
        dmg: e.dmg, slow: Math.min(1, w.s.slow), slowDur: e.dur, w, color: w.color, pierce: Infinity,
      });
      G.sound.play('frost');
      return true;
    },
  },
};

function strike(G, w, e, x, y) {
  const R = 38 * e.area;
  G.fx.bolt(x + rand(-50, 50), y - 520, x, y, w.color, 3);
  G.fx.ring(x, y, 4, R, 0.3, w.color, 4);
  G.fx.burst(x, y, w.color, 10, 160, 0.35, 3, { add: true });
  for (const en of G.queryEnemies(x, y, R + 30)) {
    if (!en.alive) continue;
    if (dist2(x, y, en.x, en.y) < (R + en.radius) ** 2) G.hitEnemy(en, e.dmg, w, 0, 0, 0.3);
  }
  G.breakBraziersAt(x, y, R);
  G.sound.play('zap');
}

export function updateWeapons(G, dt) {
  for (const w of G.player.weapons) {
    const B = BEHAVIORS[w.id];
    if (B.update) B.update(w, G, dt);
    if (B.continuous) continue;
    w.timer -= dt;
    if (w.timer > 0) continue;
    const e = eff(w, G);
    const fired = B.fire(w, G, e);
    if (fired === false) w.timer = 0.15;
    else w.timer = B.cooldown ? B.cooldown(w, e) : e.cd;
  }
}

// Efeitos desenhados embaixo das entidades (a aura).
export function renderWeaponsUnder(G) {
  const P = G.player;
  const c = G.ctx;
  for (const w of P.weapons) {
    if (w.id !== 'aura') continue;
    const e = eff(w, G);
    const R = AURA_RADIUS * e.area;
    const col = w.color;
    const pulse = w.pulse;
    G.setWorld();
    c.globalCompositeOperation = 'lighter';
    const gr = c.createRadialGradient(P.x, P.y, R * 0.15, P.x, P.y, R);
    gr.addColorStop(0, rgba(col, 0.02));
    gr.addColorStop(0.75, rgba(col, 0.08 + pulse * 0.1));
    gr.addColorStop(1, rgba(col, 0));
    c.fillStyle = gr;
    c.beginPath();
    c.arc(P.x, P.y, R, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(col, 0.22 + pulse * 0.35);
    c.lineWidth = 2;
    c.beginPath();
    c.arc(P.x, P.y, R * (0.96 + pulse * 0.04), 0, TAU);
    c.stroke();
    const t = G.time;
    c.fillStyle = rgba(col, 0.6);
    for (let i = 0; i < 6; i++) {
      const a = t * 0.8 + (i / 6) * TAU;
      c.beginPath();
      c.arc(P.x + Math.cos(a) * R * 0.9, P.y + Math.sin(a) * R * 0.9, 2, 0, TAU);
      c.fill();
    }
    c.globalCompositeOperation = 'source-over';
  }
}
