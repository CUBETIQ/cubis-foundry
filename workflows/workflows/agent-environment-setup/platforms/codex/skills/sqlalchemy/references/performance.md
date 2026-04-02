# Performance

Load this when tuning query performance, relationship loading strategies, connection pooling, or diagnosing N+1 problems in SQLAlchemy 2.0+.

## Diagnosing N+1 queries

### The problem

```python
# BAD: N+1 query pattern
stmt = select(User).where(User.is_active == True)
result = await session.execute(stmt)
users = result.scalars().all()  # 1 query

for user in users:
    print(user.team.name)  # N queries (one per user, lazy load)
```

### The fix

```python
# GOOD: eager load with selectinload
stmt = (
    select(User)
    .where(User.is_active == True)
    .options(selectinload(User.team))
)
result = await session.execute(stmt)
users = result.scalars().all()  # 2 queries total (users + teams IN (...))
```

### Detecting N+1 in development

```python
# Enable SQL echo for development
engine = create_async_engine(url, echo=True)

# Or use event listeners for structured logging
from sqlalchemy import event

@event.listens_for(engine.sync_engine, "before_cursor_execute")
def log_query(conn, cursor, statement, parameters, context, executemany):
    logger.debug("SQL: %s", statement[:200])
```

- Count queries per request. If count > 10 for a list endpoint, suspect N+1.
- In production, use OpenTelemetry SQLAlchemy instrumentation for query counting.

## Loading strategy selection

### selectinload (recommended default for collections)

```python
# Generates: SELECT * FROM posts WHERE user_id IN (1, 2, 3, ...)
stmt = select(User).options(selectinload(User.posts))
```

- One extra query regardless of result count.
- Efficient for one-to-many and many-to-many.
- Limitation: IN clause has database-specific limits (Postgres: no practical limit; SQLite: 999).

### joinedload (best for single-object relations)

```python
# Generates: SELECT ... FROM users LEFT JOIN profiles ON ...
stmt = select(User).options(joinedload(User.profile))
```

- Single query with LEFT JOIN.
- Efficient for many-to-one and one-to-one.
- Danger: using joinedload on collections creates a cartesian product, duplicating parent rows.

### Nested eager loading

```python
stmt = (
    select(User)
    .options(
        selectinload(User.posts)
            .selectinload(Post.comments)
            .joinedload(Comment.author),
    )
)
```

- Chain loading strategies for nested relationships.
- Keep depth <= 3. Deeper nesting suggests the query is doing too much.

## Bulk operations

### Bulk insert

```python
# Fast bulk insert (bypasses ORM identity map)
from sqlalchemy import insert

values = [
    {"email": f"user{i}@example.com", "display_name": f"User {i}"}
    for i in range(10_000)
]

await session.execute(insert(User), values)
await session.commit()
```

### Bulk update

```python
from sqlalchemy import update

# Single UPDATE statement, no ORM overhead
stmt = (
    update(User)
    .where(User.last_login < cutoff_date)
    .values(is_active=False)
)
await session.execute(stmt)
```

### Bulk delete

```python
from sqlalchemy import delete

stmt = delete(AuditLog).where(AuditLog.created_at < retention_cutoff)
await session.execute(stmt)
```

- Bulk operations bypass the identity map and events. Use them for batch jobs, not user-facing writes where you need hooks.
- For very large datasets (1M+ rows), batch in chunks of 5,000-10,000 to control memory and transaction size.

## Query optimization patterns

### Select only needed columns

```python
# Load full objects only when you need to modify them
stmt = select(User)  # All columns loaded

# For read-only display, select specific columns
stmt = select(User.id, User.email, User.display_name)
result = await session.execute(stmt)
rows = result.all()  # Returns Row objects, not ORM models
```

### Use `exists()` instead of counting

```python
from sqlalchemy import exists

# BAD: counting all rows just to check existence
stmt = select(func.count()).select_from(User).where(User.email == email)

# GOOD: exists() stops at first match
stmt = select(exists().where(User.email == email))
result = await session.execute(stmt)
email_taken = result.scalar()
```

### Pagination with keyset (cursor-based)

```python
# BAD: OFFSET pagination (slow on large tables)
stmt = select(User).order_by(User.id).offset(10000).limit(20)

# GOOD: keyset pagination (constant performance)
stmt = (
    select(User)
    .where(User.id > last_seen_id)
    .order_by(User.id)
    .limit(20)
)
```

- OFFSET pagination scans and discards rows. At offset 100,000 it reads 100,020 rows.
- Keyset pagination uses an index seek. Constant time regardless of page number.

## Connection pool monitoring

```python
from sqlalchemy import event

@event.listens_for(engine.sync_engine, "checkout")
def on_checkout(dbapi_conn, connection_record, connection_proxy):
    logger.info("Connection checked out. Pool: %s", engine.pool.status())

@event.listens_for(engine.sync_engine, "checkin")
def on_checkin(dbapi_conn, connection_record):
    logger.info("Connection returned. Pool: %s", engine.pool.status())
```

### Pool status metrics

```python
pool = engine.pool
metrics = {
    "pool_size": pool.size(),
    "checked_out": pool.checkedout(),
    "overflow": pool.overflow(),
    "checked_in": pool.checkedin(),
}
```

- Export pool metrics to your monitoring system (Prometheus, Datadog).
- Alert when `checked_out` approaches `pool_size + max_overflow`.

## Index usage verification

```python
# Check if a query uses an index (Postgres)
stmt = text("EXPLAIN ANALYZE SELECT * FROM users WHERE email = :email")
result = await session.execute(stmt, {"email": "test@example.com"})
plan = result.fetchall()
for row in plan:
    print(row[0])
```

- Run EXPLAIN ANALYZE on slow queries. Look for `Seq Scan` on large tables as a red flag.
- Missing index on a filtered column with > 10,000 rows is almost always the cause of slow queries.

## Compiled query cache

SQLAlchemy 2.0 caches compiled SQL statements automatically.

```python
# The statement compiler cache is per-engine
engine = create_async_engine(
    url,
    query_cache_size=500,  # Default is 500; increase for large apps
)
```

- Cache reduces compilation overhead for repeated query patterns.
- Parameterized queries hit the cache. Inline literals generate new cache entries.
- Monitor cache hit rate via `engine.dialect._compiled_cache` in development.

## Performance checklist

- Every list endpoint uses explicit eager loading (no implicit lazy loads).
- Pagination uses keyset (cursor) instead of OFFSET for tables > 10,000 rows.
- Bulk operations use `insert()`, `update()`, `delete()` instead of looping over ORM objects.
- Read-only queries select only needed columns when full ORM objects are not required.
- Connection pool is sized for the deployment model (see `async-sessions.md`).
- EXPLAIN ANALYZE has been run on queries touching tables > 100,000 rows.
- N+1 detection is enabled in development (SQL echo or query counter middleware).
