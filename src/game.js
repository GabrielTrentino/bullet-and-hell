import { Input } from './input.js';
import { Player } from './player.js';
import { Enemy, spawnEnemy } from './enemies.js';
import { WeaponSystem } from './weapons.js';
import { Gems } from './xp.js';
import { Hud } from './hud.js';
import { clamp } from './utils.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.input = new Input();
    this.time = 0;
    this.kills = 0;
    this.state = 'playing'; // 'playing' | 'gameover'
    this.pendingLevelUps = 0; // escolhas de melhoria ainda não feitas
    this.lastDt = 0;

    this.player = new Player(0, 0);
    this.enemies = [];
    this.weapons = new WeaponSystem(this);
    this.gems = new Gems();
    this.hud = new Hud(this);

    this.spawnTimer = 0;
    this.camera = { x: 0, y: 0 };
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  update(dt) {
    if (this.state !== 'playing') {
      if (this.input.wasPressed('Enter') && this.state === 'gameover') this.restart();
      return;
    }

    this.time += dt;
    this.lastDt = dt;
    this.player.update(dt, this.input);
    this.weapons.update(dt);
    this.gems.update(dt, this.player, this);

    this.updateSpawns(dt);
    for (const enemy of this.enemies) enemy.update(dt, this.player);
    this.resolveCollisions();

    this.enemies = this.enemies.filter((e) => e.alive);

    this.camera.x = this.player.x;
    this.camera.y = this.player.y;
    this.input.endFrame();
  }

  updateSpawns(dt) {
    // dificuldade cresce com o tempo: intervalo menor e mais inimigos por onda
    const interval = clamp(1.2 - this.time * 0.01, 0.2, 1.2);
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = interval;
      const count = 1 + Math.floor(this.time / 30);
      for (let i = 0; i < count; i++) this.enemies.push(spawnEnemy(this));
    }
  }

  resolveCollisions() {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      if (enemy.overlaps(this.player)) {
        this.player.takeDamage(enemy.damage * this.lastDt);
        if (this.player.hp <= 0) {
          this.state = 'gameover';
          return;
        }
      }
    }
  }

  onEnemyKilled(enemy) {
    this.kills++;
    this.gems.spawn(enemy.x, enemy.y, enemy.xpValue);
  }

  restart() {
    this.time = 0;
    this.kills = 0;
    this.enemies = [];
    this.gems.items = [];
    this.pendingLevelUps = 0;
    this.weapons = new WeaponSystem(this);
    this.player = new Player(0, 0);
    this.state = 'playing';
  }

  render() {
    const { ctx } = this;
    ctx.fillStyle = '#0b0b12';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.translate(this.width / 2 - this.camera.x, this.height / 2 - this.camera.y);
    this.gems.render(ctx);
    for (const enemy of this.enemies) enemy.render(ctx);
    this.weapons.render(ctx);
    this.player.render(ctx);
    ctx.restore();

    this.hud.render(ctx);
  }
}
