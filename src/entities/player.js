import { PASSIVES } from '../data/passives.js';
import { SHOP } from '../data/shop.js';
import { WeaponInstance } from '../systems/weapons.js';
import { rand } from '../core/utils.js';

// Atributos base. Personagem, loja e passivas somam a estes valores.
export const BASE_STATS = {
  maxHp: 100, regen: 0, armor: 0, speed: 1, might: 1, area: 1, cooldown: 1, amount: 0,
  duration: 1, projSpeed: 1, magnet: 1, luck: 0.05, growth: 1, greed: 1,
};

const MOVE_SPEED = 140;
const PICKUP_RANGE = 62;

export function xpForLevel(level) {
  return Math.floor(5 + (level - 1) * 10 + Math.max(0, level - 20) * 8 + Math.max(0, level - 40) * 12);
}

export class Player {
  constructor(G, char) {
    this.G = G;
    this.char = char;
    this.x = 0;
    this.y = 0;
    this.radius = 12;
    this.level = 1;
    this.xp = 0;
    this.xpNext = xpForLevel(1);
    this.weapons = [];
    this.passives = {};
    this.facing = { x: 1, y: 0 };
    this.faceSign = 1;
    this.invuln = 0;
    this.anim = 0;
    this.moving = false;
    this.stats = null;
    this.hp = 0;
    this.computeStats();
    this.hp = this.stats.maxHp;
    this.addWeapon(char.weapon);
  }

  get magnetRange() {
    return PICKUP_RANGE * this.stats.magnet;
  }

  computeStats() {
    const s = { ...BASE_STATS };
    for (const k in this.char.stats) s[k] += this.char.stats[k];
    for (const u of SHOP) {
      const lv = this.G.save.shop[u.id] || 0;
      if (lv) s[u.stat] += u.per * lv;
    }
    for (const id in this.passives) {
      const p = PASSIVES[id];
      s[p.stat] += p.per * this.passives[id];
    }
    s.cooldown = Math.max(0.35, s.cooldown);
    s.speed = Math.max(0.4, s.speed);
    s.maxHp = Math.max(20, s.maxHp);
    const prevMax = this.stats ? this.stats.maxHp : s.maxHp;
    this.stats = s;
    if (s.maxHp > prevMax) this.hp += s.maxHp - prevMax;
    this.hp = Math.min(this.hp, s.maxHp);
  }

  weapon(id) {
    return this.weapons.find((w) => w.id === id);
  }

  addWeapon(id) {
    const w = new WeaponInstance(id, this.G.run ? this.G.run.t : 0);
    this.weapons.push(w);
    return w;
  }

  update(dt) {
    const a = this.G.input.axis();
    this.moving = a.x !== 0 || a.y !== 0;
    if (this.moving) {
      const l = Math.hypot(a.x, a.y);
      this.facing.x = a.x / l;
      this.facing.y = a.y / l;
      if (Math.abs(a.x) > 0.1) this.faceSign = a.x > 0 ? 1 : -1;
      const spd = MOVE_SPEED * this.stats.speed;
      this.x += a.x * spd * dt;
      this.y += a.y * spd * dt;
      this.anim += dt * 9;
    } else {
      this.anim = 0;
    }
    if (this.invuln > 0) this.invuln -= dt;
    if (this.stats.regen > 0 && this.hp < this.stats.maxHp) {
      this.hp = Math.min(this.stats.maxHp, this.hp + this.stats.regen * dt);
    }
  }

  hurt(amount) {
    if (this.invuln > 0 || this.hp <= 0) return;
    const dmg = Math.max(1, Math.round(amount - this.stats.armor));
    this.hp -= dmg;
    this.invuln = 0.45;
    const G = this.G;
    G.fx.text(this.x + rand(-6, 6), this.y - 26, dmg, false, '#f87171');
    G.fx.burst(this.x, this.y, '#dc2626', 8, 120, 0.4, 3);
    G.run.hurtFlash = 1;
    G.shakeScreen(5);
    G.sound.play('hurt');
    if (this.hp <= 0) {
      this.hp = 0;
      G.onPlayerDeath();
    }
  }

  heal(v) {
    const before = this.hp;
    this.hp = Math.min(this.stats.maxHp, this.hp + v);
    const healed = Math.round(this.hp - before);
    if (healed > 0) this.G.fx.text(this.x, this.y - 30, `+${healed}`, false, '#4ade80');
  }

  addXp(v) {
    this.xp += v * this.stats.growth;
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level++;
      this.xpNext = xpForLevel(this.level);
      this.G.run.pendingLevels++;
    }
  }
}
