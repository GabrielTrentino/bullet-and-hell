import { WAVES, EVENTS } from '../data/waves.js';
import { ENEMIES } from '../data/enemies.js';
import { rand, TAU, weightedPick } from '../core/utils.js';

export class Spawner {
  constructor(G) {
    this.G = G;
    this.timer = 0.8;
    this.eventIdx = 0;
  }

  wave() {
    const t = this.G.run.t;
    let w = WAVES[0];
    for (const x of WAVES) {
      if (t >= x.at) w = x;
      else break;
    }
    return w;
  }

  // Vida dos inimigos cresce com o tempo de partida.
  hpMult() {
    const t = this.G.run.t;
    return 1 + (t / 60) * 0.2 + (Math.max(0, t - 480) / 60) * 0.25;
  }

  update(dt) {
    const G = this.G;
    const t = G.run.t;
    while (this.eventIdx < EVENTS.length && t >= EVENTS[this.eventIdx].at) this.runEvent(EVENTS[this.eventIdx++]);
    const w = this.wave();
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = w.interval;
    let n = w.batch;
    if (G.enemies.length < w.max * 0.4) n *= 2;
    for (let i = 0; i < n && G.enemies.length < w.max; i++) this.spawnRing(weightedPick(w.pool));
  }

  ringPos(extra = 0) {
    const P = this.G.player;
    const a = P.moving && Math.random() < 0.5 ? Math.atan2(P.facing.y, P.facing.x) + rand(-0.9, 0.9) : rand(0, TAU);
    const R = this.G.viewRadius() + rand(30, 110) + extra;
    return [P.x + Math.cos(a) * R, P.y + Math.sin(a) * R];
  }

  spawnRing(type) {
    const G = this.G;
    const [x, y] = this.ringPos();
    const opts = { hpMult: this.hpMult() };
    const elites = G.enemies.reduce((n, e) => n + (e.elite ? 1 : 0), 0);
    if (G.run.t > 100 && elites < 2 && Math.random() < 0.012) {
      Object.assign(opts, { elite: true, hpMult: this.hpMult() * 12, scale: 1.6, xpMult: 6, dmgMult: 1.4 });
    }
    return G.spawnEnemy(type, x, y, opts);
  }

  runEvent(ev) {
    const G = this.G;
    const P = G.player;
    if (ev.type === 'swarm') {
      const a = rand(0, TAU);
      const R = G.viewRadius() + 80;
      const cx = P.x + Math.cos(a) * R;
      const cy = P.y + Math.sin(a) * R;
      const dirx = -Math.cos(a);
      const diry = -Math.sin(a);
      const speed = ENEMIES[ev.enemy].speed * 1.5;
      for (let i = 0; i < ev.count; i++) {
        const off = (i - ev.count / 2) * 20 + rand(-8, 8);
        const back = rand(0, 180);
        G.spawnEnemy(ev.enemy, cx - diry * off - dirx * back, cy + dirx * off - diry * back, {
          hpMult: this.hpMult(), ai: 'swarm', dirx, diry, speedMult: 1.5, life: (R * 2 + 400) / speed,
        });
      }
      G.showBanner('Um enxame se aproxima!', '#c084fc');
      G.sound.play('swarm');
    } else if (ev.type === 'ring') {
      const R = G.viewRadius() + 10;
      for (let i = 0; i < ev.count; i++) {
        const ang = (i / ev.count) * TAU;
        G.spawnEnemy(ev.enemy, P.x + Math.cos(ang) * R, P.y + Math.sin(ang) * R, { hpMult: this.hpMult() });
      }
      G.showBanner('Você está cercado!', '#f87171');
      G.sound.play('swarm');
    } else if (ev.type === 'boss') {
      const [x, y] = this.ringPos(-60);
      G.spawnBoss(ev.enemy, x, y, ev.mult * (1 + G.run.t / 900));
    }
  }
}
