import logger from '../utils/logger.js';
import { ServerElement } from '../types.js';
import { ENABLE_CANVAS_SYNC } from './config.js';
import { CANVAS_SERVICE_NAME, CanvasHealth } from './sessions.js';

// The canvas session every request goes to. The CLI sets it from --session,
// the MCP process from session_start / session_attach. There is no default.
export interface CanvasTarget {
  key: string;
  url: string;
}

let target: CanvasTarget | null = null;
// How to get a canvas back, worded for the caller's path (CLI or MCP).
let restartHint = '`session start --project <path>`';

export function setCanvasTarget(next: CanvasTarget | null): void {
  target = next;
  identityVerifiedAt = 0;
}

export function setRestartHint(hint: string): void {
  restartHint = hint;
}

function currentTarget(): CanvasTarget {
  if (!target) {
    const error = new Error(`No canvas session is selected. Start one with ${restartHint}.`);
    (error as any).code = 'CANVAS_UNREACHABLE';
    throw error;
  }
  return target;
}

export function canvasUrl(): string {
  return currentTarget().url;
}

export function unreachableError(reason: string): Error {
  const { key, url } = currentTarget();
  const error = new Error(
    `The canvas server of session ${key} is not reachable at ${url} (${reason}). ` +
    `Start a new canvas session with ${restartHint} and give the user its URL.`
  );
  (error as any).code = 'CANVAS_UNREACHABLE';
  return error;
}

// fetch() against the selected canvas; a refused connection becomes the
// unreachable error that says how to start a new canvas session.
async function canvasFetch(pathname: string, init?: RequestInit): Promise<Response> {
  const url = `${canvasUrl()}${pathname}`;
  try {
    return await fetch(url, init);
  } catch (error) {
    const name = (error as { name?: string }).name;
    if (name === 'TimeoutError' || name === 'AbortError') throw error;
    const cause = (error as { cause?: { code?: string } }).cause;
    throw unreachableError(cause?.code ?? (error as Error).message);
  }
}

// API Response types
export interface ApiResponse {
  success: boolean;
  element?: ServerElement;
  elements?: ServerElement[];
  message?: string;
  error?: string;
  count?: number;
}

export interface SyncResponse {
  element?: ServerElement;
  elements?: ServerElement[];
}

// Helper functions to sync with Express server (canvas)
// The canvas answered and refused the request (e.g. an invalid frameId): the
// agent needs the reason, not "HTTP server unavailable".
class CanvasRejectedError extends Error {}

export async function syncToCanvas(operation: string, data: any): Promise<SyncResponse | null> {
  if (!ENABLE_CANVAS_SYNC) {
    logger.debug('Canvas sync disabled, skipping');
    return null;
  }

  try {
    let pathname: string;
    let options: any;

    switch (operation) {
      case 'create':
        pathname = '/api/elements';
        options = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        };
        break;

      case 'update':
        pathname = `/api/elements/${data.id}`;
        options = {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        };
        break;

      case 'delete':
        pathname = `/api/elements/${data.id}`;
        options = { method: 'DELETE' };
        break;

      case 'batch_create':
        pathname = '/api/elements/batch';
        options = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ elements: data })
        };
        break;

      default:
        logger.warn(`Unknown sync operation: ${operation}`);
        return null;
    }

    await assertCanvasIdentity();

    logger.debug(`Syncing to canvas: ${operation}`, { pathname, data });
    const response = await canvasFetch(pathname, options);

    // Parse JSON response regardless of HTTP status
    const result = await response.json() as ApiResponse;

    if (!response.ok) {
      logger.warn(`Canvas sync returned error status: ${response.status}`, result);
      const message = result.error || `Canvas sync failed: ${response.status} ${response.statusText}`;
      throw response.status === 400 ? new CanvasRejectedError(message) : new Error(message);
    }

    logger.debug(`Canvas sync successful: ${operation}`, result);
    return result as SyncResponse;

  } catch (error) {
    if (error instanceof CanvasRejectedError) throw error;
    logger.warn(`Canvas sync failed for ${operation}:`, (error as Error).message);
    // Don't throw - we want MCP operations to work even if canvas is unavailable
    return null;
  }
}

// Helper to sync element creation to canvas.
// Sync disabled = deliberate no-op (echo the input, legacy behavior);
// sync enabled but failed = null, so callers report the failure instead of
// claiming "synced to canvas" for an element that never landed.
export async function createElementOnCanvas(elementData: ServerElement): Promise<ServerElement | null> {
  if (!ENABLE_CANVAS_SYNC) return elementData;
  const result = await syncToCanvas('create', elementData);
  return result?.element ?? null;
}

// Helper to sync element update to canvas
export async function updateElementOnCanvas(elementData: Partial<ServerElement> & { id: string }): Promise<ServerElement | null> {
  const result = await syncToCanvas('update', elementData);
  return result?.element || null;
}

// Helper to sync element deletion to canvas
export async function deleteElementOnCanvas(elementId: string): Promise<any> {
  const result = await syncToCanvas('delete', { id: elementId });
  return result;
}

// Helper to sync batch creation to canvas (same failure semantics as
// createElementOnCanvas: disabled = echo, failed = null)
export async function batchCreateElementsOnCanvas(elementsData: ServerElement[]): Promise<ServerElement[] | null> {
  if (!ENABLE_CANVAS_SYNC) return elementsData;
  const result = await syncToCanvas('batch_create', elementsData);
  return result?.elements ?? null;
}

// Helper to fetch element from canvas
export async function getElementFromCanvas(elementId: string): Promise<ServerElement | null> {
  if (!ENABLE_CANVAS_SYNC) {
    logger.debug('Canvas sync disabled, skipping fetch');
    return null;
  }

  try {
    await assertCanvasIdentity();
    const response = await canvasFetch(`/api/elements/${elementId}`);
    if (!response.ok) {
      logger.warn(`Failed to fetch element ${elementId}: ${response.status}`);
      return null;
    }
    const data = await response.json() as { element?: ServerElement };
    return data.element || null;
  } catch (error) {
    logger.error('Error fetching element from canvas:', error);
    return null;
  }
}

// ---- Typed REST wrappers shared by the MCP server and CLI ----

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  await assertCanvasIdentity();
  const response = await canvasFetch(path, init);
  const data = await response.json().catch(() => null) as any;
  if (!response.ok) {
    throw new Error(data?.error || `HTTP server error: ${response.status} ${response.statusText}`);
  }
  return data as T;
}

export async function getElements(): Promise<ServerElement[]> {
  const data = await requestJson<ApiResponse>('/api/elements');
  return data.elements || [];
}

export async function searchElements(queryParams: URLSearchParams): Promise<ServerElement[]> {
  const data = await requestJson<ApiResponse>(`/api/elements/search?${queryParams}`);
  return data.elements || [];
}

export async function clearCanvas(): Promise<ApiResponse> {
  return requestJson<ApiResponse>('/api/elements/clear', { method: 'DELETE' });
}

export async function getFiles(): Promise<Record<string, any>> {
  const data = await requestJson<{ files?: Record<string, any> }>('/api/files');
  return data.files || {};
}

export async function postFiles(files: any[]): Promise<void> {
  await requestJson('/api/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(files)
  });
}

export async function exportImage(format: 'png' | 'svg', background = true): Promise<{ success: boolean; format: string; data: string }> {
  return requestJson('/api/export/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format, background })
  });
}

export async function setViewport(params: Record<string, unknown>): Promise<{ success: boolean; message?: string }> {
  return requestJson('/api/viewport', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
}

export async function saveSnapshot(name: string): Promise<any> {
  return requestJson('/api/snapshots', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
}

export async function listSnapshots(): Promise<{ success: boolean; snapshots: any[]; count: number }> {
  return requestJson('/api/snapshots');
}

export async function getSnapshot(name: string): Promise<{ name: string; elements: ServerElement[]; createdAt: string }> {
  const data = await requestJson<{ success: boolean; snapshot: { name: string; elements: ServerElement[]; createdAt: string } }>(
    `/api/snapshots/${encodeURIComponent(name)}`
  );
  return data.snapshot;
}

export async function sendMermaid(mermaidDiagram: string, config?: Record<string, unknown>): Promise<ApiResponse> {
  return requestJson('/api/elements/from-mermaid', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mermaidDiagram, config })
  });
}

// ---- Strict CRUD variants (throw on failure) ----
// syncToCanvas deliberately swallows errors so MCP tools degrade gracefully;
// the CLI wants hard failures with real error messages instead.

export async function createElementStrict(element: ServerElement): Promise<ServerElement> {
  const data = await requestJson<ApiResponse>('/api/elements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(element)
  });
  return data.element!;
}

export async function updateElementStrict(element: Partial<ServerElement> & { id: string }): Promise<ServerElement> {
  const data = await requestJson<ApiResponse>(`/api/elements/${element.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(element)
  });
  return data.element!;
}

export async function deleteElementStrict(id: string): Promise<ApiResponse> {
  return requestJson<ApiResponse>(`/api/elements/${id}`, { method: 'DELETE' });
}

export async function getElementStrict(id: string): Promise<ServerElement> {
  const data = await requestJson<ApiResponse>(`/api/elements/${id}`);
  if (!data.element) {
    throw new Error(`Element ${id} not found`);
  }
  return data.element;
}

export async function batchCreateElementsStrict(elements: ServerElement[]): Promise<ServerElement[]> {
  const data = await requestJson<ApiResponse>('/api/elements/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ elements })
  });
  return data.elements || [];
}

export function foreignServiceError(): Error {
  const { key, url } = currentTarget();
  const error = new Error(
    `Something is answering at ${url} but it is not the canvas server of session ${key} ` +
    `(that session has ended and another service took the port). ` +
    `Start a new canvas session with ${restartHint}.`
  );
  (error as any).code = 'CANVAS_UNREACHABLE';
  return error;
}

// Revalidating identity gate in front of every /api request: mutations must
// not reach a foreign service squatting on the canvas port. The verification
// is cached only briefly (burst-coalescing TTL) so a long-lived MCP server
// re-checks identity after its verified canvas goes away — a service swapped
// onto the port is refused within seconds, while batch operations (align =
// many concurrent requests) share a single probe instead of stampeding
// /health. Note this is defense-in-depth against accidents, not a security
// boundary: local processes can always reach a loopback port directly.
const IDENTITY_TTL_MS = 3000;
let identityVerifiedAt = 0;
let identityProbe: Promise<void> | null = null;

async function assertCanvasIdentity(): Promise<void> {
  if (Date.now() - identityVerifiedAt < IDENTITY_TTL_MS) return;

  if (!identityProbe) {
    identityProbe = (async () => {
      try {
        let response: Response;
        try {
          response = await fetch(`${canvasUrl()}/health`, { signal: AbortSignal.timeout(1500) });
        } catch (error) {
          // Fail CLOSED on timeout: a listener that accepts connections but
          // never answers /health could still be a foreign service that
          // would accept /api mutations.
          const name = (error as { name?: string })?.name;
          if (name === 'TimeoutError' || name === 'AbortError') {
            const timeoutError = new Error(
              `The service at ${canvasUrl()} did not answer the /health identity probe within 1500ms — ` +
              `refusing to send it requests.`
            );
            (timeoutError as any).code = 'CANVAS_UNREACHABLE';
            throw timeoutError;
          }
          // Connection-level unreachable (refused/reset/DNS): canvas is down
          // or booting — let the actual request fail with its own error.
          // Deliberately not marked verified, so the next call re-probes.
          return;
        }

        // SOMETHING answered. Only a 200 with our identity payload may pass —
        // a 404 or an HTML page here is a foreign service, not a down canvas.
        let health: CanvasHealth | null = null;
        try {
          health = await response.json() as CanvasHealth;
        } catch { /* non-JSON body: foreign */ }

        if (!response.ok || health?.service !== CANVAS_SERVICE_NAME || health.session !== currentTarget().key) {
          throw foreignServiceError();
        }
        identityVerifiedAt = Date.now();
      } finally {
        identityProbe = null;
      }
    })();
  }

  return identityProbe;
}

export async function getHealth(timeoutMs = 2000): Promise<CanvasHealth> {
  const response = await canvasFetch('/health', { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  return await response.json() as CanvasHealth;
}

export async function getSyncStatus(): Promise<Record<string, unknown>> {
  return requestJson('/api/sync/status');
}
