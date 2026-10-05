# Event sourcing

**Question:** Which record of events holds this entity's state, and how is the
current state rebuilt from that record?

**Diagram:** Boxes and arrows — command handler → event store (one stream drawn
as versioned event cells) → subscribers (projections, outbound integrations).

**Required elements:** ① stream boundary and event names ② the append path and
how concurrent writes conflict ③ how state is restored (full replay /
snapshot) ④ how event schema changes are handled ⑤ how external side effects
are suppressed during replay.

**Routing exceptions:** the source of truth is a state database and the events
are derived through outbox or CDC → Event topology and Data flow and derived
data.
