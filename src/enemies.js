import { randomInRing } from './utils.js';

// Tipos de inimigo: adicione novos aqui sem mexer na lógica de spawn.
export const ENEMY_TYPES = {
  bat: { radius: 8, speed: 70, hp: 10, damage: 8, xp: 1, color: '#c084fc' },
  skeleton: { radius: 12, speed: 45, hp: 30, damage: 12, xp: 3, color: '#e5e7eb' },
  ogre: { radius: 20, speed: 25, hp: 120, damage: 25, xp: 10, color: '#f87171' },
};

export class Enemy {
  constructor(x, y, type) {
    Object.assign(this, ENEMY_TYPES[type], { type, x, y, alive: true });
    this.maxHp = this.hp;
    this.xpValue = this.xp;
  }

  update(dt, player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    this.x += (dx / dist) * this.speed * dt;
    this.y += (dy / dist) * this.speed * dt;
  }

  overlaps(player) {
    return Math.hypot(player.x - this.x, player.y - this.y) < this.radius + player.radius;
  }

  takeHit(damage) {
    this.hp -= damage;
    if (this.hp <= 0) this.alive = false;
    return !this.alive; // true se morreu
  }

  render(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

// Escolhe o tipo de inimigo de acordo com o tempo de jogo.
function pickType(time) {
  const roll = Math.random();
  if (time > 60 && roll < 0.1) return 'ogre';
  if (time > 20 && roll < 0.35) return 'skeleton';
  return 'bat';
}

export function spawnEnemy(game) {
  const [x, y] = randomInRing(game.player.x, game.player.y, 350, 500);
  return new Enemy(x, y, pickType(game.time));
}
