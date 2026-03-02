# Supabase — Row Level Security and Auth Performance

## Enable RLS on every exposed table

Any table exposed via the Supabase Data API (PostgREST) or Realtime must have RLS enabled. Without it, all authenticated users can access all rows.

```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;  -- applies to table owner too
```

## Policy fundamentals

A policy is a `WHERE` predicate automatically appended to every query on the table.

```sql
-- Users can only see their own orders
CREATE POLICY "users can read own orders"
  ON orders FOR SELECT
  USING (user_id = auth.uid());

-- Users can only insert rows for themselves
CREATE POLICY "users can insert own orders"
  ON orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Separate policies for read vs write
-- SELECT: use USING()
-- INSERT: use WITH CHECK()
-- UPDATE: use both USING() (which rows to target) + WITH CHECK() (what values are allowed)
-- DELETE: use USING()
```

## auth.uid() and auth.jwt()

Supabase injects the authenticated user context via:
- `auth.uid()` — UUID of the current user (`auth.users.id`).
- `auth.jwt()` — full JWT payload as JSONB. Access claims: `auth.jwt() ->> 'role'`, `(auth.jwt() -> 'user_metadata') ->> 'org_id'`.

```sql
-- Role-based policy using JWT claims
CREATE POLICY "admins can read all orders"
  ON orders FOR SELECT
  USING (auth.jwt() ->> 'user_role' = 'admin');

-- Multi-tenant: org_id from metadata
CREATE POLICY "org members can read org orders"
  ON orders FOR SELECT
  USING (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id')::uuid);
```

## Index policy predicate columns

**RLS policies are evaluated per row.** If the policy predicate isn't indexed, every query scans the full table before filtering.

```sql
-- Policy uses user_id — must have an index on it
CREATE INDEX idx_orders_user_id ON orders (user_id);

-- Policy uses org_id — same rule
CREATE INDEX idx_orders_org_id ON orders (org_id);
```

For composite queries: `(user_id, status)`, `(org_id, created_at)`.

## Bypassing RLS for service-role operations

Backend code using the `service_role` key bypasses RLS — useful for admin operations, but dangerous if leaked. Never expose `service_role` to client code.

```sql
-- Explicitly bypass RLS in a function running as superuser
CREATE FUNCTION admin_get_all_orders()
RETURNS SETOF orders
SECURITY DEFINER  -- runs as function owner (bypasses RLS)
SET search_path = public
LANGUAGE sql AS $$
  SELECT * FROM orders;
$$;
```

## Measuring policy overhead

```sql
-- Compare query time with and without RLS
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE status = 'pending' LIMIT 20;

-- Check if planner inlines auth.uid() correctly (it should appear in the plan)
```

Benchmark list endpoints that have RLS policies after every policy change — policy complexity directly impacts query time.

## Common RLS mistakes

| Mistake | Fix |
| --- | --- |
| No policy defined but RLS enabled | Default deny — no rows returned; add explicit policies |
| Policy predicate column not indexed | Add index on policy column |
| Using `auth.uid()` in `WITH CHECK` but not `USING` | UPDATE policy needs both |
| Relying solely on app-layer filtering | Always enforce with RLS even if app also filters |
| `service_role` key used in client | Switch to `anon` or `authenticated` key with RLS |

## Sources
- Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase auth helpers: https://supabase.com/docs/guides/auth
- PostgreSQL RLS docs: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
