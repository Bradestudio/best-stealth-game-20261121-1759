// BAYANG SENJA — input.js: keyboard + klik mouse, dipetakan ke koordinat logis.
export function createInput(canvas) {
  const input = {
    up: false, down: false, left: false, right: false,
    sneak: false, run: false,
    clicks: [],
  };
  const keys = {};
  function recompute() {
    input.up = keys['ArrowUp'] || keys['KeyW'] || false;
    input.down = keys['ArrowDown'] || keys['KeyS'] || false;
    input.left = keys['ArrowLeft'] || keys['KeyA'] || false;
    input.right = keys['ArrowRight'] || keys['KeyD'] || false;
    input.sneak = !!keys['ShiftLeft'] || !!keys['ShiftRight'];
    input.run = false;
  }
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    keys[e.code] = true;
    input.pressed = e.code;
    recompute();
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    recompute();
  });
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const sx = 1280 / rect.width;
    const sy = 720 / rect.height;
    input.clicks.push({ x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy });
  });
  return input;
}

export function takeClicks(input) {
  const out = input.clicks.splice(0, input.clicks.length);
  return out;
}

export function takePressed(input) {
  const p = input.pressed || null;
  input.pressed = null;
  return p;
}

export function hitButton(click, btn) {
  return click.x >= btn.x && click.x <= btn.x + btn.w && click.y >= btn.y && click.y <= btn.y + btn.h;
}
