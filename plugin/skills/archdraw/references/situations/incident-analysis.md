# Incident analysis

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
