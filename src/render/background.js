import { hash2, TAU } from '../core/utils.js';
import { build, circ, ell, poly, rect, rrect, line, lg } from './sprites.js';

const TILE = 512;
const DECO_CELL = 110;

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Chão de cemitério noturno em um tile que se repete sem emendas, mais decorações espalhadas.
export class Background {
  constructor() {
    this.tile = this.makeTile();
    this.decos = [
      { weight: 30, spr: this.grass() },
      { weight: 10, spr: this.flowers() },
      { weight: 9, spr: this.rock() },
      { weight: 5, spr: this.grave() },
      { weight: 3, spr: this.cross() },
      { weight: 4, spr: this.bones() },
      { weight: 4, spr: this.mushrooms() },
      { weight: 3, spr: this.deadBush() },
    ];
    this.totalWeight = this.decos.reduce((a, d) => a + d.weight, 0);
  }

  makeTile() {
    const c = document.createElement('canvas');
    c.width = c.height = TILE;
    const g = c.getContext('2d');
    const rnd = seeded(1337);
    g.fillStyle = '#16211a';
    g.fillRect(0, 0, TILE, TILE);
    // manchas suaves, repetidas nas bordas para emendar
    for (let i = 0; i < 26; i++) {
      const x = rnd() * TILE;
      const y = rnd() * TILE;
      const r = 40 + rnd() * 90;
      const dark = rnd() < 0.5;
      for (const dx of [-TILE, 0, TILE]) {
        for (const dy of [-TILE, 0, TILE]) {
          const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
          gr.addColorStop(0, dark ? 'rgba(8,12,10,0.35)' : 'rgba(46,70,44,0.3)');
          gr.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = gr;
          g.fillRect(x + dx - r, y + dy - r, r * 2, r * 2);
        }
      }
    }
    const shades = ['#1c2b20', '#121b15', '#22342a', '#0f1712', '#263a2b'];
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = shades[(rnd() * shades.length) | 0];
      g.fillRect((rnd() * TILE) | 0, (rnd() * TILE) | 0, 2, 2);
    }
    g.lineCap = 'round';
    for (let i = 0; i < 420; i++) {
      const x = rnd() * TILE;
      const y = rnd() * TILE;
      g.strokeStyle = rnd() < 0.5 ? 'rgba(70,104,62,0.45)' : 'rgba(40,64,40,0.5)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + rnd() * 3 - 1.5, y - 3 - rnd() * 3);
      g.stroke();
    }
    for (let i = 0; i < 60; i++) {
      g.fillStyle = 'rgba(90,80,70,0.35)';
      g.fillRect((rnd() * TILE) | 0, (rnd() * TILE) | 0, 3, 2);
    }
    return c;
  }

  grass() {
    return build(16, 12, (g) => {
      for (let i = 0; i < 6; i++) {
        const x = 2 + i * 2.4;
        line(g, x, 12, x + (i % 2 ? 2 : -2), 2 + (i % 3) * 2, i % 2 ? '#3f6b3a' : '#2f5130', 1.4);
      }
    }, null);
  }

  flowers() {
    return build(16, 12, (g) => {
      for (const [x, y, c] of [[3, 5, '#a78bfa'], [9, 3, '#f0abfc'], [13, 6, '#93c5fd']]) {
        line(g, x, y, x, 12, '#2f5130', 1);
        circ(g, x, y, 1.8, c);
        circ(g, x, y, 0.7, '#fef9c3');
      }
    }, null);
  }

  rock() {
    return build(20, 13, (g) => {
      ell(g, 10, 8, 9.5, 5, '#3f3f46');
      ell(g, 8.5, 6.5, 6, 3, '#52525b');
      ell(g, 7, 5.5, 2.5, 1.2, '#71717a');
    });
  }

  grave() {
    return build(20, 26, (g) => {
      ell(g, 10, 24, 10, 2.5, '#1c2b20');
      g.fillStyle = lg(g, 0, 0, 20, 0, [[0, '#71717a'], [1, '#3f3f46']]);
      g.beginPath();
      g.moveTo(2, 24);
      g.lineTo(2, 9);
      g.arc(10, 9, 8, Math.PI, 0);
      g.lineTo(18, 24);
      g.closePath();
      g.fill();
      rect(g, 9, 6, 2, 9, '#27272a');
      rect(g, 6, 8.5, 8, 2, '#27272a');
      line(g, 4, 19, 8, 17, '#3f6b3a', 1.2);
    });
  }

  cross() {
    return build(16, 26, (g) => {
      rect(g, 6.5, 2, 3, 23, '#57534e');
      rect(g, 2, 7, 12, 3, '#57534e');
      rect(g, 6.5, 2, 1.2, 23, '#78716c');
    });
  }

  bones() {
    return build(16, 10, (g) => {
      line(g, 2, 2, 14, 8, '#d6d3d1', 2);
      line(g, 2, 8, 14, 2, '#d6d3d1', 2);
      for (const [x, y] of [[2, 2], [14, 8], [2, 8], [14, 2]]) circ(g, x, y, 1.6, '#e7e5e4');
    });
  }

  mushrooms() {
    return build(16, 12, (g) => {
      rect(g, 4, 6, 2, 6, '#e7e5e4');
      ell(g, 5, 6, 4, 2.6, '#dc2626');
      circ(g, 4, 5, 0.8, '#fff');
      rect(g, 11, 8, 1.6, 4, '#e7e5e4');
      ell(g, 11.8, 8, 3, 2, '#b91c1c');
    });
  }

  deadBush() {
    return build(22, 18, (g) => {
      const br = [[11, 18, 11, 8], [11, 12, 4, 4], [11, 10, 18, 2], [11, 14, 18, 9], [7, 8, 5, 1], [15, 6, 15, 0]];
      for (const [a, b, c, d] of br) line(g, a, b, c, d, '#4a3426', 1.4);
    });
  }

  pickDeco(h) {
    let r = h * this.totalWeight;
    for (const d of this.decos) {
      r -= d.weight;
      if (r <= 0) return d.spr;
    }
    return this.decos[0].spr;
  }

  draw(G, v) {
    const c = G.ctx;
    G.setWorld();
    const tx0 = Math.floor(v.x0 / TILE);
    const tx1 = Math.floor(v.x1 / TILE);
    const ty0 = Math.floor(v.y0 / TILE);
    const ty1 = Math.floor(v.y1 / TILE);
    for (let tx = tx0; tx <= tx1; tx++) {
      for (let ty = ty0; ty <= ty1; ty++) c.drawImage(this.tile, tx * TILE, ty * TILE, TILE + 0.5, TILE + 0.5);
    }
    const cx0 = Math.floor(v.x0 / DECO_CELL);
    const cx1 = Math.floor(v.x1 / DECO_CELL);
    const cy0 = Math.floor(v.y0 / DECO_CELL);
    const cy1 = Math.floor(v.y1 / DECO_CELL);
    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cy = cy0; cy <= cy1; cy++) {
        const h = hash2(cx * 7 + 13, cy * 11 + 5);
        if (h > 0.34) continue;
        const spr = this.pickDeco(h / 0.34);
        const x = cx * DECO_CELL + hash2(cx, cy * 3 + 1) * DECO_CELL;
        const y = cy * DECO_CELL + hash2(cx * 5 + 2, cy) * DECO_CELL;
        G.blit(spr, x, y, 1, hash2(cy, cx) < 0.5);
      }
    }
  }
}

export { TAU };
