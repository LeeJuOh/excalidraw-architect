---
name: archdraw
description: Draw and refine backend architecture diagrams with the user on a live Excalidraw canvas. Manual only — the user invokes it.
disable-model-invocation: true
allowed-tools: Bash(${CLAUDE_SKILL_DIR}/scripts/archdraw *)
---

# archdraw

You and the user look at the same canvas and fix it together. The picture is
the surface where the two of you check that you understood the same thing —
before the user delegates the implementation, not after the misunderstanding
shows up in code.

Your job is the judgement: which diagram answers this question, how far in it
stands, which elements it must carry, and what is evidence versus what is a
plan.

## 1. Use the archdraw MCP tools

Look at your tool list. If it has archdraw tools — `batch_create_elements`,
`get_canvas_screenshot`, `export_scene`, and the rest — this skill is fully
served by them. Do not run any shell command from this skill. The server is
already running: the host started it when it connected the tools.

- The canvas lives at `http://127.0.0.1:3000` (or `EXPRESS_SERVER_URL`). Your
  first tool call opens the canvas session; tell the user that URL and ask them
  to open it in a browser once.
- Create elements as a batch with `batch_create_elements`.
- Look at what you drew with `get_canvas_screenshot` before telling the user it
  is done. It needs an open browser tab; if it reports no client connected, ask
  the user to open the URL and try again.

Which call does what, what an element looks like on the way in — the
`evidence` field, the `link` field, custom ids, bound labels — and what to do
when a call fails are all in
[references/canvas-ops.md](references/canvas-ops.md). Read it when you need one
of those.

## 2. Only if there are no archdraw MCP tools

Then the skill was installed with `npx skills add`, which registers no MCP
server. Everything above still applies; the calls are shell commands instead.
Follow the **CLI fallback** section of
[references/canvas-ops.md](references/canvas-ops.md) — including opening the
canvas session on the first turn and carrying its key.

## 3. When the canvas cannot be reached

Do not retry silently. Tell the user what failed and the likely cause, then let
them decide:

- **No browser tab open.** Screenshots and image export need one.
- **No internet on the first CLI run.** The CLI fetches the server from npm the
  first time; without network there is nothing to run yet.
- **Sandbox restrictions.** Codex's defaults block network access and writes
  outside the workspace, which stops that same fetch.

## 4. Read the spec before you draw

Sizes, colors, arrow binding, placement, drawing order and the notation's
label strings live in one place: the resource `guide://canvas`. Read it before
you draw the first elements of a conversation, and follow it. Neither this file
nor `references/canvas-ops.md` carries a copy of those values — when you need
one, read it there.

## 5. Canvas first

Before you act in a turn, look at the canvas with `get_canvas_screenshot`
(`screenshot`). The user has been editing it too.

- **What the user moved is correct.** Never touch the coordinates of an element
  the user moved. Align only the elements you are drawing now. `describe_scene`
  (`describe`) rounds coordinates, so use it to find things, not to compare
  positions precisely.
- **The canvas is never cleared.** A new diagram goes into a new frame beside
  what is there. `clear_canvas` happens only when the user says so.
- **User marks** — anything the user left on the canvas that is not part of
  your drawing, and any edit they made — are one of three things: a
  correction, a proposal, or a decision. When the meaning is plain, follow it.
  When it is not, ask. Do not treat something that is not in the code as fact
  because it appeared on the canvas.
- **Stop repairing after two tries.** If the same problem (overlapping labels,
  evidence you cannot find) is no better after two fixes, stop and say so:
  "I cannot get these labels apart, please move them" / "I cannot find
  evidence for order → payment, leaving it dashed."
- **Deleting a label is not a repair.** An overlapping arrow label gets moved
  or shortened, never removed: the label carries the meaning, and without it
  the diagram states something false. The only exception is a label whose
  meaning is already fully carried by the two boxes it sits between.
- **The "not drawn" line.** Under the diagram, one line of text: what you left
  out *on purpose at this level* — say, event subscriptions omitted from a
  module-boundary diagram. Not what the level's own rules exclude, and not the
  dashed lines; those are already visible. Leave the line out when there is
  nothing to say. It goes on the canvas, so it survives screenshots and saves.
  If the user says "draw that too", add it to this diagram when it is the same
  type, and draw a new diagram beside it when it is not.

## 6. Pick the diagram from the question

Read the user's words as one of the twenty-one questions in
[references/routing-table.md](references/routing-table.md) and draw that
situation's diagram.

- **The question wins over the name.** Assume the user may not know the diagram
  types, or may name the wrong one — "draw me the architecture" means "draw me
  a picture", not "draw a specific type".
- **Say why, in one line, in chat.** "Cancellation ordering is the issue, so a
  sequence."
- **The frame name is the question the diagram answers.**
- **Ask only when the words read two ways.** When one type fits, do not ask.
  When you do ask, give each candidate a small ASCII preview — retry policy as
  a state diagram versus call order as a sequence — so the user picks by
  looking.
- Never ask whether to keep the diagram before choosing a type. That is
  decided at save time, and answered by the save-state line (§10).

Three rules cut across every diagram: **one type per diagram**, **real names**,
**nothing is kept by default**.

### Required elements

Each row lists the elements that diagram must carry. Every one of them has a
value in the finished picture: the real value read from code, *none confirmed*,
or *not confirmed* (drawn dashed). **Never drop an item** to avoid filling it.
Value lists the skill does not fix — default backoff intervals, severity grades
— come from the project, not from here.

## 7. Zoom levels

Structural diagrams stand at one of five levels: system context, deployment
unit, module boundary, layer, boundary type. Say the name to the user, never
the number. The allowed detail per level, how zooming skips duplicated steps,
how a shared module's inner diagram is referenced, DDD mapping, evidence
extraction and evidence tags are in
[references/zoom-levels.md](references/zoom-levels.md). Read it before drawing
a structural diagram.

Two rules from that file are worth repeating here, because they are what makes
a diagram true:

- A build file proves *depends on*. Drawing "calls" or "subscribes to" needs
  the calling or subscribing line of code; a dependency declaration alone is an
  inference, and an inference is dashed.
- Lines that are not in the code yet — a change proposal, a migration plan, a
  contract under negotiation — take the `design` evidence tag and stay solid in
  the change color. Tagging them `code` just fills the diagram with
  no-evidence markers.

## 8. Notation

Dashed means exactly one thing: this line or this value is not confirmed. How
two things communicate is read from the arrowhead and the label, independently.
The exact strings — for a synchronous call, an asynchronous event, a response,
an inference, a failed evidence check — are fixed English, and they live in the
line-notation table of `guide://canvas`. Read them there and write them
verbatim, whatever language the conversation is in. The names you fill in (the
call, the event, the result) come from the code.

- If you could not confirm how two things communicate, leave the marker off
  rather than guessing one.
- Give every diagram a legend for the notation it actually used.
- Past roughly ten to fifteen main nodes, split into an overview diagram plus
  one diagram per group (`references/zoom-levels.md`).

A diagram is easier to read when it carries three things at once, without
mixing in detail from a lower level: a **summary strip** of the whole path
along one edge, **labelled regions** that say what belongs with what, and
**concrete names** in the leaves — the real endpoint, the real topic, the real
table.

After drawing or editing elements, take a screenshot and look at it: truncated
text, overlapping shapes, arrows crossing shapes, labels colliding with arrows
or shapes. Fix what you find and look again — and stop after two failed tries
(§5).

Then ask two questions of the picture. **Would the shape still say it with
every word removed?** If the arrangement carries none of the meaning, the
layout is decoration and wants redrawing. **Does each box and each line map
onto something real?** Point from every one of them to the code artifact it
stands for, or to the `design` tag that says it is not there yet. Anything you
cannot point from is something you invented.

## 9. Using it inside a conversation

The skill is reached when text is not getting through. Four entry points, all
the same move — put what the conversation is about on the canvas — differing
only in the subject:

- **Forward** (most common). You explained something in text and it did not
  land. Draw that explanation. Same as any "show me" request, except the output
  is the canvas and the type comes from the routing table. **Do not add
  participants your explanation did not have.**
- **Purpose question.** The user needs to see the current state to decide:
  "why the deadlock", "what comes along if we split this". Route it through the
  table like any other question.
- **Reverse.** "Draw it the way you understood it" — the user has stated a
  decision and is checking, *before* delegating the implementation, that you
  understood the same thing. Put both in one diagram: the **current structure
  read from the code** (`code` tags) and **what changes** as you understood the
  user (`design` tags, change color). Only the change, or only the current
  state, fails the purpose. When the user then fixes an arrow you drew in the
  change color, the next turn continues from their version.
- **Draft start.** The user roughs out the big picture first — a hand drawing,
  a photo, boxes dropped on the canvas — and says "let's talk about this
  draft". Read the draft from the screenshot and draw the formal diagram
  **beside it**, keeping their arrangement and order; the draft itself stays
  until they say to remove it. Pick the single zoom level the draft sits at and
  name it. Check each draft box against the code: what exists gets the `code`
  tag, what does not gets the `design` tag and the change color. If you cannot
  tell what a box corresponds to, ask. Later turns go box by box: "inside this
  new module it will look like this" draws that box's inner diagram beside it,
  as a reference — never lower-level elements inside the parent box.

**Carrying on.** Once called, in the same conversation, an answer that involves
connections or ordering goes to the canvas first, without the user invoking the
skill again — drawn onto the existing diagram. An answer that is only a value
or a reason stays in text.

**The boundary.** Structure, flow and boundaries belong on the canvas. Code,
queries, values and reasons belong in text. The zoom levels end at boundary
types; below that — method bodies, query plans — is not something to draw. "Why
is this query slow" gets a text answer and no new elements.

Once a decision is made on a diagram, that diagram is the basis for the
implementation; no second reverse check is needed.

## 10. Saving

**Scope.** "Save this" saves the whole canvas — every diagram, with its
arrangement — as one `.excalidraw` file. "Save just the order diagram" saves
that one. Do not re-ask about scope each time; ask only when the named target
is ambiguous.

**Path and file name.** There is no fixed output folder.

- The user gave both: use both, exactly. Do not translate a file name they
  chose.
- Only a path: choose an English file name from what the diagram shows.
- Only a file name: choose the folder by looking at where this project already
  keeps its documents.
- Neither: choose both the same way, save without asking to confirm, and then
  tell the user the full path including the file name.

Report the path the save actually returned. If a file of that name is already
there, the server refuses it — pass that refusal on rather than overwriting or
appending a suffix, and do not report a failed save as a success.

**Unconfirmed values do not block a save.** If required elements are still
*not confirmed* when the user says "save this", save immediately, keep the
dashes and the markers, and tell them which items are unconfirmed. Never make
filling a value a precondition for saving.

**Snapshots** are kept on disk with no TTL: say that a snapshot survives the
server stopping and restarting and does not expire. If the user does not name
one, build the name from the creation time in UTC to the second plus an English
name for what the canvas shows — `YYYY-MM-DD_HHmmssZ_<english-name>`, for
example `2026-09-16_053012Z_order-flow`. A name the user gave is used as is.
Report the actual name and the full path the save returned; a collision on the
same second and name is a refusal, not a success.

**The save-state line.** At the end of any turn you answered with a diagram,
copy the per-diagram save state that came back with `get_canvas_screenshot`
into one line of chat — saved path / modified since save / file missing /
unsaved, plus the last snapshot. Do not count or remember it yourself: the
value comes from the server. Do not ask whether to save. When the user says
they are done, and some diagram is unsaved or modified since its save, ask
once whether to save, then call `session_end` (`session end`).

## 11. Two modes

**Explanation mode is the default.** Just what the question needs, no finish,
not saved. Accuracy is exactly the same as in the other mode — only the scope
and the polish shrink. Argue with the picture here: prefer the arrangement that
makes the point over the one that looks tidy, and drop anything that is not
part of the answer.

**Drawing mode** is for a diagram that is being kept: standard shapes, even
placement, a legend, and an export to the path the user named. Stop arguing
with the layout and make it uniform; `align_elements` (`arrange align`) belongs
here and nowhere else.

Promotion happens **only because the user said so** — "tidy this up", "save
this". Never ask whether to promote; the save-state line (§10) is what you say
instead. The reverse also works: copy a kept drawing and overlay it for an
explanation.

When a before/after pair is the point, take a snapshot (`snapshot_scene`,
`snapshot save`) before the change, then draw the after beside it.

## Developing on this repo

`ARCHDRAW_BIN=<repo>/dist/bin.js` (after `npm run build`) makes the shim run a
local build instead of the published package, on both the MCP and the CLI path.
The host process has to inherit it, so start `claude`/`codex` from a shell that
has it set.
