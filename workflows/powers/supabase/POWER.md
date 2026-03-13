````markdown
---
inclusion: manual
name: supabase
description: "Use when the task is specifically Supabase: managed Postgres with RLS, auth, storage, edge functions, branching, and product decisions that depend on Supabase platform behavior."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Supabase

## Purpose

Use when the task is specifically Supabase: managed Postgres with RLS, auth, storage, edge functions, branching, and product decisions that depend on Supabase platform behavior.

## When to Use

- The stack is Supabase and platform features such as RLS, auth, storage, or edge functions affect the answer.
- The task depends on how managed Postgres behavior interacts with Supabase product surfaces.
- You need Supabase-specific migration, policy, or operational guidance.

## Instructions

1. Confirm which Supabase surfaces are in play: Postgres, RLS, Auth, Storage, Realtime, or Edge Functions.
2. Separate pure Postgres design from platform policy and developer-experience constraints.
3. Design schema, policies, and integration boundaries together so access control stays coherent.
4. Validate migrations, branching, and operational rollout against Supabase’s managed posture.
5. Report platform-specific limits, coupling, and rollback considerations explicitly.

### Baseline standards

- Treat RLS and auth flows as core design inputs, not afterthoughts.
- Keep database policy logic understandable and testable.
- Use plain Postgres reasoning first, then add Supabase-specific constraints.
- Make platform lock-in or coupling explicit when it affects long-term architecture.

### Constraints

- Avoid mixing product policy and schema logic without clear ownership.
- Avoid overcomplicating RLS rules with no test strategy.
- Avoid assuming Supabase convenience removes the need for migration discipline.
- Avoid treating Supabase as generic Postgres when platform behavior clearly matters.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/supabase-checklist.md` | You need deeper Supabase guidance for RLS, auth, storage, platform coupling, and managed rollout decisions. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with supabase best practices in this project"
- "Review my supabase implementation for issues"
````
