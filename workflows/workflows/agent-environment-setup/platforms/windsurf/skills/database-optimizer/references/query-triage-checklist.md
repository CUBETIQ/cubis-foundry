# Query Triage Checklist

Load this when database performance work needs a deeper optimization frame.

## Establish the symptom

- Capture timings, plans, waits, lock signals, or saturation evidence first.
- Confirm whether the bottleneck is query shape, index choice, contention, config, or workload pattern.

## Change selection

- Prefer the smallest safe change with the clearest expected effect.
- Separate read latency fixes from write amplification or operational tradeoffs.
- Keep semantics intact while rewriting queries.

## Validation

- Measure before and after every proposed change.
- Re-check hot paths, secondary queries, and concurrency side effects.
- Keep rollback and monitoring in the plan.

## Anti-patterns

- No blind config churn.
- No index additions without predicate evidence.
- No single-query tunnel vision when workload shape is the real problem.
