import { ENEMIES } from '../data/enemies.js';
import { rand, TAU } from '../core/utils.js';

export class Enemy {
  constructor(G, type, x, y, o = {}) {
    const d = ENEMIES[type];
    this.id = G.nextId++;
    this.type = type;
    this.def = d;
    this.sprite = d.sprite || type;
    this.x = x;
    this.y = y;
    this.elite = !!o.elite;
    this.boss = !!d.boss;
    this.maxHp = this.hp = Math.max(1, Math.round(d.hp * (o.hpMult ?? 1)));
    this.speed = d.speed * (o.speedMult ?? 1) * (this.boss ? 1 : rand(0.9, 1.1));
    this.damage = d.damage * (o.dmgMult ?? 1);
    const sc = o.scale ?? 1;
    this.scale = (d.scale ?? 1) * sc;
    this.radius = d.radius * sc;
    this.xp = Math.max(1, Math.round(d.xp * (o.xpMult ?? 1)));
    this.ai = o.ai ?? d.ai ?? 'chase';
    this.dirx = o.dirx ?? 0;
    this.diry = o.diry ?? 0;
    this.life = o.life ?? 0;
    this.alive = true;
    this.flash = 0;
    this.kbx = 0;
    this.kby = 0;
    this.slow = 0;
    this.slowAmt = 0;
    this.anim = rand(0, 10);
    this.t = 0;
    this.phase = rand(0, TAU);
    this.face = 1;
    this.state = {};
    this.cd = d.shoot ? rand(1, d.shoot.cd) : 0;
    this.dirSign = Math.random() < 0.5 ? 1 : -1;
    this.spawnT = 0.25;
  }
}
