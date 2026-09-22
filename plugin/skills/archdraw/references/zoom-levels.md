# Zoom levels and evidence

Five levels guide how far in a structural diagram stands. They are a guide, not
a containment tree: the real code decides which steps exist.

| Level | Name             | What the diagram is about                          |
|-------|------------------|----------------------------------------------------|
| L1    | System context   | One system, its users and the systems around it     |
| L2    | Deployment unit  | Separately deployed runnables — services, workers   |
| L3    | Module boundary  | Modules as the build tool or framework declares them |
| L4    | Layer            | The responsibility slots this project's style cuts  |
| L5    | Boundary type    | The types on a layer boundary: ports and their implementations |

This is C4's Context / Container / Component with a module layer wedged in,
because Gradle multi-modules and Nest modules have no slot in C4.

Say the name to the user, never the number: "the module-boundary diagram", not
"L3".

## Detail allowed per level

Fixed, and a diagram never borrows detail from a lower level:

- **L2** — endpoint and topic names.
- **L3** — module names and the tables a module owns. No class names.
- **L4 and below** — classes.

Skipping a step is not permission to mix lower detail into a higher diagram.

## L4: the layer diagram

The lane names are **this project's architecture style, as it is**:

- Hexagonal: adapter-in / application (in-port, service, out-port) / domain /
  adapter-out
- Clean: entities / use cases / interface adapters / frameworks
- Three-tier: controller / service / repository

Work the style out from package names, ArchUnit rules and module structure. If
you cannot read it, ask.

Whatever the style, one required element is shared: **dependency arrows, with
violations of the allowed direction marked in red** (domain → infra and the
like). Violations differ per module, which is what makes a layer diagram worth
drawing per module.

If a module is itself a layer, there is no separate L4 diagram — go from the
module diagram straight to the boundary types.

## How zooming actually runs

Follow the real structure. Skip a duplicated step, and let several diagrams
share one inner diagram:

- A feature module: deployment unit → order module → the order module's layers
  → boundary types.
- Layer-per-Gradle-module (`domain`, `adapter` as separate modules): the module
  diagram already shows the layers, so go from it to the boundary types with no
  layer diagram in between.
- A shared auth module used by the order API and the settlement worker: mark
  the usage relationship in *each* deployment unit's diagram, and have both
  reference the same one inner diagram. Do not draw a second copy.

L5 holds boundary types only — ports and their implementations. Do not list
the classes inside; that list goes stale fastest.

### Diagram references

A box that zooms into another diagram carries the target in its `link` field as
`?element=<target frame id>`. To navigate, read that value and move the
viewport to the frame it names. The reference is by id, not by frame name, so
it survives renaming and copying.

When the user asks to see the inside of something, look for that inner diagram
on the canvas first: if it is there, move and zoom the viewport to it; only draw
it when it is not. If a reference points at a frame that is not on the canvas —
a file saved with only part of the canvas — say so and draw it anew or ask. Do
not substitute a different diagram that happens to have the same name.

## DDD mapping

No extra level.

**Strategic.** A bounded context is not pinned one-to-one to a deployment unit
or a module. Mark it the way the code and the design actually cut the domain:
if it coincides with one box, name that box; if one box holds several contexts,
draw the boundary inside it; if it spans several boxes, draw the boundary
around them. Context relationships (ACL, shared kernel, conformist,
upstream/downstream) are labels on arrows between contexts — they are not the
same thing as connections between deployment units.

**Tactical.** In the L4 domain lane, use the «aggregate», «domain service» and
«event» stereotypes. Do not list the entities inside an aggregate. With DDD on
hexagonal, adapter-in and adapter-out take the place of UI and Infrastructure.

## Evidence extraction

Three lines, in order:

1. Find the file where the dependency is **declared** — the build file, the
   module decorator.
2. Failing that, the **directory convention**.
3. Failing that, **infer it from imports** — and draw it dashed.

**A declaration file or a convention proves "depends on" and nothing more.**
"Calls", "subscribes to", "handles the failure of" are solid only when the
calling, subscribing or handling line of code is the evidence. A dependency
declaration alone makes it an inferred, dashed line.

Work out the architecture style the same way: package names and ArchUnit rules,
then convention, then ask.

## Evidence tags

Every line and every value you draw carries one evidence tag in its `evidence`
field:

- **`code`** — written with `path` and `line`. The server checks that the file
  exists and that the line is inside it on every draw; a line that fails the
  check is demoted to dashed and gets a no-evidence marker. The server checks
  existence only, never whether the dependency is real. That judgement is
  yours.
- **`design`** — something agreed or under discussion that is not in the code
  yet: a migration plan, a contract being negotiated, a change proposal. Not
  checked, only recorded. These lines stay **solid and take the change color**.
  Tagging them `code` is what piles up no-evidence markers, one per line.
- **`log`** — an actual recorded occurrence, as in an incident timeline. Not
  checked.

Evidence tags are element data, not something drawn. You and the server read
them; the user sees the dashed lines and the markers.

## Crowding

Past roughly ten to fifteen main nodes in one diagram, group them one level
deep along a code boundary — package, directory, team — and draw an **overview
diagram plus one diagram per group**. All of them on the same canvas, in their
own areas; existing diagrams are not touched. The number is guidance; the
judgement is yours.
