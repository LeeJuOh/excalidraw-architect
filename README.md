# excalidraw-architect

[한국어](README.ko.md)

A Claude Code / Codex plugin that lets a backend developer and an agent trade architecture as pictures instead of text, on a live [Excalidraw](https://excalidraw.com) canvas.

The canvas comes from [yctimlin/mcp_excalidraw](https://github.com/yctimlin/mcp_excalidraw): the agent can draw, look at its own work via screenshots, and read what you change in the browser. What this fork adds is judgement — an `archdraw` skill that decides **what to draw and at which zoom level**, instead of defaulting to a box-and-arrow component diagram for every question.

## What's different

- **Situation → diagram routing.** "What happens when I call this API?" gets a sequence diagram; "how is this structured?" gets a zoom-level diagram; retry policies get a state chart with backoff and max attempts, because a retry diagram without those is decoration.
- **Canvas first.** The agent looks at the canvas before acting. If you moved a box, that placement is the answer; the agent tidies alignment, never rearranges.
- **Five zoom levels, stack-agnostic.** System context → deployment unit → module boundary → layer → boundary type. Each diagram is one box of the level above, zoomed in. Gradle multi-module and NestJS modules get their own level, which C4 does not give them.
- **Throwaway by default.** Diagrams are explanation until you say "keep it"; then they are promoted to a proper drawing and exported into your repo.

## Install

Three channels, one skill folder. The two plugin channels register the MCP server, so the agent drives the canvas through MCP tools; `npx skills add` copies the skill only, and it falls back to the bundled CLI shim.

| Channel | Install | Call it |
|---|---|---|
| Claude Code plugin | `/plugin marketplace add LeeJuOh/excalidraw-architect`, then `/plugin install excalidraw-architect@excalidraw-architect` | `/excalidraw-architect:archdraw <what you want drawn>` — plain `/archdraw` when nothing else claims the name |
| Codex plugin | `codex plugin marketplace add LeeJuOh/excalidraw-architect`, then `codex plugin add excalidraw-architect@excalidraw-architect` (a bare folder under `~/.codex/plugins` is not discovered) | `$excalidraw-architect:archdraw`, or pick it in `/skills`; in ChatGPT desktop pick the `@excalidraw-architect` plugin |
| Any Agent Skills host | `npx skills add LeeJuOh/excalidraw-architect --skill archdraw -g --agent <host> -y` | `$archdraw` in Codex; `/archdraw` in Claude Code |

Use `codex` or `claude-code` for `<host>`. Keep `--agent` explicit: auto-detection can install the skill for only the agent that happens to be running. `-g` installs it for every project; omit `-g` only when you want the skill in the current project.

The skill is manual only. It never starts itself — you call it, and then it keeps drawing for that conversation.

**The first run needs internet.** The canvas server is not in this repo; the skill fetches it from npm (`npx -y excalidraw-architect@<version>`) the first time you draw. So the first command is slow, and it fails without network — including under Codex's default sandbox, which blocks it.

Hacking on the server itself? `npm run build`, then start `claude`/`codex` from a shell with `ARCHDRAW_BIN=<repo>/dist/bin.js`: both the MCP path and the CLI fallback then run your build instead of the published package.

## Upstream

This is a fork of [yctimlin/mcp_excalidraw](https://github.com/yctimlin/mcp_excalidraw) (MIT). For the canvas server, CLI, and MCP tools, see the upstream README. The original copyright notice is kept in [LICENSE](LICENSE).

## License

MIT.
