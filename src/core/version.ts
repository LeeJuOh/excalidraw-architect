import fs from 'fs';
import { fileURLToPath } from 'url';

// Single source of truth for the package identity (MCP server metadata, CLI
// --version and help text): read package.json so it can never drift from npm
// again. The install manifests are generated from the same file
// (scripts/generate-manifests.mjs).
function packageField(field: 'name' | 'version', fallback: string): string {
  try {
    const pkgPath = fileURLToPath(new URL('../../package.json', import.meta.url));
    return JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))[field];
  } catch {
    return fallback;
  }
}

export function packageVersion(): string {
  return packageField('version', 'unknown');
}

/** The published name, which is also the command users type. */
export function packageName(): string {
  return packageField('name', 'excalidraw-architect');
}
