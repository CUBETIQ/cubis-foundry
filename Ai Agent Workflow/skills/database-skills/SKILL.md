---
name: database-skills
description: Unified database skill hub with engine-specific packs for PostgreSQL, MySQL, Vitess, Neki, MongoDB (Mongoose), SQLite, Supabase, and Redis.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
metadata:
  version: "1.0.0"
  domain: data
  triggers: database, sql, postgres, mysql, vitess, neki, mongodb, mongoose, sqlite, supabase, redis, schema, migration, index, query, performance
---

# Database Skills Hub

Use this as the single database package.

## Structure

- `skills/postgres/`
- `skills/mysql/`
- `skills/vitess/`
- `skills/neki/`
- `skills/mongodb/`
- `skills/sqlite/`
- `skills/supabase/`
- `skills/redis/`

## Routing

1. Identify the target engine from the user request.
2. Load that engine's `SKILL.md` first.
3. Load only the referenced files needed for the current task.
4. If engine is unclear, ask before implementation.

## Global Guardrails

- No destructive operations without explicit confirmation.
- Include migration and rollback steps for production changes.
- Use evidence-first tuning (`EXPLAIN`, plans, slow logs, lock metrics).
