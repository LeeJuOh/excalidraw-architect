#!/usr/bin/env node
// Evidence check on agent writes (issue 07 slice A, ADR-0005). Drives the real
// build: a canvas session started by `dist/bin.js` for the REST and CLI cases,
// and `dist/index.js` over stdio for the MCP cases. HOME points at a sandbox so
// the session records do not touch the user's canvases.

import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path, { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const binPath = join(repoRoot, 'dist', 'bin.js');
const mcpPath = join(repoRoot, 'dist', 'index.js');
const { expandElementsForExport } = await import(pathToFileURL(join(repoRoot, 'dist', 'core', 'expand-elements.js')).href);

const sandbox = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'archdraw-evidence-')));
const home = join(sandbox, 'home');
const sessionsDir = join(home, '.excalidraw-architect', 'sessions');
const project = join(sandbox, 'project');
const outside = join(sandbox, 'outside');
const elsewhere = join(sandbox, 'elsewhere');
for (const dir of [join(project, '.git'), join(project, 'src'), outside, elsewhere, home]) {
  fs.mkdirSync(dir, { recursive: true });
}

const ORDER_TS = [
  'export async function placeOrder(order) {',
  '\tconst receipt = await payment.charge(order.total,',
  '\t    order.card);',
  '  repository.save(order);',
  '  repository.save(receipt);',
  '  return receipt;',
  '}',
  ''
].join('\n');
fs.writeFileSync(join(project, 'src', 'order.ts'), ORDER_TS);

const baseEnv = { ...process.env, HOME: home, LOG_LEVEL: 'error' };
delete baseEnv.PORT;

function cli(args) {
  const result = spawnSync(process.execPath, [binPath, ...args], { cwd: elsewhere, env: baseEnv, encoding: 'utf-8' });
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

// One MCP stdio process, talking 2025-era JSON-RPC.
class McpClient {
  constructor() {
    this.child = spawn(process.execPath, [mcpPath], { cwd: elsewhere, env: baseEnv, stdio: ['pipe', 'pipe', 'ignore'] });
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
      clientInfo: { name: 'archdraw-evidence-test', version: '0.0.0' }
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

const session = cliOk(['session', 'start', '--project', project]).session;
const onCanvas = args => cli([...args, '--session', session]);
const port = JSON.parse(fs.readFileSync(join(sessionsDir, `${session}.json`), 'utf-8')).port;
const base = `http://127.0.0.1:${port}`;

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

const box = (id, x, extra = {}) => ({ id, type: 'rectangle', x, y: 0, width: 200, height: 60, ...extra });
const code = (quote, file = 'src/order.ts') => ({ tag: 'code', path: file, quote });
const arrow = (id, evidence, extra = {}) => ({
  id, type: 'arrow', x: 200, y: 30, points: [[0, 0], [120, 0]],
  start: { id: 'order' }, end: { id: 'payment' }, evidence, ...extra
});
const twoBoxes = () => [box('order', 0), box('payment', 320)];

// The refusal names the element, path, quote and reason, and gives exactly the
// two ways out: a correct quote, or no code evidence and an inferred dashed line.
function assertRefusal(error, { id, file, quote, reason }) {
  assert.match(error, new RegExp(id));
  assert.ok(error.includes(file), `error names the path ${file}: ${error}`);
  assert.ok(error.includes(quote), `error names the quote ${quote}: ${error}`);
  assert.match(error, reason);
  assert.match(error, /quote/i);
  assert.match(error, /inferred/i);
  assert.match(error, /dashed/i);
  assert.doesNotMatch(error, /design/i, 'no hint to switch the tag to design');
}

// ---- cases ----

async function codeArrowWithOneMatchIsCreatedAsDrawn() {
  const evidence = code('payment.charge(order.total,');
  const res = await batch([...twoBoxes(), arrow('pay', evidence)]);
  assert.equal(res.status, 200, JSON.stringify(res.json));
  const stored = await get('pay');
  assert.deepEqual(stored.evidence, evidence);
  assert.equal(stored.strokeStyle, undefined, 'the server does not restyle the line');
}

async function missingQuoteRejectsAndCreatesNothing() {
  const res = await batch([...twoBoxes(), arrow('pay', code('payment.refund('))]);
  assert.equal(res.status, 400, JSON.stringify(res.json));
  assertRefusal(res.json.error, { id: 'pay', file: 'src/order.ts', quote: 'payment.refund(', reason: /not (found )?in the file/i });
  assert.equal((await all()).length, 0, 'nothing created, not even the boxes');
}

async function repeatedQuoteRejectsUntilNarrowed() {
  const res = await batch([...twoBoxes(), arrow('save', code('repository.save('))]);
  assert.equal(res.status, 400, JSON.stringify(res.json));
  assertRefusal(res.json.error, { id: 'save', file: 'src/order.ts', quote: 'repository.save(', reason: /2 times/ });
  assert.match(res.json.error, /narrow it to one place/);
  assert.equal((await all()).length, 0);

  const narrowed = await batch([...twoBoxes(), arrow('save', code('repository.save(order)'))]);
  assert.equal(narrowed.status, 200, JSON.stringify(narrowed.json));
}

async function whitespaceDifferencesAndLineBreaksMatch() {
  const res = await batch([
    ...twoBoxes(),
    // The file has a tab, a line break and four spaces inside this call.
    arrow('spaced', code('const receipt = await payment.charge(order.total, order.card);')),
    arrow('multi', code('repository.save(order);\n    repository.save(receipt);'), { y: 50 }),
    // Agents often join a multi-line call into one line with no space at the break.
    arrow('joined', code('payment.charge(order.total,order.card);'), { y: 100 })
  ]);
  assert.equal(res.status, 200, JSON.stringify(res.json));
}

async function badShapesAreRefused() {
  for (const [label, evidence, reason] of [
    ['code without path', { tag: 'code', quote: 'payment.charge(' }, /needs a path/],
    ['code without quote', { tag: 'code', path: 'src/order.ts' }, /needs a quote/],
    ['old line form', { tag: 'code', path: 'src/order.ts', line: 2 }, /needs a quote/],
    ['unknown tag', { tag: 'guess', path: 'src/order.ts', quote: 'payment.charge(' }, /tag must be one of code, design, log/],
    ['Korean tag', { tag: '코드', path: 'src/order.ts', quote: 'payment.charge(' }, /tag must be one of/],
    ['quote not a string', { tag: 'code', path: 'src/order.ts', quote: 42 }, /quote must be a string/],
    ['path not a string', { tag: 'log', path: ['a'] }, /path must be a string/],
    ['not an object', 'src/order.ts:2', /must be an object/]
  ]) {
    const res = await batch([...twoBoxes(), arrow('bad', evidence)]);
    assert.equal(res.status, 400, `${label}: ${JSON.stringify(res.json)}`);
    assert.match(res.json.error, reason, label);
  }
  assert.equal((await all()).length, 0);
}

async function pathsOutsideTheProjectAreRefused() {
  fs.writeFileSync(join(outside, 'secret.ts'), 'payment.charge(secret)\n');
  fs.writeFileSync(join(project, '.git', 'config'), 'payment.charge(git)\n');
  fs.symlinkSync(join(outside, 'secret.ts'), join(project, 'src', 'linked.ts'));
  fs.symlinkSync(join(project, '.git'), join(project, 'gitlink'));
  for (const [label, file, reason] of [
    ['absolute', join(outside, 'secret.ts'), /relative to the project root/],
    ['dot dot', '../outside/secret.ts', /inside the project root/],
    ['dot dot in the middle', 'src/../../outside/secret.ts', /inside the project root/],
    ['.git', '.git/config', /\.git/],
    ['.git in other case', '.GIT/config', /\.git/],
    ['the project root itself', '.', /not a file/],
    ['link to outside', 'src/linked.ts', /link to outside/],
    ['link into .git', 'gitlink/config', /\.git/],
    ['missing file', 'src/nope.ts', /does not exist/]
  ]) {
    const quote = 'payment.charge(';
    const res = await batch([...twoBoxes(), arrow('bad', code(quote, file))]);
    assert.equal(res.status, 400, `${label}: ${JSON.stringify(res.json)}`);
    assertRefusal(res.json.error, { id: 'bad', file, quote, reason });
  }
  assert.equal((await all()).length, 0);

  // A name that only starts with two dots is inside the project.
  fs.mkdirSync(join(project, '..notes'));
  fs.writeFileSync(join(project, '..notes', 'plan.ts'), 'payment.charge(plan)\n');
  const dotted = await batch([...twoBoxes(), arrow('ok', code('payment.charge(plan)', '..notes/plan.ts'))]);
  assert.equal(dotted.status, 200, JSON.stringify(dotted.json));
}

async function oneBadInABatchRefusesAllAndListsEveryBadOne() {
  const res = await batch([
    ...twoBoxes(),
    arrow('good', code('payment.charge(order.total,')),
    arrow('bad1', code('payment.refund('), { y: 50 }),
    arrow('bad2', code('repository.save('), { y: 70 })
  ]);
  assert.equal(res.status, 400, JSON.stringify(res.json));
  assert.match(res.json.error, /bad1[^\n]*not in the file/);
  assert.match(res.json.error, /bad2[^\n]*2 times/);
  assert.doesNotMatch(res.json.error, /\bgood\b/);
  assert.equal((await all()).length, 0);

  const single = await api('POST', '/api/elements', box('lonely', 0, { evidence: code('payment.refund(') }));
  assert.equal(single.status, 400);
  assertRefusal(single.json.error, { id: 'lonely', file: 'src/order.ts', quote: 'payment.refund(', reason: /not in the file/ });
  assert.equal((await all()).length, 0);
}

async function codeBoxFollowsTheSameRule() {
  const bad = await batch([box('svc', 0, { label: { text: 'Order service' }, evidence: code('function cancelOrder(') })]);
  assert.equal(bad.status, 400, JSON.stringify(bad.json));
  assertRefusal(bad.json.error, { id: 'svc', file: 'src/order.ts', quote: 'function cancelOrder(', reason: /not in the file/ });
  const ok = await batch([box('svc', 0, { label: { text: 'Order service' }, evidence: code('function placeOrder(') })]);
  assert.equal(ok.status, 200, JSON.stringify(ok.json));
}

async function theServerKeepsTheShape() {
  const drawn = {
    strokeStyle: 'dashed',
    label: { text: 'inferred: calls?' },
    evidence: code('payment.charge(order.total,')
  };
  const res = await batch([...twoBoxes(), arrow('guess', drawn.evidence, drawn)]);
  assert.equal(res.status, 200, JSON.stringify(res.json));
  const stored = await get('guess');
  assert.equal(stored.strokeStyle, 'dashed', 'valid evidence does not turn the inferred line solid');
  assert.equal(stored.label.text, 'inferred: calls?');
  assert.equal((await all()).length, 3, 'no extra marker element');
}

async function unrelatedButPresentTextPasses() {
  // "return receipt" says nothing about order -> payment; the server does not judge meaning.
  const res = await batch([...twoBoxes(), arrow('pay', code('return receipt;'))]);
  assert.equal(res.status, 200, JSON.stringify(res.json));
}

async function designAndLogAreRecordedUnchecked() {
  const res = await batch([
    ...twoBoxes(),
    arrow('plan', { tag: 'design' }),
    arrow('seen', { tag: 'log', path: 'logs/not-there.log', quote: 'nowhere at all' }, { y: 50 })
  ]);
  assert.equal(res.status, 200, JSON.stringify(res.json));
  assert.deepEqual((await get('plan')).evidence, { tag: 'design' });
  assert.equal((await get('seen')).evidence.tag, 'log');
}

// Tags are element data: describe shows them, the drawn scene does not.
async function describeShowsTagsTheSceneDoesNotDraw() {
  const res = await batch([
    ...twoBoxes(),
    arrow('pay', code('payment.charge(order.total,')),
    arrow('plan', { tag: 'design' }, { y: 50 })
  ]);
  assert.equal(res.status, 200, JSON.stringify(res.json));

  const described = onCanvas(['describe']);
  assert.equal(described.status, 0, described.stderr);
  assert.match(described.stdout, /\[pay\] arrow.*evidence: code src\/order\.ts "payment\.charge\(order\.total,"/);
  assert.match(described.stdout, /\[plan\] arrow.*evidence: design/);

  const drawn = expandElementsForExport(await all());
  const texts = drawn.filter(el => el.type === 'text').map(el => el.text ?? '').join('\n');
  for (const word of ['src/order.ts', 'payment.charge', 'design']) {
    assert.ok(!texts.includes(word), `no drawn text carries ${word}: ${texts}`);
  }
}

async function untaggedElementsBehaveAsBefore() {
  const res = await batch([...twoBoxes(), arrow('plain', undefined), box('nulled', 640, { evidence: null })]);
  assert.equal(res.status, 200, JSON.stringify(res.json));
  assert.equal('evidence' in (await get('plain')), false);
}

async function updateChecksOnlyWhenEvidenceIsWritten() {
  await batch([...twoBoxes(), arrow('pay', code('payment.charge(order.total,'))]);
  const before = await get('pay');

  const bad = await api('PUT', '/api/elements/pay', { evidence: code('payment.refund('), strokeColor: '#e03131' });
  assert.equal(bad.status, 400, JSON.stringify(bad.json));
  assertRefusal(bad.json.error, { id: 'pay', file: 'src/order.ts', quote: 'payment.refund(', reason: /not in the file/ });
  assert.deepEqual(await get('pay'), before, 'the element is as it was');

  // The evidence went stale in the file; a position-only write is not checked.
  const file = join(project, 'src', 'order.ts');
  fs.writeFileSync(file, ORDER_TS.replace('payment.charge', 'payment.capture'));
  try {
    const moved = await api('PUT', '/api/elements/pay', { y: 90 });
    assert.equal(moved.status, 200, JSON.stringify(moved.json));
    const rewritten = await api('PUT', '/api/elements/pay', { evidence: before.evidence });
    assert.equal(rewritten.status, 400, 'rewriting the same stale evidence is checked');
    const fixed = await api('PUT', '/api/elements/pay', { evidence: code('payment.capture(order.total,') });
    assert.equal(fixed.status, 200, JSON.stringify(fixed.json));
    const removed = await api('PUT', '/api/elements/pay', { evidence: null, strokeStyle: 'dashed' });
    assert.equal(removed.status, 200, JSON.stringify(removed.json));
  } finally {
    fs.writeFileSync(file, ORDER_TS);
  }
}

// The same writes through MCP and through the CLI end the same way: stored as
// sent when the quote is there once, refused with the same reasons when not.
async function mcpAndCliGiveTheSameResult() {
  const good = code('payment.charge(order.total,');
  const bad = code('payment.refund(');
  const file = join(sandbox, 'elements.json');
  const mcp = await new McpClient().init();
  try {
    await mcp.callOk('session_attach', { key: session });

    // create
    const mcpCreated = await mcp.callOk('create_element', box('m1', 0, { evidence: good }));
    assert.match(mcpCreated, /"quote": "payment\.charge\(order\.total,"/);
    const cliCreated = onCanvas(['add', '--one', JSON.stringify(box('c1', 320, { evidence: good }))]);
    assert.equal(cliCreated.status, 0, cliCreated.stderr);
    assert.deepEqual((await get('m1')).evidence, (await get('c1')).evidence);

    const mcpRefused = await mcp.call('create_element', box('m2', 0, { evidence: bad }));
    assert.equal(mcpRefused.isError, true);
    assertRefusal(mcpRefused.text, { id: 'm2', file: 'src/order.ts', quote: 'payment.refund(', reason: /not in the file/ });
    const cliRefused = onCanvas(['add', '--one', JSON.stringify(box('c2', 0, { evidence: bad }))]);
    assert.notEqual(cliRefused.status, 0);
    assertRefusal(cliRefused.stderr, { id: 'c2', file: 'src/order.ts', quote: 'payment.refund(', reason: /not in the file/ });

    // batch / apply
    const mixed = prefix => [box(`${prefix}ok`, 0, { evidence: good }), box(`${prefix}bad`, 320, { evidence: bad })];
    const mcpBatch = await mcp.call('batch_create_elements', { elements: mixed('mb') });
    assert.equal(mcpBatch.isError, true);
    assert.match(mcpBatch.text, /mbbad[^\n]*not in the file/);
    fs.writeFileSync(file, JSON.stringify({ create: mixed('cb') }));
    const cliApply = onCanvas(['apply', file]);
    assert.notEqual(cliApply.status, 0);
    assert.match(cliApply.stderr, /cbbad[^\n]*not in the file/);
    assert.deepEqual((await all()).map(el => el.id).sort(), ['c1', 'm1'], 'neither batch created anything');

    // update
    const mcpUpdate = await mcp.call('update_element', { id: 'm1', evidence: bad });
    assert.equal(mcpUpdate.isError, true);
    assert.match(mcpUpdate.text, /m1[^\n]*not in the file/);
    const cliUpdate = onCanvas(['update', 'c1', '--set', JSON.stringify({ evidence: bad })]);
    assert.notEqual(cliUpdate.status, 0);
    assert.match(cliUpdate.stderr, /c1[^\n]*not in the file/);
    fs.writeFileSync(file, JSON.stringify({ update: [{ id: 'c1', evidence: bad }] }));
    const cliApplyUpdate = onCanvas(['apply', file]);
    assert.notEqual(cliApplyUpdate.status, 0);
    assert.match(cliApplyUpdate.stderr, /c1[^\n]*not in the file/);
    assert.deepEqual((await get('m1')).evidence, good);
    assert.deepEqual((await get('c1')).evidence, good);

    // A position-only update after the code changed is not checked on either path.
    const orderFile = join(project, 'src', 'order.ts');
    fs.writeFileSync(orderFile, '// emptied\n');
    try {
      await mcp.callOk('update_element', { id: 'm1', x: 40 });
      const moved = onCanvas(['update', 'c1', '--set', JSON.stringify({ x: 360 })]);
      assert.equal(moved.status, 0, moved.stderr);
    } finally {
      fs.writeFileSync(orderFile, ORDER_TS);
    }
  } finally {
    await mcp.kill();
  }
}

// A restore, an import or a duplicate keeps what was saved even when its code
// evidence has gone stale (decisions 2 and 7). Slice B adds the list of stale elements.
async function restoreAndImportAreNotRefused() {
  await batch([...twoBoxes(), arrow('pay', code('payment.charge(order.total,'))]);
  assert.equal(onCanvas(['snapshot', 'save', 'before-change', '--force']).status, 0);
  const scene = join(sandbox, 'saved.excalidraw');
  fs.writeFileSync(scene, JSON.stringify({ type: 'excalidraw', version: 2, elements: await all() }));

  const orderFile = join(project, 'src', 'order.ts');
  fs.writeFileSync(orderFile, '// payment moved elsewhere\n');
  const mcp = await new McpClient().init();
  try {
    await mcp.callOk('session_attach', { key: session });

    const cliRestored = onCanvas(['snapshot', 'restore', 'before-change']);
    assert.equal(cliRestored.status, 0, cliRestored.stderr);
    assert.deepEqual((await get('pay')).evidence, code('payment.charge(order.total,'));

    await mcp.callOk('restore_snapshot', { name: 'before-change' });
    assert.equal((await get('pay')).evidence.quote, 'payment.charge(order.total,');

    // A duplicate copies evidence the agent did not write in that request (decision 2).
    const cliCopied = onCanvas(['arrange', 'duplicate', '--ids', 'pay']);
    assert.equal(cliCopied.status, 0, cliCopied.stderr);
    await mcp.callOk('duplicate_elements', { elementIds: ['pay'] });
    assert.equal((await all()).filter(el => el.evidence?.quote === 'payment.charge(order.total,').length, 3);

    await clear();
    const cliImported = onCanvas(['import', scene]);
    assert.equal(cliImported.status, 0, cliImported.stderr);
    await mcp.callOk('import_scene', { filePath: scene });
    const arrows = (await all()).filter(el => el.type === 'arrow');
    assert.equal(arrows.length, 2, 'both imports landed');
    assert.ok(arrows.every(el => el.evidence?.quote === 'payment.charge(order.total,'));
  } finally {
    fs.writeFileSync(orderFile, ORDER_TS);
    await mcp.kill();
  }
}

const cases = [
  ['a code arrow whose quote is in the file once is created as drawn', codeArrowWithOneMatchIsCreatedAsDrawn],
  ['a quote not in the file is refused with both fixes, nothing created', missingQuoteRejectsAndCreatesNothing],
  ['a quote found twice is refused with the count until narrowed', repeatedQuoteRejectsUntilNarrowed],
  ['whitespace is ignored, even where one side has none; multi-line quotes match', whitespaceDifferencesAndLineBreaksMatch],
  ['missing path or quote, unknown tag and wrong types are refused', badShapesAreRefused],
  ['absolute, .., .git and links out of the project are refused', pathsOutsideTheProjectAreRefused],
  ['one bad element refuses the whole batch and every bad one is listed', oneBadInABatchRefusesAllAndListsEveryBadOne],
  ['a code-tagged box is checked the same way', codeBoxFollowsTheSameRule],
  ['valid evidence on an inferred dashed line keeps the dash and label', theServerKeepsTheShape],
  ['text that is in the file but unrelated passes', unrelatedButPresentTextPasses],
  ['design and log tags are stored without a check', designAndLogAreRecordedUnchecked],
  ['describe shows the tag; the drawn scene has no tag text', describeShowsTagsTheSceneDoesNotDraw],
  ['elements without a tag behave as before', untaggedElementsBehaveAsBefore],
  ['update checks evidence only when the write carries it', updateChecksOnlyWhenEvidenceIsWritten],
  ['MCP create/batch/update and CLI add/apply/update give the same result', mcpAndCliGiveTheSameResult],
  ['snapshot restore, import and duplicate keep stale code evidence, CLI and MCP', restoreAndImportAreNotRefused]
];

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
  endAll();
  fs.rmSync(sandbox, { recursive: true, force: true });
}
if (failed) {
  console.error(`${failed} evidence check(s) failed`);
  process.exit(1);
}
console.log('evidence checks passed');
