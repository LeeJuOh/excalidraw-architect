# Performance bottleneck

**Question:** Where did this request's time go, span by span, and what has to
shrink for the whole to shrink?

**Diagram:** Trace waterfall — one shared horizontal time axis, one bar per
span, children indented under their parent; overlapping bars are parallel and
consecutive bars are serial; the critical path is highlighted. A flame graph is
not mixed into the same diagram — it has no time axis.

**Required elements:** ① time per span (an uninstrumented span is *not
confirmed*, not zero) ② share of the total ③ serial versus parallel spans
④ the critical path ⑤ the measurement basis — percentile, sample, instrumentation
points.

**Drawing rules:** this is a path diagram — the path diagram rules in
[the index](../routing-table.md) apply. Serial or parallel is decided by
whether the spans' start and end times overlap. Relationship types
(`child-of`, `follows-from`) are evidence for waiting and causality only, never
for the serial/parallel verdict — several children running at the same time
are all `child-of` too. With no timestamps the answer is *not confirmed*. The
critical path needs the join points confirmed; with no evidence of the waits
and the joins, it is *not confirmed* as well.

**Routing exceptions:** the wall-clock course of a single incident → Incident
analysis. Throughput or backpressure → Queue and batch pipeline. Lock waits →
Concurrency and locks. Resource saturation (CPU, connections) is the point →
this is not that diagram.
