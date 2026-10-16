import { TAU } from '../core/utils.js';

// Todos os sprites são desenhados por código em canvases fora da tela e guardados em cache.
// Cada sprite recebe um contorno escuro automático, o que dá um visual coeso de "pixel art suave".

const RES = 2;
const cache = new Map();

export function cached(key, make) {
  let v = cache.get(key);
  if (v === undefined) {
    v = make();
    cache.set(key, v);
  }
  return v;
}

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgba(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

export function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  const f = (v) => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

function newCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w * RES));
  c.height = Math.max(1, Math.ceil(h * RES));
  return c;
}

// Cria um sprite w×h (unidades do mundo) com contorno.
export function build(w, h, draw, outlineColor = '#0b0812') {
  const P = 3;
  const W = w + P * 2;
  const H = h + P * 2;
  const base = newCanvas(W, H);
  const g = base.getContext('2d');
  g.scale(RES, RES);
  g.translate(P, P);
  draw(g);
  let out = base;
  if (outlineColor) {
    const sil = tinted(base, outlineColor);
    out = newCanvas(W, H);
    const og = out.getContext('2d');
    const o = 1.1 * RES;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      og.drawImage(sil, Math.cos(a) * o, Math.sin(a) * o);
    }
    og.drawImage(base, 0, 0);
  }
  out.w = W;
  out.h = H;
  return out;
}

export function tinted(src, color) {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const g = c.getContext('2d');
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  c.w = src.w;
  c.h = src.h;
  return c;
}

// Brilho radial (desenhado com composição aditiva). Raio base 32, escale ao desenhar.
export function glow(hex) {
  return cached(`glow:${hex}`, () => {
    const r = 32;
    const c = newCanvas(r * 2, r * 2);
    const g = c.getContext('2d');
    g.scale(RES, RES);
    const gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, rgba(hex, 1));
    gr.addColorStop(0.25, rgba(hex, 0.55));
    gr.addColorStop(0.6, rgba(hex, 0.15));
    gr.addColorStop(1, rgba(hex, 0));
    g.fillStyle = gr;
    g.fillRect(0, 0, r * 2, r * 2);
    c.w = c.h = r * 2;
    return c;
  });
}

// ---------- primitivas ----------
export function circ(g, x, y, r, c) {
  g.fillStyle = c;
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.fill();
}
export function ell(g, x, y, rx, ry, c, rot = 0) {
  g.fillStyle = c;
  g.beginPath();
  g.ellipse(x, y, rx, ry, rot, 0, TAU);
  g.fill();
}
export function poly(g, pts, c) {
  g.fillStyle = c;
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  g.fill();
}
export function rect(g, x, y, w, h, c) {
  g.fillStyle = c;
  g.fillRect(x, y, w, h);
}
export function rrPath(g, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
export function rrect(g, x, y, w, h, r, c) {
  g.fillStyle = c;
  rrPath(g, x, y, w, h, r);
  g.fill();
}
export function line(g, x1, y1, x2, y2, c, w = 1) {
  g.strokeStyle = c;
  g.lineWidth = w;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.stroke();
}
export function lg(g, x0, y0, x1, y1, stops) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  return gr;
}
export function rg(g, x, y, r0, r1, stops) {
  const gr = g.createRadialGradient(x, y, r0, x, y, r1);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  return gr;
}
export function star(g, x, y, r, c, points = 5) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * TAU - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  poly(g, pts, c);
}

// ---------- heróis ----------
export const HERO_LOOKS = {
  lyra: { robe: '#7c3aed', robeDark: '#4c1d95', skin: '#f5d0b5', accent: '#fbbf24', boots: '#2e1065', hair: '#f472b6', hat: 'wizard', item: 'staff', gem: '#67e8f9' },
  bram: { robe: '#94a3b8', robeDark: '#475569', skin: '#e8b996', accent: '#fbbf24', boots: '#334155', hair: '#78350f', hat: 'helm', item: 'sword', cape: '#b91c1c' },
  aria: { robe: '#16a34a', robeDark: '#14532d', skin: '#f1c7a5', accent: '#a16207', boots: '#422006', hair: '#fb923c', hat: 'hood', item: 'bow' },
  kael: { robe: '#b91c1c', robeDark: '#7f1d1d', skin: '#e9b48f', accent: '#f59e0b', boots: '#1c1917', hair: '#f97316', hat: 'flame', item: 'fire' },
  nyx: { robe: '#3730a3', robeDark: '#1e1b4b', skin: '#c4b5fd', accent: '#a855f7', boots: '#0f0a1e', hair: '#111827', hat: 'deephood', item: 'skull' },
  volt: { robe: '#1d4ed8', robeDark: '#1e3a8a', skin: '#efc9a8', accent: '#facc15', boots: '#0f172a', hair: '#e0f2fe', hat: 'spiky', item: 'spark' },
};

function hatBack(g, L, b) {
  if (L.hat === 'wizard') ell(g, 16, 15 + b, 8.6, 7.5, L.hair);
  if (L.hat === 'hood') ell(g, 16, 14 + b, 10, 10, L.robeDark);
  if (L.hat === 'deephood') ell(g, 16, 13.5 + b, 10.5, 11, L.robeDark);
}

function hatFront(g, L, b) {
  switch (L.hat) {
    case 'wizard':
      ell(g, 16, 7.5 + b, 12, 3.2, L.robeDark);
      g.fillStyle = lg(g, 9, 0, 23, 0, [[0, L.robe], [1, L.robeDark]]);
      g.beginPath();
      g.moveTo(9, 7.5 + b);
      g.lineTo(23, 7.5 + b);
      g.quadraticCurveTo(19, -2 + b, 25, -8 + b);
      g.quadraticCurveTo(14, -4 + b, 9, 7.5 + b);
      g.fill();
      rect(g, 9.6, 4.6 + b, 12.8, 2.4, L.accent);
      star(g, 25, -8 + b, 2.8, L.gem);
      break;
    case 'helm':
      g.fillStyle = lg(g, 8, 0, 24, 0, [[0, '#e2e8f0'], [1, '#64748b']]);
      g.beginPath();
      g.arc(16, 12 + b, 8.4, Math.PI, 0);
      g.closePath();
      g.fill();
      rect(g, 7.6, 9.6 + b, 16.8, 2.4, '#94a3b8');
      rect(g, 15, 9.6 + b, 2, 6.5, '#94a3b8');
      poly(g, [[14.5, 4.5 + b], [17.5, 4.5 + b], [21, -4 + b], [13, -1 + b]], L.cape);
      circ(g, 8.4, 20.5 + b, 4.2, '#cbd5e1');
      circ(g, 23.6, 20.5 + b, 4.2, '#cbd5e1');
      circ(g, 7.6, 19.6 + b, 1.4, '#f8fafc');
      break;
    case 'hood':
      g.fillStyle = L.robe;
      g.beginPath();
      g.moveTo(6.5, 15 + b);
      g.quadraticCurveTo(6.5, 3 + b, 16, 3 + b);
      g.quadraticCurveTo(25.5, 3 + b, 25.5, 15 + b);
      g.quadraticCurveTo(22, 7.5 + b, 16, 8 + b);
      g.quadraticCurveTo(10, 7.5 + b, 6.5, 15 + b);
      g.fill();
      poly(g, [[10.5, 8 + b], [12.5, 11.5 + b], [14, 8 + b], [16, 11 + b], [18, 8 + b], [19.5, 11 + b], [21.5, 8 + b]], L.hair);
      break;
    case 'deephood':
      g.fillStyle = L.robe;
      g.beginPath();
      g.moveTo(5.5, 19 + b);
      g.quadraticCurveTo(5, 1.5 + b, 16, 1.5 + b);
      g.quadraticCurveTo(27, 1.5 + b, 26.5, 19 + b);
      g.quadraticCurveTo(24, 6 + b, 16, 6.5 + b);
      g.quadraticCurveTo(8, 6 + b, 5.5, 19 + b);
      g.fill();
      break;
    case 'flame': {
      const pts = [[7.5, 13], [7, 6], [10, 8], [10, 0.5], [13, 6], [15.5, -3], [17.5, 5], [20.5, -0.5], [21.5, 7], [25.5, 4], [24.5, 13], [21, 8.5], [11, 8.5]];
      g.fillStyle = lg(g, 0, -3 + b, 0, 13 + b, [[0, '#fde047'], [0.5, '#f97316'], [1, '#b91c1c']]);
      g.beginPath();
      pts.forEach(([x, y], i) => (i ? g.lineTo(x, y + b) : g.moveTo(x, y + b)));
      g.closePath();
      g.fill();
      break;
    }
    case 'spiky': {
      const pts = [[7.5, 12], [6, 5], [10, 7], [10.5, 0], [14, 5.5], [16.5, -2], [18.5, 5], [22, 0], [22.5, 7], [26, 5], [24.5, 12], [21, 9], [11, 9]];
      g.fillStyle = L.hair;
      g.beginPath();
      pts.forEach(([x, y], i) => (i ? g.lineTo(x, y + b) : g.moveTo(x, y + b)));
      g.closePath();
      g.fill();
      rect(g, 8.2, 8.6 + b, 15.6, 2.2, '#2563eb');
      break;
    }
    default:
      break;
  }
}

function drawItem(g, L, b) {
  switch (L.item) {
    case 'staff':
      line(g, 26.5, 9 + b, 25, 41, '#7c2d12', 2.3);
      circ(g, 26.5, 7 + b, 4.6, rgba(L.gem, 0.35));
      circ(g, 26.5, 7 + b, 2.7, L.gem);
      circ(g, 25.7, 6.2 + b, 0.9, '#fff');
      break;
    case 'sword':
      poly(g, [[25.2, 30 + b], [27.8, 30 + b], [27.8, 9 + b], [26.5, 5 + b], [25.2, 9 + b]], '#e2e8f0');
      line(g, 26.5, 9 + b, 26.5, 29 + b, '#94a3b8', 0.7);
      rect(g, 22.5, 29.5 + b, 8, 2, '#fbbf24');
      rect(g, 25.5, 31.5 + b, 2, 4, '#78350f');
      g.fillStyle = lg(g, 1, 0, 11, 0, [[0, '#3b82f6'], [1, '#1e3a8a']]);
      g.beginPath();
      g.moveTo(1, 21.5 + b);
      g.lineTo(11, 21.5 + b);
      g.lineTo(11, 28 + b);
      g.quadraticCurveTo(11, 33 + b, 6, 35.5 + b);
      g.quadraticCurveTo(1, 33 + b, 1, 28 + b);
      g.closePath();
      g.fill();
      rect(g, 5.3, 23 + b, 1.4, 10, '#fbbf24');
      rect(g, 2.5, 26 + b, 7, 1.4, '#fbbf24');
      break;
    case 'bow': {
      g.strokeStyle = '#a16207';
      g.lineWidth = 2.2;
      g.beginPath();
      g.arc(20, 26 + b, 12, -1.15, 1.15);
      g.stroke();
      const x1 = 20 + 12 * Math.cos(-1.15);
      const y1 = 26 + b + 12 * Math.sin(-1.15);
      line(g, x1, y1, x1, 26 + b + 12 * Math.sin(1.15), '#fde68a', 0.7);
      line(g, 6, 18 + b, 3, 8 + b, '#78350f', 2.2);
      poly(g, [[2, 9 + b], [3.5, 4 + b], [5, 9 + b]], '#e5e7eb');
      break;
    }
    case 'fire':
      circ(g, 25.5, 28 + b, 5.5, 'rgba(249,115,22,0.45)');
      circ(g, 25.5, 28 + b, 3.6, '#f97316');
      circ(g, 25.5, 27.4 + b, 2.1, '#fde047');
      break;
    case 'skull':
      line(g, 26.5, 10 + b, 25, 41, '#292524', 2.3);
      circ(g, 26.5, 8 + b, 6.5, 'rgba(168,85,247,0.3)');
      circ(g, 26.5, 8 + b, 3.7, '#e7e5e4');
      rect(g, 24.8, 9.8 + b, 3.4, 2, '#e7e5e4');
      circ(g, 25.2, 8 + b, 0.95, '#7e22ce');
      circ(g, 27.8, 8 + b, 0.95, '#7e22ce');
      break;
    case 'spark':
      rrect(g, 22, 27 + b, 5.5, 5.5, 1.5, '#475569');
      poly(g, [[27, 20 + b], [31, 25 + b], [28.5, 25.5 + b], [31.5, 31 + b], [25.5, 25.5 + b], [28, 25 + b]], '#facc15');
      break;
    default:
      break;
  }
}

function drawHero(g, L, f) {
  const b = f ? 1 : 0;
  const st = f ? 1.6 : -1.6;
  if (L.cape) {
    g.fillStyle = L.cape;
    g.beginPath();
    g.moveTo(9.5, 19 + b);
    g.lineTo(22.5, 19 + b);
    g.lineTo(26, 39);
    g.lineTo(6, 39);
    g.closePath();
    g.fill();
  }
  rrect(g, 10.5 + st, 33, 5, 9.5, 2, L.boots);
  rrect(g, 16.5 - st, 33, 5, 9.5, 2, L.boots);
  g.fillStyle = lg(g, 7, 0, 25, 0, [[0, L.robe], [1, L.robeDark]]);
  g.beginPath();
  g.moveTo(10.5, 19 + b);
  g.lineTo(21.5, 19 + b);
  g.lineTo(25, 36.5);
  g.quadraticCurveTo(16, 38.5, 7, 36.5);
  g.closePath();
  g.fill();
  rect(g, 15.2, 20 + b, 1.6, 16, rgba(L.accent, 0.5));
  rect(g, 9.6, 27.5 + b, 12.8, 2.4, L.accent);
  ell(g, 8.6, 24.5 + b, 3, 5.5, L.robeDark, 0.25);
  ell(g, 23.4, 24.5 + b, 3, 5.5, L.robeDark, -0.25);
  circ(g, 8, 30 + b, 2.3, L.skin);
  circ(g, 24, 30 + b, 2.3, L.skin);
  hatBack(g, L, b);
  g.fillStyle = rg(g, 14, 11 + b, 1, 9, [[0, shade(L.skin, 0.15)], [1, shade(L.skin, -0.12)]]);
  g.beginPath();
  g.arc(16, 13 + b, 7.5, 0, TAU);
  g.fill();
  if (L.hat === 'deephood') {
    ell(g, 16, 13 + b, 7.6, 7.6, 'rgba(10,5,25,0.6)');
    circ(g, 13.3, 14 + b, 1.6, '#e879f9');
    circ(g, 18.7, 14 + b, 1.6, '#e879f9');
  } else {
    const ey = L.hat === 'helm' ? 13 : 12.6;
    rrect(g, 12.6, ey + b, 2, 2.8, 0.8, '#1b1226');
    rrect(g, 17.4, ey + b, 2, 2.8, 0.8, '#1b1226');
    circ(g, 13.2, ey + 0.5 + b, 0.5, '#fff');
    circ(g, 18, ey + 0.5 + b, 0.5, '#fff');
    circ(g, 11.4, 16.2 + b, 1.3, 'rgba(244,114,182,0.35)');
    circ(g, 20.6, 16.2 + b, 1.3, 'rgba(244,114,182,0.35)');
  }
  hatFront(g, L, b);
  drawItem(g, L, b);
}

export function heroSprite(id, frame) {
  return cached(`hero:${id}:${frame}`, () => build(32, 44, (g) => drawHero(g, HERO_LOOKS[id], frame)));
}
export function heroFlash(id, frame) {
  return cached(`heroF:${id}:${frame}`, () => tinted(heroSprite(id, frame), '#ffffff'));
}
export function heroShadowed(id) {
  return cached(`heroS:${id}`, () => tinted(heroSprite(id, 0), '#120d1c'));
}

// ---------- inimigos (todos olhando para a direita) ----------
const ENEMY_ART = {
  bat: {
    w: 38, h: 26,
    draw(g, f) {
      const wy = f ? 21 : 1;
      for (const s of [1, -1]) {
        const x = (v) => 19 + v * s;
        poly(g, [[x(3), 12], [x(19), wy], [x(16.5), 16], [x(12.5), 13.5], [x(9), 18.5], [x(5), 15]], '#3b0764');
        line(g, x(3), 12, x(19), wy, '#581c87', 1);
      }
      g.fillStyle = rg(g, 17, 10, 1, 9, [[0, '#9333ea'], [1, '#581c87']]);
      g.beginPath();
      g.ellipse(19, 13, 6, 7.5, 0, 0, TAU);
      g.fill();
      poly(g, [[14.5, 8], [15.5, 2], [17.5, 7]], '#6b21a8');
      poly(g, [[20.5, 7], [22.5, 2], [23.5, 8]], '#6b21a8');
      circ(g, 16.8, 12, 1.7, '#f43f5e');
      circ(g, 21.2, 12, 1.7, '#f43f5e');
      poly(g, [[17, 16], [17.8, 18.8], [18.6, 16]], '#fff');
      poly(g, [[19.4, 16], [20.2, 18.8], [21, 16]], '#fff');
    },
  },
  skeleton: {
    w: 28, h: 42,
    draw(g, f) {
      const s = f ? 2 : -2;
      const bone = '#e7e5e4';
      line(g, 11, 30, 11 + s * 0.7, 41, bone, 3);
      line(g, 17, 30, 17 - s * 0.7, 41, bone, 3);
      rrect(g, 9, 27, 10, 4, 1.5, '#a8a29e');
      rect(g, 13, 17, 2.5, 11, bone);
      for (let i = 0; i < 3; i++) rrect(g, 8.5, 18 + i * 3, 11, 1.8, 1, bone);
      line(g, 8, 18, 5, 28 + (f ? 1 : -1), bone, 2.4);
      line(g, 20, 18, 24, 26 - (f ? 1 : -1), bone, 2.4);
      line(g, 24, 26 - (f ? 1 : -1), 26, 14, '#78716c', 1.8);
      g.fillStyle = rg(g, 12, 7, 1, 9, [[0, '#fafaf9'], [1, '#d6d3d1']]);
      g.beginPath();
      g.arc(14, 10, 7.5, 0, TAU);
      g.fill();
      rrect(g, 10, 13, 8, 5, 2, bone);
      circ(g, 11.2, 10, 2.3, '#1c1917');
      circ(g, 16.8, 10, 2.3, '#1c1917');
      circ(g, 11.2, 10, 0.9, '#f87171');
      circ(g, 16.8, 10, 0.9, '#f87171');
      rect(g, 11, 16, 6, 0.8, '#57534e');
    },
  },
  zombie: {
    w: 32, h: 44,
    draw(g, f) {
      const s = f ? 2 : -2;
      rrect(g, 10 + s * 0.5, 31, 5, 12, 1.5, '#1e3a5f');
      rrect(g, 17 - s * 0.5, 31, 5, 12, 1.5, '#1e3a5f');
      poly(g, [[9, 18], [23, 18], [24, 33], [20, 31], [16, 34], [12, 31], [8, 33]], '#57534e');
      rect(g, 9, 23, 14, 1.5, '#44403c');
      rrect(g, 17, 19.5 + (f ? 1 : 0), 14, 4.5, 2, '#65a30d');
      rrect(g, 15, 24 + (f ? 0 : 1), 15, 4.5, 2, '#4d7c0f');
      g.fillStyle = rg(g, 13, 8, 1, 9, [[0, '#a3e635'], [1, '#4d7c0f']]);
      g.beginPath();
      g.arc(15, 11, 7.5, 0, TAU);
      g.fill();
      circ(g, 13, 11, 1.9, '#fef08a');
      circ(g, 18.5, 10.5, 2.2, '#fef08a');
      circ(g, 13.3, 11, 0.8, '#1a2e05');
      circ(g, 18.9, 10.5, 0.9, '#1a2e05');
      rect(g, 12, 15, 7, 1.6, '#365314');
      line(g, 9, 7, 13, 5, '#365314', 1);
      line(g, 10, 5.5, 10.5, 7.5, '#365314', 0.8);
    },
  },
  ghost: {
    w: 34, h: 38, outline: '#312e81',
    draw(g, f) {
      g.fillStyle = lg(g, 0, 0, 0, 38, [[0, 'rgba(238,242,255,0.97)'], [1, 'rgba(165,180,252,0.5)']]);
      g.beginPath();
      g.arc(17, 15, 13, Math.PI, 0);
      g.lineTo(30, 32);
      const n = 4;
      for (let i = 0; i <= n; i++) {
        const x = 30 - i * (26 / n);
        const y = 32 + ((i + (f ? 1 : 0)) % 2 ? 5 : 0);
        g.lineTo(x, y);
      }
      g.closePath();
      g.fill();
      ell(g, 13.5, 14, 2.6, 3.7, '#1e1b4b');
      ell(g, 22, 14, 2.6, 3.7, '#1e1b4b');
      ell(g, 18, 22, 2.3, f ? 3.4 : 2.6, '#1e1b4b');
      ell(g, 11, 8, 3, 2, 'rgba(255,255,255,0.7)');
    },
  },
  slime: {
    w: 34, h: 28,
    draw(g, f) {
      const rx = f ? 15.5 : 14;
      const ry = f ? 9.5 : 11;
      const cy = f ? 18.5 : 17;
      g.fillStyle = rg(g, 13, cy - 4, 2, 17, [[0, '#d9f99d'], [0.55, '#65a30d'], [1, '#365314']]);
      g.beginPath();
      g.ellipse(17, cy, rx, ry, 0, 0, TAU);
      g.fill();
      ell(g, 11, cy - 5, 4, 2.2, 'rgba(255,255,255,0.6)');
      circ(g, 14, cy, 2.1, '#1a2e05');
      circ(g, 22, cy, 2.1, '#1a2e05');
      circ(g, 14.7, cy - 0.7, 0.8, '#fff');
      circ(g, 22.7, cy - 0.7, 0.8, '#fff');
      rect(g, 16.5, cy + 4, 4, 1.2, '#1a2e05');
    },
  },
  eye: {
    w: 36, h: 40,
    draw(g, f) {
      g.strokeStyle = '#7e22ce';
      g.lineWidth = 2.6;
      g.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        const x = 10 + i * 5.3;
        const sw = (f ? 4 : -4) * (i % 2 ? 1 : -1);
        g.beginPath();
        g.moveTo(x, 24);
        g.quadraticCurveTo(x + sw, 31, x - sw * 0.5, 38);
        g.stroke();
      }
      g.fillStyle = rg(g, 14, 12, 2, 15, [[0, '#ffffff'], [0.7, '#fce7f3'], [1, '#f9a8d4']]);
      g.beginPath();
      g.arc(18, 17, 13, 0, TAU);
      g.fill();
      line(g, 6, 13, 10, 16, '#e11d48', 0.8);
      line(g, 8, 24, 11, 21, '#e11d48', 0.8);
      line(g, 14, 5, 15, 9, '#e11d48', 0.8);
      circ(g, 22, 17, 6.2, '#be123c');
      circ(g, 22, 17, 4, '#881337');
      ell(g, 22.5, 17, 1.6, f ? 3.6 : 2.6, '#0b0b0b');
      circ(g, 20, 14.5, 1.6, '#fff');
    },
  },
  imp: {
    w: 30, h: 30,
    draw(g, f) {
      const wy = f ? 3 : 11;
      poly(g, [[12, 14], [1, wy], [5, 19]], '#7f1d1d');
      poly(g, [[18, 14], [29, wy], [25, 19]], '#7f1d1d');
      g.strokeStyle = '#991b1b';
      g.lineWidth = 1.8;
      g.beginPath();
      g.moveTo(11, 24);
      g.quadraticCurveTo(3, 27, 4, 20);
      g.stroke();
      poly(g, [[2.5, 20.5], [4, 16.5], [6, 20.5]], '#991b1b');
      rect(g, 12, 25, 2.5, 4.5, '#991b1b');
      rect(g, 16.5, 25, 2.5, 4.5, '#991b1b');
      ell(g, 15.5, 20, 6, 7, '#dc2626');
      g.fillStyle = rg(g, 14, 9, 1, 7, [[0, '#f87171'], [1, '#b91c1c']]);
      g.beginPath();
      g.arc(15.5, 11, 6, 0, TAU);
      g.fill();
      poly(g, [[10.5, 8], [9, 1], [13.5, 6]], '#fde68a');
      poly(g, [[17.5, 6], [22, 1], [20.5, 8]], '#fde68a');
      circ(g, 13.6, 11, 1.5, '#fde047');
      circ(g, 18.6, 11, 1.5, '#fde047');
      rect(g, 13.5, 14, 5, 1, '#450a0a');
    },
  },
  brute: {
    w: 54, h: 60,
    draw(g, f) {
      const s = f ? 2.5 : -2.5;
      rrect(g, 16 + s * 0.4, 44, 9, 15, 3, '#57301d');
      rrect(g, 29 - s * 0.4, 44, 9, 15, 3, '#57301d');
      g.fillStyle = rg(g, 22, 28, 4, 24, [[0, '#ea8a3a'], [1, '#7c2d12']]);
      g.beginPath();
      g.ellipse(27, 34, 17, 15, 0, 0, TAU);
      g.fill();
      ell(g, 27, 39, 10, 7, 'rgba(254,215,170,0.35)');
      poly(g, [[16, 42], [38, 42], [34, 51], [20, 51]], '#44403c');
      ell(g, 10, 34, 5.5, 9, '#b45309');
      ell(g, 44, 34, 5.5, 9, '#b45309');
      g.save();
      g.translate(46, 39);
      g.rotate(f ? -0.55 : -0.3);
      rrect(g, -2.5, -27, 5.5, 29, 2.5, '#78350f');
      ell(g, 0.3, -26, 6.5, 8.5, '#92400e');
      for (const [x, y] of [[-6, -28], [6, -26], [0, -34], [-5, -21], [5, -20]]) circ(g, x, y, 1.6, '#d6d3d1');
      g.restore();
      g.fillStyle = rg(g, 24, 10, 2, 12, [[0, '#ea580c'], [1, '#9a3412']]);
      g.beginPath();
      g.arc(27, 14, 10, 0, TAU);
      g.fill();
      ell(g, 27, 19.5, 7, 4, '#9a3412');
      poly(g, [[18, 9], [12, -1], [21.5, 6]], '#e7e5e4');
      poly(g, [[32.5, 6], [42, -1], [36, 9]], '#e7e5e4');
      rect(g, 20, 10, 6, 1.6, '#431407');
      rect(g, 28, 10, 6, 1.6, '#431407');
      circ(g, 23, 13, 2, '#fef08a');
      circ(g, 31, 13, 2, '#fef08a');
      poly(g, [[22, 19], [23, 14.5], [24.5, 19]], '#fff');
      poly(g, [[29.5, 19], [31, 14.5], [32, 19]], '#fff');
    },
  },
  reaper: {
    w: 80, h: 88,
    draw(g, f) {
      const b = f ? 1.5 : 0;
      line(g, 64, 8, 48, 86, '#57534e', 3.5);
      g.fillStyle = lg(g, 20, 0, 70, 20, [[0, '#94a3b8'], [1, '#f8fafc']]);
      g.beginPath();
      g.moveTo(64, 8);
      g.quadraticCurveTo(40, -4, 14, 16);
      g.quadraticCurveTo(40, 5, 62, 19);
      g.closePath();
      g.fill();
      g.fillStyle = lg(g, 0, 18, 0, 88, [[0, '#312e81'], [1, '#09081a']]);
      g.beginPath();
      g.moveTo(40, 12 + b);
      g.quadraticCurveTo(63, 20, 64, 50);
      g.lineTo(67, 86);
      for (let i = 1; i <= 7; i++) g.lineTo(67 - i * 7.4, i % 2 ? 78 : 87);
      g.lineTo(15, 50);
      g.quadraticCurveTo(17, 20, 40, 12 + b);
      g.fill();
      ell(g, 40, 24 + b, 14.5, 16, '#1e1b4b');
      ell(g, 40, 27 + b, 9.5, 11, '#05040a');
      circ(g, 40, 27 + b, 7, '#e7e5e4');
      rect(g, 36.5, 31 + b, 7, 3.5, '#e7e5e4');
      circ(g, 37.2, 26 + b, 2.2, '#0e7490');
      circ(g, 42.8, 26 + b, 2.2, '#0e7490');
      circ(g, 37.2, 26 + b, 1.2, '#67e8f9');
      circ(g, 42.8, 26 + b, 1.2, '#67e8f9');
      circ(g, 54, 47, 3.8, '#e7e5e4');
      circ(g, 27, 50, 3.5, '#e7e5e4');
      line(g, 26, 40, 54, 44, 'rgba(99,102,241,0.6)', 1.2);
    },
  },
  demon: {
    w: 104, h: 100,
    draw(g, f) {
      const wy = f ? -4 : 5;
      for (const s of [-1, 1]) {
        const x = (v) => 52 + v * s;
        poly(g, [[x(12), 38], [x(48), 10 + wy], [x(51), 42], [x(43), 37], [x(45), 57], [x(35), 48], [x(30), 63], [x(18), 52]], '#450a0a');
        line(g, x(12), 38, x(48), 10 + wy, '#7f1d1d', 2.5);
        line(g, x(40), 18 + wy * 0.7, x(43), 37, '#7f1d1d', 1.5);
        line(g, x(30), 25 + wy * 0.4, x(35), 48, '#7f1d1d', 1.5);
      }
      rrect(g, 38, 72, 10, 24, 4, '#7f1d1d');
      rrect(g, 56, 72, 10, 24, 4, '#7f1d1d');
      rect(g, 37, 93, 12, 5, '#1c1917');
      rect(g, 55, 93, 12, 5, '#1c1917');
      g.fillStyle = rg(g, 46, 48, 4, 30, [[0, '#f87171'], [1, '#7f1d1d']]);
      g.beginPath();
      g.ellipse(52, 57, 20, 22, 0, 0, TAU);
      g.fill();
      line(g, 52, 46, 52, 72, 'rgba(69,10,10,0.6)', 1.5);
      line(g, 44, 58, 60, 58, 'rgba(69,10,10,0.5)', 1.2);
      line(g, 45, 65, 59, 65, 'rgba(69,10,10,0.5)', 1.2);
      ell(g, 30, 57, 6.5, 14, '#b91c1c', 0.3);
      ell(g, 74, 57, 6.5, 14, '#b91c1c', -0.3);
      for (const x of [24, 27, 30]) poly(g, [[x, 68], [x + 1, 74], [x + 2, 68]], '#fef3c7');
      for (const x of [72, 75, 78]) poly(g, [[x, 68], [x + 1, 74], [x + 2, 68]], '#fef3c7');
      g.fillStyle = rg(g, 48, 26, 2, 14, [[0, '#ef4444'], [1, '#991b1b']]);
      g.beginPath();
      g.arc(52, 30, 12.5, 0, TAU);
      g.fill();
      poly(g, [[43, 24], [28, 6], [33, 2], [47, 19]], '#fef3c7');
      poly(g, [[61, 24], [76, 6], [71, 2], [57, 19]], '#fef3c7');
      poly(g, [[43, 27], [49.5, 29], [43.5, 31]], '#fde047');
      poly(g, [[61, 27], [54.5, 29], [60.5, 31]], '#fde047');
      rrect(g, 45, 35, 14, 5, 2, '#1c0505');
      for (const x of [46.5, 50, 53.5, 56.5]) poly(g, [[x, 35], [x + 1, 37.5], [x + 2, 35]], '#fff');
    },
  },
  lich: {
    w: 84, h: 98,
    draw(g, f) {
      const b = f ? 1.5 : 0;
      g.fillStyle = lg(g, 0, 28, 0, 98, [[0, '#7c3aed'], [1, '#1e0b45']]);
      g.beginPath();
      g.moveTo(30, 30);
      g.lineTo(54, 30);
      g.lineTo(70, 92);
      for (let i = 1; i <= 7; i++) g.lineTo(70 - i * 8, i % 2 ? 86 : 96);
      g.lineTo(14, 92);
      g.closePath();
      g.fill();
      line(g, 42, 32, 42, 92, '#fbbf24', 3);
      line(g, 30, 30, 18, 90, 'rgba(251,191,36,0.5)', 1.5);
      line(g, 54, 30, 66, 90, 'rgba(251,191,36,0.5)', 1.5);
      ell(g, 28, 34, 9, 6.5, '#4c1d95');
      ell(g, 56, 34, 9, 6.5, '#4c1d95');
      circ(g, 28, 33, 2, '#fbbf24');
      circ(g, 56, 33, 2, '#fbbf24');
      g.fillStyle = rg(g, 39, 18 + b, 1, 11, [[0, '#fafaf9'], [1, '#c7c2bd']]);
      g.beginPath();
      g.arc(42, 22 + b, 10, 0, TAU);
      g.fill();
      rrect(g, 37, 27 + b, 10, 6, 2, '#e7e5e4');
      circ(g, 38.5, 21 + b, 2.8, '#052e16');
      circ(g, 45.5, 21 + b, 2.8, '#052e16');
      circ(g, 38.5, 21 + b, 1.5, '#4ade80');
      circ(g, 45.5, 21 + b, 1.5, '#4ade80');
      poly(g, [[31, 15 + b], [32.5, 3 + b], [37, 10 + b], [42, 0 + b], [47, 10 + b], [51.5, 3 + b], [53, 15 + b]], '#fbbf24');
      circ(g, 42, 8 + b, 1.8, '#ef4444');
      circ(g, 35, 11 + b, 1.2, '#22d3ee');
      circ(g, 49, 11 + b, 1.2, '#22d3ee');
      line(g, 73, 12, 73, 94, '#3f3f46', 3);
      circ(g, 73, 10, 7.5, 'rgba(34,197,94,0.35)');
      circ(g, 73, 10, 5, '#22c55e');
      circ(g, 72, 8.5, 2, '#bbf7d0');
      circ(g, 71, 50, 3.6, '#e7e5e4');
      circ(g, 13, 52 + (f ? -2 : 2), 4, '#4ade80');
    },
  },
};

export function enemyArt(key) {
  return ENEMY_ART[key];
}

export function enemySprite(key, frame) {
  return cached(`en:${key}:${frame}`, () => {
    const a = ENEMY_ART[key];
    return build(a.w, a.h, (g) => a.draw(g, frame), a.outline);
  });
}
export function enemyFlash(key, frame) {
  return cached(`enF:${key}:${frame}`, () => tinted(enemySprite(key, frame), '#ffffff'));
}
export function enemyFrost(key, frame) {
  return cached(`enC:${key}:${frame}`, () => tinted(enemySprite(key, frame), '#7dd3fc'));
}

export function shadowSprite() {
  return cached('shadow', () => {
    const c = newCanvas(24, 10);
    const g = c.getContext('2d');
    g.scale(RES, RES);
    g.fillStyle = rg(g, 12, 5, 1, 12, [[0, 'rgba(0,0,0,0.5)'], [1, 'rgba(0,0,0,0)']]);
    g.beginPath();
    g.ellipse(12, 5, 12, 5, 0, 0, TAU);
    g.fill();
    c.w = 24;
    c.h = 10;
    return c;
  });
}

// ---------- coletáveis ----------
export const GEM_COLORS = ['#38bdf8', '#4ade80', '#f87171', '#c084fc'];

export function gemSprite(tier) {
  return cached(`gem:${tier}`, () => {
    const col = GEM_COLORS[tier];
    return build(10, 14, (g) => {
      poly(g, [[5, 0], [10, 6], [5, 14], [0, 6]], col);
      poly(g, [[5, 0], [10, 6], [5, 6.5], [0, 6]], shade(col, 0.4));
      poly(g, [[5, 6.5], [10, 6], [5, 14]], shade(col, -0.3));
      circ(g, 3.6, 4, 1, '#fff');
    });
  });
}

export function pickupSprite(kind) {
  return cached(`pk:${kind}`, () => {
    switch (kind) {
      case 'coin':
        return build(10, 10, (g) => {
          circ(g, 5, 5, 5, '#b45309');
          circ(g, 5, 5, 4, '#fbbf24');
          circ(g, 5, 5, 2.4, '#f59e0b');
          rect(g, 3, 2.4, 1.2, 2.6, '#fef3c7');
        });
      case 'coinbag':
        return build(16, 16, (g) => {
          ell(g, 8, 11, 7, 5.5, '#a16207');
          poly(g, [[5, 5], [11, 5], [9.5, 7.5], [6.5, 7.5]], '#854d0e');
          rect(g, 5.5, 6.5, 5, 1.5, '#fbbf24');
          circ(g, 8, 11.5, 2.5, '#fbbf24');
          circ(g, 4, 14, 2, '#fbbf24');
          circ(g, 12.5, 14, 2, '#fbbf24');
        });
      case 'potion':
        return build(14, 18, (g) => {
          rect(g, 5, 0, 4, 3, '#92400e');
          rect(g, 5, 3, 4, 4, '#cbd5e1');
          g.fillStyle = rg(g, 5, 10, 1, 7, [[0, '#fca5a5'], [0.5, '#dc2626'], [1, '#7f1d1d']]);
          g.beginPath();
          g.arc(7, 12, 6, 0, TAU);
          g.fill();
          ell(g, 5, 10, 1.6, 2.4, 'rgba(255,255,255,0.7)');
        });
      case 'magnet':
        return build(18, 18, (g) => {
          g.strokeStyle = '#dc2626';
          g.lineWidth = 4.5;
          g.beginPath();
          g.arc(9, 8, 6, Math.PI, 0, true);
          g.stroke();
          rect(g, 0.75, 8, 4.5, 3, '#dc2626');
          rect(g, 12.75, 8, 4.5, 3, '#dc2626');
          rect(g, 0.75, 11, 4.5, 4, '#e5e7eb');
          rect(g, 12.75, 11, 4.5, 4, '#e5e7eb');
        });
      case 'bomb':
        return build(20, 14, (g) => {
          rrect(g, 2, 2, 16, 10, 2, '#fde68a');
          rrect(g, 0, 1, 4, 12, 2, '#d97706');
          rrect(g, 16, 1, 4, 12, 2, '#d97706');
          line(g, 6, 5, 14, 5, '#a16207', 0.8);
          line(g, 6, 8, 13, 8, '#a16207', 0.8);
          circ(g, 10, 11, 2.5, '#dc2626');
        });
      case 'chest':
        return build(28, 22, (g) => {
          rrect(g, 1, 8, 26, 14, 2, '#78350f');
          g.fillStyle = lg(g, 0, 0, 0, 10, [[0, '#b45309'], [1, '#78350f']]);
          rrPath(g, 1, 1, 26, 9, 4);
          g.fill();
          rect(g, 1, 8.5, 26, 2, '#fbbf24');
          rect(g, 5, 1, 2.5, 21, '#fbbf24');
          rect(g, 20.5, 1, 2.5, 21, '#fbbf24');
          rrect(g, 11.5, 7, 5, 6, 1, '#fde047');
          rect(g, 13.5, 9.5, 1, 2, '#78350f');
        });
      default:
        return build(8, 8, (g) => circ(g, 4, 4, 4, '#fff'));
    }
  });
}

export function brazierSprite() {
  return cached('brazier', () =>
    build(18, 26, (g) => {
      line(g, 9, 12, 9, 25, '#44403c', 3);
      line(g, 4, 25, 14, 25, '#44403c', 3);
      g.fillStyle = lg(g, 0, 6, 0, 14, [[0, '#78716c'], [1, '#292524']]);
      g.beginPath();
      g.moveTo(1, 6);
      g.lineTo(17, 6);
      g.lineTo(13, 14);
      g.lineTo(5, 14);
      g.closePath();
      g.fill();
      rect(g, 1, 6, 16, 2, '#a8a29e');
    }),
  );
}

// ---------- projéteis ----------
export function knifeSprite(color = '#e2e8f0') {
  return cached(`knife:${color}`, () =>
    build(24, 7, (g) => {
      rect(g, 0, 2, 6, 3, '#78350f');
      rect(g, 5.5, 0, 1.6, 7, '#fbbf24');
      poly(g, [[7, 1.4], [24, 3.5], [7, 5.6]], color);
      line(g, 8, 3.5, 21, 3.5, shade(color, -0.35), 0.6);
    }),
  );
}

export function scytheSprite(color = '#cbd5e1') {
  return cached(`scythe:${color}`, () =>
    build(28, 28, (g) => {
      g.fillStyle = lg(g, 0, 0, 28, 28, [[0, shade(color, 0.4)], [1, shade(color, -0.35)]]);
      g.beginPath();
      g.arc(14, 14, 13, 0, TAU);
      g.fill();
      g.globalCompositeOperation = 'destination-out';
      g.beginPath();
      g.arc(18.5, 10.5, 10.5, 0, TAU);
      g.fill();
      g.globalCompositeOperation = 'source-over';
      circ(g, 6, 20, 2.6, '#78350f');
    }),
  );
}

export function orbSprite(color) {
  return cached(`orb:${color}`, () =>
    build(16, 16, (g) => {
      g.fillStyle = rg(g, 6, 6, 1, 9, [[0, shade(color, 0.5)], [0.5, color], [1, '#1e0b45']]);
      g.beginPath();
      g.arc(8, 8, 8, 0, TAU);
      g.fill();
      circ(g, 5.5, 5.5, 1.8, 'rgba(255,255,255,0.8)');
    }, '#12062a'),
  );
}
