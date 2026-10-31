#!/usr/bin/env node
/* Joins src/ back into index.html: the one self-contained page Marilyn
   double-clicks. No dependencies — plain Node.

   src/page.html is the page with a whole line `@@ css/NN-name.css` or
   `@@ js/NN-name.js` wherever a piece goes. Each piece is pasted in verbatim.
   All the js pieces land in ONE classic <script>, so they share a single
   top-level scope: a const in 01 is visible in 24, and the order matters
   (boot runs last, in 24-keys-boot.js). They are not modules.

     node scripts/build.mjs          write index.html
     node scripts/build.mjs --check  exit 1 if index.html is not a fresh build
     node scripts/build.mjs --force  overwrite a hand-edited index.html

   Guard: scripts/.built.json records the sha256 of the last index.html this
   script wrote. If index.html matches neither that nor the new build, someone
   edited it by hand — the build stops rather than lose the change. Move the
   edit into src/, or pass --force to throw it away. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'index.html');
const STAMP = path.join(ROOT, 'scripts', '.built.json');
const sha = s => crypto.createHash('sha256').update(s).digest('hex');

export function buildPage() {
  const src = path.join(ROOT, 'src');
  const used = new Set();
  const page = fs.readFileSync(path.join(src, 'page.html'), 'utf8');
  const out = page.replace(/^@@ (\S+)\n/gm, (_, rel) => {
    const file = path.join(src, rel);
    if (!fs.existsSync(file)) throw new Error(`src/page.html includes ${rel}, which does not exist`);
    used.add(rel);
    const text = fs.readFileSync(file, 'utf8');
    return text.endsWith('\n') ? text : text + '\n';
  });
  /* a piece that exists but is never included would silently drop out of the app */
  for (const dir of ['css', 'js']) {
    for (const f of fs.readdirSync(path.join(src, dir))) {
      if (!used.has(`${dir}/${f}`)) throw new Error(`src/${dir}/${f} is not included in src/page.html`);
    }
  }
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = new Set(process.argv.slice(2));
  const fresh = buildPage();
  const disk = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : null;
  if (args.has('--check')) {
    if (disk === fresh) { console.log('index.html is current.'); process.exit(0); }
    console.error('index.html is stale — run: node scripts/build.mjs');
    process.exit(1);
  }
  if (disk === fresh) { console.log('index.html is already current.'); process.exit(0); }
  const last = fs.existsSync(STAMP) ? JSON.parse(fs.readFileSync(STAMP, 'utf8')).sha256 : null;
  if (disk !== null && last && sha(disk) !== last && !args.has('--force')) {
    console.error('index.html was edited by hand since the last build. Move the change into src/,\n'
      + 'or run with --force to overwrite it.');
    process.exit(1);
  }
  fs.writeFileSync(OUT, fresh);
  fs.writeFileSync(STAMP, JSON.stringify({ sha256: sha(fresh) }, null, 2) + '\n');
  console.log(`Wrote index.html (${(Buffer.byteLength(fresh) / 1024).toFixed(1)} KB).`);
}
