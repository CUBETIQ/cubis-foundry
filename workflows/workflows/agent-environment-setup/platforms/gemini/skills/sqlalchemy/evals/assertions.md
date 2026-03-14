# Assertions Reference

## Eval 1: Async session with relationship loading

This eval tests the core async SQLAlchemy workflow: configuring sessions correctly for async, using appropriate eager loading strategies for different relationship types, and handling nullable relationships.

### Assertion 1: expire_on_commit=False
**What it checks:** The async session factory sets `expire_on_commit=False`.
**Why it matters:** This is the single most common source of `MissingGreenlet` errors. After commit, SQLAlchemy expires loaded attributes by default. In async mode, the implicit lazy reload cannot run without a greenlet context. Setting `expire_on_commit=False` keeps loaded data accessible.

### Assertion 2: joinedload for many-to-one
**What it checks:** The query uses `joinedload()` for the `User.team` relationship.
**Why it matters:** `joinedload` uses a LEFT JOIN in a single query, which is the correct strategy for many-to-one and one-to-one relationships. Using `selectinload` for a single object adds an unnecessary extra query. Using no eager loading at all will raise `MissingGreenlet` in async.

### Assertion 3: selectinload for one-to-many
**What it checks:** The query uses `selectinload()` for the `Team.projects` collection.
**Why it matters:** `selectinload` uses a separate `SELECT ... WHERE id IN (...)` query, which is the correct strategy for collections. Using `joinedload` on a collection creates a cartesian product that duplicates parent rows and wastes bandwidth.

### Assertion 4: None handling for nullable relationship
**What it checks:** The code handles `user.team` being `None` before accessing `team.projects`.
**Why it matters:** A user without a team will have `team=None`. Accessing `None.projects` raises `AttributeError`. Production code must guard against this, especially when the relationship is optional (nullable foreign key).

### Assertion 5: 2.0-style select() syntax
**What it checks:** The code uses `select(User).where(...)` instead of `session.query(User).filter(...)`.
**Why it matters:** The legacy `Query` API is soft-deprecated in SQLAlchemy 2.0. The `select()` API is composable, supports type inference, works identically in sync and async, and is the only API receiving future improvements.

---

## Eval 2: Alembic migration strategy

This eval tests safe migration practices for production databases: handling non-nullable columns on tables with existing data, concurrent index creation, and rollback support.

### Assertion 1: server_default for existing rows
**What it checks:** The migration uses `server_default` when adding the column.
**Why it matters:** Adding a non-nullable column to a table with 2M rows without a server default will fail immediately because existing rows violate the NOT NULL constraint. `server_default` tells the database to apply a default value at the storage engine level, which is fast and does not require a full table rewrite on Postgres.

### Assertion 2: Concurrent index creation
**What it checks:** The migration creates the index with `postgresql_concurrently=True` or equivalent.
**Why it matters:** Standard `CREATE INDEX` acquires a SHARE lock on the table, blocking all writes for the duration. On a 2M row table, this can mean minutes of downtime. `CREATE INDEX CONCURRENTLY` builds the index without blocking writes, which is essential for zero-downtime deployments.

### Assertion 3: Both upgrade() and downgrade()
**What it checks:** The migration script includes both `upgrade()` and `downgrade()` functions.
**Why it matters:** Production rollback capability is non-negotiable. If the deployment fails after the migration runs, the downgrade path must be available to revert the schema change. Auto-generated migrations often have incomplete or missing downgrade logic.

### Assertion 4: Enum column type
**What it checks:** The column uses a proper enum type (Python enum mapped to DB ENUM or CHECK constraint).
**Why it matters:** Storing roles as plain strings allows invalid values. A database-level ENUM or CHECK constraint enforces valid values at the storage layer, preventing data corruption regardless of application-level validation.

### Assertion 5: Transaction boundary for concurrent index
**What it checks:** The migration handles the transaction boundary correctly for `CREATE INDEX CONCURRENTLY`.
**Why it matters:** `CREATE INDEX CONCURRENTLY` cannot run inside a transaction block. Alembic wraps each migration in a transaction by default. The migration must explicitly commit or end the transaction before creating the concurrent index, or the command will fail with a Postgres error.
