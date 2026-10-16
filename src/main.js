import { Game } from './game.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);

let last = performance.now();

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05); // limita o passo para evitar saltos
  last = now;
  game.update(dt);
  game.render();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
