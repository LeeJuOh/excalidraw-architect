#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const surveyPath = process.argv[2];
if (!surveyPath) {
  console.error('usage: node scripts/check-survey.mjs <docs/research/surveys/조사표.md>');
  process.exit(2);
}

const repos = readFileSync(join(root, 'docs/research/design-refs.txt'), 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'));

const rows = new Map();
for (const line of readFileSync(surveyPath, 'utf8').split('\n')) {
  if (!line.startsWith('|')) continue;
  const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
  const name = cells[0]?.replace(/`/g, '').split(/\s+/)[0];
  if (name) rows.set(name, cells);
}

const problems = [];
for (const repo of repos) {
  if (!existsSync(join(root, 'references', repo))) problems.push(`${repo}: references/${repo} 없음. 검수 커밋으로 복제한다`);
  const cells = rows.get(repo);
  if (!cells) problems.push(`${repo}: 조사표에 행 없음`);
  else if (cells.length < 4 || cells.slice(1, 4).some((cell) => !cell)) problems.push(`${repo}: 커밋·방식·근거 칸 중 빈 칸`);
}

if (problems.length) {
  console.error(`조사표 미완성 (${problems.length}):\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(`조사표 완성: ${repos.length}곳 모두 행 있음`);
