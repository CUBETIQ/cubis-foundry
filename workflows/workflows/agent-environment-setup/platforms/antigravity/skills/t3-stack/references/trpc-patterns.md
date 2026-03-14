# tRPC Patterns

Load this when designing tRPC routers, procedures, middleware, error handling, or server-side callers in a T3 Stack application.

## Router structure

```typescript
// src/server/api/root.ts
import { createTRPCRouter } from "~/server/api/trpc";
import { userRouter } from "./routers/user";
import { postRouter } from "./routers/post";

export const appRouter = createTRPCRouter({
  user: userRouter,
  post: postRouter,
});

export type AppRouter = typeof appRouter;
```

- One router per domain entity or bounded context.
- The root router re-exports all sub-routers and exposes `AppRouter` as the single type import for the client.
- Never define procedures directly on the root router.

## Procedure types

```typescript
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";

export const postRouter = createTRPCRouter({
  // Public: no auth required
  getPublished: publicProcedure
    .input(z.object({ cursor: z.string().optional(), limit: z.number().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.post.findMany({
        where: { published: true },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });
    }),

  // Protected: requires authenticated session
  create: protectedProcedure
    .input(z.object({ title: z.string().min(1).max(200), body: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.post.create({
        data: { ...input, authorId: ctx.session.user.id },
      });
    }),
});
```

- Use `publicProcedure` for reads that do not require auth.
- Use `protectedProcedure` for any operation that reads or writes user-specific data.
- Always attach Zod schemas to `.input()` even for simple inputs.

## Custom middleware

```typescript
// src/server/api/trpc.ts
import { TRPCError, initTRPC } from "@trpc/server";

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return { ...shape, data: { ...shape.data, zodError: error.cause instanceof ZodError ? error.cause.flatten() : null } };
  },
});

// Auth middleware — enforces session presence
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { session: { ...ctx.session, user: ctx.session.user } } });
});

// Role-based middleware — stacks on top of auth
const enforceUserIsAdmin = t.middleware(({ ctx, next }) => {
  if (ctx.session?.user?.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required." });
  }
  return next({ ctx });
});

export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
export const adminProcedure = t.procedure.use(enforceUserIsAuthed).use(enforceUserIsAdmin);
```

- Middleware chains execute in order. Auth must come before role checks.
- Each middleware narrows the context type so downstream procedures have typed access.
- Never duplicate auth checks inside procedure handlers when middleware already handles them.

## Error handling

```typescript
import { TRPCError } from "@trpc/server";

// Use structured error codes
throw new TRPCError({ code: "NOT_FOUND", message: "Post not found." });
throw new TRPCError({ code: "FORBIDDEN", message: "You do not own this resource." });
throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid input." });
throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unexpected failure." });

// Wrap external service errors
try {
  await stripeClient.charges.create(chargeData);
} catch (err) {
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Payment processing failed.",
    cause: err,
  });
}
```

- Always use `TRPCError` instead of generic `throw new Error()`.
- Map HTTP-like codes: `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `BAD_REQUEST`, `INTERNAL_SERVER_ERROR`.
- Attach the original error as `cause` for server-side debugging without leaking details to clients.

## Server-side callers (React Server Components)

```typescript
// src/trpc/server.ts
import { createCallerFactory } from "~/server/api/trpc";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { headers } from "next/headers";
import { cache } from "react";

const createContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");
  return createTRPCContext({ headers: heads });
});

const callerFactory = createCallerFactory(appRouter);
export const api = callerFactory(createContext);
```

```typescript
// app/dashboard/page.tsx (React Server Component)
import { api } from "~/trpc/server";

export default async function DashboardPage() {
  const posts = await api.post.getPublished({ limit: 10 });
  return <PostList posts={posts} />;
}
```

- Server callers bypass the HTTP layer entirely — no network round-trip.
- Use `cache()` from React to deduplicate context creation within a single render.
- Never import the server caller in client components (`"use client"`).

## Client-side usage with React Query

```typescript
// src/trpc/react.tsx
"use client";
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "~/server/api/root";

export const api = createTRPCReact<AppRouter>();
```

```typescript
// Client component
"use client";
import { api } from "~/trpc/react";

export function CreatePostForm() {
  const utils = api.useUtils();
  const createPost = api.post.create.useMutation({
    onSuccess: () => utils.post.getPublished.invalidate(),
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const data = new FormData(e.currentTarget);
      createPost.mutate({ title: data.get("title") as string, body: data.get("body") as string });
    }}>
      <input name="title" required />
      <textarea name="body" required />
      <button type="submit" disabled={createPost.isPending}>Create</button>
    </form>
  );
}
```

- Import `api` from `~/trpc/react` (not `~/trpc/server`) in client components.
- Invalidate related queries after mutations to keep the UI consistent.
- Use `isPending` (not the deprecated `isLoading`) for mutation state.
