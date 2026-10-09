#!/usr/bin/env node
// Export to any path the user names and load files back as copies (issue 06
// slices 6b, 6c; ADR-0007, ADR-0009). Drives the real build — `dist/bin.js`
// for the CLI, `dist/index.js` over stdio for MCP — and the canvas servers
// they spawn. HOME points at a sandbox. A WebSocket client stands in for the
// browser tab that renders images. POSIX only. An argument runs only the
// cases whose name contains it.

import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path, { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const binPath = join(repoRoot, 'dist', 'bin.js');
const mcpPath = join(repoRoot, 'dist', 'index.js');

const sandbox = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'archdraw-export-')));
const home = join(sandbox, 'home');
const sessionsDir = join(home, '.excalidraw-architect', 'sessions');

const repo = join(sandbox, 'repo');
const elsewhere = join(sandbox, 'elsewhere');
const outside = join(sandbox, 'outside');
for (const dir of [join(repo, '.git'), join(repo, 'src'), elsewhere, outside, home]) {
  fs.mkdirSync(dir, { recursive: true });
}

const baseEnv = { ...process.env, HOME: home, LOG_LEVEL: 'error' };
delete baseEnv.PORT;
delete baseEnv.EXCALIDRAW_EXPORT_DIR;

function cli(args, cwd = elsewhere) {
  const result = spawnSync(process.execPath, [binPath, ...args], { cwd, env: baseEnv, encoding: 'utf-8' });
  let json;
  try { json = JSON.parse(result.stdout); } catch { /* not JSON */ }
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, json };
}

function cliOk(args, cwd) {
  const result = cli(args, cwd);
  assert.equal(result.status, 0, `${args.join(' ')} failed (${result.status}): ${result.stderr}`);
  return result.json;
}

// For calls a fake tab in this process must answer while they run.
function cliAsync(args) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, [binPath, ...args], { cwd: elsewhere, env: baseEnv });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('close', status => {
      let json;
      try { json = JSON.parse(stdout); } catch { /* not JSON */ }
      resolve({ status, stdout, stderr, json });
    });
  });
}

const recordFiles = () => (fs.existsSync(sessionsDir) ? fs.readdirSync(sessionsDir).filter(f => f.endsWith('.json')) : []);

function endAll() {
  for (const file of recordFiles()) {
    try { process.kill(JSON.parse(fs.readFileSync(join(sessionsDir, file), 'utf-8')).pid, 'SIGKILL'); } catch { /* gone */ }
    fs.rmSync(join(sessionsDir, file), { force: true });
  }
}

const start = () => cliOk(['session', 'start', '--project', repo]).session;
const onCanvas = (key, args, cwd) => cliOk([...args, '--session', key], cwd);
const portOf = key => JSON.parse(fs.readFileSync(join(sessionsDir, `${key}.json`), 'utf-8')).port;

function addAll(key, elements) {
  const file = join(sandbox, `add-${Date.now()}-${Math.random()}.json`);
  fs.writeFileSync(file, JSON.stringify(elements));
  return onCanvas(key, ['add', file]);
}

const byId = (elements, id) => elements.find(el => el.id === id);
const readScene = file => JSON.parse(fs.readFileSync(file, 'utf-8'));

// One MCP stdio process, talking 2025-era JSON-RPC.
class McpClient {
  constructor() {
    this.child = spawn(process.execPath, [mcpPath], { cwd: elsewhere, env: baseEnv, stdio: ['pipe', 'pipe', 'pipe'] });
    this.nextId = 1;
    this.pending = new Map();
    let buffer = '';
    this.child.stdout.on('data', chunk => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines.filter(l => l.trim())) {
        const message = JSON.parse(line);
        this.pending.get(message.id)?.(message);
        this.pending.delete(message.id);
      }
    });
    this.child.stderr.on('data', () => {});
  }

  request(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`MCP ${method} timed out`)), 20000);
      this.pending.set(id, message => { clearTimeout(timer); resolve(message); });
      this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    });
  }

  async init() {
    await this.request('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'archdraw-export-test', version: '0.0.0' }
    });
    this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
    return this;
  }

  async start() {
    const started = await this.callOk('session_start', { projectPath: repo });
    return started.match(/canvas session ([0-9a-f]{6})/i)?.[1];
  }

  async call(name, args = {}) {
    const response = await this.request('tools/call', { name, arguments: args });
    assert.equal(response.error, undefined, `${name}: JSON-RPC error ${JSON.stringify(response.error)}`);
    return { isError: response.result.isError === true, text: response.result.content.map(c => c.text ?? '').join('\n') };
  }

  async callOk(name, args) {
    const result = await this.call(name, args);
    assert.equal(result.isError, false, `${name} failed: ${result.text}`);
    return result.text;
  }

  kill() {
    this.child.kill();
    return new Promise(resolve => this.child.once('exit', resolve));
  }
}

// Two drawings. A's box refers to B by link; an arrow in A is bound to a box in
// B; one unconfirmed required item in A is dashed.
const scene = [
  { id: 'fa', type: 'frame', name: 'Order flow', x: 0, y: 0, width: 600, height: 300 },
  { id: 'a1', type: 'rectangle', x: 40, y: 40, width: 200, height: 60, frameId: 'fa', text: 'Order API', link: '?element=fb' },
  { id: 'a2', type: 'rectangle', x: 320, y: 40, width: 200, height: 60, frameId: 'fa', text: 'Retry: unconfirmed', strokeStyle: 'dashed', customData: { required: 'unconfirmed' } },
  { id: 'ax', type: 'arrow', x: 240, y: 70, frameId: 'fa', startElementId: 'a1', endElementId: 'b1' },
  { id: 'fb', type: 'frame', name: 'Order internals', x: 800, y: 0, width: 400, height: 300 },
  { id: 'b1', type: 'rectangle', x: 840, y: 40, width: 200, height: 60, frameId: 'fb', text: 'Domain' }
];

// --- cases ---------------------------------------------------------------

async function cliExportsToAPathOutsideTheProjectAndMakesItsFolders() {
  const key = start();
  addAll(key, scene);
  const target = join(outside, 'new', 'deeper', 'order.excalidraw');
  const result = onCanvas(key, ['export', '--out', target]);

  assert.equal(result.file, target, 'the result has the full path written');
  const elements = readScene(target).elements;
  for (const id of ['fa', 'a1', 'fb', 'b1']) assert.ok(byId(elements, id), `the whole canvas: ${id}`);
  assert.equal(byId(elements, 'a2').strokeStyle, 'dashed', 'the unconfirmed item stays dashed');
  assert.deepEqual(byId(elements, 'a2').customData, { required: 'unconfirmed' });
}

async function cliRefusesAnExistingFileUntilForced() {
  const key = start();
  addAll(key, scene);
  const target = join(outside, 'dup.excalidraw');
  onCanvas(key, ['export', '--out', target]);
  const before = fs.readFileSync(target, 'utf-8');
  const createdAt = fs.statSync(target).mtime.toISOString();
  onCanvas(key, ['delete', 'b1']);

  const rejected = cli(['export', '--out', target, '--session', key]);
  assert.notEqual(rejected.status, 0, 'a second export to the same file fails');
  assert.match(rejected.stderr, /already exists/);
  assert.ok(rejected.stderr.includes(createdAt), `the error shows when it was made: ${rejected.stderr}`);
  assert.equal(fs.readFileSync(target, 'utf-8'), before, 'the existing file is untouched');

  const forced = onCanvas(key, ['export', '--out', target, '--force']);
  assert.equal(forced.file, target);
  assert.ok(!readScene(target).elements.some(el => el.id === 'b1'), '--force overwrites');
}

async function cliResolvesARelativePathFromItsCwd() {
  const key = start();
  addAll(key, scene);
  const result = onCanvas(key, ['export', '--out', 'notes/rel.excalidraw'], join(repo, 'src'));
  assert.equal(result.file, join(repo, 'src', 'notes', 'rel.excalidraw'), 'a folder in the project, not docs/architecture');
  assert.ok(fs.existsSync(result.file));
}

async function mcpExportsAnywhereRelativeToTheProjectRoot() {
  const mcp = await new McpClient().init();
  try {
    const key = await mcp.start();
    addAll(key, scene);

    const relative = await mcp.callOk('export_scene', { filePath: 'design/flows/order.excalidraw' });
    const inProject = join(repo, 'design', 'flows', 'order.excalidraw');
    assert.ok(relative.includes(inProject), `relative to the project root, not the MCP cwd: ${relative}`);
    assert.ok(fs.existsSync(inProject));

    const outsideFile = join(outside, 'mcp', 'order.excalidraw');
    const absolute = await mcp.callOk('export_scene', { filePath: outsideFile });
    assert.ok(absolute.includes(outsideFile), `an absolute path is kept: ${absolute}`);
    const before = fs.readFileSync(outsideFile, 'utf-8');

    const rejected = await mcp.call('export_scene', { filePath: outsideFile });
    assert.equal(rejected.isError, true, 'same file is refused over MCP too');
    assert.match(rejected.text, /already exists \(created \d{4}-/);
    assert.equal(fs.readFileSync(outsideFile, 'utf-8'), before);

    await mcp.callOk('export_scene', { filePath: outsideFile, force: true });
  } finally {
    await mcp.kill();
  }
}

async function mcpImportsFromAnywhereRelativeToTheProjectRoot() {
  const one = [{ id: 'solo', type: 'rectangle', x: 0, y: 0, width: 100, height: 50 }];
  const sceneJson = JSON.stringify({ type: 'excalidraw', version: 2, elements: one });
  fs.mkdirSync(join(repo, 'design'), { recursive: true });
  fs.writeFileSync(join(repo, 'design', 'in.excalidraw'), sceneJson);
  fs.writeFileSync(join(outside, 'in.excalidraw'), sceneJson);

  const mcp = await new McpClient().init();
  try {
    await mcp.start();
    const loaded = await mcp.callOk('import_scene', { filePath: 'design/in.excalidraw' });
    assert.match(loaded, /Unnamed frames, name them: \S+/, `the unnamed frame id is reported: ${loaded}`);
    await mcp.callOk('import_scene', { filePath: join(outside, 'in.excalidraw') });
    const replace = await mcp.call('import_scene', { filePath: join(outside, 'in.excalidraw'), mode: 'replace' });
    assert.equal(replace.isError, true, 'mode is gone; a caller still passing it is told so');
  } finally {
    await mcp.kill();
  }
}

// Answers image export requests the way a canvas tab does, with fixed bytes.
async function openFakeTab(key) {
  const port = portOf(key);
  const socket = new WebSocket(`ws://127.0.0.1:${port}/`);
  socket.on('message', raw => {
    const message = JSON.parse(raw.toString());
    if (message.type !== 'export_image_request') return;
    const data = message.format === 'svg' ? '<svg xmlns="http://www.w3.org/2000/svg"/>' : Buffer.from('fake png').toString('base64');
    fetch(`http://127.0.0.1:${port}/api/export/image/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: message.requestId, format: message.format, data })
    }).catch(() => {});
  });
  await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
  return socket;
}

async function cliScreenshotRefusesAnExistingFileUntilForced() {
  const key = start();
  addAll(key, scene);
  const tab = await openFakeTab(key);
  try {
    const target = join(outside, 'images', 'canvas.png');
    const first = await cliAsync(['screenshot', '--out', target, '--session', key]);
    assert.equal(first.status, 0, first.stderr);
    assert.equal(first.json.file, target, 'the parent folder is made and the full path returned');
    fs.writeFileSync(target, 'earlier');

    const rejected = await cliAsync(['screenshot', '--out', target, '--session', key]);
    assert.notEqual(rejected.status, 0);
    assert.match(rejected.stderr, /already exists \(created \d{4}-/);
    assert.equal(fs.readFileSync(target, 'utf-8'), 'earlier');

    const forced = await cliAsync(['screenshot', '--out', target, '--force', '--session', key]);
    assert.equal(forced.status, 0, forced.stderr);
    assert.equal(fs.readFileSync(target, 'utf-8'), 'fake png');
  } finally {
    tab.close();
  }
}

async function mcpImageRefusesAnExistingFileUntilForced() {
  const mcp = await new McpClient().init();
  try {
    const key = await mcp.start();
    addAll(key, scene);
    const tab = await openFakeTab(key);
    try {
      const saved = await mcp.callOk('export_to_image', { format: 'svg', filePath: 'images/canvas.svg' });
      const target = join(repo, 'images', 'canvas.svg');
      assert.ok(saved.includes(target), `relative to the project root: ${saved}`);
      fs.writeFileSync(target, 'earlier');

      const rejected = await mcp.call('export_to_image', { format: 'svg', filePath: target });
      assert.equal(rejected.isError, true);
      assert.match(rejected.text, /already exists \(created \d{4}-/);
      assert.equal(fs.readFileSync(target, 'utf-8'), 'earlier');

      await mcp.callOk('export_to_image', { format: 'svg', filePath: target, force: true });
      assert.match(fs.readFileSync(target, 'utf-8'), /<svg/);
    } finally {
      tab.close();
    }
  } finally {
    await mcp.kill();
  }
}

// Every id a file element points at must be in the file, or excalidraw.com
// may refuse to open it. `link` is not an id reference.
function assertSelfContained(elements) {
  const ids = new Set(elements.map(el => el.id));
  for (const el of elements) {
    for (const ref of [el.frameId, el.containerId, el.startBinding?.elementId, el.endBinding?.elementId]) {
      if (ref) assert.ok(ids.has(ref), `${el.id} points at ${ref}, which is not in the file`);
    }
    for (const bound of el.boundElements ?? []) {
      assert.ok(ids.has(bound.id), `${el.id} lists bound ${bound.id}, which is not in the file`);
    }
  }
}

async function cliExportsOneFrameByName() {
  const key = start();
  addAll(key, scene);
  const target = join(outside, 'frame-a.excalidraw');
  onCanvas(key, ['export', '--frame', 'Order flow', '--out', target]);
  const elements = readScene(target).elements;
  const ids = elements.map(el => el.id);

  for (const id of ['fa', 'a1', 'a2', 'ax']) assert.ok(ids.includes(id), `${id} is in A's file`);
  assert.ok(ids.includes('a1-label'), "A's labels come along");
  for (const id of ['fb', 'b1', 'b1-label']) assert.ok(!ids.includes(id), `${id} from B is not in the file`);
  assert.equal(byId(elements, 'ax').startBinding.elementId, 'a1', 'the binding inside A stays');
  assert.equal(byId(elements, 'ax').endBinding, null, 'the binding to B is cut');
  assert.equal(byId(elements, 'a1').link, '?element=fb', 'the excluded drawing reference stays');
  assert.equal(byId(elements, 'a2').strokeStyle, 'dashed', 'the unconfirmed item stays dashed');
  assert.deepEqual(byId(elements, 'a2').customData, { required: 'unconfirmed' });
  assertSelfContained(elements);

  onCanvas(key, ['export', '--frame', 'fb', '--out', join(outside, 'frame-b.excalidraw')]);
  const byFrameId = readScene(join(outside, 'frame-b.excalidraw')).elements.map(el => el.id);
  assert.deepEqual(byFrameId.filter(id => !id.endsWith('-label')).sort(), ['b1', 'fb'], 'a frame id works too');
}

async function frameExportRefusesAnAmbiguousOrUnknownFrame() {
  const key = start();
  addAll(key, [
    { id: 'd1', type: 'frame', name: 'Dup', x: 0, y: 0, width: 200, height: 200 },
    { id: 'd2', type: 'frame', name: 'Dup', x: 400, y: 0, width: 200, height: 200 }
  ]);
  const target = join(outside, 'dup-frame.excalidraw');
  const ambiguous = cli(['export', '--frame', 'Dup', '--out', target, '--session', key]);
  assert.notEqual(ambiguous.status, 0);
  assert.ok(ambiguous.stderr.includes('d1') && ambiguous.stderr.includes('d2'), `both ids are shown: ${ambiguous.stderr}`);
  assert.equal(fs.existsSync(target), false);

  const unknown = cli(['export', '--frame', 'Nope', '--out', target, '--session', key]);
  assert.notEqual(unknown.status, 0);
  assert.match(unknown.stderr, /Nope/);
}

// A label stored before issue 05 has a container but no frameId.
async function frameExportTakesLabelsWithTheirBox() {
  const key = start();
  const synced = [
    { id: 'sf', type: 'frame', name: 'Synced', x: 0, y: 0, width: 600, height: 200, frameId: null },
    { id: 's1', type: 'rectangle', x: 40, y: 40, width: 200, height: 60, frameId: 'sf', boundElements: [{ id: 's1t', type: 'text' }] },
    { id: 's1t', type: 'text', x: 60, y: 60, width: 160, height: 20, text: 'Box', originalText: 'Box', containerId: 's1', frameId: null, fontFamily: 6, fontSize: 16 },
    { id: 'loose', type: 'text', x: 900, y: 60, width: 160, height: 20, text: 'Outside', originalText: 'Outside', frameId: null, fontFamily: 6, fontSize: 16 }
  ];
  const response = await fetch(`http://127.0.0.1:${portOf(key)}/api/elements/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ elements: synced, timestamp: new Date().toISOString() })
  });
  assert.equal(response.status, 200);

  const target = join(outside, 'synced.excalidraw');
  onCanvas(key, ['export', '--frame', 'Synced', '--out', target]);
  const ids = readScene(target).elements.map(el => el.id).sort();
  assert.deepEqual(ids, ['s1', 's1t', 'sf']);
}

async function mcpExportsOneFrame() {
  const mcp = await new McpClient().init();
  try {
    const key = await mcp.start();
    addAll(key, scene);
    const target = join(outside, 'mcp-frame.excalidraw');
    await mcp.callOk('export_scene', { filePath: target, frame: 'Order flow' });
    const ids = readScene(target).elements.map(el => el.id);
    assert.ok(ids.includes('a1') && !ids.includes('b1'));

    addAll(key, [{ id: 'fa2', type: 'frame', name: 'Order flow', x: 0, y: 600, width: 200, height: 200 }]);
    const ambiguous = await mcp.call('export_scene', { filePath: join(outside, 'mcp-dup.excalidraw'), frame: 'Order flow' });
    assert.equal(ambiguous.isError, true);
    assert.ok(ambiguous.text.includes('fa') && ambiguous.text.includes('fa2'), `both ids are shown: ${ambiguous.text}`);
  } finally {
    await mcp.kill();
  }
}

async function writesOnlyDrawingFileTypes() {
  const key = start();
  addAll(key, scene);
  const text = join(outside, 'types', 'x.txt');
  const refused = cli(['export', '--out', text, '--force', '--session', key]);
  assert.notEqual(refused.status, 0, '.txt is refused even with --force');
  assert.match(refused.stderr, /\.excalidraw.*\.excalidraw\.md.*\.png.*\.svg/, `the allowed types are named: ${refused.stderr}`);
  assert.equal(fs.existsSync(text), false, 'no file is made');

  const md = onCanvas(key, ['export', '--out', join(outside, 'types', 'vault.excalidraw.md')]);
  assert.match(fs.readFileSync(md.file, 'utf-8'), /excalidraw-plugin/, '.excalidraw.md still exports');

  const mcp = await new McpClient().init();
  try {
    const mcpKey = await mcp.start();
    addAll(mcpKey, scene);
    const tab = await openFakeTab(mcpKey);
    try {
      const bmp = join(outside, 'types', 'canvas.bmp');
      const image = await mcp.call('export_to_image', { format: 'png', filePath: bmp, force: true });
      assert.equal(image.isError, true, '.bmp is refused even with force');
      assert.match(image.text, /\.png/);
      assert.equal(fs.existsSync(bmp), false);
      const txt = join(outside, 'types', 'scene.txt');
      fs.writeFileSync(txt, JSON.stringify({ type: 'excalidraw', elements: scene }));
      const load = await mcp.call('import_scene', { filePath: txt });
      assert.equal(load.isError, true, 'MCP import refuses .txt');
      assert.match(load.text, /\.json/);
    } finally {
      tab.close();
    }
  } finally {
    await mcp.kill();
  }

  const notes = join(outside, 'notes.txt');
  fs.writeFileSync(notes, JSON.stringify({ type: 'excalidraw', elements: scene }));
  const readTxt = cli(['import', notes, '--session', key]);
  assert.notEqual(readTxt.status, 0, 'import refuses .txt');
  assert.match(readTxt.stderr, /\.excalidraw.*\.excalidraw\.md.*\.json/);
}

async function canvasElements(key) {
  const response = await fetch(`http://127.0.0.1:${portOf(key)}/api/elements`);
  return (await response.json()).elements;
}

async function importedFrameCopyLandsBesideTheOriginals() {
  const key = start();
  addAll(key, scene);
  const file = join(outside, 'copy-a.excalidraw');
  onCanvas(key, ['export', '--frame', 'Order flow', '--out', file]);
  const before = await canvasElements(key);

  const result = onCanvas(key, ['import', file]);
  const after = await canvasElements(key);

  for (const original of before) {
    assert.deepEqual(byId(after, original.id), original, `original ${original.id} is untouched`);
  }
  const copies = after.filter(el => !byId(before, el.id));
  assert.equal(copies.length, readScene(file).elements.length, 'every file element is copied under a new id');
  const frame = copies.find(el => el.type === 'frame');
  assert.equal(frame.name, 'Order flow (복사)');
  assert.deepEqual(result.frames, [{ id: frame.id, name: 'Order flow (복사)' }]);
  assert.deepEqual(result.unnamedFrames, []);

  assert.equal(frame.x, 1280, 'right of everything (B ends at 1200) with a gap of 80');
  assert.equal(frame.y, 0);
  const box = copies.find(el => el.link === '?element=fb');
  assert.equal(box.x - frame.x, 40, 'positions inside the drawing are kept');
  assert.equal(box.frameId, frame.id);
  const arrow = copies.find(el => el.type === 'arrow');
  assert.equal(arrow.frameId, frame.id);
  assert.equal(arrow.startBinding.elementId, box.id, 'the copied arrow is bound to the copied box');
  assert.equal(arrow.endBinding, null);
  assert.ok(box.boundElements.some(b => b.id === arrow.id), 'the copied box lists the copied arrow');
  const label = copies.find(el => el.containerId === box.id);
  assert.equal(label.text, 'Order API', 'the label follows its copied box');
  const dashed = copies.find(el => el.customData?.required === 'unconfirmed');
  assert.equal(dashed.strokeStyle, 'dashed', 'the unconfirmed item stays dashed');

  onCanvas(key, ['update', box.id, '--set', '{"backgroundColor":"#ffc9c9"}']);
  const recolored = await canvasElements(key);
  assert.equal(byId(recolored, box.id).backgroundColor, '#ffc9c9');
  assert.deepEqual(byId(recolored, 'a1'), byId(before, 'a1'), 'the original box keeps its colour');

  const replace = cli(['import', file, '--replace', '--session', key]);
  assert.equal(replace.status, 2, '--replace is a usage error');
  assert.equal((await canvasElements(key)).length, recolored.length, 'nothing was cleared');
}

function writeSceneFile(name, elements) {
  const file = join(outside, name);
  fs.writeFileSync(file, JSON.stringify({ type: 'excalidraw', version: 2, elements }));
  return file;
}

async function aFileWithoutFramesLandsInOneUnnamedFrameAtItsOwnCoordinates() {
  const key = start();
  const file = writeSceneFile('no-frames.excalidraw', [
    { id: 'p', type: 'rectangle', x: 300, y: 200, width: 100, height: 50 },
    { id: 'q', type: 'ellipse', x: 500, y: 260, width: 80, height: 80 }
  ]);
  const result = onCanvas(key, ['import', file]);
  const elements = await canvasElements(key);

  const frame = elements.find(el => el.type === 'frame');
  assert.equal(frame.name, null, 'the server names nothing');
  assert.deepEqual(result.unnamedFrames, [frame.id], 'the unnamed frame is reported');
  const shapes = elements.filter(el => el.type !== 'frame');
  assert.deepEqual(shapes.map(el => [el.x, el.y]).sort(), [[300, 200], [500, 260]], 'an empty canvas keeps file coordinates');
  for (const el of shapes) {
    assert.equal(el.frameId, frame.id, 'everything goes in the frame');
    assert.ok(!['p', 'q'].includes(el.id), 'ids are new');
  }
  assert.ok(frame.x <= 300 && frame.x + frame.width >= 580, 'the frame holds its children');
}

async function mixedFramesAndLooseElementsComeInAsTheyAre() {
  const key = start();
  const file = writeSceneFile('mixed.excalidraw', [
    { id: 'n', type: 'frame', name: 'Named', x: 0, y: 0, width: 200, height: 200 },
    { id: 'n1', type: 'rectangle', x: 40, y: 40, width: 100, height: 50, frameId: 'n' },
    { id: 'u', type: 'frame', name: null, x: 400, y: 0, width: 200, height: 200 },
    { id: 'u1', type: 'rectangle', x: 440, y: 40, width: 100, height: 50, frameId: 'u' },
    { id: 'memo', type: 'rectangle', x: 700, y: 40, width: 100, height: 50 }
  ]);
  const first = onCanvas(key, ['import', file]);
  assert.deepEqual(first.frames.map(f => f.name).sort((a, b) => String(a).localeCompare(String(b))), ['Named (복사)', null]);
  assert.equal(first.unnamedFrames.length, 1);
  const elements = await canvasElements(key);
  const memo = elements.find(el => el.x === 700);
  assert.equal(memo.frameId ?? null, null, 'a loose element stays loose');
  assert.equal(elements.filter(el => el.type === 'frame').length, 2, 'no extra frame is added');

  const second = onCanvas(key, ['import', file]);
  const frames = (await canvasElements(key)).filter(el => el.type === 'frame');
  assert.equal(frames.filter(el => el.name === 'Named (복사)').length, 2, 'importing twice is not refused');
  const secondNamed = second.frames.find(f => f.name === 'Named (복사)');
  assert.equal(byId(frames, secondNamed.id).x, 880, 'right of the first copy (ends at 800) with a gap of 80');
}

// A and C both refer to B as an inner drawing.
const sharedInner = [
  { id: 'ra', type: 'frame', name: 'A', x: 0, y: 0, width: 300, height: 200 },
  { id: 'ra1', type: 'rectangle', x: 40, y: 40, width: 200, height: 60, frameId: 'ra', text: 'A box', link: '?element=rb' },
  { id: 'rc', type: 'frame', name: 'C', x: 0, y: 400, width: 300, height: 200 },
  { id: 'rc1', type: 'rectangle', x: 40, y: 440, width: 200, height: 60, frameId: 'rc', text: 'C box', link: '?element=rb' },
  { id: 'rb', type: 'frame', name: 'B', x: 500, y: 100, width: 300, height: 200 },
  { id: 'rb1', type: 'rectangle', x: 540, y: 140, width: 200, height: 60, frameId: 'rb', text: 'B box' }
];

const frameNamed = (elements, name) => elements.find(el => el.type === 'frame' && el.name === name);
const boxIn = (elements, frame) => elements.find(el => el.type === 'rectangle' && el.frameId === frame.id);

async function wholeCanvasRoundTripKeepsLayoutAndRemapsSharedReferences() {
  const from = start();
  addAll(from, sharedInner);
  const file = join(outside, 'whole.excalidraw');
  onCanvas(from, ['export', '--out', file]);

  const to = start();
  onCanvas(to, ['import', file]);
  const elements = await canvasElements(to);
  const [a, b, c] = ['A (복사)', 'B (복사)', 'C (복사)'].map(name => frameNamed(elements, name));
  assert.ok(a && b && c, 'all three drawings are in one file');
  assert.deepEqual([b.x - a.x, b.y - a.y, c.x - a.x, c.y - a.y], [500, 100, 0, 400], 'their layout is kept');
  assert.equal(boxIn(elements, a).link, `?element=${b.id}`, "A's reference points at the new B");
  assert.equal(boxIn(elements, c).link, `?element=${b.id}`, 'C refers to the same new B');

  onCanvas(from, ['import', file]);
  const both = await canvasElements(from);
  const copyA = frameNamed(both, 'A (복사)');
  const copyB = frameNamed(both, 'B (복사)');
  assert.equal(boxIn(both, copyA).link, `?element=${copyB.id}`, 'with the originals there, the copy still points at the copied B');
  assert.equal(byId(both, 'ra1').link, '?element=rb', 'the original keeps pointing at the original');
}

async function anExcludedReferenceAttachesToNothingAfterImport() {
  const from = start();
  addAll(from, sharedInner);
  const file = join(outside, 'only-a.excalidraw');
  onCanvas(from, ['export', '--frame', 'A', '--out', file]);

  const to = start();
  addAll(to, [{ id: 'otherb', type: 'frame', name: 'B', x: 0, y: 0, width: 200, height: 200 }]);
  onCanvas(to, ['import', file]);
  const elements = await canvasElements(to);
  const link = boxIn(elements, frameNamed(elements, 'A (복사)')).link;
  assert.equal(link, '?element=rb', 'the excluded reference stays as it was');
  assert.ok(!link.includes('otherb'), 'it does not attach to the B with the same name');
}

async function cornersAreSavedAsTheCanvasDrawsThem() {
  const from = start();
  addAll(from, [
    { id: 'cf', type: 'frame', name: 'Corners', x: 0, y: 0, width: 600, height: 200 },
    { id: 'square', type: 'rectangle', x: 40, y: 40, width: 200, height: 60, frameId: 'cf' },
    { id: 'round', type: 'rectangle', x: 320, y: 40, width: 200, height: 60, frameId: 'cf', roundness: { type: 3 } }
  ]);
  const file = join(outside, 'corners.excalidraw');
  onCanvas(from, ['export', '--out', file]);
  const saved = readScene(file).elements;
  assert.equal(byId(saved, 'square').roundness, null, 'a box without corners stays square in the file');
  assert.deepEqual(byId(saved, 'round').roundness, { type: 3 }, 'a rounded box keeps its corners');

  const to = start();
  onCanvas(to, ['import', file]);
  const boxes = (await canvasElements(to)).filter(el => el.type === 'rectangle').sort((a, b) => a.x - b.x);
  assert.equal(boxes[0].roundness ?? null, null, 'the square copy is square');
  assert.deepEqual(boxes[1].roundness, { type: 3 }, 'the rounded copy is rounded');
}

const cases = [
  cliExportsToAPathOutsideTheProjectAndMakesItsFolders,
  cliRefusesAnExistingFileUntilForced,
  cliResolvesARelativePathFromItsCwd,
  mcpExportsAnywhereRelativeToTheProjectRoot,
  mcpImportsFromAnywhereRelativeToTheProjectRoot,
  cliScreenshotRefusesAnExistingFileUntilForced,
  mcpImageRefusesAnExistingFileUntilForced,
  cliExportsOneFrameByName,
  frameExportRefusesAnAmbiguousOrUnknownFrame,
  frameExportTakesLabelsWithTheirBox,
  mcpExportsOneFrame,
  writesOnlyDrawingFileTypes,
  importedFrameCopyLandsBesideTheOriginals,
  aFileWithoutFramesLandsInOneUnnamedFrameAtItsOwnCoordinates,
  mixedFramesAndLooseElementsComeInAsTheyAre,
  wholeCanvasRoundTripKeepsLayoutAndRemapsSharedReferences,
  anExcludedReferenceAttachesToNothingAfterImport,
  cornersAreSavedAsTheCanvasDrawsThem
];

let failed = 0;
try {
  for (const fn of cases.filter(c => !process.argv[2] || c.name.includes(process.argv[2]))) {
    try {
      await fn();
      console.log(`  ok  ${fn.name}`);
    } catch (error) {
      failed++;
      console.error(`  FAIL ${fn.name}\n${error.stack}`);
    } finally {
      endAll();
    }
  }
} finally {
  endAll();
  fs.rmSync(sandbox, { recursive: true, force: true });
}

if (failed) {
  console.error(`export: ${failed} of ${cases.length} cases failed`);
  process.exit(1);
}
console.log(`export: all ${cases.length} cases passed`);
