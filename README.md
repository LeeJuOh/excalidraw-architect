# excalidraw-architect

[한국어](README.ko.md)

A Claude Code / Codex plugin that lets a backend developer and an agent trade architecture as pictures instead of text, on a live [Excalidraw](https://excalidraw.com) canvas.

The canvas comes from [yctimlin/mcp_excalidraw](https://github.com/yctimlin/mcp_excalidraw): the agent can draw, look at its own work via screenshots, and read what you change in the browser. What this fork adds is judgement — an `archdraw` skill that decides **what to draw and at which zoom level**, instead of defaulting to a box-and-arrow component diagram for every question.

## What's different

- **Situation → diagram routing.** "What happens when I call this API?" gets a sequence diagram; "how is this structured?" gets a zoom-level diagram; retry policies get a state chart with backoff and max attempts, because a retry diagram without those is decoration.
- **Canvas first.** The agent looks at the canvas before acting. If you moved a box, that placement is the answer; the agent tidies alignment, never rearranges.
- **Five zoom levels, stack-agnostic.** System context → deployment unit → module boundary → layer → boundary type. Each diagram is one box of the level above, zoomed in. Gradle multi-module and NestJS modules get their own level, which C4 does not give them.
- **Throwaway by default.** Diagrams are explanation until you say "keep it"; then they are promoted to a proper drawing and exported into your repo.

## Upstream

This is a fork of [yctimlin/mcp_excalidraw](https://github.com/yctimlin/mcp_excalidraw) (MIT). For the canvas server, CLI, and MCP tools, see the upstream README. The original copyright notice is kept in [LICENSE](LICENSE).

## License

MIT.
