import { ServerElement } from '../types.js';

// Build an AI-readable description of the current canvas: element types,
// positions, connections, labels, spatial layout, and bounding box.
export function describeScene(allElements: ServerElement[]): string {
  if (allElements.length === 0) {
    return 'The canvas is empty. No elements to describe.';
  }

  // Count by type
  const typeCounts: Record<string, number> = {};
  for (const el of allElements) {
    typeCounts[el.type] = (typeCounts[el.type] || 0) + 1;
  }

  // Bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const el of allElements) {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + (el.width || 0));
    maxY = Math.max(maxY, el.y + (el.height || 0));
  }

  // Bound label texts are part of their container, not elements of their own:
  // they are shown on the container's line and never counted.
  const byId = new Map(allElements.map(el => [el.id, el]));
  const labelOf = new Map<string, string>();
  const isLabel = (el: ServerElement): boolean =>
    el.type === 'text' && !!el.containerId && byId.has(el.containerId);
  for (const el of allElements) {
    if (isLabel(el) && el.text) labelOf.set(el.containerId!, el.text);
  }

  const describeElement = (el: ServerElement): string => {
    const parts: string[] = [];
    parts.push(`[${el.id}] ${el.type}`);
    parts.push(`at (${Math.round(el.x)}, ${Math.round(el.y)})`);
    if (el.width || el.height) {
      parts.push(`size ${Math.round(el.width || 0)}x${Math.round(el.height || 0)}`);
    }
    if (el.text) parts.push(`text: "${el.text}"`);
    const label = el.label?.text ?? labelOf.get(el.id);
    if (label) parts.push(`label: "${label}"`);
    if (el.backgroundColor && el.backgroundColor !== 'transparent') {
      parts.push(`bg: ${el.backgroundColor}`);
    }
    if (el.strokeColor && el.strokeColor !== '#000000') {
      parts.push(`stroke: ${el.strokeColor}`);
    }
    if (el.locked) parts.push('(locked)');
    if (el.groupIds && el.groupIds.length > 0) {
      parts.push(`groups: [${el.groupIds.join(', ')}]`);
    }
    return `    ${parts.join(' | ')}`;
  };

  const sortByPosition = (list: ServerElement[]): ServerElement[] => [...list].sort((a, b) => {
    const rowDiff = Math.floor(a.y / 50) - Math.floor(b.y / 50);
    return rowDiff !== 0 ? rowDiff : a.x - b.x;
  });

  // One drawing = one frame (ADR-0008). Elements in no frame are listed last,
  // as they are: the server does not guess which drawing they belong to.
  const frames = sortByPosition(allElements.filter(el => el.type === 'frame'));
  const frameIds = new Set(frames.map(f => f.id));
  const members = new Map<string, ServerElement[]>(frames.map(f => [f.id, []]));
  const outside: ServerElement[] = [];
  for (const el of allElements) {
    if (el.type === 'frame' || isLabel(el)) continue;
    if (el.frameId && frameIds.has(el.frameId)) members.get(el.frameId)!.push(el);
    else outside.push(el);
  }
  const count = (n: number): string => `${n} element${n === 1 ? '' : 's'}`;

  // Find connections (arrows)
  const arrows = allElements.filter(el => el.type === 'arrow');
  const connectionDescs: string[] = [];
  for (const arrow of arrows) {
    const arrowAny = arrow as any;
    if (arrowAny.startBinding?.elementId || arrowAny.endBinding?.elementId) {
      const from = arrowAny.startBinding?.elementId || '?';
      const to = arrowAny.endBinding?.elementId || '?';
      connectionDescs.push(`  ${from} --> ${to} (arrow: ${arrow.id})`);
    }
  }

  // Build description
  const lines: string[] = [];
  lines.push(`## Canvas Description`);
  lines.push(`Total elements: ${allElements.length}`);
  lines.push(`Types: ${Object.entries(typeCounts).map(([t, c]) => `${t}(${c})`).join(', ')}`);
  lines.push(`Bounding box: (${Math.round(minX)}, ${Math.round(minY)}) to (${Math.round(maxX)}, ${Math.round(maxY)}) = ${Math.round(maxX - minX)}x${Math.round(maxY - minY)}`);
  if (connectionDescs.length > 0) {
    lines.push('');
    lines.push('### Connections:');
    lines.push(...connectionDescs);
  }

  // Groups
  const groupedElements = allElements.filter(el => el.groupIds && el.groupIds.length > 0);
  if (groupedElements.length > 0) {
    const groupMap: Record<string, string[]> = {};
    for (const el of groupedElements) {
      for (const gid of (el.groupIds || [])) {
        if (!groupMap[gid]) groupMap[gid] = [];
        groupMap[gid]!.push(el.id);
      }
    }
    lines.push('');
    lines.push('### Groups:');
    for (const [gid, ids] of Object.entries(groupMap)) {
      lines.push(`  Group ${gid}: [${ids.join(', ')}]`);
    }
  }

  if (frames.length > 0) {
    lines.push('');
    lines.push('### Drawings (frames), elements top-to-bottom, left-to-right:');
    for (const frame of frames) {
      const list = members.get(frame.id)!;
      lines.push(`  Frame "${frame.name ?? ''}" [${frame.id}] at (${Math.round(frame.x)}, ${Math.round(frame.y)}) size ${Math.round(frame.width || 0)}x${Math.round(frame.height || 0)} — ${count(list.length)}`);
      lines.push(...sortByPosition(list).map(describeElement));
    }
  }

  lines.push('');
  lines.push(frames.length > 0
    ? `### Outside any frame — ${count(outside.length)}:`
    : '### Elements (top-to-bottom, left-to-right):');
  lines.push(...sortByPosition(outside).map(describeElement));

  return lines.join('\n');
}
