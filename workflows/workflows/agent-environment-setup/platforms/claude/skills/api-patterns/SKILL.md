---
name: api-patterns
description: "Use when choosing between REST, GraphQL, and type-safe RPC patterns, or when standardizing response envelopes, versioning, pagination, auth shape, and API protection strategy."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# API Patterns

## Purpose

Use when choosing between REST, GraphQL, and type-safe RPC patterns, or when standardizing response envelopes, versioning, pagination, auth shape, and API protection strategy.

## When to Use

- Choosing REST vs GraphQL vs type-safe RPC for a new surface.
- Standardizing response envelopes, pagination, filtering, and error format.
- Planning auth, rate limits, and evolution strategy for an API surface.
- Reviewing whether an API design matches client and organizational constraints.

## Instructions

1. Clarify clients, latency needs, ownership model, and compatibility constraints.
2. Choose transport shape based on product and team context, not habit.
3. Standardize response and error patterns before implementation fans out.
4. Define pagination, filtering, and auth strategy explicitly.
5. Make versioning and operational protections part of the design, not an afterthought.

### Baseline standards

- Use one consistent response and error vocabulary per API surface.
- Prefer explicit evolution strategy over “we will figure it out later.”
- Match the pattern to client needs and team capability.
- Treat rate limiting and abuse controls as part of API design.
- Keep auth semantics visible and documented.

### Constraints

- Avoid defaulting to REST, GraphQL, or RPC by trend alone.
- Avoid inconsistent envelopes across related endpoints.
- Avoid mixing public and internal conventions into one confused surface.
- Avoid delaying versioning and pagination decisions until after rollout.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/pattern-selection-checklist.md` | You need a sharper decision aid for REST vs GraphQL vs RPC, response envelopes, auth shape, and versioning tradeoffs. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with api patterns best practices in this project"
- "Review my api patterns implementation for issues"
