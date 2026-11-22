// BAYANG SENJA — guards.js: patroli, vision cone, dan AI deteksi bertahap.
// Guard punya 4 keadaan: patrol -> suspicious (mendekat memeriksa) ->
// alert (mengejar) -> return (kembali ke rute). Kamera adalah guard diam
// yang menyapu cone-nya bolak-balik.
import { DETECT } from './config.js';
import { inDarkZone, lineOfSight } from './world.js';

export function createGuards(levelDef) {
  const guards = levelDef.guards.map((g, i) => ({
    id: i,
    kind: 'guard',
    waypoints: g.waypoints.map((w) => ({ x: w[0], y: w[1] })),
    wpIndex: 0,
    x: g.waypoints[0][0],
    y: g.waypoints[0][1],
    angle: 0,
    speed: g.speed,
    pauseTime: g.pause,
    wait: 0,
    state: 'patrol',
    suspicion: 0,
    lastSeen: null,
    lostTimer: 0,
    investigate: null,
    hearing: null,
  }));
  for (const c of levelDef.cameras || []) {
    guards.push({
      id: guards.length,
      kind: 'camera',
      x: c.x,
      y: c.y,
      angle: c.baseAngle,
      baseAngle: c.baseAngle,
      sweep: c.sweep,
      sweepSpeed: c.speed,
      sweepPhase: 0,
      range: c.range,
      speed: 0,
      state: 'patrol',
      suspicion: 0,
      lastSeen: null,
      lostTimer: 0,
      investigate: null,
      hearing: null,
      dispatched: false,
    });
  }
  return guards;
}

function angleTo(x0, y0, x1, y1) {
  return Math.atan2(y1 - y0, x1 - x0);
}

function turnToward(current, target, maxStep) {
  let d = target - current;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  if (Math.abs(d) <= maxStep) return target;
  return current + Math.sign(d) * maxStep;
}

// Bisakah pengamat ini melihat pemain sekarang? Cone + jarak + garis pandang.
// Zona gelap memperpendek jarak lihat; mengendap juga memperpendeknya.
export function canSee(world, watcher, player, rangeOverride) {
  const dx = player.x - watcher.x;
  const dy = player.y - watcher.y;
  const dist = Math.hypot(dx, dy);
  let range = rangeOverride ?? DETECT.coneRange;
  if (inDarkZone(world, player.x, player.y)) range = Math.min(range, DETECT.darkRange);
  else if (player.sneaking) range = Math.min(range, DETECT.sneakRange);
  if (dist > range) return false;
  if (dist < 26) return lineOfSight(world, watcher.x, watcher.y, player.x, player.y);
  let diff = Math.abs(angleTo(watcher.x, watcher.y, player.x, player.y) - watcher.angle);
  while (diff > Math.PI) diff -= Math.PI * 2;
  if (Math.abs(diff) > DETECT.coneHalfAngle) return false;
  return lineOfSight(world, watcher.x, watcher.y, player.x, player.y);
}

export function updateGuard(world, g, player, dt, events) {
  if (g.kind === 'camera') {
    g.sweepPhase += g.sweepSpeed * dt;
    g.angle = g.baseAngle + Math.sin(g.sweepPhase) * g.sweep;
    const seen = canSee(world, g, player, g.range);
    if (seen) {
      const was = g.suspicion;
      g.suspicion = Math.min(100, g.suspicion + DETECT.riseWalk * dt);
      g.lastSeen = { x: player.x, y: player.y };
      if (was < DETECT.suspiciousAt && g.suspicion >= DETECT.suspiciousAt) events.push('spotted');
      if (was < DETECT.alertAt && g.suspicion >= DETECT.alertAt) events.push('alarm');
    } else {
      g.suspicion = Math.max(0, g.suspicion - DETECT.decay * dt);
    }
    return;
  }

  const seen = canSee(world, g, player);
  if (seen) {
    const rate = player.running ? DETECT.riseRun : player.sneaking ? DETECT.riseSneak : DETECT.riseWalk;
    const was = g.suspicion;
    g.suspicion = Math.min(100, g.suspicion + rate * dt);
    g.lastSeen = { x: player.x, y: player.y };
    g.lostTimer = 0;
    if (was < DETECT.suspiciousAt && g.suspicion >= DETECT.suspiciousAt) events.push('spotted');
    if (was < DETECT.alertAt && g.suspicion >= DETECT.alertAt) events.push('alarm');
  } else {
    g.suspicion = Math.max(0, g.suspicion - DETECT.decay * dt);
    if (g.state === 'alert') {
      g.lostTimer += dt;
      if (g.lostTimer > DETECT.loseSightSeconds) {
        g.state = 'investigate';
        g.investigate = g.lastSeen ? { ...g.lastSeen } : { x: g.x, y: g.y };
      }
    }
  }

  // Suara lari: guard yang mendengar langsung memeriksa sumber suara.
  if (player.noiseRadius > 0 && g.state !== 'alert') {
    const d = Math.hypot(player.x - g.x, player.y - g.y);
    if (d < player.noiseRadius) {
      g.hearing = { x: player.x, y: player.y };
      if (g.state === 'patrol') {
        g.state = 'investigate';
        g.investigate = { ...g.hearing };
        g.suspicion = Math.max(g.suspicion, 45);
      }
    }
  }

  if (g.suspicion >= DETECT.alertAt) g.state = 'alert';
  else if (g.suspicion >= DETECT.suspiciousAt && g.state === 'patrol') {
    g.state = 'investigate';
    g.investigate = g.lastSeen ? { ...g.lastSeen } : null;
  }

  if (g.state === 'alert') {
    if (g.lastSeen) {
      const a = angleTo(g.x, g.y, g.lastSeen.x, g.lastSeen.y);
      g.angle = turnToward(g.angle, a, 6 * dt);
      stepToward(world, g, g.lastSeen.x, g.lastSeen.y, g.speed * DETECT.chaseSpeed * dt);
    }
    return;
  }
  if (g.state === 'investigate' && g.investigate) {
    const target = g.investigate;
    const d = Math.hypot(target.x - g.x, target.y - g.y);
    if (d < 14) {
      g.wait += dt;
      g.angle = turnToward(g.angle, g.angle + 1.6 * dt, 2 * dt);
      if (g.wait > 1.6) {
        g.state = 'return';
        g.investigate = null;
        g.wait = 0;
      }
    } else {
      const a = angleTo(g.x, g.y, target.x, target.y);
      g.angle = turnToward(g.angle, a, 5 * dt);
      stepToward(world, g, target.x, target.y, g.speed * 1.15 * dt);
    }
    return;
  }
  if (g.state === 'return') {
    const wp = g.waypoints[g.wpIndex];
    const d = Math.hypot(wp.x - g.x, wp.y - g.y);
    if (d < 12) { g.state = 'patrol'; return; }
    const a = angleTo(g.x, g.y, wp.x, wp.y);
    g.angle = turnToward(g.angle, a, 5 * dt);
    stepToward(world, g, wp.x, wp.y, g.speed * dt);
    return;
  }
  // patrol: jalan ke waypoint berikut, berhenti sebentar di tiap ujung rute.
  if (g.wait > 0) {
    g.wait -= dt;
    if (g.wait <= 0) {
      g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
    }
    return;
  }
  const wp = g.waypoints[g.wpIndex];
  const d = Math.hypot(wp.x - g.x, wp.y - g.y);
  if (d < 10) {
    g.wait = g.pauseTime;
    return;
  }
  const a = angleTo(g.x, g.y, wp.x, wp.y);
  g.angle = turnToward(g.angle, a, 5 * dt);
  stepToward(world, g, wp.x, wp.y, g.speed * dt);
}

function stepToward(world, g, tx, ty, step) {
  const dx = tx - g.x;
  const dy = ty - g.y;
  const d = Math.hypot(dx, dy);
  if (d === 0) return;
  const nx = g.x + (dx / d) * Math.min(step, d);
  const ny = g.y + (dy / d) * Math.min(step, d);
  // Guard tidak menembus dinding: coba sumbu x lalu y.
  const solids = [...world.walls, ...world.covers, ...world.doors.filter((r) => !r.open)];
  const blocked = (x, y) => solids.some((r) => x > r.x - 10 && x < r.x + r.w + 10 && y > r.y - 10 && y < r.y + r.h + 10);
  if (!blocked(nx, g.y)) g.x = nx;
  if (!blocked(g.x, ny)) g.y = ny;
}

// Grade stealth satu level, dari curiga tertinggi dan apakah alarm pernah bunyi:
// HANTU = tak pernah terlihat sama sekali (curiga puncak di bawah ambang curiga),
// BAYANGAN = pernah dicurigai tapi alarm tak pernah bunyi,
// TERLIHAT = alarm pernah bunyi.
export function stealthGrade(maxSuspicion, alarmed) {
  if (alarmed) return 'TERLIHAT';
  if (maxSuspicion >= DETECT.suspiciousAt) return 'BAYANGAN';
  return 'HANTU';
}

// Dispatch kamera: saat kamera mencapai alarm, guard berjalan terdekat yang belum
// alert dikirim menginvestigasi titik terakhir yang kamera lihat. Kamera sendiri
// tetap diam di tempatnya — ia memanggil, bukan mengejar. Sekali per alarm:
// flag dispatched direset begitu suspicion kamera turun di bawah ambang alarm,
// supaya alarm berikutnya bisa memanggil lagi.
export function dispatchCameraAlerts(guards, events) {
  for (const cam of guards) {
    if (cam.kind !== 'camera') continue;
    if (cam.suspicion < DETECT.alertAt) {
      cam.dispatched = false;
      continue;
    }
    if (cam.dispatched || !cam.lastSeen) continue;
    let best = null;
    let bestDist = Infinity;
    for (const g of guards) {
      if (g.kind !== 'guard' || g.state === 'alert') continue;
      const d = Math.hypot(g.x - cam.lastSeen.x, g.y - cam.lastSeen.y);
      if (d < bestDist) {
        bestDist = d;
        best = g;
      }
    }
    if (!best) continue;
    best.state = 'investigate';
    best.investigate = { ...cam.lastSeen };
    best.suspicion = Math.max(best.suspicion, 45);
    best.wait = 0;
    cam.dispatched = true;
    events.push('dispatch');
  }
}

// Warna cone mengikuti keadaan guard yang paling curiga.
export function guardConeColor(g) {
  if (g.suspicion >= DETECT.alertAt) return 'alert';
  if (g.suspicion >= DETECT.suspiciousAt) return 'suspicious';
  return 'calm';
}
