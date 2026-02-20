# Neki — Architecture and Pre-Sharding Design

## What is Neki

Neki is **sharded Postgres** built by PlanetScale — the company behind Vitess (the MySQL sharding system used at YouTube scale). Neki brings the same horizontal scaling approach to the Postgres ecosystem.

> **Status as of early 2026**: Neki is not yet GA. Treat all behavioral assumptions as provisional until official docs stabilize. Re-verify after each preview update.

## What Neki provides

- **Horizontal sharding**: Distributes data across multiple Postgres nodes. Applications scale beyond single-node limits without sharding logic in application code.
- **Managed by PlanetScale**: Operational experience from running Vitess at scale applied to Postgres.
- **High availability**: PlanetScale-grade uptime with automatic failover.
- **Postgres protocol compatibility**: Applications connect using standard Postgres drivers.

## Architecture model (conceptual)

Neki is architecturally adjacent to Vitess outcomes, but is **not a Vitess fork**. It is built from first principles for Postgres:

- A **routing layer** (analogous to VTGate) intercepts queries and routes them to the correct shard.
- A **shard key** is chosen at schema design time and determines which node stores each row.
- Data is partitioned horizontally — each shard holds a subset of rows for every sharded table.
- **Reference tables** (small lookup data) are replicated to all shards.

## Pre-sharding design checklist

Designing for Neki compatibility now means you won't need a painful migration later.

### 1. Identify your shard key early

Choose based on real query patterns — not theoretical. The shard key should appear in every high-QPS `WHERE` clause.

Common choices: `tenant_id`, `org_id`, `user_id`, `account_id`.

The shard key must be:
- Present on every tenant-scoped table
- High cardinality (even distribution across shards)
- Immutable after insert (changing it requires data migration)

### 2. Primary key design

```sql
-- Good: single-column PK that is the shard key
CREATE TABLE users (user_id BIGINT PRIMARY KEY, ...);

-- Good: composite PK with shard key leading on child tables
CREATE TABLE orders (
  user_id BIGINT NOT NULL,
  id BIGINT GENERATED ALWAYS AS IDENTITY,
  PRIMARY KEY (user_id, id)
);

-- Bad: shard key not leading
PRIMARY KEY (id, user_id)
```

Use UUIDs (prefer UUIDv7 for sortability) or app-generated monotonic IDs — global sequences across shards are a coordination bottleneck.

### 3. Co-locate joined tables

Tables frequently joined must share the same shard key and be co-located. Always include the shard key in join conditions.

```sql
-- Correct: shard-local join
SELECT o.id, oi.product_id FROM orders o
JOIN order_items oi ON oi.user_id = o.user_id AND oi.order_id = o.id
WHERE o.user_id = $1;
```

### 4. Index design

Lead all indexes with the shard key. Scope unique constraints to include it.

```sql
-- Correct
CREATE INDEX idx_orders_user_status ON orders (user_id, status, created_at);
ALTER TABLE orders ADD CONSTRAINT uq_order_number UNIQUE (user_id, order_number);

-- Incorrect: missing shard key in leading position
CREATE INDEX idx_orders_status ON orders (status, created_at);
```

### 5. Foreign keys

- FKs within the same shard key (co-located data) may be supported.
- Cross-shard-key FKs must become application-level enforcement before sharding.
- Audit all FKs before planning a Neki migration.

### 6. Query patterns

Every query on sharded tables must include the shard key:

```sql
-- Correct: routes to single shard
SELECT * FROM orders WHERE user_id = $1 AND status = 'pending';

-- Incorrect: scatter — hits all shards
SELECT * FROM orders WHERE status = 'pending';
```

For lookups by a non-shard column, maintain a mapping table and harden it with backfill + miss-rate monitoring.

### 7. Transactions

Keep transactions within a single shard key value. Cross-shard transactions require coordination and are significantly slower.

### 8. Global aggregations

`COUNT(*)`, `SUM()` across all shards are expensive. Scope to shard key, or maintain pre-computed rollup tables for global stats.

### 9. Reference tables

Small, rarely-changing lookup data (countries, currencies, feature flags ≲100K rows, rarely written, no tenant scoping) don't need a shard key — they get replicated to all shards.

## Shard-readiness checklist

- [ ] Shard key identified and present on every tenant-scoped table
- [ ] Composite PKs with shard key leading; shard-safe IDs (UUIDv7 or app-generated)
- [ ] Shard key in all queries, indexes (leading position), and join conditions
- [ ] Unique constraints scoped to include shard key
- [ ] Cross-shard FKs audited; plan for app-level enforcement
- [ ] Transactions scoped to single shard-key value
- [ ] Global aggregations identified; rollup/async plan in place
- [ ] Migrations use online/revertible patterns — avoid long locks

## When to evaluate Neki

- Single Postgres node is hitting CPU or storage limits under real load.
- Multi-tenant SaaS with tenant isolation requirements.
- Write volume exceeds what vertical scaling can address.

Always benchmark on production-like data volume before committing. Keep migration plans reversible and testable.

## Sources
- Neki product page: https://www.neki.dev/
- PlanetScale announcement: https://planetscale.com/blog/announcing-neki
