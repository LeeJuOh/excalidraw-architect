import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { ServerElement } from '../types.js';
import { pluginDataDir } from './data-dir.js';

export interface SnapshotInfo {
  name: string;
  path: string;
  elementCount: number;
  createdAt: string;
  // Set when the file cannot be read as a snapshot; the entry still lists so
  // one broken file never hides the rest.
  error?: string;
}

export class SnapshotNameError extends Error {}

export class SnapshotExistsError extends Error {
  constructor(public readonly existing: SnapshotInfo) {
    super(
      `Snapshot "${existing.name}" already exists (created ${existing.createdAt}) at ${existing.path}. ` +
      'Overwrite only with --force (CLI) or force: true (MCP).'
    );
  }
}

// `<folder name>-<hash>` so a human can tell the folders apart; the hash keeps
// two projects with the same folder name separate. Moving or renaming the
// project changes the hash, so its old snapshots must be moved by hand.
export function projectSnapshotsDir(projectRoot: string): string {
  const hash = crypto.createHash('sha256').update(projectRoot).digest('hex').slice(0, 8);
  return path.join(pluginDataDir(), 'snapshots', `${path.basename(projectRoot)}-${hash}`);
}

function snapshotPath(projectRoot: string, name: string): string {
  if (!name || name === '.' || name === '..' || /[/\\\0]/.test(name)) {
    throw new SnapshotNameError(`Invalid snapshot name "${name}": use a plain name without path separators`);
  }
  return path.join(projectSnapshotsDir(projectRoot), `${name}.excalidraw`);
}

function readElements(file: string): ServerElement[] {
  return JSON.parse(fs.readFileSync(file, 'utf-8')).elements ?? [];
}

function readWithInfo(name: string, file: string): SnapshotInfo & { elements: ServerElement[] } {
  const elements = readElements(file);
  return { name, path: file, elementCount: elements.length, createdAt: fs.statSync(file).mtime.toISOString(), elements };
}

function infoOf(name: string, file: string): SnapshotInfo {
  const { elements: _elements, ...info } = readWithInfo(name, file);
  return info;
}

function listedInfoOf(name: string, file: string): SnapshotInfo {
  try {
    return infoOf(name, file);
  } catch (error) {
    let createdAt = '';
    try { createdAt = fs.statSync(file).mtime.toISOString(); } catch { /* gone since readdir */ }
    return {
      name,
      path: file,
      elementCount: 0,
      createdAt,
      error: `Cannot read snapshot: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

export function saveSnapshot(
  projectRoot: string,
  name: string,
  elements: ServerElement[],
  force: boolean
): SnapshotInfo {
  const file = snapshotPath(projectRoot, name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const scene = { type: 'excalidraw', version: 2, source: 'excalidraw-architect-snapshot', elements };
  try {
    fs.writeFileSync(file, JSON.stringify(scene, null, 2), { encoding: 'utf-8', flag: force ? 'w' : 'wx' });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw new SnapshotExistsError(infoOf(name, file));
    throw error;
  }
  return infoOf(name, file);
}

export function listSnapshots(projectRoot: string): SnapshotInfo[] {
  const dir = projectSnapshotsDir(projectRoot);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.excalidraw'))
    .map(f => listedInfoOf(f.slice(0, -'.excalidraw'.length), path.join(dir, f)))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.name.localeCompare(b.name));
}

export function readSnapshot(projectRoot: string, name: string): (SnapshotInfo & { elements: ServerElement[] }) | undefined {
  const file = snapshotPath(projectRoot, name);
  if (!fs.existsSync(file)) return undefined;
  return readWithInfo(name, file);
}
