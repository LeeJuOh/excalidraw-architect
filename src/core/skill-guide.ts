import fs from 'fs';
import { fileURLToPath } from 'url';

export const SKILL_PROMPT_NAME = 'archdraw';
const SKILL_RESOURCE_SCHEME = 'guide://';

const SKILL_DIR = fileURLToPath(new URL('../../plugin/skills/archdraw/', import.meta.url));

export interface SkillGuide {
  readonly body: string;
  readonly description: string;
  readonly references: readonly SkillReference[];
}

export interface SkillReference {
  readonly path: string;
  readonly uri: string;
  readonly title: string | undefined;
  readonly text: string;
}

function fromSkillDir<T>(relativePath: string, read: (path: string) => T): T {
  const path = `${SKILL_DIR}${relativePath}`;
  try {
    return read(path);
  } catch (error) {
    throw new Error(
      `Skill folder file missing at ${path}: ${error instanceof Error ? error.message : String(error)}. ` +
        'It ships with the package ("files" in package.json); reinstall or rebuild rather than running without it.'
    );
  }
}

const readText = (relativePath: string) => fromSkillDir(relativePath, path => fs.readFileSync(path, 'utf-8'));

function listFiles(relativeDir: string): string[] {
  const entries = fromSkillDir(relativeDir, path => fs.readdirSync(path, { withFileTypes: true }));
  return entries.flatMap(entry => {
    const path = `${relativeDir}/${entry.name}`;
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

function readReferences(): SkillReference[] {
  return listFiles('references')
    .sort()
    .map(path => {
      const text = readText(path);
      return { path, uri: `${SKILL_RESOURCE_SCHEME}${path}`, title: /^# (.+)$/m.exec(text)?.[1], text };
    });
}

function readSkill(): SkillGuide {
  const text = readText('SKILL.md');
  const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!frontmatter) throw new Error(`SKILL.md in ${SKILL_DIR} has no frontmatter.`);
  const description = /^description:\s*(.+)$/m.exec(frontmatter[1] ?? '')?.[1] ?? '';
  return { body: text.slice(frontmatter[0].length), description, references: readReferences() };
}

let cached: SkillGuide | null = null;

export function skillGuide(): SkillGuide {
  if (!cached) cached = readSkill();
  return cached;
}
