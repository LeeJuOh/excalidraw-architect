#!/usr/bin/env node
// Label fonts and font defaults (issue 05 slice C, spec 7-9). Drives a real
// `dist/server.js` canvas over HTTP with elements prepared the way MCP and
// the CLI prepare them, plus the pure export module from `dist/core`.

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path, { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(repoRoot, 'dist');
const { prepareElement, prepareElementUpdate } = await import(pathToFileURL(join(dist, 'core', 'normalize.js')).href);
const { expandElementsForExport } = await import(pathToFileURL(join(dist, 'core', 'expand-elements.js')).href);

const NUNITO = 6;
const COMIC_SHANNS = 8;

const sandbox = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'archdraw-fonts-')));
const port = 36000 + Math.floor(Math.random() * 2000);
const base = `http://127.0.0.1:${port}`;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function startServer() {
  const child = spawn(process.execPath, [join(dist, 'server.js')], {
    cwd: repoRoot,
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', LOG_LEVEL: 'error', HOME: sandbox, ARCHDRAW_PROJECT_ROOT: sandbox },
    stdio: ['ignore', 'ignore', 'pipe']
  });
  let stderr = '';
  child.stderr.on('data', chunk => { stderr += chunk; });
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(`${base}/health`)).ok) return child;
    } catch { /* booting */ }
    await sleep(100);
  }
  child.kill();
  throw new Error(`canvas server did not start: ${stderr}`);
}

async function api(method, route, body) {
  const response = await fetch(`${base}${route}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { status: response.status, json: await response.json() };
}

const clear = () => api('DELETE', '/api/elements/clear');
const all = async () => (await api('GET', '/api/elements')).json.elements;
const get = async id => (await api('GET', `/api/elements/${id}`)).json.element;
const create = inputs => api('POST', '/api/elements/batch', { elements: inputs.map(prepareElement) });
const update = async (id, updates) => {
  const existing = await get(id);
  const payload = prepareElementUpdate(id, updates, existing.type);
  const { id: _id, ...body } = payload;
  return api('PUT', `/api/elements/${id}`, body);
};
const syncScene = elements => api('POST', '/api/elements/sync', { elements });

const box = (id, extra = {}) => ({ id, type: 'rectangle', x: 0, y: 0, width: 200, height: 60, ...extra });
const arrow = (id, extra = {}) => ({ id, type: 'arrow', x: 0, y: 200, points: [[0, 0], [300, 0]], ...extra });

// ---- cases ----

async function labelCarriesItsFont() {
  const res = await create([
    box('b', { text: 'API', fontFamily: 'comic', fontSize: 18 }),
    arrow('a', { text: 'calls', fontFamily: 'comic', fontSize: 12 })
  ]);
  assert.equal(res.status, 200, JSON.stringify(res.json));
  assert.deepEqual((await get('b')).label, { text: 'API', fontFamily: COMIC_SHANNS, fontSize: 18 });
  assert.deepEqual((await get('a')).label, { text: 'calls', fontFamily: COMIC_SHANNS, fontSize: 12 });
}

async function defaultsFillMissingFont() {
  await create([
    box('b', { text: 'API' }),
    arrow('a', { text: 'calls' }),
    { id: 't', type: 'text', x: 0, y: 400, text: '안 그림: retry' },
    { id: 'code', type: 'text', x: 0, y: 500, text: 'POST /orders', fontFamily: 'comic shanns' }
  ]);
  assert.deepEqual((await get('b')).label, { text: 'API', fontFamily: NUNITO, fontSize: 16 });
  assert.deepEqual((await get('a')).label, { text: 'calls', fontFamily: NUNITO, fontSize: 14 });
  const t = await get('t');
  assert.deepEqual([t.fontFamily, t.fontSize], [NUNITO, 16]);
  const code = await get('code');
  assert.deepEqual([code.fontFamily, code.fontSize], [COMIC_SHANNS, 16]);
}

async function textOnlyUpdateKeepsLabelFont() {
  await create([box('b', { text: 'old', fontFamily: 'comic', fontSize: 18 })]);
  await update('b', { text: 'new' });
  assert.deepEqual((await get('b')).label, { text: 'new', fontFamily: COMIC_SHANNS, fontSize: 18 });

  // After a browser sync the label is a bound text, and the box has no `label`.
  const stored = await get('b');
  const { label: _label, ...shape } = stored;
  await syncScene([
    { ...shape, boundElements: [{ id: 'b-text', type: 'text' }] },
    { id: 'b-text', type: 'text', x: 60, y: 20, width: 40, height: 25, text: 'new', originalText: 'new', containerId: 'b', fontFamily: COMIC_SHANNS, fontSize: 18 }
  ]);
  await update('b', { text: 'newer' });
  assert.deepEqual((await get('b')).label, { text: 'newer', fontFamily: COMIC_SHANNS, fontSize: 18 });
}

async function fontOnlyLabelChangeReplacesStoredText() {
  await create([box('b', { text: 'API', fontFamily: 'comic' })]);
  const stored = await get('b');
  const { label: _label, ...shape } = stored;
  await syncScene([
    { ...shape, boundElements: [{ id: 'b-text', type: 'text' }] },
    { id: 'b-text', type: 'text', x: 60, y: 20, width: 40, height: 25, text: 'API', originalText: 'API', containerId: 'b', fontFamily: COMIC_SHANNS, fontSize: 16 }
  ]);
  await api('PUT', '/api/elements/b', { label: { text: 'API', fontFamily: NUNITO } });
  assert.deepEqual((await all()).filter(el => el.containerId === 'b'), [], 'the label text with the old font is gone');
  assert.deepEqual((await get('b')).label, { text: 'API', fontFamily: NUNITO, fontSize: 16 });
}

async function fontOnlyUpdateReachesTheLabel() {
  await create([box('b', { text: 'API' }), box('plain')]);
  await update('b', { fontFamily: 'comic', fontSize: 20 });
  assert.deepEqual((await get('b')).label, { text: 'API', fontFamily: COMIC_SHANNS, fontSize: 20 });
  await update('plain', { fontFamily: 'comic' });
  assert.equal((await get('plain')).label, undefined, 'a box without a label gets no label');
}

async function labelAddedByUpdateGetsDefaults() {
  await create([box('b'), arrow('a')]);
  await update('b', { text: 'API' });
  await update('a', { text: 'calls' });
  assert.deepEqual((await get('b')).label, { text: 'API', fontFamily: NUNITO, fontSize: 16 });
  assert.deepEqual((await get('a')).label, { text: 'calls', fontFamily: NUNITO, fontSize: 14 });
}

function exportReadsLabelFont() {
  const elements = expandElementsForExport([
    prepareElement(box('b', { text: 'API', fontFamily: 'comic', fontSize: 18 })),
    prepareElement(arrow('a', { text: 'calls', fontSize: 12 })),
    { id: 'old', type: 'rectangle', x: 0, y: 0, width: 200, height: 60, label: { text: 'legacy' } },
    { id: 'old-arrow', type: 'arrow', x: 0, y: 0, points: [[0, 0], [100, 0]], label: { text: 'legacy' } },
    { id: 'old-text', type: 'text', x: 0, y: 0, text: 'legacy' }
  ]);
  const oldText = elements.find(el => el.id === 'old-text');
  assert.deepEqual([oldText.fontFamily, oldText.fontSize], [NUNITO, 16]);
  const labelOf = id => elements.find(el => el.containerId === id);
  assert.deepEqual([labelOf('b').fontFamily, labelOf('b').fontSize], [COMIC_SHANNS, 18]);
  assert.deepEqual([labelOf('a').fontFamily, labelOf('a').fontSize], [NUNITO, 12]);
  assert.deepEqual([labelOf('old').fontFamily, labelOf('old').fontSize], [NUNITO, 16], 'data without a font gets the defaults');
  assert.deepEqual([labelOf('old-arrow').fontFamily, labelOf('old-arrow').fontSize], [NUNITO, 14]);
}

// Excalidraw draws a label in its container's strokeColor, so a borderless
// note would show invisible text.
async function borderlessBoxLabelIsDark() {
  await create([box('note', { text: 'retry <= 3', strokeColor: 'transparent' })]);
  const stored = await get('note');
  assert.equal(stored.strokeColor, 'transparent');
  assert.equal(stored.label.strokeColor, '#1e1e1e');
  const label = expandElementsForExport([stored]).find(el => el.containerId === 'note');
  assert.equal(label.strokeColor, '#1e1e1e');

  const { label: _label, ...shape } = stored;
  await syncScene([
    { ...shape, boundElements: [{ id: 'note-text', type: 'text' }] },
    { id: 'note-text', type: 'text', x: 60, y: 20, width: 80, height: 20, text: 'retry <= 3', originalText: 'retry <= 3', containerId: 'note', strokeColor: '#1e1e1e', fontFamily: NUNITO, fontSize: 16 }
  ]);
  await update('note', { text: 'retry <= 5' });
  assert.equal((await get('note')).label.strokeColor, '#1e1e1e', 'a text update after sync keeps the dark label');
}

async function boxTurnedBorderlessGetsDarkLabel() {
  await create([box('b', { text: 'API' }), box('synced', { text: 'DB', strokeColor: '#e03131' }), box('empty', { strokeColor: 'transparent' })]);
  await update('b', { strokeColor: 'transparent' });
  assert.equal((await get('b')).label.strokeColor, '#1e1e1e', 'before a browser sync');

  const { label: _label, ...shape } = await get('synced');
  await syncScene([
    ...(await all()).filter(el => el.id !== 'synced'),
    { ...shape, boundElements: [{ id: 'synced-text', type: 'text' }] },
    { id: 'synced-text', type: 'text', x: 60, y: 20, width: 40, height: 25, text: 'DB', originalText: 'DB', containerId: 'synced', strokeColor: '#e03131', fontFamily: NUNITO, fontSize: 16 }
  ]);
  await update('synced', { strokeColor: 'transparent' });
  assert.deepEqual((await get('synced')).label, { text: 'DB', fontFamily: NUNITO, fontSize: 16, strokeColor: '#1e1e1e' }, 'after a browser sync');
  assert.deepEqual((await all()).filter(el => el.containerId === 'synced'), [], 'the old label text is replaced');

  await update('empty', { text: 'note' });
  assert.equal((await get('empty')).label.strokeColor, '#1e1e1e', 'a label added to a borderless box');
}

const cases = [
  ['a box turned borderless, or given its first label, gets a dark label', boxTurnedBorderlessGetsDarkLabel],
  ['a borderless box gets a dark label, on the canvas and in export', borderlessBoxLabelIsDark],
  ['box and arrow labels carry their own font', labelCarriesItsFont],
  ['missing font gets Nunito, 16 for boxes and text, 14 for arrow labels', defaultsFillMissingFont],
  ['a text-only label update keeps font and size, before and after sync', textOnlyUpdateKeepsLabelFont],
  ['a font-only label change replaces the stored label text', fontOnlyLabelChangeReplacesStoredText],
  ['a font-only box update reaches the label', fontOnlyUpdateReachesTheLabel],
  ['a label added by an update gets the defaults', labelAddedByUpdateGetsDefaults],
  ['export reads the label font first, then the defaults', exportReadsLabelFont]
];

const server = await startServer();
let failed = 0;
try {
  for (const [name, fn] of cases) {
    await clear();
    try {
      await fn();
      console.log(`ok - ${name}`);
    } catch (error) {
      failed++;
      console.log(`not ok - ${name}\n  ${error.stack.split('\n').slice(0, 3).join('\n  ')}`);
    }
  }
} finally {
  server.kill();
  fs.rmSync(sandbox, { recursive: true, force: true });
}
if (failed) {
  console.error(`${failed} font check(s) failed`);
  process.exit(1);
}
console.log('font checks passed');
