# Dependency reach

**Question:** If I touch this piece, how far does the dependency graph reach —
who uses it, and whom does it use?

**Diagram:** An overlay on an existing dependency diagram (a module-boundary
diagram, usually). The anchor node gets a thick border. The two directions are
shown by place and by arrows: on the left, what uses the anchor; on the right,
what the anchor uses. Modules the graph does not reach are not drawn.

**Required elements:** ① the anchor node ② both directions marked separately
③ depth (direct only / n hops / unbounded) ④ what the graph was built from —
declaration files, directory convention, or import inference — as one line
under the title ⑤ graph scope (directories and modules, plus which dependency
kinds are included: compile, runtime, test).

**Drawing rules:** the "not drawn" line says that actual impact is not judged
here — reach is not impact. Never put the words *impact*, *blast radius* or
their translations in the title or the description: adding one field usually
only touches direct callers. In-process events (Spring events, for example) are
caught by imports but their arrow runs opposite to the runtime flow — mark
that.

**Routing exceptions:** events that travel through a broker are not caught here
→ Event topology.
