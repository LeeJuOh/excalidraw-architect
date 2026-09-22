# Routing table

Twenty-one situations. Read the user's words as one of the questions below and
draw that situation's diagram. The question wins over the diagram name the user
happened to use.

Each row carries:

- **Question** — the one sentence this diagram answers. It becomes the frame
  name.
- **Diagram** — the notation.
- **Required elements** — every one of these carries a value in the finished
  diagram: the real value read from code, *none confirmed*, or *not confirmed*
  (dashed). Never drop an item to avoid filling it.
- **Routing exceptions** — conditions that send the utterance to another row.
- **Drawing rules**, where the row has any.

Rows are split by the question, not by the notation: API behavior and
authentication are both sequences because the questions differ.

Concept names keep their original English — Event Notification, Event-Carried
State Transfer, saga, CQRS — untranslated, whatever language the conversation
is in.

---

## Structure

### System overview

**Question:** What is this system made of, and how are those pieces connected
to each other and to the outside?

**Diagram:** Boxes and arrows, static structure. One diagram is one zoom level,
and every diagram states its scope.

**Required elements:** ① zoom level and scope ② the main elements at this level
③ outside users and external systems ④ ownership and trust boundaries ⑤ intent
and technology label on every connection ⑥ one line of responsibility per
element.

**Drawing rules:** detail per level is fixed — see
[zoom-levels.md](zoom-levels.md). One main path.

**Routing exceptions:** instances or environments → Deployment map. The call
order of one request → API behavior.

### Deployment map

**Question:** Where in which environment is each deployment unit running, how
many of them, and which connections cross a boundary?

**Diagram:** Deployment diagram — nested rectangles (region ▷ network ▷ cluster
▷ host) holding deployment-unit instance boxes; a line between nodes is a
communication path.

**Required elements:** ① environment ② deployment node hierarchy ③ the
deployment units on each node and their instance counts ④ stateful services
⑤ boundary-crossing connections and their means ⑥ health checks (kind, target,
interval) ⑦ single points of failure ⑧ workload ownership.

**Routing exceptions:** what people do when it breaks → Incident response flow.
How data is laid out inside a store → Storage topology.

### Storage topology

**Question:** Which stores does this data live in, in how many copies, and
which reads may be stale?

**Diagram:** Boxes and arrows — store ▷ shard ▷ leader/follower boxes,
replication arrows labelled sync or async, write and read entry arrows drawn
separately. A hash ring is approximated as a list of token ranges.

**Required elements:** ① replication mode and roles (leader/follower;
sync / semi-sync / async) ② partition or shard key and the ranges it cuts
③ replica count and placement across failure domains ④ which reads tolerate
stale data — per read request ⑤ the constraints that lag and conflict impose.

**Routing exceptions:** read replicas with no split on the command side → this
row, not CQRS. Data moving to a different kind of store → Data flow.

### Data model

**Question:** Which entities and relationships make up this domain's data?

**Diagram:** ERD — entity boxes joined by relationship lines, cardinality
written as a text label at each end (`1`, `0..*`).

**Required elements:** ① entities and their identifiers ② relationships and
cardinality ③ whether a relationship is identifying (existence dependence)
④ indexes ⑤ ownership boundaries (owning service plus aggregate boundary)
⑥ attributes and roles that belong to the relationship itself.

**Routing exceptions:** a plan to change the schema → Migration. Shard keys or
replication → Storage topology.

### Dependency reach

**Question:** If I touch this piece, how far does the dependency graph reach —
who uses it, and whom does it use?

**Diagram:** An overlay on an existing dependency diagram (a module-boundary
diagram, usually) — three colors for the anchor node, the users of it, and what
it uses; everything else dimmed.

**Required elements:** ① the anchor node ② both directions marked separately
③ depth (direct only / n hops / unbounded) ④ what the graph was built from —
declaration files, directory convention, or import inference — as one line
under the title ⑤ graph scope (directories and modules, plus which dependency
kinds are included: compile, runtime, test).

**Drawing rules:** the "not drawn" line says that actual impact is not judged
here — reach is not impact. Never put the words *impact*, *blast radius* or
their translations in the title or the description: adding one field usually
only touches direct callers. In-process events (Spring events, for example) are
caught by imports but their arrow runs opposite to the runtime flow — mark
that.

**Routing exceptions:** events that travel through a broker are not caught here
→ Event topology.

---

## Saga · CQRS · Event sourcing

### Saga

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

**Routing exceptions:** retries with no compensation → Retry and branching.

### CQRS

**Question:** Into which models and stores do commands and queries split, and
from when does a query see a write?

**Diagram:** Boxes and arrows — a command column and a query column, with the
write-to-read synchronisation arrow labelled with when and by what means.

**Required elements:** ① degree of separation (code and routes only / separate
models on one store / separate stores) ② how a command answers and where it
rejects ③-a synchronisation timing (synchronous, same transaction / asynchronous
/ computed on read) ③-b synchronisation means (application code / DB trigger or
view / message queue or event stream / CDC / batch) ④ tolerated lag and what is
done about stale reads ⑤ the rebuild path for the read model.

**Drawing rules:** if ① is code and routes only, ③④⑤ are *none confirmed* and
no synchronisation arrow is drawn.

**Routing exceptions:** read replicas with no split on the command side →
Storage topology.

### Event sourcing

**Question:** Which record of events holds this entity's state, and how is the
current state rebuilt from that record?

**Diagram:** Boxes and arrows — command handler → event store (one stream drawn
as versioned event cells) → subscribers (projections, outbound integrations).

**Required elements:** ① stream boundary and event names ② the append path and
how concurrent writes conflict ③ how state is restored (full replay /
snapshot) ④ how event schema changes are handled ⑤ how external side effects
are suppressed during replay.

**Routing exceptions:** the source of truth is a state database and the events
are derived through outbox or CDC → Event topology and Data flow.

---

## Request

### API behavior

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

**Drawing rules:** arrows follow the line notation in the resource
`guide://canvas`.

**Routing exceptions:** compensation is attached → Saga. Retry counts for one
call → Retry and branching. The shape of the payload → API contract.
Authentication is itself the question → Authentication and authorization.

### Authentication and authorization

**Question:** Who issues and who verifies the credentials for this request,
when do they expire, and what comes back when they are expired or
insufficient?

**Diagram:** Sequence plus trust boundaries — boundaries as vertical bands,
with a check marker on every message that crosses one. UML has no symbol for
this; it is a canvas approximation.

**Required elements:** ① participants, and who issues and who verifies
② credential kind and how it is carried ③ lifetime (token `exp`, session idle
and absolute) ④ when renewal or re-authentication happens ⑤ the expiry and
denial responses (401, 403) and what follows them ⑥ where authorization is
checked and by what rule (a role × permission table is one note line) ⑦ trust
boundaries.

**Routing exceptions:** authentication is not the answer → API behavior, with
the auth server as a single participant. Where the boundaries are →
System overview; this row is about what is checked when one is crossed. Just
the required scopes → API contract.

### API contract

**Question:** What does this endpoint take, what does it return, and how are
errors and versions promised?

**Diagram:** **No standard notation exists** — OpenAPI, AsyncAPI and Pact all
define document structure only, so this is a canvas approximation: one box with
three zones (head: method and path, version, scopes, idempotency key / request
and response boxes holding the actual payload / error table: code, status, body
shape). UML lollipop and socket only when provided/required relationships
between services are the point. This diagram type is independent of zoom level.

**Required elements:** ① endpoint or operation identity ② the actual request
payload ③ the actual response payload and status code ④ error codes and the
error body shape ⑤ version policy and compatibility rules ⑥ required
authentication and scopes ⑦ idempotency and retry contract.

**Drawing rules:** (1) the three zones are fixed; past five error rows, add
"and n more". (2) Payloads carry only the fields at issue plus `… n more
fields`; "show the whole thing" expands that one box. (3) When ⑤⑥⑦ are *none
confirmed* they are left out of the head. A contract still under discussion
takes the `design` evidence tag: solid line, change color.

**Routing exceptions:** call order → API behavior. Stored schema → Data model.
The contract of an event message → Event topology.

### Retry and branching

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

**Routing exceptions:** compensation is attached → Saga. The set of entity
states → Entity lifecycle. The whole DLQ landscape across consumers → Event
topology.

### Entity lifecycle

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

---

## Async · Data

### Event topology

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

### Queue and batch pipeline

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

**Routing exceptions:** the store or the source of truth is the point → Data
flow. Topic ownership or subscribers → Event topology. Backoff and attempt
counts for one stage → Retry and branching. The time breakdown of one request →
Performance bottleneck.

### Data flow and derived data

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

### Migration

**Question:** Through which steps do we move from what we have to what we want,
what reads and writes where at each step, and how far back can we roll?

**Diagram:** **As many diagrams of the same type as there are steps, side by
side.** Each one shows only that step's read and write paths, and the step name
is the frame title. Most of these lines are not in code yet, so their evidence
tag is `design`.

**Required elements:** ① the list of steps and which one we are on ② read and
write path per step — switching reads and switching writes are different steps
③ the dual-write window ④ when the source of truth moves ⑤ how consistency is
verified (*none confirmed* means a cutover with no verification) ⑥ the
rollback window and its expiry condition ⑦ the cleanup step.

**Routing exceptions:** the structure after it is all done → the matching
structure row. Swapping a deployment unit → Deployment map; a deployment
rollback is not a data rollback. A code interface change only → API contract.
The state today, with its sources and lineage → Data flow.

---

## Operations

### Incident response flow

**Question:** Once an incident is detected, who does what in what order, and
what tells us it is over?

**Diagram:** Swimlane flow — a horizontal lane per role against the progression
of steps; actions are rectangles, decisions are diamonds, and a step with no
owner shows up as an empty lane.

**Required elements:** ① detection signals ② classification and severity, with
the declaration criteria (the skill does not decide the grade values) ③ role
assignment (command, operations, communications) ④ mitigation and rollback
actions ⑤ escalation paths ⑥ recovery criteria and who gets told.

**Routing exceptions:** the causes of an incident that already happened, minute
by minute → Incident analysis. Where things are running → Deployment map. Code
retrying and branching by itself → Retry and branching.

### Incident analysis

**Question:** What happened at each moment in this incident, where did it
break, and when did we finally notice?

**Diagram:** Timeline — one horizontal time axis, events as points with a
timestamp label, and impact, detection lag and observability gaps as interval
bars. This is the wall-clock record of one incident, so no structure is drawn.

**Required elements:** ① events with their timestamps (start, detection,
intervention, mitigation, end) ② where it broke ③ observability gaps (the
detection and diagnosis lag intervals) ④ the extent and size of the impact
⑤ the intervals spent on hypotheses that turned out wrong.

**Drawing rules:** evidence tags here are mostly `log`.

**Routing exceptions:** what to do the next time it happens → Incident response
flow. The time breakdown inside one request → Performance bottleneck.

### Concurrency and locks

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

### Performance bottleneck

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

**Drawing rules:** serial or parallel is decided by whether the spans' start
and end times overlap. Relationship types (`child-of`, `follows-from`) are
evidence for waiting and causality only, never for the serial/parallel verdict
— several children running at the same time are all `child-of` too. With no
timestamps the answer is *not confirmed*. The critical path needs the join
points confirmed; with no evidence of the waits and the joins, it is *not
confirmed* as well.

**Routing exceptions:** the wall-clock course of a single incident → Incident
analysis. Throughput or backpressure → Queue and batch pipeline. Lock waits →
Concurrency and locks. Resource saturation (CPU, connections) is the point →
this is not that diagram.
