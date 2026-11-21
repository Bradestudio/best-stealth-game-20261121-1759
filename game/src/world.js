// BAYANG SENJA — world.js: bangun level, tabrakan, dan garis pandang.
// File ini tahu bentuk ruangan; ia tidak tahu cara guard berpikir.
import { LEVELS } from './config.js';

export function buildLevel(index) {
  const def = LEVELS[index];
  return {
    index,
    def,
    walls: def.walls.map((r) => ({ ...r })),
    covers: def.covers.map((r) => ({ ...r })),
    darks: def.darks.map((r) => ({ ...r })),
    doors: (def.doors || []).map((r) => ({ ...r, open: false })),
    artifacts: def.artifacts.map((a) => ({ ...a, taken: false })),
    relicTaken: false,
    keyTaken: false,
    relic: { ...def.relic },
    exit: { ...def.exit },
    key: def.key ? { ...def.key } : null,
    playerStart: { ...def.playerStart },
  };
}

// Semua penghalang padat: dinding + etalase/patung + pintu yang masih terkunci.
export function solidRects(world) {
  const out = [...world.walls, ...world.covers];
  for (const d of world.doors) if (!d.open) out.push(d);
  return out;
}

export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function circleHitsRect(cx, cy, radius, r) {
  const nx = Math.max(r.x, Math.min(cx, r.x + r.w));
  const ny = Math.max(r.y, Math.min(cy, r.y + r.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < radius * radius;
}

// Gerakkan lingkaran sejauh (dx, dy) dengan tabrakan per sumbu, supaya pemain
// bisa meluncur di sepanjang dinding alih-alih tersangkut di sudut.
export function moveCircle(world, pos, radius, dx, dy) {
  const solids = solidRects(world);
  let nx = pos.x + dx;
  for (const r of solids) {
    if (circleHitsRect(nx, pos.y, radius, r)) { nx = pos.x; break; }
  }
  let ny = pos.y + dy;
  for (const r of solids) {
    if (circleHitsRect(nx, ny, radius, r)) { ny = pos.y; break; }
  }
  pos.x = nx;
  pos.y = ny;
}

export function inDarkZone(world, x, y) {
  return world.darks.some((d) => pointInRect(x, y, d));
}

// Garis pandang: sampel titik-titik di sepanjang ruas; terhalang bila ada titik
// yang jatuh di dalam penghalang padat.
export function lineOfSight(world, x0, y0, x1, y1) {
  const solids = solidRects(world);
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.ceil(dist / 7));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    for (const r of solids) if (pointInRect(x, y, r)) return false;
  }
  return true;
}

export function distTo(x0, y0, x1, y1) {
  return Math.hypot(x1 - x0, y1 - y0);
}
