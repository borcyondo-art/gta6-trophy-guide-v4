/* test.mjs — Leonida Legend's own checks. Run with: node test.mjs
   Covers the trophy data, the app's files, the grader-style run and the
   screenshots. Exits non-zero on the first failure, so a green run means
   every check passed. */

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(here, p), 'utf8');
const readBin = (p) => readFileSync(join(here, p));

let passed = 0;
function check(name, ok, detail = '') {
  if (!ok) {
    console.error(`FAIL: ${name}${detail ? ` — ${detail}` : ''}`);
    process.exit(1);
  }
  passed++;
  console.log(`ok ${passed}: ${name}`);
}

/* ---------- the trophy data ---------- */

const data = JSON.parse(read('app/data/trophies.json'));
const trophies = Array.isArray(data) ? data : data.trophies;

check('trophies.json holds 55 trophies', trophies.length === 55, `got ${trophies.length}`);

const grades = {};
for (const t of trophies) grades[t.grade] = (grades[t.grade] || 0) + 1;
check('grades are 1 platinum, 2 gold, 6 silver, 46 bronze',
  grades.platinum === 1 && grades.gold === 2 && grades.silver === 6 && grades.bronze === 46,
  JSON.stringify(grades));

check('28 trophies are hidden', trophies.filter((t) => t.hidden).length === 28);
check('27 trophies are visible', trophies.filter((t) => !t.hidden).length === 27);

for (const t of trophies) {
  check(`trophy ${t.id} has a name, description and guide`,
    typeof t.name === 'string' && t.name.trim() !== ''
    && typeof t.description === 'string' && t.description.trim() !== ''
    && typeof t.guide === 'string' && t.guide.trim() !== '');
}
check('no duplicate trophy ids', new Set(trophies.map((t) => t.id)).size === 55);
check('no duplicate trophy names', new Set(trophies.map((t) => t.name)).size === 55);

const KNOWN_KINDS = new Set(['platinum', 'completion', 'story', 'collectibles', 'activities', 'robberies', 'money', 'exploration']);
check('every trophy has a known kind and a roadmap stage 1-6',
  trophies.every((t) => KNOWN_KINDS.has(t.kind) && Number.isInteger(t.stage) && t.stage >= 1 && t.stage <= 6));
const stages = {};
for (const t of trophies) stages[t.stage] = (stages[t.stage] || 0) + 1;
check('roadmap stages sum to 55', Object.values(stages).reduce((a, b) => a + b, 0) === 55, JSON.stringify(stages));

const missable = trophies.filter((t) => t.missable);
check('exactly one missable trophy: Positive Mental Attitude',
  missable.length === 1 && missable[0].name === 'Positive Mental Attitude');
check('the platinum is Vice Got a Price!',
  trophies.some((t) => t.grade === 'platinum' && t.name === 'Vice Got a Price!'));
check('the asterisks name is present: T**s Ass Drug Money',
  trophies.some((t) => t.name === 'T**s Ass Drug Money'));
check('every trophy cites at least one source',
  trophies.every((t) => Array.isArray(t.sources) && t.sources.length > 0));
check('every trophy with a count has a number and a label',
  trophies.every((t) => t.count === null || (typeof t.count === 'number' && typeof t.countLabel === 'string')));

/* ---------- the app's files ---------- */

const html = read('app/index.html');
check('index.html loads the stylesheet and the main module',
  html.includes('css/style.css') && html.includes('js/main.js'));
check('index.html has no http(s) reference at all', !/https?:\/\//.test(html));

for (const f of ['app/js/main.js', 'app/js/data.js', 'app/js/store.js', 'app/js/filters.js', 'app/js/views.js']) {
  execFileSync(process.execPath, ['--check', join(here, f)], { stdio: 'ignore' });
  check(`${f} parses`, true);
}
check('app/css/style.css is non-empty', read('app/css/style.css').trim().length > 1000);

const mainTs = read('main.ts');
check('main.ts imports buildDossier from the vendored library',
  mainTs.includes("from './vendor/makefun-frontend.ts'") && mainTs.includes('buildDossier'));
check('main.ts passes the scorer caps',
  mainTs.includes('text_max_bytes: 163840') && mainTs.includes('max: 4') && mainTs.includes('max_bytes: 262144'));

const kitVendor = readFileSync('/home/hatch/workspace/makefun/gta6-trophy-guide-01-kit/starter/vendor/makefun-frontend.ts');
const sha = (b) => createHash('sha256').update(b).digest('hex');
check('vendor/makefun-frontend.ts is the kit copy, unchanged',
  sha(readBin('vendor/makefun-frontend.ts')) === sha(kitVendor));

const license = read('LICENSE');
check('LICENSE starts with the SPDX line', license.startsWith('SPDX-License-Identifier: MIT'));

const readme = read('README.md');
check('README carries the 3 make.fun badge lines',
  readme.includes('https://make.fun/badge/gta6-trophy-guide-01.svg')
  && readme.includes('borcyondo-art/gta6-trophy-guide-v4/rank.svg')
  && readme.includes('borcyondo-art/gta6-trophy-guide-v4/reward.svg'));
check('README links the bounty page', readme.includes('https://make.fun/bounty/gta6-trophy-guide-01'));

/* ---------- the screenshots ---------- */

function pngSize(buf) {
  if (buf[0] !== 0x89 || buf[1] !== 0x50) return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}
function jpegSize(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length - 1) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    }
    const len = buf.readUInt16BE(i + 2);
    i += 2 + len;
  }
  return null;
}

const shots = readdirSync(join(here, 'screenshots')).filter((f) => !f.startsWith('.')).sort();
check('screenshots/ holds 4 images', shots.length === 4, `got ${shots.length}: ${shots.join(', ')}`);
for (const f of shots) {
  const buf = readBin(join('screenshots', f));
  const size = pngSize(buf) || jpegSize(buf);
  check(`screenshot ${f} is a whole PNG or JPEG within 1280x800`,
    size !== null && Math.max(size.w, size.h) <= 1280 && Math.min(size.w, size.h) >= 480,
    size ? `${size.w}x${size.h}` : 'unreadable');
  check(`screenshot ${f} is at most 256 KiB`, buf.length <= 262144, `${buf.length} bytes`);
}

/* ---------- the grader-style run ---------- */

const outDir = join(here, 'out');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
execFileSync(process.execPath, ['main.ts'], {
  cwd: here,
  env: { ...process.env, MAKEFUN_OUTPUT_DIR: outDir },
  stdio: 'ignore',
});
const dossierPath = join(outDir, 'dossier.json');
check('the grader-style run writes out/dossier.json', existsSync(dossierPath));
const dossierRaw = readFileSync(dossierPath, 'utf8');
JSON.parse(dossierRaw);
check('dossier.json parses as JSON', true);
check('the dossier names all 55 trophies',
  trophies.every((t) => dossierRaw.includes(t.name)));
check('the dossier stays under the 1.5 MiB cap',
  statSync(dossierPath).size <= 1572864, `${statSync(dossierPath).size} bytes`);

console.log(`\n${passed} checks passed.`);
