---
name: "database-optimizer"
description: "Use for system-level database performance triage across engines: bottleneck analysis, indexing strategy, config tuning, partitioning, and lock contention."
metadata:
  version: "2.0.0"
  domain: "data"
  category: "databases"
  layer: "databases"
  canonical: true
  maturity: "stable"
  role: "specialist"
  tags: ["database", "performance", "query-plans", "indexing", "contention", "tuning"]
---

# Database Optimizer

## When to use

- Analyzing slow queries and execution plans.
- Designing optimal index strategies.
- Tuning database configuration parameters.
- Reducing lock contention and deadlocks.
- Improving cache hit rates, memory usage, and throughput.

## When not to use

- Greenfield schema design where `database-design` should lead.
- Engine selection or routing where `database-skills` is the right hub.
- Application-layer performance work that is not primarily database-bound.

## Core workflow

1. Establish the symptom and baseline with real timings and workload shape.
2. Analyze plans, waits, locks, and resource pressure before changing anything.
3. Identify the narrowest bottleneck: query shape, indexing, configuration, contention, partitioning, or caching.
4. Apply the smallest safe optimization with explicit rollback.
5. Validate with before/after measurements and adjacent-risk checks.

## Reference files

| Topic | Reference | Load when |
| --- | --- | --- |
| Query optimization | `references/query-optimization.md` | Analyzing slow queries and execution plans. |
| Index strategies | `references/index-strategies.md` | Designing indexes or covering access paths. |
| PostgreSQL tuning | `references/postgresql-tuning.md` | PostgreSQL-specific tuning is required. |
| MySQL tuning | `references/mysql-tuning.md` | MySQL-specific tuning is required. |
| Monitoring and analysis | `references/monitoring-analysis.md` | Reviewing metrics, waits, or diagnostics. |

## Optimization standards

- Analyze `EXPLAIN` or engine-native plan output before optimizing.
- Measure before and after every change.
- Create indexes strategically and account for write amplification.
- Make one high-signal change at a time when isolating a bottleneck.
- Consider replication lag, maintenance cost, and lock behavior for every fix.

## Deliverable shape

When using this skill, provide:

1. Baseline symptom and evidence.
2. Root-cause hypothesis tied to plans or metrics.
3. Proposed optimization with tradeoffs.
4. Safe implementation sequence.
5. Rollback and monitoring checks.

## Avoid

- "Optimize first, explain later" changes.
- Redundant indexes with no measured predicate benefit.
- Config churn without a clear bottleneck model.
- Query rewrites that ignore correctness, write cost, or operational safety.
