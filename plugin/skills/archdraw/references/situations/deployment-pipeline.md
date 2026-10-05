# Deployment pipeline

**Question:** Through which gates does this change go out to production, and
where does it stop or go back?

**Diagram:** Activity diagram, with the same symbols as Business process. Lanes
are optional.

**Required elements:** ① what starts it, and the build ② the checks that stop
it when they fail ③ approvals and the order of environments ④ the checks after
release and the way back.

**Routing exceptions:** where it runs → Deployment map. The set of states of
what is deployed → Entity lifecycle. Who does what when it breaks → Incident
response flow. The steps that switch data over → Migration.
