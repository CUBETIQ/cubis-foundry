# Prisma T3 Patterns

Load this when writing Prisma schemas, queries, relations, or configuring the Prisma client singleton in a T3 Stack application.

## Singleton Prisma client

```typescript
// src/server/db.ts
import { PrismaClient } from "@prisma/client";

const createPrismaClient = () =>
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

- Next.js hot-reload in development creates a new module scope on every change.
- Without the global cache, each reload creates a new PrismaClient, exhausting database connections.
- In production, the module is loaded once, so the global fallback is never used.
- Enable query logging only in development to debug slow queries.

## Schema design conventions

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  image     String?
  role      String   @default("member")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  projects  Project[]
  tasks     Task[]

  // NextAuth relations
  accounts  Account[]
  sessions  Session[]
}

model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  ownerId     String
  owner       User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  tasks       Task[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([ownerId])
}
```

- Use `cuid()` for IDs — URL-safe, collision-resistant, and sortable.
- Always add `createdAt` and `updatedAt` to every model.
- Add `@@index` on foreign key columns used in WHERE clauses and JOINs.
- Use `onDelete: Cascade` when child records should be removed with the parent.

## Query patterns for tRPC procedures

### Paginated list with cursor

```typescript
const tasks = await ctx.db.task.findMany({
  where: {
    projectId: input.projectId,
    ...(input.status && { status: input.status }),
  },
  take: input.limit + 1,
  cursor: input.cursor ? { id: input.cursor } : undefined,
  orderBy: { createdAt: "desc" },
  include: {
    assignee: { select: { id: true, name: true, image: true } },
  },
});

let nextCursor: string | undefined;
if (tasks.length > input.limit) {
  const next = tasks.pop();
  nextCursor = next?.id;
}

return { tasks, nextCursor };
```

- Fetch `limit + 1` to determine if a next page exists without a separate count query.
- Use `include` with `select` to fetch related data without exposing all fields.
- Cursor pagination outperforms offset pagination for large datasets.

### Single record with ownership check

```typescript
const project = await ctx.db.project.findUnique({
  where: { id: input.projectId },
  select: { ownerId: true },
});

if (!project) {
  throw new TRPCError({ code: "NOT_FOUND", message: "Project not found." });
}

if (project.ownerId !== ctx.session.user.id) {
  throw new TRPCError({ code: "FORBIDDEN", message: "Not your project." });
}
```

- Use `select` to fetch only the fields needed for the check — do not load the entire record.
- Separate NOT_FOUND from FORBIDDEN to give the client actionable error information.

### Transactional multi-step mutations

```typescript
const result = await ctx.db.$transaction(async (tx) => {
  const project = await tx.project.create({
    data: { name: input.name, ownerId: ctx.session.user.id },
  });

  await tx.task.create({
    data: {
      title: "Getting started",
      projectId: project.id,
      assigneeId: ctx.session.user.id,
    },
  });

  return project;
});
```

- Use `$transaction` with the interactive callback (not the array form) for multi-step logic.
- The `tx` client shares the same connection and rolls back all operations if any step throws.
- Never mix `ctx.db` and `tx` inside the transaction callback — use `tx` exclusively.

## Relation patterns

### One-to-many

```prisma
model Project {
  id    String @id @default(cuid())
  tasks Task[]
}

model Task {
  id        String  @id @default(cuid())
  projectId String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
}
```

### Many-to-many with explicit junction

```prisma
model Tag {
  id    String      @id @default(cuid())
  name  String      @unique
  tasks TaskTag[]
}

model TaskTag {
  taskId String
  tagId  String
  task   Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  tag    Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([taskId, tagId])
}
```

- Explicit junction tables are preferred over implicit many-to-many for T3 apps because they allow adding metadata (e.g., `assignedAt`, `assignedBy`).

## Prisma with environment validation

```typescript
// src/env.js
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
  },
});
```

- Validate DATABASE_URL at build time so that a missing connection string fails fast.
- Use `z.string().url()` to catch malformed connection strings before Prisma tries to connect.

## Connection pooling for serverless

```
# Pooled connection for queries (PgBouncer or Prisma Accelerate)
DATABASE_URL="postgresql://user:pass@pooler.example.com:6543/mydb?pgbouncer=true"

# Direct connection for migrations (bypasses the pooler)
DIRECT_URL="postgresql://user:pass@db.example.com:5432/mydb"
```

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

- Serverless functions create a new connection per invocation — pooling is mandatory.
- Prisma uses `directUrl` for migrations and `url` for runtime queries.
- PgBouncer in transaction mode requires `?pgbouncer=true` to disable prepared statements.

## Common pitfalls

- **N+1 queries**: Using `findUnique` in a loop instead of `findMany` with `where: { id: { in: ids } }`.
- **Missing indexes**: Prisma does not auto-create indexes on foreign keys. Add `@@index` explicitly.
- **Stale client after migration**: Run `prisma generate` after every schema change to regenerate the client.
- **Raw SQL bypassing type safety**: Use `$queryRaw` with tagged templates and `Prisma.sql` for parameterized queries.
