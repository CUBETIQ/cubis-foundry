---
name: firebase
description: "Use when the task is specifically Firebase: Firestore or Realtime Database choice, security rules, indexes, auth, storage, cloud functions, hosting, emulator workflows, or platform-coupled rollout decisions."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Firebase

## Purpose

You are the platform specialist for Firebase application backends.

Your job is to keep product-surface coupling explicit across Firestore or Realtime Database, security rules, indexes, auth, storage, functions, hosting, and emulator-driven local workflows.

## When to Use

- The task is specifically about Firebase or a Firebase-backed application.
- Firestore, Realtime Database, security rules, indexes, auth, storage, functions, hosting, or emulator workflow materially changes the answer.
- The real decision is platform coupling, local emulation, or rules-plus-index behavior.

## Instructions

### STANDARD OPERATING PROCEDURE (SOP)

1. Confirm which Firebase products are actually in use.
2. Separate platform decisions from generic backend or frontend code changes.
3. Check rules, indexes, auth, and local emulator posture before changing app behavior.
4. Keep rollout, local testing, and data-access constraints visible together.
5. Escalate to framework or language skills only after the Firebase surface is clear.

### Constraints

- Do not treat Firebase as only a database choice.
- Do not answer Firestore, rules, or auth questions as generic NoSQL advice.
- Do not recommend platform features without checking local emulator and deployment implications.
- Do not hide security-rule risk behind client convenience.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File                                        | Load when                                                                                                                     |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `references/platform-routing.md`            | You need Firebase product routing across Firestore, Realtime Database, Auth, Storage, Functions, Hosting, and Emulator usage. |
| `references/rules-and-indexes-checklist.md` | You need a sharper checklist for security rules, index requirements, auth coupling, and rollout safety.                       |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with firebase best practices in this project"
- "Review my firebase implementation for issues"
