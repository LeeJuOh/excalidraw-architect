import fs from 'fs';
import path from 'path';
import { generateId, ServerElement } from '../types.js';
import {
  getElements,
  getFiles,
  postFiles,
  clearCanvas,
  batchCreateElementsOnCanvas
} from './canvas-client.js';
import { isObsidianExcalidrawMd, extractSceneJsonFromObsidianMd } from './obsidian-md.js';
import { expandElementsForExport } from './expand-elements.js';
import { frameMembers } from './frames.js';

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

export function writeOutputFile(file: string, data: string | Buffer, force: boolean): void {
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
}

// Build a .excalidraw scene JSON from the current canvas state.
// Elements are expanded from the agent format (label/start/end) into real
// Excalidraw elements (bound text pairs, arrow bindings) so the file renders
// fully on excalidraw.com and in the Obsidian Excalidraw plugin — with
// deterministic ids/seeds so re-exporting an unchanged scene is byte-stable.
export async function buildSceneFile(options: { frame?: string } = {}): Promise<ExportedScene> {
  const sceneElements = await getElements();
  const expanded = expandElementsForExport(sceneElements, { deterministic: true });
  const exportElements = options.frame
    ? onlyFrame(expanded, findFrame(expanded, options.frame).id)
    : expanded;

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

  return { scene: excalidrawScene, elementCount: exportElements.length };
}

export interface ImportResult {
  count: number;
  fileCount: number;
  mode: 'replace' | 'merge';
}

// Import elements from a .excalidraw JSON file, an Obsidian .excalidraw.md
// file, or raw JSON data
export async function importScene(options: {
  filePath?: string;
  data?: string;
  mode: 'replace' | 'merge';
}): Promise<ImportResult> {
  let raw: string;
  if (options.filePath) {
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

  // If replace mode, clear first
  if (options.mode === 'replace') {
    await clearCanvas();
  }

  // Batch create the imported elements
  const elementsToCreate = importElements.map(el => ({
    ...el,
    id: el.id || generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1
  }));

  const created = await batchCreateElementsOnCanvas(elementsToCreate);
  if (!created) {
    // Especially important in replace mode: the canvas was already cleared,
    // so a silently swallowed failure here would report success on data loss
    throw new Error('Import failed: canvas rejected the batch create (elements were not restored)');
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

  return { count: elementsToCreate.length, fileCount: importedFileCount, mode: options.mode };
}
