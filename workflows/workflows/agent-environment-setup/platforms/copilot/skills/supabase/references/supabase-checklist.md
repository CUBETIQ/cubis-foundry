# Supabase Checklist

Load this when Supabase platform behavior is more important than generic Postgres guidance.

## Surface identification

- Confirm whether the task is about Postgres, RLS, Auth, Storage, Realtime, or Edge Functions.
- Separate plain database design from product-surface coupling.

## Access control

- Treat RLS and auth rules as core design work.
- Keep policies understandable and testable.
- Re-check who is authorized at the database boundary, not only in app code.

## Rollout

- Make migration, branching, and rollback posture explicit.
- Note platform coupling and lock-in where it affects long-term architecture.
