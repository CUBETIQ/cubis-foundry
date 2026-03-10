---
name: flutter-offline-sync
description: "Use when implementing or auditing offline-first sync in Flutter with a local database, outbox queue, retry policy, conflict handling, and dead-letter behavior. Do not use for simple online-only CRUD."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# Flutter Offline Sync

## Purpose

Guide local-first write flows that reconcile with the server later through an
outbox queue, retry policy, and explicit conflict handling.

## When to Use

- Adding offline-first writes to a feature
- Designing or auditing outbox behavior
- Handling retry, dead-letter, or conflict states
- Wiring connectivity-driven background draining

## Instructions

1. Identify the feature and write operations that need offline behavior.
2. Choose a conflict strategy per feature.
3. Ensure the outbox infrastructure exists once per project.
4. Persist locally first, then enqueue sync work.
5. Never block UI completion on network success.
6. Surface sync status and dead-letter behavior clearly in the UI.
7. Keep retry policy bounded and explicit.

## Output Format

Produce offline-sync guidance or code that:

- shows the local-write then outbox-enqueue contract,
- names the retry, dead-letter, and conflict decisions,
- separates one-time infrastructure from per-feature integration,
- includes sync-status UI expectations when relevant.

## References

Load only what the current step needs.

| File | Load when |
| --- | --- |
| `references/outbox-full.md` | Setting up the outbox table or service, connectivity listeners, feature handlers, retry logic, or dead-letter UI. |

## Scripts

No helper scripts are required for this skill right now.

## Examples

- "Add offline-first create and update support to this Flutter repository."
- "Review this outbox flow for retry and dead-letter mistakes."
