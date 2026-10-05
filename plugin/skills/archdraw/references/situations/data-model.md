# Data model

**Question:** Which entities and relationships make up this domain's data?

**Diagram:** ERD — entity boxes joined by relationship lines, cardinality
written as a text label at each end (`1`, `0..*`).

**Required elements:** ① entities and their identifiers ② relationships and
cardinality ③ whether a relationship is identifying (existence dependence)
④ indexes ⑤ ownership boundaries (owning service plus aggregate boundary)
⑥ attributes and roles that belong to the relationship itself.

**Routing exceptions:** a plan to change the schema → Migration. Shard keys or
replication → Storage topology.
