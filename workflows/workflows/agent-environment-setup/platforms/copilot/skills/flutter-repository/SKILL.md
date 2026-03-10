---
name: flutter-repository
description: "Use when building or refactoring a Flutter feature data layer: Drift tables and DAOs, DTOs, mappers, Retrofit APIs, and repository orchestration. Do not use when the task needs a full feature scaffold across presentation and routing."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# Flutter Repository

## Purpose

Generate or review one Flutter feature's data layer while keeping persistence,
transport, mapping, and orchestration properly separated.

## When to Use

- Adding a new repository
- Adding local tables or DAOs
- Adding DTOs and network API interfaces
- Wiring local-first read/write behavior
- Updating sync logic in an existing repository

## Instructions

1. Define the local table and DAO contract first.
2. Define DTOs and the remote API interface separately.
3. Keep mapping logic outside large repository methods where possible.
4. Let repositories own local and remote coordination.
5. Keep DAOs persistence-focused and DTOs transport-focused.
6. If offline sync exists, persist locally and enqueue sync work instead of blocking on the network.
7. Add tests for local-first reads, writes, and sync behavior.

## Output Format

Produce repository-layer guidance or code that:

- separates table, DAO, DTO, mapper, API, and repository responsibilities,
- explains any offline-sync behavior,
- identifies test points for read, write, and sync flows,
- avoids collapsing the whole data layer into a single file.

## References

Load only what the current step needs.

| File | Load when |
| --- | --- |
| `references/drift-patterns.md` | Designing local tables, DAO helpers, sync-status fields, or Drift-side read and write helpers. |
| `references/retrofit-patterns.md` | Designing DTOs, Retrofit interfaces, mapper boundaries, or repository orchestration. |

## Scripts

No helper scripts are required for this skill right now.

## Examples

- "Create the Flutter repository layer for a new offline-capable entity."
- "Refactor this feature repository so DAO, DTO, and mapping logic are separated."
