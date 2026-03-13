````markdown
---
inclusion: manual
name: drizzle-expert
description: "Use when the task is specifically Drizzle ORM or drizzle-kit: schema-as-code, typed SQL, relations, migrations, config, runtime pairing, or TypeScript database access-layer decisions across Postgres, SQLite/libSQL, Neon, or Supabase."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Drizzle Expert

## Purpose

You are the narrow specialist for Drizzle ORM and drizzle-kit in TypeScript database stacks.

Your job is to keep schema-as-code, typed query ergonomics, migration safety, and runtime pairing decisions explicit without replacing the underlying engine specialist.

## When to Use

- Drizzle schema files, relations, migrations, or drizzle-kit config are primary.
- The real decision is Drizzle vs raw SQL or another ORM/query-builder posture.
- The task depends on TypeScript-first database access patterns, typed queries, or edge or serverless runtime pairing.
- The engine is Postgres, SQLite/libSQL, Neon, or Supabase and the access layer matters as much as the engine.

## Instructions

### STANDARD OPERATING PROCEDURE (SOP)

1. Confirm the engine, runtime, migration path, and current Drizzle version or config shape.
2. Separate access-layer concerns from engine concerns and load the engine or platform skill when needed.
3. Check schema layout, relations, naming, and generated SQL implications before changing query code.
4. Keep migration order, rollback posture, and deployment safety explicit.
5. Verify how Drizzle pairs with the target runtime, pooling strategy, and serverless or edge constraints.

### Constraints

- Do not answer plain engine questions without also loading the matching engine or platform skill.
- Do not blur Drizzle concerns into generic TypeScript or generic Postgres advice.
- Do not recommend generated migrations, relation helpers, or runtime adapters without checking the deployment model.
- Do not hide migration risk behind ORM abstraction.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File                                          | Load when                                                                                                            |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `references/schema-and-migration-playbook.md` | You need the Drizzle-specific checklist for schema layout, relations, migrations, and rollout safety.                |
| `references/runtime-pairing-matrix.md`        | You need the runtime and engine pairing rules for Postgres, Supabase, SQLite/libSQL, Neon, or serverless deployment. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with drizzle expert best practices in this project"
- "Review my drizzle expert implementation for issues"
````
