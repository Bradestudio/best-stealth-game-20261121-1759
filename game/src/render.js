// BAYANG SENJA — render.js: semua gambar prosedural di canvas.
// Lantai museum malam, kolam cahaya, vision cone transparan, HUD besar yang
// terbaca saat diperkecil, dan layar title / menang / tertangkap.
import { VIEW_W, VIEW_H, HUD_H, COLORS, DETECT, LEVELS } from './config.js';
import { guardConeColor, stealthGrade } from './guards.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_LEVEL_DONE = 'levelDone';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_WIN = 'win';

function coneColor(kind) {
  if (kind === 'alert') return COLORS.coneAlert;
  if (kind === 'suspicious') return COLORS.coneSuspicious;
  return COLORS.coneCalm;
}
function coneStroke(kind) {
  if (kind === 'alert') return '#ff5a4d';
  if (kind === 'suspicious') return '#f07828';
  return '#e8b23a';
}

export function drawWorld(ctx, game, time) {
  const { world, guards, player, state } = game;
  drawFloor(ctx, time);
  drawDarkZones(ctx, world);
  drawExit(ctx, world, time);
  drawRelic(ctx, world, time);
  drawKey(ctx, world, time);
  drawArtifacts(ctx, world, time);
  drawCovers(ctx, world);
  drawWalls(ctx, world);
  drawDoors(ctx, world);
  drawNightLight(ctx, game);
  drawCones(ctx, guards);
  drawGuards(ctx, guards, time);
  drawPlayer(ctx, player, time);
  drawNoiseRing(ctx, player);
  drawHud(ctx, game);
  drawHints(ctx, game);
}

// Pencahayaan malam sinematik: satu mask offscreen digelapkan, lalu dilubangi
// cahaya radial di sekitar pemain, di ujung cone tiap guard, di relik, dan di
// pintu keluar — plus vignette di tepinya. Mask digambar sebelum cone/guard/
// pemain supaya mereka tetap terang dan terbaca, sementara lantainya tenggelam
// dalam gelap. Murah: satu canvas 1280x720 yang dipakai ulang tiap frame.
let lightMask = null;
let lightMaskCtx = null;

function lightHole(mctx, x, y, radius, strength) {
  const g = mctx.createRadialGradient(x, y, 4, x, y, radius);
  g.addColorStop(0, `rgba(0,0,0,${strength})`);
  g.addColorStop(0.55, `rgba(0,0,0,${strength * 0.6})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  mctx.fillStyle = g;
  mctx.beginPath();
  mctx.arc(x, y, radius, 0, Math.PI * 2);
  mctx.fill();
}

function drawNightLight(ctx, game) {
  if (!lightMask) {
    lightMask = document.createElement('canvas');
    lightMask.width = VIEW_W;
    lightMask.height = VIEW_H;
    lightMaskCtx = lightMask.getContext('2d');
  }
  const m = lightMaskCtx;
  m.setTransform(1, 0, 0, 1, 0, 0);
  m.globalCompositeOperation = 'source-over';
  m.clearRect(0, 0, VIEW_W, VIEW_H);
  m.fillStyle = 'rgba(5, 7, 18, 0.58)';
  m.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
  // Lubangi kegelapan dengan cahaya.
  m.globalCompositeOperation = 'destination-out';
  const { player, guards, world } = game;
  lightHole(m, player.x, player.y, 200, 0.95);
  for (const g of guards) {
    const range = g.kind === 'camera' ? g.range : 245;
    lightHole(m, g.x + Math.cos(g.angle) * range * 0.72, g.y + Math.sin(g.angle) * range * 0.72, 110, 0.8);
  }
  if (!world.relicTaken) lightHole(m, world.relic.x, world.relic.y, 110, 0.85);
  lightHole(m, world.exit.x + world.exit.w / 2, world.exit.y + world.exit.h / 2, 100, 0.7);
  ctx.drawImage(lightMask, 0, 0);
  // Vignette: tepi layar makin gelap, mata tertuju ke tengah.
  const v = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.42, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.95);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = v;
  ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
}

function drawFloor(ctx, time) {
  ctx.fillStyle = COLORS.floorA;
  ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
  for (let y = HUD_H; y < VIEW_H; y += 80) {
    for (let x = 0; x < VIEW_W; x += 80) {
      if (((x / 80) + (y / 80)) % 2 === 0) {
        ctx.fillStyle = COLORS.floorB;
        ctx.fillRect(x, y, 80, 80);
      }
    }
  }
  // Karpet merah tengah yang menuntun mata ke relik.
  ctx.fillStyle = COLORS.carpet;
  ctx.fillRect(560, HUD_H, 160, VIEW_H - HUD_H);
  ctx.strokeStyle = '#6b3a44';
  ctx.lineWidth = 3;
  ctx.strokeRect(566, HUD_H + 6, 148, VIEW_H - HUD_H - 12);
  // Kolam cahaya lampu: lingkaran hangat statis.
  const pools = [[320, 200], [960, 200], [320, 560], [960, 560], [640, 420]];
  for (const [x, y] of pools) {
    const g = ctx.createRadialGradient(x, y, 10, x, y, 150);
    g.addColorStop(0, 'rgba(255, 214, 130, 0.14)');
    g.addColorStop(1, 'rgba(255, 214, 130, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 150, 0, Math.PI * 2);
    ctx.fill();
  }
  void time;
}

function drawDarkZones(ctx, world) {
  for (const d of world.darks) {
    ctx.fillStyle = COLORS.darkZone;
    ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.strokeStyle = COLORS.darkEdge;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(d.x, d.y, d.w, d.h);
    ctx.setLineDash([]);
    ctx.fillStyle = '#8fa3e8';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BAYANGAN — AMAN', d.x + d.w / 2, d.y + d.h / 2);
  }
}

function drawWalls(ctx, world) {
  for (const w of world.walls) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(w.x, w.y, w.w, 4);
  }
}

function drawCovers(ctx, world) {
  for (const c of world.covers) {
    if (c.kind === 'case') {
      ctx.fillStyle = '#1d2f42';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = COLORS.coverGlass;
      ctx.lineWidth = 4;
      ctx.strokeRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
      ctx.fillStyle = COLORS.coverGold;
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2a1c08';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ETALASE', c.x + c.w / 2, c.y + c.h - 8);
    } else if (c.kind === 'statue') {
      ctx.fillStyle = '#8d8578';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5d564a';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2 - 8, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2a1c08';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PATUNG', c.x + c.w / 2, c.y + c.h - 6);
    } else {
      ctx.fillStyle = '#6d5a3d';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = '#8d744e';
      ctx.fillRect(c.x, c.y, c.w, 8);
      ctx.fillStyle = '#2a1c08';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PILAR', c.x + c.w / 2, c.y + c.h - 6);
    }
  }
}

function drawDoors(ctx, world) {
  for (const d of world.doors) {
    if (d.open) {
      ctx.fillStyle = '#2fd67a';
      ctx.fillRect(d.x - 4, d.y, 8, d.h);
      ctx.fillStyle = '#f5ead2';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TERBUKA', d.x + 40, d.y + d.h / 2);
      continue;
    }
    ctx.fillStyle = '#7a5a1e';
    ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath();
    ctx.arc(d.x + d.w / 2, d.y + d.h / 2, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f5ead2';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(d.x + 34, d.y + d.h / 2);
    ctx.fillText('TERKUNCI', 0, 5);
    ctx.restore();
  }
}

function drawExit(ctx, world, time) {
  const e = world.exit;
  const pulse = 0.6 + 0.4 * Math.sin(time * 3);
  ctx.fillStyle = COLORS.exitDark;
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = `rgba(47, 214, 122, ${0.55 + 0.35 * pulse})`;
  ctx.fillRect(e.x + 6, e.y + 6, e.w - 12, e.h - 12);
  ctx.strokeStyle = '#b8ffce';
  ctx.lineWidth = 3;
  ctx.strokeRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = '#062b16';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('KELUAR', e.x + e.w / 2, e.y + e.h / 2 + 7);
  // Panah hijau besar di atas pintu supaya exit terbaca dari jauh.
  ctx.fillStyle = '#2fd67a';
  const ax = e.x + e.w / 2;
  const ay = e.y - 18 - 6 * pulse;
  ctx.beginPath();
  ctx.moveTo(ax, ay - 14);
  ctx.lineTo(ax + 16, ay + 8);
  ctx.lineTo(ax + 6, ay + 8);
  ctx.lineTo(ax + 6, ay + 20);
  ctx.lineTo(ax - 6, ay + 20);
  ctx.lineTo(ax - 6, ay + 8);
  ctx.lineTo(ax - 16, ay + 8);
  ctx.closePath();
  ctx.fill();
  void time;
}

function drawRelic(ctx, world, time) {
  if (world.relicTaken) return;
  const { x, y } = world.relic;
  const pulse = 1 + 0.15 * Math.sin(time * 4);
  const g = ctx.createRadialGradient(x, y, 4, x, y, 70);
  g.addColorStop(0, 'rgba(255, 217, 77, 0.5)');
  g.addColorStop(1, 'rgba(255, 217, 77, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = COLORS.relic;
  ctx.fillRect(-14, -14, 28, 28);
  ctx.strokeStyle = '#fff3b0';
  ctx.lineWidth = 3;
  ctx.strokeRect(-14, -14, 28, 28);
  ctx.restore();
  ctx.fillStyle = '#2a1c08';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PERMATA SENJA', x, y + 48);
}

function drawKey(ctx, world, time) {
  if (!world.key || world.keyTaken) return;
  const { x, y } = world.key;
  const bob = Math.sin(time * 3) * 4;
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath();
  ctx.arc(x, y + bob, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x, y + bob - 3, 22, 6);
  ctx.fillStyle = '#2a1c08';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('KUNCI KUNINGAN', x, y + bob + 34);
}

function drawArtifacts(ctx, world, time) {
  for (const a of world.artifacts) {
    if (a.taken) continue;
    const bob = Math.sin(time * 3 + a.x) * 3;
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath();
    ctx.arc(a.x, a.y + bob, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff3b0';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#7a5a1e';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('$', a.x, a.y + bob + 4);
  }
}

function drawCones(ctx, guards) {
  for (const g of guards) {
    const kind = guardConeColor(g);
    const range = g.kind === 'camera' ? g.range : 245;
    ctx.fillStyle = coneColor(kind);
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.arc(g.x, g.y, range, g.angle - DETECT.coneHalfAngle, g.angle + DETECT.coneHalfAngle);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = coneStroke(kind);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.arc(g.x, g.y, range, g.angle - DETECT.coneHalfAngle, g.angle + DETECT.coneHalfAngle);
    ctx.closePath();
    ctx.stroke();
  }
}

function drawGuards(ctx, guards, time) {
  for (const g of guards) {
    if (g.kind === 'camera') {
      ctx.fillStyle = '#3a3f4a';
      ctx.fillRect(g.x - 14, g.y - 10, 28, 20);
      ctx.fillStyle = guardConeColor(g) === 'alert' ? '#ff5a4d' : '#e8b23a';
      ctx.beginPath();
      ctx.arc(g.x + Math.cos(g.angle) * 14, g.y + Math.sin(g.angle) * 14, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f5ead2';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('KAMERA', g.x, g.y - 18);
      continue;
    }
    // Bayangan + badan guard: merah kontras dengan lantai gelap.
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(g.x, g.y + 12, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.guard;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7d1a12';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Helm + arah hadap.
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.angle) * 8, g.y + Math.sin(g.angle) * 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c0f0f';
    ctx.beginPath();
    ctx.arc(g.x, g.y, 5, 0, Math.PI * 2);
    ctx.fill();
    // Meter curiga di atas kepala saat mulai curiga.
    if (g.suspicion > 4) {
      const w = 44;
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(g.x - w / 2, g.y - 34, w, 8);
      ctx.fillStyle = g.suspicion >= DETECT.alertAt ? '#ff5a4d' : g.suspicion >= DETECT.suspiciousAt ? '#f07828' : '#e8b23a';
      ctx.fillRect(g.x - w / 2, g.y - 34, (w * g.suspicion) / 100, 8);
    }
    ctx.fillStyle = '#f5ead2';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    const label = g.state === 'alert' ? '!' : g.state === 'investigate' ? '?' : 'GUARD';
    ctx.fillText(label, g.x, g.y - 40);
  }
  void time;
}

function drawPlayer(ctx, player, time) {
  const bob = player.moving ? Math.sin(time * 10) * 2 : 0;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 13, 15, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.playerCloak;
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.player;
  ctx.lineWidth = 3;
  ctx.stroke();
  // Kerudung + arah hadap: pemain selalu paling mudah dikenali.
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(player.x + Math.cos(player.angle) * 7, player.y + Math.sin(player.angle) * 7 + bob, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#062b26';
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob, 4, 0, Math.PI * 2);
  ctx.fill();
  if (player.hasRelic) {
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath();
    ctx.arc(player.x + 12, player.y - 12 + bob, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#f5ead2';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('KALA', player.x, player.y - 24 + bob);
}

function drawNoiseRing(ctx, player) {
  if (player.noiseRadius <= 0) return;
  ctx.strokeStyle = 'rgba(255, 90, 77, 0.7)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.noiseRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#ff8a80';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BERISIK!', player.x, player.y - 30);
}

function drawHud(ctx, game) {
  const { state, world } = game;
  ctx.fillStyle = '#14100c';
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = '#d9a441';
  ctx.fillRect(0, HUD_H - 3, VIEW_W, 3);
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('BAYANG SENJA', 18, 30);
  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(world.def.name, 18, 52);
  // Artefak + relik + skor + waktu.
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 19px sans-serif';
  const totalArt = world.artifacts.length;
  ctx.fillText(`◆ Artefak ${state.artifacts}/11`, 430, 30);
  ctx.fillText(world.relicTaken ? '◆ Permata: DIDAPAT' : '◆ Permata: BELUM', 430, 52);
  ctx.fillText(`Skor ${state.score}`, 700, 30);
  ctx.fillText(`Waktu ${formatTime(state.time)}`, 700, 52);
  // Meter deteksi global: bar besar di kanan.
  const suspicion = game.maxSuspicion;
  ctx.fillStyle = COLORS.muted;
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('DETEKSI', 930, 22);
  ctx.fillStyle = '#241c14';
  ctx.fillRect(930, 28, 220, 18);
  ctx.fillStyle = suspicion >= DETECT.alertAt ? '#ff5a4d' : suspicion >= DETECT.suspiciousAt ? '#f07828' : '#e8b23a';
  ctx.fillRect(930, 28, (220 * Math.min(100, suspicion)) / 100, 18);
  ctx.strokeStyle = '#f5ead2';
  ctx.lineWidth = 1;
  ctx.strokeRect(930, 28, 220, 18);
  ctx.fillStyle = suspicion >= DETECT.alertAt ? '#ff5a4d' : COLORS.text;
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(
    suspicion >= DETECT.alertAt ? 'KETAHUAN! SEMBUNYI!' : suspicion >= DETECT.suspiciousAt ? 'DICURIGAI!' : 'AMAN',
    930, 59,
  );
  void state;
}

function drawHints(ctx, game) {
  const { state } = game;
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(245, 234, 210, 0.85)';
  ctx.font = '15px sans-serif';
  ctx.fillText('WASD/Panah gerak · Shift mengendap · Lari berisik · R ulang · P jeda · M suara', 18, VIEW_H - 24);
  // Grade stealth berjalan: HANTU selama tak pernah terlihat, turun begitu ketahuan.
  const grade = stealthGrade(game.maxSuspicion, game.levelAlarm);
  ctx.textAlign = 'right';
  ctx.fillStyle = grade === 'HANTU' ? '#ffd94d' : grade === 'BAYANGAN' ? '#f07828' : '#ff5a4d';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`Grade: ${grade}`, VIEW_W - 18, VIEW_H - 24);
  ctx.textAlign = 'left';
  if (state.flash) {
    ctx.textAlign = 'center';
    ctx.fillStyle = state.flashColor || '#ffd94d';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(state.flash, VIEW_W / 2, 130);
  }
}

export function formatTime(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function overlay(ctx, alpha) {
  ctx.fillStyle = `rgba(10, 8, 14, ${alpha})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function bigButton(ctx, btn, label) {
  ctx.fillStyle = '#d9a441';
  ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
  ctx.strokeStyle = '#fff3b0';
  ctx.lineWidth = 3;
  ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
  ctx.fillStyle = '#241505';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 9);
}

export function drawTitle(ctx, game) {
  drawWorld(ctx, game, 0);
  overlay(ctx, 0.72);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 84px Georgia, serif';
  ctx.fillText('BAYANG SENJA', VIEW_W / 2, 190);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('Museum malam. Satu pencuri. Tiga ruang. Tanpa terlihat.', VIEW_W / 2, 240);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '20px sans-serif';
  ctx.fillText('Curi Permata Senja, lalu capai pintu KELUAR. Etalase dan bayangan melindungimu.', VIEW_W / 2, 278);
  ctx.fillText('Cone kuning = tenang · oranye = curiga · merah = ketahuan. Putus pandangan untuk pulih.', VIEW_W / 2, 308);
  const lines = [
    'WASD / Panah — bergerak      Shift — mengendap (senyap, sulit terlihat)',
    'Lari — cepat tapi berisik, guard mendengar      R — ulang level      P — jeda      M — suara',
    'Kamera yang membunyikan alarm memanggil guard terdekat · Selesai tanpa terlihat: grade HANTU +400',
  ];
  ctx.fillStyle = COLORS.text;
  ctx.font = '19px sans-serif';
  lines.forEach((l, i) => ctx.fillText(l, VIEW_W / 2, 352 + i * 28));
  if (game.best > 0) {
    ctx.fillStyle = '#ffd94d';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`Skor terbaik: ${game.best}`, VIEW_W / 2, 444);
  }
  bigButton(ctx, { x: VIEW_W / 2 - 160, y: 470, w: 320, h: 64 }, '▶  MULAI MENCURI');
  ctx.fillStyle = COLORS.muted;
  ctx.font = '16px sans-serif';
  ctx.fillText('atau tekan Enter', VIEW_W / 2, 560);
}

export function drawLevelDone(ctx, game) {
  drawWorld(ctx, game, 0);
  overlay(ctx, 0.6);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#2fd67a';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText('LEVEL SELESAI!', VIEW_W / 2, 260);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(`${game.world.def.name} — tanpa tertangkap`, VIEW_W / 2, 310);
  ctx.font = '22px sans-serif';
  ctx.fillText(`Skor: ${game.state.score}   ·   Artefak: ${game.state.artifacts}   ·   Waktu: ${formatTime(game.state.time)}`, VIEW_W / 2, 350);
  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = game.levelGrade === 'HANTU' ? '#ffd94d' : game.levelGrade === 'BAYANGAN' ? '#f07828' : '#ff5a4d';
  ctx.fillText(gradeLine(game.levelGrade), VIEW_W / 2, 384);
  bigButton(ctx, { x: VIEW_W / 2 - 160, y: 420, w: 320, h: 64 }, 'LEVEL BERIKUTNYA ▶');
  ctx.fillStyle = COLORS.muted;
  ctx.font = '16px sans-serif';
  ctx.fillText('atau tekan Enter', VIEW_W / 2, 510);
}

function gradeLine(grade) {
  if (grade === 'HANTU') return 'Grade HANTU — tak pernah terlihat! Bonus hantu +400.';
  if (grade === 'BAYANGAN') return 'Grade BAYANGAN — pernah dicurigai, tapi alarm tak bunyi.';
  if (grade === 'TERLIHAT') return 'Grade TERLIHAT — alarm sempat bunyi. Coba lagi lebih senyap.';
  return '';
}

export function drawCaught(ctx, game) {
  drawWorld(ctx, game, 0);
  overlay(ctx, 0.68);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff5a4d';
  ctx.font = 'bold 72px Georgia, serif';
  ctx.fillText('TERTANGKAP!', VIEW_W / 2, 260);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('Guard menyentuhmu saat alarm penuh. Bayangan adalah temanmu — putus pandangan dulu.', VIEW_W / 2, 310);
  ctx.font = '22px sans-serif';
  ctx.fillText(`Skor: ${game.state.score}   ·   ${game.world.def.name}`, VIEW_W / 2, 350);
  bigButton(ctx, { x: VIEW_W / 2 - 160, y: 400, w: 320, h: 64 }, '↻  COBA LAGI');
  ctx.fillStyle = COLORS.muted;
  ctx.font = '16px sans-serif';
  ctx.fillText('atau tekan R', VIEW_W / 2, 490);
}

export function drawWin(ctx, game) {
  drawWorld(ctx, game, 0);
  overlay(ctx, 0.7);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 72px Georgia, serif';
  ctx.fillText('MISI SELESAI!', VIEW_W / 2, 230);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('Kala menghilang ke dalam senja dengan ketiga Permata.', VIEW_W / 2, 282);
  ctx.font = 'bold 26px sans-serif';
  ctx.fillStyle = '#ffd94d';
  ctx.fillText(`SKOR AKHIR: ${game.state.score}`, VIEW_W / 2, 340);
  ctx.fillStyle = COLORS.text;
  ctx.font = '22px sans-serif';
  ctx.fillText(`Artefak: ${game.state.artifacts}   ·   Waktu total: ${formatTime(game.state.time)}`, VIEW_W / 2, 380);
  const grades = game.grades && game.grades.length ? game.grades : (game.levelGrade ? [game.levelGrade] : []);
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#ffd94d';
  ctx.fillText(grades.length ? `Grade per level: ${grades.map((g, i) => `L${i + 1} ${g}`).join('  ·  ')}` : '', VIEW_W / 2, 414);
  ctx.fillStyle = COLORS.text;
  ctx.font = '22px sans-serif';
  ctx.fillText('Terima kasih sudah bermain BAYANG SENJA.', VIEW_W / 2, 446);
  bigButton(ctx, { x: VIEW_W / 2 - 160, y: 478, w: 320, h: 64 }, '↻  MAIN LAGI');
  ctx.fillStyle = COLORS.muted;
  ctx.font = '16px sans-serif';
  ctx.fillText('atau tekan Enter', VIEW_W / 2, 568);
}

export function drawPaused(ctx, game) {
  drawWorld(ctx, game, 0);
  overlay(ctx, 0.6);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText('JEDA', VIEW_W / 2, 320);
  ctx.font = '22px sans-serif';
  ctx.fillText('Tekan P atau klik untuk lanjut. Guard menunggumu… sabar adalah senjata.', VIEW_W / 2, 365);
}

export function titleButton() { return { x: VIEW_W / 2 - 160, y: 470, w: 320, h: 64 }; }
export function levelDoneButton() { return { x: VIEW_W / 2 - 160, y: 420, w: 320, h: 64 }; }
export function caughtButton() { return { x: VIEW_W / 2 - 160, y: 400, w: 320, h: 64 }; }
export function winButton() { return { x: VIEW_W / 2 - 160, y: 478, w: 320, h: 64 }; }
export { LEVELS };
