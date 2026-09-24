import os from 'os';
import path from 'path';

// Host variables are ignored on purpose (ADR-0013).
export function pluginDataDir(): string {
  return path.join(os.homedir(), '.excalidraw-architect');
}
