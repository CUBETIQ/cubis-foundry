---
name: flutter-drift
description: >
  Use when implementing or refactoring Flutter local persistence with Drift:
  tables, DAOs, queries, indexes, transactions, and migrations. Do not use for
  simple key-value storage or remote-only networking work.
---

# Flutter Drift

## Overview

Use this skill for project-local SQLite persistence through Drift. Keep Drift in
the data layer and expose it through repositories instead of letting UI code
touch DAOs directly.

## When to Use

- Adding a new table or DAO
- Changing schema or indexes
- Writing a migration
- Adding typed multi-table queries
- Wiring repositories to local persistence

## Core Workflow

1. Define or update the table schema.
2. Add indexes for real filter, join, or sort paths.
3. Update the DAO with typed reads and writes.
4. Wire repository behavior around local-first reads and writes.
5. Add migration logic and migration tests when schema changes.

## Core Rules

- Keep one app database entrypoint.
- Use explicit schema version bumps for every persisted change.
- Never drop or rewrite user data silently.
- Prefer Drift's typed API over raw SQL unless the query truly requires SQL.
- Use transactions for multi-table consistency.
- Test at least the latest migration path from a prior schema.

## Load References When Needed

| File | Load when |
| --- | --- |
| `references/migrations.md` | Changing schema version, adding columns/tables, or planning upgrade safety. |
| `references/query-patterns.md` | Designing tables, indexes, DAOs, joins, transactions, or repository integration. |
