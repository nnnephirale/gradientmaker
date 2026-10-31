/* node --test tests/*.test.mjs — cheap checks that the docs and the built page keep up
   with src/. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, buildPage } from '../scripts/build.mjs';

const srcFiles = () => {
  const out = [];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`;
      e.isDirectory() ? walk(rel) : out.push(rel);
    }
  };
  walk('src');
  return out.sort();
};

test('every src/ file is mapped in ARCHITECTURE.md, and every mapped file exists', () => {
  const doc = fs.readFileSync(path.join(ROOT, 'ARCHITECTURE.md'), 'utf8');
  const mapped = new Set([...doc.matchAll(/`(src\/[^`]*[^`/])`/g)].map(m => m[1]));
  const files = srcFiles();
  assert.deepEqual(files.filter(f => !mapped.has(f)), [], 'src/ files missing from ARCHITECTURE.md');
  assert.deepEqual([...mapped].filter(f => !files.includes(f)), [], 'ARCHITECTURE.md names files that do not exist');
});

test('index.html matches a fresh build of src/', () => {
  const disk = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(disk === buildPage(), 'index.html is stale — run: node scripts/build.mjs');
});
