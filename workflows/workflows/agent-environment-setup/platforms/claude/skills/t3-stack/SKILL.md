---
name: t3-stack
description: "Use when building or maintaining a full-stack TypeScript application with the T3 Stack: Next.js App Router, tRPC routers and procedures, Prisma schema and queries, NextAuth.js session handling, Tailwind CSS styling, and end-to-end type safety from database to UI."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# T3 Stack

## Purpose

Guide the design and implementation of production-grade full-stack TypeScript applications using the T3 Stack (Next.js + tRPC + Prisma + NextAuth.js + Tailwind CSS). Every instruction prioritizes end-to-end type safety, minimal client-side JavaScript, and secure-by-default session management.

## When to Use

- Scaffolding a new T3 Stack project or adding features to an existing one.
- Designing tRPC routers, procedures, and middleware chains.
- Writing Prisma schemas, queries, or migrations for a T3 application.
- Configuring NextAuth.js providers, callbacks, and session strategies.
- Connecting server components to tRPC queries with type-safe data fetching.
- Reviewing T3 Stack code for type holes, security gaps, or performance regressions.

## Instructions

1. **Confirm the runtime stack before writing code** because T3 projects vary across Next.js versions (Pages Router vs. App Router), tRPC versions (v10 vs. v11), and Prisma versions (v5 vs. v6). Mismatched assumptions cause subtle type errors.

2. **Initialize tRPC with a root router and typed caller** so that every procedure inherits shared context (session, database client) and the front end gets full autocompletion without manual type imports.

3. **Define Prisma models before writing tRPC procedures** because the schema is the single source of truth for database shape, and tRPC input/output types should derive from or validate against it.

4. **Use Zod schemas for every tRPC input and output** because runtime validation at the API boundary catches malformed data that TypeScript alone cannot enforce at runtime.

5. **Create reusable tRPC middleware for authentication and authorization** so that protected procedures declare their requirements declaratively rather than scattering session checks across every handler.

6. **Wire NextAuth.js session into the tRPC context** so that every procedure has access to the authenticated user without redundant session lookups or prop drilling.

7. **Prefer server-side tRPC callers in React Server Components** because calling tRPC on the server avoids a network round-trip, keeps secrets off the client, and feeds data directly into the RSC render tree.

8. **Use `@tanstack/react-query` integration for client components only** because client-side cache, optimistic updates, and mutations require a query client that does not exist in server components.

9. **Keep Prisma client as a singleton** by instantiating it once in a `db.ts` module with a global cache guard, because Next.js hot-reload in development creates many Prisma Client instances that exhaust database connections.

10. **Apply Tailwind CSS with utility-first composition and `cn()` helper** because consistent styling requires a merge strategy that handles conditional classes and avoids specificity conflicts.

11. **Write integration tests that exercise the full tRPC-to-Prisma path** because unit-testing procedures in isolation misses query bugs, middleware ordering issues, and session edge cases.

12. **Configure environment variables with `@t3-oss/env-nextjs`** so that missing or mistyped environment variables fail at build time rather than silently producing undefined values at runtime.

13. **Separate public and protected routers explicitly** because a single misconfigured middleware chain can expose private data, and explicit separation makes the boundary auditable.

14. **Handle tRPC errors with structured error codes and messages** so that the client can display meaningful feedback and retry logic can distinguish transient failures from permanent ones.

15. **Use Prisma transactions for multi-step mutations** because partial writes without a transaction leave the database in an inconsistent state when any step fails.

16. **Deploy with connection pooling (PgBouncer or Prisma Accelerate)** because serverless environments create a new database connection per invocation, quickly exhausting the connection limit.

## Output Format

Provide implementation code, schema definitions, configuration snippets, and architectural guidance as appropriate. Include file paths relative to the project root. When generating tRPC routers, always show the Zod input schema alongside the procedure.

## References

| File                              | Load when                                                                                     |
| --------------------------------- | --------------------------------------------------------------------------------------------- |
| `references/trpc-patterns.md`    | Designing tRPC routers, procedures, middleware, error handling, or server-side callers.       |
| `references/prisma-integration.md`| Writing Prisma schemas, queries, relations, or configuring the singleton client in T3.       |
| `references/auth-patterns.md`    | Configuring NextAuth.js providers, callbacks, session strategies, or wiring auth into tRPC.   |
| `references/testing.md`          | Writing integration tests, mocking tRPC context, or testing protected procedures.            |
| `references/deployment.md`       | Deploying to Vercel, managing environment variables, or configuring connection pooling.       |

## Examples

- "Set up a new T3 Stack project with Google OAuth and a Prisma PostgreSQL schema."
- "Add a tRPC router for CRUD operations on a blog post model with auth middleware."
- "Review my T3 Stack app for type safety gaps between tRPC and Prisma."
