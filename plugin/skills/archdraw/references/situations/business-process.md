# Business process

**Question:** Under which conditions does this business work take which path,
and how does each path end?

**Diagram:** Activity diagram in UML symbols — a filled circle to start,
rounded rectangles for actions, a diamond with a `[guard]` on each outgoing
edge for every decision, and an end node. Lanes are optional; if you use them,
choose what they split by and which way they run.

**Required elements:** ① what starts it ② every decision point and its guard
conditions — the real conditions from the code ③ what each path does ④ the end
of every path ⑤ what happens when no condition matches (*none confirmed* is
allowed).

**Routing exceptions:** several conditions combine → a decision table in text
instead of a diagram (Fowler). In which states it is allowed → Entity
lifecycle. Who calls whom → API behavior. Failure and retry of one call → Retry
and branching.
