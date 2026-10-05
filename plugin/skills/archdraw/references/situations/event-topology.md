# Event topology

**Question:** Who publishes this event and who receives it, and where does it
go when it fails?

**Diagram:** Boxes and arrows — three columns of publishers, topics and
subscribers; ordering units inside the topic box; failure paths (retry channel,
DLQ) as arrows leaving to the side. **No time axis.**

**Required elements:** ① topic or channel names and event names ② publishers
③ subscribers and consumer groups ④ the unit of ordering guarantee (partition,
ordering key, FIFO — the key itself, not yes or no) ⑤ delivery guarantee and
duplicate handling (at-most / at-least / exactly-once, plus outbox and
idempotency keys) ⑥ failure and reprocessing paths (a retry channel is not a
DLQ; include rewind) ⑦ state stores ⑧ payload pattern: Event Notification /
Event-Carried State Transfer (full state) / Event-Carried State Transfer
(delta) — the pattern name plus the fields at issue, never the whole schema.
Event Notification produces a call back from subscriber to publisher; draw it.

**Routing exceptions:** the order in time → API behavior ⑤. Undo on failure →
Saga. The source of truth is an event store → Event sourcing. Backlog or
throughput → Queue and batch pipeline.
