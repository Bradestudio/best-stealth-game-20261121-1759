// BAYANG SENJA — main.js: loop game dan mesin keadaan layar.
// Title -> main -> level selesai -> level berikut -> menang, atau tertangkap.
// Mode screenshot (?shot=...) membekukan dunia supaya frame deterministik.
import { VIEW_W, VIEW_H, LEVELS, SCORES, DETECT } from './config.js';
import { buildLevel } from './world.js';
import { createGuards, updateGuard, dispatchCameraAlerts, stealthGrade } from './guards.js';
import { createPlayer, updatePlayer, collectPickups, atExit } from './player.js';
import {
  ensureAudio, toggleMute, playStep, playSpotted, playAlarm, playArtifact,
  playRelic, playKey, playCaught, playWin, playClick,
} from './audio.js';
import { createInput, takeClicks, takePressed, hitButton } from './input.js';
import {
  drawWorld, drawTitle, drawLevelDone, drawCaught, drawWin, drawPaused,
  titleButton, levelDoneButton, caughtButton, winButton,
  SCREEN_TITLE, SCREEN_PLAY, SCREEN_LEVEL_DONE, SCREEN_CAUGHT, SCREEN_WIN,
} from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

function resize() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.width = Math.floor(VIEW_W * scale);
  canvas.height = Math.floor(VIEW_H * scale);
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}
window.addEventListener('resize', resize);
resize();

const input = createInput(canvas);

const game = {
  screen: SCREEN_TITLE,
  levelIndex: 0,
  world: null,
  guards: [],
  player: null,
  state: { score: 0, artifacts: 0, time: 0, flash: '', flashColor: '#ffd94d', flashTimer: 0 },
  maxSuspicion: 0,
  levelAlarm: false,
  levelGrade: null,
  grades: [],
  best: 0,
  paused: false,
  shotMode: false,
  time: 0,
  loadLevel(index) {
    this.levelIndex = index;
    this.world = buildLevel(index);
    this.guards = createGuards(LEVELS[index]);
    this.player = createPlayer(this.world);
    this.maxSuspicion = 0;
    this.levelAlarm = false;
    this.levelGrade = null;
  },
};

function flash(text, color) {
  game.state.flash = text;
  game.state.flashColor = color || '#ffd94d';
  game.state.flashTimer = 2.2;
}

function startGame() {
  game.state.score = 0;
  game.state.artifacts = 0;
  game.state.time = 0;
  game.grades = [];
  game.loadLevel(0);
  game.screen = SCREEN_PLAY;
  game.paused = false;
  ensureAudio();
  playClick();
}

function nextLevel() {
  if (game.levelIndex + 1 >= LEVELS.length) {
    game.screen = SCREEN_WIN;
    return;
  }
  game.state.score += SCORES.levelBonus;
  game.loadLevel(game.levelIndex + 1);
  game.screen = SCREEN_PLAY;
  playClick();
}

function retryLevel() {
  game.loadLevel(game.levelIndex);
  game.screen = SCREEN_PLAY;
  playClick();
}

function handleEvents(events) {
  for (const e of events) {
    if (e === 'spotted') { playSpotted(); flash('DICURIGAI!', '#f07828'); }
    if (e === 'alarm') { game.levelAlarm = true; playAlarm(); flash('ALARM! SEMBUNYI!', '#ff5a4d'); }
    if (e === 'dispatch') { flash('KAMERA MEMANGGIL GUARD!', '#f07828'); }
    if (e === 'artifact') playArtifact();
    if (e === 'relic') { playRelic(); flash('PERMATA DIDAPAT! MENUJU KELUAR!', '#ffd94d'); }
    if (e === 'key') { playKey(); flash('KUNCI DIDAPAT — PINTU TERBUKA!', '#ffd94d'); }
  }
}

function update(dt) {
  game.time += dt;
  if (game.state.flashTimer > 0) {
    game.state.flashTimer -= dt;
    if (game.state.flashTimer <= 0) game.state.flash = '';
  }
  if (game.screen !== SCREEN_PLAY || game.paused) return;
  game.state.time += dt;
  updatePlayer(game.world, game.player, input, dt);
  if (game.player.stepped) playStep(game.player.running);
  const events = [];
  for (const g of game.guards) updateGuard(game.world, g, game.player, dt, events);
  dispatchCameraAlerts(game.guards, events);
  game.maxSuspicion = Math.max(0, ...game.guards.map((g) => g.suspicion));
  handleEvents(events);
  handleEvents(collectPickups(game.world, game.player, game.state));
  // Tertangkap: guard dalam keadaan alert menyentuh pemain.
  for (const g of game.guards) {
    if (g.kind === 'guard' && g.state === 'alert' && Math.hypot(g.x - game.player.x, g.y - game.player.y) < 28) {
      game.screen = SCREEN_CAUGHT;
      game.best = Math.max(game.best, game.state.score);
      playCaught();
      return;
    }
  }
  // Menang level: relik di tangan dan mencapai pintu keluar.
  // Grade stealth level ini dinilai sekarang, sebelum layar hasil:
  // HANTU (+400) kalau tak pernah terlihat sama sekali.
  if (game.player.hasRelic && atExit(game.world, game.player)) {
    game.levelGrade = stealthGrade(game.maxSuspicion, game.levelAlarm);
    if (game.levelGrade === 'HANTU') game.state.score += SCORES.ghostBonus;
    game.grades.push(game.levelGrade);
    if (game.levelIndex + 1 >= LEVELS.length) {
      game.state.score += SCORES.levelBonus;
      game.screen = SCREEN_WIN;
      game.best = Math.max(game.best, game.state.score);
      playWin();
    } else {
      game.screen = SCREEN_LEVEL_DONE;
      playWin();
    }
  }
}

function handleInput() {
  const pressed = takePressed(input);
  if (pressed === 'KeyM') toggleMute();
  if (pressed === 'KeyP' && game.screen === SCREEN_PLAY) game.paused = !game.paused;
  if (pressed === 'KeyR' && (game.screen === SCREEN_PLAY || game.screen === SCREEN_CAUGHT)) retryLevel();
  if (pressed === 'Enter') {
    if (game.screen === SCREEN_TITLE) startGame();
    else if (game.screen === SCREEN_LEVEL_DONE) nextLevel();
    else if (game.screen === SCREEN_CAUGHT) retryLevel();
    else if (game.screen === SCREEN_WIN) startGame();
  }
  for (const click of takeClicks(input)) {
    ensureAudio();
    if (game.screen === SCREEN_TITLE && hitButton(click, titleButton())) { startGame(); return; }
    if (game.screen === SCREEN_LEVEL_DONE && hitButton(click, levelDoneButton())) { nextLevel(); return; }
    if (game.screen === SCREEN_CAUGHT && hitButton(click, caughtButton())) { retryLevel(); return; }
    if (game.screen === SCREEN_WIN && hitButton(click, winButton())) { startGame(); return; }
    if (game.screen === SCREEN_PLAY && game.paused) { game.paused = false; return; }
  }
}

function render() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (game.screen === SCREEN_TITLE) drawTitle(ctx, game);
  else if (game.screen === SCREEN_LEVEL_DONE) drawLevelDone(ctx, game);
  else if (game.screen === SCREEN_CAUGHT) drawCaught(ctx, game);
  else if (game.screen === SCREEN_WIN) drawWin(ctx, game);
  else if (game.paused) drawPaused(ctx, game);
  else drawWorld(ctx, game, game.time);
  if (statusEl) {
    statusEl.textContent = `${game.world.def.name}. Skor ${game.state.score}. Deteksi ${Math.round(game.maxSuspicion)} persen.`;
  }
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!game.shotMode) {
    handleInput();
    update(dt);
  }
  render();
  requestAnimationFrame(loop);
}

// Boot: dunia level 1 disiapkan, lalu mode screenshot (bila ada) menatanya.
game.loadLevel(0);
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  game.shotMode = true;
  stageShot(shot, game);
}
requestAnimationFrame(loop);
