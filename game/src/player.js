// BAYANG SENJA — player.js: gerak Kala si pencuri bayangan.
// Tiga gaya jalan: mengendap (Shift, pelan + senyap), jalan biasa, lari
// (cepat tapi berisik — jejak suara menarik guard).
import { SPEEDS, NOISE_RUN_RADIUS } from './config.js';
import { moveCircle, pointInRect } from './world.js';

export function createPlayer(world) {
  return {
    x: world.playerStart.x,
    y: world.playerStart.y,
    radius: 14,
    angle: -Math.PI / 2,
    sneaking: false,
    running: false,
    moving: false,
    noiseRadius: 0,
    stepTimer: 0,
    hasRelic: false,
    hasKey: false,
  };
}

export function updatePlayer(world, player, input, dt) {
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  player.moving = mx !== 0 || my !== 0;
  player.sneaking = !!input.sneak && player.moving;
  player.running = !!input.run && player.moving && !player.sneaking;
  const speed = player.sneaking ? SPEEDS.sneak : player.running ? SPEEDS.run : SPEEDS.walk;
  if (player.moving) {
    const len = Math.hypot(mx, my);
    const dx = (mx / len) * speed * dt;
    const dy = (my / len) * speed * dt;
    player.angle = Math.atan2(dy, dx);
    moveCircle(world, player, player.radius, dx, dy);
  }
  player.noiseRadius = player.running ? NOISE_RUN_RADIUS : 0;
  // Langkah kaki: interval lebih rapat saat lari — dipakai audio.js.
  if (player.moving) {
    player.stepTimer -= dt;
    if (player.stepTimer <= 0) {
      player.stepTimer = player.running ? 0.26 : player.sneaking ? 0.55 : 0.38;
      player.stepped = true;
    } else {
      player.stepped = false;
    }
  } else {
    player.stepped = false;
  }
}

// Ambil artefak / relik / kunci yang disentuh. Mengembalikan daftar kejadian.
export function collectPickups(world, player, state) {
  const events = [];
  for (const a of world.artifacts) {
    if (!a.taken && Math.hypot(a.x - player.x, a.y - player.y) < 30) {
      a.taken = true;
      state.artifacts += 1;
      state.score += 150;
      events.push('artifact');
    }
  }
  if (world.key && !world.keyTaken && Math.hypot(world.key.x - player.x, world.key.y - player.y) < 32) {
    world.keyTaken = true;
    player.hasKey = true;
    state.score += 100;
    for (const d of world.doors) d.open = true;
    events.push('key');
  }
  if (!world.relicTaken && Math.hypot(world.relic.x - player.x, world.relic.y - player.y) < 34) {
    world.relicTaken = true;
    player.hasRelic = true;
    state.score += 500;
    events.push('relic');
  }
  return events;
}

export function atExit(world, player) {
  const e = world.exit;
  return pointInRect(player.x, player.y, { x: e.x - 6, y: e.y - 6, w: e.w + 12, h: e.h + 12 });
}
