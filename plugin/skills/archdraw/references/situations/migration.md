# Migration

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
structure situation. Swapping a deployment unit → Deployment map; a deployment
rollback is not a data rollback. A code interface change only → Contract. The
state today, with its sources and lineage → Data flow and derived data.
