---
name: "database-optimizer"
description: "Use for database performance triage across engines: query-plan analysis, indexing changes, wait and contention diagnosis, config tuning, and safe before/after validation."
license: MIT
metadata:
  version: "3.0.0"
  domain: "data"
  role: "specialist"
  stack: "database-performance"
  category: "databases"
  layer: "databases"
  canonical: true
  maturity: "stable"
  baseline: "modern query and workload optimization"
  tags: ["database", "performance", "query-plans", "indexing", "locks", "tuning"]
---

# Database Optimizer

## When to use

- Investigating slow queries, bad plans, lock contention, or throughput collapse.
- Choosing targeted indexing or query-shape fixes.
- Deciding whether the bottleneck is query logic, schema, config, or concurrency.
- Validating performance changes with before/after evidence.

## When not to use

- Greenfield schema design where `database-design` should lead.
- Engine-selection questions where the hub is enough.
- General app performance work with no proven database bottleneck.

## Core workflow

1. Establish the real symptom with timings, plans, waits, or metrics.
2. Identify whether the bottleneck is query shape, indexing, contention, config, or workload pattern.
3. Choose the smallest safe optimization with explicit tradeoffs.
4. Apply one high-signal change at a time when isolating a root cause.
5. Re-measure and report whether the change actually improved the bottleneck.

## Baseline standards

- Explain before optimizing.
- Measure before and after every proposed change.
- Account for write amplification and operational cost of indexes.
- Include rollback and monitoring in the optimization plan.
- Prefer correctness and predictable operations over benchmark vanity.

## Avoid

- Blind config churn.
- Index additions without real predicate evidence.
- Query rewrites that ignore semantics or maintenance cost.
- Treating every slowdown as a single-query problem.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/query-triage-checklist.md` | You need a deeper performance triage checklist for plans, waits, index tradeoffs, rollback, and before/after evidence. |
