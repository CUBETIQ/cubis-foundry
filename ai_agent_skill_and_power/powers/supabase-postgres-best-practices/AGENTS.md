# supabase-postgres-best-practices

> **Note:** `CLAUDE.md` is a symlink to this file.

## Overview

Postgres performance optimization and best practices from Supabase. Use this skill when writing, reviewing, or optimizing Postgres queries, schema designs, or database configurations.

## Structure

```
supabase-postgres-best-practices/
  SKILL.md       # Main skill file - read this first
  AGENTS.md      # This navigation guide
  CLAUDE.md      # Symlink to AGENTS.md
  steering/    # Detailed reference files
```

## Usage

1. Read `SKILL.md` for the main skill instructions
2. Browse `steering/` for detailed documentation on specific topics
3. Reference files are loaded on-demand - read only what you need

## Reference Categories

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Query Performance | CRITICAL | `query-` |
| 2 | Connection Management | CRITICAL | `conn-` |
| 3 | Security & RLS | CRITICAL | `security-` |
| 4 | Schema Design | HIGH | `schema-` |
| 5 | Concurrency & Locking | MEDIUM-HIGH | `lock-` |
| 6 | Data Access Patterns | MEDIUM | `data-` |
| 7 | Monitoring & Diagnostics | LOW-MEDIUM | `monitor-` |
| 8 | Advanced Features | LOW | `advanced-` |

Reference files are named `{prefix}-{topic}.md` (e.g., `query-missing-indexes.md`).

## Available References

**Advanced Features** (`advanced-`):
- `steering/advanced-full-text-search.md`
- `steering/advanced-jsonb-indexing.md`

**Connection Management** (`conn-`):
- `steering/conn-idle-timeout.md`
- `steering/conn-limits.md`
- `steering/conn-pooling.md`
- `steering/conn-prepared-statements.md`

**Data Access Patterns** (`data-`):
- `steering/data-batch-inserts.md`
- `steering/data-n-plus-one.md`
- `steering/data-pagination.md`
- `steering/data-upsert.md`

**Concurrency & Locking** (`lock-`):
- `steering/lock-advisory.md`
- `steering/lock-deadlock-prevention.md`
- `steering/lock-short-transactions.md`
- `steering/lock-skip-locked.md`

**Monitoring & Diagnostics** (`monitor-`):
- `steering/monitor-explain-analyze.md`
- `steering/monitor-pg-stat-statements.md`
- `steering/monitor-vacuum-analyze.md`

**Query Performance** (`query-`):
- `steering/query-composite-indexes.md`
- `steering/query-covering-indexes.md`
- `steering/query-index-types.md`
- `steering/query-missing-indexes.md`
- `steering/query-partial-indexes.md`

**Schema Design** (`schema-`):
- `steering/schema-data-types.md`
- `steering/schema-foreign-key-indexes.md`
- `steering/schema-lowercase-identifiers.md`
- `steering/schema-partitioning.md`
- `steering/schema-primary-keys.md`

**Security & RLS** (`security-`):
- `steering/security-privileges.md`
- `steering/security-rls-basics.md`
- `steering/security-rls-performance.md`

---

*30 reference files across 8 categories*