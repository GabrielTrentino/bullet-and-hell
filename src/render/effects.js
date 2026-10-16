import { rand, TAU } from '../core/utils.js';
import { glow } from './sprites.js';

const MAX_PARTICLES = 1800;
const MAX_TEXTS = 140;

// Partículas, números de dano, anéis de impacto e raios.
export class Effects {
  constructor() {
    this.clear();
  }

  clear() {
    this.parts = [];
    this.texts = [];
    this.rings = [];
    this.bolts = [];
  }

  burst(x, y, color, n = 8, speed = 140, life = 0.5, size = 3, opts = {}) {
    for (let i = 0; i < n && this.parts.length < MAX_PARTICLES; i++) {
      const a = opts.angle !== undefined ? opts.angle + rand(-opts.spread, opts.spread) : rand(0, TAU);
      const s = speed * rand(0.3, 1);
      const l = life * rand(0.6, 1.2);
      this.parts.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: l, max: l,
        size: size * rand(0.6, 1.3), color, grav: opts.grav || 0, add: !!opts.add,
      });
    }
  }

  ember(x, y, color = '#f97316') {
    if (this.parts.length >= MAX_PARTICLES) return;
    this.parts.push({ x: x + rand(-4, 4), y: y + rand(-4, 4), vx: rand(-20, 20), vy: rand(-40, -10), life: 0.4, max: 0.4, size: rand(2, 4), color, grav: 0, add: true });
  }

  text(x, y, value, crit = false, color = null) {
    if (this.texts.length >= MAX_TEXTS) this.texts.shift();
    this.texts.push({ x, y, value: String(value), crit, color: color || (crit ? '#fde047' : '#ffffff'), life: 0.75, max: 0.75, vy: crit ? -55 : -40 });
  }

  ring(x, y, r0, r1, life, color, width = 4) {
    this.rings.push({ x, y, r0, r1, life, max: life, color, width });
  }

  bolt(x1, y1, x2, y2, color = '#fde047', width = 3) {
    const pts = [[x1, y1]];
    const n = 9;
    for (let i = 1; i < n; i++) {
      const t = i / n;
      pts.push([x1 + (x2 - x1) * t + rand(-14, 14), y1 + (y2 - y1) * t + rand(-6, 6)]);
    }
    pts.push([x2, y2]);
    this.bolts.push({ pts, color, width, life: 0.22, max: 0.22 });
  }

  update(dt) {
    const drag = Math.max(0, 1 - dt * 4);
    let j = 0;
    for (const p of this.parts) {
      p.life -= dt;
      if (p.life <= 0) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= drag;
      p.vy = p.vy * drag + p.grav * dt;
      this.parts[j++] = p;
    }
    this.parts.length = j;

    for (const t of this.texts) {
      t.life -= dt;
      t.y += t.vy * dt;
      t.vy *= Math.max(0, 1 - dt * 3);
    }
    this.texts = this.texts.filter((t) => t.life > 0);
    for (const r of this.rings) r.life -= dt;
    this.rings = this.rings.filter((r) => r.life > 0);
    for (const b of this.bolts) b.life -= dt;
    this.bolts = this.bolts.filter((b) => b.life > 0);
  }

  render(G) {
    const c = G.ctx;
    G.setWorld();
    const v = G.view(40);

    for (const r of this.rings) {
      const k = 1 - r.life / r.max;
      const e = 1 - (1 - k) * (1 - k);
      c.globalAlpha = Math.max(0, 1 - k);
      c.strokeStyle = r.color;
      c.lineWidth = r.width * (1 - k) + 1;
      c.beginPath();
      c.arc(r.x, r.y, r.r0 + (r.r1 - r.r0) * e, 0, TAU);
      c.stroke();
    }

    for (const p of this.parts) {
      if (p.add || p.x < v.x0 || p.x > v.x1 || p.y < v.y0 || p.y > v.y1) continue;
      c.globalAlpha = p.life / p.max;
      c.fillStyle = p.color;
      const s = p.size;
      c.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    c.globalAlpha = 1;

    c.globalCompositeOperation = 'lighter';
    for (const p of this.parts) {
      if (!p.add || p.x < v.x0 || p.x > v.x1 || p.y < v.y0 || p.y > v.y1) continue;
      const k = p.life / p.max;
      G.blit(glow(p.color), p.x, p.y, (p.size * 1.6 * k) / 32 + 0.02, false, k);
    }
    G.setWorld();
    for (const b of this.bolts) {
      const k = b.life / b.max;
      for (const [w, col, a] of [[b.width * 4, b.color, 0.35], [b.width, '#ffffff', 1]]) {
        c.globalAlpha = a * k;
        c.strokeStyle = col;
        c.lineWidth = w;
        c.lineJoin = 'round';
        c.beginPath();
        b.pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
        c.stroke();
      }
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';

    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (const t of this.texts) {
      const k = t.life / t.max;
      const size = t.crit ? 17 : 12;
      const pop = k > 0.8 ? 1 + (k - 0.8) * 2 : 1;
      c.font = `700 ${Math.round(size * pop)}px Rubik, system-ui, sans-serif`;
      c.globalAlpha = Math.min(1, k * 2.5);
      c.fillStyle = 'rgba(0,0,0,0.75)';
      c.fillText(t.value, t.x + 1, t.y + 1.5);
      c.fillStyle = t.color;
      c.fillText(t.value, t.x, t.y);
    }
    c.globalAlpha = 1;
  }
}
