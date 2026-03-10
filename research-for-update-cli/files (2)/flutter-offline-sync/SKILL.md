---
name: flutter-offline-sync
description: >
  Use when implementing or auditing offline-first sync in Flutter with a local
  database, outbox queue, retry policy, conflict handling, and dead-letter
  behavior. Do not use for simple online-only CRUD.
---

# Flutter Offline Sync

## Overview

Use this skill when writes must succeed locally first and reconcile with the
server later. The central pattern is local persistence plus an outbox queue.

## Mental Model

`local write -> outbox enqueue -> background drain -> success, retry, conflict, or dead letter`

## Core Workflow

1. Identify which feature and operations need offline behavior.
2. Choose a conflict strategy per feature.
3. Ensure the outbox infrastructure exists once per project.
4. Integrate repository writes with enqueue and optional immediate drain.
5. Surface sync status and dead-letter state in the UI.

## Core Rules

- Never wait on the network before returning control to the UI.
- Reads stay local-first.
- Every offline-capable write carries an operation ID.
- Retry policy must have a dead-letter outcome.
- Conflict handling must be explicit, not accidental.

## Load References When Needed

| File | Load when |
| --- | --- |
| `references/outbox-full.md` | Setting up the outbox table/service, connectivity listeners, feature handlers, retry logic, or dead-letter UI. |
