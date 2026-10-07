# Canvas guide

How to place and style elements on the archdraw canvas. This file is the only
source for these values: the server reads it at startup, sends the section
below as its MCP `instructions`, and serves the whole file as the resource
`guide://canvas`. Essentials holds the rules every drawing needs; the sections
after it add detail and state each rule and value once, so nothing in
Essentials is repeated below.

<!-- instructions:start -->
## Essentials

Bind every arrow — pass `startElementId` / `endElementId` and let the server
route it. Never compute arrow coordinates by hand. Boxes are 200x60. When you
draw a new diagram on empty canvas, give each node a (column, row) cell and
place it with `x = column * 320 + 40`, `y = row * 180 + 40`, measured from that
diagram's own top-left origin — one node per cell, one flow direction per
diagram. Set `fillStyle: "solid"` on every filled shape and keep body text at
16px or larger.

Place elements once. Do not do arithmetic in prose, do not re-inspect and nudge
coordinates after placing, and do not align or distribute a fresh diagram to
tidy it up. When you add to a diagram that already exists, drop the formula and
put the new element beside its neighbour at the same gaps; the user may have
moved things, and their placement wins.

Dashed (`strokeStyle: "dashed"`) means one thing: the relationship is not
confirmed. Do not use dashed or dotted strokes for async, optional, or weak
links — the arrowhead and the label carry that. Every diagram gets a small
legend for the notation it used.

Draw in this order: shapes with their labels, then arrows bound to them, then
standalone annotations.

The full guide — palette, sizing, line notation — is the resource
`guide://canvas`.
<!-- instructions:end -->

## Placing a new diagram

A canvas holds several diagrams side by side. Pick the origin of a new diagram
clear of what is already on the canvas.

A box keeps its size whatever the label says. Do not size a box to its name —
variable widths force a per-column width pass and that is exactly the
arithmetic the cell formula exists to avoid. A name that does not fit wraps on
the first pass; widen that one box only after a screenshot shows it is
unreadable. If the user asks for a wider box, resize that element and move only
the neighbours it now overlaps, by the gap.

Formalising a user's sketch counts as adding to an existing diagram: follow the
placement that is already there.

## Sizes and text

- Shapes other than nodes: at least 120x60.
- Every shape has a label.
- Font size: titles 20 or more, small labels 14 or more.
- Font: Nunito (`fontFamily: "nunito"`) for all text; the server fills it in
  when you leave `fontFamily` out. Code and contract notes use the monospace
  font Comic Shanns (`fontFamily: "comic shanns"`). Never use the fonts
  Excalidraw marks old: Virgil, Helvetica, Cascadia.
- Leave 20px of padding inside a shape around its text.
- Same-role shapes keep identical dimensions.

## Colors

Color means change status and nothing else. Everything that is not changing is
a white box (`#ffffff`) with black borders and text (`#1e1e1e`) — whatever kind
of thing it is, and whether it is a success or a failure path. A failure shows
in the line and the status-code text, not in a color.

### Change status

| Status   | Fill      | Stroke    | Label        |
|----------|-----------|-----------|--------------|
| Added    | `#ebfbee` | `#2f9e44` | `[added]`    |
| Removed  | `#fff5f5` | `#e03131` | `[removed]`  |
| Modified | `#fff9db` | `#f08c00` | `[modified]` |

- A changed box takes the fill and the stroke of its status, and its label
  follows the box's name on a line of its own. The labels are fixed strings,
  like those in the line-notation table.
- A changed arrow takes the stroke color, and its label follows the arrow's
  own label. Arrows are only ever added or removed: even an arrow that is only
  renamed stays as a removed arrow and gets an added one beside it.
- Modified is for a box that stays and does something different inside.
- A removed element stays on the canvas, so the reader sees what goes away.
- The legend names each status the diagram used.
- When the user asks for a color, choose one that is none of these three. If
  the request clashes with their meaning, say why in one line and offer
  another.

### Contract note

A contract is written on a note: fill `#f1f3f5`, no border
(`strokeColor: "transparent"`), and the body in a monospace font. The gray is a
plain background, not a status, and it never changes — never yellow, even in a
change proposal.

A changed contract is shown line by line, as a diff:

- A line that goes away starts with `-` and is written in the Removed stroke.
- A line that is new starts with `+` and is written in the Added stroke.
- A contract that is new as a whole has every line `+`; one that goes away as a
  whole has every line `-`.
- A text element has one color, so each changed line is its own text element.
- The note carries no change-status label; the `-` and `+` say it without
  color.

## Arrows

- Label the arrow with `text` when the relationship is not obvious from the two
  boxes.
- An arrow between two boxes needs at least 80px of run, 120px when it carries
  a label. The cell formula already allows for this.

### Line notation

| Situation                    | Line and arrowhead                       | Visible label                  |
|------------------------------|------------------------------------------|--------------------------------|
| Confirmed synchronous call   | solid, `endArrowhead: "triangle"` (filled)| call name + `[sync]`          |
| Confirmed asynchronous event | solid, `endArrowhead: "arrow"` (open)     | event name + `[async]`        |
| Confirmed response           | solid, `endArrowhead: "arrow"` (open)     | `response: <result>`          |
| Inferred relationship        | dashed                                    | relationship name + `inferred`|
| Failed code-evidence check   | dashed                                    | relationship name + `no evidence: A -> B` |

These label strings are fixed — write them exactly as shown, in English,
whatever language the conversation is in. Only the names you fill in (the call,
the event, the result) come from the code.

- A line that goes dashed keeps its arrowhead and its `[sync]` / `[async]` or
  response label.
- If you could not confirm how two things communicate, leave the marker off.
  Do not guess one.
- A line whose evidence is a plan rather than code stays solid and takes its
  change-status color — added, or removed for a line the plan takes out.

Responses are drawn solid here. That differs from UML, and it is deliberate:
dashed stays free to mean "unconfirmed".

## Drawing order

Background zones, if the diagram uses them, go before the shapes — large
rectangles with an outline and no fill. The standalone annotations are titles,
the legend, and the "not drawn" line.
