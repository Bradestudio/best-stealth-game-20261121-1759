// Bayang Senja — entrypoint hand-in untuk make.fun (Node 22, stdlib saja).
//
// Game-nya statis: game/index.html + modul ES tanpa library dan tanpa request
// jaringan. Yang dilakukan file ini cuma dua hal:
//   1. menyalin game/ dan screenshots/ dari samping file ini ke direktori output
//      (/output di dalam grader; di luar sana MAKEFUN_OUTPUT_DIR menggantikannya:
//      mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts)
//   2. menulis /output/dossier.json lewat library make.fun yang sudah di-vendor,
//      supaya judge membaca ringkasan yang sama persis dengan yang scorer hitung.
//
// Batas-batas di bawah datang dari gate bounty ini: hanya text_max_bytes yang
// membentuk byte dossier; sisanya menolak entry yang memang akan ditolak scorer
// (lebih dari 4 screenshot, atau satu di atas 256 KiB; game/ di atas 993 file
// atau 48 MiB; path di bawah game/ di atas 1000 byte; game/ dihitung bersama
// batas 1000 entri /output itu sendiri, screenshots/, dan dossier.json).
//
// Ronde 2 — yang baru di game ini: kamera yang mencapai alarm memanggil guard
// terdekat untuk memeriksa titik terakhir yang kamera lihat (dispatch); tiap
// level dinilai HANTU / BAYANGAN / TERLIHAT dengan bonus hantu +400; dan
// pencahayaan malam sinematik (light pool + vignette) di render.js.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
