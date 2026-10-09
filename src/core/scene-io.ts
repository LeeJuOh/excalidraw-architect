import fs from 'fs';
import path from 'path';
import { generateId, ServerElement } from '../types.js';
import {
  getElements,
  getFiles,
  postFiles,
  batchCreateElementsOnCanvas,
  recordSave
} from './canvas-client.js';
import { isObsidianExcalidrawMd, extractSceneJsonFromObsidianMd } from './obsidian-md.js';
import { expandElementsForExport } from './expand-elements.js';
import { FRAME_MARGIN, elementBounds, fitFrame, frameMembers, union } from './frames.js';

function createdAt(file: string): string {
  try { return fs.statSync(file).mtime.toISOString(); } catch { return 'unknown'; }
}

export class OutputFileExistsError extends Error {
  constructor(file: string) {
    super(
      `File already exists (created ${createdAt(file)}) at ${file}. ` +
      'Overwrite only with --force (CLI) or force: true (MCP).'
    );
  }
}

const WRITABLE_TYPES = ['.excalidraw', '.excalidraw.md', '.png', '.svg'];
const READABLE_TYPES = ['.excalidraw', '.excalidraw.md', '.json'];

function assertFileType(file: string, allowed: string[], action: string): void {
  if (!allowed.some(ext => file.toLowerCase().endsWith(ext))) {
    throw new Error(`Cannot ${action} ${file}: only ${allowed.join(', ')} files are allowed.`);
  }
}

export function writeOutputFile(file: string, data: string | Buffer, force: boolean): void {
  assertFileType(file, WRITABLE_TYPES, 'write');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  try {
    fs.writeFileSync(file, data, { flag: force ? 'w' : 'wx' });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw new OutputFileExistsError(file);
    throw error;
  }
}

function findFrame(elements: Record<string, any>[], nameOrId: string): Record<string, any> {
  const frames = elements.filter(el => el.type === 'frame');
  const byId = frames.find(el => el.id === nameOrId);
  if (byId) return byId;
  const named = frames.filter(el => el.name === nameOrId);
  if (named.length === 1) return named[0]!;
  if (named.length > 1) {
    throw new Error(
      `${named.length} frames are named "${nameOrId}" (ids ${named.map(el => el.id).join(', ')}). Pass one of the ids instead.`
    );
  }
  const known = frames.map(el => `"${el.name ?? ''}" (${el.id})`).join(', ') || 'none';
  throw new Error(`No frame named "${nameOrId}" or with that id. Frames on the canvas: ${known}.`);
}

// Bindings to elements left out are cut so the file opens on its own.
function onlyFrame(elements: Record<string, any>[], frameId: string): Record<string, any>[] {
  const store = new Map(elements.map(el => [el.id, el as ServerElement]));
  const kept = new Set([frameId, ...frameMembers(frameId, store).map(el => el.id)]);
  const inFile = (binding: any) => (binding && kept.has(binding.elementId) ? binding : null);
  return elements.filter(el => kept.has(el.id)).map(el => {
    const copy = { ...el };
    if ('startBinding' in copy) copy.startBinding = inFile(copy.startBinding);
    if ('endBinding' in copy) copy.endBinding = inFile(copy.endBinding);
    if (copy.containerId && !kept.has(copy.containerId)) copy.containerId = null;
    if (Array.isArray(copy.boundElements)) {
      const bound = copy.boundElements.filter((b: any) => kept.has(b?.id));
      copy.boundElements = bound.length > 0 ? bound : null;
    }
    return copy;
  });
}

export interface ExportedScene {
  scene: Record<string, any>;
  elementCount: number;
  // Absent for the whole canvas.
  frameIds?: string[];
  canvasElements: ServerElement[];
}

// Build a .excalidraw scene JSON from the current canvas state.
// Elements are expanded from the agent format (label/start/end) into real
// Excalidraw elements (bound text pairs, arrow bindings) so the file renders
// fully on excalidraw.com and in the Obsidian Excalidraw plugin — with
// deterministic ids/seeds so re-exporting an unchanged scene is byte-stable.
export async function buildSceneFile(options: { frame?: string } = {}): Promise<ExportedScene> {
  const sceneElements = await getElements();
  const expanded = expandElementsForExport(sceneElements, { deterministic: true });
  const frameId = options.frame ? findFrame(expanded, options.frame).id : undefined;
  const exportElements = frameId ? onlyFrame(expanded, frameId) : expanded;

  // Fetch files for image elements
  let sceneFiles: Record<string, any> = {};
  try {
    sceneFiles = await getFiles();
  } catch { /* files endpoint may not exist */ }
  if (options.frame) {
    const fileIds = new Set(exportElements.map(el => el.fileId).filter(Boolean));
    sceneFiles = Object.fromEntries(Object.entries(sceneFiles).filter(([id]) => fileIds.has(id)));
  }

  const excalidrawScene: Record<string, any> = {
    type: 'excalidraw',
    version: 2,
    source: 'mcp-excalidraw-server',
    elements: exportElements,
    appState: {
      viewBackgroundColor: '#ffffff',
      gridSize: null
    },
    ...(Object.keys(sceneFiles).length > 0 ? { files: sceneFiles } : {})
  };

  return { scene: excalidrawScene, elementCount: exportElements.length, frameIds: frameId ? [frameId] : undefined, canvasElements: sceneElements };
}

const COPY_SUFFIX = ' (복사)';
const ELEMENT_LINK = /([?&#]element=)([^&#]+)/;

function withNewIds(elements: Record<string, any>[]): Record<string, any>[] {
  const ids = new Map<string, string>();
  for (const el of elements) if (el.id) ids.set(el.id, generateId());
  const groups = new Map<string, string>();
  const newIdOf = (id: unknown): string | null => (typeof id === 'string' && ids.get(id)) || null;

  return elements.map(el => {
    const { index: _index, ...copy } = el;
    copy.id = newIdOf(el.id) ?? generateId();
    if ('frameId' in el) copy.frameId = newIdOf(el.frameId);
    if ('containerId' in el) copy.containerId = newIdOf(el.containerId);
    for (const key of ['startBinding', 'endBinding']) {
      if (el[key]) copy[key] = newIdOf(el[key].elementId) ? { ...el[key], elementId: newIdOf(el[key].elementId) } : null;
    }
    for (const key of ['start', 'end']) {
      if (!el[key]) continue;
      if (newIdOf(el[key].id)) copy[key] = { ...el[key], id: newIdOf(el[key].id) };
      else delete copy[key];
    }
    if (Array.isArray(el.boundElements)) {
      const bound = el.boundElements
        .filter((b: any) => newIdOf(b?.id))
        .map((b: any) => ({ ...b, id: newIdOf(b.id) }));
      copy.boundElements = bound.length > 0 ? bound : null;
    }
    if (Array.isArray(el.groupIds)) {
      copy.groupIds = el.groupIds.map((group: string) => {
        if (!groups.has(group)) groups.set(group, generateId());
        return groups.get(group)!;
      });
    }
    if (typeof el.link === 'string') {
      copy.link = el.link.replace(ELEMENT_LINK, (match: string, prefix: string, id: string) =>
        newIdOf(id) ? prefix + newIdOf(id) : match);
    }
    return copy;
  });
}

const isNamed = (frame: Record<string, any>): boolean => typeof frame.name === 'string' && frame.name !== '';

function nameCopies(copies: Record<string, any>[]): Record<string, any>[] {
  const frames = copies.filter(el => el.type === 'frame');
  if (frames.length > 0) {
    for (const frame of frames) if (isNamed(frame)) frame.name += COPY_SUFFIX;
    return copies;
  }
  const frame = { id: generateId(), type: 'frame', name: null, x: 0, y: 0 } as ServerElement;
  for (const el of copies) el.frameId = frame.id;
  fitFrame(frame, copies as ServerElement[]);
  return [frame, ...copies];
}

// Top-aligned with what is already there.
function placeBeside(copies: Record<string, any>[], existing: ServerElement[]): void {
  const here = union(existing.map(elementBounds));
  const incoming = union(copies.map(el => elementBounds(el as ServerElement)));
  if (!here || !incoming) return;
  const dx = here.maxX + FRAME_MARGIN * 2 - incoming.minX;
  const dy = here.minY - incoming.minY;
  for (const el of copies) {
    el.x += dx;
    el.y += dy;
  }
}

export interface ImportResult {
  count: number;
  fileCount: number;
  frames: { id: string; name: string | null }[];
  unnamedFrames: string[];
}

// Loads a .excalidraw JSON file, an Obsidian .excalidraw.md file, or raw JSON
// data as an independent copy on top of the canvas (ADR-0007).
export async function importScene(options: {
  filePath?: string;
  data?: string;
}): Promise<ImportResult> {
  let raw: string;
  if (options.filePath) {
    assertFileType(options.filePath, READABLE_TYPES, 'import');
    raw = fs.readFileSync(options.filePath, 'utf-8');
  } else if (options.data) {
    raw = options.data;
  } else {
    throw new Error('Either filePath or data must be provided');
  }
  if (isObsidianExcalidrawMd(raw)) {
    raw = extractSceneJsonFromObsidianMd(raw);
  }
  const sceneData: any = JSON.parse(raw);

  // Extract elements from .excalidraw format or raw array
  const importElements: ServerElement[] = Array.isArray(sceneData)
    ? sceneData
    : (sceneData.elements || []);

  if (importElements.length === 0) {
    throw new Error('No elements found in the import data');
  }

  const copies = nameCopies(withNewIds(importElements));
  placeBeside(copies, await getElements());
  const now = new Date().toISOString();
  const elementsToCreate = copies.map(el => ({
    ...el,
    createdAt: now,
    updatedAt: now,
    version: 1
  })) as ServerElement[];

  const created = await batchCreateElementsOnCanvas(elementsToCreate);
  if (!created) {
    throw new Error('Import failed: canvas rejected the batch create (nothing was added)');
  }

  // Import files if present (for image elements)
  let importedFileCount = 0;
  const importFiles = sceneData.files;
  if (importFiles && typeof importFiles === 'object') {
    const fileList = Object.values(importFiles);
    if (fileList.length > 0) {
      try {
        await postFiles(fileList);
        importedFileCount = fileList.length;
      } catch { /* best effort */ }
    }
  }

  const frames = elementsToCreate.filter(el => el.type === 'frame');
  if (options.filePath) await recordSave(options.filePath, frames.map(frame => frame.id));
  return {
    count: elementsToCreate.length,
    fileCount: importedFileCount,
    frames: frames.map(frame => ({ id: frame.id, name: frame.name ?? null })),
    unnamedFrames: frames.filter(frame => !isNamed(frame)).map(frame => frame.id)
  };
}
