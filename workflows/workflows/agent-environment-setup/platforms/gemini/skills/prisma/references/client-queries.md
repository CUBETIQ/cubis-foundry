# Client Queries

Load this when writing Prisma Client queries, transactions, raw SQL, aggregations, batch operations, or controlling relation loading.

## Select and Include

### Select: Pick Specific Fields

```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    name: true,
    email: true,
    // Relations can also be selected
    posts: {
      select: { id: true, title: true },
      take: 5,
      orderBy: { createdAt: "desc" },
    },
  },
});
// Type: { id: string; name: string; email: string; posts: { id: string; title: string }[] }
```

- `select` returns ONLY the specified fields. Unselected fields are not queried or returned.
- Use `select` when you need a specific shape and want to minimize data transfer.

### Include: Add Relations to Full Model

```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    posts: true,                          // All post fields
    memberships: {
      include: { organization: true },    // Nested include
    },
    _count: {
      select: { posts: true, comments: true },  // Relation counts
    },
  },
});
// Type: User & { posts: Post[]; memberships: (Membership & { organization: Organization })[]; _count: { posts: number; comments: number } }
```

- `include` returns ALL scalar fields of the model plus the included relations.
- `_count` generates a SQL COUNT subquery — no data transfer for counted rows.

### Select vs Include

| | `select` | `include` |
| --- | --- | --- |
| Scalar fields | Only selected fields | All scalar fields |
| Relations | Only selected relations | Base model + included relations |
| Use when | You need a specific shape | You need the full model plus relations |

**You cannot use both `select` and `include` at the top level.** Choose one.

## Filtering

```typescript
const tasks = await prisma.task.findMany({
  where: {
    AND: [
      { projectId: projectId },
      { status: { in: ["TODO", "IN_PROGRESS"] } },
      {
        OR: [
          { assigneeId: userId },
          { dueDate: { lte: new Date() } },
        ],
      },
    ],
    // String filters
    title: { contains: "urgent", mode: "insensitive" },
    // Null checks
    deletedAt: null, // IS NULL
  },
  orderBy: [
    { priority: "desc" },
    { dueDate: "asc" },
  ],
});
```

### Filter Operators

| Operator | SQL equivalent | Example |
| --- | --- | --- |
| `equals` | `=` | `{ status: "TODO" }` (shorthand) |
| `not` | `!=` | `{ status: { not: "DONE" } }` |
| `in` | `IN (...)` | `{ status: { in: ["TODO", "IN_PROGRESS"] } }` |
| `notIn` | `NOT IN (...)` | `{ status: { notIn: ["DONE"] } }` |
| `lt`, `lte`, `gt`, `gte` | `<`, `<=`, `>`, `>=` | `{ dueDate: { lte: new Date() } }` |
| `contains` | `LIKE '%...%'` | `{ title: { contains: "bug" } }` |
| `startsWith` | `LIKE '...%'` | `{ email: { startsWith: "admin" } }` |
| `mode: "insensitive"` | `ILIKE` (Postgres) | `{ title: { contains: "bug", mode: "insensitive" } }` |

## Transactions

### Interactive Transactions

```typescript
const result = await prisma.$transaction(async (tx) => {
  // All queries use `tx` instead of `prisma`
  const sender = await tx.account.update({
    where: { id: senderId },
    data: { balance: { decrement: amount } },
  });

  if (sender.balance < 0) {
    throw new Error("Insufficient balance"); // Rolls back entire transaction
  }

  const receiver = await tx.account.update({
    where: { id: receiverId },
    data: { balance: { increment: amount } },
  });

  return { sender, receiver };
}, {
  maxWait: 5000,   // Max time to acquire a connection
  timeout: 10000,  // Max time for the transaction to complete
});
```

- Use interactive transactions for multi-step writes that must be atomic.
- Throwing inside the callback rolls back all changes.
- Set `timeout` to prevent long-running transactions from holding locks.

### Sequential Transactions (Batch)

```typescript
const [users, posts] = await prisma.$transaction([
  prisma.user.findMany({ where: { isActive: true } }),
  prisma.post.findMany({ where: { published: true } }),
]);
```

Sequential transactions run queries in a single database transaction but without the ability to use results of one query in another.

## Batch Operations

```typescript
// Create many records in a single INSERT
const created = await prisma.task.createMany({
  data: tasks.map((t) => ({
    title: t.title,
    projectId: t.projectId,
    status: "TODO",
  })),
  skipDuplicates: true, // Ignore rows that violate unique constraints
});

// Update many records in a single UPDATE
const updated = await prisma.task.updateMany({
  where: {
    projectId: projectId,
    status: "TODO",
    dueDate: { lt: new Date() },
  },
  data: { status: "OVERDUE" },
});

// Delete many records in a single DELETE
const deleted = await prisma.task.deleteMany({
  where: {
    projectId: projectId,
    status: "DONE",
    updatedAt: { lt: thirtyDaysAgo },
  },
});
```

- `createMany` does NOT return the created records (PostgreSQL can with `createManyAndReturn`).
- `updateMany` and `deleteMany` return a count, not the affected records.

## Aggregations

```typescript
// Group by with count
const statusCounts = await prisma.task.groupBy({
  by: ["status"],
  where: { projectId: projectId },
  _count: { id: true },
  _avg: { estimatedHours: true },
  orderBy: { _count: { id: "desc" } },
});

// Aggregate without grouping
const stats = await prisma.task.aggregate({
  where: { projectId: projectId },
  _count: true,
  _avg: { estimatedHours: true },
  _sum: { estimatedHours: true },
  _min: { createdAt: true },
  _max: { createdAt: true },
});
```

## Cursor-Based Pagination

```typescript
async function getPaginatedTasks(projectId: string, cursor?: string) {
  const take = 20;

  const tasks = await prisma.task.findMany({
    where: { projectId },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
  });

  const hasMore = tasks.length > take;
  const items = hasMore ? tasks.slice(0, take) : tasks;

  return {
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}
```

- Fetch `take + 1` to check for a next page without a separate count query.
- `skip: 1` skips the cursor record itself (it was the last record of the previous page).

## Raw SQL

```typescript
// Typed raw query (returns typed result)
const users = await prisma.$queryRaw<{ id: string; count: number }[]>`
  SELECT u.id, COUNT(p.id)::int as count
  FROM users u
  LEFT JOIN posts p ON p.author_id = u.id
  GROUP BY u.id
  HAVING COUNT(p.id) > ${minPosts}
`;

// Untyped execute (for DDL, bulk updates)
const affected = await prisma.$executeRaw`
  UPDATE tasks SET status = 'OVERDUE'
  WHERE due_date < NOW() AND status = 'TODO'
`;
```

- Use tagged template literals (backticks) for automatic parameterization that prevents SQL injection.
- Never use string interpolation (`${variable}`) in raw SQL — always use the tagged template.
- Prefer Prisma Client queries over raw SQL. Use raw SQL only for queries that Prisma cannot express.
