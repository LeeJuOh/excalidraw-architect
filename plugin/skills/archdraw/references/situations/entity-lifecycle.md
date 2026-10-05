# Entity lifecycle

**Question:** Which states does this entity pass through, what changes its
state, and how does it end?

**Diagram:** State diagram in UML symbols; a terminal state is one with no
outgoing arrow.

**Required elements:** ① initial and in-progress states ② transition triggers
and guards ③ waiting and retrying states ④ every terminal state (*none
confirmed* for a cyclic lifecycle) ⑤ irreversible transitions and no-return
points, written as a sentence — a transition that is not drawn is already the
impossible one, so it is not drawn separately.

**Routing exceptions:** undo or push-through on failure → Saga. State stored
and restored as events → Event sourcing. Retry counts for one call → Retry and
branching. Participants interacting with no durable state → API behavior.
