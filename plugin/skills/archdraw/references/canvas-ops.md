# Canvas operations

How the archdraw skill talks to the canvas. The MCP tools are the primary
interface and need nothing from this file. The CLI section below exists for one
case only: the skill was installed with `npx skills add`, so no MCP server was
registered and there are no archdraw tools in your list.

## CLI fallback

All commands run from this skill's folder as `scripts/archdraw <command>`. The
shim starts the canvas server by itself on first use — there is no separate
install step.

Before the **first** command of a session, tell the user in one line, in their
language, that the canvas server is starting and that it may take a while if
this is the first run on this machine, because the server is downloaded then.
Then run the command.

Output is JSON on stdout (`describe` is plain text). The canvas lives at
`http://127.0.0.1:3000` (or `EXPRESS_SERVER_URL`); ask the user to open that
URL in a browser once.

| Task | MCP tool | CLI |
|---|---|---|
| Create elements | `batch_create_elements` | `echo '<json array>' \| scripts/archdraw add` |
| Look at the canvas | `get_canvas_screenshot` (image in context) | `scripts/archdraw screenshot` → png path; read that file |
| Describe the scene | `describe_scene` | `scripts/archdraw describe` |
| Export the scene | `export_scene` | `scripts/archdraw export` |

Example:

```bash
echo '[{"type":"rectangle","x":100,"y":100,"width":200,"height":60}]' | scripts/archdraw add
scripts/archdraw screenshot
```

`screenshot` and image export need an open browser tab; the CLI exits with
code 4 when no tab is connected. Screenshots land in the data folder
(`$CLAUDE_PLUGIN_DATA`, `$PLUGIN_DATA`, or `~/.excalidraw-architect`) under
`tmp/` unless `--out` is given.
