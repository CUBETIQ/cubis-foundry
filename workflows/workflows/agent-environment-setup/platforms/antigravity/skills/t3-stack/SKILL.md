---
name: t3-stack
description: "Use when building or maintaining T3 Stack apps with Next.js App Router, tRPC, Prisma, NextAuth.js, Tailwind CSS, and end-to-end type safety."
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
| `references/prisma-t3-patterns.md` | Writing Prisma schemas, queries, relations, or configuring the singleton client in T3.     |
| `references/auth-strategies.md`  | Configuring NextAuth.js providers, callbacks, session strategies, or wiring auth into tRPC.  |

## Examples

- "Set up a new T3 Stack project with Google OAuth and a Prisma PostgreSQL schema."
- "Add a tRPC router for CRUD operations on a blog post model with auth middleware."
- "Review my T3 Stack app for type safety gaps between tRPC and Prisma."

## Antigravity Platform Notes

- Skills are stored under `.agents/skills/<skill-id>/SKILL.md` (shared Agent Skills standard path).
- TOML command files in `.gemini/commands/` provide slash-command entry points for workflows and agent routes.
- Rules file: `.agents/rules/GEMINI.md`.
- Use Agent Manager for parallel agent coordination and multi-specialist delegation (equivalent to `@orchestrator`).
- Specialist routes are compiled into `.gemini/commands/agent-*.toml` command files — not project-local agent markdown.
- Reference files are loaded relative to the skill directory under `.agents/skills/<skill-id>/`.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available when Cubis Foundry MCP is configured.
- User arguments are passed as natural language via `{{args}}` in TOML command prompts.
