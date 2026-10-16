import { Input } from './core/input.js';
import { Sound } from './core/audio.js';
import { loadSave, writeSave } from './core/save.js';
import { clamp, rand, TAU, SpatialGrid, dist2, chance, weightedPick } from './core/utils.js';
import { CHARACTERS } from './data/characters.js';
import { ENEMIES } from './data/enemies.js';
import { Player } from './entities/player.js';
import { Enemy } from './entities/enemy.js';
import { Spawner } from './systems/spawner.js';
import { updateEnemyAI } from './systems/ai.js';
import { updateWeapons, renderWeaponsUnder } from './systems/weapons.js';
import { updateProjectiles, renderProjectiles } from './systems/projectiles.js';
import { updatePickups, renderPickups, spawnPickup, dropGem } from './systems/pickups.js';
import { generateChoices, applyChoice, openChest } from './systems/upgrades.js';
import { Effects } from './render/effects.js';
import { Background } from './render/background.js';
import {
  glow, heroSprite, heroFlash, enemySprite, enemyFlash, enemyFrost, shadowSprite, brazierSprite,
} from './render/sprites.js';
import { UI } from './ui/ui.js';

const MAX_ENEMIES = 650;
const MAX_BULLETS = 700;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input(canvas);
    this.save = loadSave();
    this.sound = new Sound(this.save.settings);
    this.input.onGesture = () => this.sound.unlock();
    this.fx = new Effects();
    this.bg = new Background();
    this.grid = new SpatialGrid(72);
    this.state = 'title';
    this.time = 0;
    this.dtReal = 0;
    this.cam = { x: 0, y: 0 };
    this.shake = 0;
    this.lastChar = 'lyra';
    this.resetWorld();
    this.ui = new UI(this);
    this.resize();
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'playing') this.state = 'paused';
    });
  }

  resetWorld() {
    this.enemies = [];
    this.projectiles = [];
    this.bullets = [];
    this.pickups = [];
    this.braziers = [];
    this.timers = [];
    this.player = null;
    this.run = null;
    this.spawner = null;
    this.fx.clear();
    this.nextId = 1;
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.canvas.width = Math.round(this.W * this.dpr);
    this.canvas.height = Math.round(this.H * this.dpr);
    this.zoom = clamp(Math.min(this.W / 1280, this.H / 720) * 1.15, 0.6, 1.7);
    this.uiScale = clamp(Math.min(this.W / 1280, this.H / 760), 0.6, 1.3);
    this.vignette = null;
  }

  viewRadius() {
    return Math.hypot(this.W, this.H) / 2 / this.zoom;
  }

  get despawnR() {
    return this.viewRadius() + 450;
  }

  // ---------- transformações de desenho ----------
  computeWorld(cx, cy) {
    const sx = this.shake ? rand(-1, 1) * this.shake : 0;
    const sy = this.shake ? rand(-1, 1) * this.shake : 0;
    this.wa = this.dpr * this.zoom;
    this.wox = (this.W * this.dpr) / 2 - cx * this.wa + sx * this.dpr;
    this.woy = (this.H * this.dpr) / 2 - cy * this.wa + sy * this.dpr;
    this.viewCx = cx;
    this.viewCy = cy;
  }

  setWorld() {
    this.ctx.setTransform(this.wa, 0, 0, this.wa, this.wox, this.woy);
  }

  view(margin = 0) {
    const hw = this.W / 2 / this.zoom + margin;
    const hh = this.H / 2 / this.zoom + margin;
    return { x0: this.viewCx - hw, x1: this.viewCx + hw, y0: this.viewCy - hh, y1: this.viewCy + hh };
  }

  blit(spr, x, y, scale = 1, flip = false, alpha = 1, rot = 0) {
    const c = this.ctx;
    const a = this.wa * scale;
    if (alpha !== 1) c.globalAlpha = alpha;
    if (rot) {
      const cos = Math.cos(rot) * a;
      const sin = Math.sin(rot) * a;
      c.setTransform(cos, sin, -sin, cos, this.wox + x * this.wa, this.woy + y * this.wa);
    } else {
      c.setTransform(flip ? -a : a, 0, 0, a, this.wox + x * this.wa, this.woy + y * this.wa);
    }
    c.drawImage(spr, -spr.w / 2, -spr.h / 2, spr.w, spr.h);
    if (alpha !== 1) c.globalAlpha = 1;
  }

  // ---------- partida ----------
  startRun(charId) {
    const char = CHARACTERS.find((c) => c.id === charId) || CHARACTERS[0];
    this.lastChar = char.id;
    this.resetWorld();
    this.run = {
      t: 0, kills: 0, gold: 0, char, pendingLevels: 0, bosses: [], banner: null, dying: 0, victoryT: 0,
      gemCombo: 0, gemComboT: 0, hurtFlash: 0, whiteFlash: 0, victory: false,
    };
    this.player = new Player(this, char);
    this.spawner = new Spawner(this);
    this.cam.x = 0;
    this.cam.y = 0;
    this.shake = 0;
    this.state = 'playing';
    this.showBanner('Sobreviva até o amanhecer (15:00)', '#e9d5ff');
    this.sound.startMusic();
  }

  endRun(victory) {
    const r = this.run;
    const P = this.player;
    r.victory = victory;
    const timeBonus = Math.floor(r.t / 60) * 5;
    const winBonus = victory ? 500 : 0;
    r.goldTotal = Math.round(r.gold + timeBonus + winBonus);
    r.timeBonus = timeBonus;
    r.winBonus = winBonus;
    const s = this.save;
    s.gold += r.goldTotal;
    s.runs++;
    if (victory) s.wins++;
    r.newBest = r.t > s.best.time;
    s.best.time = Math.max(s.best.time, r.t);
    s.best.kills = Math.max(s.best.kills, r.kills);
    s.best.level = Math.max(s.best.level, P.level);
    writeSave(s);
    this.state = victory ? 'victory' : 'gameover';
    this.sound.play(victory ? 'victory' : 'death');
  }

  onPlayerDeath() {
    if (this.run.dying > 0) return;
    this.run.dying = 1.6;
    this.fx.burst(this.player.x, this.player.y, '#dc2626', 40, 220, 1, 4);
    this.shakeScreen(12);
  }

  schedule(delay, fn) {
    this.timers.push({ t: delay, fn });
  }

  showBanner(text, color = '#fbbf24', dur = 3) {
    if (this.run) this.run.banner = { text, color, t: dur, max: dur };
  }

  shakeScreen(n) {
    this.shake = Math.min(18, Math.max(this.shake, n));
  }

  // ---------- consultas ----------
  queryEnemies(x, y, r) {
    return this.grid.query(x, y, r, []);
  }

  enemiesInView() {
    const v = this.view(-20);
    return this.enemies.filter((e) => e.alive && e.x > v.x0 && e.x < v.x1 && e.y > v.y0 && e.y < v.y1);
  }

  // ---------- criação ----------
  addProjectile(p) {
    p.alive = true;
    p.age = 0;
    p.hits = new Map();
    p.rehit ??= Infinity;
    p.pierce ??= 0;
    p.vx ??= 0;
    p.vy ??= 0;
    this.projectiles.push(p);
    return p;
  }

  spawnEnemy(type, x, y, opts = {}) {
    if (this.enemies.length >= MAX_ENEMIES && !ENEMIES[type].boss) return null;
    const e = new Enemy(this, type, x, y, opts);
    this.enemies.push(e);
    return e;
  }

  spawnBoss(type, x, y, mult) {
    const e = this.spawnEnemy(type, x, y, { hpMult: mult });
    this.run.bosses.push(e);
    this.showBanner(`${e.def.name} despertou!`, '#f87171', 4);
    this.sound.play('boss');
    this.shakeScreen(10);
  }

  spawnBullet(x, y, angle, speed, dmg, opts = {}) {
    if (this.bullets.length >= MAX_BULLETS) return;
    this.bullets.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: opts.r || 6, dmg,
      life: opts.life || 7, color: opts.color || '#f43f5e', alive: true,
    });
  }

  // ---------- combate ----------
  hitEnemy(e, dmg, w, kx = 0, ky = 0, kb = 1) {
    if (!e.alive) return;
    const crit = Math.random() < this.player.stats.luck;
    let amount = dmg * (crit ? 2 : 1) * rand(0.9, 1.1);
    amount = Math.max(1, Math.round(amount));
    e.hp -= amount;
    e.flash = 0.1;
    if (w) w.dealt += amount;
    if (kb && !e.boss) {
      const res = 1 - (e.def.knockRes || 0);
      const f = 130 * kb * res * (e.elite ? 0.3 : 1);
      e.kbx += kx * f;
      e.kby += ky * f;
    }
    this.fx.text(e.x + rand(-6, 6), e.y - e.radius - 4, amount, crit);
    this.sound.play('hit');
    if (w && w.s.lifesteal && Math.random() < w.s.lifesteal) this.player.heal(1);
    if (e.hp <= 0) this.killEnemy(e, w);
  }

  killEnemy(e, w) {
    if (!e.alive) return;
    e.alive = false;
    const r = this.run;
    r.kills++;
    if (w) w.kills++;
    const d = e.def;
    this.fx.burst(e.x, e.y, d.blood, e.boss ? 60 : e.elite ? 24 : 9, e.boss ? 280 : 140, 0.55, e.boss ? 5 : 3);
    dropGem(this, e.x, e.y, e.xp);
    if (chance(0.022)) spawnPickup(this, 'coin', e.x + rand(-8, 8), e.y + rand(-8, 8));
    if (chance(0.0015)) spawnPickup(this, 'potion', e.x, e.y);
    if (d.split) {
      for (let i = 0; i < 2; i++) {
        this.spawnEnemy(d.split, e.x + rand(-10, 10), e.y + rand(-10, 10), { hpMult: this.spawner.hpMult() });
      }
    }
    if (e.elite) {
      spawnPickup(this, 'chest', e.x, e.y, { big: false });
      this.fx.ring(e.x, e.y, 10, 80, 0.5, '#fbbf24', 5);
    }
    if (e.boss) this.onBossKilled(e);
  }

  onBossKilled(e) {
    const r = this.run;
    r.bosses = r.bosses.filter((b) => b !== e && b.alive);
    this.sound.play('bossdie');
    this.shakeScreen(18);
    this.fx.ring(e.x, e.y, 20, 300, 0.8, e.def.blood, 10);
    for (const b of this.bullets) this.fx.burst(b.x, b.y, b.color, 1, 40, 0.4, 3, { add: true });
    this.bullets = [];
    for (let i = 0; i < 12; i++) spawnPickup(this, 'coin', e.x + rand(-40, 40), e.y + rand(-40, 40));
    if (e.def.final) {
      r.victoryT = 3;
      this.showBanner(`${e.def.name} foi derrotado!`, '#fde047', 3);
    } else {
      spawnPickup(this, 'chest', e.x, e.y, { big: true });
      this.showBanner(`${e.def.name} foi derrotado!`, '#fde047', 3);
    }
  }

  holyBlast() {
    const v = this.view(0);
    for (const e of this.enemies) {
      if (!e.alive || e.x < v.x0 || e.x > v.x1 || e.y < v.y0 || e.y > v.y1) continue;
      if (e.boss) this.hitEnemy(e, e.maxHp * 0.1, null);
      else this.killEnemy(e, null);
    }
    this.run.whiteFlash = 1;
    this.sound.play('holy');
    this.shakeScreen(8);
  }

  breakBraziersAt(x, y, r) {
    for (const b of this.braziers) {
      if (b.alive && dist2(b.x, b.y - 8, x, y) < (r + 12) * (r + 12)) this.breakBrazier(b);
    }
  }

  breakBrazier(b) {
    b.alive = false;
    this.fx.burst(b.x, b.y - 14, '#f97316', 18, 160, 0.6, 3, { add: true });
    this.fx.burst(b.x, b.y, '#57534e', 8, 100, 0.6, 3);
    this.sound.play('break');
    const kind = weightedPick({ potion: 32, coinbag: 26, magnet: 16, bomb: 9, bigGem: 17 });
    spawnPickup(this, kind, b.x, b.y);
  }

  onEvolve(w) {
    const P = this.player;
    this.fx.ring(P.x, P.y, 10, 160, 0.7, w.color, 8);
    this.fx.burst(P.x, P.y, w.color, 40, 260, 0.8, 4, { add: true });
    this.showBanner(`${w.name}!`, w.color, 3);
    this.sound.play('evolve');
  }

  openLevelUp() {
    this.state = 'levelup';
    const n = 3 + (this.player.stats.luck >= 0.2 ? 1 : 0);
    this.ui.levelChoices = generateChoices(this, n);
    this.sound.play('levelup');
  }

  chooseLevel(choice) {
    applyChoice(this, choice);
    this.run.pendingLevels--;
    if (this.run.pendingLevels > 0) {
      this.ui.levelChoices = generateChoices(this, 3 + (this.player.stats.luck >= 0.2 ? 1 : 0));
      this.ui.screenT = 0;
    } else {
      this.state = 'playing';
      this.levelBlast();
    }
  }

  // Ao subir de nível, uma onda empurra os inimigos próximos.
  levelBlast() {
    const P = this.player;
    this.fx.ring(P.x, P.y, 10, 140, 0.5, '#93c5fd', 6);
    this.fx.burst(P.x, P.y, '#bfdbfe', 20, 200, 0.6, 3, { add: true });
    for (const e of this.queryEnemies(P.x, P.y, 160)) {
      if (e.boss) continue;
      const dx = e.x - P.x;
      const dy = e.y - P.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < 160) {
        e.kbx += (dx / d) * 500;
        e.kby += (dy / d) * 500;
      }
    }
    P.invuln = Math.max(P.invuln, 0.6);
  }

  openChestPickup(big) {
    const rewards = openChest(this, big ? 3 : 1);
    const gold = Math.round((big ? 60 : 25) * this.player.stats.greed);
    this.run.gold += gold;
    this.ui.chest = { rewards, gold };
    this.state = 'chest';
    this.sound.play('chest');
  }

  closeChest() {
    this.state = 'playing';
    this.levelBlast();
  }

  toggleSound() {
    const on = !(this.save.settings.sfx || this.save.settings.music);
    this.sound.setSfx(on);
    this.sound.setMusic(on);
    writeSave(this.save);
  }

  // ---------- loop ----------
  frame(dt) {
    this.dtReal = dt;
    this.time += dt;
    if (this.input.wasPressed('KeyM')) this.toggleSound();
    if (this.state === 'playing') this.updateWorld(dt);
    else this.shake = Math.max(0, this.shake - dt * 30);
    // depois do mundo, para detectar telas abertas neste frame (pausa, nível)
    this.ui.update(dt);
    this.render();
    this.input.endFrame();
  }

  updateWorld(dt) {
    const r = this.run;
    const P = this.player;
    const inp = this.input;
    if (r.dying <= 0 && r.victoryT <= 0 && inp.anyPressed('Escape', 'KeyP')) {
      this.state = 'paused';
      this.sound.play('select');
      return;
    }
    if (r.dying > 0) {
      r.dying -= dt;
      dt *= 0.25;
      if (r.dying <= 0) {
        this.endRun(false);
        return;
      }
    }
    if (r.victoryT > 0) {
      r.victoryT -= dt;
      dt *= 0.35;
      if (r.victoryT <= 0) {
        this.endRun(true);
        return;
      }
    }
    const alive = r.dying <= 0;
    r.t += dt;

    for (let i = this.timers.length - 1; i >= 0; i--) {
      const tm = this.timers[i];
      tm.t -= dt;
      if (tm.t <= 0) {
        this.timers.splice(i, 1);
        if (alive) tm.fn();
      }
    }

    if (alive) P.update(dt);
    if (r.victoryT <= 0) this.spawner.update(dt);

    this.rebuildGrid();
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.alive) updateEnemyAI(e, this, dt);
    }
    this.separate();
    this.rebuildGrid();

    if (alive) updateWeapons(this, dt);
    updateProjectiles(this, dt);
    this.updateBullets(dt, alive);
    updatePickups(this, dt);
    this.updateBraziers(dt);
    if (alive) this.contactDamage();
    this.fx.update(dt);

    this.enemies = this.enemies.filter((e) => e.alive);
    r.bosses = r.bosses.filter((b) => b.alive);

    const follow = Math.min(1, dt * 8);
    this.cam.x += (P.x - this.cam.x) * follow;
    this.cam.y += (P.y - this.cam.y) * follow;
    this.shake = Math.max(0, this.shake - dt * 30);
    r.hurtFlash = Math.max(0, r.hurtFlash - dt * 2.5);
    r.whiteFlash = Math.max(0, r.whiteFlash - dt * 1.5);
    if (r.banner) {
      r.banner.t -= dt;
      if (r.banner.t <= 0) r.banner = null;
    }
    if (r.pendingLevels > 0 && alive && r.victoryT <= 0) this.openLevelUp();
  }

  rebuildGrid() {
    this.grid.clear();
    for (const e of this.enemies) if (e.alive) this.grid.insert(e);
  }

  separate() {
    const buf = [];
    for (const e of this.enemies) {
      if (!e.alive || e.boss) continue;
      this.grid.query(e.x, e.y, e.radius + 26, buf);
      for (let i = 0; i < buf.length; i++) {
        const o = buf[i];
        if (o === e || !o.alive) continue;
        const dx = e.x - o.x;
        const dy = e.y - o.y;
        const rr = e.radius + o.radius;
        const d2 = dx * dx + dy * dy;
        if (d2 < rr * rr && d2 > 0.0001) {
          const d = Math.sqrt(d2);
          const push = (rr - d) * (o.boss ? 0.6 : 0.25);
          e.x += (dx / d) * push;
          e.y += (dy / d) * push;
        }
      }
    }
  }

  contactDamage() {
    const P = this.player;
    if (P.invuln > 0) return;
    for (const e of this.queryEnemies(P.x, P.y, P.radius + 60)) {
      if (!e.alive || e.spawnT > 0) continue;
      const rr = P.radius + e.radius * 0.85;
      if (dist2(P.x, P.y, e.x, e.y) < rr * rr) {
        P.hurt(e.damage);
        return;
      }
    }
  }

  updateBullets(dt, alive) {
    const P = this.player;
    for (const b of this.bullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0) {
        b.alive = false;
        continue;
      }
      if (!alive) continue;
      const rr = P.radius * 0.7 + b.r;
      if (dist2(P.x, P.y, b.x, b.y) < rr * rr) {
        b.alive = false;
        this.fx.burst(b.x, b.y, b.color, 6, 100, 0.3, 3, { add: true });
        P.hurt(b.dmg);
      }
    }
    this.bullets = this.bullets.filter((b) => b.alive);
  }

  updateBraziers(dt) {
    const P = this.player;
    const far = (this.viewRadius() + 900) ** 2;
    this.braziers = this.braziers.filter((b) => b.alive && dist2(b.x, b.y, P.x, P.y) < far);
    if (this.braziers.length < 4 && Math.random() < dt * 0.25) {
      const a = rand(0, TAU);
      const d = this.viewRadius() + rand(60, 500);
      this.braziers.push({ x: P.x + Math.cos(a) * d, y: P.y + Math.sin(a) * d, alive: true, flick: rand(0, 10) });
    }
    for (const b of this.braziers) {
      b.flick += dt;
      if (b.alive && dist2(b.x, b.y, P.x, P.y) < (P.radius + 12) ** 2) this.breakBrazier(b);
    }
  }

  // ---------- renderização ----------
  render() {
    const c = this.ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = '#07060b';
    c.fillRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.run && this.player) this.renderWorld();
    else this.renderBackdrop();
    this.ui.render(c);
  }

  renderBackdrop() {
    const t = this.time;
    this.computeWorld(t * 22, t * 9);
    this.bg.draw(this, this.view(120));
    const c = this.ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    const w = this.canvas.width;
    const h = this.canvas.height;
    const gr = c.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, 'rgba(10,6,22,0.85)');
    gr.addColorStop(0.5, 'rgba(10,6,22,0.45)');
    gr.addColorStop(1, 'rgba(10,6,22,0.8)');
    c.fillStyle = gr;
    c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'lighter';
    const moon = c.createRadialGradient(w * 0.5, h * 0.22, 0, w * 0.5, h * 0.22, h * 0.55);
    moon.addColorStop(0, 'rgba(124,58,237,0.28)');
    moon.addColorStop(1, 'rgba(124,58,237,0)');
    c.fillStyle = moon;
    c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'source-over';
    this.drawVignette();
  }

  drawVignette() {
    const c = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    if (!this.vignette) {
      const v = document.createElement('canvas');
      v.width = w;
      v.height = h;
      const g = v.getContext('2d');
      const gr = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.6);
      gr.addColorStop(0, 'rgba(0,0,0,0)');
      gr.addColorStop(1, 'rgba(0,0,0,0.7)');
      g.fillStyle = gr;
      g.fillRect(0, 0, w, h);
      this.vignette = v;
    }
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(this.vignette, 0, 0);
  }

  renderWorld() {
    const c = this.ctx;
    const P = this.player;
    const r = this.run;
    this.computeWorld(this.cam.x, this.cam.y);
    const v = this.view(80);
    this.bg.draw(this, this.view(120));

    for (const b of this.braziers) this.drawBrazier(b);
    renderPickups(this);
    renderWeaponsUnder(this);

    const vis = this.enemies.filter((e) => e.x > v.x0 && e.x < v.x1 && e.y > v.y0 && e.y < v.y1);
    vis.sort((a, b) => a.y - b.y);
    const shadow = shadowSprite();
    for (const e of vis) this.blit(shadow, e.x, e.y + e.radius * 0.85, e.radius / 11);
    this.blit(shadow, P.x, P.y + 18, 1.1);

    let playerDrawn = false;
    for (const e of vis) {
      if (!playerDrawn && e.y > P.y) {
        this.drawPlayer();
        playerDrawn = true;
      }
      this.drawEnemy(e);
    }
    if (!playerDrawn) this.drawPlayer();

    renderProjectiles(this);
    this.drawBullets(v);
    this.fx.render(this);
    this.drawPlayerBar();

    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    this.drawVignette();
    const w = this.canvas.width;
    const h = this.canvas.height;
    const low = P.hp / P.stats.maxHp;
    const red = Math.max(r.hurtFlash * 0.5, low < 0.3 ? (0.3 - low) * 1.4 * (0.6 + Math.sin(this.time * 6) * 0.4) : 0);
    if (red > 0.01) {
      const gr = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.hypot(w, h) * 0.6);
      gr.addColorStop(0, 'rgba(220,38,38,0)');
      gr.addColorStop(1, `rgba(220,38,38,${Math.min(0.7, red)})`);
      c.fillStyle = gr;
      c.fillRect(0, 0, w, h);
    }
    if (r.whiteFlash > 0) {
      c.fillStyle = `rgba(255,255,240,${r.whiteFlash * 0.7})`;
      c.fillRect(0, 0, w, h);
    }
    if (r.victoryT > 0) {
      c.fillStyle = `rgba(255,236,180,${(1 - r.victoryT / 3) * 0.6})`;
      c.fillRect(0, 0, w, h);
    }
  }

  drawPlayer() {
    const P = this.player;
    if (this.run.dying > 0 && this.run.dying < 1.2) return;
    const id = this.run.char.id;
    const frame = P.moving ? Math.floor(P.anim) % 2 : 0;
    const breathe = P.moving ? 1 : 1 + Math.sin(this.time * 3) * 0.015;
    const blink = P.invuln > 0 && Math.floor(P.invuln * 18) % 2 === 0;
    const spr = blink ? heroFlash(id, frame) : heroSprite(id, frame);
    const c = this.ctx;
    const a = this.wa;
    c.setTransform(a * P.faceSign, 0, 0, a * breathe, this.wox + P.x * a, this.woy + (P.y + 22) * a);
    c.drawImage(spr, -spr.w / 2, -spr.h, spr.w, spr.h);
  }

  drawPlayerBar() {
    const P = this.player;
    const c = this.ctx;
    this.setWorld();
    const w = 34;
    const x = P.x - w / 2;
    const y = P.y + 26;
    c.fillStyle = 'rgba(10,6,16,0.85)';
    c.fillRect(x - 1, y - 1, w + 2, 6);
    const k = P.hp / P.stats.maxHp;
    c.fillStyle = k > 0.5 ? '#22c55e' : k > 0.25 ? '#facc15' : '#ef4444';
    c.fillRect(x, y, w * k, 4);
  }

  drawEnemy(e) {
    const frame = Math.floor(e.anim) % 2;
    const flip = e.face < 0;
    let alpha = e.def.alpha || 1;
    if (e.spawnT > 0) alpha *= 1 - e.spawnT / 0.25;
    const c = this.ctx;
    if (e.elite || e.boss) {
      c.globalCompositeOperation = 'lighter';
      const col = e.boss ? e.def.blood : '#fbbf24';
      this.blit(glow(col), e.x, e.y, (e.radius * 2.2) / 32, false, 0.35 + Math.sin(this.time * 4) * 0.1);
      c.globalCompositeOperation = 'source-over';
    }
    if (e.state.windup > 0) {
      this.setWorld();
      c.strokeStyle = `rgba(239,68,68,${0.3 + (0.7 - e.state.windup) * 0.8})`;
      c.lineWidth = e.radius * 1.2;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(e.x, e.y);
      c.lineTo(e.x + e.state.dx * 380, e.y + e.state.dy * 380);
      c.stroke();
    }
    const key = e.sprite;
    this.blit(enemySprite(key, frame), e.x, e.y, e.scale, flip, alpha);
    if (e.flash > 0) this.blit(enemyFlash(key, frame), e.x, e.y, e.scale, flip, Math.min(1, e.flash * 10) * 0.85);
    else if (e.slowAmt > 0) this.blit(enemyFrost(key, frame), e.x, e.y, e.scale, flip, e.slowAmt >= 1 ? 0.7 : 0.35);
    if (e.elite && !e.boss) {
      const k = e.hp / e.maxHp;
      this.setWorld();
      const w = e.radius * 2;
      c.fillStyle = 'rgba(0,0,0,0.7)';
      c.fillRect(e.x - w / 2, e.y - e.radius * 1.6 - 6, w, 4);
      c.fillStyle = '#fbbf24';
      c.fillRect(e.x - w / 2, e.y - e.radius * 1.6 - 6, w * k, 4);
    }
  }

  drawBrazier(b) {
    if (!b.alive) return;
    const c = this.ctx;
    this.blit(shadowSprite(), b.x, b.y + 10, 0.8);
    this.blit(brazierSprite(), b.x, b.y);
    const f = 1 + Math.sin(b.flick * 13) * 0.08 + Math.sin(b.flick * 7) * 0.06;
    c.globalCompositeOperation = 'lighter';
    this.blit(glow('#f97316'), b.x, b.y - 14, 1.2 * f, false, 0.5);
    this.blit(glow('#fb923c'), b.x, b.y - 13, 0.45 * f);
    this.blit(glow('#fde047'), b.x, b.y - 11, 0.22 * f);
    c.globalCompositeOperation = 'source-over';
    if (Math.random() < 0.1) this.fx.ember(b.x, b.y - 16);
  }

  drawBullets(v) {
    const c = this.ctx;
    c.globalCompositeOperation = 'lighter';
    for (const b of this.bullets) {
      if (b.x < v.x0 || b.x > v.x1 || b.y < v.y0 || b.y > v.y1) continue;
      this.blit(glow(b.color), b.x, b.y, (b.r * 2.6) / 32);
      this.blit(glow('#ffffff'), b.x, b.y, (b.r * 0.9) / 32);
    }
    c.globalCompositeOperation = 'source-over';
  }
}
