#!/usr/bin/env node
// The canvas server answers only its own page and non-browser callers (issue 11).
// Drives the real build: canvas servers come from `dist/bin.js session start`,
// requests go out over node:http and ws so Host and Origin can be set freely.
// HOME points at a sandbox. POSIX only, like check-snapshots.

import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path, { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const binPath = join(repoRoot, 'dist', 'bin.js');

const sandbox = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'archdraw-origin-')));
const home = join(sandbox, 'home');
const dataDir = join(home, '.excalidraw-architect');
const sessionsDir = join(dataDir, 'sessions');
const snapshotsDir = join(dataDir, 'snapshots');
const repo = join(sandbox, 'repo');
for (const dir of [join(repo, '.git'), home]) {
  fs.mkdirSync(dir, { recursive: true });
}

const baseEnv = { ...process.env, HOME: home, LOG_LEVEL: 'error' };
delete baseEnv.PORT;
delete baseEnv.HOST;

const EVIL = 'https://evil.example';

function cliOk(args) {
  const result = spawnSync(process.execPath, [binPath, ...args], { cwd: sandbox, env: baseEnv, encoding: 'utf-8' });
  assert.equal(result.status, 0, `${args.join(' ')} failed (${result.status}): ${result.stderr}`);
  return JSON.parse(result.stdout);
}

const recordFiles = () => (fs.existsSync(sessionsDir) ? fs.readdirSync(sessionsDir).filter(f => f.endsWith('.json')) : []);
const readRecord = file => JSON.parse(fs.readFileSync(join(sessionsDir, file), 'utf-8'));

function endAll() {
  for (const file of recordFiles()) {
    try { process.kill(readRecord(file).pid, 'SIGKILL'); } catch { /* gone */ }
    fs.rmSync(join(sessionsDir, file), { force: true });
  }
}

function startCanvas() {
  const { url } = cliOk(['session', 'start', '--project', repo]);
  return Number(new URL(url).port);
}

function request(port, method, urlPath, { headers = {}, body } = {}) {
  const payload = body === undefined ? undefined : JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: '127.0.0.1',
      port,
      method,
      path: urlPath,
      headers: {
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...headers
      }
    }, res => {
      let text = '';
      res.on('data', chunk => { text += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, text }));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const snapshotFiles = () => (fs.existsSync(snapshotsDir) ? fs.readdirSync(snapshotsDir, { recursive: true }).map(String) : []);

async function foreignSiteCannotWriteOrRead() {
  const port = startCanvas();
  const headers = { Origin: EVIL };

  const saved = await request(port, 'POST', '/api/snapshots', { headers, body: { name: 'evil' } });
  assert.equal(saved.status, 403, 'POST /api/snapshots from a foreign origin');
  assert.ok(!snapshotFiles().some(f => f.includes('evil')), `no snapshot file is written: ${snapshotFiles()}`);

  assert.equal((await request(port, 'GET', '/api/snapshots', { headers })).status, 403, 'GET /api/snapshots');
  assert.equal((await request(port, 'GET', '/api/elements', { headers })).status, 403, 'GET /api/elements');
}

// Resolves 'open' or 'rejected <status>'.
function openSocket(port, headers = {}) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`ws://127.0.0.1:${port}`, { headers });
    socket.on('open', () => { socket.close(); resolve('open'); });
    socket.on('unexpected-response', (_req, res) => { socket.terminate(); resolve(`rejected ${res.statusCode}`); });
    socket.on('error', reject);
  });
}

async function foreignSiteCannotOpenASocket() {
  const port = startCanvas();
  assert.equal(await openSocket(port, { Origin: EVIL }), 'rejected 403');
}

async function nullOriginIsRejected() {
  const port = startCanvas();
  const saved = await request(port, 'POST', '/api/snapshots', { headers: { Origin: 'null' }, body: { name: 'sandboxed' } });
  assert.equal(saved.status, 403);
}

async function callersWithoutOriginWorkAsBefore() {
  const port = startCanvas();
  const saved = await request(port, 'POST', '/api/snapshots', { body: { name: 'from-cli' } });
  assert.equal(saved.status, 200, saved.text);
  assert.ok(snapshotFiles().some(f => f.endsWith('from-cli.excalidraw')), `snapshot file is written: ${snapshotFiles()}`);
  assert.equal((await request(port, 'GET', '/api/snapshots')).status, 200);
  assert.equal((await request(port, 'GET', '/api/elements')).status, 200);
  assert.equal(await openSocket(port), 'open');
}

async function ownPageOriginsPass() {
  const port = startCanvas();
  for (const host of ['localhost', '127.0.0.1', '[::1]']) {
    const origin = `http://${host}:${port}`;
    const saved = await request(port, 'POST', '/api/snapshots', { headers: { Origin: origin }, body: { name: `page-${host.replace(/\W/g, '')}` } });
    assert.equal(saved.status, 200, `${origin}: ${saved.text}`);
    assert.equal(await openSocket(port, { Origin: origin }), 'open', origin);
  }
}

async function anotherCanvasSessionIsRejected() {
  const port = startCanvas();
  const otherPort = startCanvas();
  const headers = { Origin: `http://localhost:${otherPort}` };
  assert.equal((await request(port, 'POST', '/api/snapshots', { headers, body: { name: 'other-session' } })).status, 403);
  assert.equal(await openSocket(port, headers), 'rejected 403');
}

async function reboundDomainCannotRead() {
  const port = startCanvas();
  const read = await request(port, 'GET', '/api/elements', { headers: { Host: `evil.example:${port}` } });
  assert.equal(read.status, 403);
  assert.equal(await openSocket(port, { Host: `evil.example:${port}` }), 'rejected 403');
}

// `session start` always binds 127.0.0.1, so start the server directly on another host.
async function startCanvasOn(host) {
  spawn(process.execPath, [join(repoRoot, 'dist', 'server.js')], {
    env: { ...baseEnv, HOST: host, PORT: '0', ARCHDRAW_PROJECT_ROOT: repo },
    stdio: 'ignore'
  }).unref();
  for (let i = 0; i < 50; i++) {
    const [file] = recordFiles();
    if (file) return readRecord(file).port;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`canvas server on ${host} did not start`);
}

async function bindHostOriginPasses() {
  const port = await startCanvasOn('0.0.0.0');
  const headers = { Host: `0.0.0.0:${port}`, Origin: `http://0.0.0.0:${port}` };
  const saved = await request(port, 'POST', '/api/snapshots', { headers, body: { name: 'bind-host' } });
  assert.equal(saved.status, 200, saved.text);
  assert.equal(await openSocket(port, headers), 'open');
}

const cases = [
  reboundDomainCannotRead,
  bindHostOriginPasses,
  foreignSiteCannotWriteOrRead,
  foreignSiteCannotOpenASocket,
  nullOriginIsRejected,
  callersWithoutOriginWorkAsBefore,
  ownPageOriginsPass,
  anotherCanvasSessionIsRejected
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
  console.error(`origin: ${failed} of ${cases.length} cases failed`);
  process.exit(1);
}
console.log(`origin: all ${cases.length} cases passed`);
