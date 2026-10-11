import fs from 'fs';
import path from 'path';

export const EVIDENCE_TAGS = ['code', 'design', 'log'] as const;
export type EvidenceTag = typeof EVIDENCE_TAGS[number];

export interface Evidence {
  tag: EvidenceTag;
  path?: string;
  quote?: string;
}

export interface EvidenceProblem {
  id: string;
  type: string;
  path?: unknown;
  quote?: unknown;
  reason: string;
}

interface EvidenceCarrier {
  id: string;
  type: string;
  evidence?: unknown;
}

// Whitespace is dropped on both sides, so a multi-line call quoted on one line
// with no space at the break still matches.
function stripWhitespace(text: string): string {
  return text.replace(/\s+/g, '');
}

function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  for (let at = haystack.indexOf(needle); at !== -1; at = haystack.indexOf(needle, at + 1)) count++;
  return count;
}

function isInsideOrRoot(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

// Lower case: on a case-insensitive disk `.GIT/config` opens `.git/config`.
function hasGitSegment(relative: string): boolean {
  return relative.split(/[\\/]+/).some(segment => segment.toLowerCase() === '.git');
}

function shapeProblem(evidence: unknown): string | null {
  if (typeof evidence !== 'object' || evidence === null || Array.isArray(evidence)) {
    return 'evidence must be an object {tag, path, quote}';
  }
  const { tag, path: file, quote } = evidence as Record<string, unknown>;
  if (!EVIDENCE_TAGS.includes(tag as EvidenceTag)) {
    return `tag must be one of ${EVIDENCE_TAGS.join(', ')}`;
  }
  if (file !== undefined && typeof file !== 'string') return 'path must be a string';
  if (quote !== undefined && typeof quote !== 'string') return 'quote must be a string';
  if (tag === 'code') {
    if (typeof file !== 'string' || file.trim() === '') return 'code evidence needs a path';
    if (typeof quote !== 'string' || stripWhitespace(quote) === '') return 'code evidence needs a quote';
  }
  return null;
}

function codeProblem(projectRoot: string, file: string, quote: string): string | null {
  if (path.isAbsolute(file) || /^[a-zA-Z]:/.test(file)) {
    return 'path must be relative to the project root';
  }
  if (file.split(/[\\/]+/).includes('..')) return 'path must stay inside the project root';
  if (hasGitSegment(file)) return 'path must not point into .git';

  const root = fs.realpathSync(projectRoot);
  let target: string;
  try {
    target = fs.realpathSync(path.join(root, file));
  } catch {
    return 'the file does not exist';
  }
  if (!isInsideOrRoot(root, target)) return 'path must stay inside the project root (it is a link to outside)';
  if (hasGitSegment(path.relative(root, target))) return 'path must not point into .git';
  if (!fs.statSync(target).isFile()) return 'path is not a file';

  let text: string;
  try {
    text = fs.readFileSync(target, 'utf-8');
  } catch {
    return 'the file cannot be read';
  }
  const count = countOccurrences(stripWhitespace(text), stripWhitespace(quote));
  if (count === 0) return 'the quote is not in the file';
  if (count > 1) {
    return `the quote is in the file ${count} times; narrow it to one place by adding the text right next to it`;
  }
  return null;
}

export function findEvidenceProblems(elements: EvidenceCarrier[], projectRoot: string): EvidenceProblem[] {
  const problems: EvidenceProblem[] = [];
  for (const element of elements) {
    if (element.evidence === undefined || element.evidence === null) continue;
    const evidence = element.evidence as Record<string, unknown>;
    const reason = shapeProblem(evidence) ??
      (evidence.tag === 'code' ? codeProblem(projectRoot, evidence.path as string, evidence.quote as string) : null);
    if (reason) {
      problems.push({ id: element.id, type: element.type, path: evidence.path, quote: evidence.quote, reason });
    }
  }
  return problems;
}

function describeProblem(problem: EvidenceProblem): string {
  const parts = [`${problem.type} ${problem.id}`];
  if (problem.path !== undefined) parts.push(`path ${JSON.stringify(problem.path)}`);
  if (problem.quote !== undefined) parts.push(`quote ${JSON.stringify(problem.quote)}`);
  return `- ${parts.join(', ')}: ${problem.reason}`;
}

export function describeStaleEvidence(problems: EvidenceProblem[]): string {
  if (problems.length === 0) return '';
  return [
    `Evidence no longer checks out for ${problems.length} element(s); they were placed as saved:`,
    ...problems.map(describeProblem)
  ].join('\n') + '\n\n';
}

export function assertEvidence(elements: EvidenceCarrier[], projectRoot: string): void {
  const problems = findEvidenceProblems(elements, projectRoot);
  if (problems.length === 0) return;
  throw new Error([
    `Evidence check failed for ${problems.length} element(s); nothing was created or changed.`,
    ...problems.map(describeProblem),
    'Fix each one in one of two ways: correct the quote so it is code text that appears exactly once in that file, ' +
    'or, if you cannot confirm the relationship in code, remove the code evidence and draw it as an inferred dashed line.'
  ].join('\n'));
}
