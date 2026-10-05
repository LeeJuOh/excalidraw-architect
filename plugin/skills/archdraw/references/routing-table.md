# Routing table

Twenty-three situations. Read the user's words as one of the questions below,
then read **only that situation's document** and draw its diagram. The question
wins over the diagram name the user happened to use. When no question fits,
SKILL.md §6 says what to do.

Each situation document carries:

- **Question** — the one sentence this diagram answers. It becomes the frame
  name.
- **Diagram** — the notation.
- **Required elements** — every one of these carries a value in the finished
  diagram: the real value read from code, *none confirmed*, or *not confirmed*
  (dashed). Never drop an item to avoid filling it.
- **Routing exceptions** — conditions that send the utterance to another
  situation.
- **Drawing rules**, where the situation has any.

Situations are split by the question, not by the notation: API behavior and
authentication are both sequences because the questions differ.

Concept names keep their original English — Event Notification, Event-Carried
State Transfer, saga, CQRS — untranslated, whatever language the conversation
is in.

## Structure

- [System overview](situations/system-overview.md) — What is this system made of, and how are those pieces connected to each other and to the outside?
- [Deployment map](situations/deployment-map.md) — Where in which environment is each deployment unit running, how many of them, and which connections cross a boundary?
- [Storage topology](situations/storage-topology.md) — Which stores does this data live in, in how many copies, and which reads may be stale?
- [Data model](situations/data-model.md) — Which entities and relationships make up this domain's data?
- [Dependency reach](situations/dependency-reach.md) — If I touch this piece, how far does the dependency graph reach — who uses it, and whom does it use?

## Saga · CQRS · Event sourcing

- [Saga](situations/saga.md) — When a job spanning several services fails halfway, what gets undone and what gets pushed through?
- [CQRS](situations/cqrs.md) — Into which models and stores do commands and queries split, and from when does a query see a write?
- [Event sourcing](situations/event-sourcing.md) — Which record of events holds this entity's state, and how is the current state rebuilt from that record?

## Request

- [API behavior](situations/api-behavior.md) — Who calls whom in what order for this request, what comes back, and where does it branch on failure?
- [Authentication and authorization](situations/authentication-and-authorization.md) — Who issues and who verifies the credentials for this request, when do they expire, and what comes back when they are expired or insufficient?
- [Contract](situations/contract.md) — What does this boundary take and what does it return, and how are errors and versions promised?
- [Business process](situations/business-process.md) — Under which conditions does this business work take which path, and how does each path end?
- [Retry and branching](situations/retry-and-branching.md) — When this call fails, what is retried, how many times and how far apart, and where does it go when we give up?
- [Entity lifecycle](situations/entity-lifecycle.md) — Which states does this entity pass through, what changes its state, and how does it end?

## Async · Data

- [Event topology](situations/event-topology.md) — Who publishes this event and who receives it, and where does it go when it fails?
- [Queue and batch pipeline](situations/queue-and-batch-pipeline.md) — Where does this processing get stuck, how far behind is it, and how do failed items go round again?
- [Data flow and derived data](situations/data-flow-and-derived-data.md) — What is this data's source of truth, through which steps is it copied where, and how late may it be?
- [Migration](situations/migration.md) — Through which steps do we move from what we have to what we want, what reads and writes where at each step, and how far back can we roll?

## Operations

- [Incident response flow](situations/incident-response-flow.md) — Once an incident is detected, who does what in what order, and what tells us it is over?
- [Deployment pipeline](situations/deployment-pipeline.md) — Through which gates does this change go out to production, and where does it stop or go back?
- [Incident analysis](situations/incident-analysis.md) — What happened at each moment in this incident, where did it break, and when did we finally notice?
- [Concurrency and locks](situations/concurrency-and-locks.md) — What do concurrent jobs hold and release, and when, such that they block each other or get in together?
- [Performance bottleneck](situations/performance-bottleneck.md) — Where did this request's time go, span by span, and what has to shrink for the whole to shrink?

## Path diagrams

A path diagram draws the way one request or message travels from an entry
point. Six situations are path diagrams: API behavior, Authentication and
authorization, Retry and branching, Saga, Queue and batch pipeline, and
Performance bottleneck. Every path diagram follows these five rules:

1. **Start at the entry point.** When a change is under discussion, include the
   existing steps from the entry point up to the one before the step that
   changes.
2. **Do not stop at the HTTP response.** Carry on through the asynchronous
   work that follows it.
3. **Mark what you left out.** A part the decision does not need is replaced
   by `…`, so the reader sees that something was omitted.
4. **The current code and the change proposal go in one diagram**, in the
   change notation of `guide://canvas`.
5. **Mark writes.** When a step writes data, write on that step that it writes
   and which data. Write reads only when the question needs them. The unit of
   data follows the diagram's zoom level. Structure diagrams have no steps, so
   this rule does not apply to them.

A path diagram is never a function-level call tree. When it shows a contract,
read the drawing rules in [Contract](situations/contract.md).
