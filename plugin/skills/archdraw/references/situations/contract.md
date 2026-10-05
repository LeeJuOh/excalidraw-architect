# Contract

**Question:** What does this boundary take and what does it return, and how are
errors and versions promised?

**Diagram:** **Not boxes.** A contract is written as text on the canvas — its
address plus real example values, in the boundary's own shape. There are no
rules per kind beyond that shape:

- HTTP — method, path and headers, the JSON body, and the response per status
  code.
- Message — topic and key, plus the payload.
- Database — the table, plus one row.
- Redis — key pattern, type and TTL, plus the value.
- An internal contract (a code interface, such as a port) — type code. Only
  here.

UML lollipop and socket only when provided/required relationships between
services are the point. This diagram type is independent of zoom level.

**Required elements:** ① endpoint or operation identity ② the actual request
payload ③ the actual response payload and status code ④ error codes and the
error body shape ⑤ version policy and compatibility rules ⑥ required
authentication and scopes ⑦ idempotency and retry contract. Written in the
boundary's own shape, these go in without annotations.

**Drawing rules:** (1) Placement: put the contract text beside the arrow it
belongs to, on a contract note — its look is in `guide://canvas`. Give the
arrow and its note the same number (①②…). Gather the notes under the diagram
only when there is no room beside the arrow. (2) Only the contracts that change
and the fields at issue, plus `… n more fields`; "show the whole thing" expands
that one note. (3) When ⑤⑥⑦ are *none confirmed*, leave them out. A contract
still under negotiation takes the `design` evidence tag. A changed contract in
a change proposal follows the contract note in `guide://canvas`. (4) These rules are not this
situation's alone: whenever another diagram — a path diagram, say — shows a
contract, they apply the same way.

**Routing exceptions:** call order → API behavior. Entity relationships of the
stored schema → Data model. Who publishes this event and who receives it →
Event topology; when only the shape of the message is asked, it is this
situation.
