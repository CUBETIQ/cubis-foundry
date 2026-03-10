---
name: flutter-repository
description: >
  Use when building or refactoring a Flutter feature data layer: Drift tables
  and DAOs, DTOs, mappers, Retrofit APIs, and repository orchestration. Do not
  use when the task needs a full feature scaffold across presentation and
  routing.
---

# Flutter Repository

## Overview

Use this skill to generate one feature's data layer cleanly. Keep persistence,
transport, mapping, and orchestration separated instead of collapsing them into
one file.

## When to Use

- Adding a new repository
- Adding a local table and DAO
- Adding DTOs and network API interfaces
- Wiring local-first read/write behavior
- Updating sync logic in an existing repository

## Core Workflow

1. Define the local table and DAO contract.
2. Define DTOs and remote API interface.
3. Add mapper code between local, remote, and domain types.
4. Implement repository read/write behavior.
5. Add tests for local-first and sync behavior.

## Core Rules

- Repositories own local/remote coordination.
- DAOs stay typed and persistence-focused.
- DTOs model transport, not widget state.
- Mappers keep conversion logic out of the repository body where possible.
- Offline writes enqueue work instead of blocking on the network.

## Load References When Needed

| File | Load when |
| --- | --- |
| `references/drift-patterns.md` | Designing the local table, DAO, sync-status fields, or Drift-side read/write helpers. |
| `references/retrofit-patterns.md` | Designing DTOs, Retrofit interfaces, mapper boundaries, or repository orchestration. |
