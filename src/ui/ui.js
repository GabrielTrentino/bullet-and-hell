import { formatTime, clamp, TAU, fmtNum } from '../core/utils.js';
import { writeSave } from '../core/save.js';
import { CHARACTERS } from '../data/characters.js';
import { WEAPONS } from '../data/weapons.js';
import { PASSIVES } from '../data/passives.js';
import { SHOP } from '../data/shop.js';
import { RUN_LENGTH } from '../data/waves.js';
import { getIcon } from '../render/icons.js';
import { heroSprite, heroShadowed, rrPath, rgba, glow, pickupSprite } from '../render/sprites.js';
import { describeChoice } from '../systems/upgrades.js';

const FONT_UI = 'Rubik, system-ui, sans-serif';
const FONT_TITLE = 'Cinzel, Georgia, serif';
const COL = {
  text: '#ede8f7', dim: '#a59cbb', gold: '#fbbf24', panel: 'rgba(20,14,34,0.94)', border: '#3d3160',
  accent: '#a78bfa', red: '#f87171', green: '#4ade80', blue: '#93c5fd',
};

const NAV_NEXT = ['ArrowDown', 'ArrowRight', 'KeyS', 'KeyD', 'Tab'];
const NAV_PREV = ['ArrowUp', 'ArrowLeft', 'KeyW', 'KeyA'];

// Interface em modo imediato: cada tela desenha e trata cliques/teclas no mesmo passo.
export class UI {
  constructor(G) {
    this.G = G;
    this.focus = null;
    this.order = [];
    this.prevOrder = [];
    this.levelChoices = null;
    this.chest = null;
    this.selChar = 0;
    this.screenT = 0;
    this.lastState = null;
    this.t = 0;
  }

  update(dt) {
    this.t += dt;
    if (this.G.state !== this.lastState) {
      this.lastState = this.G.state;
      this.screenT = 0;
      this.focus = null;
    } else {
      this.screenT += dt;
    }
  }

  // ---------- primitivas ----------
  begin() {
    const G = this.G;
    const inp = G.input;
    this.scale = G.uiScale;
    this.W = G.W / this.scale;
    this.H = G.H / this.scale;
    this.mx = inp.mouse.x / this.scale;
    this.my = inp.mouse.y / this.scale;
    this.prevOrder = this.order;
    this.order = [];
    this.clicked = inp.mouse.clicked;
    this.activate = inp.anyPressed('Enter', 'NumpadEnter', 'Space');
    const next = inp.anyPressed(...NAV_NEXT);
    const prev = inp.anyPressed(...NAV_PREV);
    const n = this.prevOrder.length;
    if (n && (next || prev)) {
      const i = this.prevOrder.indexOf(this.focus);
      this.focus = this.prevOrder[i < 0 ? 0 : (i + (next ? 1 : -1) + n) % n];
      G.sound.play('move');
    }
    if (n && this.activate && !this.prevOrder.includes(this.focus)) this.focus = this.prevOrder[0];
  }

  // Bloqueia cliques logo após uma tela abrir, para evitar escolhas acidentais.
  get ready() {
    return this.screenT > 0.35;
  }

  txt(s, x, y, o = {}) {
    const c = this.c;
    const size = o.size || 16;
    c.font = `${o.weight || 500} ${size}px ${o.font || FONT_UI}`;
    c.textAlign = o.align || 'left';
    c.textBaseline = o.base || 'alphabetic';
    if (o.alpha !== undefined) c.globalAlpha = o.alpha;
    if (o.shadow !== false) {
      c.fillStyle = 'rgba(0,0,0,0.7)';
      c.fillText(s, x + 1, y + 2, o.max);
    }
    c.fillStyle = o.color || COL.text;
    c.fillText(s, x, y, o.max);
    c.globalAlpha = 1;
  }

  wrap(s, x, y, maxW, lineH, o = {}) {
    const c = this.c;
    c.font = `${o.weight || 400} ${o.size || 15}px ${o.font || FONT_UI}`;
    const words = s.split(' ');
    let lineStr = '';
    let yy = y;
    for (const w of words) {
      const test = lineStr ? `${lineStr} ${w}` : w;
      if (c.measureText(test).width > maxW && lineStr) {
        this.txt(lineStr, x, yy, o);
        lineStr = w;
        yy += lineH;
      } else {
        lineStr = test;
      }
    }
    if (lineStr) this.txt(lineStr, x, yy, o);
    return yy + lineH;
  }

  panel(x, y, w, h, o = {}) {
    const c = this.c;
    const r = o.r ?? 12;
    rrPath(c, x, y, w, h, r);
    const gr = c.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, o.fill || 'rgba(30,21,50,0.95)');
    gr.addColorStop(1, o.fill2 || 'rgba(15,10,26,0.95)');
    c.fillStyle = gr;
    c.fill();
    c.strokeStyle = o.border || COL.border;
    c.lineWidth = o.lw || 1.5;
    c.stroke();
  }

  overlay(alpha = 0.7) {
    const c = this.c;
    c.fillStyle = `rgba(6,3,12,${alpha})`;
    c.fillRect(0, 0, this.W, this.H);
  }

  icon(id, x, y, size) {
    const spr = getIcon(id);
    this.c.drawImage(spr, x, y, size, size);
  }

  iconBox(id, x, y, s, o = {}) {
    const c = this.c;
    rrPath(c, x, y, s, s, 6);
    c.fillStyle = 'rgba(12,8,22,0.9)';
    c.fill();
    c.strokeStyle = o.border || COL.border;
    c.lineWidth = o.evolved ? 2.5 : 1.5;
    c.stroke();
    this.icon(id, x + s * 0.06, y + s * 0.06, s * 0.88);
    if (o.badge) {
      c.font = `700 ${Math.round(s * 0.34)}px ${FONT_UI}`;
      c.textAlign = 'right';
      c.textBaseline = 'bottom';
      c.fillStyle = 'rgba(0,0,0,0.8)';
      c.fillText(o.badge, x + s - 1, y + s + 1);
      c.fillStyle = o.badgeColor || '#fff';
      c.fillText(o.badge, x + s - 2, y + s);
    }
  }

  button(id, x, y, w, h, label, o = {}) {
    const c = this.c;
    const G = this.G;
    const inside = this.mx >= x && this.mx <= x + w && this.my >= y && this.my <= y + h;
    this.order.push(id);
    if (inside && (G.input.mouse.moved || this.clicked) && this.focus !== id) {
      this.focus = id;
      if (!this.clicked) G.sound.play('move');
    }
    const active = this.focus === id;
    if (o.draw) {
      o.draw(active);
    } else {
      const lift = active && !o.disabled ? 2 : 0;
      rrPath(c, x, y - lift, w, h, 10);
      const gr = c.createLinearGradient(0, y, 0, y + h);
      if (o.disabled) {
        gr.addColorStop(0, '#1d1729');
        gr.addColorStop(1, '#151020');
      } else if (o.primary) {
        gr.addColorStop(0, active ? '#a855f7' : '#7c3aed');
        gr.addColorStop(1, active ? '#6d28d9' : '#4c1d95');
      } else {
        gr.addColorStop(0, active ? '#3b2a63' : '#271c42');
        gr.addColorStop(1, active ? '#24183f' : '#18112b');
      }
      c.fillStyle = gr;
      if (active && !o.disabled) {
        c.shadowColor = o.primary ? 'rgba(168,85,247,0.7)' : 'rgba(251,191,36,0.35)';
        c.shadowBlur = 18;
      }
      c.fill();
      c.shadowBlur = 0;
      c.strokeStyle = active && !o.disabled ? COL.gold : o.primary ? '#a78bfa' : COL.border;
      c.lineWidth = active ? 2 : 1.5;
      c.stroke();
      this.txt(label, x + w / 2, y + h / 2 - lift + 1, {
        size: o.size || 19, weight: 600, align: 'center', base: 'middle', color: o.disabled ? '#6b6280' : COL.text,
      });
    }
    if (o.disabled || !this.ready) return false;
    const hit = (inside && this.clicked) || (active && this.activate);
    if (hit) G.sound.play('select');
    return hit;
  }

  title(s, y, size = 40, color = COL.gold) {
    const c = this.c;
    c.save();
    c.shadowColor = rgba(color.startsWith('#') ? color : '#fbbf24', 0.6);
    c.shadowBlur = 24;
    this.txt(s, this.W / 2, y, { size, weight: 700, font: FONT_TITLE, align: 'center', color, shadow: false });
    c.restore();
  }

  // ---------- render principal ----------
  render(c) {
    const G = this.G;
    this.c = c;
    this.begin();
    c.setTransform(G.dpr * this.scale, 0, 0, G.dpr * this.scale, 0, 0);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    switch (G.state) {
      case 'title': this.titleScreen(); break;
      case 'select': this.selectScreen(); break;
      case 'shop': this.shopScreen(); break;
      case 'playing': this.hud(); break;
      case 'levelup': this.hud(); this.levelUpScreen(); break;
      case 'chest': this.hud(); this.chestScreen(); break;
      case 'paused': this.hud(); this.pauseScreen(); break;
      case 'gameover':
      case 'victory': this.endScreen(); break;
      default: break;
    }
  }

  // ---------- título ----------
  titleScreen() {
    const { W, H } = this;
    const G = this.G;
    const c = this.c;
    const n = CHARACTERS.length;
    const sc = clamp(W / 520, 1.4, 2.4);
    const gap = 40 * sc;
    for (let i = 0; i < n; i++) {
      const ch = CHARACTERS[i];
      const unlocked = G.save.unlocked[ch.id];
      const spr = unlocked ? heroSprite(ch.id, Math.floor(this.t * 2.5 + i) % 2) : heroShadowed(ch.id);
      const x = W / 2 + (i - (n - 1) / 2) * gap;
      const y = H - 24 - Math.abs(i - (n - 1) / 2) * 6;
      c.drawImage(spr, x - (spr.w * sc) / 2, y - spr.h * sc, spr.w * sc, spr.h * sc);
    }

    const ty = H * 0.2;
    const size = clamp(W * 0.075, 44, 96);
    c.save();
    c.shadowColor = 'rgba(147,51,234,0.9)';
    c.shadowBlur = 40;
    c.font = `700 ${size}px ${FONT_TITLE}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const gr = c.createLinearGradient(0, ty - size / 2, 0, ty + size / 2);
    gr.addColorStop(0, '#fef3c7');
    gr.addColorStop(0.5, '#fbbf24');
    gr.addColorStop(1, '#b45309');
    c.fillStyle = gr;
    c.fillText('BULLET & HELL', W / 2, ty);
    c.restore();
    this.txt('Sobreviva 15 minutos à horda das trevas.', W / 2, ty + size * 0.75, { size: 18, align: 'center', color: COL.dim });

    const bw = 300;
    const bh = 52;
    const bx = W / 2 - bw / 2;
    let by = ty + size * 0.75 + 40;
    if (this.button('play', bx, by, bw, bh, 'Jogar', { primary: true, size: 22 })) G.state = 'select';
    by += bh + 12;
    if (this.button('shop', bx, by, bw, bh, 'Santuário (melhorias)')) G.state = 'shop';
    by += bh + 12;
    const st = G.save.settings;
    if (this.button('sfx', bx, by, bw / 2 - 6, bh, `Sons: ${st.sfx ? 'sim' : 'não'}`, { size: 17 })) {
      G.sound.setSfx(!st.sfx);
      writeSave(G.save);
    }
    if (this.button('music', bx + bw / 2 + 6, by, bw / 2 - 6, bh, `Música: ${st.music ? 'sim' : 'não'}`, { size: 17 })) {
      G.sound.setMusic(!st.music);
      writeSave(G.save);
    }

    this.icon('coin', 20, 18, 26);
    this.txt(`${G.save.gold}`, 52, 38, { size: 20, weight: 700, color: COL.gold });
    const best = G.save.best;
    this.txt(
      `Recorde: ${formatTime(best.time)} · ${best.kills} abates · ${G.save.wins} vitórias`,
      W - 20, 38, { size: 15, align: 'right', color: COL.dim },
    );
    if (!G.input.touchMode) {
      this.txt('WASD/setas: mover · Esc: pausar · M: som', W / 2, by + bh + 34, { size: 14, align: 'center', color: '#7d7493' });
    }
  }

  // ---------- seleção de herói ----------
  selectScreen() {
    const { W, H } = this;
    const G = this.G;
    const c = this.c;
    this.title('Escolha seu herói', 62, 38);
    this.icon('coin', W - 120, 30, 24);
    this.txt(`${G.save.gold}`, W - 90, 49, { size: 19, weight: 700, color: COL.gold });

    const n = CHARACTERS.length;
    const cols = W >= 1050 ? 6 : 3;
    const rows = Math.ceil(n / cols);
    const cw = 150;
    const ch = 186;
    const gap = 14;
    const gx = (W - (cols * cw + (cols - 1) * gap)) / 2;
    const gy = 96;
    for (let i = 0; i < n; i++) {
      const hero = CHARACTERS[i];
      const x = gx + (i % cols) * (cw + gap);
      const y = gy + Math.floor(i / cols) * (ch + gap);
      const unlocked = G.save.unlocked[hero.id];
      const sel = this.selChar === i;
      const clicked = this.button(`char:${hero.id}`, x, y, cw, ch, '', {
        draw: (active) => {
          this.panel(x, y, cw, ch, { border: sel ? COL.gold : active ? '#8b7bb8' : COL.border, lw: sel ? 2.5 : 1.5 });
          if (sel) {
            c.globalCompositeOperation = 'lighter';
            c.drawImage(glow('#7c3aed'), x + cw / 2 - 70, y + 20, 140, 120);
            c.globalCompositeOperation = 'source-over';
          }
          const spr = unlocked ? heroSprite(hero.id, sel ? Math.floor(this.t * 3) % 2 : 0) : heroShadowed(hero.id);
          const s = 2.4;
          c.drawImage(spr, x + cw / 2 - (spr.w * s) / 2, y + 10, spr.w * s, spr.h * s);
          this.txt(hero.name, x + cw / 2, y + ch - 34, { size: 20, weight: 700, align: 'center', font: FONT_TITLE });
          this.txt(hero.title, x + cw / 2, y + ch - 13, { size: 13, align: 'center', color: COL.dim });
          if (!unlocked) {
            this.icon('lock', x + cw / 2 - 16, y + 50, 32);
            this.icon('coin', x + cw / 2 - 30, y + 92, 18);
            this.txt(`${hero.cost}`, x + cw / 2 - 8, y + 106, { size: 16, weight: 700, color: COL.gold });
          }
        },
      });
      if (clicked) {
        if (this.selChar === i && unlocked) {
          G.startRun(hero.id);
          return;
        }
        this.selChar = i;
      }
    }

    const hero = CHARACTERS[this.selChar];
    const unlocked = G.save.unlocked[hero.id];
    const py = gy + rows * (ch + gap) + 4;
    const pw = Math.min(760, W - 40);
    const px = (W - pw) / 2;
    const ph = 124;
    this.panel(px, py, pw, ph);
    this.txt(`${hero.name}, ${hero.title.toLowerCase()}`, px + 20, py + 32, { size: 22, weight: 700, font: FONT_TITLE, color: COL.gold });
    this.wrap(hero.desc, px + 20, py + 58, pw * 0.5 - 30, 20, { size: 15, color: COL.text });
    const wx = px + pw * 0.52;
    const wdef = WEAPONS[hero.weapon];
    this.txt('Arma inicial', wx, py + 30, { size: 13, color: COL.dim });
    this.iconBox(hero.weapon, wx, py + 40, 52, { border: '#6d5a9e' });
    this.txt(wdef.name, wx + 64, py + 60, { size: 18, weight: 700 });
    this.wrap(wdef.desc, wx + 64, py + 82, pw - (wx - px) - 84, 18, { size: 14, color: COL.dim });

    const by = py + ph + 18;
    const bw = 240;
    if (unlocked) {
      if (this.button('start', W / 2 - bw - 8, by, bw, 52, 'Começar', { primary: true, size: 21 })) {
        G.startRun(hero.id);
        return;
      }
    } else {
      const can = G.save.gold >= hero.cost;
      if (this.button('unlock', W / 2 - bw - 8, by, bw, 52, `Desbloquear (${hero.cost} ouro)`, { primary: can, disabled: !can, size: 18 })) {
        G.save.gold -= hero.cost;
        G.save.unlocked[hero.id] = true;
        writeSave(G.save);
        G.sound.play('chest');
      }
    }
    if (this.button('back', W / 2 + 8, by, bw, 52, 'Voltar') || (this.ready && G.input.wasPressed('Escape'))) G.state = 'title';
  }

  // ---------- loja ----------
  shopScreen() {
    const { W } = this;
    const G = this.G;
    const c = this.c;
    this.title('Santuário', 62, 38);
    this.txt('Melhorias permanentes que valem para todas as partidas.', W / 2, 92, { size: 15, align: 'center', color: COL.dim });
    this.icon('coin', W - 120, 30, 24);
    this.txt(`${G.save.gold}`, W - 90, 49, { size: 19, weight: 700, color: COL.gold });

    const cols = W >= 1150 ? 5 : W >= 720 ? 3 : 2;
    const cw = 206;
    const ch = 150;
    const gap = 14;
    const gx = (W - (cols * cw + (cols - 1) * gap)) / 2;
    const gy = 118;
    SHOP.forEach((u, i) => {
      const x = gx + (i % cols) * (cw + gap);
      const y = gy + Math.floor(i / cols) * (ch + gap);
      const lv = G.save.shop[u.id] || 0;
      const maxed = lv >= u.max;
      const cost = u.cost * (lv + 1);
      const can = !maxed && G.save.gold >= cost;
      const clicked = this.button(`shop:${u.id}`, x, y, cw, ch, '', {
        draw: (active) => {
          this.panel(x, y, cw, ch, { border: active ? (can ? COL.gold : '#8b7bb8') : COL.border, lw: active ? 2 : 1.5 });
          this.iconBox(u.icon, x + 14, y + 14, 44, { border: '#6d5a9e' });
          this.txt(u.name, x + 68, y + 34, { size: 17, weight: 700 });
          this.txt(u.desc, x + 68, y + 54, { size: 13, color: COL.dim, max: cw - 78 });
          for (let k = 0; k < u.max; k++) {
            rrPath(c, x + 14 + k * 22, y + 74, 18, 8, 3);
            c.fillStyle = k < lv ? COL.gold : 'rgba(255,255,255,0.1)';
            c.fill();
          }
          if (maxed) {
            this.txt('MÁXIMO', x + cw / 2, y + ch - 20, { size: 16, weight: 700, align: 'center', color: COL.green });
          } else {
            this.icon('coin', x + cw / 2 - 34, y + ch - 38, 20);
            this.txt(`${cost}`, x + cw / 2 - 10, y + ch - 22, { size: 18, weight: 700, color: can ? COL.gold : '#7d6f55' });
          }
        },
      });
      if (clicked) {
        if (can) {
          G.save.gold -= cost;
          G.save.shop[u.id] = lv + 1;
          writeSave(G.save);
          G.sound.play('coin');
        } else {
          G.sound.play('deny');
        }
      }
    });
    const rows = Math.ceil(SHOP.length / cols);
    const by = gy + rows * (ch + gap) + 6;
    if (this.button('back', W / 2 - 120, by, 240, 50, 'Voltar') || (this.ready && G.input.wasPressed('Escape'))) G.state = 'title';
  }

  // ---------- HUD ----------
  hud() {
    const G = this.G;
    const P = G.player;
    const r = G.run;
    const { W, H } = this;
    const c = this.c;
    if (!P) return;

    const bh = 16;
    c.fillStyle = 'rgba(8,5,16,0.88)';
    c.fillRect(0, 0, W, bh + 6);
    const k = clamp(P.xp / P.xpNext, 0, 1);
    const gr = c.createLinearGradient(0, 0, W, 0);
    gr.addColorStop(0, '#2563eb');
    gr.addColorStop(1, '#22d3ee');
    c.fillStyle = gr;
    c.fillRect(3, 3, (W - 6) * k, bh);
    c.fillStyle = 'rgba(255,255,255,0.25)';
    c.fillRect(3, 3, (W - 6) * k, 4);
    this.txt(`NV ${P.level}`, W - 10, bh + 1, { size: 14, weight: 700, align: 'right' });

    if (G.state === 'playing') {
      this.txt(formatTime(r.t), W / 2, 58, { size: 32, weight: 700, font: FONT_TITLE, align: 'center', color: r.t >= RUN_LENGTH ? COL.red : COL.text });
    }

    this.icon('skull', W - 132, 32, 22);
    this.txt(`${r.kills}`, W - 104, 50, { size: 18, weight: 700 });
    this.icon('coin', W - 132, 60, 22);
    this.txt(`${Math.round(r.gold)}`, W - 104, 78, { size: 18, weight: 700, color: COL.gold });

    let x = 10;
    for (const w of P.weapons) {
      this.iconBox(w.id, x, 30, 38, {
        border: w.evolved ? COL.gold : '#6d5a9e', evolved: w.evolved,
        badge: w.evolved ? '★' : w.maxed ? 'M' : `${w.level}`, badgeColor: w.evolved ? COL.gold : w.maxed ? '#f472b6' : '#fff',
      });
      x += 42;
    }
    x = 10;
    for (const id in P.passives) {
      const lv = P.passives[id];
      this.iconBox(id, x, 74, 30, { border: '#3f5a8a', badge: lv >= PASSIVES[id].max ? 'M' : `${lv}` });
      x += 34;
    }

    if (r.bosses.length) {
      const b = r.bosses[0];
      const bw = Math.min(560, W - 40);
      const bx = (W - bw) / 2;
      const by = H - 46;
      this.txt(b.def.name, W / 2, by - 8, { size: 18, weight: 700, font: FONT_TITLE, align: 'center', color: '#fca5a5' });
      rrPath(c, bx, by, bw, 14, 7);
      c.fillStyle = 'rgba(10,5,10,0.9)';
      c.fill();
      c.strokeStyle = '#7f1d1d';
      c.lineWidth = 1.5;
      c.stroke();
      const hk = clamp(b.hp / b.maxHp, 0, 1);
      rrPath(c, bx + 2, by + 2, (bw - 4) * hk, 10, 5);
      const bg = c.createLinearGradient(0, by, 0, by + 14);
      bg.addColorStop(0, '#f87171');
      bg.addColorStop(1, '#991b1b');
      c.fillStyle = bg;
      c.fill();
    }

    if (r.banner) {
      const b = r.banner;
      const a = Math.min(1, b.t / 0.4, (b.max - b.t) / 0.25 + 0.2);
      c.save();
      c.shadowColor = b.color;
      c.shadowBlur = 20;
      this.txt(b.text, W / 2, H * 0.24, { size: 30, weight: 700, font: FONT_TITLE, align: 'center', color: b.color, alpha: clamp(a, 0, 1), shadow: false });
      c.restore();
    }

    if (r.t < 6 && G.state === 'playing' && !G.input.touchMode) {
      this.txt('WASD/setas para mover · as armas atacam sozinhas · Esc para pausar', W / 2, H - 22, {
        size: 15, align: 'center', color: COL.dim, alpha: clamp(6 - r.t, 0, 1),
      });
    }

    if (G.input.touchMode && G.state === 'playing') {
      if (this.button('pause', W - 56, 92, 44, 44, 'II', { size: 18 })) G.state = 'paused';
      const s = G.input.stick;
      if (s.active) {
        const ox = s.ox / this.scale;
        const oy = s.oy / this.scale;
        c.strokeStyle = 'rgba(255,255,255,0.25)';
        c.lineWidth = 3;
        c.beginPath();
        c.arc(ox, oy, 50, 0, TAU);
        c.stroke();
        const dx = (s.x - s.ox) / this.scale;
        const dy = (s.y - s.oy) / this.scale;
        const l = Math.hypot(dx, dy);
        const m = Math.min(1, 45 / (l || 1));
        c.fillStyle = 'rgba(255,255,255,0.3)';
        c.beginPath();
        c.arc(ox + dx * m, oy + dy * m, 22, 0, TAU);
        c.fill();
      }
    }
  }

  // ---------- subir de nível ----------
  choiceCard(d, x, y, w, h, active, idx) {
    const c = this.c;
    const evo = d.kind === 'evo';
    this.panel(x, y, w, h, {
      border: active ? COL.gold : evo ? '#b45309' : COL.border, lw: active ? 2.5 : 1.5,
      fill: evo ? 'rgba(66,40,12,0.96)' : active ? 'rgba(48,32,80,0.97)' : undefined,
    });
    if (active || evo) {
      c.globalCompositeOperation = 'lighter';
      c.drawImage(glow(evo ? '#f59e0b' : '#7c3aed'), x - 10, y + h / 2 - 50, 120, 100);
      c.globalCompositeOperation = 'source-over';
    }
    const s = h - 24;
    this.iconBox(d.icon, x + 14, y + 12, s, { border: d.kind === 'passive' ? '#3f5a8a' : evo ? COL.gold : '#6d5a9e', evolved: evo });
    const tx = x + 14 + s + 16;
    this.txt(d.name, tx, y + 34, { size: 20, weight: 700, color: evo ? COL.gold : COL.text });
    if (d.tag) {
      c.font = `700 12px ${FONT_UI}`;
      const nameW = (() => {
        c.font = `700 20px ${FONT_UI}`;
        return c.measureText(d.name).width;
      })();
      c.font = `700 12px ${FONT_UI}`;
      const tw = c.measureText(d.tag).width + 14;
      const pxl = tx + nameW + 12;
      rrPath(c, pxl, y + 19, tw, 19, 9);
      c.fillStyle = rgba(d.tagColor, 0.18);
      c.fill();
      c.strokeStyle = d.tagColor;
      c.lineWidth = 1;
      c.stroke();
      this.txt(d.tag, pxl + tw / 2, y + 33, { size: 12, weight: 700, align: 'center', color: d.tagColor, shadow: false });
    }
    this.wrap(d.desc, tx, y + 60, w - (tx - x) - 46, 19, { size: 15, color: COL.dim });
    if (!this.G.input.touchMode) this.txt(`${idx + 1}`, x + w - 22, y + h / 2 + 6, { size: 18, weight: 700, color: '#6b6280', align: 'center' });
  }

  levelUpScreen() {
    const G = this.G;
    const { W, H } = this;
    this.overlay(0.72);
    const choices = this.levelChoices || [];
    this.title('SUBIU DE NÍVEL!', H * 0.14, 42);
    this.txt(`Nível ${G.player.level - G.run.pendingLevels + 1} · escolha uma melhoria`, W / 2, H * 0.14 + 34, { size: 16, align: 'center', color: COL.dim });
    const cw = Math.min(640, W - 40);
    const chh = 96;
    const x = (W - cw) / 2;
    let y = H * 0.14 + 58;
    for (let i = 0; i < choices.length; i++) {
      const d = describeChoice(G, choices[i]);
      const yy = y;
      const picked = this.button(`lv:${i}`, x, yy, cw, chh, '', { draw: (a) => this.choiceCard(d, x, yy, cw, chh, a, i) })
        || (this.ready && G.input.wasPressed(`Digit${i + 1}`));
      if (picked) {
        G.chooseLevel(choices[i]);
        return;
      }
      y += chh + 12;
    }
  }

  // ---------- baú ----------
  chestScreen() {
    const G = this.G;
    const { W, H } = this;
    const c = this.c;
    this.overlay(0.75);
    const ch = this.chest;
    if (!ch) return;
    this.title('TESOURO!', H * 0.14, 44);
    const k = Math.min(1, this.screenT / 0.5);
    c.globalCompositeOperation = 'lighter';
    c.drawImage(glow('#fbbf24'), W / 2 - 110, H * 0.17, 220, 160);
    c.globalCompositeOperation = 'source-over';
    const spr = pickupSprite('chest');
    const s = 3.2 + Math.sin(this.t * 4) * 0.1;
    c.drawImage(spr, W / 2 - (spr.w * s) / 2, H * 0.2, spr.w * s, spr.h * s);
    const cw = Math.min(560, W - 40);
    const x = (W - cw) / 2;
    let y = H * 0.2 + spr.h * 3.2 + 20;
    ch.rewards.forEach((d, i) => {
      const a = clamp(k * ch.rewards.length - i, 0, 1);
      c.globalAlpha = a;
      this.panel(x, y, cw, 64, { border: d.kind === 'evo' ? COL.gold : COL.border });
      this.iconBox(d.icon, x + 10, y + 8, 48, { border: d.kind === 'evo' ? COL.gold : '#6d5a9e' });
      this.txt(d.name, x + 72, y + 30, { size: 18, weight: 700, color: d.kind === 'evo' ? COL.gold : COL.text });
      this.txt(d.tag ? `${d.tag} · ${d.desc}` : d.desc, x + 72, y + 50, { size: 13, color: COL.dim, max: cw - 84 });
      c.globalAlpha = 1;
      y += 72;
    });
    this.icon('coin', W / 2 - 46, y + 4, 24);
    this.txt(`+${ch.gold} de ouro`, W / 2 - 16, y + 23, { size: 18, weight: 700, color: COL.gold });
    if (this.button('chestok', W / 2 - 120, y + 46, 240, 50, 'Continuar', { primary: true })) G.closeChest();
  }

  // ---------- pausa ----------
  statLines() {
    const s = this.G.player.stats;
    const pct = (v) => `${v >= 1 ? '+' : ''}${Math.round((v - 1) * 100)}%`;
    return [
      ['Vida máxima', `${Math.round(s.maxHp)}`],
      ['Regeneração', `${fmtNum(s.regen)}/s`],
      ['Armadura', `${s.armor}`],
      ['Dano', pct(s.might)],
      ['Área', pct(s.area)],
      ['Recarga', `${Math.round((1 - s.cooldown) * -100)}%`],
      ['Projéteis', `+${s.amount}`],
      ['Duração', pct(s.duration)],
      ['Velocidade', pct(s.speed)],
      ['Coleta', pct(s.magnet)],
      ['Crítico', `${Math.round(s.luck * 100)}%`],
      ['Experiência', pct(s.growth)],
    ];
  }

  pauseScreen() {
    const G = this.G;
    const { W, H } = this;
    this.overlay(0.78);
    this.title('PAUSADO', 66, 40);
    this.txt(`${formatTime(G.run.t)} · ${G.run.kills} abates · nível ${G.player.level}`, W / 2, 92, { size: 15, align: 'center', color: COL.dim });
    const P = G.player;
    const pw = Math.min(900, W - 40);
    const px = (W - pw) / 2;
    const py = 104;
    const lw = W >= 760 ? pw * 0.58 : pw;
    const ph = Math.min(H - py - 90, 330);
    this.panel(px, py, lw, ph);
    this.txt('Equipamento', px + 18, py + 30, { size: 17, weight: 700, color: COL.gold, font: FONT_TITLE });
    let y = py + 44;
    for (const w of P.weapons) {
      this.iconBox(w.id, px + 18, y, 34, { border: w.evolved ? COL.gold : '#6d5a9e' });
      this.txt(w.name, px + 62, y + 15, { size: 15, weight: 600, color: w.evolved ? COL.gold : COL.text });
      this.txt(w.evolved ? 'Evoluída' : `Nível ${w.level}`, px + 62, y + 31, { size: 12, color: COL.dim });
      this.txt(`${Math.round(w.dealt).toLocaleString('pt-BR')} de dano`, px + lw - 18, y + 22, { size: 14, align: 'right', color: COL.dim });
      y += 40;
    }
    let x = px + 18;
    for (const id in P.passives) {
      this.iconBox(id, x, y + 4, 32, { border: '#3f5a8a', badge: `${P.passives[id]}` });
      x += 38;
    }
    if (W >= 760) {
      const sx = px + lw + 14;
      const sw = pw - lw - 14;
      this.panel(sx, py, sw, ph);
      this.txt('Atributos', sx + 18, py + 30, { size: 17, weight: 700, color: COL.gold, font: FONT_TITLE });
      this.statLines().forEach(([k, v], i) => {
        const yy = py + 56 + i * 22;
        if (yy > py + ph - 8) return;
        this.txt(k, sx + 18, yy, { size: 14, color: COL.dim });
        this.txt(v, sx + sw - 18, yy, { size: 14, weight: 600, align: 'right' });
      });
    }
    const by = py + ph + 18;
    const bw = 200;
    const st = G.save.settings;
    const total = bw * 3 + 24;
    const bx = (W - total) / 2;
    if (this.button('resume', bx, by, bw, 50, 'Continuar', { primary: true }) || (this.ready && G.input.anyPressed('Escape', 'KeyP'))) {
      G.state = 'playing';
      return;
    }
    if (this.button('psound', bx + bw + 12, by, bw, 50, `Som: ${st.sfx || st.music ? 'ligado' : 'desligado'}`, { size: 17 })) G.toggleSound();
    if (this.button('quit', bx + (bw + 12) * 2, by, bw, 50, 'Desistir')) G.endRun(false);
  }

  // ---------- fim de partida ----------
  endScreen() {
    const G = this.G;
    const r = G.run;
    const P = G.player;
    const { W, H } = this;
    const c = this.c;
    const win = G.state === 'victory';
    this.overlay(0.82);
    this.title(win ? 'VITÓRIA!' : 'VOCÊ CAIU', 72, 48, win ? '#fde047' : '#f87171');
    this.txt(
      win ? 'O amanhecer chegou e a horda foi derrotada.' : 'A noite reclamou mais uma alma.',
      W / 2, 106, { size: 17, align: 'center', color: COL.dim },
    );
    const pw = Math.min(860, W - 40);
    const px = (W - pw) / 2;
    const py = 128;
    const wide = W >= 760;
    const lw = wide ? 280 : pw;
    const ph = Math.min(H - py - 90, 300);
    this.panel(px, py, lw, wide ? ph : 170);
    const heroSpr = heroSprite(r.char.id, 0);
    c.drawImage(heroSpr, px + 16, py + 14, heroSpr.w * 1.6, heroSpr.h * 1.6);
    this.txt(r.char.name, px + 90, py + 42, { size: 22, weight: 700, font: FONT_TITLE, color: COL.gold });
    this.txt(r.char.title, px + 90, py + 62, { size: 13, color: COL.dim });
    const lines = [
      ['Tempo', formatTime(r.t) + (r.newBest ? '  (recorde!)' : '')],
      ['Nível', `${P.level}`],
      ['Abates', r.kills.toLocaleString('pt-BR')],
      ['Ouro ganho', `${r.goldTotal}`],
    ];
    lines.forEach(([k, v], i) => {
      const yy = py + 110 + i * 26;
      if (!wide && i >= 2) {
        this.txt(k, px + lw / 2 + 10, py + 110 + (i - 2) * 26, { size: 15, color: COL.dim });
        this.txt(v, px + lw - 18, py + 110 + (i - 2) * 26, { size: 15, weight: 700, align: 'right', color: k === 'Ouro ganho' ? COL.gold : COL.text });
        return;
      }
      this.txt(k, px + 18, yy, { size: 15, color: COL.dim });
      this.txt(v, (wide ? px + lw : px + lw / 2) - 18, yy, { size: 15, weight: 700, align: 'right', color: k === 'Ouro ganho' ? COL.gold : COL.text });
    });

    if (wide) {
      const tx = px + lw + 14;
      const tw = pw - lw - 14;
      this.panel(tx, py, tw, ph);
      this.txt('Dano por arma', tx + 18, py + 30, { size: 17, weight: 700, color: COL.gold, font: FONT_TITLE });
      const total = P.weapons.reduce((a, w) => a + w.dealt, 0) || 1;
      let y = py + 46;
      const sorted = P.weapons.slice().sort((a, b) => b.dealt - a.dealt);
      for (const w of sorted) {
        if (y > py + ph - 40) break;
        this.iconBox(w.id, tx + 18, y, 34, { border: w.evolved ? COL.gold : '#6d5a9e' });
        this.txt(w.name, tx + 62, y + 14, { size: 14, weight: 600, color: w.evolved ? COL.gold : COL.text, max: tw - 200 });
        const barW = tw - 200;
        rrPath(c, tx + 62, y + 21, barW, 7, 3);
        c.fillStyle = 'rgba(255,255,255,0.08)';
        c.fill();
        rrPath(c, tx + 62, y + 21, Math.max(4, (barW * w.dealt) / total), 7, 3);
        c.fillStyle = w.color;
        c.fill();
        const secs = Math.max(1, r.t - w.acquired);
        this.txt(Math.round(w.dealt).toLocaleString('pt-BR'), tx + tw - 18, y + 14, { size: 14, weight: 700, align: 'right' });
        this.txt(`${Math.round(w.dealt / secs)}/s`, tx + tw - 18, y + 30, { size: 12, align: 'right', color: COL.dim });
        y += 42;
      }
    }

    const by = py + (wide ? ph : 170) + 20;
    const bw = 220;
    const bx = (W - (bw * 3 + 24)) / 2;
    if (this.button('again', bx, by, bw, 52, 'Jogar novamente', { primary: true })) {
      G.startRun(G.lastChar);
      return;
    }
    if (this.button('heroes', bx + bw + 12, by, bw, 52, 'Trocar herói')) {
      G.resetWorld();
      G.state = 'select';
      return;
    }
    if (this.button('menu', bx + (bw + 12) * 2, by, bw, 52, 'Menu principal')) {
      G.resetWorld();
      G.state = 'title';
      G.sound.stopMusic();
    }
  }
}
