import fs from 'fs';
import os from 'os';
import path from 'path';

// A host that did not expand its own placeholder hands us the literal text.
// Treat that as "no data folder" rather than creating a directory named
// `${CLAUDE_PLUGIN_DATA}` next to the user's files.
const UNEXPANDED_PLACEHOLDER = /^\$\{[A-Z_]+\}/;

/**
 * Where this plugin keeps the files it generates for itself — screenshots
 * today, snapshots later. Never the project the agent is drawing about: a
 * canvas session must not leave png files in someone's source tree
 * (spec 7-5c).
 *
 * Claude hands plugins `CLAUDE_PLUGIN_DATA`, Codex hands them `PLUGIN_DATA`
 * (Agent Plugins 1.0 §9.1), and both survive plugin updates. The `npx skills
 * add` channel registers no MCP server and sets neither, so fall back to the
 * user's home folder rather than the working directory.
 */
export function pluginDataDir(): string {
  const hostDir = process.env.CLAUDE_PLUGIN_DATA ?? process.env.PLUGIN_DATA;
  if (hostDir !== undefined && hostDir.trim() !== '' && !UNEXPANDED_PLACEHOLDER.test(hostDir.trim())) {
    return hostDir;
  }
  return path.join(os.homedir(), '.excalidraw-architect');
}

/** `tmp/` inside the data folder, created on demand. */
export function pluginTmpDir(): string {
  const dir = path.join(pluginDataDir(), 'tmp');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
