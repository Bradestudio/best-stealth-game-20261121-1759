// BAYANG SENJA — shots.js: panggung screenshot deterministik (?shot=...&seed=1).
// Setiap adegan menata dunia asli langsung — tanpa simulasi acak — supaya frame
// yang sama selalu muncul dari seed yang sama:
//   start — title screen di atas level 1.
//   play  — level 1: Kala mengendap di balik etalase, cone guard menyapu dekat.
//   play2 — level 2: nyaris ketahuan, cone merah/oranye, meter deteksi tinggi.
//   end   — layar menang setelah 3 level, dengan skor akhir.
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_WIN } from './render.js';
import { DETECT } from './config.js';

export function stageShot(name, game) {
  const { state } = game;
  if (name === 'play') {
    game.loadLevel(0);
    game.player.x = 268;
    game.player.y = 386;
    game.player.angle = Math.PI / 4;
    game.player.sneaking = true;
    const g = game.guards[0];
    g.x = 430;
    g.y = 250;
    g.angle = Math.PI * 0.72;
    g.suspicion = 34;
    g.state = 'patrol';
    const g2 = game.guards[1];
    g2.x = 1080;
    g2.y = 300;
    g2.angle = Math.PI;
    g2.suspicion = 0;
    state.artifacts = 1;
    state.score = 150;
    state.time = 47;
    game.maxSuspicion = 34;
    game.screen = SCREEN_PLAY;
    return;
  }
  if (name === 'play2') {
    game.loadLevel(1);
    game.player.x = 520;
    game.player.y = 470;
    game.player.angle = -Math.PI / 2;
    game.player.sneaking = true;
    game.player.hasRelic = true;
    game.world.relicTaken = true;
    const g = game.guards[0];
    g.x = 640;
    g.y = 330;
    g.angle = Math.PI / 2;
    g.suspicion = 96;
    g.state = 'alert';
    g.lastSeen = { x: 520, y: 470 };
    const cam = game.guards[3];
    if (cam) {
      cam.angle = Math.PI / 2 + 0.6;
      cam.suspicion = 82;
    }
    const g2 = game.guards[1];
    g2.x = 1080;
    g2.y = 560;
    g2.angle = Math.PI;
    g2.suspicion = 55;
    g2.state = 'investigate';
    g2.investigate = { x: 980, y: 560 };
    state.artifacts = 3;
    state.score = 1150;
    state.time = 132;
    game.maxSuspicion = 96;
    game.screen = SCREEN_PLAY;
    return;
  }
  if (name === 'end') {
    game.loadLevel(2);
    game.world.relicTaken = true;
    game.player.hasRelic = true;
    game.player.x = 130;
    game.player.y = 620;
    game.player.angle = Math.PI;
    state.artifacts = 11;
    state.score = 2840;
    state.time = 318;
    game.maxSuspicion = 12;
    game.screen = SCREEN_WIN;
    return;
  }
  // start (default): title di atas level 1 yang segar.
  game.loadLevel(0);
  game.screen = SCREEN_TITLE;
  void DETECT;
}
