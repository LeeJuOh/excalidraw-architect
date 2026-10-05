# Incident response flow

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
