# Auth Strategies

Load this when configuring NextAuth.js/Auth.js providers, callbacks, session strategies, or wiring authentication into the tRPC context in a T3 Stack application.

## NextAuth.js configuration

```typescript
// src/server/auth.ts
import { PrismaAdapter } from "@auth/prisma-adapter";
import { type GetServerSidePropsContext } from "next";
import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "~/server/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: { ...session.user, id: user.id, role: user.role },
    }),
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => getServerSession(ctx.req, ctx.res, authOptions);
```

- Always use `PrismaAdapter` to persist accounts, sessions, and verification tokens in the database.
- Reference environment variables for all secrets — never hardcode OAuth credentials.
- Extend the session callback to include `user.id` and any custom fields (role, tenantId) that downstream code needs.

## Session strategies

### Database sessions (default with adapter)

- Sessions stored in the `Session` table via Prisma.
- Best for: applications that need server-side session revocation.
- Session lookup hits the database on every request.
- The `session` callback receives `user` (the database row), not `token`.

### JWT sessions

```typescript
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: { ...session.user, id: token.id as string, role: token.role as string },
    }),
  },
};
```

- Best for: serverless deployments where database connection overhead is a concern.
- The `jwt` callback fires on sign-in and every session check. Attach user data there.
- The `session` callback receives `token` (not `user`) when using JWT strategy.
- Combine with database adapter: OAuth accounts are still persisted, but session state lives in the JWT.

## Wiring auth into tRPC context

```typescript
// src/server/api/trpc.ts
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await getServerSession(authOptions);
  return { db, session, ...opts };
};
```

- The session is fetched once during context creation and shared across all procedures in a single request.
- Never call `getServerSession` inside individual procedures — it wastes database lookups.
- The context type is inferred by tRPC, so `ctx.session` is automatically typed.

## Protecting procedures

```typescript
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: { session: { ...ctx.session, user: ctx.session.user } },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
```

- The middleware narrows `ctx.session.user` from `User | undefined` to `User`.
- Downstream procedures access `ctx.session.user.id` without null checks.
- Stack additional middleware for role-based access (admin, owner, member).

## Prisma schema for auth

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  role          String    @default("member")
  accounts      Account[]
  sessions      Session[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}
```

- These models are required by `PrismaAdapter`. Field names must match exactly.
- Add custom fields (like `role`) to the `User` model and expose them through callbacks.
- `onDelete: Cascade` on Account and Session ensures cleanup when a user is deleted.

## Auth.js v5 migration notes

Auth.js v5 (the successor to NextAuth.js v4) changes the API surface:

- Import from `@auth/core` and `@auth/nextjs` instead of `next-auth`.
- Configuration uses `NextAuth()` function returning `{ handlers, auth, signIn, signOut }`.
- Middleware-based route protection replaces `getServerSession` in many patterns.
- The Prisma adapter import changes to `@auth/prisma-adapter`.

If the project uses Auth.js v5, confirm the import paths before generating code. The configuration shape differs significantly from v4.

## Common pitfalls

- **Missing NEXTAUTH_URL in production**: NextAuth uses this to construct callback URLs. Omitting it causes OAuth redirect failures.
- **Forgetting to extend session type**: TypeScript will not know about `session.user.id` unless you augment the `Session` type in `next-auth.d.ts`.
- **Using `useSession` in server components**: `useSession` is a client hook. Use `getServerSession` on the server.
- **Not handling the `signIn` callback for new users**: If you need to run custom logic on first sign-in (like creating a default workspace), use the `signIn` event or callback.
