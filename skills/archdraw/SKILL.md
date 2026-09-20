---
name: archdraw
description: Draw and refine backend architecture diagrams with the user on a live Excalidraw canvas. Manual only — the user invokes it.
disable-model-invocation: true
allowed-tools: Bash(${CLAUDE_SKILL_DIR}/scripts/archdraw *)
---

# archdraw

You and the user look at the same canvas and fix it together. This file is the
skeleton: how to reach the canvas and what to do when it fails. The judgement
rules — which diagram, which zoom level, which elements a diagram must carry —
arrive in a later slice.

## 1. Use the archdraw MCP tools

Look at your tool list. If it has archdraw tools — `batch_create_elements`,
`get_canvas_screenshot`, `export_scene`, and the rest — this skill is fully
served by them. Do not run any shell command from this skill. The server is
already running: the host started it when it connected the tools.

- The canvas lives at `http://127.0.0.1:3000` (or `EXPRESS_SERVER_URL`). Ask
  the user to open that URL in a browser once.
- Create elements as a batch with `batch_create_elements`.
- Look at what you drew with `get_canvas_screenshot` before telling the user it
  is done. It needs an open browser tab; if it reports no client connected, ask
  the user to open the URL and try again.

## 2. Only if there are no archdraw MCP tools

Then the skill was installed with `npx skills add`, which registers no MCP
server. Read [references/canvas-ops.md](references/canvas-ops.md) and follow
its CLI section. Do not read it otherwise.

## 3. When the canvas cannot be reached

Do not retry silently. Tell the user what failed and the likely cause, then let
them decide:

- **No browser tab open.** Screenshots and image export need one.
- **No internet on the first CLI run.** The CLI fetches the server from npm the
  first time; without network there is nothing to run yet.
- **Sandbox restrictions.** Codex's defaults block network access and writes
  outside the workspace, which stops that same fetch.

## Developing on this repo

`ARCHDRAW_BIN=<repo>/dist/bin.js` (after `npm run build`) makes the shim run a
local build instead of the published package, on both the MCP and the CLI path.
The host process has to inherit it, so start `claude`/`codex` from a shell that
has it set.
