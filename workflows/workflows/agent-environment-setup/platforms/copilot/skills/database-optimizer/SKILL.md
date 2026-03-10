---
name: database-optimizer
description: "Use for database performance triage across engines: query-plan analysis, indexing changes, wait and contention diagnosis, config tuning, and safe before/after validation."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# Database Optimizer

## Purpose

Use for database performance triage across engines: query-plan analysis, indexing changes, wait and contention diagnosis, config tuning, and safe before/after validation.

## When to Use

- Investigating slow queries, bad plans, lock contention, or throughput collapse.
- Choosing targeted indexing or query-shape fixes.
- Deciding whether the bottleneck is query logic, schema, config, or concurrency.
- Validating performance changes with before/after evidence.

## Instructions

1. Establish the real symptom with timings, plans, waits, or metrics.
2. Identify whether the bottleneck is query shape, indexing, contention, config, or workload pattern.
3. Choose the smallest safe optimization with explicit tradeoffs.
4. Apply one high-signal change at a time when isolating a root cause.
5. Re-measure and report whether the change actually improved the bottleneck.

### Baseline standards

- Explain before optimizing.
- Measure before and after every proposed change.
- Account for write amplification and operational cost of indexes.
- Include rollback and monitoring in the optimization plan.
- Prefer correctness and predictable operations over benchmark vanity.

### Constraints

- Avoid blind config churn.
- Avoid index additions without real predicate evidence.
- Avoid query rewrites that ignore semantics or maintenance cost.
- Avoid treating every slowdown as a single-query problem.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/query-triage-checklist.md` | You need a deeper performance triage checklist for plans, waits, index tradeoffs, rollback, and before/after evidence. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with database optimizer best practices in this project"
- "Review my database optimizer implementation for issues"
