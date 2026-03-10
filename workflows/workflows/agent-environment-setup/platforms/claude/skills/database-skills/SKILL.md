---
name: database-skills
description: "Use as the primary database hub for engine or platform choice, schema-vs-tuning routing, access-layer triage, migration safety framing, and database task triage before deeper engine, platform, or ORM specialists."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Database Skills

## Purpose

Use as the primary database hub for engine or platform choice, schema-vs-tuning routing, access-layer triage, migration safety framing, and database task triage before deeper engine, platform, or ORM specialists.

## When to Use

- Choosing the right database path before implementation dives deep.
- Routing a task toward schema design, optimization, or engine-specific work.
- Planning migrations, indexing, query behavior, and operational safety at a high level.
- Reviewing whether a data problem is really engine choice, schema shape, or query behavior.

## Instructions

1. Clarify workload shape, consistency needs, scale, and operational model.
2. Decide whether the task is engine choice, schema design, or performance triage.
3. Choose the narrowest next specialist: `database-design` or `database-optimizer`.
4. Keep migration risk, rollback, and blast radius visible from the start.
5. Escalate to the exact engine or platform specialist only when it is known and materially affects the decision: `postgres`, `mysql`, `sqlite`, `mongodb`, `redis`, `supabase`, `firebase`, `vitess`, or `neki`.
6. Add `drizzle-expert` only when the TypeScript access layer or drizzle-kit workflow is the real decision surface.

### Baseline standards

- Pick storage shape from workload and operations, not preference alone.
- Treat indexes, migrations, and rollback as first-class design inputs.
- Separate schema questions from tuning questions.
- Load engine-specific guidance only when platform behavior or managed-product constraints actually matter.
- Prefer evidence before recommending a new engine or data model.
- Keep data safety and operational reversibility explicit.

### Constraints

- Avoid treating every database issue as a query-optimization problem.
- Avoid recommending engine changes with no workload evidence.
- Avoid planning destructive schema changes without rollback.
- Avoid mixing schema design and tuning advice into one vague answer.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/engine-selection-and-routing.md` | You need a sharper routing aid for engine choice, escalation into schema vs tuning, and when to load exact engine specialists. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with database skills best practices in this project"
- "Review my database skills implementation for issues"
