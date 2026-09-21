import fs from 'fs';
import { fileURLToPath } from 'url';

// The drawing spec has exactly one source: `docs/canvas-guide.md` in this
// package (ADR-0006). Never restate a value from it here — edit the markdown.

export const CANVAS_GUIDE_URI = 'guide://canvas';

const GUIDE_PATH = fileURLToPath(new URL('../../docs/canvas-guide.md', import.meta.url));

const SUMMARY_START = '<!-- instructions:start -->';
const SUMMARY_END = '<!-- instructions:end -->';

export interface CanvasGuide {
  /** The file verbatim — what `resources/read` returns. */
  readonly text: string;
  /** The marked section, verbatim — what `initialize` returns. */
  readonly summary: string;
}

function readGuide(): CanvasGuide {
  let text: string;
  try {
    text = fs.readFileSync(GUIDE_PATH, 'utf-8');
  } catch (error) {
    throw new Error(
      `Canvas guide missing at ${GUIDE_PATH}: ${error instanceof Error ? error.message : String(error)}. ` +
        'It ships with the package ("files" in package.json); reinstall or rebuild rather than running without it.'
    );
  }

  const start = text.indexOf(SUMMARY_START);
  const end = text.indexOf(SUMMARY_END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(
      `Canvas guide at ${GUIDE_PATH} has no ${SUMMARY_START} / ${SUMMARY_END} section to use as MCP instructions.`
    );
  }

  const summary = text.slice(start + SUMMARY_START.length, end).trim();
  if (summary.length === 0) {
    throw new Error(`Canvas guide at ${GUIDE_PATH} has an empty ${SUMMARY_START} section.`);
  }

  return { text, summary };
}

let cached: CanvasGuide | null = null;

/** Read once per process. Throws when the file is missing or unmarked. */
export function canvasGuide(): CanvasGuide {
  if (!cached) cached = readGuide();
  return cached;
}
