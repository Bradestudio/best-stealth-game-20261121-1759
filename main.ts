// Bayang Senja — program hand-in untuk make.fun (Node 22, stdlib saja).
// Game-nya berupa file statis di game/ (index.html + modul ES, tanpa library
// dan tanpa network request). Program ini menyalin game/ dan screenshots/
// dari samping file ini ke /output lalu menulis /output/dossier.json, ringkasan
// yang dibaca judge, memakai library make.fun yang sudah di-vendor.
// Di luar container grader, MAKEFUN_OUTPUT_DIR menggantikan /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Batas-batas scorer (lihat kit): hanya text_max_bytes yang membentuk byte
// dossier; sisanya menolak entry yang memang akan ditolak scorer (lebih dari
// 4 screenshot atau satu di atas 256 KiB; game/ di atas 993 file atau 48 MiB,
// atau path di bawah game/ di atas 1000 byte; game/ dihitung bersama batas
// 1000 entri /output itu sendiri, screenshots/, dan dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
