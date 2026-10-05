# Storage topology

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
situation, not CQRS. Data moving to a different kind of store → Data flow and
derived data.
