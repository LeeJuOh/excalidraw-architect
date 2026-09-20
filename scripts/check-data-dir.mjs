#!/usr/bin/env node
// Screenshots and other agent-generated files must land in the host's plugin
// data folder, never in the repo the agent is drawing about (spec 7-5c).
// Claude sets CLAUDE_PLUGIN_DATA, Codex sets PLUGIN_DATA, and the `npx skills
// add` channel sets neither.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path, { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
// One import is enough: the module reads process.env on every call.
const { pluginDataDir, pluginTmpDir } = await import(
  pathToFileURL(join(repoRoot, 'dist', 'core', 'data-dir.js')).href
);

const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'archdraw-data-dir-'));
const original = {
  claude: process.env.CLAUDE_PLUGIN_DATA,
  codex: process.env.PLUGIN_DATA
};

function withEnv(env, fn) {
  delete process.env.CLAUDE_PLUGIN_DATA;
  delete process.env.PLUGIN_DATA;
  for (const [key, value] of Object.entries(env)) process.env[key] = value;
  try {
    return fn();
  } finally {
    delete process.env.CLAUDE_PLUGIN_DATA;
    delete process.env.PLUGIN_DATA;
    if (original.claude !== undefined) process.env.CLAUDE_PLUGIN_DATA = original.claude;
    if (original.codex !== undefined) process.env.PLUGIN_DATA = original.codex;
  }
}

const claudeHome = path.join(sandbox, 'claude');
assert.equal(
  withEnv({ CLAUDE_PLUGIN_DATA: claudeHome }, () => pluginDataDir()),
  claudeHome,
  'CLAUDE_PLUGIN_DATA wins'
);

const codexHome = path.join(sandbox, 'codex');
assert.equal(
  withEnv({ PLUGIN_DATA: codexHome }, () => pluginDataDir()),
  codexHome,
  'PLUGIN_DATA is used when Claude did not set its own'
);

assert.equal(
  withEnv({ CLAUDE_PLUGIN_DATA: claudeHome, PLUGIN_DATA: codexHome }, () => pluginDataDir()),
  claudeHome,
  'CLAUDE_PLUGIN_DATA takes precedence over PLUGIN_DATA'
);

assert.equal(
  withEnv({ CLAUDE_PLUGIN_DATA: '   ' }, () => pluginDataDir()),
  path.join(os.homedir(), '.excalidraw-architect'),
  'a blank host variable falls back to the home folder'
);

assert.equal(
  withEnv({}, () => pluginDataDir()),
  path.join(os.homedir(), '.excalidraw-architect'),
  'no host variable falls back to the home folder'
);

assert.equal(
  withEnv({ CLAUDE_PLUGIN_DATA: '${CLAUDE_PLUGIN_DATA}' }, () => pluginDataDir()),
  path.join(os.homedir(), '.excalidraw-architect'),
  'a placeholder the host never expanded is not used as a directory name'
);

const tmp = withEnv({ CLAUDE_PLUGIN_DATA: claudeHome }, () => pluginTmpDir());
assert.equal(tmp, path.join(claudeHome, 'tmp'), 'tmp/ sits inside the data folder');
assert.ok(fs.existsSync(tmp), 'pluginTmpDir creates the directory it returns');

// The reason this module exists: no matter what the host tells us, the path
// must never end up inside the repo the agent is drawing about.
for (const hostDir of [claudeHome, '', '${PLUGIN_DATA}']) {
  const resolved = path.resolve(withEnv({ CLAUDE_PLUGIN_DATA: hostDir }, () => pluginDataDir()));
  assert.ok(
    !resolved.startsWith(path.resolve(repoRoot) + path.sep),
    `data folder is outside the repo (CLAUDE_PLUGIN_DATA=${hostDir || 'unset'})`
  );
}

fs.rmSync(sandbox, { recursive: true, force: true });
console.log('data-dir: all assertions passed');
