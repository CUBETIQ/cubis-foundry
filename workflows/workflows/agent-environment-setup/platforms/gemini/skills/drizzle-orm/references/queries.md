# Queries

Load this when writing relational queries, SQL-like queries, transactions, prepared statements, or aggregation patterns with Drizzle ORM.

## Relational query API

### Basic findMany with relations

```typescript
// Load all active users with their team and posts
const usersWithTeams = await db.query.users.findMany({
  where: eq(users.isActive, true),
  with: {
    team: true,          // loads the related team (many-to-one)
    posts: true,         // loads all posts (one-to-many)
  },
});
// Type: { id: number; email: string; team: Team | null; posts: Post[] }[]
```

### Nested relations

```typescript
const usersWithNestedData = await db.query.users.findMany({
  with: {
    posts: {
      with: {
        comments: {
          with: {
            author: true,   // 3 levels deep
          },
        },
      },
      orderBy: [desc(posts.createdAt)],
      limit: 10,
    },
  },
});
```

### findFirst

```typescript
const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: { team: true },
});
// Type: { id: number; email: string; team: Team | null } | undefined
```

### Selecting specific columns

```typescript
const userEmails = await db.query.users.findMany({
  columns: {
    id: true,
    email: true,
    // Other columns excluded from result type
  },
  where: eq(users.isActive, true),
});
// Type: { id: number; email: string }[]
```

### Filtering relations

```typescript
const teamsWithActiveMembers = await db.query.teams.findMany({
  with: {
    members: {
      where: eq(users.isActive, true),
      orderBy: [asc(users.displayName)],
      limit: 50,
    },
  },
});
```

## SQL-like query API

### Select with joins

```typescript
import { eq, and, or, gt, like, sql } from "drizzle-orm";

// Inner join
const results = await db
  .select({
    userName: users.displayName,
    teamName: teams.name,
  })
  .from(users)
  .innerJoin(teams, eq(users.teamId, teams.id))
  .where(eq(users.isActive, true));

// Left join (nullable team)
const results = await db
  .select()
  .from(users)
  .leftJoin(teams, eq(users.teamId, teams.id));
// Type includes { users: User; teams: Team | null }
```

### Complex WHERE clauses

```typescript
const filtered = await db
  .select()
  .from(users)
  .where(
    and(
      eq(users.isActive, true),
      or(
        like(users.email, "%@company.com"),
        eq(users.role, "admin"),
      ),
      gt(users.createdAt, new Date("2024-01-01")),
    )
  );
```

### Insert

```typescript
// Single insert with returning
const [newUser] = await db
  .insert(users)
  .values({
    email: "new@example.com",
    displayName: "New User",
  })
  .returning();

// Bulk insert
await db.insert(users).values([
  { email: "a@example.com", displayName: "User A" },
  { email: "b@example.com", displayName: "User B" },
]);

// Upsert (insert or update on conflict)
await db
  .insert(users)
  .values({ email: "upsert@example.com", displayName: "Upserted" })
  .onConflictDoUpdate({
    target: users.email,
    set: { displayName: "Upserted" },
  });
```

### Update

```typescript
const [updated] = await db
  .update(users)
  .set({
    displayName: "Updated Name",
    updatedAt: new Date(),
  })
  .where(eq(users.id, userId))
  .returning();
```

### Delete

```typescript
const [deleted] = await db
  .delete(users)
  .where(eq(users.id, userId))
  .returning();
```

## Transactions

```typescript
// Basic transaction
const result = await db.transaction(async (tx) => {
  const [team] = await tx
    .insert(teams)
    .values({ name: "New Team" })
    .returning();

  const [user] = await tx
    .update(users)
    .set({ teamId: team.id })
    .where(eq(users.id, userId))
    .returning();

  return { team, user };
});

// Transaction with rollback
await db.transaction(async (tx) => {
  await tx.insert(orders).values(orderData);
  await tx.update(inventory).set({ quantity: sql`quantity - 1` })
    .where(eq(inventory.productId, productId));

  // Check constraint
  const [item] = await tx
    .select({ quantity: inventory.quantity })
    .from(inventory)
    .where(eq(inventory.productId, productId));

  if (item.quantity < 0) {
    tx.rollback();  // Explicit rollback
  }
});
```

- Always use transactions for multi-table writes.
- Throwing inside the callback also triggers rollback.
- The `tx` object has the same API as `db` but runs within the transaction.

## Aggregations

```typescript
import { count, sum, avg, min, max, sql } from "drizzle-orm";

// Count users per team
const teamCounts = await db
  .select({
    teamId: users.teamId,
    teamName: teams.name,
    memberCount: count(users.id),
  })
  .from(users)
  .innerJoin(teams, eq(users.teamId, teams.id))
  .groupBy(users.teamId, teams.name);

// Conditional aggregation
const stats = await db
  .select({
    total: count(),
    activeCount: sql<number>`count(*) filter (where ${users.isActive} = true)`,
    avgNameLength: avg(sql`length(${users.displayName})`),
  })
  .from(users);
```

## Prepared statements

```typescript
// Define once (module scope or initialization)
const getUserById = db.query.users
  .findFirst({
    where: eq(users.id, sql.placeholder("id")),
    with: { team: true },
  })
  .prepare("get_user_by_id");

// Execute many times (request scope)
const user = await getUserById.execute({ id: 42 });
```

- Prepared statements skip SQL compilation on repeated calls.
- Use for hot-path queries (auth checks, profile loads, list endpoints).
- The placeholder name must match the execute parameter key.

## Pagination patterns

### Cursor-based (recommended)

```typescript
async function getUsers(cursor?: number, limit = 20) {
  const conditions = [eq(users.isActive, true)];
  if (cursor) {
    conditions.push(gt(users.id, cursor));
  }

  const results = await db
    .select()
    .from(users)
    .where(and(...conditions))
    .orderBy(asc(users.id))
    .limit(limit + 1);  // Fetch one extra to detect hasMore

  const hasMore = results.length > limit;
  const items = hasMore ? results.slice(0, -1) : results;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return { items, nextCursor, hasMore };
}
```

### Offset-based (simple but slow on large tables)

```typescript
const page = await db
  .select()
  .from(users)
  .orderBy(asc(users.id))
  .limit(20)
  .offset(page * 20);
```

- Prefer cursor-based pagination. Offset scans and discards rows.
- At offset 100,000, the database reads 100,020 rows to return 20.

## Raw SQL escape hatch

```typescript
import { sql } from "drizzle-orm";

// Typed raw SQL
const result = await db.execute<{ count: number }>(
  sql`SELECT count(*) as count FROM users WHERE created_at > ${cutoffDate}`
);

// Raw SQL in expressions
const results = await db
  .select({
    id: users.id,
    emailDomain: sql<string>`split_part(${users.email}, '@', 2)`,
  })
  .from(users);
```

- Use `sql` template tag to prevent SQL injection. Parameters are automatically escaped.
- Use `sql<ReturnType>` generic to type the result of raw expressions.
