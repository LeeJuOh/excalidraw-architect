#!/usr/bin/env node
// POSIX only: os.homedir() follows HOME there, which is how this pins the home folder.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path, { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const { pluginDataDir } = await import(
  pathToFileURL(join(repoRoot, 'dist', 'core', 'data-dir.js')).href
);

const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'archdraw-data-dir-'));
const home = path.join(sandbox, 'home');
const ENV_KEYS = ['HOME', 'CLAUDE_PLUGIN_DATA', 'PLUGIN_DATA'];
const original = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

function withEnv(env, fn) {
  for (const key of ENV_KEYS) delete process.env[key];
  process.env.HOME = home;
  for (const [key, value] of Object.entries(env)) process.env[key] = value;
  try {
    return fn();
  } finally {
    for (const key of ENV_KEYS) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  }
}

assert.equal(
  withEnv(
    {
      CLAUDE_PLUGIN_DATA: `${sandbox}/claude/plugins/data/codex-openai-codex`,
      PLUGIN_DATA: `${sandbox}/codex/plugins/data/other`
    },
    () => pluginDataDir()
  ),
  `${sandbox}/home/.excalidraw-architect`,
  "another plugin's host variables do not move the data folder"
);

assert.equal(
  withEnv({}, () => pluginDataDir()),
  `${sandbox}/home/.excalidraw-architect`,
  'without host variables the data folder is still ~/.excalidraw-architect'
);

fs.rmSync(sandbox, { recursive: true, force: true });
console.log('data-dir: all assertions passed');
