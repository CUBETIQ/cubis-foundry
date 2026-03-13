---
name: flutter-drift
description: "Use when implementing or refactoring Flutter local persistence with Drift: tables, DAOs, typed queries, indexes, transactions, and migrations. Do not use for simple key-value storage or remote-only networking work."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Flutter Drift

## Purpose

Guide project-local SQLite persistence through Drift while keeping persistence
details in the data layer and repositories above the DAO boundary.

## When to Use

- Adding a new table or DAO
- Changing schema or indexes
- Writing a migration
- Adding typed multi-table queries
- Wiring repositories to local persistence

## Instructions

1. Define or update the table schema first.
2. Add indexes only for real filter, join, or sort paths.
3. Keep DAOs typed and persistence-focused.
4. Expose Drift through repositories instead of letting UI code call DAOs directly.
5. Use transactions for multi-table consistency.
6. Use explicit schema version bumps and migration steps for every persisted change.
7. Never drop or rewrite user data silently.
8. Test migration behavior from at least the previous production schema.

## Output Format

Produce Drift guidance or code that:

- keeps one app database entrypoint,
- uses typed DAOs and query helpers,
- explains index or migration choices when they matter,
- includes migration-test expectations for schema changes.

## References

Load only what the current step needs.

| File | Load when |
| --- | --- |
| `references/migrations.md` | Changing schema version, adding columns or tables, or planning upgrade safety. |
| `references/query-patterns.md` | Designing tables, indexes, DAOs, joins, transactions, or repository integration. |

## Scripts

No helper scripts are required for this skill right now.

## Examples

- "Add a Drift table and DAO for offline product notes."
- "Plan a safe migration for a new required column in this Flutter database."
