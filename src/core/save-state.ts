import crypto from 'crypto';
import fs from 'fs';
import { ServerElement } from '../types.js';
import { frameMembers } from './frames.js';

export type DrawingState = 'saved' | 'modified' | 'unsaved' | 'missing';

export interface DrawingSaveState {
  // null is the loose-element group (elements outside every frame).
  id: string | null;
  name: string | null;
  state: DrawingState;
  path?: string;
  savedAt?: string;
  elements?: number;
}

export interface SaveState {
  drawings: DrawingSaveState[];
  snapshot: { name: string; savedAt: string; changedSince: boolean } | null;
}

interface SaveRecord { path: string; savedAt: string; hash: string }

const drawingSaves = new Map<string | null, SaveRecord>();
let lastSnapshot: { name: string; savedAt: string; hash: string } | null = null;

const STAMP_FIELDS = new Set(['syncedAt', 'syncTimestamp', 'source', 'version', 'createdAt', 'updatedAt', 'versionNonce', 'updated']);

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical((value as any)[key])]));
  }
  return value;
}

function contentHash(group: ServerElement[]): string {
  const stripped = [...group]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(el => Object.fromEntries(Object.entries(el).filter(([key]) => !STAMP_FIELDS.has(key))));
  return crypto.createHash('sha256').update(JSON.stringify(canonical(stripped))).digest('hex');
}

interface DrawingGroup { id: string | null; name: string | null; content: ServerElement[] }

function drawingGroups(elements: Map<string, ServerElement>): DrawingGroup[] {
  const framed = new Set<string>();
  const groups: DrawingGroup[] = [...elements.values()].filter(el => el.type === 'frame').map(frame => {
    const content = [frame, ...frameMembers(frame.id, elements)];
    for (const el of content) framed.add(el.id);
    return { id: frame.id, name: frame.name ?? null, content };
  });
  const loose = [...elements.values()].filter(el => !framed.has(el.id));
  if (loose.length > 0) groups.push({ id: null, name: null, content: loose });
  return groups;
}

function stateOf(record: SaveRecord, content: ServerElement[]): DrawingState {
  if (!fs.existsSync(record.path)) return 'missing';
  return contentHash(content) === record.hash ? 'saved' : 'modified';
}

// A file was just written at `savedPath` holding these frames (all drawings
// and the loose group when `frameIds` is absent).
export function recordSave(elements: Map<string, ServerElement>, savedPath: string, frameIds?: string[]): void {
  const savedAt = new Date().toISOString();
  for (const group of drawingGroups(elements)) {
    if (frameIds && !frameIds.includes(group.id as string)) continue;
    drawingSaves.set(group.id, { path: savedPath, savedAt, hash: contentHash(group.content) });
  }
}

export function recordSnapshot(elements: Map<string, ServerElement>, name: string, savedAt: string): void {
  lastSnapshot = { name, savedAt, hash: contentHash([...elements.values()]) };
}

export function saveStateReport(elements: Map<string, ServerElement>): SaveState {
  const drawings = drawingGroups(elements).map(({ id, name, content }): DrawingSaveState => {
    const base = id === null ? { id, name, elements: content.length } : { id, name };
    const record = drawingSaves.get(id);
    if (!record) return { ...base, state: 'unsaved' };
    return { ...base, state: stateOf(record, content), path: record.path, savedAt: record.savedAt };
  });
  const snapshot = lastSnapshot && {
    name: lastSnapshot.name,
    savedAt: lastSnapshot.savedAt,
    changedSince: contentHash([...elements.values()]) !== lastSnapshot.hash
  };
  return { drawings, snapshot };
}
