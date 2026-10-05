# Saga

**Question:** When a job spanning several services fails halfway, what gets
undone and what gets pushed through?

**Diagram:** State diagram — nodes are steps with the service that owns them,
failure transitions converge into the compensation chain, and every terminal
state (success, compensated, manual intervention) is drawn.

**Required elements:** ① coordination style and where the progress state is
stored ② step classification (compensatable, pivot, retryable)
③ compensating actions, their order and their scope ④ failure verdicts and
recovery paths (rejected, unknown outcome, compensation itself failed)
⑤ what is done about the missing isolation.

**Drawing rules:** this is a path diagram — the path diagram rules in
[the index](../routing-table.md) apply.

**Routing exceptions:** retries with no compensation → Retry and branching.
