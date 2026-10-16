// Teclado, mouse e toque (joystick virtual). Estado por frame.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set();
    this.mouse = { x: -1, y: -1, down: false, clicked: false, moved: false };
    this.stick = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0, moved: false };
    this.touchMode = false;
    this.onGesture = null;

    const gesture = () => this.onGesture && this.onGesture();
    const blocked = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'];

    window.addEventListener('keydown', (e) => {
      if (blocked.includes(e.code)) e.preventDefault();
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
      this.touchMode = false;
      gesture();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());

    canvas.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.moved = true;
    });
    canvas.addEventListener('mousedown', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.down = true;
      this.mouse.moved = true;
      this.touchMode = false;
      gesture();
    });
    window.addEventListener('mouseup', () => {
      if (this.mouse.down) this.mouse.clicked = true;
      this.mouse.down = false;
    });

    canvas.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        this.touchMode = true;
        gesture();
        for (const t of e.changedTouches) {
          if (!this.stick.active) {
            Object.assign(this.stick, {
              active: true, id: t.identifier, ox: t.clientX, oy: t.clientY, x: t.clientX, y: t.clientY, moved: false,
            });
          }
        }
      },
      { passive: false },
    );
    canvas.addEventListener(
      'touchmove',
      (e) => {
        e.preventDefault();
        for (const t of e.changedTouches) {
          if (t.identifier !== this.stick.id) continue;
          this.stick.x = t.clientX;
          this.stick.y = t.clientY;
          if (Math.hypot(t.clientX - this.stick.ox, t.clientY - this.stick.oy) > 12) this.stick.moved = true;
        }
      },
      { passive: false },
    );
    const end = (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier !== this.stick.id) continue;
        // toque curto sem arrastar vira um clique
        if (!this.stick.moved) {
          this.mouse.x = t.clientX;
          this.mouse.y = t.clientY;
          this.mouse.clicked = true;
          this.mouse.moved = true;
        }
        this.stick.active = false;
        this.stick.id = null;
      }
    };
    canvas.addEventListener('touchend', end, { passive: false });
    canvas.addEventListener('touchcancel', end, { passive: false });
  }

  isDown(code) {
    return this.keys.has(code);
  }

  wasPressed(code) {
    return this.pressed.has(code);
  }

  anyPressed(...codes) {
    return codes.some((c) => this.pressed.has(c));
  }

  // Direção de movimento: teclado tem prioridade, depois joystick de toque.
  axis() {
    let x = 0;
    let y = 0;
    if (this.isDown('KeyA') || this.isDown('ArrowLeft')) x -= 1;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) x += 1;
    if (this.isDown('KeyW') || this.isDown('ArrowUp')) y -= 1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown')) y += 1;
    if (x || y) {
      const l = Math.hypot(x, y);
      return { x: x / l, y: y / l };
    }
    if (this.stick.active) {
      const dx = this.stick.x - this.stick.ox;
      const dy = this.stick.y - this.stick.oy;
      const l = Math.hypot(dx, dy);
      if (l > 6) {
        const m = Math.min(1, l / 45);
        return { x: (dx / l) * m, y: (dy / l) * m };
      }
    }
    return { x: 0, y: 0 };
  }

  endFrame() {
    this.pressed.clear();
    this.mouse.clicked = false;
    this.mouse.moved = false;
  }
}
