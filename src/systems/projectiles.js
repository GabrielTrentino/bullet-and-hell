import { TAU, dist2 } from '../core/utils.js';
import { glow, knifeSprite, scytheSprite, orbSprite, rgba } from '../render/sprites.js';

export function explode(G, x, y, r, dmg, w, color = '#f97316') {
  for (const e of G.queryEnemies(x, y, r + 40)) {
    if (!e.alive) continue;
    const dx = e.x - x;
    const dy = e.y - y;
    const d = Math.hypot(dx, dy) || 1;
    if (d < r + e.radius) G.hitEnemy(e, dmg, w, dx / d, dy / d, 1.2);
  }
  G.breakBraziersAt(x, y, r);
  G.fx.ring(x, y, r * 0.3, r, 0.35, color, 7);
  G.fx.burst(x, y, color, 18, 240, 0.5, 4, { add: true });
  G.fx.burst(x, y, '#fde047', 10, 150, 0.4, 3, { add: true });
  G.fx.burst(x, y, '#44403c', 8, 90, 0.7, 4);
  G.shakeScreen(3);
  G.sound.play('explode');
}

function reachOf(p) {
  if (p.kind === 'slash') return p.rx;
  if (p.kind === 'nova') return p.radius;
  return p.r;
}

function collide(G, p, now) {
  const reach = reachOf(p);
  const list = G.queryEnemies(p.x, p.y, reach + 40);
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    if (!e.alive) continue;
    const dx = e.x - p.x;
    const dy = e.y - p.y;
    let hit;
    if (p.kind === 'slash') {
      const ax = dx / (p.rx + e.radius);
      const ay = dy / (p.ry + e.radius);
      hit = ax * ax + ay * ay <= 1;
    } else if (p.kind === 'nova') {
      const d = Math.sqrt(dx * dx + dy * dy);
      hit = d < p.radius + e.radius && d > p.radius - 34 - e.radius;
    } else {
      const rr = p.r + e.radius;
      hit = dx * dx + dy * dy < rr * rr;
    }
    if (!hit) continue;
    const last = p.hits.get(e.id);
    if (last !== undefined && now - last < p.rehit) continue;
    p.hits.set(e.id, now);

    if (p.kind === 'fireball') {
      explode(G, p.x, p.y, p.explodeR, p.dmg, p.w, p.color);
      p.alive = false;
      return;
    }
    let kx;
    let ky;
    if (p.vx || p.vy) {
      const m = Math.hypot(p.vx, p.vy);
      kx = p.vx / m;
      ky = p.vy / m;
    } else {
      const d = Math.hypot(dx, dy) || 1;
      kx = dx / d;
      ky = dy / d;
    }
    G.hitEnemy(e, p.dmg, p.w, kx, ky, p.kb ?? 1);
    if (p.slow) {
      e.slow = Math.max(e.slow, p.slowDur);
      e.slowAmt = Math.max(e.slowAmt, p.slow);
      if (p.slow >= 1) G.fx.burst(e.x, e.y, '#e0f2fe', 4, 60, 0.4, 2);
    }
    if (p.pierce !== Infinity) {
      p.pierce--;
      if (p.pierce < 0) {
        p.alive = false;
        G.fx.burst(p.x, p.y, p.color, 5, 90, 0.25, 2, { add: true });
        return;
      }
    }
  }
  if (p.hits.size > 500) p.hits.clear();
  if (G.braziers.length) G.breakBraziersAt(p.x, p.y, reach);
}

export function updateProjectiles(G, dt) {
  const P = G.player;
  const now = G.run.t;
  for (const p of G.projectiles) {
    if (!p.alive) continue;
    p.age += dt;
    p.life -= dt;
    switch (p.kind) {
      case 'bolt':
      case 'knife':
      case 'fireball':
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.kind === 'fireball') G.fx.ember(p.x, p.y, Math.random() < 0.5 ? '#f97316' : '#fde047');
        break;
      case 'boomerang': {
        p.spin += dt * 15;
        p.speed -= p.decel * dt;
        if (p.speed >= 0) {
          p.x += p.dx * p.speed * dt;
          p.y += p.dy * p.speed * dt;
        } else {
          const dx = P.x - p.x;
          const dy = P.y - p.y;
          const d = Math.hypot(dx, dy) || 1;
          const sp = Math.min(-p.speed, 900);
          p.x += (dx / d) * sp * dt;
          p.y += (dy / d) * sp * dt;
          if (d < 22) p.alive = false;
        }
        break;
      }
      case 'orb':
        p.angle += p.angSpeed * dt;
        p.x = P.x + Math.cos(p.angle) * p.orbitR;
        p.y = P.y + Math.sin(p.angle) * p.orbitR;
        break;
      case 'slash':
        p.x = P.x + p.ox;
        p.y = P.y;
        break;
      case 'nova':
        p.radius = p.maxR * Math.min(1, p.age / p.grow);
        break;
      case 'meteor':
        if (p.age >= p.fall) {
          explode(G, p.x, p.y, p.radius, p.dmg, p.w, '#f97316');
          G.shakeScreen(4);
          p.alive = false;
        }
        continue;
      default:
        break;
    }
    if (!p.alive) continue;
    if (p.life <= 0) {
      if (p.kind === 'fireball') explode(G, p.x, p.y, p.explodeR, p.dmg, p.w, p.color);
      p.alive = false;
      continue;
    }
    collide(G, p, now);
  }
  G.projectiles = G.projectiles.filter((p) => p.alive);
}

export function renderProjectiles(G) {
  const c = G.ctx;
  const v = G.view(80);
  for (const p of G.projectiles) {
    if (p.kind !== 'slash' && p.kind !== 'nova' && (p.x < v.x0 || p.x > v.x1 || p.y < v.y0 || p.y > v.y1)) continue;
    switch (p.kind) {
      case 'bolt':
        c.globalCompositeOperation = 'lighter';
        G.blit(glow(p.color), p.x - p.vx * 0.03, p.y - p.vy * 0.03, 0.35 * (p.r / 7));
        G.blit(glow(p.color), p.x, p.y, 0.55 * (p.r / 7));
        G.blit(glow('#ffffff'), p.x, p.y, 0.18 * (p.r / 7));
        c.globalCompositeOperation = 'source-over';
        break;
      case 'knife':
        G.blit(knifeSprite(p.color), p.x, p.y, Math.max(1, p.r / 7), false, 1, p.angle);
        break;
      case 'fireball':
        c.globalCompositeOperation = 'lighter';
        G.blit(glow('#f97316'), p.x, p.y, 0.8 * (p.r / 9));
        G.blit(glow('#fde047'), p.x, p.y, 0.35 * (p.r / 9));
        c.globalCompositeOperation = 'source-over';
        break;
      case 'boomerang':
        c.globalCompositeOperation = 'lighter';
        G.blit(glow(p.color), p.x, p.y, 0.5 * p.scale, false, 0.4);
        c.globalCompositeOperation = 'source-over';
        G.blit(scytheSprite(p.color), p.x, p.y, p.scale, false, 1, p.spin);
        break;
      case 'orb':
        c.globalCompositeOperation = 'lighter';
        G.blit(glow(p.color), p.x, p.y, 0.7 * p.scale, false, 0.8);
        c.globalCompositeOperation = 'source-over';
        G.blit(orbSprite(p.color), p.x, p.y, p.scale);
        break;
      case 'slash':
        drawSlash(G, p);
        break;
      case 'nova': {
        const k = 1 - p.age / p.lifeMax;
        G.setWorld();
        c.globalCompositeOperation = 'lighter';
        c.fillStyle = rgba(p.color, 0.06 * k);
        c.beginPath();
        c.arc(p.x, p.y, p.radius, 0, TAU);
        c.fill();
        c.strokeStyle = rgba(p.color, 0.85 * k);
        c.lineWidth = 12 * k + 2;
        c.stroke();
        c.strokeStyle = rgba('#ffffff', 0.7 * k);
        c.lineWidth = 2;
        c.stroke();
        c.globalCompositeOperation = 'source-over';
        break;
      }
      case 'meteor': {
        const f = Math.min(1, p.age / p.fall);
        G.setWorld();
        c.strokeStyle = `rgba(248,113,113,${0.3 + f * 0.5})`;
        c.lineWidth = 2;
        c.setLineDash([6, 6]);
        c.beginPath();
        c.arc(p.x, p.y, p.radius * (0.4 + f * 0.6), 0, TAU);
        c.stroke();
        c.setLineDash([]);
        const mx = p.x + (1 - f) * 140;
        const my = p.y - (1 - f) * 420;
        c.globalCompositeOperation = 'lighter';
        G.blit(glow('#f97316'), mx + 20, my - 60, 0.6, false, 0.4);
        G.blit(glow('#f97316'), mx, my, 1.1);
        G.blit(glow('#fde047'), mx, my, 0.45);
        c.globalCompositeOperation = 'source-over';
        break;
      }
      default:
        break;
    }
  }
}

function drawSlash(G, p) {
  const c = G.ctx;
  const k = Math.max(0, p.life / p.lifeMax);
  const s = p.side;
  const a0 = s > 0 ? -Math.PI / 2 : Math.PI / 2;
  const a1 = s > 0 ? Math.PI / 2 : Math.PI * 1.5;
  G.setWorld();
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = rgba(p.color, 0.15 + 0.55 * k);
  c.beginPath();
  c.ellipse(p.x - s * p.rx * 0.3, p.y, p.rx, p.ry, 0, a0, a1, false);
  c.ellipse(p.x - s * p.rx * 0.5, p.y, p.rx * 0.78, p.ry * 0.55, 0, a1, a0, true);
  c.closePath();
  c.fill();
  c.strokeStyle = rgba('#ffffff', 0.8 * k);
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(p.x - s * p.rx * 0.3, p.y, p.rx, p.ry, 0, a0, a1, false);
  c.stroke();
  c.globalCompositeOperation = 'source-over';
}

export { dist2 };
