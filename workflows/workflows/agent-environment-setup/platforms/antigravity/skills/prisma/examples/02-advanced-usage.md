# Example: Edge Deployment with Prisma Accelerate, Transactions, and Advanced Queries

## Scenario

A team is deploying their project management API to Vercel Edge Functions using Prisma 6 with Prisma Accelerate. They need to configure the datasource for edge compatibility, write efficient queries with controlled relation loading, implement atomic operations with transactions, add cursor-based pagination, and aggregate task statistics by status.

## Prompt

"Configure Prisma 6 for Vercel Edge Functions with Prisma Accelerate. Write queries for: (1) fetching a project with tasks, assignees, and label counts, (2) atomically creating a task and assigning it, (3) cursor-based paginated task list, and (4) task count grouped by status. Show the datasource config, client initialization, and connection pooling setup."

## Expected Output

### Edge-Compatible Datasource Configuration

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")        // Prisma Accelerate URL (prisma://...)
  directUrl = env("DIRECT_DATABASE_URL")  // Direct Postgres URL for migrations
}
```

### Client Initialization for Edge

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

// Singleton pattern for serverless: reuse across warm invocations
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  }).$extends(withAccelerate());

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

### Query 1: Project with Tasks, Assignees, and Label Counts

```typescript
// Controlled relation loading with include and _count
async function getProjectDetail(projectId: string) {
  return prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      tasks: {
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: { labels: true },
          },
        },
        orderBy: [
          { priority: "desc" },
          { dueDate: "asc" },
        ],
      },
    },
  });
}

// Usage:
// const project = await getProjectDetail("clx123...");
// project.tasks[0].assignee?.name  // "Alice"
// project.tasks[0]._count.labels   // 3
```

### Query 2: Atomic Task Creation and Assignment

```typescript
// Interactive transaction for multi-step atomic write
async function createAndAssignTask(input: {
  projectId: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  assigneeId: string;
  labelIds: string[];
}) {
  return prisma.$transaction(async (tx) => {
    // Verify the assignee is a member of the project's organization
    const project = await tx.project.findUniqueOrThrow({
      where: { id: input.projectId },
      select: { organizationId: true },
    });

    const membership = await tx.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: input.assigneeId,
          organizationId: project.organizationId,
        },
      },
    });

    if (!membership) {
      throw new Error("Assignee is not a member of the organization");
    }

    // Create the task with assignment and labels atomically
    const task = await tx.task.create({
      data: {
        title: input.title,
        description: input.description,
        priority: input.priority,
        projectId: input.projectId,
        assigneeId: input.assigneeId,
        labels: {
          create: input.labelIds.map((labelId) => ({
            labelId,
          })),
        },
      },
      include: {
        assignee: { select: { id: true, name: true } },
        labels: { include: { label: true } },
      },
    });

    return task;
  });
}
```

### Query 3: Cursor-Based Pagination

```typescript
// Cursor-based pagination for stable results
async function getTasksPaginated(projectId: string, options: {
  cursor?: string;
  take?: number;
}) {
  const take = options.take ?? 20;

  const tasks = await prisma.task.findMany({
    where: { projectId },
    take: take + 1, // Fetch one extra to determine if there is a next page
    ...(options.cursor
      ? {
          cursor: { id: options.cursor },
          skip: 1, // Skip the cursor item itself
        }
      : {}),
    orderBy: { createdAt: "desc" },
    include: {
      assignee: { select: { id: true, name: true } },
      _count: { select: { labels: true } },
    },
  });

  const hasNextPage = tasks.length > take;
  const items = hasNextPage ? tasks.slice(0, take) : tasks;
  const nextCursor = hasNextPage ? items[items.length - 1].id : undefined;

  return {
    items,
    nextCursor,
    hasNextPage,
  };
}

// Usage:
// const page1 = await getTasksPaginated("proj_123");
// const page2 = await getTasksPaginated("proj_123", { cursor: page1.nextCursor });
```

### Query 4: Task Count Grouped by Status

```typescript
// Database-level aggregation with groupBy
async function getTaskCountsByStatus(projectId: string) {
  const counts = await prisma.task.groupBy({
    by: ["status"],
    where: { projectId },
    _count: {
      id: true,
    },
    orderBy: {
      status: "asc",
    },
  });

  // Transform into a map for easy access
  const statusMap = Object.fromEntries(
    counts.map((c) => [c.status, c._count.id])
  );

  return {
    todo: statusMap.TODO ?? 0,
    inProgress: statusMap.IN_PROGRESS ?? 0,
    review: statusMap.REVIEW ?? 0,
    done: statusMap.DONE ?? 0,
    total: counts.reduce((sum, c) => sum + c._count.id, 0),
  };
}
```

### Connection Pooling Configuration

```
# .env — Prisma Accelerate URL with connection pool settings
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=your_key"

# Direct URL for prisma migrate (bypasses Accelerate)
DIRECT_DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=5&pool_timeout=10&sslmode=require"
```

### Vercel Edge Function Example

```typescript
// app/api/projects/[id]/tasks/route.ts (Next.js App Router on Edge)
import { prisma } from "@/lib/prisma";

export const runtime = "edge";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const take = parseInt(url.searchParams.get("take") ?? "20", 10);

  const result = await getTasksPaginated(params.id, { cursor, take });

  return Response.json(result, {
    headers: {
      "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
    },
  });
}
```

## Key Decisions

- **Prisma Accelerate with `$extends(withAccelerate())`** -- the edge-compatible extension routes queries through the Accelerate proxy, replacing the Rust query engine binary that cannot run in V8-only edge environments.
- **`directUrl` for migrations** -- migrations need a direct database connection, not the Accelerate proxy. `directUrl` enables `prisma migrate dev` locally while `url` points to Accelerate for runtime queries.
- **`$transaction(async (tx) => {})`** -- interactive transaction holds a database-level transaction across multiple queries. The membership check and task creation either both succeed or both roll back.
- **`take + 1` for pagination** -- fetching one extra record avoids a separate count query to determine if a next page exists. The extra record is sliced off before returning.
- **`groupBy` for aggregation** -- executes a single SQL `GROUP BY` query. Fetching all tasks and counting in JavaScript would transfer N rows instead of 4.
- **Singleton with `globalForPrisma`** -- in serverless, module-level variables persist across warm invocations but are recreated on cold starts. The singleton prevents creating a new PrismaClient (and connection pool) on every warm request.
