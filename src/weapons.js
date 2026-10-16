// Armas são definidas como dados. Cada uma tem um comportamento de disparo.
export const WEAPON_DEFS = {
  whip: {
    name: 'Chicote',
    cooldown: 1.2,
    damage: 15,
    range: 90,
    behavior: 'melee', // ataque em área ao redor do jogador
  },
  magicWand: {
    name: 'Varinha mágica',
    cooldown: 0.8,
    damage: 12,
    speed: 320,
    behavior: 'projectile', // projétil que vai ao inimigo mais próximo
  },
};

class Weapon {
  constructor(id) {
    Object.assign(this, WEAPON_DEFS[id], { id, timer: 0, level: 1 });
  }
}

export class WeaponSystem {
  constructor(game) {
    this.game = game;
    this.weapons = [new Weapon('magicWand')];
    this.projectiles = [];
  }

  update(dt) {
    const { game } = this;
    for (const w of this.weapons) {
      w.timer -= dt;
      if (w.timer > 0) continue;
      w.timer = w.cooldown;

      if (w.behavior === 'melee') {
        this.meleeAttack(w, game);
      } else if (w.behavior === 'projectile') {
        this.fireAtNearest(w, game);
      }
    }

    for (const p of this.projectiles) p.update(dt, game);
    this.projectiles = this.projectiles.filter((p) => p.alive);
  }

  meleeAttack(w, game) {
    for (const enemy of game.enemies) {
      const d = Math.hypot(enemy.x - game.player.x, enemy.y - game.player.y);
      if (d < w.range + enemy.radius) this.damageEnemy(enemy, w.damage, game);
    }
  }

  fireAtNearest(w, game) {
    let target = null;
    let best = Infinity;
    for (const enemy of game.enemies) {
      const d = Math.hypot(enemy.x - game.player.x, enemy.y - game.player.y);
      if (d < best) {
        best = d;
        target = enemy;
      }
    }
    if (target) this.projectiles.push(new Projectile(game.player.x, game.player.y, target, w));
  }

  damageEnemy(enemy, damage, game) {
    if (enemy.takeHit(damage)) game.onEnemyKilled(enemy);
  }

  render(ctx) {
    for (const p of this.projectiles) p.render(ctx);
  }
}

class Projectile {
  constructor(x, y, target, weapon) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.speed = weapon.speed;
    this.damage = weapon.damage;
    this.alive = true;
    this.radius = 5;
  }

  update(dt, game) {
    if (!this.target.alive) {
      this.alive = false;
      return;
    }
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speed * dt;
    if (dist <= step + this.target.radius) {
      if (this.target.takeHit(this.damage)) game.onEnemyKilled(this.target);
      this.alive = false;
      return;
    }
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
  }

  render(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#fde68a';
    ctx.fill();
  }
}
