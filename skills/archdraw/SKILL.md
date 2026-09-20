---
name: archdraw
description: Draw and refine backend architecture diagrams with the user on a live Excalidraw canvas. Manual only — the user invokes it.
disable-model-invocation: true
allowed-tools: Bash(${CLAUDE_SKILL_DIR}/scripts/archdraw *)
---

# archdraw

You and the user look at the same canvas and fix it together. This file is the
skeleton: how to reach the canvas, what to say while it starts, and what to do
when it fails. The judgement rules — which diagram, which zoom level, which
elements a diagram must carry — arrive in a later slice.

## 1. Pick the interface, once per session

1. **archdraw MCP tools in your tool list** (`batch_create_elements`,
   `get_canvas_screenshot`, `export_scene`, …)? Use them and nothing else.
   Results land in your context and screenshots come back as images.
2. **No archdraw MCP tools** (the skill was installed with `npx skills add`, so
   no MCP server was registered)? Fall back to the CLI shim, from this skill's
   folder:

   ```bash
   scripts/archdraw <command>       # e.g. scripts/archdraw describe
   ```

   Output is JSON on stdout (`describe` is plain text). A screenshot is written
   to a file; read that file to see it.

Do not mix the two. If the MCP tools are there, never shell out to the shim.

## 2. Say the server is coming up

Before the **first** canvas command of a session, tell the user in one line, in
their language, that the canvas server is starting and that the first run may
take a while because the server is downloaded then. Then run the command.

Any canvas command starts the server by itself — there is no separate install
step. The canvas lives at `http://127.0.0.1:3000` (or `EXPRESS_SERVER_URL`);
ask the user to open that URL in a browser. Screenshots and image export need
an open tab (the CLI exits with code 4 when no tab is connected).

## 3. Draw

Create elements as a batch — MCP `batch_create_elements`, or the shim:

```bash
echo '[{"type":"rectangle","x":100,"y":100,"width":200,"height":60}]' | scripts/archdraw add
```

Then look at what you drew (`get_canvas_screenshot` / `scripts/archdraw
screenshot`) before telling the user it is done.

## 4. When the server never comes up

Do not retry silently. Tell the user the likely cause:

- **No internet on the first run.** The shim fetches the server from npm the
  first time; without network there is nothing to run yet.
- **Sandbox restrictions.** Codex's defaults block network access and writes
  outside the workspace, which stops that same fetch.

Report what failed and which of these it looks like; let the user decide.

## Developing on this repo

`ARCHDRAW_BIN=<repo>/dist/bin.js` (after `npm run build`) makes the shim run a
local build instead of the published package, on both the MCP and the CLI path.
The host process has to inherit it, so start `claude`/`codex` from a shell that
has it set.
