# Canvas guide

How to place and style elements on the archdraw canvas. This file is the only
source for these values: the server reads it at startup, sends the section
below as its MCP `instructions`, and serves the whole file as the resource
`guide://canvas`.

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

Dashed means one thing: the relationship is not confirmed. Do not use dashed or
dotted strokes for async, optional, or weak links — the arrowhead and the label
carry that. Every diagram gets a small legend for the notation it used.

Draw in this order: shapes with their labels, then arrows bound to them, then
standalone annotations.

The full guide — palette, sizing, line notation, anti-patterns — is the
resource `guide://canvas`.
<!-- instructions:end -->

## Placing a new diagram

A canvas holds several diagrams side by side, so every coordinate below is
relative to the top-left origin of the diagram you are drawing, not to the
canvas origin. Pick that origin clear of what is already on the canvas.

1. Decide the flow direction for this diagram — top-to-bottom or
   left-to-right. Keep it for the whole diagram.
2. Give every node a `(column, row)` cell. Two nodes never share a cell.
3. Compute `x = column * 320 + 40` and `y = row * 180 + 40`.

The pitches come from the box plus the minimum arrow run: a 200px-wide box plus
120px of labelled arrow is 320, a 60px-tall box plus 120 is 180, and the margin
is 40.

Boxes stay 200x60 whatever the label says. Do not size a box to its name —
variable widths force a per-column width pass and that is exactly the
arithmetic this formula exists to avoid. A name that does not fit wraps on the
first pass; widen that one box only after a screenshot shows it is unreadable.
If the user asks for a wider box, resize that element and move only the
neighbours it now overlaps, by the gap.

The formula is for a blank start. Adding to an existing diagram, formalising a
user's sketch, or touching anything the user has moved: follow the placement
that is already there.

### Do not, when placing

- Do not work out x and y in prose. Choose the cell, then apply the formula.
- Do not review and adjust coordinates after placing them.
- Do not put two nodes in the same cell.
- Do not change flow direction partway through a diagram.
- Do not run `align_elements` or `distribute_elements` to clean up a diagram
  you just placed.

## Sizes and text

- Nodes: 200x60. Other shapes: at least 120x60.
- `fillStyle: "solid"` — the default hachure fill reads as a sketch.
- Font size: body 16 or more, titles 20 or more, small labels 14 or more.
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

- Bind: `startElementId` and `endElementId`. Hand-placed arrow points drift the
  moment anything moves.
- Label the arrow with `text` when the relationship is not obvious from the two
  boxes.
- An arrow between two boxes needs at least 80px of run, 120px when it carries
  a label. The column and row pitches above already allow for this.

### Line notation

Dashed is reserved for one meaning: this line or value is not confirmed. How
something communicates is read from the arrowhead and the label, independently
of whether it is confirmed.

| Situation                    | Line and arrowhead                       | Visible label                  |
|------------------------------|------------------------------------------|--------------------------------|
| Confirmed synchronous call   | solid, `endArrowhead: "triangle"` (filled)| call name + a sync marker     |
| Confirmed asynchronous event | solid, `endArrowhead: "arrow"` (open)     | event name + an async marker  |
| Confirmed response           | solid, `endArrowhead: "arrow"` (open)     | `response: <result>`          |
| Inferred relationship        | dashed                                    | relationship name + `inferred`|
| Failed code-evidence check   | dashed                                    | relationship name + `no evidence: A -> B` |

Write the visible labels in the user's language.

- A line that goes dashed keeps its arrowhead and its sync/async or response
  label.
- If you could not confirm how two things communicate, leave the marker off.
  Do not guess one.
- A line whose evidence is a plan rather than code stays solid and takes the
  change color.
- Give every diagram a legend for the notation it actually used.

Responses are drawn solid here. That differs from UML, and it is deliberate:
dashed stays free to mean "unconfirmed".

## Drawing order

1. Background zones, if the diagram uses them — large light-fill rectangles at
   low opacity.
2. Shapes, with their labels.
3. Arrows, bound to those shapes by id.
4. Annotations — standalone text for titles, the legend, the "not drawn" line.

## Anti-patterns

1. Overlapping elements. The cell formula prevents this; do not undo it.
2. Hand-placed arrow coordinates instead of `startElementId` / `endElementId`.
3. Fonts under 14px.
4. Hachure fills — set `fillStyle: "solid"`.
5. More than three or four fill colors in one diagram.
6. Same-role shapes at different sizes.
7. Shapes or meaningful arrows with no label.
8. Dashed strokes used for anything but "not confirmed".
