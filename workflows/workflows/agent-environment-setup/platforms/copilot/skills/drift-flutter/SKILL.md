---
name: "drift-flutter"
description: "Use when implementing Flutter local persistence with Drift: schema design, DAOs, migrations, transactions, and repository integration"
---
# Drift Flutter

## When to Use

- Adding or refactoring local data persistence in Flutter
- Migrating from Isar/SQLite wrappers to Drift
- Creating typed SQL queries, DAOs, and migrations
- Designing offline-first repository read/write behavior

## Core Workflow

1. Define schema (tables, indexes, constraints)
2. Add/adjust DAOs for read/write/query use-cases
3. Implement migrations with backward-compatible strategy
4. Wire repositories to DAOs (UI must not call DAOs directly)
5. Validate with migration and DAO tests

## Design Rules

- Keep Drift in data layer only.
- Keep one app database entrypoint and expose DAOs.
- Use transactions for multi-table consistency.
- Add indexes for frequent filters/joins.
- Prefer soft-delete/status flags when history matters.
- Keep session/auth flags out of Drift if simple key-value is enough.

## Migration Rules

- Every schema version bump requires explicit migration steps.
- Never drop user data silently.
- Backfill new required columns safely (defaults or staged migration).
- Test migration from at least previous production schema.

## Repository Integration

- Read flow: local-first, optional remote refresh, then persist.
- Write flow: persist local state deterministically and reconcile sync policy.
- Keep mapper logic in repository/data mapping classes.

## Load References When Needed

- `references/migrations.md` for migration strategy and checklist
- `references/queries-and-daos.md` for DAO/query patterns
