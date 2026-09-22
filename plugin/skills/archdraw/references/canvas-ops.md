# Canvas operations

How the archdraw skill talks to the canvas: which call does what, and what an
element looks like on the way in. The **CLI fallback** section near the end is
for one case only — the skill was installed with `npx skills add`, so no MCP
server was registered and there are no archdraw tools in your list.

Sizes, colors, placement, drawing order and line notation are **not** here.
They live in the resource `guide://canvas`, which the server serves. Read that
before drawing.

## Tools and their CLI equivalents

Same canvas, same semantics; only the transport differs. MCP results land in
your context and a screenshot comes back as an image. The CLI prints JSON on
stdout (`describe` prints plain text) and a screenshot as a file path you then
read.

| What you want | MCP tool | CLI |
|---|---|---|
| Create many elements at once | `batch_create_elements` | `add` (file, `-`, or piped stdin) |
| Create one element | `create_element` | `add --one '{...}'` |
| Create, update and delete in one call | — | `apply` |
| Read one element | `get_element` | `get <id>` |
| Update one element | `update_element` | `update <id> --set '{...}'` |
| Delete elements | `delete_element` | `delete <id> [...]` |
| Find elements | `query_elements` | `query` |
| Describe the scene | `describe_scene` | `describe` |
| Look at the canvas | `get_canvas_screenshot` | `screenshot` |
| Read scene / theme / elements as a resource | `get_resource` | — |
| Move the camera | `set_viewport` | — |
| Align | `align_elements` | `arrange align` |
| Distribute | `distribute_elements` | `arrange distribute` |
| Group / ungroup | `group_elements`, `ungroup_elements` | `arrange group`, `arrange ungroup` |
| Lock / unlock | `lock_elements`, `unlock_elements` | `arrange lock`, `arrange unlock` |
| Duplicate | `duplicate_elements` | `arrange duplicate` |
| Export the scene | `export_scene` | `export` |
| Import a scene file | `import_scene` | `import` |
| Export an image | `export_to_image` | `screenshot --out f.png`, `screenshot --format svg` |
| Share link | `export_to_excalidraw_url` | `share` |
| Save a snapshot | `snapshot_scene` | `snapshot save <name>` |
| Restore a snapshot | `restore_snapshot` | `snapshot restore <name>` |
| List snapshots | — | `snapshot list` |
| Clear the canvas (user's word only) | `clear_canvas` | `clear --yes` |
| Mermaid onto the canvas | `create_from_mermaid` | `mermaid` |
| Open a canvas session | automatic on the first tool call | `session start` |
| List / attach / end a canvas session | `session_list`, `session_attach`, `session_end` | `session list`, `session attach`, `session end` |
| Start / stop / inspect the server | — (the host runs it) | `start`, `stop`, `status` |

## Element format

Both interfaces take the same agent-friendly shape and normalise it:

- **Labels** — put `"text": "My Label"` on any shape; it becomes Excalidraw's
  bound-label form for you.
- **Arrow binding** — `"startElementId"` and `"endElementId"`, as
  `guide://canvas` requires.
- **Custom ids** — give shapes your own `"id"` (`"auth-svc"`) so you can bind
  arrows to them in the same call and update them later.
- **Diagram reference** — a box that zooms into another diagram carries
  `"link": "?element=<target frame id>"`.
- **Evidence** — `"evidence": {"tag": "code"|"design"|"log", "path": ..., "line": ...}`.
- **fontFamily** — a name (`"helvetica"`) or a string number.
- **points** — `[[x, y], ...]` tuples and `[{"x":…,"y":…}]` objects both work.
- **Patch updates** — in `apply`, an update entry uses either direct fields
  (`{"id":"a","x":120}`) or a `set` object (`{"id":"a","set":{"x":120}}`),
  never both in one entry.

Send them in the order `guide://canvas` sets out.

## Refining what is already there

1. `describe_scene` (`describe`) to find element ids and what is on the canvas.
   Identify elements by id or label text, not by coordinates — coordinates
   move, and when the user moved them, their placement wins.
2. `update_element` (`update`) to change one, or bundle the whole change into
   one `apply` patch. **Bound arrows re-route themselves** when their endpoints
   move or resize; do not delete and recreate them.
3. `get_canvas_screenshot` (`screenshot`) and look at the image.

## CLI fallback

Only for the `npx skills add` install, where no MCP server was registered.

All commands run from this skill's folder as `scripts/archdraw <command>`. The
shim starts the canvas server by itself on first use — there is no separate
install step. Run `session start` on the first turn, tell the user the URL it
returns, and pass `--session <key>` on every later call. If the key is lost,
`session list`: one canvas session in this project means go back to it, several
mean ask the user which, reading the key from the browser tab title.

Before the **first** command of a session, tell the user in one line, in their
language, that the canvas server is starting and that it may take a while if
this is the first run on this machine, because the server is downloaded then.
Then run the command.

The canvas lives at `http://127.0.0.1:3000` (or `EXPRESS_SERVER_URL`); ask the
user to open that URL in a browser once.

```bash
echo '[{"type":"rectangle","x":100,"y":100,"text":"Order API"}]' | scripts/archdraw add
scripts/archdraw screenshot
```

Screenshots land in the data folder (`$CLAUDE_PLUGIN_DATA`, `$PLUGIN_DATA`, or
`~/.excalidraw-architect`) under `tmp/` unless `--out` is given.

Exit codes: 0 ok, 1 error, 2 usage, 3 canvas unreachable, 4 browser tab
required.

## When a call fails

- **Canvas unreachable (exit 3).** Auto-start is off (`EXCALIDRAW_NO_AUTOSTART`)
  or `EXPRESS_SERVER_URL` points somewhere non-local. Run `start`, or fix the
  variable.
- **Browser tab required (exit 4).** Screenshots, image export, viewport moves
  and Mermaid conversion all render in the frontend. Ask the user to open the
  canvas URL, then retry.
- **Elements not visible.** Check `describe` — they may be off screen. Move the
  camera with `set_viewport` (`scrollToContent`, or `scrollToElementIds` with
  an optional zoom factor).
- **An arrow did not connect.** Verify the ids: `startElementId` and
  `endElementId` must match elements that exist.
- **An element will not update.** It may be locked — unlock it first.
