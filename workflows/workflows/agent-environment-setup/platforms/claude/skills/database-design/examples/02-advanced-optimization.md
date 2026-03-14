# Example: Advanced Optimization

## Scenario

An analytics platform stores event data from multiple customer tenants. The events table has grown to 500 million rows and the team is experiencing slow queries on tenant-scoped reports, dashboard aggregations, and time-range filters. They need to optimize the schema with partitioning, materialized views, and targeted index strategies without downtime.

## Prompt

"Our events table has 500M rows and tenant-scoped queries are getting slow (2-5 seconds for simple aggregations). We partition by tenant_id but time-range queries within a tenant are still slow. Help me redesign the schema with better partitioning, add materialized views for dashboards, and optimize the indexing strategy. We run PostgreSQL 16."

## Expected Output

### Current Problem Analysis

```sql
-- Current slow query (2-5 seconds)
SELECT event_type, COUNT(*), DATE_TRUNC('day', created_at) AS day
FROM events
WHERE tenant_id = 'abc-123'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY event_type, day
ORDER BY day DESC;

-- EXPLAIN shows: Seq Scan on events with filter
-- Problem: hash partition by tenant_id helps route to correct partition,
-- but within a partition, there's no range optimization for created_at.
```

### Redesigned Schema with Composite Partitioning

```sql
-- Range-partition by month, then route queries with tenant_id index
CREATE TABLE events (
  id          UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL,
  event_type  VARCHAR(100) NOT NULL,
  payload     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE events_2025_01 PARTITION OF events
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE events_2025_02 PARTITION OF events
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
-- Continue for each month...

-- Automate partition creation
CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS void AS $$
DECLARE
  next_month DATE := DATE_TRUNC('month', NOW() + INTERVAL '1 month');
  partition_name TEXT := 'events_' || TO_CHAR(next_month, 'YYYY_MM');
  end_date DATE := next_month + INTERVAL '1 month';
BEGIN
  EXECUTE FORMAT(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF events FOR VALUES FROM (%L) TO (%L)',
    partition_name, next_month, end_date
  );
END;
$$ LANGUAGE plpgsql;
```

### Optimized Indexes

```sql
-- Within each partition, index for tenant + time range queries
CREATE INDEX ix_events_tenant_time ON events (tenant_id, created_at DESC);

-- For aggregation queries that group by event_type
CREATE INDEX ix_events_tenant_type_time ON events (tenant_id, event_type, created_at DESC);

-- For payload-based filtering (GIN index on JSONB)
CREATE INDEX ix_events_payload ON events USING GIN (payload jsonb_path_ops);

-- Covering index for the dashboard query to avoid heap lookups
CREATE INDEX ix_events_dashboard_cover ON events (tenant_id, created_at DESC)
  INCLUDE (event_type);
```

### Materialized Views for Dashboards

```sql
-- Daily aggregation per tenant
CREATE MATERIALIZED VIEW mv_daily_event_counts AS
SELECT
  tenant_id,
  event_type,
  DATE_TRUNC('day', created_at) AS day,
  COUNT(*) AS event_count
FROM events
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY tenant_id, event_type, day
WITH DATA;

CREATE UNIQUE INDEX ix_mv_daily_unique
  ON mv_daily_event_counts (tenant_id, event_type, day);

-- Refresh concurrently (no lock on reads)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_event_counts;
```

```sql
-- Dashboard query now hits the materialized view (< 50ms)
SELECT event_type, day, event_count
FROM mv_daily_event_counts
WHERE tenant_id = 'abc-123'
  AND day >= NOW() - INTERVAL '30 days'
ORDER BY day DESC;
```

### Refresh Strategy

```sql
-- Schedule refresh via pg_cron (PostgreSQL extension)
SELECT cron.schedule(
  'refresh_daily_counts',
  '*/15 * * * *',  -- every 15 minutes
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_event_counts$$
);
```

### Archival Strategy for Old Partitions

```sql
-- Detach partitions older than 12 months (instant, no data movement)
ALTER TABLE events DETACH PARTITION events_2024_01;

-- Optionally move to cold storage or drop
-- ALTER TABLE events_2024_01 SET TABLESPACE cold_storage;
-- DROP TABLE events_2024_01;
```

### Migration Plan (Zero-Downtime)

```
Phase 1: Create new partitioned table alongside old table
Phase 2: Dual-write to both tables from the application
Phase 3: Backfill historical data into new partitioned table (batched)
Phase 4: Switch reads to new table, verify query performance
Phase 5: Stop writes to old table, drop after verification period
```

```sql
-- Batched backfill script
DO $$
DECLARE
  batch_size INT := 50000;
  last_id UUID := '00000000-0000-0000-0000-000000000000';
  rows_moved INT;
BEGIN
  LOOP
    INSERT INTO events_new (id, tenant_id, event_type, payload, created_at)
    SELECT id, tenant_id, event_type, payload, created_at
    FROM events_old
    WHERE id > last_id
    ORDER BY id
    LIMIT batch_size;

    GET DIAGNOSTICS rows_moved = ROW_COUNT;
    EXIT WHEN rows_moved = 0;

    SELECT MAX(id) INTO last_id FROM events_new;
    COMMIT;
    PERFORM pg_sleep(0.1);  -- throttle to reduce I/O pressure
  END LOOP;
END $$;
```

## Key Decisions

- **Range partitioning by time over hash by tenant** — time-range queries are the dominant access pattern. The query planner eliminates irrelevant monthly partitions (partition pruning), reducing scan scope by 90%+.
- **Composite index (tenant_id, created_at DESC)** — serves the primary query pattern with a single B-tree range scan within the relevant partition.
- **Covering index with INCLUDE** — avoids heap lookups for the dashboard query, which only needs event_type beyond the indexed columns.
- **Materialized view for dashboards** — pre-computed aggregations drop dashboard query time from seconds to milliseconds. CONCURRENTLY refresh avoids locking reads.
- **Partition detachment for archival** — instant operation that removes old data from the query path without deleting it, preserving data for compliance.
- **Batched backfill with throttling** — prevents I/O saturation during migration, keeping the production database responsive.
