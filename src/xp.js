// Gemas de experiência deixadas pelos inimigos. Vão até o jogador quando estão perto.
export class Gems {
  constructor() {
    this.items = [];
    this.magnetRange = 60;
    this.pickupRange = 14;
  }

  spawn(x, y, value) {
    this.items.push({ x, y, value, alive: true });
  }

  update(dt, player, game) {
    for (const gem of this.items) {
      const dx = player.x - gem.x;
      const dy = player.y - gem.y;
      const dist = Math.hypot(dx, dy);
      if (dist < this.magnetRange) {
        gem.x += (dx / dist) * 300 * dt;
        gem.y += (dy / dist) * 300 * dt;
      }
      if (dist < this.pickupRange) {
        gem.alive = false;
        if (player.gainXp(gem.value)) game.pendingLevelUps++;
      }
    }
    this.items = this.items.filter((g) => g.alive);
  }

  render(ctx) {
    ctx.fillStyle = '#60a5fa';
    for (const gem of this.items) {
      ctx.beginPath();
      ctx.arc(gem.x, gem.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
