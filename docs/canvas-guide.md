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
- Leave 20px of padding inside a shape around its text.
- Same-role shapes keep identical dimensions.

## Colors

Stroke colors, for borders and text:

| Name   | Hex       | Use for                       |
|--------|-----------|-------------------------------|
| Black  | `#1e1e1e` | Default text and borders      |
| Red    | `#e03131` | Errors, violations, critical  |
| Green  | `#2f9e44` | Success, approved, healthy    |
| Blue   | `#1971c2` | Primary path, links           |
| Purple | `#9c36b5` | Services, middleware          |
| Orange | `#e8590c` | Queues, events                |
| Cyan   | `#0c8599` | Data stores, databases        |
| Gray   | `#868e96` | Annotations, secondary        |

Background fills, each paired with its stroke:

| Fill         | Hex       | Stroke    |
|--------------|-----------|-----------|
| Light red    | `#ffc9c9` | `#e03131` |
| Light green  | `#b2f2bb` | `#2f9e44` |
| Light blue   | `#a5d8ff` | `#1971c2` |
| Light purple | `#eebefa` | `#9c36b5` |
| Light orange | `#ffd8a8` | `#e8590c` |
| Light cyan   | `#99e9f2` | `#0c8599` |
| Light gray   | `#e9ecef` | `#868e96` |
| White        | `#ffffff` | `#1e1e1e` |

Three or four fills per diagram, no more. A diagram that shows a change picks
one further stroke color for everything that changes, uses it nowhere else, and
names it in the legend.

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
- A line whose evidence is a plan rather than code stays solid and takes the
  change color.

Responses are drawn solid here. That differs from UML, and it is deliberate:
dashed stays free to mean "unconfirmed".

## Drawing order

Background zones, if the diagram uses them, go before the shapes — large
light-fill rectangles at low opacity. The standalone annotations are titles,
the legend, and the "not drawn" line.
