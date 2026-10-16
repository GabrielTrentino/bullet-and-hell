// Interface: barra de vida, XP, tempo e contagem de abates.
export class Hud {
  constructor(game) {
    this.game = game;
  }

  render(ctx) {
    const { game } = this;
    const { player } = game;

    // barra de vida
    ctx.fillStyle = '#374151';
    ctx.fillRect(20, 20, 200, 12);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(20, 20, 200 * Math.max(0, player.hp / player.maxHp), 12);

    // barra de XP
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, game.height - 10, game.width, 10);
    ctx.fillStyle = '#60a5fa';
    ctx.fillRect(0, game.height - 10, game.width * (player.xp / player.xpToNext), 10);

    ctx.fillStyle = '#e5e7eb';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Nível ${player.level}`, 20, 52);
    ctx.fillText(`Tempo ${Math.floor(game.time)}s`, 20, 72);
    ctx.fillText(`Abates ${game.kills}`, 20, 92);

    if (game.state === 'gameover') this.centerText(ctx, 'Fim de jogo. Pressione Enter para reiniciar');
    if (game.pendingLevelUps > 0) {
      this.centerText(ctx, 'Subiu de nível! (escolha de melhoria em breve)');
    }
  }

  centerText(ctx, text) {
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, this.game.width / 2, this.game.height / 2);
    ctx.textAlign = 'left';
  }
}
