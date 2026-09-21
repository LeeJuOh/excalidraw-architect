#!/usr/bin/env node

// Wire-level checks for the stdio MCP entry point. Every case drives a real
// `dist/index.js` process over stdin/stdout with hand-written JSON-RPC frames,
// so what is asserted is exactly what a client sees on the wire.

import { spawn } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const serverPath = join(repoRoot, 'dist', 'index.js');
const PACKAGE_NAME = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf-8')).name;
const runtime = process.env.MCP_RUNTIME || process.execPath;
const runtimeName = basename(runtime).toLowerCase();
const argsFor = script => (runtimeName.includes('bun') ? ['run', script] : [script]);
const runtimeArgs = argsFor(serverPath);

const MODERN_VERSION = '2026-07-28';
const LEGACY_VERSION = '2025-06-18';
const PROTOCOL_VERSION_META_KEY = 'io.modelcontextprotocol/protocolVersion';
const CLIENT_CAPABILITIES_META_KEY = 'io.modelcontextprotocol/clientCapabilities';
const CLIENT_INFO_META_KEY = 'io.modelcontextprotocol/clientInfo';
const SERVER_INFO_META_KEY = 'io.modelcontextprotocol/serverInfo';
const UNSUPPORTED_PROTOCOL_VERSION_CODE = -32022;
const INVALID_PARAMS_CODE = -32602;
const RESPONSE_TIMEOUT_MS = 20000;

// `get_resource` with a scene read is the one call that never touches the
// canvas server (see toolNeedsCanvasBeforeDispatch), so these checks stay
// hermetic.
const CANVAS_FREE_TOOL = 'get_resource';
const CANVAS_FREE_ARGS = { resource: 'scene' };

const GUIDE_URI = 'guide://canvas';
const GUIDE_PATH = join(repoRoot, 'docs', 'canvas-guide.md');
const GUIDE_TEXT = readFileSync(GUIDE_PATH, 'utf-8');
const INSTRUCTIONS_LIMIT_BYTES = 2048;
// Codex reads the head of `instructions` as the core; these are the rules
// that must survive that clip (issue 09).
const INSTRUCTIONS_HEAD_CHARS = 512;
const INSTRUCTIONS_HEAD_TERMS = ['startElementId', '200x60', '320', '180'];

function envelope(version = MODERN_VERSION) {
  return {
    [PROTOCOL_VERSION_META_KEY]: version,
    [CLIENT_CAPABILITIES_META_KEY]: {},
    [CLIENT_INFO_META_KEY]: { name: 'excalidraw-wire-test', version: '0.0.0' }
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, message) {
  assert(actual === expected, `${message} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
}

/**
 * Runs one stdio connection: sends every message, resolves once `expected`
 * responses have come back on stdout.
 */
function exchange(messages, expected) {
  return new Promise((resolve, reject) => {
    const child = spawn(runtime, runtimeArgs, {
      cwd: repoRoot,
      env: {
        ...process.env,
        ENABLE_CANVAS_SYNC: 'false',
        EXCALIDRAW_NO_AUTOSTART: '1',
        LOG_LEVEL: 'error'
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const responses = [];
    let stdout = '';
    let stderr = '';
    let settled = false;

    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill('SIGKILL');
      if (error) reject(error);
      else resolve({ responses, stderr });
    };

    const timer = setTimeout(() => {
      finish(new Error(
        `Timed out after ${RESPONSE_TIMEOUT_MS}ms waiting for ${expected} response(s); ` +
        `got ${responses.length}.${stderr ? `\nstderr:\n${stderr}` : ''}`
      ));
    }, RESPONSE_TIMEOUT_MS);

    child.stdout.on('data', chunk => {
      stdout += chunk.toString();
      const lines = stdout.split('\n');
      stdout = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          responses.push(JSON.parse(line));
        } catch {
          finish(new Error(`Non-JSON line on stdout: ${line}`));
          return;
        }
      }
      if (responses.length >= expected) finish();
    });

    child.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });

    child.on('error', error => finish(error));
    child.on('exit', code => {
      if (responses.length >= expected) finish();
      else finish(new Error(`Server exited with code ${code} before answering.${stderr ? `\nstderr:\n${stderr}` : ''}`));
    });

    for (const message of messages) {
      child.stdin.write(`${JSON.stringify(message)}\n`);
    }
  });
}

function resultOf(response, label) {
  assert(response !== undefined, `${label}: no response`);
  assert(response.error === undefined, `${label}: unexpected error ${JSON.stringify(response.error)}`);
  assert(response.result !== undefined, `${label}: response carried no result`);
  return response.result;
}

// Every 2026-07-28 result must carry the resultType discriminator, and the
// server should stamp its identity into _meta on the way out.
function assertModernResult(result, label) {
  assertEqual(result.resultType, 'complete', `${label}: resultType`);
  const serverInfo = result._meta?.[SERVER_INFO_META_KEY];
  assert(serverInfo !== undefined, `${label}: missing ${SERVER_INFO_META_KEY} in _meta`);
  assertEqual(serverInfo.name, PACKAGE_NAME, `${label}: serverInfo.name`);
}

// tools/list and server/discover are CacheableResult extenders on 2026-07-28.
function assertCacheFields(result, label) {
  assert(Number.isSafeInteger(result.ttlMs) && result.ttlMs >= 0, `${label}: ttlMs must be a non-negative integer, got ${JSON.stringify(result.ttlMs)}`);
  assert(result.cacheScope === 'public' || result.cacheScope === 'private', `${label}: cacheScope must be public or private, got ${JSON.stringify(result.cacheScope)}`);
}

async function checkDiscovery() {
  const { responses } = await exchange([
    { jsonrpc: '2.0', id: 1, method: 'server/discover', params: { _meta: envelope() } }
  ], 1);

  const result = resultOf(responses[0], 'server/discover');
  assert(Array.isArray(result.supportedVersions), 'server/discover: supportedVersions must be an array');
  assert(result.supportedVersions.includes(MODERN_VERSION), `server/discover: supportedVersions must advertise ${MODERN_VERSION}`);
  assert(
    result.supportedVersions.every(version => version >= MODERN_VERSION),
    'server/discover: the modern advertisement must not leak legacy revisions'
  );
  assert(result.capabilities?.tools !== undefined, 'server/discover: tools capability must be advertised');
  assertModernResult(result, 'server/discover');
  assertCacheFields(result, 'server/discover');
}

async function checkDirectCallWithoutInitialization() {
  // No initialize, no server/discover: the envelope alone opens the connection.
  const { responses } = await exchange([
    { jsonrpc: '2.0', id: 1, method: 'tools/list', params: { _meta: envelope() } },
    {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: CANVAS_FREE_TOOL, arguments: CANVAS_FREE_ARGS, _meta: envelope() }
    }
  ], 2);

  const listResult = resultOf(responses.find(r => r.id === 1), 'tools/list');
  assert(Array.isArray(listResult.tools) && listResult.tools.length > 0, 'tools/list: expected a non-empty tool list');
  assert(
    listResult.tools.some(tool => tool.name === CANVAS_FREE_TOOL),
    `tools/list: expected ${CANVAS_FREE_TOOL} to be advertised`
  );
  // The guide is a resource now, not a tool (ADR-0006). Upstream merges
  // bring the tool back; this fails when that happens.
  assert(
    !listResult.tools.some(tool => tool.name === 'read_diagram_guide'),
    'tools/list: read_diagram_guide was deleted and must not be advertised'
  );
  assertModernResult(listResult, 'tools/list');
  assertCacheFields(listResult, 'tools/list');

  const callResult = resultOf(responses.find(r => r.id === 2), 'tools/call');
  assert(callResult.isError !== true, `tools/call: tool reported an error: ${JSON.stringify(callResult.content)}`);
  assertEqual(callResult.content?.[0]?.type, 'text', 'tools/call: first content block type');
  assertModernResult(callResult, 'tools/call');
  assert(callResult.ttlMs === undefined, 'tools/call: results are not cacheable and must not carry ttlMs');
}

async function checkUnsupportedVersion() {
  const { responses } = await exchange([
    { jsonrpc: '2.0', id: 1, method: 'server/discover', params: { _meta: envelope('2099-01-01') } }
  ], 1);

  const response = responses[0];
  assert(response?.error !== undefined, 'unsupported version: expected a JSON-RPC error');
  assertEqual(response.error.code, UNSUPPORTED_PROTOCOL_VERSION_CODE, 'unsupported version: error code');
  assert(
    Array.isArray(response.error.data?.supported) && response.error.data.supported.includes(MODERN_VERSION),
    `unsupported version: error data must name ${MODERN_VERSION} as supported`
  );
  assertEqual(response.error.data?.requested, '2099-01-01', 'unsupported version: echoed requested version');
}

async function checkInvalidEnvelope() {
  // A present-but-incomplete envelope claim is a validation error, never a
  // silent fall back to the legacy era.
  const { responses } = await exchange([
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: { _meta: { [PROTOCOL_VERSION_META_KEY]: MODERN_VERSION } }
    }
  ], 1);

  const response = responses[0];
  assert(response?.error !== undefined, 'invalid envelope: expected a JSON-RPC error');
  assertEqual(response.error.code, INVALID_PARAMS_CODE, 'invalid envelope: error code');
  assert(
    String(response.error.message).includes(CLIENT_CAPABILITIES_META_KEY),
    `invalid envelope: error message should name the missing key, got ${JSON.stringify(response.error.message)}`
  );
}

async function checkLegacyInitialize() {
  const { responses } = await exchange([
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: LEGACY_VERSION,
        capabilities: {},
        clientInfo: { name: 'excalidraw-wire-test', version: '0.0.0' }
      }
    },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: CANVAS_FREE_TOOL, arguments: CANVAS_FREE_ARGS } }
  ], 3);

  const initResult = resultOf(responses.find(r => r.id === 1), 'initialize');
  assertEqual(initResult.protocolVersion, LEGACY_VERSION, 'initialize: negotiated protocol version');
  assertEqual(initResult.serverInfo?.name, PACKAGE_NAME, 'initialize: serverInfo.name');
  assert(initResult.capabilities?.tools !== undefined, 'initialize: tools capability must be advertised');
  assert(initResult.resultType === undefined, 'initialize: 2025-era results must not carry resultType');

  const listResult = resultOf(responses.find(r => r.id === 2), 'legacy tools/list');
  assert(Array.isArray(listResult.tools) && listResult.tools.length > 0, 'legacy tools/list: expected a non-empty tool list');
  assert(listResult.resultType === undefined, 'legacy tools/list: 2025-era results must not carry resultType');
  assert(listResult.ttlMs === undefined, 'legacy tools/list: 2025-era results must not carry cache fields');

  const callResult = resultOf(responses.find(r => r.id === 3), 'legacy tools/call');
  assert(callResult.isError !== true, `legacy tools/call: tool reported an error: ${JSON.stringify(callResult.content)}`);
  assertEqual(callResult.content?.[0]?.type, 'text', 'legacy tools/call: first content block type');
  assert(callResult.resultType === undefined, 'legacy tools/call: 2025-era results must not carry resultType');
}

async function checkGuideInstructions() {
  const { responses } = await exchange([
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: LEGACY_VERSION,
        capabilities: {},
        clientInfo: { name: 'excalidraw-wire-test', version: '0.0.0' }
      }
    }
  ], 1);

  const result = resultOf(responses.find(r => r.id === 1), 'initialize');
  const instructions = result.instructions;
  assert(typeof instructions === 'string' && instructions.length > 0, 'initialize: instructions must be a non-empty string');

  const bytes = Buffer.byteLength(instructions, 'utf-8');
  assert(
    bytes <= INSTRUCTIONS_LIMIT_BYTES,
    `initialize: instructions must fit in ${INSTRUCTIONS_LIMIT_BYTES} bytes, got ${bytes}`
  );

  const head = instructions.slice(0, INSTRUCTIONS_HEAD_CHARS);
  for (const term of INSTRUCTIONS_HEAD_TERMS) {
    assert(
      head.includes(term),
      `initialize: the first ${INSTRUCTIONS_HEAD_CHARS} characters of instructions must still carry "${term}"`
    );
  }

  assert(
    instructions.trimEnd().endsWith(`\`${GUIDE_URI}\`.`),
    `initialize: instructions must end by pointing at ${GUIDE_URI}, got ${JSON.stringify(instructions.slice(-80))}`
  );
  assert(
    GUIDE_TEXT.includes(instructions),
    'initialize: instructions must be a verbatim slice of docs/canvas-guide.md, not a second copy'
  );
}

async function checkGuideResource() {
  const { responses } = await exchange([
    { jsonrpc: '2.0', id: 1, method: 'resources/list', params: { _meta: envelope() } },
    { jsonrpc: '2.0', id: 2, method: 'resources/read', params: { uri: GUIDE_URI, _meta: envelope() } }
  ], 2);

  const listResult = resultOf(responses.find(r => r.id === 1), 'resources/list');
  assert(Array.isArray(listResult.resources), 'resources/list: resources must be an array');
  const listed = listResult.resources.find(resource => resource.uri === GUIDE_URI);
  assert(listed !== undefined, `resources/list: expected ${GUIDE_URI} to be listed`);
  assertEqual(listed.mimeType, 'text/markdown', 'resources/list: guide mimeType');

  const readResult = resultOf(responses.find(r => r.id === 2), 'resources/read');
  assert(Array.isArray(readResult.contents) && readResult.contents.length === 1, 'resources/read: expected exactly one content entry');
  const [content] = readResult.contents;
  assertEqual(content.uri, GUIDE_URI, 'resources/read: content uri');
  assert(
    Buffer.from(content.text ?? '', 'utf-8').equals(Buffer.from(GUIDE_TEXT, 'utf-8')),
    'resources/read: body must be byte-identical to docs/canvas-guide.md'
  );
}

// A build with no guide file must say so and stop, rather than serve an empty
// drawing spec. Copied into a throwaway tree so the repo keeps its own copy.
async function checkMissingGuideFails() {
  const sandbox = mkdtempSync(join(repoRoot, '.mcp-stdio-check-'));
  try {
    cpSync(join(repoRoot, 'dist'), join(sandbox, 'dist'), {
      recursive: true,
      filter: source => source !== join(repoRoot, 'dist', 'frontend')
    });
    cpSync(join(repoRoot, 'package.json'), join(sandbox, 'package.json'));

    const child = spawn(runtime, argsFor(join(sandbox, 'dist', 'index.js')), {
      cwd: sandbox,
      env: { ...process.env, ENABLE_CANVAS_SYNC: 'false', EXCALIDRAW_NO_AUTOSTART: '1', LOG_LEVEL: 'error' },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stderr = '';
    child.stderr.on('data', chunk => { stderr += chunk.toString(); });
    const code = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error('missing guide: server kept running instead of failing'));
      }, RESPONSE_TIMEOUT_MS);
      child.on('error', error => { clearTimeout(timer); reject(error); });
      child.on('exit', exitCode => { clearTimeout(timer); resolve(exitCode); });
    });

    assert(code !== 0, 'missing guide: the server must exit non-zero');
    assert(
      stderr.includes('Canvas guide missing at') && stderr.includes('canvas-guide.md'),
      `missing guide: the reason must name the file, got:\n${stderr}`
    );
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
}

const checks = [
  ['server/discover advertises the modern era', checkDiscovery],
  ['direct tool calls work without initialization', checkDirectCallWithoutInitialization],
  ['unsupported protocol revisions are refused', checkUnsupportedVersion],
  ['malformed _meta envelopes are refused', checkInvalidEnvelope],
  [`legacy ${LEGACY_VERSION} initialize still works`, checkLegacyInitialize],
  ['initialize carries the canvas guide summary', checkGuideInstructions],
  [`${GUIDE_URI} serves the guide verbatim`, checkGuideResource],
  ['a missing canvas guide fails startup with a reason', checkMissingGuideFails]
];

let failed = 0;
for (const [name, check] of checks) {
  try {
    await check();
    console.log(`ok - ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`not ok - ${name}`);
    console.error(`  ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failed > 0) {
  console.error(`${failed} of ${checks.length} stdio wire checks failed.`);
  process.exit(1);
}

console.log(`All ${checks.length} stdio wire checks passed using ${runtimeName}.`);
