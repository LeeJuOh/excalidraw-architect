# CQRS

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
