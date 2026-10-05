#!/usr/bin/env node
// The archdraw skill is a document, so its acceptance conditions are document
// conditions. This script holds the ones that can drift silently:
//
//   - SKILL.md stays under its line budget (spec 7-4)
//   - the routing index lists all 23 situations, and each one has its own
//     document with the four fields (spec §1, index and per-situation documents)
//   - the skill never copies the canvas spec: no hex colors, no px, no
//     dimensions — it points at the resource guide://canvas (ADR-0006)
//   - the skill never copies the fixed canvas label strings (ADR-0012)
//   - the replaced upstream skill and its install command stay gone (spec 7-4)
//   - the canvas session steps are there and the upstream single-server
//     hints stay gone (issue 04)

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const skillDir = join(repoRoot, 'plugin', 'skills', 'archdraw');
const read = (...parts) => fs.readFileSync(join(skillDir, ...parts), 'utf-8');

const SKILL_MAX_LINES = 500;
// Spec §1 fixes twenty-three situations. The count lives here once; the prose
// in the skill is checked against it rather than repeating it a third time.
const SITUATION_COUNT = 23;
const SITUATION_COUNT_IN_WORDS = 'twenty-three';

const skill = read('SKILL.md');
const ops = read('references', 'canvas-ops.md');
const routing = read('references', 'routing-table.md');
const zoom = read('references', 'zoom-levels.md');
const saving = read('references', 'saving.md');

const situationFiles = fs
  .readdirSync(join(skillDir, 'references', 'situations'))
  .filter((file) => file.endsWith('.md'));

// The files the agent reads while drawing, by the name a failure should print.
const FILES = {
  'SKILL.md': skill,
  'references/canvas-ops.md': ops,
  'references/routing-table.md': routing,
  'references/zoom-levels.md': zoom,
  'references/saving.md': saving,
  ...Object.fromEntries(
    situationFiles.map((file) => [`references/situations/${file}`, read('references', 'situations', file)])
  )
};
// The two the agent draws from, so they must point at the drawing spec.
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

for (const [name, text] of Object.entries(FILES)) {
  for (const [pattern, what] of COPIED_SPEC_PATTERNS) {
    const hit = text.match(pattern);
    assert.ok(!hit, `${name} carries ${what} (${hit?.[0]}) — that belongs in guide://canvas`);
  }
}

for (const name of DRAWING_FILES) {
  const text = FILES[name];
  assert.match(
    text,
    /guide:\/\/canvas/,
    `${name} does not point at the guide://canvas resource`
  );
  // A skill-only install has no MCP server to read that resource from; the
  // CLI command is its way to the same text (issue 09).
  assert.match(
    text,
    /scripts\/archdraw guide\b/,
    `${name} does not name the CLI \`guide\` command for installs without the MCP server`
  );
}

// The fixed labels distinctive enough to grep for: three of ADR-0012's five,
// and the change-status labels (ADR-0015). The other two ("response:",
// "inferred") are ordinary English, so they are read for, not checked here.
const FIXED_LABELS = ['[sync]', '[async]', 'no evidence:', '[added]', '[removed]', '[modified]'];
for (const [name, text] of Object.entries(FILES)) {
  for (const label of FIXED_LABELS) {
    assert.ok(
      !text.includes(label),
      `${name} quotes the fixed label "${label}" — point at guide://canvas instead`
    );
  }
}

// --- The routing index and the situation documents ------------------------

// An index entry: `- [Name](situations/file.md) — Question?`
const situations = [...routing.matchAll(/^- \[(.+?)\]\(situations\/(.+?\.md)\) — (.+)$/gm)].map(
  ([, name, file, question]) => ({ name, file, question })
);
assert.equal(
  situations.length,
  SITUATION_COUNT,
  `routing-table.md lists ${situations.length} situations, expected ${SITUATION_COUNT}`
);
assert.equal(new Set(situations.map((s) => s.name)).size, situations.length, 'situation names are unique');
assert.deepEqual(
  [...situationFiles].sort(),
  situations.map((s) => s.file).sort(),
  'references/situations/ holds exactly one document per index entry'
);

for (const name of ['SKILL.md', 'references/routing-table.md']) {
  assert.match(
    FILES[name],
    new RegExp(SITUATION_COUNT_IN_WORDS, 'i'),
    `${name} no longer says how many situations there are (${SITUATION_COUNT_IN_WORDS})`
  );
}

const oneLine = (text) => text.replace(/\s+/g, ' ').trim();

// Every situation document carries the four fields the spec fixes for a row,
// and the index repeats its question word for word. Drawing rules are
// per-situation and not required everywhere.
for (const { name, file, question } of situations) {
  const doc = FILES[`references/situations/${file}`];
  assert.match(doc, new RegExp(`^# ${name}$`, 'm'), `situations/${file} is not titled "${name}"`);
  for (const field of ['**Question:**', '**Diagram:**', '**Required elements:**', '**Routing exceptions:**']) {
    assert.ok(doc.includes(field), `situations/${file} has no ${field} line`);
  }
  const docQuestion = oneLine(doc.split('**Question:**')[1].split('\n\n')[0]);
  assert.equal(question, docQuestion, `the index question for "${name}" differs from situations/${file}`);
}

// --- Saving ---------------------------------------------------------------

assert.match(skill, /references\/saving\.md/, 'SKILL.md does not point at references/saving.md');
assert.match(skill, /\*\*The save-state line\.\*\*/, 'the save-state line paragraph left SKILL.md');

// --- Canvas sessions (issue 04) -------------------------------------------

// The agent always names the project and the session; nothing is guessed from
// a working directory or a fixed port (ADR-0003).
assert.match(skill, /session_start/, 'SKILL.md does not open a canvas session with session_start');
assert.match(skill, /projectPath/, 'SKILL.md does not pass projectPath to session_start');
assert.match(ops, /session start --project/, 'canvas-ops.md does not run `session start --project`');
assert.match(ops, /--session <key>/, 'canvas-ops.md does not carry `--session <key>`');

const UPSTREAM_SERVER_HINTS = [
  [/127\.0\.0\.1:3000|\b3000\b/, 'the fixed upstream port 3000'],
  [/EXPRESS_SERVER_URL/, 'EXPRESS_SERVER_URL'],
  [/EXCALIDRAW_NO_AUTOSTART/, 'EXCALIDRAW_NO_AUTOSTART'],
  [/from this skill's folder/, "\"from this skill's folder\""],
  [/`session attach`/, 'a CLI `session attach` command']
];
for (const name of DRAWING_FILES) {
  for (const [pattern, what] of UPSTREAM_SERVER_HINTS) {
    assert.ok(!pattern.test(FILES[name]), `${name} mentions ${what} — canvas sessions replaced it (ADR-0003)`);
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
