# Queue and batch pipeline

**Question:** Where does this processing get stuck, how far behind is it, and
how do failed items go round again?

**Diagram:** Pipeline graph — nodes are processing stages, edges are the flow
between them, nodes carry their parallelism, edges carry backlog and throughput
labels.

**Required elements:** ① stages and their order ② the unit of execution and
restart — where does it resume from ③ throughput and backlog ④ the unit of
parallelism and its ceiling ⑤ backpressure and flow control (for a queue with
no such mechanism, *none confirmed* is the right answer) ⑥ failure handling and
reprocessing paths (retry / DLQ / selective reprocessing) ⑦ idempotency.

**Drawing rules:** this is a path diagram — the path diagram rules in
[the index](../routing-table.md) apply.

**Routing exceptions:** the store or the source of truth is the point → Data
flow and derived data. Topic ownership or subscribers → Event topology. Backoff
and attempt counts for one stage → Retry and branching. The time breakdown of
one request → Performance bottleneck.
