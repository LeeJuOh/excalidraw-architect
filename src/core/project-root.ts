import fs from 'fs';
import path from 'path';

// The project root is the nearest folder at or above `inputPath` that holds a
// `.git` entry — a folder in a normal clone, a file in a git worktree. Without
// one, the given folder itself is the root (ADR-0003).
export function findProjectRoot(inputPath: string): string {
  let start: string;
  try {
    start = fs.realpathSync(path.resolve(inputPath));
  } catch {
    throw new Error(`Project path does not exist: ${inputPath}`);
  }
  if (!fs.statSync(start).isDirectory()) {
    throw new Error(`Project path is not a folder: ${inputPath}`);
  }

  for (let dir = start; ; dir = path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, '.git'))) return dir;
    if (path.dirname(dir) === dir) return start;
  }
}
