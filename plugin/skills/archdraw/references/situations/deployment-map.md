# Deployment map

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
