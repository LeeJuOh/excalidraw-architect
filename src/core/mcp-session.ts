import path from 'path';
import WebSocket from 'ws';
import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/server';
import { findProjectRoot } from './project-root.js';
import {
  LiveSession,
  listLiveSessions,
  startCanvasSession,
  endCanvasSession,
  unknownSessionError
} from './sessions.js';
import { setCanvasTarget, setRestartHint } from './canvas-client.js';

// The canvas session this MCP process draws on. Drawing tools take no key: the
// process attaches once with session_start or session_attach, and stays
// attached until session_end or until that canvas server goes away (ADR-0003).
interface Attachment {
  session: LiveSession;
  socket: WebSocket;
}

const START_HINT =
  '`session_start` with `projectPath` set to the absolute path of the project you are working in';

let attachment: Attachment | null = null;
// Key of the canvas session whose server went away while this process was attached.
let lostKey: string | null = null;

export function isSessionTool(name: string): boolean {
  return name.startsWith('session_');
}

function connectAgentSocket(session: LiveSession, timeoutMs = 5000): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`ws://127.0.0.1:${session.port}/?role=agent`);
    const timer = setTimeout(() => {
      socket.terminate();
      reject(new Error(`Could not attach to canvas session ${session.key} within ${timeoutMs}ms.`));
    }, timeoutMs);
    socket.once('open', () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.once('error', error => {
      clearTimeout(timer);
      reject(new Error(`Could not attach to canvas session ${session.key}: ${error.message}`));
    });
  });
}

function detach(): void {
  if (!attachment) return;
  const { socket } = attachment;
  attachment = null;
  setCanvasTarget(null);
  socket.close();
}

async function attach(session: LiveSession): Promise<void> {
  const socket = await connectAgentSocket(session);
  detach();
  attachment = { session, socket };
  lostKey = null;
  socket.on('error', () => { /* 'close' follows */ });
  socket.on('close', () => {
    if (attachment?.socket !== socket) return;
    attachment = null;
    lostKey = session.key;
    setCanvasTarget(null);
  });
  setCanvasTarget({ key: session.key, url: session.url });
  setRestartHint(START_HINT);
}

function isAttachedAndOpen(): boolean {
  return attachment !== null && attachment.socket.readyState === WebSocket.OPEN;
}

/** Throws the "call session_start" error unless this process is attached to a live canvas. */
export function requireAttachedCanvas(): void {
  if (isAttachedAndOpen()) return;
  if (attachment) {
    lostKey = attachment.session.key;
    detach();
  }
  const ended = lostKey
    ? `The canvas session ${lostKey} has ended — its canvas server is gone. No new canvas was started. `
    : '';
  throw new Error(
    `${ended}No canvas session is attached. Call ${START_HINT} first, then give the user the URL it returns. ` +
    'To join a canvas session that is already live, call session_attach with its key.'
  );
}

export function resolveFromProjectRoot(filePath: string): string {
  requireAttachedCanvas();
  return path.resolve(attachment!.session.projectRoot, filePath);
}

function describeSession(session: LiveSession): string {
  return `canvas session ${session.key} at ${session.url} (project root ${session.projectRoot})`;
}

function text(value: string): CallToolResult {
  return { content: [{ type: 'text', text: value }] };
}

async function sessionStart(args: unknown): Promise<CallToolResult> {
  const { projectPath } = z.object({ projectPath: z.string().min(1) }).parse(args ?? {});
  if (!path.isAbsolute(projectPath)) {
    throw new Error(`projectPath must be an absolute path, got "${projectPath}".`);
  }

  if (isAttachedAndOpen()) {
    return text(
      `Already attached to ${describeSession(attachment!.session)}. Nothing was started. ` +
      'Call session_end first if the user wants a new canvas.'
    );
  }

  const projectRoot = findProjectRoot(projectPath);
  const others = (await listLiveSessions()).filter(s => s.projectRoot === projectRoot);
  const session = await startCanvasSession(projectRoot);
  await attach(session);

  const lines = [
    `Started canvas session ${session.key} for project root ${projectRoot}.`,
    `Tell the user to open ${session.url} in a browser; the tab title shows ${session.key}.`
  ];
  if (others.length > 0) {
    lines.push(
      `Other live canvas sessions in this project: ${others.map(s => `${s.key} ${s.url}`).join(', ')}. ` +
      'Tell the user in one line and do not ask. If they want one of them, call session_attach with its key.'
    );
  }
  return text(lines.join('\n'));
}

async function sessionAttach(args: unknown): Promise<CallToolResult> {
  const { key } = z.object({ key: z.string().min(1) }).parse(args ?? {});
  if (isAttachedAndOpen() && attachment!.session.key === key) {
    return text(`Already attached to ${describeSession(attachment!.session)}.`);
  }
  const live = await listLiveSessions();
  const session = live.find(s => s.key === key);
  if (!session) throw unknownSessionError(key, live);
  await attach(session);
  return text(`Attached to ${describeSession(session)}. Further tool calls draw there.`);
}

async function sessionList(): Promise<CallToolResult> {
  const live = await listLiveSessions();
  const attachedKey = isAttachedAndOpen() ? attachment!.session.key : null;
  return text(JSON.stringify(
    live.map(s => ({
      key: s.key,
      url: s.url,
      projectRoot: s.projectRoot,
      browserTabs: s.browserTabs,
      agents: s.agents,
      unsaved: s.unsaved,
      modified: s.modified,
      attachedHere: s.key === attachedKey
    })),
    null,
    2
  ));
}

async function sessionEnd(args: unknown): Promise<CallToolResult> {
  const { key } = z.object({ key: z.string().min(1).optional() }).parse(args ?? {});
  const target = key ?? (isAttachedAndOpen() ? attachment!.session.key : undefined);
  if (!target) {
    throw new Error(
      'This process is not attached to a canvas session. Pass `key` to end another one (session_list shows the keys).'
    );
  }
  // Let go first, so the server closing our socket does not read as a lost canvas.
  if (attachment?.session.key === target) detach();
  const ended = await endCanvasSession(target);
  return text(`Ended ${describeSession(ended)}.`);
}

export async function callSessionTool(name: string, args: unknown): Promise<CallToolResult> {
  switch (name) {
    case 'session_start': return sessionStart(args);
    case 'session_attach': return sessionAttach(args);
    case 'session_list': return sessionList();
    case 'session_end': return sessionEnd(args);
    default: throw new Error(`Unknown tool: ${name}`);
  }
}
