#!/usr/bin/env node
// The archdraw skill is a document, so its acceptance conditions are document
// conditions. This script holds the ones that can drift silently:
//
//   - SKILL.md stays under its line budget (spec 7-4)
//   - the routing table keeps all 21 situations, each with its four fields
//   - the skill never copies the canvas spec: no hex colors, no px, no
//     dimensions — it points at the resource guide://canvas (ADR-0006)
//   - the skill never copies the fixed canvas label strings (ADR-0012)
//   - the replaced upstream skill and its install command stay gone (spec 7-4)

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const skillDir = join(repoRoot, 'plugin', 'skills', 'archdraw');
const read = (...parts) => fs.readFileSync(join(skillDir, ...parts), 'utf-8');

const SKILL_MAX_LINES = 500;
// Spec §1 fixes twenty-one situations. The count lives here once; the prose in
// the skill is checked against it rather than repeating it a third time.
const SITUATION_COUNT = 21;
const SITUATION_COUNT_IN_WORDS = 'twenty-one';

const skill = read('SKILL.md');
const ops = read('references', 'canvas-ops.md');
const routing = read('references', 'routing-table.md');
const zoom = read('references', 'zoom-levels.md');

// The files the agent reads while drawing, by the name a failure should print.
const FILES = {
  'SKILL.md': skill,
  'references/canvas-ops.md': ops,
  'references/routing-table.md': routing,
  'references/zoom-levels.md': zoom
};
// The two the drawing spec must not be copied into.
const DRAWING_FILES = ['SKILL.md', 'references/canvas-ops.md'];

// --- SKILL.md size and invocation contract -------------------------------

// Counted the way `wc -l` counts, so the number printed here matches the one
// anyone checking by hand will see.
const skillLines = skill.split('\n').length - (skill.endsWith('\n') ? 1 : 0);
assert.ok(
  skillLines <= SKILL_MAX_LINES,
  `SKILL.md is ${skillLines} lines, over the ${SKILL_MAX_LINES}-line budget`
);

assert.match(skill, /^disable-model-invocation: true$/m, 'SKILL.md stays manual-only');
assert.match(
  skill,
  /allowed-tools: Bash\(\$\{CLAUDE_SKILL_DIR\}\/scripts\/archdraw \*\)/,
  'SKILL.md keeps the shim allow-list from the plugin skeleton'
);
assert.match(
  skill,
  /batch_create_elements/,
  'SKILL.md tells the agent to look for the MCP tools first'
);
assert.match(
  skill,
  /scripts\/archdraw|canvas-ops\.md/,
  'SKILL.md points at the CLI fallback'
);

// --- The canvas spec lives in one place ----------------------------------

// Shapes of value that belong to docs/canvas-guide.md and must not be copied.
const COPIED_SPEC_PATTERNS = [
  [/#[0-9a-fA-F]{6}\b/, 'a hex color'],
  [/\b\d+\s?px\b/i, 'a px measurement'],
  [/\b\d+\s?x\s?\d+\b/i, 'a pixel dimension'],
  [/"(?:width|height|fontSize)":\s*\d+/, 'a hard-coded size']
];

for (const name of DRAWING_FILES) {
  const text = FILES[name];
  for (const [pattern, what] of COPIED_SPEC_PATTERNS) {
    const hit = text.match(pattern);
    assert.ok(!hit, `${name} carries ${what} (${hit?.[0]}) — that belongs in guide://canvas`);
  }
  assert.match(
    text,
    /guide:\/\/canvas/,
    `${name} does not point at the guide://canvas resource`
  );
}

// Three of ADR-0012's five fixed labels are distinctive enough to grep for.
// The other two ("response:", "inferred") are ordinary English, so they are
// read for, not checked here.
const FIXED_LABELS = ['[sync]', '[async]', 'no evidence:'];
for (const [name, text] of Object.entries(FILES)) {
  for (const label of FIXED_LABELS) {
    assert.ok(
      !text.includes(label),
      `${name} quotes the fixed label "${label}" — point at guide://canvas instead`
    );
  }
}

// --- The routing table ----------------------------------------------------

const situations = [...routing.matchAll(/^### (.+)$/gm)].map((m) => m[1]);
assert.equal(
  situations.length,
  SITUATION_COUNT,
  `routing-table.md has ${situations.length} situations, expected ${SITUATION_COUNT}`
);
assert.equal(new Set(situations).size, situations.length, 'situation names are unique');

for (const name of ['SKILL.md', 'references/routing-table.md']) {
  assert.match(
    FILES[name],
    new RegExp(SITUATION_COUNT_IN_WORDS, 'i'),
    `${name} no longer says how many situations there are (${SITUATION_COUNT_IN_WORDS})`
  );
}

// Every situation carries the four fields the spec fixes for a row. Drawing
// rules are per-row and not required everywhere.
const sections = routing.split(/^### /m).slice(1);
for (const section of sections) {
  const name = section.split('\n', 1)[0];
  for (const field of ['**Question:**', '**Diagram:**', '**Required elements:**', '**Routing exceptions:**']) {
    assert.ok(section.includes(field), `routing row "${name}" has no ${field} line`);
  }
}

// --- Zoom levels ----------------------------------------------------------

for (const level of [
  'System context',
  'Deployment unit',
  'Module boundary',
  'Layer',
  'Boundary type'
]) {
  assert.ok(zoom.includes(level), `zoom-levels.md does not name the level "${level}"`);
}

// --- The replaced upstream skill stays replaced ---------------------------

assert.ok(
  !fs.existsSync(join(repoRoot, 'skills')),
  'the upstream skills/ folder is back — the archdraw skill lives under plugin/skills/'
);

const cliRun = fs.readFileSync(join(repoRoot, 'src', 'cli', 'run.ts'), 'utf-8');
assert.ok(!cliRun.includes('install-skill'), 'the install-skill CLI command is back');
assert.ok(
  !fs.existsSync(join(repoRoot, 'src', 'cli', 'commands', 'install-skill.ts')),
  'src/cli/commands/install-skill.ts is back'
);

console.log(`skill-docs: all assertions passed (SKILL.md ${skillLines} lines, ${situations.length} situations)`);
