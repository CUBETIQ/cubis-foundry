# Drizzle Schema And Migration Playbook

Load this when Drizzle schema files, relations, or drizzle-kit migrations are the active risk.

## Focus Areas

- Keep schema ownership obvious. Prefer feature-aware file boundaries over giant schema dumps.
- Review relation helpers against the actual query patterns instead of assuming relations improve every call site.
- Check generated migration SQL before trusting it in production.
- Treat rename, backfill, and irreversible column changes as rollout events, not local refactors.

## Minimum Review Loop

1. Confirm engine and target runtime.
2. Read current schema files and drizzle config before editing.
3. Validate whether the migration is additive, destructive, or backfill-heavy.
4. Pair with the engine skill for index, lock, or feature-specific tradeoffs.
5. Keep rollback or fallback steps visible when the migration is not trivial.
