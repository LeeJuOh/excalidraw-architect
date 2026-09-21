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
  'docs/canvas-guide.md',
  'plugin/skills/archdraw/SKILL.md',
  'plugin/skills/archdraw/scripts/archdraw',
  'plugin/skills/archdraw/agents/openai.yaml',
  'plugin/skills/archdraw/references/canvas-ops.md'
];

const raw = execFileSync('npm', ['pack', '--dry-run', '--json'], {
  encoding: 'utf-8',
  stdio: ['ignore', 'pipe', 'inherit']
});
// npm 10 reports an array of packages, npm 11 an object keyed by name.
const report = JSON.parse(raw);
const [pkg] = Array.isArray(report) ? report : Object.values(report);
const entries = pkg.files.map((file) => file.path);

const missing = REQUIRED.filter((path) => !entries.includes(path));
if (missing.length > 0) {
  console.error('Files missing from the npm tarball:');
  for (const path of missing) console.error(`  - ${path}`);
  console.error('Check "files" in package.json, and that `npm run build` ran first.');
  process.exit(1);
}

console.log(`npm tarball carries all ${REQUIRED.length} required paths (${entries.length} files total).`);
