import { CliUsageError } from './args.js';
import { packageName, packageVersion } from '../core/version.js';
import * as elements from './commands/elements.js';
import * as scene from './commands/scene.js';
import { snapshot } from './commands/snapshot.js';
import { arrange } from './commands/arrange.js';
import { guide } from './commands/guide.js';
import { session, sessionUsage, selectSession } from './commands/session.js';

interface Command {
  handler: (argv: string[]) => Promise<void>;
  summary: string;
  usage: string;
  // Touches a canvas, so it takes the required --session <key>
  canvas?: boolean;
}

const COMMANDS: Record<string, Command> = {
  session: { handler: session, summary: 'Start, list or end canvas sessions (one canvas server each)', usage: sessionUsage },
  guide: { handler: guide, summary: 'Print the drawing spec (the guide://canvas resource) — read before drawing', usage: 'guide' },
  apply: { handler: elements.apply, summary: 'Apply a {create,update,delete} patch in one call', usage: 'apply [patch.json|-] (update entries accept direct fields or {id,set:{...}})', canvas: true },
  add: { handler: elements.add, summary: 'Create elements from a JSON array', usage: 'add [elements.json] (or stdin) | add --one \'{"type":"rectangle",...}\'', canvas: true },
  update: { handler: elements.update, summary: 'Update one element', usage: 'update <id> --set \'{"backgroundColor":"#ffc9c9"}\'', canvas: true },
  delete: { handler: elements.del, summary: 'Delete elements by id', usage: 'delete <id> [<id> ...]', canvas: true },
  get: { handler: elements.get, summary: 'Get one element by id', usage: 'get <id>', canvas: true },
  query: { handler: elements.query, summary: 'Query elements (server + typed client-side filters)', usage: 'query [--type rectangle] [--bbox x0,y0,x1,y1] [--filter locked=true] [--filter-json \'{...}\']', canvas: true },
  describe: { handler: scene.describe, summary: 'AI-readable scene description (plain text)', usage: 'describe', canvas: true },
  screenshot: { handler: scene.screenshot, summary: 'Capture the canvas (needs an open browser tab)', usage: 'screenshot [--out file.png] [--format png|svg] [--no-background]', canvas: true },
  export: { handler: scene.exportCmd, summary: 'Export the scene as .excalidraw JSON or Obsidian .excalidraw.md', usage: 'export [--out scene.excalidraw | note.excalidraw.md] [--format json|obsidian] (a .md out path implies obsidian)', canvas: true },
  import: { handler: scene.importCmd, summary: 'Import a .excalidraw or Obsidian .excalidraw.md file (merge by default)', usage: 'import [scene.excalidraw|note.excalidraw.md|-] [--replace] (or stdin)', canvas: true },
  mermaid: { handler: scene.mermaid, summary: 'Render a Mermaid diagram onto the canvas (needs a browser tab)', usage: 'mermaid [diagram.mmd|-] (or stdin)', canvas: true },
  snapshot: { handler: snapshot, summary: 'Save / list / restore named canvas snapshots', usage: 'snapshot save|list|restore [name]', canvas: true },
  arrange: { handler: arrange, summary: 'Align, distribute, group, lock, duplicate elements', usage: 'arrange align|distribute|group|ungroup|lock|unlock|duplicate --ids a,b,c [--to left|horizontal|...]', canvas: true },
  share: { handler: scene.share, summary: 'Export to a shareable excalidraw.com URL', usage: 'share', canvas: true },
  clear: { handler: scene.clear, summary: 'Clear the whole canvas', usage: 'clear --yes', canvas: true }
};

function printHelp(): void {
  const cli = packageName();
  // The bin name comes from package.json, so the usage column is measured, not
  // counted by hand.
  const usage: [form: string, summary: string][] = [
    [cli, 'Run the MCP stdio server (for MCP clients)'],
    [`${cli} <command> [...]`, 'Drive the canvas from the command line'],
    ['excalidraw-canvas <command> [...]', 'Same CLI under its short alias']
  ];
  const column = Math.max(...usage.map(([form]) => form.length)) + 2;
  const lines = [
    `${cli} ${packageVersion()} — live Excalidraw canvas for coding agents`,
    '',
    'Usage:',
    ...usage.map(([form, summary]) => `  ${form.padEnd(column)}${summary}`),
    '',
    'Commands:',
    ...Object.entries(COMMANDS).map(([name, cmd]) => `  ${name.padEnd(14)} ${cmd.summary}`),
    '',
    'Conventions:',
    '  Results are JSON on stdout — except `describe`, `guide` (plain text) and raw-content',
    '  output when --out is omitted (`export` scene JSON, `screenshot --format svg`).',
    '  Diagnostics go to stderr.',
    '  Exit codes: 0 ok, 1 error, 2 usage, 3 canvas unreachable, 4 browser tab required.',
    '  Start a canvas with `session start --project <path>`; every canvas command then',
    '  takes --session <key>.',
    '',
    `Run \`${cli} help <command>\` for per-command usage.`
  ];
  process.stdout.write(lines.join('\n') + '\n');
}

function exitCodeFor(error: unknown): number {
  if (error instanceof CliUsageError) return 2;
  const code = (error as any)?.code;
  if (code === 'CANVAS_UNREACHABLE') return 3;
  if (code === 'BROWSER_REQUIRED') return 4;
  return 1;
}

function usageOf(command: Command): string {
  return command.canvas ? `${command.usage} --session <key>` : command.usage;
}

function takeSessionFlag(argv: string[]): { key: string | undefined; remaining: string[] } {
  const remaining: string[] = [];
  let key: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]!;
    if (token === '--session') {
      key = argv[i + 1];
      if (key === undefined) throw new CliUsageError('Flag --session requires a value');
      i++;
    } else if (token.startsWith('--session=')) {
      key = token.slice('--session='.length);
    } else {
      remaining.push(token);
    }
  }
  return { key, remaining };
}

export async function runCli(argv: string[]): Promise<void> {
  const [name, ...rest] = argv;

  if (!name || name === 'help' || name === '--help' || name === '-h') {
    const topic = name === 'help' ? rest[0] : undefined;
    if (topic && COMMANDS[topic]) {
      process.stdout.write(`Usage: ${packageName()} ${usageOf(COMMANDS[topic])}\n  ${COMMANDS[topic].summary}\n`);
    } else {
      printHelp();
    }
    return;
  }

  if (name === '--version' || name === '-v' || name === 'version') {
    process.stdout.write(packageVersion() + '\n');
    return;
  }

  const command = COMMANDS[name];
  if (!command) {
    process.stderr.write(`Unknown command "${name}". Run \`${packageName()} help\` for the list.\n`);
    process.exitCode = 2;
    return;
  }

  try {
    if (command.canvas) {
      const { key, remaining } = takeSessionFlag(rest);
      await selectSession(key);
      await command.handler(remaining);
    } else {
      await command.handler(rest);
    }
  } catch (error) {
    if (!(error as any)?.quiet) {
      process.stderr.write(`Error: ${(error as Error).message}\n`);
    }
    if (error instanceof CliUsageError) {
      process.stderr.write(`Usage: ${packageName()} ${usageOf(command)}\n`);
    }
    process.exitCode = exitCodeFor(error);
  }
}
