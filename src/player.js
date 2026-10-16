export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 14;
    this.speed = 180;
    this.maxHp = 100;
    this.hp = this.maxHp;
    this.level = 1;
    this.xp = 0;
    this.xpToNext = 10;
    this.invulnTimer = 0;
  }

  update(dt, input) {
    const dir = input.axis();
    this.x += dir.x * this.speed * dt;
    this.y += dir.y * this.speed * dt;
    this.invulnTimer = Math.max(0, this.invulnTimer - dt);
  }

  takeDamage(amount) {
    if (this.invulnTimer > 0) return;
    this.hp -= amount;
  }

  gainXp(amount) {
    this.xp += amount;
    if (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = Math.floor(this.xpToNext * 1.4);
      return true; // sinaliza level up
    }
    return false;
  }

  render(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#7ee787';
    ctx.fill();
  }
}
