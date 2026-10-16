import { Game } from './game.js';

async function waitFonts() {
  if (!document.fonts) return;
  const loads = ['700 20px Cinzel', '500 16px Rubik', '700 16px Rubik'].map((f) => document.fonts.load(f));
  await Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 1500))]).catch(() => {});
}

async function boot() {
  await waitFonts();
  const canvas = document.getElementById('game');
  const game = new Game(canvas);
  window.__game = game;
  let last = performance.now();
  const frame = (now) => {
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    game.frame(dt);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

boot();
