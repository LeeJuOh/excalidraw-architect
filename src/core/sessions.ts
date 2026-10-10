import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { pluginDataDir } from './data-dir.js';

// Identity marker the canvas server puts in /health
export const CANVAS_SERVICE_NAME = 'mcp-excalidraw-canvas';

// One file per canvas server, written and removed by that server alone, so two
// servers starting at once never touch each other's entry (ADR-0003).
export interface SessionRecord {
  key: string;
  port: number;
  projectRoot: string;
  pid: number;
  startedAt: string;
}

export interface LiveSession extends SessionRecord {
  url: string;
  browserTabs: number;
  agents: number;
  unsaved: number | null;
  modified: number | null;
}

// What the canvas server sends its spawner over IPC once it is listening.
export interface CanvasReadyMessage {
  type: 'canvas-ready';
  record: SessionRecord;
}

export interface CanvasHealth {
  status: string;
  timestamp: string;
  elements_count: number;
  websocket_clients: number;
  agent_clients?: number;
  unsaved_drawings?: number;
  modified_drawings?: number;
  service?: string;
  session?: string;
  projectRoot?: string;
  pid?: number;
}

export function sessionsDir(): string {
  return path.join(pluginDataDir(), 'sessions');
}

function recordPath(key: string): string {
  return path.join(sessionsDir(), `${key}.json`);
}

export function sessionUrl(port: number): string {
  return `http://127.0.0.1:${port}`;
}

export function newSessionKey(): string {
  return crypto.randomBytes(3).toString('hex');
}

export function claimSessionRecord(
  fields: Omit<SessionRecord, 'key'>,
  nextKey: () => string = newSessionKey
): SessionRecord {
  fs.mkdirSync(sessionsDir(), { recursive: true });
  for (let attempt = 0; attempt < 50; attempt++) {
    const record: SessionRecord = { key: nextKey(), ...fields };
    try {
      fs.writeFileSync(recordPath(record.key), JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
      return record;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    }
  }
  throw new Error(`Could not pick an unused session key in ${sessionsDir()}`);
}

export function removeSessionRecord(key: string): void {
  try {
    fs.unlinkSync(recordPath(key));
  } catch { /* already gone */ }
}

function readSessionRecords(): SessionRecord[] {
  let files: string[];
  try {
    files = fs.readdirSync(sessionsDir()).filter(file => file.endsWith('.json'));
  } catch {
    return [];
  }

  const records: SessionRecord[] = [];
  for (const file of files) {
    try {
      const record = JSON.parse(fs.readFileSync(path.join(sessionsDir(), file), 'utf-8')) as SessionRecord;
      if (`${record.key}.json` === file && Number.isInteger(record.port) && Number.isInteger(record.pid)) {
        records.push(record);
      }
    } catch { /* half-written or foreign file */ }
  }
  return records;
}

function processExists(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}

type Probe = { state: 'live'; health: CanvasHealth } | { state: 'dead' } | { state: 'unknown' };

async function probeSession(record: SessionRecord): Promise<Probe> {
  if (!processExists(record.pid)) return { state: 'dead' };
  try {
    const response = await fetch(`${sessionUrl(record.port)}/health`, { signal: AbortSignal.timeout(1500) });
    const health = await response.json().catch(() => null) as CanvasHealth | null;
    if (response.ok && health?.service === CANVAS_SERVICE_NAME && health.session === record.key) {
      return { state: 'live', health };
    }
    // Something else owns the port now: the recorded server is gone.
    return { state: 'dead' };
  } catch (error) {
    const name = (error as { name?: string }).name;
    // A slow answer is not proof of death; keep the record for the next look.
    if (name === 'TimeoutError' || name === 'AbortError') return { state: 'unknown' };
    return { state: 'dead' };
  }
}

/** Live canvas sessions on this machine, sorted by project. Dead records are deleted on the way. */
export async function listLiveSessions(): Promise<LiveSession[]> {
  const records = readSessionRecords();
  const probed = await Promise.all(records.map(async record => ({ record, probe: await probeSession(record) })));

  const live: LiveSession[] = [];
  for (const { record, probe } of probed) {
    if (probe.state === 'dead') {
      removeSessionRecord(record.key);
    } else if (probe.state === 'live') {
      live.push({
        ...record,
        url: sessionUrl(record.port),
        browserTabs: probe.health.websocket_clients,
        agents: probe.health.agent_clients ?? 0,
        unsaved: probe.health.unsaved_drawings ?? null,
        modified: probe.health.modified_drawings ?? null
      });
    }
  }
  return live.sort((a, b) =>
    a.projectRoot.localeCompare(b.projectRoot) || a.startedAt.localeCompare(b.startedAt)
  );
}

export function formatSessionList(sessions: LiveSession[]): string {
  if (sessions.length === 0) return '  (none)';
  return sessions.map(s => `  ${s.key}  ${s.url}  ${s.projectRoot}`).join('\n');
}

/**
 * Spawn a detached canvas server for `projectRoot` and wait until it reports
 * its key and port. The server outlives the caller (ADR-0003): it ends on
 * `session end`, or by itself after a stretch with no connections.
 */
export async function startCanvasSession(projectRoot: string, timeoutMs = 15000): Promise<LiveSession> {
  // dist/core/sessions.js -> dist/server.js
  const serverJs = fileURLToPath(new URL('../server.js', import.meta.url));
  const child = spawn(process.execPath, [serverJs], {
    detached: true,
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
    env: { ...process.env, ARCHDRAW_PROJECT_ROOT: projectRoot, PORT: '0', HOST: '127.0.0.1' }
  });

  const record = await new Promise<SessionRecord>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      child.kill('SIGKILL');
      reject(new Error(`The canvas server did not start within ${timeoutMs}ms.`));
    }, timeoutMs);
    const onMessage = (message: unknown) => {
      const ready = message as CanvasReadyMessage;
      if (ready?.type !== 'canvas-ready') return;
      cleanup();
      resolve(ready.record);
    };
    const onExit = (code: number | null, signal: string | null) => {
      cleanup();
      reject(new Error(
        `The canvas server exited before it was ready (${signal ?? `exit code ${code}`}). See the canvas log for the reason.`
      ));
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const cleanup = () => {
      clearTimeout(timer);
      child.off('message', onMessage);
      child.off('exit', onExit);
      child.off('error', onError);
    };
    child.on('message', onMessage);
    child.on('exit', onExit);
    child.on('error', onError);
  });

  if (child.connected) child.disconnect();
  child.unref();
  return { ...record, url: sessionUrl(record.port), browserTabs: 0, agents: 0, unsaved: 0, modified: 0 };
}

export function unknownSessionError(key: string, live: LiveSession[]): Error {
  const error = new Error(
    `No live canvas session has the key "${key}". Live canvas sessions (key, URL, project root):\n` +
    formatSessionList(live)
  );
  (error as any).code = 'CANVAS_UNREACHABLE';
  return error;
}

/** End the canvas session `key`. Only a server that answers /health with that key is asked to stop. */
export async function endCanvasSession(key: string): Promise<LiveSession> {
  const live = await listLiveSessions();
  const session = live.find(s => s.key === key);
  if (!session) throw unknownSessionError(key, live);

  try {
    await fetch(`${session.url}/api/session/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
      signal: AbortSignal.timeout(3000)
    });
  } catch { /* the server may close the socket while shutting down */ }

  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    if (!processExists(session.pid)) {
      removeSessionRecord(key);
      return session;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`The canvas server of session ${key} (pid ${session.pid}) did not stop within 5s.`);
}
