# API behavior

**Question:** Who calls whom in what order for this request, what comes back,
and where does it branch on failure?

**Diagram:** Sequence — participant head boxes with lifelines, activation bars,
conditional branches as `alt` / `opt` with `[condition]`.

**Required elements:** ① caller and callee ② request and response (name, main
arguments, status code) ③ sync or async per message ④ failure and alternative
paths (success, failure, unknown outcome — three branches) ⑤ asynchronous
follow-up (202 + Location + Retry-After, queue, background job, completion
notice, retry, timeout — *none confirmed* for a synchronous API) ⑥ timeout and
deadline per call.

**Drawing rules:** this is a path diagram — the path diagram rules in
[the index](../routing-table.md) apply. Arrows follow the line notation in the
resource `guide://canvas`.

**Routing exceptions:** compensation is attached → Saga. Retry counts for one
call → Retry and branching. The shape of the payload → Contract.
Authentication is itself the question → Authentication and authorization.
