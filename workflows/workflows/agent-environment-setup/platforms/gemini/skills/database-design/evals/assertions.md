# Database Design Eval Assertions

## Eval 1: Normalized Schema Design

This eval tests the ability to produce a properly normalized relational schema with constraints, key selection, and relationship modeling for a multi-entity e-commerce domain.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `REFERENCES` — Foreign key declarations         | Referential integrity must be enforced at the database level. Without foreign keys, orphaned records accumulate silently. |
| 2 | contains | `NOT NULL` — Required column constraints        | Nullable columns that should be required allow incomplete data. Application-level checks are insufficient because direct DB access bypasses them. |
| 3 | contains | `UNIQUE` — Uniqueness constraints               | Natural uniqueness (user email, product SKU) must be enforced by the database. Duplicate detection in application code races under concurrency. |
| 4 | contains | `CREATE TABLE` — Executable DDL                 | Schema designs expressed as prose are ambiguous. Executable DDL can be validated, version-controlled, and applied directly. |
| 5 | contains | `PRIMARY KEY` — Explicit key declarations       | Every table needs a primary key for row identity, efficient joins, and replication. Implicit or missing keys cause subtle bugs in ORMs and migration tools. |

### What a passing response looks like

- A set of `CREATE TABLE` statements for users, addresses, products, categories, product_categories (junction), orders, order_items, and reviews.
- Foreign keys linking orders to users, order_items to orders and products, reviews to users and products, addresses to users.
- A junction table (product_categories) with a composite primary key to model the many-to-many relationship between products and categories.
- NOT NULL on required fields (user email, product name, order total, review rating).
- UNIQUE constraint on user email and any natural keys.
- Appropriate data types (TIMESTAMPTZ for dates, NUMERIC for money, TEXT or VARCHAR with limits for strings).
- Normalized to 3NF: no transitive dependencies, no repeated groups, no partial key dependencies.

---

## Eval 2: Index Optimization Strategy

This eval tests the ability to design indexes grounded in specific query patterns, including composite index column ordering and partial indexes.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `CREATE INDEX` — Executable index definitions   | Index recommendations in prose cannot be validated or applied. Executable statements ensure precision in column order and index type. |
| 2 | contains | `user_id` — User-based index                    | Multiple query patterns filter on user_id. Missing this index forces sequential scans on the most common access pattern. |
| 3 | contains | `status` — Status column indexing               | The dashboard groups by status and lookups filter by user+status. Without an index, these queries degrade as the orders table grows. |
| 4 | contains | `created_at` — Temporal indexing                | Sorting by creation date and filtering by date range are core patterns. B-tree indexes on timestamps enable efficient range scans. |
| 5 | contains | `WHERE` — Predicate-aware indexing              | Indexes must target specific query predicates. The response must connect each index to the query it serves, not just list columns. |

### What a passing response looks like

- A composite index on `(user_id, created_at DESC)` for fetching a user's orders sorted by date.
- An index on `status` (or a composite with status) for the dashboard count query.
- A composite index on `(user_id, status)` for the combined lookup pattern.
- A partial index or range-aware index for orders above $100 in the last 30 days (e.g., `WHERE total_amount > 100`).
- Each `CREATE INDEX` statement accompanied by a brief explanation of which query it targets and why the column order was chosen.
- Discussion of when a covering index might avoid heap lookups for read-heavy patterns.
