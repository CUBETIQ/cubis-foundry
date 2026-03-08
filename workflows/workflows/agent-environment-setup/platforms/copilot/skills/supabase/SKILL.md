---
name: "supabase"
description: "Use when the task is specifically Supabase: managed Postgres with RLS, auth, storage, edge functions, branching, and product decisions that depend on Supabase platform behavior."
license: MIT
metadata:
  version: "3.0.0"
  domain: "data"
  role: "specialist"
  stack: "supabase"
  category: "databases"
  layer: "databases"
  canonical: true
  maturity: "stable"
  baseline: "supabase platform-aware database engineering"
  tags: ["supabase", "postgres", "rls", "auth", "storage", "edge-functions"]
---
# Supabase

## When to use

- The stack is Supabase and platform features such as RLS, auth, storage, or edge functions affect the answer.
- The task depends on how managed Postgres behavior interacts with Supabase product surfaces.
- You need Supabase-specific migration, policy, or operational guidance.

## When not to use

- Plain Postgres guidance is enough and Supabase platform details do not matter.
- The problem is generic frontend or backend work with no Supabase-specific constraints.
- The issue is really about another managed database or platform.

## Core workflow

1. Confirm which Supabase surfaces are in play: Postgres, RLS, Auth, Storage, Realtime, or Edge Functions.
2. Separate pure Postgres design from platform policy and developer-experience constraints.
3. Design schema, policies, and integration boundaries together so access control stays coherent.
4. Validate migrations, branching, and operational rollout against Supabase’s managed posture.
5. Report platform-specific limits, coupling, and rollback considerations explicitly.

## Baseline standards

- Treat RLS and auth flows as core design inputs, not afterthoughts.
- Keep database policy logic understandable and testable.
- Use plain Postgres reasoning first, then add Supabase-specific constraints.
- Make platform lock-in or coupling explicit when it affects long-term architecture.

## Avoid

- Mixing product policy and schema logic without clear ownership.
- Overcomplicating RLS rules with no test strategy.
- Assuming Supabase convenience removes the need for migration discipline.
- Treating Supabase as generic Postgres when platform behavior clearly matters.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/supabase-checklist.md` | You need deeper Supabase guidance for RLS, auth, storage, platform coupling, and managed rollout decisions. |
