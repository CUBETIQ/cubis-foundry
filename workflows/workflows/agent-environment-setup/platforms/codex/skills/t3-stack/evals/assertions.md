# T3 Stack Eval Assertions

## Eval 1: tRPC Router with Prisma Queries

This eval tests the core T3 Stack workflow: building a tRPC router backed by Prisma with proper authentication middleware.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `z.object` — Zod schema usage                  | Runtime validation at the tRPC boundary is non-negotiable. TypeScript types vanish at runtime.       |
| 2 | contains | `protectedProcedure` — Auth middleware          | Mutations that modify data must require authentication. Using publicProcedure here is a security bug.|
| 3 | contains | `prisma` — Prisma client usage                  | The T3 Stack convention is Prisma for all database access. Raw SQL or other ORMs break type safety.  |
| 4 | contains | `TRPCError` — Structured error handling         | Generic throws produce unhelpful client errors. TRPCError codes enable proper client-side handling.  |
| 5 | contains | `ctx.session` — Session context access           | The session must flow through tRPC context, not be fetched inside each procedure independently.      |

### What a passing response looks like

- A `projectRouter` with five procedures (list, getById, create, update, delete).
- Zod schemas for inputs with proper field types (string, number, optional).
- `publicProcedure` for read operations, `protectedProcedure` for writes.
- Prisma queries using `findMany` with pagination, `findUnique`, `create`, `update`, `delete`.
- `TRPCError` thrown for not-found and unauthorized cases with descriptive messages.
- `ctx.session.user.id` used to scope queries to the authenticated user.

---

## Eval 2: NextAuth Session with tRPC Context

This eval tests the authentication integration layer: NextAuth.js configuration wired into the tRPC context.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `PrismaAdapter` — Database-backed auth          | Persisting auth state in the database (not just JWTs) enables account linking and session management.|
| 2 | contains | `GoogleProvider` — OAuth provider setup          | The eval specifically requests Google OAuth. Must configure with env vars, not hardcoded secrets.    |
| 3 | contains | `getServerSession` — Server-side session fetch   | tRPC context must fetch the session server-side for security and performance.                        |
| 4 | contains | `callbacks` — Session/JWT callbacks              | Without callbacks, the session object lacks the user ID needed by tRPC procedures.                   |
| 5 | contains | `NEXTAUTH_SECRET` — Secure secret reference      | Hardcoded secrets are a critical vulnerability. Must reference environment variables.                 |

### What a passing response looks like

- An `authOptions` object with `PrismaAdapter`, Google and GitHub providers, and session/JWT callbacks.
- A `createTRPCContext` function that calls `getServerSession(authOptions)` and passes the session to context.
- A `protectedProcedure` middleware that checks `ctx.session` and throws `UNAUTHORIZED` if missing.
- A sample procedure that accesses `ctx.session.user.id` to return the user profile from Prisma.
- Environment variable references for `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`.
