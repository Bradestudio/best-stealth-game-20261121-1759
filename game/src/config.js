// BAYANG SENJA — konfigurasi: ukuran layar, warna malam museum, dan 3 level.
// Satu file satu tugas: file ini hanya data dan konstanta, tanpa logika gerak.
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const HUD_H = 64;
export const TILE = 40;

export const COLORS = {
  floorA: '#2b2118',
  floorB: '#241c14',
  carpet: '#4a2c33',
  wall: '#5d4a33',
  wallTop: '#7a6244',
  coverGlass: '#3f6d8e',
  coverGold: '#d9a441',
  darkZone: 'rgba(8, 12, 40, 0.55)',
  darkEdge: '#2e3d6e',
  player: '#19c2b8',
  playerCloak: '#0e3a3a',
  guard: '#e2483d',
  guardCalm: '#e8b23a',
  coneCalm: 'rgba(232, 178, 58, 0.20)',
  coneSuspicious: 'rgba(240, 120, 40, 0.30)',
  coneAlert: 'rgba(226, 72, 61, 0.38)',
  relic: '#ffd94d',
  exit: '#2fd67a',
  exitDark: '#0d5c33',
  text: '#f5ead2',
  muted: '#b9a888',
  danger: '#ff5a4d',
};

// x,y,w,h dalam koordinat logis 1280x720. Area main: y dari HUD_H sampai 720.
// walls: menahan gerak + memutus pandangan. covers: etalase/patung/pilar, sama
// seperti walls tapi digambar sebagai benda museum. darks: zona bayangan, pemain
// di dalamnya jauh lebih sulit terlihat. doors: pintu terkunci (level 3).
export const LEVELS = [
  {
    name: 'LEVEL 1 — GALERI SENJA',
    hint: 'Pelajari patroli. Sembunyi di balik etalase dan bayangan.',
    playerStart: { x: 90, y: 630 },
    relic: { x: 640, y: 165 },
    exit: { x: 1170, y: 620, w: 84, h: 76 },
    key: null,
    walls: [
      { x: 0, y: 64, w: 1280, h: 16 },
      { x: 0, y: 704, w: 1280, h: 16 },
      { x: 0, y: 64, w: 16, h: 656 },
      { x: 1264, y: 64, w: 16, h: 656 },
      { x: 560, y: 96, w: 16, h: 150 },
      { x: 180, y: 430, w: 200, h: 16 },
      { x: 900, y: 430, w: 200, h: 16 },
    ],
    covers: [
      { x: 300, y: 300, w: 130, h: 64, kind: 'case' },
      { x: 700, y: 300, w: 130, h: 64, kind: 'case' },
      { x: 480, y: 500, w: 130, h: 64, kind: 'case' },
      { x: 900, y: 150, w: 64, h: 64, kind: 'statue' },
      { x: 200, y: 150, w: 56, h: 56, kind: 'pillar' },
      { x: 1020, y: 500, w: 56, h: 56, kind: 'pillar' },
    ],
    darks: [
      { x: 120, y: 110, w: 200, h: 130 },
      { x: 900, y: 520, w: 230, h: 130 },
      { x: 520, y: 580, w: 220, h: 90 },
    ],
    artifacts: [
      { x: 350, y: 200 },
      { x: 960, y: 330 },
      { x: 640, y: 580 },
    ],
    guards: [
      { waypoints: [[300, 140], [960, 140], [960, 420], [300, 420]], speed: 58, pause: 1.4 },
      { waypoints: [[1080, 200], [1080, 600], [700, 600]], speed: 64, pause: 1.0 },
    ],
    cameras: [],
  },
  {
    name: 'LEVEL 2 — SAYAP KACA',
    hint: 'Kamera menyapu koridor. Lari itu berisik — mengendaplah.',
    playerStart: { x: 90, y: 630 },
    relic: { x: 640, y: 150 },
    exit: { x: 1170, y: 120, w: 84, h: 76 },
    key: null,
    walls: [
      { x: 0, y: 64, w: 1280, h: 16 },
      { x: 0, y: 704, w: 1280, h: 16 },
      { x: 0, y: 64, w: 16, h: 656 },
      { x: 1264, y: 64, w: 16, h: 656 },
      { x: 400, y: 96, w: 16, h: 180 },
      { x: 864, y: 96, w: 16, h: 180 },
      { x: 180, y: 380, w: 220, h: 16 },
      { x: 880, y: 380, w: 220, h: 16 },
      { x: 600, y: 480, w: 80, h: 16 },
    ],
    covers: [
      { x: 250, y: 250, w: 130, h: 64, kind: 'case' },
      { x: 900, y: 250, w: 130, h: 64, kind: 'case' },
      { x: 480, y: 300, w: 130, h: 64, kind: 'case' },
      { x: 700, y: 560, w: 130, h: 64, kind: 'case' },
      { x: 150, y: 480, w: 56, h: 56, kind: 'pillar' },
      { x: 1080, y: 480, w: 56, h: 56, kind: 'pillar' },
      { x: 610, y: 110, w: 60, h: 60, kind: 'statue' },
    ],
    darks: [
      { x: 110, y: 110, w: 190, h: 120 },
      { x: 980, y: 560, w: 220, h: 110 },
      { x: 460, y: 430, w: 200, h: 90 },
      { x: 980, y: 110, w: 180, h: 110 },
    ],
    artifacts: [
      { x: 320, y: 140 },
      { x: 960, y: 140 },
      { x: 640, y: 420 },
      { x: 120, y: 560 },
    ],
    guards: [
      { waypoints: [[250, 140], [1020, 140], [1020, 340], [250, 340]], speed: 76, pause: 1.0 },
      { waypoints: [[1100, 300], [1100, 640], [500, 640]], speed: 82, pause: 0.8 },
      { waypoints: [[180, 300], [180, 640], [420, 640], [420, 320]], speed: 72, pause: 1.2 },
    ],
    cameras: [
      { x: 640, y: 96, baseAngle: Math.PI / 2, sweep: 1.1, speed: 0.7, range: 260 },
    ],
  },
  {
    name: 'LEVEL 3 — RUANG PERMATA',
    hint: 'Ambil Kunci Kuningan dulu — pintu permata terkunci.',
    playerStart: { x: 640, y: 640 },
    relic: { x: 1020, y: 150 },
    exit: { x: 90, y: 620, w: 84, h: 76 },
    key: { x: 180, y: 150 },
    walls: [
      { x: 0, y: 64, w: 1280, h: 16 },
      { x: 0, y: 704, w: 1280, h: 16 },
      { x: 0, y: 64, w: 16, h: 656 },
      { x: 1264, y: 64, w: 16, h: 656 },
      { x: 640, y: 96, w: 16, h: 180 },
      { x: 640, y: 420, w: 16, h: 180 },
      { x: 300, y: 380, w: 220, h: 16 },
      { x: 820, y: 380, w: 220, h: 16 },
    ],
    doors: [
      { x: 640, y: 276, w: 16, h: 144, id: 'permata' },
    ],
    covers: [
      { x: 250, y: 250, w: 130, h: 64, kind: 'case' },
      { x: 900, y: 250, w: 130, h: 64, kind: 'case' },
      { x: 480, y: 500, w: 130, h: 64, kind: 'case' },
      { x: 820, y: 560, w: 130, h: 64, kind: 'case' },
      { x: 150, y: 420, w: 56, h: 56, kind: 'pillar' },
      { x: 1100, y: 420, w: 56, h: 56, kind: 'pillar' },
      { x: 990, y: 110, w: 60, h: 60, kind: 'statue' },
    ],
    darks: [
      { x: 110, y: 110, w: 190, h: 120 },
      { x: 1100, y: 540, w: 140, h: 120 },
      { x: 700, y: 430, w: 220, h: 90 },
      { x: 700, y: 110, w: 200, h: 110 },
    ],
    artifacts: [
      { x: 320, y: 140 },
      { x: 1120, y: 300 },
      { x: 640, y: 300 },
      { x: 300, y: 620 },
    ],
    guards: [
      { waypoints: [[250, 140], [560, 140], [560, 340], [250, 340]], speed: 84, pause: 0.9 },
      { waypoints: [[720, 140], [1180, 140], [1180, 340], [720, 340]], speed: 88, pause: 0.9 },
      { waypoints: [[200, 460], [560, 460], [560, 640], [200, 640]], speed: 80, pause: 1.0 },
      { waypoints: [[1100, 460], [1100, 640], [760, 640], [760, 460]], speed: 86, pause: 0.8 },
    ],
    cameras: [
      { x: 648, y: 350, baseAngle: Math.PI / 2, sweep: 0.9, speed: 0.9, range: 240 },
    ],
  },
];

export const SCORES = { artifact: 150, relic: 500, levelBonus: 300 };
export const DETECT = {
  coneRange: 245,
  coneHalfAngle: 0.58,
  darkRange: 110,
  sneakRange: 195,
  riseWalk: 55,
  riseSneak: 26,
  riseRun: 85,
  decay: 26,
  suspiciousAt: 50,
  alertAt: 100,
  chaseSpeed: 1.55,
  loseSightSeconds: 3.5,
};
export const SPEEDS = { walk: 155, sneak: 88, run: 235 };
export const NOISE_RUN_RADIUS = 155;
