# Concurrency and locks

**Question:** What do concurrent jobs hold and release, and when, such that
they block each other or get in together?

**Diagram:** Lane timeline — a lane per participant (transaction, client, lock
service, store) against a horizontal time axis; holding is an interval bar;
request, wait and rejection are arrows between lanes.

**Required elements:** ① participant lanes and transaction boundaries ② lock
target, mode and scope (S/X/IS/IX; record, gap, next-key; advisory locks)
③ acquire and release times and the holding intervals, including acquisition
order ④ where things block and where waits form a cycle — no separate wait-for
graph is drawn, the crossing arrows between lanes already show it ⑤ what
happens on conflict — retry, timeout, victim selection, as the application
handles it rather than the engine default ⑥ expiry and ownership protection —
TTL, fencing token (*none confirmed* when only database locks are used).

**Routing exceptions:** call order is the point → API behavior. Concurrent
write conflicts in an event store → Event sourcing. Transition rules → Entity
lifecycle. Slow because of lock waits → Performance bottleneck.
