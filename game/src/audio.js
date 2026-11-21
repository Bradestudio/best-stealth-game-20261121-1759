// BAYANG SENJA — audio.js: semua suara dibuat prosedural dengan WebAudio.
// Tanpa file audio eksternal: langkah, "ting" curiga, alarm, ambil artefak,
// jingle menang, dan drone ambient museum malam.
let ctx = null;
let muted = false;
let ambientNodes = null;

export function isMuted() { return muted; }
export function toggleMute() {
  muted = !muted;
  if (ambientNodes) ambientNodes.gain.gain.value = muted ? 0 : 0.05;
  return muted;
}

export function ensureAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    startAmbient();
  } catch {
    ctx = null;
  }
}

function tone(freq, dur, type, vol, when = 0, slideTo = 0) {
  if (!ctx || muted) return;
  try {
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch { /* suara tidak pernah boleh mematikan game */ }
}

function startAmbient() {
  if (!ctx || ambientNodes) return;
  try {
    const gain = ctx.createGain();
    gain.gain.value = muted ? 0 : 0.05;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 55;
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 82.5;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain).connect(gain.gain);
    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc2.start();
    lfo.start();
    ambientNodes = { gain, osc, osc2, lfo };
  } catch { ambientNodes = null; }
}

export function playStep(running) {
  tone(running ? 140 : 100, 0.07, 'triangle', running ? 0.10 : 0.05);
}
export function playSpotted() {
  tone(880, 0.18, 'sine', 0.16);
  tone(1174, 0.22, 'sine', 0.14, 0.12);
}
export function playAlarm() {
  tone(520, 0.5, 'sawtooth', 0.10, 0, 780);
  tone(520, 0.5, 'sawtooth', 0.10, 0.45, 780);
}
export function playArtifact() {
  tone(1320, 0.12, 'sine', 0.14);
  tone(1760, 0.2, 'sine', 0.12, 0.08);
}
export function playRelic() {
  [660, 880, 1100, 1320].forEach((f, i) => tone(f, 0.25, 'sine', 0.14, i * 0.09));
}
export function playKey() {
  tone(980, 0.15, 'square', 0.08);
  tone(1470, 0.25, 'square', 0.07, 0.1);
}
export function playCaught() {
  tone(220, 0.6, 'sawtooth', 0.14, 0, 55);
}
export function playWin() {
  [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.3, 'triangle', 0.14, i * 0.11));
}
export function playClick() {
  tone(700, 0.06, 'sine', 0.10);
}
