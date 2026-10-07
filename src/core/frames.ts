import { ServerElement } from '../types.js';

// Frame rules for the server path (issue 05, ADR-0008): one drawing = one
// frame. The REST layer calls these so MCP, CLI and the geometry helpers all
// follow the same rules.

export const FRAME_MARGIN = 40;

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const HANGUL = /[ᄀ-ᇿ㄰-㆏ꥠ-꥿가-힣ힰ-퟿]/;

// Agent-created text has no measured size until a browser renders it. Hangul
// glyphs are about as wide as they are tall, Latin about 0.6 of that.
export function estimateTextSize(text: string, fontSize: number): { width: number; height: number } {
  const lines = String(text).split('\n');
  const lineWidth = (line: string): number =>
    [...line].reduce((sum, ch) => sum + (HANGUL.test(ch) ? 1 : 0.6), 0);
  const longest = Math.max(1, ...lines.map(lineWidth));
  return {
    width: Math.ceil(longest * fontSize),
    height: Math.ceil(lines.length * fontSize * 1.25)
  };
}

export function elementBounds(el: ServerElement): Bounds {
  if ((el.type === 'arrow' || el.type === 'line' || el.type === 'freedraw') && Array.isArray(el.points) && el.points.length > 0) {
    const pts = el.points.map((p: any) => (Array.isArray(p) ? p : [p.x, p.y]) as [number, number]);
    const xs = pts.map(p => p[0]);
    const ys = pts.map(p => p[1]);
    return {
      minX: el.x + Math.min(...xs),
      minY: el.y + Math.min(...ys),
      maxX: el.x + Math.max(...xs),
      maxY: el.y + Math.max(...ys)
    };
  }
  let width = el.width || 0;
  let height = el.height || 0;
  if (el.type === 'text' && (!width || !height)) {
    const estimate = estimateTextSize(el.text ?? '', el.fontSize ?? 20);
    width = width || estimate.width;
    height = height || estimate.height;
  }
  return { minX: el.x, minY: el.y, maxX: el.x + width, maxY: el.y + height };
}

function union(boxes: Bounds[]): Bounds | null {
  if (boxes.length === 0) return null;
  return {
    minX: Math.min(...boxes.map(b => b.minX)),
    minY: Math.min(...boxes.map(b => b.minY)),
    maxX: Math.max(...boxes.map(b => b.maxX)),
    maxY: Math.max(...boxes.map(b => b.maxY))
  };
}

const hasSize = (frame: ServerElement): boolean => !!frame.width && !!frame.height;

// A child whose frameId points nowhere, at a non-frame, or a frame inside a
// frame would make the browser stop applying scenes ("Missing frame"), so the
// whole request is refused. Frames created in the same request count,
// whatever their order.
export function assertFrameMembership(incoming: ServerElement[], store: Map<string, ServerElement>): void {
  const incomingById = new Map(incoming.map(el => [el.id, el]));
  const lookup = (id: string): ServerElement | undefined => incomingById.get(id) ?? store.get(id);
  const problems: string[] = [];
  for (const el of incoming) {
    if (!el.frameId) continue;
    const target = lookup(el.frameId);
    if (el.type === 'frame') {
      problems.push(`frame ${el.id} has frameId ${el.frameId}: a frame cannot sit inside another frame`);
    } else if (!target) {
      problems.push(`element ${el.id} has frameId ${el.frameId}, but no element ${el.frameId} exists`);
    } else if (target.type !== 'frame') {
      problems.push(`element ${el.id} has frameId ${el.frameId}, but ${el.frameId} is a ${target.type}, not a frame`);
    }
  }
  if (problems.length > 0) {
    throw new Error(`Invalid frameId — nothing was created or changed. ${problems.join('; ')}`);
  }
}

export function assertFramesHaveContent(incoming: ServerElement[]): void {
  for (const frame of incoming) {
    if (frame.type !== 'frame' || hasSize(frame)) continue;
    if (!incoming.some(el => el.frameId === frame.id)) {
      throw new Error(
        `Frame ${frame.id} has no size and no children. Give it width and height, ` +
        `or put its children (elements with frameId "${frame.id}") in the same batch.`
      );
    }
  }
}

// Members of a frame plus the label texts bound to them, which move and go
// away with their container even when their own frameId was left null.
// Labels come after their containers.
export function frameMembers(frameId: string, store: Map<string, ServerElement>): ServerElement[] {
  const members = [...store.values()].filter(el => el.frameId === frameId && el.id !== frameId);
  const memberIds = new Set(members.map(el => el.id));
  for (const el of store.values()) {
    if (el.containerId && memberIds.has(el.containerId) && !memberIds.has(el.id)) {
      members.push(el);
      memberIds.add(el.id);
    }
  }
  return members;
}

// Grows the frame so the given children are inside, with the margin on the
// sides that had to grow. Never shrinks and never moves children. Only the
// children passed in count: one the user dragged out stays out until it is
// changed through the server. A frame without a size takes the children's
// range plus the margin. Returns whether it changed.
export function fitFrame(frame: ServerElement, children: ServerElement[]): boolean {
  const range = union(children.map(elementBounds));
  if (!range) return false;
  if (!hasSize(frame)) {
    frame.x = range.minX - FRAME_MARGIN;
    frame.y = range.minY - FRAME_MARGIN;
    frame.width = range.maxX - range.minX + 2 * FRAME_MARGIN;
    frame.height = range.maxY - range.minY + 2 * FRAME_MARGIN;
    return true;
  }
  const before = { x: frame.x, y: frame.y, width: frame.width, height: frame.height };
  let left = frame.x;
  let top = frame.y;
  let right = frame.x + frame.width!;
  let bottom = frame.y + frame.height!;
  if (range.minX < left) left = range.minX - FRAME_MARGIN;
  if (range.minY < top) top = range.minY - FRAME_MARGIN;
  if (range.maxX > right) right = range.maxX + FRAME_MARGIN;
  if (range.maxY > bottom) bottom = range.maxY + FRAME_MARGIN;
  frame.x = left;
  frame.y = top;
  frame.width = right - left;
  frame.height = bottom - top;
  return frame.x !== before.x || frame.y !== before.y ||
    frame.width !== before.width || frame.height !== before.height;
}

// Moving a frame moves its drawing, like dragging it in the browser.
export function moveFrameMembers(members: ServerElement[], dx: number, dy: number, at: string): void {
  for (const member of members) {
    member.x += dx;
    member.y += dy;
    member.updatedAt = at;
    member.version = (member.version || 0) + 1;
  }
}

// An explicit width/height never cuts a member off: it stops at the members'
// range plus the margin.
export function clampFrameSize(frame: ServerElement, members: ServerElement[]): void {
  const range = union(members.map(elementBounds));
  if (!range) return;
  frame.width = Math.max(frame.width || 0, range.maxX + FRAME_MARGIN - frame.x);
  frame.height = Math.max(frame.height || 0, range.maxY + FRAME_MARGIN - frame.y);
}
