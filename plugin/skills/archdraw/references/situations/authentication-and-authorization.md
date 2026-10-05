# Authentication and authorization

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

**Drawing rules:** this is a path diagram — the path diagram rules in
[the index](../routing-table.md) apply.

**Routing exceptions:** authentication is not the answer → API behavior, with
the auth server as a single participant. Where the boundaries are →
System overview; this situation is about what is checked when one is crossed.
Just the required scopes → Contract.
