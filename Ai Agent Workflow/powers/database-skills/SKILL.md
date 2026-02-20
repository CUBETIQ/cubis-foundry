---
name: database-skills
description: Power bridge for the unified database-skills package with engine-specific wrappers.
---

# database-skills

Use this power as the routing layer over the database skill pack.

Primary source of truth:
- `Ai Agent Workflow/skills/database-skills/SKILL.md`
- `Ai Agent Workflow/skills/database-skills/LATEST_VERSIONS.md`

## Required flow

1. Read the version baseline first.
2. Choose the engine wrapper in `engines/<engine>/POWER.md`.
3. Produce decisions with:
   - indexing strategy,
   - pagination strategy,
   - query-plan evidence (`EXPLAIN` or equivalent),
   - rollback path.

## Engine wrappers

- `engines/postgres/POWER.md`
- `engines/mysql/POWER.md`
- `engines/vitess/POWER.md`
- `engines/neki/POWER.md`
- `engines/mongodb/POWER.md`
- `engines/sqlite/POWER.md`
- `engines/supabase/POWER.md`
- `engines/redis/POWER.md`
