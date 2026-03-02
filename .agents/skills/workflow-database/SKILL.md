---
name: workflow-database
description: 'Callable Codex wrapper for /database: Design or review schema, queries, and migrations with performance and integrity controls.'
metadata:
  source: cubis-foundry
  wrapper: workflow
  platform: codex
  workflow-id: 'database'
  workflow-command: '/database'
---

# Workflow Wrapper: /database

Use this skill as a callable replacement for `/database` workflow instructions in Codex.

## Invocation Contract
1. Match the current task against this workflow intent before execution.
2. Follow the sequence and guardrails in the source instructions below.
3. Produce actionable output and call out assumptions before edits.

## Source Workflow Instructions

# Database Workflow

## When to use
Use this when data modeling, query quality, migration safety, or database performance is core to the task.

## Routing
- Primary specialist: `$agent-database-architect`
- Backend integration: `$agent-backend-specialist`
- Verification support: `$agent-test-engineer`
- Core skill hub: `database-skills`
- Companion skills: `database-design` (schema/migrations), `database-optimizer` (tuning/triage)
- Mobile/local persistence companion: `drift-flutter`
- Power bridge: `workflows/powers/database-skills`
- Engine wrappers: `postgres`, `mysql`, `vitess`, `neki`, `mongodb`, `sqlite`, `supabase`, `redis`

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `database-skills`, `database-design`
- Supporting skills (optional): `database-optimizer`

## Workflow steps
1. Confirm data shape, access patterns, and workload size.
2. Choose track: `database-design` (schema/migrations), `database-optimizer` (tuning), or `database-skills` (engine wrappers).
3. Choose engine wrapper and define index strategy.
4. Define pagination strategy (keyset first, offset only if justified).
5. Plan migration and rollback.
6. Validate with query-plan evidence and production-risk notes.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
- Schema/query changes
- Indexing plan
- Pagination plan
- Migration + rollback plan
- Query-plan evidence (`EXPLAIN` or equivalent)
- Validation evidence
