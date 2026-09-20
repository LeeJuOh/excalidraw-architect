#!/usr/bin/env node
// The published tarball is the only way a user's machine gets a server: the
// shim runs `npx -y excalidraw-architect@<version>` (ADR-0002). If the server
// bin or the built frontend falls out of `files`, every install channel breaks
// at the same time, so assert the tarball contents here.
//
// Run after `npm run build` — `npm pack` does not build (prepublishOnly only
// runs on publish).

import { execFileSync } from 'node:child_process';

const REQUIRED = [
  'dist/bin.js',
  'dist/index.js',
  'dist/server.js',
  'dist/frontend/index.html',
  'skills/archdraw/SKILL.md',
  'skills/archdraw/scripts/archdraw',
  'skills/archdraw/agents/openai.yaml',
  'skills/archdraw/references/canvas-ops.md'
];

const raw = execFileSync('npm', ['pack', '--dry-run', '--json'], {
  encoding: 'utf-8',
  stdio: ['ignore', 'pipe', 'inherit']
});
const entries = JSON.parse(raw)[0].files.map((file) => file.path);

const missing = REQUIRED.filter((path) => !entries.includes(path));
if (missing.length > 0) {
  console.error('Files missing from the npm tarball:');
  for (const path of missing) console.error(`  - ${path}`);
  console.error('Check "files" in package.json, and that `npm run build` ran first.');
  process.exit(1);
}

console.log(`npm tarball carries all ${REQUIRED.length} required paths (${entries.length} files total).`);
