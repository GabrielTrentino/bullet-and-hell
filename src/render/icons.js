import { TAU } from '../core/utils.js';
import { build, cached, circ, ell, poly, rect, rrect, line, lg, rg, star } from './sprites.js';

// Ícones 32×32 de armas, passivas e itens da interface.
const ICONS = {
  // armas
  wand(g) {
    line(g, 6, 28, 22, 10, '#92400e', 3);
    circ(g, 24, 8, 7, 'rgba(129,140,248,0.35)');
    circ(g, 24, 8, 4.5, '#818cf8');
    circ(g, 22.5, 6.5, 1.5, '#fff');
    star(g, 10, 9, 2.5, '#c7d2fe', 4);
    star(g, 26, 22, 2, '#c7d2fe', 4);
  },
  knife(g) {
    g.save();
    g.translate(16, 16);
    g.rotate(-Math.PI / 4);
    rect(g, -13, -2, 7, 4, '#78350f');
    rect(g, -6.5, -4.5, 2, 9, '#fbbf24');
    poly(g, [[-4.5, -2.6], [14, 0], [-4.5, 2.6]], '#e2e8f0');
    g.restore();
  },
  sword(g) {
    g.save();
    g.translate(16, 16);
    g.rotate(-Math.PI / 4);
    poly(g, [[-6, -2.5], [12, -2.5], [15, 0], [12, 2.5], [-6, 2.5]], '#f1f5f9');
    line(g, -5, 0, 12, 0, '#94a3b8', 0.8);
    rect(g, -8, -6, 2.5, 12, '#fbbf24');
    rect(g, -14, -1.5, 6, 3, '#78350f');
    circ(g, -14.5, 0, 2, '#fbbf24');
    g.restore();
  },
  fireball(g) {
    poly(g, [[6, 26], [14, 12], [22, 20]], '#b91c1c');
    circ(g, 19, 13, 9, 'rgba(249,115,22,0.4)');
    circ(g, 19, 13, 7, '#f97316');
    circ(g, 20, 12, 4, '#fde047');
    circ(g, 21, 11, 1.6, '#fff');
  },
  orbs(g) {
    g.strokeStyle = 'rgba(168,85,247,0.5)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(16, 16, 10, 0, TAU);
    g.stroke();
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU - Math.PI / 2;
      const x = 16 + Math.cos(a) * 10;
      const y = 16 + Math.sin(a) * 10;
      g.fillStyle = rg(g, x - 1.5, y - 1.5, 0.5, 5, [[0, '#e9d5ff'], [0.5, '#a855f7'], [1, '#3b0764']]);
      g.beginPath();
      g.arc(x, y, 4.6, 0, TAU);
      g.fill();
    }
  },
  aura(g) {
    g.fillStyle = rg(g, 16, 16, 2, 14, [[0, 'rgba(253,230,138,0.9)'], [0.6, 'rgba(251,191,36,0.35)'], [1, 'rgba(251,191,36,0)']]);
    g.beginPath();
    g.arc(16, 16, 14, 0, TAU);
    g.fill();
    g.strokeStyle = '#fbbf24';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(16, 16, 11, 0, TAU);
    g.stroke();
    rect(g, 14.8, 9, 2.4, 14, '#fff7d6');
    rect(g, 10, 13.5, 12, 2.4, '#fff7d6');
  },
  lightning(g) {
    poly(g, [[19, 2], [7, 18], [14.5, 18], [11, 30], [25, 12], [17, 12], [21, 2]], '#fde047');
    poly(g, [[19, 4], [10, 17], [15, 17]], '#fef9c3');
  },
  boomerang(g) {
    g.fillStyle = lg(g, 0, 0, 32, 32, [[0, '#f8fafc'], [1, '#64748b']]);
    g.beginPath();
    g.arc(16, 16, 13, 0, TAU);
    g.fill();
    g.globalCompositeOperation = 'destination-out';
    g.beginPath();
    g.arc(20.5, 12, 11, 0, TAU);
    g.fill();
    g.globalCompositeOperation = 'source-over';
    circ(g, 7.5, 22, 3, '#78350f');
  },
  frost(g) {
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI;
      const dx = Math.cos(a) * 13;
      const dy = Math.sin(a) * 13;
      line(g, 16 - dx, 16 - dy, 16 + dx, 16 + dy, '#bae6fd', 2.4);
      for (const s of [-1, 1]) {
        const bx = 16 + dx * 0.6 * s;
        const by = 16 + dy * 0.6 * s;
        const pa = a + Math.PI / 2;
        line(g, bx, by, bx + (Math.cos(pa) * 3 + dx * 0.15 * s), by + (Math.sin(pa) * 3 + dy * 0.15 * s), '#e0f2fe', 1.5);
        line(g, bx, by, bx - (Math.cos(pa) * 3 - dx * 0.15 * s), by - (Math.sin(pa) * 3 - dy * 0.15 * s), '#e0f2fe', 1.5);
      }
    }
    circ(g, 16, 16, 3, '#7dd3fc');
  },
  // passivas
  might(g) {
    poly(g, [[16, 2], [21, 18], [16, 30], [11, 18]], '#dc2626');
    poly(g, [[16, 2], [21, 18], [16, 18]], '#f87171');
    poly(g, [[6, 10], [12, 20], [8, 26]], '#b91c1c');
    poly(g, [[26, 10], [20, 20], [24, 26]], '#b91c1c');
  },
  cooldown(g) {
    rrect(g, 5, 5, 22, 23, 2, '#4c1d95');
    rect(g, 8, 7, 17, 19, '#ede9fe');
    rect(g, 5, 5, 4, 23, '#6d28d9');
    line(g, 12, 12, 22, 12, '#a78bfa', 1);
    line(g, 12, 16, 22, 16, '#a78bfa', 1);
    line(g, 12, 20, 19, 20, '#a78bfa', 1);
    star(g, 23, 7, 3, '#fbbf24', 4);
  },
  area(g) {
    rrect(g, 12, 13, 8, 15, 1.5, '#fef3c7');
    rect(g, 10, 27, 12, 3, '#a16207');
    line(g, 16, 13, 16, 10, '#1c1917', 1);
    circ(g, 16, 7, 6, 'rgba(251,191,36,0.35)');
    poly(g, [[16, 1], [19, 8], [16, 11], [13, 8]], '#f97316');
    poly(g, [[16, 4], [17.5, 8], [16, 10], [14.5, 8]], '#fde047');
  },
  speed(g) {
    poly(g, [[8, 8], [16, 8], [16, 20], [26, 22], [26, 28], [8, 28]], '#92400e');
    rect(g, 8, 25, 18, 3, '#451a03');
    poly(g, [[8, 10], [1, 4], [3, 12], [0, 14], [7, 17]], '#f8fafc');
    poly(g, [[8, 13], [2, 18], [8, 19]], '#e2e8f0');
  },
  maxHp(g) {
    g.fillStyle = rg(g, 12, 11, 1, 16, [[0, '#fca5a5'], [0.5, '#ef4444'], [1, '#991b1b']]);
    g.beginPath();
    g.moveTo(16, 28);
    g.bezierCurveTo(2, 18, 3, 6, 10, 6);
    g.bezierCurveTo(13, 6, 15, 8, 16, 10);
    g.bezierCurveTo(17, 8, 19, 6, 22, 6);
    g.bezierCurveTo(29, 6, 30, 18, 16, 28);
    g.fill();
    ell(g, 10, 11, 2.5, 1.6, 'rgba(255,255,255,0.7)', -0.5);
  },
  armor(g) {
    g.fillStyle = lg(g, 4, 0, 28, 0, [[0, '#94a3b8'], [1, '#475569']]);
    g.beginPath();
    g.moveTo(16, 3);
    g.lineTo(27, 7);
    g.lineTo(26, 18);
    g.quadraticCurveTo(23, 26, 16, 30);
    g.quadraticCurveTo(9, 26, 6, 18);
    g.lineTo(5, 7);
    g.closePath();
    g.fill();
    star(g, 16, 16, 6, '#38bdf8', 4);
  },
  magnet(g) {
    g.strokeStyle = '#dc2626';
    g.lineWidth = 6;
    g.beginPath();
    g.arc(16, 14, 9, Math.PI, 0, true);
    g.stroke();
    rect(g, 4, 14, 6, 6, '#dc2626');
    rect(g, 22, 14, 6, 6, '#dc2626');
    rect(g, 4, 20, 6, 6, '#e5e7eb');
    rect(g, 22, 20, 6, 6, '#e5e7eb');
  },
  duration(g) {
    rect(g, 7, 3, 18, 3, '#a16207');
    rect(g, 7, 26, 18, 3, '#a16207');
    g.fillStyle = 'rgba(186,230,253,0.5)';
    g.beginPath();
    g.moveTo(9, 6);
    g.lineTo(23, 6);
    g.lineTo(17.5, 16);
    g.lineTo(23, 26);
    g.lineTo(9, 26);
    g.lineTo(14.5, 16);
    g.closePath();
    g.fill();
    poly(g, [[11, 8], [21, 8], [16, 14]], '#fbbf24');
    poly(g, [[16, 19], [21.5, 25], [10.5, 25]], '#fbbf24');
  },
  luck(g) {
    line(g, 16, 17, 20, 29, '#15803d', 2);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + Math.PI / 4;
      circ(g, 16 + Math.cos(a) * 6, 15 + Math.sin(a) * 6, 5.2, i % 2 ? '#22c55e' : '#4ade80');
    }
    circ(g, 16, 15, 2, '#bbf7d0');
  },
  amount(g) {
    circ(g, 12, 16, 8, '#0891b2');
    circ(g, 20, 16, 8, '#22d3ee');
    rect(g, 18.5, 11, 3, 10, '#fff');
    rect(g, 15, 14.5, 10, 3, '#fff');
  },
  regen(g) {
    g.fillStyle = rg(g, 13, 14, 1, 14, [[0, '#bbf7d0'], [0.5, '#22c55e'], [1, '#14532d']]);
    g.beginPath();
    g.moveTo(16, 3);
    g.bezierCurveTo(26, 14, 26, 28, 16, 28);
    g.bezierCurveTo(6, 28, 6, 14, 16, 3);
    g.fill();
    rect(g, 14.8, 13, 2.4, 10, '#f0fdf4');
    rect(g, 11, 16.8, 10, 2.4, '#f0fdf4');
  },
  growth(g) {
    poly(g, [[4, 24], [5, 9], [11, 16], [16, 6], [21, 16], [27, 9], [28, 24]], '#fbbf24');
    rect(g, 4, 23, 24, 5, '#d97706');
    circ(g, 16, 25.5, 2, '#ef4444');
    circ(g, 9, 25.5, 1.5, '#22d3ee');
    circ(g, 23, 25.5, 1.5, '#22d3ee');
  },
  greed(g) {
    for (const [x, y] of [[10, 24], [16, 24], [22, 24], [13, 18], [19, 18], [16, 12]]) {
      ell(g, x, y, 6, 3, '#b45309');
      ell(g, x, y - 1, 6, 3, '#fbbf24');
    }
  },
  // interface
  coin(g) {
    circ(g, 16, 16, 12, '#b45309');
    circ(g, 16, 16, 10, '#fbbf24');
    circ(g, 16, 16, 6, '#f59e0b');
    rect(g, 11, 9, 2.5, 6, '#fef3c7');
  },
  skull(g) {
    circ(g, 16, 14, 10, '#e7e5e4');
    rrect(g, 10, 19, 12, 8, 2, '#e7e5e4');
    circ(g, 12, 14, 3, '#1c1917');
    circ(g, 20, 14, 3, '#1c1917');
    poly(g, [[16, 17], [14.5, 21], [17.5, 21]], '#1c1917');
    rect(g, 12.5, 24, 1.2, 3, '#78716c');
    rect(g, 15.4, 24, 1.2, 3, '#78716c');
    rect(g, 18.3, 24, 1.2, 3, '#78716c');
  },
  potion(g) {
    rect(g, 13, 3, 6, 4, '#92400e');
    rect(g, 13, 7, 6, 5, '#cbd5e1');
    g.fillStyle = rg(g, 13, 18, 1, 11, [[0, '#fca5a5'], [0.5, '#dc2626'], [1, '#7f1d1d']]);
    g.beginPath();
    g.arc(16, 20, 9, 0, TAU);
    g.fill();
    ell(g, 12.5, 17, 2, 3, 'rgba(255,255,255,0.7)');
  },
  lock(g) {
    g.strokeStyle = '#a8a29e';
    g.lineWidth = 3.5;
    g.beginPath();
    g.arc(16, 13, 6.5, Math.PI, 0);
    g.stroke();
    rrect(g, 7, 13, 18, 15, 3, '#d6d3d1');
    circ(g, 16, 19, 2.5, '#44403c');
    rect(g, 15, 19, 2, 5, '#44403c');
  },
  chest(g) {
    rrect(g, 3, 13, 26, 15, 2, '#78350f');
    rrect(g, 3, 5, 26, 10, 4, '#b45309');
    rect(g, 3, 13, 26, 2.5, '#fbbf24');
    rect(g, 7, 5, 3, 23, '#fbbf24');
    rect(g, 22, 5, 3, 23, '#fbbf24');
    rrect(g, 13, 11, 6, 7, 1, '#fde047');
  },
};

export function getIcon(id) {
  return cached(`icon:${id}`, () => build(32, 32, ICONS[id] || ICONS.coin));
}
