import { parseArgs, CliUsageError } from '../args.js';
import { printJson } from '../util.js';
import {
  saveSnapshot,
  listSnapshots,
  getSnapshot,
  clearCanvas,
  batchCreateElementsStrict
} from '../../core/canvas-client.js';

export async function snapshot(argv: string[]): Promise<void> {
  const { positionals, flags } = parseArgs(argv, { force: { takesValue: false } });
  const [action, name] = positionals;

  switch (action) {
    case 'save': {
      if (!name) throw new CliUsageError('Usage: snapshot save <name> [--force]');
      const result = await saveSnapshot(name, flags.force === true);
      printJson({ success: true, name: result.name, path: result.path, elements: result.elementCount, createdAt: result.createdAt });
      return;
    }
    case 'list': {
      const result = await listSnapshots();
      printJson(result.snapshots ?? []);
      return;
    }
    case 'restore': {
      if (!name) throw new CliUsageError('Usage: snapshot restore <name>');
      const snap = await getSnapshot(name);
      await clearCanvas();
      await batchCreateElementsStrict(snap.elements);
      printJson({ success: true, name, restored: snap.elements.length });
      return;
    }
    default:
      throw new CliUsageError('Usage: snapshot save <name> [--force] | list | restore <name>');
  }
}
