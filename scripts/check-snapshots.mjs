#!/usr/bin/env node
// Snapshots on disk per project (issue 06, ADR-0009). Drives the real build —
// `dist/bin.js` for the CLI, `dist/index.js` over stdio for MCP — and the
// canvas servers they spawn. HOME points at a sandbox, so snapshots land in
// <sandbox>/home/.excalidraw-architect/snapshots. POSIX only, like check-data-dir.

import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path, { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const binPath = join(repoRoot, 'dist', 'bin.js');
const mcpPath = join(repoRoot, 'dist', 'index.js');

const sandbox = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'archdraw-snapshots-')));
const home = join(sandbox, 'home');
const dataDir = join(home, '.excalidraw-architect');
const sessionsDir = join(dataDir, 'sessions');
const snapshotsDir = join(dataDir, 'snapshots');

const repoA = join(sandbox, 'repo-a');
const repoB = join(sandbox, 'repo-b');
const otherRepoA = join(sandbox, 'other', 'repo-a'); // same folder name as repoA, different path
const elsewhere = join(sandbox, 'elsewhere');
for (const dir of [join(repoA, '.git'), join(repoB, '.git'), join(otherRepoA, '.git'), elsewhere, home]) {
  fs.mkdirSync(dir, { recursive: true });
}

const baseEnv = { ...process.env, HOME: home, LOG_LEVEL: 'error' };
delete baseEnv.PORT;

function cli(args) {
  const result = spawnSync(process.execPath, [binPath, ...args], {
    cwd: elsewhere,
    env: baseEnv,
    encoding: 'utf-8'
  });
  let json;
  try { json = JSON.parse(result.stdout); } catch { /* not JSON */ }
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, json };
}

function cliOk(args) {
  const result = cli(args);
  assert.equal(result.status, 0, `${args.join(' ')} failed (${result.status}): ${result.stderr}`);
  return result.json;
}

const recordFiles = () => (fs.existsSync(sessionsDir) ? fs.readdirSync(sessionsDir).filter(f => f.endsWith('.json')) : []);

function endAll() {
  for (const file of recordFiles()) {
    try { process.kill(JSON.parse(fs.readFileSync(join(sessionsDir, file), 'utf-8')).pid, 'SIGKILL'); } catch { /* gone */ }
    fs.rmSync(join(sessionsDir, file), { force: true });
  }
}

const start = project => cliOk(['session', 'start', '--project', project]).session;
const end = key => cliOk(['session', 'end', key]);
const onCanvas = (key, args) => cliOk([...args, '--session', key]);

function addAll(key, elements) {
  const file = join(sandbox, `add-${Date.now()}-${Math.random()}.json`);
  fs.writeFileSync(file, JSON.stringify(elements));
  return onCanvas(key, ['add', file]);
}

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
      clientInfo: { name: 'archdraw-snapshot-test', version: '0.0.0' }
    });
    this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
    return this;
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

const byId = (elements, id) => elements.find(el => el.id === id);

// Two drawings: A's box refers to B, and one unconfirmed required item is dashed.
const scene = [
  { id: 'fa', type: 'frame', name: 'Order flow', x: 0, y: 0, width: 600, height: 300 },
  { id: 'a1', type: 'rectangle', x: 40, y: 40, width: 200, height: 60, frameId: 'fa', text: 'Order API', link: '?element=fb' },
  { id: 'a2', type: 'rectangle', x: 320, y: 40, width: 200, height: 60, frameId: 'fa', text: 'Retry: unconfirmed', strokeStyle: 'dashed', customData: { required: 'unconfirmed' } },
  { id: 'fb', type: 'frame', name: 'Order internals', x: 800, y: 0, width: 400, height: 300 },
  { id: 'b1', type: 'rectangle', x: 840, y: 40, width: 200, height: 60, frameId: 'fb', text: 'Domain' }
];

// --- cases ---------------------------------------------------------------

async function snapshotSurvivesServerRestart() {
  const first = start(repoA);
  addAll(first, scene);
  onCanvas(first, ['snapshot', 'save', 'x']);
  end(first);

  const second = start(repoA);
  const restored = onCanvas(second, ['snapshot', 'restore', 'x']);
  assert.equal(restored.restored, scene.length);

  const after = onCanvas(second, ['query']);
  assert.deepEqual(after.map(el => el.id).sort(), scene.map(el => el.id).sort(), 'the same drawings come back');
  assert.equal(byId(after, 'fa').name, 'Order flow');
  assert.equal(byId(after, 'a1').frameId, 'fa');
  assert.equal(byId(after, 'a1').link, '?element=fb', 'the drawing reference still points at B');
  assert.equal(byId(after, 'a2').strokeStyle, 'dashed', 'the unconfirmed item stays dashed');
  assert.deepEqual(byId(after, 'a2').customData, { required: 'unconfirmed' });
  end(second);
}

async function saveCreatesDataFolderAndReportsPath() {
  fs.rmSync(dataDir, { recursive: true, force: true });
  const key = start(repoA);
  addAll(key, scene);
  const name = '2026-09-16_053012Z_order-flow';
  const saved = onCanvas(key, ['snapshot', 'save', name]);

  assert.equal(saved.name, name, 'the given name is used as is');
  assert.ok(path.isAbsolute(saved.path), `full path: ${saved.path}`);
  assert.equal(path.dirname(path.dirname(saved.path)), snapshotsDir, 'under snapshots/<project id>/');
  assert.match(path.basename(path.dirname(saved.path)), /^repo-a-[0-9a-f]{8}$/, 'the project folder is readable: <folder name>-<hash>');
  assert.equal(path.basename(saved.path), `${name}.excalidraw`);
  assert.ok(fs.existsSync(saved.path), 'the file is on disk');
  assert.equal(JSON.parse(fs.readFileSync(saved.path, 'utf-8')).elements.length, scene.length);

  const listed = onCanvas(key, ['snapshot', 'list']);
  assert.deepEqual(listed.map(s => s.name), [name]);
  assert.equal(listed[0].path, saved.path);
  assert.equal(listed[0].elementCount, scene.length);
  assert.ok(listed[0].createdAt, 'list shows when it was made');
}

async function eachProjectSeesOnlyItsOwnSnapshots() {
  const inA = start(repoA);
  const inB = start(repoB);
  addAll(inA, scene);
  addAll(inB, [{ id: 'only-b', type: 'rectangle', x: 0, y: 0, width: 100, height: 50 }]);
  const savedA = onCanvas(inA, ['snapshot', 'save', 'same']);
  const savedB = onCanvas(inB, ['snapshot', 'save', 'same']);

  assert.notEqual(path.dirname(savedA.path), path.dirname(savedB.path), 'two projects, two folders');
  assert.ok(onCanvas(inA, ['snapshot', 'list']).every(s => path.dirname(s.path) === path.dirname(savedA.path)), 'A lists only its folder');
  assert.deepEqual(onCanvas(inB, ['snapshot', 'list']).map(s => s.path), [savedB.path], 'B lists only its own');

  const inOtherA = start(otherRepoA);
  addAll(inOtherA, scene);
  const savedOtherA = onCanvas(inOtherA, ['snapshot', 'save', 'same']);
  assert.notEqual(path.dirname(savedOtherA.path), path.dirname(savedA.path), 'same folder name, different path: the hash keeps them apart');
  assert.match(path.basename(path.dirname(savedOtherA.path)), /^repo-a-[0-9a-f]{8}$/);
}

async function restoringAMissingNameFailsAndKeepsTheCanvas() {
  const key = start(repoA);
  addAll(key, scene);
  const result = cli(['snapshot', 'restore', 'no-such-snapshot', '--session', key]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /"no-such-snapshot" not found/);
  assert.equal(onCanvas(key, ['query']).length, scene.length, 'the canvas is untouched');
}

async function sessionsOfOneProjectShareSnapshots() {
  const first = start(repoA);
  const second = start(repoA);
  addAll(first, scene);
  onCanvas(first, ['snapshot', 'save', 'shared']);

  assert.ok(onCanvas(second, ['snapshot', 'list']).some(s => s.name === 'shared'), 'the other session lists it');
  onCanvas(second, ['snapshot', 'restore', 'shared']);
  assert.equal(onCanvas(second, ['query']).length, scene.length, 'the other session restores it');
}

async function sameNameIsRejectedUntilForced() {
  const key = start(repoA);
  addAll(key, scene);
  const saved = onCanvas(key, ['snapshot', 'save', 'dup']);
  const before = fs.readFileSync(saved.path, 'utf-8');
  onCanvas(key, ['delete', 'b1']);

  const rejected = cli(['snapshot', 'save', 'dup', '--session', key]);
  assert.notEqual(rejected.status, 0, 'a second save under the same name fails');
  assert.match(rejected.stderr, /already exists/);
  assert.ok(rejected.stderr.includes(saved.createdAt), `the error shows when it was made: ${rejected.stderr}`);
  assert.equal(fs.readFileSync(saved.path, 'utf-8'), before, 'the existing file is untouched');

  const forced = onCanvas(key, ['snapshot', 'save', 'dup', '--force']);
  assert.equal(forced.path, saved.path);
  assert.equal(forced.elements, scene.length - 1, '--force overwrites');
}

async function snapshotNameCannotLeaveTheFolder() {
  const key = start(repoA);
  addAll(key, scene);
  for (const name of ['../escape', 'a/b', '..']) {
    const result = cli(['snapshot', 'save', name, '--session', key]);
    assert.notEqual(result.status, 0, `"${name}" is refused`);
    assert.match(result.stderr, /Invalid snapshot name/);
  }
  assert.equal(fs.existsSync(join(snapshotsDir, 'escape.excalidraw')), false);
}

async function brokenSnapshotFileDoesNotHideTheOthers() {
  const key = start(repoA);
  addAll(key, scene);
  const good = onCanvas(key, ['snapshot', 'save', 'good']);
  const brokenFile = join(dirname(good.path), 'broken.excalidraw');
  fs.writeFileSync(brokenFile, '{ not json');
  const listed = onCanvas(key, ['snapshot', 'list']);
  const restored = cli(['snapshot', 'restore', 'broken', '--session', key]);
  fs.rmSync(brokenFile);

  const broken = listed.find(s => s.name === 'broken');
  assert.ok(broken, 'the broken file is listed');
  assert.ok(listed.find(s => s.name === 'good'), 'the good file is listed');
  assert.ok(broken.error, 'the broken one says why it cannot be read');
  assert.equal(listed.find(s => s.name === 'good').error, undefined);
  assert.equal(listed.find(s => s.name === 'good').elementCount, scene.length);
  assert.notEqual(restored.status, 0, 'restoring the broken one fails');
  assert.equal(onCanvas(key, ['query']).length, scene.length, 'and leaves the canvas alone');
}

// After a browser edit the server holds real Excalidraw elements: labels are
// separate text with containerId, arrows carry startBinding/endBinding.
async function syncedSceneSurvivesServerRestart() {
  const synced = [
    { id: 'sf', type: 'frame', name: 'Synced', x: 0, y: 0, width: 600, height: 200, frameId: null },
    { id: 's1', type: 'rectangle', x: 40, y: 40, width: 200, height: 60, frameId: 'sf', link: '?element=sf', boundElements: [{ id: 's1t', type: 'text' }, { id: 'sa', type: 'arrow' }] },
    { id: 's1t', type: 'text', x: 60, y: 60, width: 160, height: 20, text: 'Box', originalText: 'Box', containerId: 's1', frameId: 'sf', fontFamily: 6, fontSize: 16 },
    { id: 's2', type: 'rectangle', x: 340, y: 40, width: 200, height: 60, frameId: 'sf', strokeStyle: 'dashed', boundElements: [{ id: 'sa', type: 'arrow' }] },
    { id: 'sa', type: 'arrow', x: 240, y: 70, width: 100, height: 0, points: [[0, 0], [100, 0]], frameId: 'sf', startBinding: { elementId: 's1', focus: 0, gap: 1 }, endBinding: { elementId: 's2', focus: 0, gap: 1 } }
  ];
  const first = start(repoA);
  const { port } = JSON.parse(fs.readFileSync(join(sessionsDir, `${first}.json`), 'utf-8'));
  const response = await fetch(`http://127.0.0.1:${port}/api/elements/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ elements: synced, timestamp: new Date().toISOString() })
  });
  assert.equal(response.status, 200);
  onCanvas(first, ['snapshot', 'save', 'synced']);
  end(first);

  const second = start(repoA);
  onCanvas(second, ['snapshot', 'restore', 'synced']);
  const after = onCanvas(second, ['query']);
  assert.deepEqual(after.map(el => el.id).sort(), synced.map(el => el.id).sort());
  assert.equal(byId(after, 's1t').containerId, 's1', 'the label stays on its box');
  assert.equal(byId(after, 's1t').frameId, 'sf');
  assert.equal(byId(after, 'sa').startBinding.elementId, 's1', 'the arrow stays bound');
  assert.equal(byId(after, 'sa').endBinding.elementId, 's2');
  assert.equal(byId(after, 's2').strokeStyle, 'dashed');
  assert.equal(byId(after, 's1').link, '?element=sf');
}

async function mcpSavesWithPathAndForce() {
  const mcp = await new McpClient().init();
  try {
    const started = await mcp.callOk('session_start', { projectPath: repoA });
    const key = started.match(/canvas session ([0-9a-f]{6})/i)?.[1];
    addAll(key, scene);

    const saved = await mcp.callOk('snapshot_scene', { name: 'via-mcp' });
    const file = join(dirname(onCanvas(key, ['snapshot', 'list']).find(s => s.name === 'via-mcp').path), 'via-mcp.excalidraw');
    assert.ok(saved.includes(file), `the result has the full path: ${saved}`);

    const rejected = await mcp.call('snapshot_scene', { name: 'via-mcp' });
    assert.equal(rejected.isError, true, 'same name is refused over MCP too');
    assert.match(rejected.text, /already exists \(created \d{4}-/);

    await mcp.callOk('snapshot_scene', { name: 'via-mcp', force: true });
    await mcp.callOk('restore_snapshot', { name: 'via-mcp' });
    assert.equal(onCanvas(key, ['query']).length, scene.length);
  } finally {
    await mcp.kill();
  }
}

const cases = [
  snapshotSurvivesServerRestart,
  saveCreatesDataFolderAndReportsPath,
  eachProjectSeesOnlyItsOwnSnapshots,
  sessionsOfOneProjectShareSnapshots,
  restoringAMissingNameFailsAndKeepsTheCanvas,
  sameNameIsRejectedUntilForced,
  snapshotNameCannotLeaveTheFolder,
  brokenSnapshotFileDoesNotHideTheOthers,
  syncedSceneSurvivesServerRestart,
  mcpSavesWithPathAndForce
];

let failed = 0;
try {
  for (const fn of cases) {
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
  console.error(`snapshots: ${failed} of ${cases.length} cases failed`);
  process.exit(1);
}
console.log(`snapshots: all ${cases.length} cases passed`);
