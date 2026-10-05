import { parseArgs } from '../args.js';
import { canvasGuide } from '../../core/canvas-guide.js';

// The CLI's way to the drawing spec, for installs with no MCP server to serve
// `guide://canvas`. It reads the packaged file, so it needs no canvas.
export async function guide(argv: string[]): Promise<void> {
  parseArgs(argv, {});
  process.stdout.write(canvasGuide().text);
}
