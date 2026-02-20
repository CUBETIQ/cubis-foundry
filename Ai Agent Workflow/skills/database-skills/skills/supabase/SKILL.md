---
name: supabase
description: Supabase/Postgres patterns for RLS, auth-aware schema, pooling, and safe migrations.
---

# Supabase

Load references as needed:
- `references/rls-auth.md`
- `references/performance-operations.md`

Key rules:
- Enforce tenant/user boundaries with RLS.
- Index policy predicates and hot query paths.
- Validate policies in staging before production rollout.
