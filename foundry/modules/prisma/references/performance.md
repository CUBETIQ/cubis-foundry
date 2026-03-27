# Performance

Load this when optimizing queries, preventing N+1 problems, tuning indexes, managing connection pools, or monitoring query performance.

## Detecting N+1 Queries

The most common Prisma performance problem is N+1 queries: fetching a list of records and then querying related data for each one individually.

### The Problem

```typescript
// BAD: N+1 — 1 query for posts + N queries for authors
const posts = await prisma.post.findMany();
for (const post of posts) {
  const author = await prisma.user.findUnique({
    where: { id: post.authorId },
  });
  console.log(`${post.title} by ${author?.name}`);
}
```

### The Fix

```typescript
// GOOD: 1 query with include (2 SQL queries total: posts + authors)
const posts = await prisma.post.findMany({
  include: { author: true },
});
for (const post of posts) {
  console.log(`${post.title} by ${post.author.name}`);
}
```

### Detecting N+1 with Query Logging

```typescript
const prisma = new PrismaClient({
  log: [
    { level: "query", emit: "event" },
  ],
});

prisma.$on("query", (e) => {
  console.log(`Query: ${e.query}`);
  console.log(`Duration: ${e.duration}ms`);
});
```

Enable query logging in development and staging to see every SQL query. If you see the same query repeated N times with different parameters, you have an N+1.

## Query Optimization Patterns

### Use `select` to Reduce Data Transfer

```typescript
// Instead of fetching all 20 columns
const users = await prisma.user.findMany();

// Fetch only what you need
const users = await prisma.user.findMany({
  select: { id: true, name: true, email: true },
});
```

On a table with large TEXT/JSON columns, `select` can reduce data transfer by 10-100x.

### Use `_count` Instead of Loading Relations

```typescript
// BAD: Loads all posts just to count them
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { posts: true },
});
const postCount = user.posts.length; // Transferred all post data

// GOOD: Database-level count
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    _count: { select: { posts: true } },
  },
});
const postCount = user._count.posts; // No post data transferred
```

### Batch Reads with `findMany` + `in`

```typescript
// BAD: N separate queries
const users = [];
for (const id of userIds) {
  users.push(await prisma.user.findUnique({ where: { id } }));
}

// GOOD: 1 query
const users = await prisma.user.findMany({
  where: { id: { in: userIds } },
});
```

### Use `createMany` for Bulk Inserts

```typescript
// BAD: N insert statements
for (const item of items) {
  await prisma.task.create({ data: item });
}

// GOOD: 1 insert statement
await prisma.task.createMany({ data: items });
```

## Index Strategy

### When to Add Indexes

Add `@@index` in the Prisma schema for:

1. **Foreign key columns** — Prisma does not auto-create FK indexes. Add them manually.
2. **Columns in `where` clauses** — Frequently filtered columns need indexes.
3. **Columns in `orderBy` clauses** — Sorting without an index requires a full table scan and filesort.
4. **Columns in `groupBy` clauses** — Aggregation queries benefit from indexes on grouped columns.
5. **Composite queries** — Use `@@index([col1, col2])` for queries that filter on both columns.

### Index Trade-offs

| Benefit | Cost |
| --- | --- |
| Faster reads (WHERE, ORDER BY, JOIN) | Slower writes (INSERT, UPDATE, DELETE must update indexes) |
| Faster aggregations (GROUP BY, COUNT) | Increased storage |
| Unique constraint enforcement | Index maintenance during migrations |

### Checking Index Usage

```sql
-- PostgreSQL: Check if a query uses indexes
EXPLAIN ANALYZE SELECT * FROM tasks WHERE status = 'TODO' AND project_id = 'abc';
```

Look for `Index Scan` or `Index Only Scan`. If you see `Seq Scan` on a large table, add an index.

## Connection Pool Monitoring

### Symptoms of Pool Exhaustion

- Queries suddenly take 5-10+ seconds (waiting for a connection).
- `PrismaClientKnownRequestError: Timed out fetching a new connection from the connection pool`.
- Database shows many idle connections near the max limit.

### Fixes

1. **Reduce `connection_limit`** in serverless environments (2-5 per instance).
2. **Use Prisma Accelerate** for managed pooling.
3. **Use PgBouncer** for self-hosted connection pooling.
4. **Close the client** in short-lived scripts: `await prisma.$disconnect()`.
5. **Use the singleton pattern** in serverless to reuse the client across warm invocations.

## Monitoring Checklist

1. **Enable query logging** in staging with duration thresholds.
2. **Track slow queries** (>100ms) and investigate their EXPLAIN plans.
3. **Monitor connection pool utilization** in your database dashboard.
4. **Set up alerts** for pool exhaustion errors in your error tracking tool.
5. **Profile before optimizing** — measure actual query times, do not guess which queries are slow.
