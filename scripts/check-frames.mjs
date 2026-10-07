#!/usr/bin/env node
// Frame rules on the REST layer (issue 05 slice A, ADR-0008). Drives a real
// `dist/server.js` canvas over HTTP and WebSocket, plus the pure describe and
// export modules from `dist/core`. HOME points at a sandbox so the session
// record does not touch the user's canvases.

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path, { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import WebSocket from 'ws';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(repoRoot, 'dist');
const { describeScene } = await import(pathToFileURL(join(dist, 'core', 'describe.js')).href);
const { expandElementsForExport } = await import(pathToFileURL(join(dist, 'core', 'expand-elements.js')).href);
const { estimateTextSize } = await import(pathToFileURL(join(dist, 'core', 'frames.js')).href);

const sandbox = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'archdraw-frames-')));
const port = 34000 + Math.floor(Math.random() * 2000);
const base = `http://127.0.0.1:${port}`;
const MARGIN = 40;

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
const batch = elements => api('POST', '/api/elements/batch', { elements });
const update = (id, body) => api('PUT', `/api/elements/${id}`, body);

function right(el) { return el.x + el.width; }
function bottom(el) { return el.y + el.height; }

const box = (id, x, y, frameId, extra = {}) => ({ id, type: 'rectangle', x, y, width: 200, height: 60, frameId, ...extra });

// ---- cases ----

async function batchCreatesNamedFrameWithChildren() {
  // The frame comes after its children: order inside one batch does not matter.
  const res = await batch([box('a', 100, 100, 'f'), box('b', 420, 100, 'f'), { id: 'f', type: 'frame', name: 'Order flow', x: 0, y: 0 }]);
  assert.equal(res.status, 200, JSON.stringify(res.json));
  const f = await get('f');
  assert.equal(f.name, 'Order flow');
  assert.equal((await get('a')).frameId, 'f');
  // Created without a size: children range + margin 40.
  assert.deepEqual([f.x, f.y, f.width, f.height], [100 - MARGIN, 100 - MARGIN, 520 + 2 * MARGIN, 60 + 2 * MARGIN]);
  assert.equal((await get('a')).x, 100, 'children do not move');
}

async function rejectsBadFrameIds() {
  await batch([{ id: 'f', type: 'frame', name: 'F', x: 0, y: 0, width: 400, height: 300 }, box('plain', 600, 0, null)]);
  const before = (await all()).length;

  for (const [label, elements, badId] of [
    ['missing id', [box('x1', 10, 10, 'nope')], 'nope'],
    ['box id', [box('x2', 10, 10, 'plain')], 'plain'],
    ['frame in frame', [{ id: 'inner', type: 'frame', name: 'I', x: 10, y: 10, width: 100, height: 100, frameId: 'f' }], 'frameId f:'],
    ['one bad in a batch', [box('ok1', 10, 10, 'f'), box('bad', 10, 100, 'ghost')], 'ghost']
  ]) {
    const res = await batch(elements);
    assert.equal(res.status, 400, `${label}: ${JSON.stringify(res.json)}`);
    assert.match(res.json.error, new RegExp(badId), `${label}: error names ${badId}`);
  }
  assert.equal((await all()).length, before, 'nothing created');

  const single = await api('POST', '/api/elements', box('x3', 10, 10, 'nope2'));
  assert.equal(single.status, 400);
  assert.match(single.json.error, /nope2/);

  const upd = await update('plain', { frameId: 'nope3' });
  assert.equal(upd.status, 400);
  assert.match(upd.json.error, /nope3/);
  assert.equal((await get('plain')).frameId ?? null, null);
}

async function rejectsEmptyFrame() {
  for (const res of [
    await batch([{ id: 'e', type: 'frame', name: 'Empty', x: 0, y: 0 }]),
    await api('POST', '/api/elements', { id: 'e', type: 'frame', name: 'Empty', x: 0, y: 0 })
  ]) {
    assert.equal(res.status, 400);
    assert.match(res.json.error, /size/i);
    assert.match(res.json.error, /child/i);
  }
  assert.equal((await all()).length, 0);

  await batch([{ id: 'e', type: 'frame', name: 'Empty', x: 0, y: 0, width: 300, height: 200 }]);
  const res = await update('e', { width: 0 });
  assert.equal(res.status, 400, 'a childless frame cannot lose its size');
  assert.equal((await get('e')).width, 300);
}

const syncScene = elements => api('POST', '/api/elements/sync', { elements });

async function ignoresMemberDraggedOut() {
  await batch([{ id: 'f', type: 'frame', name: 'F', x: 0, y: 0, width: 400, height: 300 }, box('a', 40, 40, 'f'), box('b', 40, 160, 'f')]);
  // The browser sync keeps frameId on a child the user dragged out.
  await syncScene((await all()).map(el => el.id === 'b' ? { ...el, x: 2000 } : el));
  await update('a', { y: 50 });
  const f = await get('f');
  assert.deepEqual([f.x, f.y, f.width, f.height], [0, 0, 400, 300], 'a sibling write leaves the dragged-out child out');
}

async function textUpdateGrowsByEstimate() {
  await batch([{ id: 'f', type: 'frame', name: 'F', x: 0, y: 0, width: 400, height: 300 }]);
  await batch([{ id: 't', type: 'text', x: 200, y: 100, text: 'short', fontSize: 20, width: 50, height: 25, frameId: 'f' }]);
  const text = '안 그림: 결제 재시도와 환불 흐름은 따로';
  await update('t', { text });
  assert.equal(right(await get('f')), 200 + estimateTextSize(text, 20).width + MARGIN,
    'the old measured width does not hold the frame back');
}

async function serverUpdatesKeepOneLabel() {
  await batch([{ id: 'f', type: 'frame', name: 'F', x: 0, y: 0, width: 600, height: 300 }, box('c', 40, 40, 'f', { label: { text: 'old' } })]);
  const ws = new WebSocket(`ws://127.0.0.1:${port}`);
  const updates = [];
  const deleted = [];
  ws.on('message', raw => {
    const msg = JSON.parse(raw.toString());
    if (msg.type === 'element_updated') updates.push(msg.element);
    if (msg.type === 'element_deleted') deleted.push(msg.elementId);
  });
  await new Promise(resolve => ws.on('open', resolve));

  await update('c', { y: 60 });
  await update('f', { x: 10 });
  await sleep(100);
  assert.ok(updates.length >= 2);
  assert.ok(updates.every(el => el.label === undefined), 'an update that keeps the label does not resend it');

  // After a browser sync the label is a bound text in the store.
  const stored = await get('c');
  await syncScene([
    ...(await all()).map(el => el.id === 'c' ? { ...el, boundElements: [{ id: 'c-text', type: 'text' }] } : el),
    { id: 'c-text', type: 'text', x: stored.x + 80, y: stored.y + 20, width: 30, height: 25, text: 'old', originalText: 'old', containerId: 'c', frameId: 'f' }
  ]);
  updates.length = 0;
  await update('c', { label: { text: 'new' } });
  await sleep(100);
  assert.equal(updates[0].label.text, 'new', 'a changed label is sent');
  const labels = (await all()).filter(el => el.containerId === 'c');
  assert.deepEqual(labels, [], 'the stale label text is gone from the store');
  assert.deepEqual((await get('c')).boundElements, []);

  // Deleting the frame announces the label before its box.
  await syncScene([
    ...(await all()).map(el => el.id === 'c' ? { ...el, label: undefined, boundElements: [{ id: 'c-text', type: 'text' }] } : el),
    { id: 'c-text', type: 'text', x: 0, y: 0, width: 30, height: 25, text: 'new', originalText: 'new', containerId: 'c', frameId: null }
  ]);
  await api('DELETE', '/api/elements/f');
  await sleep(100);
  ws.close();
  assert.deepEqual(deleted, ['c-text', 'c', 'f']);
}

async function growsOnlyWhenChildIsOutside() {
  await batch([{ id: 'f', type: 'frame', name: 'F', x: 0, y: 0, width: 400, height: 300 }, box('in', 20, 20, 'f')]);
  // Already inside but closer than 40 to the border: no change.
  let f = await get('f');
  assert.deepEqual([f.x, f.y, f.width, f.height], [0, 0, 400, 300]);
  await batch([box('near', 190, 230, 'f')]);
  f = await get('f');
  assert.deepEqual([f.x, f.y, f.width, f.height], [0, 0, 400, 300], 'inside child near the border leaves the frame alone');

  await batch([box('out', 500, -100, 'f')]);
  f = await get('f');
  const out = await get('out');
  assert.deepEqual([out.x, out.y], [500, -100], 'child keeps its coordinates');
  assert.equal(right(f), 700 + MARGIN);
  assert.equal(f.y, -100 - MARGIN);
  assert.equal(f.x, 0, 'left side unchanged');
  assert.equal(bottom(f), 300, 'bottom side unchanged');

  // update_element path: moving a child out grows the frame.
  await update('in', { x: -300 });
  f = await get('f');
  assert.equal(f.x, -300 - MARGIN);
  assert.equal(right(f), 700 + MARGIN);
}

async function estimatesUnmeasuredText() {
  await batch([{ id: 'f', type: 'frame', name: 'F', x: 0, y: 0, width: 400, height: 300 }]);
  const text = '안 그림: 결제 재시도와 환불 흐름은 따로';
  await batch([{ id: 't', type: 'text', x: 300, y: 100, text, fontSize: 20, frameId: 'f' }]);
  const f = await get('f');
  const estimate = estimateTextSize(text, 20);
  assert.ok(estimate.width >= text.replace(/[^가-힣]/g, '').length * 20, 'Hangul counts as 1.0 x fontSize');
  assert.equal(right(f), 300 + estimate.width + MARGIN);

  // An arrow bend outside the frame grows it.
  await batch([{ id: 'ar', type: 'arrow', x: 50, y: 50, points: [[0, 0], [100, 400], [200, 0]], frameId: 'f' }]);
  assert.equal(bottom(await get('f')), 450 + MARGIN);
}

async function frameMoveCarriesChildren() {
  await batch([
    { id: 'f', type: 'frame', name: 'F', x: 0, y: 0, width: 800, height: 300 },
    box('a', 40, 100, 'f'), box('b', 500, 100, 'f'),
    { id: 'ab', type: 'arrow', x: 0, y: 0, startElementId: 'a', endElementId: 'b', frameId: 'f' }
  ].map(el => {
    if (el.startElementId) {
      const { startElementId, endElementId, ...rest } = el;
      return { ...rest, start: { id: startElementId }, end: { id: endElementId } };
    }
    return el;
  }));
  const arrowBefore = await get('ab');
  const res = await update('f', { x: 100, y: 50 });
  assert.equal(res.status, 200, JSON.stringify(res.json));
  assert.deepEqual([(await get('a')).x, (await get('a')).y], [140, 150]);
  assert.deepEqual([(await get('b')).x, (await get('b')).y], [600, 150]);
  const arrowAfter = await get('ab');
  assert.equal(Math.round(arrowAfter.x - arrowBefore.x), 100);
  assert.equal(Math.round(arrowAfter.y - arrowBefore.y), 50);
  assert.deepEqual(arrowAfter.points, arrowBefore.points);

  // Width below the children range stops at range + margin.
  await update('f', { width: 100, height: 10 });
  const f = await get('f');
  assert.equal(right(f), 800 + MARGIN);
  assert.equal(bottom(f), 210 + MARGIN);
  assert.equal(f.x, 100, 'resize keeps the origin');
}

async function deletingFrameDeletesChildrenLast() {
  await batch([
    { id: 'f1', type: 'frame', name: 'One', x: 0, y: 0, width: 600, height: 300 },
    box('c1', 40, 40, 'f1'), box('c2', 300, 40, 'f1'),
    { id: 'f2', type: 'frame', name: 'Two', x: 800, y: 0, width: 400, height: 300 },
    box('d1', 840, 40, 'f2')
  ]);
  const ws = new WebSocket(`ws://127.0.0.1:${port}`);
  const deleted = [];
  ws.on('message', raw => {
    const msg = JSON.parse(raw.toString());
    if (msg.type === 'element_deleted') deleted.push(msg.elementId);
  });
  await new Promise(resolve => ws.on('open', resolve));
  const res = await api('DELETE', '/api/elements/f1');
  assert.equal(res.status, 200);
  await sleep(200);
  ws.close();
  const ids = (await all()).map(el => el.id).sort();
  assert.deepEqual(ids, ['d1', 'f2']);
  assert.deepEqual(deleted.slice().sort(), ['c1', 'c2', 'f1']);
  assert.equal(deleted.at(-1), 'f1', 'frame is announced last');
}

function describeGroupsByFrame() {
  const scene = [
    { id: 'f1', type: 'frame', name: 'Order flow', x: 0, y: 0, width: 600, height: 300 },
    { id: 'a', type: 'rectangle', x: 40, y: 40, width: 200, height: 60, frameId: 'f1', boundElements: [{ id: 'a-t', type: 'text' }] },
    { id: 'a-t', type: 'text', x: 60, y: 60, width: 100, height: 20, text: 'API', containerId: 'a', frameId: 'f1' },
    { id: 'b', type: 'rectangle', x: 300, y: 40, width: 200, height: 60, frameId: 'f1', label: { text: 'DB' } },
    { id: 'f2', type: 'frame', name: 'Failure', x: 800, y: 0, width: 400, height: 300 },
    { id: 'c', type: 'ellipse', x: 840, y: 40, width: 100, height: 100, frameId: 'f2' },
    { id: 'loose', type: 'text', x: 0, y: 500, text: 'note' },
    // A label left with frameId null (synced before the frontend fix) still belongs to its box's frame.
    { id: 'c-t', type: 'text', x: 850, y: 60, width: 50, height: 20, text: 'Cache', containerId: 'c', frameId: null }
  ];
  const out = describeScene(scene);
  assert.match(out, /Order flow.*\[f1\].*2 elements/);
  assert.match(out, /Failure.*\[f2\].*1 element\b/);
  const outsideAt = out.indexOf('Outside any frame');
  assert.ok(outsideAt > out.indexOf('Failure'), 'outside group comes after the frames');
  const outside = out.slice(outsideAt);
  assert.match(outside, /\[loose\]/);
  assert.doesNotMatch(outside, /a-t|c-t/, 'labels never land outside');
  assert.ok(outside.trim().split('\n').length <= 3, 'outside group is the last section');
  assert.match(out, /\[a\][^\n]*label: "API"/);
  assert.match(out, /\[c\][^\n]*label: "Cache"/);
}

function exportLabelFollowsContainerFrame() {
  const exported = expandElementsForExport([
    { id: 'f', type: 'frame', name: 'F', x: 0, y: 0, width: 400, height: 200 },
    { id: 'a', type: 'rectangle', x: 40, y: 40, width: 200, height: 60, frameId: 'f', label: { text: 'API' } }
  ]);
  const label = exported.find(el => el.containerId === 'a');
  assert.equal(label.frameId, 'f');
  assert.equal(exported.find(el => el.id === 'f').name, 'F');
}

// The MCP path: zod schema and tool JSON schema keep frameId and name, and a
// refused batch reaches the agent with the server's reason.
async function mcpBatchKeepsFrameFields() {
  const project = join(sandbox, 'project');
  fs.mkdirSync(join(project, '.git'), { recursive: true });
  const child = spawn(process.execPath, [join(dist, 'index.js')], {
    cwd: project,
    env: { ...process.env, HOME: sandbox, LOG_LEVEL: 'error', PORT: '' },
    stdio: ['pipe', 'pipe', 'ignore']
  });
  const pending = new Map();
  let nextId = 1;
  let buffer = '';
  child.stdout.on('data', chunk => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines.filter(l => l.trim())) {
      const message = JSON.parse(line);
      pending.get(message.id)?.(message);
      pending.delete(message.id);
    }
  });
  const request = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++;
    const timer = setTimeout(() => reject(new Error(`MCP ${method} timed out`)), 20000);
    pending.set(id, message => { clearTimeout(timer); resolve(message); });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
  const call = async (name, args) => {
    const response = await request('tools/call', { name, arguments: args });
    return { isError: response.result.isError === true, text: response.result.content.map(c => c.text ?? '').join('\n') };
  };
  try {
    await request('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'archdraw-frames-test', version: '0.0.0' } });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
    const started = await call('session_start', { projectPath: project });
    assert.equal(started.isError, false, started.text);

    const ok = await call('batch_create_elements', { elements: [
      { id: 'mf', type: 'frame', name: 'Checkout', x: 0, y: 0 },
      { id: 'm1', type: 'rectangle', x: 40, y: 40, width: 200, height: 60, frameId: 'mf', text: 'API' },
      { id: 'm2', type: 'rectangle', x: 320, y: 40, width: 200, height: 60, frameId: 'mf', text: 'DB' }
    ] });
    assert.equal(ok.isError, false, ok.text);
    const scene = JSON.parse(ok.text.slice(ok.text.indexOf('{'), ok.text.lastIndexOf('}') + 1));
    const byId = Object.fromEntries(scene.elements.map(el => [el.id, el]));
    assert.equal(byId.mf.name, 'Checkout');
    assert.equal(byId.m1.frameId, 'mf');
    assert.equal(byId.m2.frameId, 'mf');

    const bad = await call('batch_create_elements', { elements: [
      { id: 'm3', type: 'rectangle', x: 0, y: 200, width: 200, height: 60, frameId: 'no-such-frame' }
    ] });
    assert.equal(bad.isError, true);
    assert.match(bad.text, /no-such-frame/);

    const moved = await call('update_element', { id: 'm1', frameId: null });
    assert.equal(moved.isError, false, moved.text);
    assert.match(moved.text, /"frameId": null/);

    // link: a box that points at another drawing keeps "?element=<frame id>" through MCP
    const linked = await call('create_element', { id: 'm4', type: 'rectangle', x: 40, y: 200, width: 200, height: 60, frameId: 'mf', text: 'see Checkout', link: '?element=mf' });
    assert.equal(linked.isError, false, linked.text);
    assert.match(linked.text, /"link": "\?element=mf"/);
    const changed = await call('update_element', { id: 'm4', link: 'https://example.com' });
    assert.equal(changed.isError, false, changed.text);
    assert.match(changed.text, /"link": "https:\/\/example\.com"/);
    const unlinked = await call('update_element', { id: 'm4', link: null });
    assert.equal(unlinked.isError, false, unlinked.text);
    assert.match(unlinked.text, /"link": null/);
    const relinked = await call('batch_create_elements', { elements: [
      { id: 'm5', type: 'rectangle', x: 320, y: 200, width: 200, height: 60, frameId: 'mf', link: '?element=mf' }
    ] });
    assert.equal(relinked.isError, false, relinked.text);
    assert.match(relinked.text, /"link": "\?element=mf"/);
    await call('session_end', {});
  } finally {
    child.kill();
  }
}

const cases = [
  ['batch creates a named frame with children, sized from them', batchCreatesNamedFrameWithChildren],
  ['bad frameId is rejected with the id, nothing created', rejectsBadFrameIds],
  ['frame without size or children is rejected', rejectsEmptyFrame],
  ['frame grows for outside children only, with margin 40', growsOnlyWhenChildIsOutside],
  ['a child the user dragged out does not grow the frame on a sibling write', ignoresMemberDraggedOut],
  ['a text update grows the frame by the new text, not the old measurement', textUpdateGrowsByEstimate],
  ['server updates keep one label; delete announces labels before boxes', serverUpdatesKeepOneLabel],
  ['unmeasured text and arrow bends are estimated', estimatesUnmeasuredText],
  ['moving a frame carries children; resize stops at children range', frameMoveCarriesChildren],
  ['deleting a frame deletes its children, frame announced last', deletingFrameDeletesChildrenLast],
  ['describe groups by frame with counts, outside group last', describeGroupsByFrame],
  ['export label text follows its container frame', exportLabelFollowsContainerFrame],
  ['MCP batch keeps name and frameId; a refused batch names the bad id', mcpBatchKeepsFrameFields]
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
  console.error(`${failed} frame check(s) failed`);
  process.exit(1);
}
console.log('frame checks passed');
