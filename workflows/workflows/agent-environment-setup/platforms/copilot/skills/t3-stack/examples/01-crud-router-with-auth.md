# Example: CRUD tRPC Router with Authentication

## Scenario

A team is building a project management app with the T3 Stack. They need a tRPC router for managing tasks that belong to projects. Tasks have a title, description, status (TODO, IN_PROGRESS, DONE), priority, and are assigned to a user. Only authenticated users can create, update, or delete tasks. Users can only modify tasks within projects they own.

## Prompt

"Create a tRPC router for tasks in my T3 Stack app. Tasks belong to projects and are assigned to users. I need list (with filters), getById, create, update status, and delete. Only project owners should be able to modify tasks."

## Expected Output

### Prisma Schema Addition

```prisma
model Task {
  id          String     @id @default(cuid())
  title       String
  description String?
  status      TaskStatus @default(TODO)
  priority    Int        @default(0)
  projectId   String
  project     Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assigneeId  String?
  assignee    User?      @relation(fields: [assigneeId], references: [id])
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}
```

### tRPC Router

```typescript
// src/server/api/routers/task.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

const taskStatusEnum = z.enum(["TODO", "IN_PROGRESS", "DONE"]);

export const taskRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        projectId: z.string().cuid(),
        status: taskStatusEnum.optional(),
        assigneeId: z.string().cuid().optional(),
        cursor: z.string().cuid().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tasks = await ctx.db.task.findMany({
        where: {
          projectId: input.projectId,
          ...(input.status && { status: input.status }),
          ...(input.assigneeId && { assigneeId: input.assigneeId }),
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        include: { assignee: { select: { id: true, name: true, image: true } } },
      });

      let nextCursor: string | undefined;
      if (tasks.length > input.limit) {
        const next = tasks.pop();
        nextCursor = next?.id;
      }

      return { tasks, nextCursor };
    }),

  create: protectedProcedure
    .input(
      z.object({
        projectId: z.string().cuid(),
        title: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        priority: z.number().int().min(0).max(4).default(0),
        assigneeId: z.string().cuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the caller owns the project
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
        select: { ownerId: true },
      });

      if (!project || project.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the project owner can create tasks.",
        });
      }

      return ctx.db.task.create({ data: input });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        taskId: z.string().cuid(),
        status: taskStatusEnum,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({
        where: { id: input.taskId },
        include: { project: { select: { ownerId: true } } },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." });
      }

      if (task.project.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the project owner can update tasks.",
        });
      }

      return ctx.db.task.update({
        where: { id: input.taskId },
        data: { status: input.status },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ taskId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({
        where: { id: input.taskId },
        include: { project: { select: { ownerId: true } } },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." });
      }

      if (task.project.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the project owner can delete tasks.",
        });
      }

      return ctx.db.task.delete({ where: { id: input.taskId } });
    }),
});
```

## Key Decisions

- **Cursor-based pagination** over offset — more efficient for large datasets and avoids skip-count drift.
- **Ownership check at the project level** — tasks inherit access control from their parent project.
- **`include` for assignee** — returns enough user info for the UI without exposing sensitive fields.
- **Priority as integer 0-4** — simpler than enums, easy to sort, maps to UI labels (None, Low, Medium, High, Critical).
