# Post-Mortem Documentation

## Purpose of Post-Mortems

A post-mortem converts an incident from a one-time debugging experience into organizational knowledge. It documents what happened, why it happened, how it was resolved, and what will prevent recurrence. Done well, post-mortems are the most effective tool for reducing incident frequency and severity over time.

## Blameless Culture

Post-mortems must be blameless. The goal is to understand the systemic factors that allowed the incident, not to assign personal blame.

**Blameless framing:**
- "The deployment pipeline did not validate the configuration change."
- "The code review checklist did not include a database migration check."
- "The monitoring alert threshold was set too high to detect the issue quickly."

**Blame framing (avoid):**
- "Alice deployed without testing."
- "Bob should have caught this in review."
- "Carol didn't set up the alert properly."

People make mistakes. Systems should prevent those mistakes from causing incidents.

## Post-Mortem Template

```markdown
# Post-Mortem: [Incident Title]

**Date:** YYYY-MM-DD
**Severity:** SEV-1 / SEV-2 / SEV-3 / SEV-4
**Duration:** [start time] to [resolution time] ([total duration])
**Author:** [Name]
**Reviewers:** [Names]
**Status:** Draft / Reviewed / Action Items Assigned / Complete

---

## Summary

[2-3 sentence summary of the incident, impact, and resolution. Written for
someone unfamiliar with the incident.]

## Impact

- **Users affected:** [number or percentage]
- **Revenue impact:** [estimated if applicable]
- **Data loss:** [yes/no, scope if yes]
- **Duration of user impact:** [time from first user impact to full resolution]
- **Services affected:** [list of services]
- **SLA/SLO impact:** [which SLOs were breached]

## Timeline

All times in UTC.

| Time | Event |
|------|-------|
| 14:00 | Deployment of v2.5.0 to production |
| 14:12 | Error rate alert fires (threshold: 5%) |
| 14:15 | On-call engineer acknowledges alert |
| 14:18 | Initial investigation begins |
| 14:25 | Hypothesis: database connection pool exhaustion |
| 14:30 | Confirmed: pool at 100% utilization, 200+ waiting |
| 14:35 | Root cause identified: new query without index |
| 14:38 | Rollback initiated |
| 14:42 | Rollback complete, error rate dropping |
| 14:45 | Error rate at 0%, incident resolved |
| 14:50 | All-clear communicated to stakeholders |

## Detection

- **How was the incident detected?** Automated alert on error rate exceeding 5%.
- **Time to detection:** 12 minutes from deploy to alert.
- **Could we have detected sooner?** Yes. A deployment health check comparing
  pre/post error rates would have caught this within 2 minutes.

## Root Cause

[Detailed technical explanation. Include code snippets, query plans, or
architecture diagrams as needed.]

### Five Whys

1. **Why** did users see 500 errors?
   Because the API server could not acquire database connections.

2. **Why** couldn't the server acquire connections?
   Because all connections were held by slow-running queries.

3. **Why** were the queries slow?
   Because a new endpoint performed a full table scan on a 50M row table.

4. **Why** was there no index?
   Because the migration did not include an index for the new query pattern.

5. **Why** wasn't the missing index caught before production?
   Because the PR review process does not require EXPLAIN ANALYZE for new queries.

**Root cause:** Missing index on `orders.user_id` combined with no query plan review requirement.

## Contributing Factors

1. **No query plan review in PR checklist** - The primary reason the missing
   index was not caught before merge.
2. **Connection pool size too small** - Pool of 10 connections was insufficient
   for the query volume. A larger pool would have delayed the impact.
3. **No canary deployment** - The change went to 100% of traffic immediately.
   A canary would have limited the blast radius.
4. **Alert threshold too high** - 5% error rate threshold meant 12 minutes of
   impact before detection.

## Resolution

### Immediate Actions (During Incident)

1. Rolled back deployment to v2.4.9.
2. Confirmed error rate returned to baseline.
3. Communicated status to affected teams.

### Follow-Up Fix

1. Added index: `CREATE INDEX idx_orders_user_id ON orders (user_id);`
2. Verified query performance: 45ms -> 2ms.
3. Re-deployed with fix as v2.5.1.

## Action Items

| # | Action | Type | Owner | Priority | Due Date | Status |
|---|--------|------|-------|----------|----------|--------|
| 1 | Add `EXPLAIN ANALYZE` check to PR template | Process | @lead | P1 | Mar 21 | TODO |
| 2 | Increase connection pool from 10 to 30 | Configuration | @infra | P1 | Mar 17 | Done |
| 3 | Implement canary deployments | Infrastructure | @devops | P2 | Apr 15 | TODO |
| 4 | Lower error rate alert threshold to 1% | Monitoring | @sre | P1 | Mar 17 | Done |
| 5 | Add connection pool utilization alert | Monitoring | @sre | P2 | Mar 24 | TODO |
| 6 | Create runbook for connection pool exhaustion | Documentation | @oncall | P3 | Mar 31 | TODO |

## Lessons Learned

### What Went Well

- Alert fired within 12 minutes, on-call responded quickly.
- Root cause was identified within 20 minutes of investigation start.
- Rollback was smooth and resolved the issue immediately.
- Team communication during the incident was clear and organized.

### What Went Poorly

- 12 minutes of user impact before detection.
- No canary deployment to limit blast radius.
- Missing index was a preventable issue.
- Connection pool was undersized for production load.

### Where We Got Lucky

- The incident happened during business hours when the team was available.
  The same issue at 3 AM would have had much longer resolution time.

## Appendix

### Related Incidents

- [INC-2024-089] Similar connection pool exhaustion from unoptimized report query.

### References

- [PR #1234] The pull request that introduced the change.
- [Query plan output] EXPLAIN ANALYZE before and after the index.
- [Dashboard link] Grafana dashboard showing the incident metrics.
```

## Post-Mortem Process

### Timeline

| When | Activity |
|------|----------|
| During incident | Keep a real-time log of actions and findings |
| Within 24 hours | Write the draft post-mortem |
| Within 48 hours | Schedule post-mortem review meeting |
| During meeting | Review timeline, discuss root cause, assign action items |
| Within 1 week | Complete P1 action items |
| Within 2 weeks | Publish final post-mortem |
| Monthly | Review open action items from all post-mortems |

### Review Meeting Agenda

1. **Read the timeline** (5 min) - Everyone reads silently to get context.
2. **Clarify facts** (10 min) - Correct any factual errors in the timeline.
3. **Root cause discussion** (15 min) - Verify the Five Whys analysis.
4. **Action items** (15 min) - Assign owners and due dates.
5. **Lessons learned** (5 min) - What should we start, stop, or continue doing?

### Meeting Rules

- No blame. Focus on systems, not people.
- Everyone's perspective is valid.
- Challenge assumptions with evidence.
- Action items must be specific, assigned, and time-bound.
- If the root cause is unclear, schedule a deeper investigation rather than guessing.

## Severity Classification

| Severity | Criteria | Post-Mortem Required? |
|----------|----------|----------------------|
| SEV-1 | Complete service outage, data loss, or security breach | Always |
| SEV-2 | Major feature unavailable, degraded performance for >50% users | Always |
| SEV-3 | Minor feature unavailable, degraded for <50% users | Recommended |
| SEV-4 | Cosmetic issue, no user impact | Optional |

## Tracking Action Item Completion

Post-mortem value is zero if action items are not completed. Track them in your project management tool alongside feature work:

- Tag action items with `post-mortem` or `incident-followup`.
- Review open items in weekly team meetings.
- Escalate overdue P1 items to leadership.
- Close the post-mortem document only when all action items are complete.

## Metrics to Track

| Metric | Target | Purpose |
|--------|--------|---------|
| Time to detect | < 5 minutes | Measure monitoring effectiveness |
| Time to mitigate | < 30 minutes | Measure incident response efficiency |
| Time to root cause | < 2 hours | Measure diagnostic capability |
| Post-mortem completion rate | 100% for SEV-1/2 | Measure process adherence |
| Action item completion rate | > 90% within due date | Measure follow-through |
| Repeat incident rate | 0% | Measure prevention effectiveness |
