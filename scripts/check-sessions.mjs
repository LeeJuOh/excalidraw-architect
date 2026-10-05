#!/usr/bin/env node
// Canvas sessions end to end (issue 04, ADR-0003). Every case drives the real
// build — `dist/bin.js` for the CLI, `dist/index.js` over stdio for MCP — and
// the canvas servers they spawn. HOME points at a sandbox, so session records
// land in <sandbox>/home/.excalidraw-architect/sessions and nothing touches the
// user's own canvases. POSIX only, like check-data-dir.

import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path, { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import WebSocket from 'ws';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const binPath = join(repoRoot, 'dist', 'bin.js');
const mcpPath = join(repoRoot, 'dist', 'index.js');

const sandbox = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'archdraw-sessions-')));
const home = join(sandbox, 'home');
const sessionsDir = join(home, '.excalidraw-architect', 'sessions');

// Fixture folders: a clone, a worktree (its .git is a file), a plain folder,
// and an unrelated folder to run from so results cannot come from the cwd.
const repo = join(sandbox, 'repo');
const repoSub = join(repo, 'src', 'deep');
const worktree = join(sandbox, 'worktree');
const worktreeSub = join(worktree, 'pkg');
const plain = join(sandbox, 'plain', 'notes');
const elsewhere = join(sandbox, 'elsewhere');
for (const dir of [join(repo, '.git'), repoSub, worktreeSub, plain, elsewhere, home]) {
  fs.mkdirSync(dir, { recursive: true });
}
fs.writeFileSync(join(worktree, '.git'), 'gitdir: /somewhere/.git/worktrees/worktree\n');

const baseEnv = { ...process.env, HOME: home, LOG_LEVEL: 'error' };
delete baseEnv.PORT;

function cli(args, { env = {}, cwd = elsewhere } = {}) {
  const result = spawnSync(process.execPath, [binPath, ...args], {
    cwd,
    env: { ...baseEnv, ...env },
    encoding: 'utf-8'
  });
  let json;
  try { json = JSON.parse(result.stdout); } catch { /* not JSON */ }
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, json };
}

function cliOk(args, options) {
  const result = cli(args, options);
  assert.equal(result.status, 0, `${args.join(' ')} failed (${result.status}): ${result.stderr}`);
  return result.json;
}

const recordFiles = () => (fs.existsSync(sessionsDir) ? fs.readdirSync(sessionsDir).filter(f => f.endsWith('.json')) : []);
const readRecord = key => JSON.parse(fs.readFileSync(join(sessionsDir, `${key}.json`), 'utf-8'));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function alive(pid) {
  try { process.kill(pid, 0); return true; } catch { return false; }
}

async function responds(url) {
  try {
    const response = await fetch(`${url}/health`, { signal: AbortSignal.timeout(1000) });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitFor(condition, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await condition()) return;
    await sleep(100);
  }
  throw new Error(`Timed out after ${timeoutMs}ms: ${label}`);
}

async function elementCount(url) {
  const response = await fetch(`${url}/api/elements`);
  return (await response.json()).elements.length;
}

function endAll() {
  for (const file of recordFiles()) {
    try { process.kill(JSON.parse(fs.readFileSync(join(sessionsDir, file), 'utf-8')).pid, 'SIGKILL'); } catch { /* gone */ }
    fs.rmSync(join(sessionsDir, file), { force: true });
  }
}

// A browser tab, as far as the canvas server can tell.
function openTab(url) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url.replace('http://', 'ws://'));
    socket.once('open', () => resolve(socket));
    socket.once('error', reject);
  });
}

// One long-lived MCP stdio process, talking 2025-era JSON-RPC.
class McpClient {
  constructor(env = {}) {
    this.child = spawn(process.execPath, [mcpPath], {
      cwd: elsewhere,
      env: { ...baseEnv, ...env },
      stdio: ['pipe', 'pipe', 'pipe']
    });
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
      clientInfo: { name: 'archdraw-session-test', version: '0.0.0' }
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

  kill(signal = 'SIGTERM') {
    this.child.kill(signal);
    return new Promise(resolve => this.child.once('exit', resolve));
  }
}

const keyIn = text => text.match(/canvas session ([0-9a-f]{6})/i)?.[1];
const urlIn = text => text.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];

// --- cases ---------------------------------------------------------------

async function startNeedsProject() {
  const result = cli(['session', 'start']);
  assert.notEqual(result.status, 0, 'session start without --project must fail');
  assert.match(result.stderr, /--project/, 'the error names --project');
  assert.deepEqual(recordFiles(), [], 'no canvas server was started');
}

async function startTwiceGivesTwoCanvases() {
  const first = cliOk(['session', 'start', '--project', repoSub]);
  const second = cliOk(['session', 'start', '--project', repoSub]);

  assert.equal(first.projectRoot, repo, 'a sub folder resolves to the git root');
  assert.notEqual(first.session, second.session, 'two keys');
  assert.notEqual(first.url, second.url, 'two URLs (two ports)');
  assert.deepEqual(second.otherSessionsInProject, [{ session: first.session, url: first.url }], 'start names the live one in the project');

  assert.deepEqual(recordFiles().sort(), [`${first.session}.json`, `${second.session}.json`].sort(), 'one record file per canvas server');
  const record = readRecord(first.session);
  assert.equal(record.key, first.session);
  assert.equal(record.projectRoot, repo);
  assert.equal(`http://127.0.0.1:${record.port}`, first.url);
  assert.ok(alive(record.pid), 'record pid is the live server');

  cliOk(['add', '--session', first.session, '--one', '{"type":"rectangle","x":0,"y":0,"text":"only in first"}']);
  assert.equal(await elementCount(first.url), 1, 'first canvas has the box');
  assert.equal(await elementCount(second.url), 0, 'second canvas does not see it');

  const html = await (await fetch(first.url)).text();
  assert.match(html, new RegExp(`<title>[^<]*${first.session}[^<]*</title>`), 'tab title carries the key');

  const listed = cliOk(['session', 'list']);
  for (const started of [first, second]) {
    const row = listed.find(s => s.session === started.session);
    assert.ok(row, `session list shows ${started.session}`);
    assert.equal(row.url, started.url);
    assert.equal(row.projectRoot, repo);
  }

  cliOk(['session', 'end', first.session]);
  assert.equal(await responds(first.url), false, 'ended server is down');
  assert.equal(fs.existsSync(join(sessionsDir, `${first.session}.json`)), false, 'its record is gone');
  assert.equal(await responds(second.url), true, 'the other server is still up');
  endAll();
}

async function projectRootRules() {
  const plainStart = cliOk(['session', 'start', '--project', plain]);
  assert.equal(plainStart.projectRoot, plain, 'a folder outside git is its own root');
  const wtStart = cliOk(['session', 'start', '--project', worktreeSub], { cwd: repo });
  assert.equal(wtStart.projectRoot, worktree, 'a worktree root is found through its .git file, whatever the cwd');
  endAll();
}

async function canvasCommandsNeedSession() {
  const zero = cli(['query']);
  assert.notEqual(zero.status, 0, 'no session, zero live: error');
  assert.match(zero.stderr, /--session/);
  assert.match(zero.stderr, /session start --project/, 'zero live sessions: points at session start');

  const one = cliOk(['session', 'start', '--project', repo]);
  const oneResult = cli(['add', '--one', '{"type":"rectangle","x":0,"y":0}']);
  assert.notEqual(oneResult.status, 0, 'no session, one live: still an error');
  assert.ok(oneResult.stderr.includes(one.session) && oneResult.stderr.includes(repo), 'error lists key and project root');
  assert.equal(await elementCount(one.url), 0, 'nothing was drawn');

  const two = cliOk(['session', 'start', '--project', plain]);
  const twoResult = cli(['add', '--one', '{"type":"rectangle","x":0,"y":0}']);
  assert.notEqual(twoResult.status, 0, 'no session, several live: error');
  assert.ok(twoResult.stderr.includes(one.session) && twoResult.stderr.includes(two.session) && twoResult.stderr.includes(plain));
  assert.equal(await elementCount(one.url) + await elementCount(two.url), 0, 'nothing was drawn');
  endAll();
}

async function deadSessionsDisappear() {
  const started = cliOk(['session', 'start', '--project', repo]);
  process.kill(readRecord(started.session).pid, 'SIGKILL');
  await waitFor(async () => !(await responds(started.url)), 3000, 'killed server stops answering');

  const query = cli(['query', '--session', started.session]);
  assert.equal(query.status, 3, 'a dead key is "canvas unreachable"');
  assert.match(query.stderr, /session start --project/, 'unreachable error points at session start');

  assert.deepEqual(cliOk(['session', 'list']), [], 'session list hides the dead session');
  assert.deepEqual(recordFiles(), [], 'and deletes its record');
}

async function keyCollisionPicksAnother() {
  const previousHome = process.env.HOME;
  process.env.HOME = home;
  try {
    const { claimSessionRecord } = await import(pathToFileURL(join(repoRoot, 'dist', 'core', 'sessions.js')).href);
    fs.mkdirSync(sessionsDir, { recursive: true });
    fs.writeFileSync(join(sessionsDir, 'aaaaaa.json'), 'existing');
    const keys = ['aaaaaa', 'bbbbbb'];
    const record = claimSessionRecord({ port: 1, projectRoot: repo, pid: 1, startedAt: 'now' }, () => keys.shift());
    assert.equal(record.key, 'bbbbbb', 'a taken key is skipped');
    assert.equal(fs.readFileSync(join(sessionsDir, 'aaaaaa.json'), 'utf-8'), 'existing', 'the existing file is not overwritten');
  } finally {
    process.env.HOME = previousHome;
    fs.rmSync(sessionsDir, { recursive: true, force: true });
  }
}

async function upstreamSingleServerIsGone() {
  for (const command of ['start', 'stop', 'status']) {
    const result = cli([command]);
    assert.equal(result.status, 2, `${command} is not a command any more`);
  }
  assert.notEqual(cli(['--url', 'http://127.0.0.1:3000', 'query']).status, 0, '--url is not an option any more');

  const sources = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.ts')) sources.push(full);
    }
  };
  walk(join(repoRoot, 'src'));
  for (const file of sources) {
    const text = fs.readFileSync(file, 'utf-8');
    for (const banned of ['EXPRESS_SERVER_URL', 'EXCALIDRAW_NO_AUTOSTART', 'pidfile', 'PidFile']) {
      assert.ok(!text.includes(banned), `${path.relative(repoRoot, file)} still mentions ${banned}`);
    }
  }
  assert.deepEqual(recordFiles(), [], 'none of this started a canvas server');
}

async function mcpBeforeAttach() {
  const mcp = await new McpClient().init();
  try {
    const listed = await mcp.request('tools/list');
    for (const tool of listed.result.tools.filter(t => !t.name.startsWith('session_'))) {
      const props = Object.keys(tool.inputSchema.properties ?? {});
      assert.ok(!props.some(p => /session|key/i.test(p)), `${tool.name} takes no session key`);
    }

    const draw = await mcp.call('create_element', { type: 'rectangle', x: 0, y: 0 });
    assert.equal(draw.isError, true, 'drawing before session_start is an error');
    assert.match(draw.text, /session_start/);
    assert.match(draw.text, /projectPath/);

    await mcp.callOk('session_list');
    const end = await mcp.call('session_end');
    assert.equal(end.isError, true, 'session_end without a key, unattached, is an error');
    await mcp.request('resources/read', { uri: 'guide://canvas' });
    assert.deepEqual(recordFiles(), [], 'none of these started a canvas server');
  } finally {
    await mcp.kill();
  }
  assert.deepEqual(recordFiles(), [], 'an MCP process that drew nothing leaves no canvas server');
}

async function mcpTwoProcessesTwoCanvases() {
  const a = await new McpClient().init();
  const b = await new McpClient().init();
  try {
    const aText = await a.callOk('session_start', { projectPath: repoSub });
    const aKey = keyIn(aText);
    assert.ok(aKey, `session_start names the key: ${aText}`);
    assert.ok(aText.includes(repo) && !aText.includes(repoSub), 'project root is the git root');
    const aUrl = urlIn(aText);

    const relative = await b.call('session_start', { projectPath: 'src' });
    assert.equal(relative.isError, true, 'a relative projectPath is refused');

    const bText = await b.callOk('session_start', { projectPath: repo });
    const bKey = keyIn(bText);
    const bUrl = urlIn(bText);
    assert.notEqual(aKey, bKey, 'two processes, two canvases');
    assert.match(bText, new RegExp(`Other live canvas sessions in this project: ${aKey}`), 'the second names the first');

    await a.callOk('create_element', { type: 'rectangle', x: 0, y: 0 });
    assert.equal(await elementCount(aUrl), 1, 'A draws on its own canvas');
    assert.equal(await elementCount(bUrl), 0, 'B canvas is untouched');

    const filesBefore = recordFiles().length;
    await b.callOk('session_attach', { key: aKey });
    assert.equal(recordFiles().length, filesBefore, 'attach starts nothing');
    await b.callOk('create_element', { type: 'rectangle', x: 400, y: 0 });
    assert.equal(await elementCount(aUrl), 2, 'after attach B draws on A canvas');

    // B ends its own (A's canvas) without a key; A then gets the ended error.
    await b.callOk('session_end');
    assert.equal(await responds(aUrl), false, 'session_end without key ends the attached canvas');
    const afterEnd = await b.call('create_element', { type: 'rectangle', x: 0, y: 0 });
    assert.equal(afterEnd.isError, true);
    assert.match(afterEnd.text, /session_start/);
    await sleep(200);
    const lost = await a.call('create_element', { type: 'rectangle', x: 0, y: 0 });
    assert.equal(lost.isError, true, 'A canvas is gone');
    assert.ok(lost.text.includes(aKey) && /session_start/.test(lost.text), `error names the ended key: ${lost.text}`);
    assert.equal(recordFiles().length, 1, 'no new canvas server was started');

    // B's original canvas is still live; A ends it by key.
    await a.callOk('session_end', { key: bKey });
    assert.equal(await responds(bUrl), false, 'session_end with a key ends that canvas');
  } finally {
    await a.kill();
    await b.kill();
    endAll();
  }
}

async function mcpKilledServerNamesKey() {
  const mcp = await new McpClient().init();
  try {
    const key = keyIn(await mcp.callOk('session_start', { projectPath: worktreeSub }));
    assert.equal(readRecord(key).projectRoot, worktree, 'worktree root over MCP too');
    process.kill(readRecord(key).pid, 'SIGKILL');
    await sleep(300);
    const result = await mcp.call('describe_scene');
    assert.equal(result.isError, true);
    assert.ok(result.text.includes(key) && /session_start/.test(result.text), result.text);
    assert.equal(recordFiles().length, 1, 'no new canvas server (only the stale record)');
  } finally {
    await mcp.kill();
    endAll();
  }
}

async function canvasOutlivesAgentAndEndsWhenIdle() {
  const idleEnv = { ARCHDRAW_IDLE_TIMEOUT_MS: '1500' };

  // No tab, no agent: ends by itself.
  const lonely = cliOk(['session', 'start', '--project', repo], { env: idleEnv });
  await waitFor(async () => !(await responds(lonely.url)), 5000, 'unconnected canvas ends after the idle timeout');
  assert.deepEqual(recordFiles(), [], 'and removes its record');

  // An attached MCP process killed with -9: the agent is gone, the canvas
  // stays while a tab is open, and ends once the tab closes too.
  const mcp = await new McpClient(idleEnv).init();
  const text = await mcp.callOk('session_start', { projectPath: repo });
  const url = urlIn(text);
  await sleep(2500);
  assert.equal(await responds(url), true, 'an attached agent keeps the canvas alive with no activity');

  const tab = await openTab(url);
  await mcp.kill('SIGKILL');
  await sleep(2500);
  assert.equal(await responds(url), true, 'the canvas outlives its agent session while a tab is open');

  tab.close();
  await waitFor(async () => !(await responds(url)), 5000, 'with no tab and no agent the canvas ends');
  assert.deepEqual(recordFiles(), []);
}

const checks = [
  ['session start needs --project', startNeedsProject],
  ['two session starts give two separate canvases; list and end work per key', startTwiceGivesTwoCanvases],
  ['project root: git root, plain folder, worktree; not the cwd', projectRootRules],
  ['canvas commands without --session fail for 0, 1 and many live sessions', canvasCommandsNeedSession],
  ['dead canvas sessions vanish from session list', deadSessionsDisappear],
  ['a taken session key is never overwritten', keyCollisionPicksAnother],
  ['upstream single-server commands and settings are gone', upstreamSingleServerIsGone],
  ['MCP: nothing starts a canvas before session_start', mcpBeforeAttach],
  ['MCP: two processes, two canvases; attach and end', mcpTwoProcessesTwoCanvases],
  ['MCP: a killed canvas server is reported with its key', mcpKilledServerNamesKey],
  ['a canvas outlives its agent and ends after the idle timeout with no connections', canvasOutlivesAgentAndEndsWhenIdle]
];

let failed = 0;
try {
  for (const [name, check] of checks) {
    try {
      await check();
      console.log(`ok - ${name}`);
    } catch (error) {
      failed += 1;
      console.error(`not ok - ${name}`);
      console.error(`  ${error instanceof Error ? error.message : String(error)}`);
      endAll();
    }
  }
} finally {
  endAll();
  fs.rmSync(sandbox, { recursive: true, force: true });
}

if (failed > 0) {
  console.error(`${failed} of ${checks.length} session checks failed.`);
  process.exit(1);
}
console.log(`All ${checks.length} session checks passed.`);
