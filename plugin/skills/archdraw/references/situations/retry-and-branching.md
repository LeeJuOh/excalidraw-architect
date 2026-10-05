# Retry and branching

**Question:** When this call fails, what is retried, how many times and how far
apart, and where does it go when we give up?

**Diagram:** State diagram in UML symbols — rounded rectangles, transition
labels `trigger [guard] / action`, a filled circle to start, a double circle to
end, a diamond to branch.

**Required elements:** ① what is retried at all (retry vs. fail immediately,
including timeouts) ② backoff (initial interval, multiplier, cap, jitter;
`Retry-After` counts as a value) ③ maximum attempts and whether layers multiply
them ④ the path after giving up (fallback response, DLQ, manual) ⑤ the brakes
(circuit breaker states, retry budget, throttle) ⑥ retry safety (idempotency).

**Drawing rules:** this is a path diagram — the path diagram rules in
[the index](../routing-table.md) apply.

**Routing exceptions:** compensation is attached → Saga. The set of entity
states → Entity lifecycle. The whole DLQ landscape across consumers → Event
topology.
