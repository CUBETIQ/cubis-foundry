# Normalization Guide

Load this when making normalization or denormalization decisions, evaluating normal forms, or resolving data anomalies in schema design.

## Normal forms summary

### First Normal Form (1NF)

- Every column contains atomic (indivisible) values.
- No repeating groups or arrays stored in a single column.
- Every row is uniquely identifiable by a primary key.

**Violation example:**

```sql
-- BAD: tags stored as comma-separated string
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  tags TEXT  -- 'javascript,react,typescript'
);

-- GOOD: separate junction table
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE post_tags (
  post_id INT NOT NULL REFERENCES posts(id),
  tag_id  INT NOT NULL REFERENCES tags(id),
  PRIMARY KEY (post_id, tag_id)
);
```

- Exception: PostgreSQL `ARRAY` and `JSONB` columns can hold multi-valued data efficiently when the values are always accessed together and never queried individually.

### Second Normal Form (2NF)

- Must satisfy 1NF.
- Every non-key column depends on the entire primary key, not a subset.
- Only relevant for tables with composite primary keys.

**Violation example:**

```sql
-- BAD: supplier_name depends only on supplier_id, not the full key
CREATE TABLE order_items (
  order_id    INT NOT NULL,
  product_id  INT NOT NULL,
  supplier_id INT NOT NULL,
  supplier_name VARCHAR(200),  -- depends on supplier_id alone
  quantity    INT NOT NULL,
  PRIMARY KEY (order_id, product_id)
);

-- GOOD: extract supplier to its own table
CREATE TABLE suppliers (
  id   INT PRIMARY KEY,
  name VARCHAR(200) NOT NULL
);
```

### Third Normal Form (3NF)

- Must satisfy 2NF.
- No transitive dependencies: non-key columns must depend only on the primary key, not on other non-key columns.

**Violation example:**

```sql
-- BAD: city depends on zip_code, which depends on id (transitive)
CREATE TABLE customers (
  id       INT PRIMARY KEY,
  name     VARCHAR(100) NOT NULL,
  zip_code VARCHAR(10) NOT NULL,
  city     VARCHAR(100) NOT NULL  -- determined by zip_code, not id
);

-- GOOD: extract location lookup
CREATE TABLE zip_codes (
  code VARCHAR(10) PRIMARY KEY,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL
);
```

## When to denormalize

Denormalization is a deliberate trade-off: faster reads at the cost of write complexity and potential data inconsistency. Denormalize only when:

1. **Read frequency vastly exceeds write frequency** (100:1 or more) for the affected data.
2. **JOIN performance is measurably degraded** despite proper indexing.
3. **The denormalized data has a clear update strategy** (trigger, materialized view, or application-level sync).

### Common denormalization patterns

| Pattern | Use when | Update strategy |
|---|---|---|
| Computed column | Aggregates are read on every page load | Database trigger or application write hook |
| Materialized view | Dashboard queries aggregate millions of rows | Scheduled refresh (pg_cron) |
| Denormalized read table | Read and write models have completely different shapes | CQRS with event-driven sync |
| Cached count column | `COUNT(*)` on large tables is too slow | Increment/decrement trigger |

### Cached count example

```sql
-- Add a count column to the parent table
ALTER TABLE projects ADD COLUMN task_count INT NOT NULL DEFAULT 0;

-- Trigger to maintain the count
CREATE OR REPLACE FUNCTION update_task_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects SET task_count = task_count + 1 WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects SET task_count = task_count - 1 WHERE id = OLD.project_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_task_count
AFTER INSERT OR DELETE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_task_count();
```

## JSONB as controlled denormalization

PostgreSQL JSONB is appropriate when:

- The schema of the stored data varies per row (form submissions, configuration, metadata).
- You never need to JOIN on values inside the JSONB column.
- You index specific paths with GIN or expression indexes.

```sql
-- Flexible metadata with GIN index
CREATE TABLE form_submissions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id    UUID NOT NULL REFERENCES forms(id),
  data       JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_submissions_data ON form_submissions USING GIN (data jsonb_path_ops);

-- Query specific paths
SELECT * FROM form_submissions
WHERE data @> '{"status": "approved"}'
  AND form_id = 'abc-123';
```

## Decision checklist

Before denormalizing, answer these questions:

1. Have you added proper indexes and verified with EXPLAIN ANALYZE?
2. Is the slow query fixable with a covering index or query rewrite?
3. What is the write-to-read ratio for this data?
4. Who is responsible for keeping the denormalized data consistent?
5. Can a materialized view solve the problem without schema changes?
