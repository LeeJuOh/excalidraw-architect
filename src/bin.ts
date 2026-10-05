#!/usr/bin/env node

// Single bin entry for both package bins (excalidraw-architect and
// excalidraw-canvas):
//
//   no arguments  -> MCP stdio server (backward compatible with MCP clients)
//   <subcommand>  -> CLI
//
// IMPORTANT: never statically import ./index.js or ./server.js here.
// index.js evaluates the whole MCP module graph, and server.js used to start
// the Express canvas server on import — the CLI must only ever reach the
// canvas by spawning dist/server.js as a child process (see core/spawn.ts).

// Disable colors to prevent ANSI color codes from breaking JSON parsing
process.env.NODE_DISABLE_COLORS = '1';
process.env.NO_COLOR = '1';

const argv = process.argv.slice(2);

if (argv.length === 0) {
  // MCP mode: stdout belongs to the JSON-RPC transport from here on
  const { runServer } = await import('./index.js');
  await runServer();
} else {
  const { runCli } = await import('./cli/run.js');
  await runCli(argv);
}

export {};
