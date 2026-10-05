# Data flow and derived data

**Question:** What is this data's source of truth, through which steps is it
copied where, and how late may it be?

**Diagram:** DFD-style boxes and arrows — boxes are stores and data assets,
arrows are movements, labels are the means and the cadence; external entities
and trust boundaries are marked. **Schemas and fields are not drawn** — that
belongs to Data model.

**Required elements:** ① the source of truth (*none confirmed* means two
sources, which is exactly what needs to surface) ② transformation steps
(aggregate, filter, mask — one word) ③ means of movement (CDC, batch,
synchronous write-through, polling, pub/sub) ④ tolerated lag — a number plus
what happens when it is exceeded ⑤ stores and consumers (*none confirmed* means
derived data nobody reads) ⑥ classification and trust boundaries.

**Routing exceptions:** processing speed or failure reprocessing → Queue and
batch pipeline. The source of truth is an event store → Event sourcing. Read
model synchronisation → CQRS. Replication mode or partition key → Storage
topology. A plan with steps and rollback → Migration.
