# Edge Deployment

Load this when deploying Prisma to edge runtimes, configuring Prisma Accelerate, using driver adapters, or managing serverless connection pooling.

## The Edge Runtime Problem

Prisma's query engine is a Rust binary compiled for specific OS/architecture targets. Edge runtimes (Cloudflare Workers, Vercel Edge Functions, Deno Deploy) run JavaScript in V8 isolates without filesystem access or the ability to execute native binaries. The Prisma query engine cannot run in these environments.

## Solution 1: Prisma Accelerate

Prisma Accelerate is a managed service that runs the query engine in a cloud proxy. The edge client sends queries over HTTPS to Accelerate, which executes them against your database.

### Setup

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")         // prisma://accelerate.prisma-data.net/?api_key=...
  directUrl = env("DIRECT_DATABASE_URL")  // postgresql://user:pass@host:5432/db
}
```

- `url` points to Prisma Accelerate for runtime queries.
- `directUrl` points to the actual database for `prisma migrate` and `prisma db push`.

### Client Initialization

```typescript
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());
```

### Accelerate Caching

Accelerate provides a global cache that sits between the edge client and the database.

```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  cacheStrategy: {
    ttl: 60,     // Cache for 60 seconds
    swr: 300,    // Serve stale for 300 seconds while revalidating
  },
});
```

- `ttl`: Time-to-live in seconds. Cached results are returned without hitting the database.
- `swr`: Stale-while-revalidate. After TTL expires, serve stale data while revalidating in the background.
- Omit `cacheStrategy` for queries that must always hit the database (writes, real-time data).

## Solution 2: Driver Adapters

Driver adapters replace the Rust query engine with a JavaScript-native database driver. Available since Prisma 5, stable in Prisma 6.

### Supported Adapters

| Adapter | Database | Edge Runtime |
| --- | --- | --- |
| `@prisma/adapter-neon` | Neon Postgres | Cloudflare Workers, Vercel Edge |
| `@prisma/adapter-planetscale` | PlanetScale MySQL | Cloudflare Workers, Vercel Edge |
| `@prisma/adapter-d1` | Cloudflare D1 (SQLite) | Cloudflare Workers |
| `@prisma/adapter-libsql` | Turso (libSQL) | Any edge runtime |

### Neon Adapter Example

```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });
```

```prisma
// schema.prisma — no engine needed with driver adapters
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}
```

## Connection Pooling

### The Serverless Connection Problem

Serverless functions spin up many instances. Each instance creates its own database connection. Without pooling, a traffic spike can exhaust the database's connection limit (typically 100-300 for managed Postgres).

### Connection Pool Configuration

```
# Connection URL with pool parameters
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=5&pool_timeout=10"
```

| Parameter | Default | Description |
| --- | --- | --- |
| `connection_limit` | Varies by provider | Maximum connections per Prisma Client instance |
| `pool_timeout` | 10s | How long to wait for a connection from the pool |
| `connect_timeout` | 5s | How long to wait to establish a new connection |

### Pooling Recommendations by Platform

| Platform | Recommended Pool | connection_limit |
| --- | --- | --- |
| Traditional server | Prisma built-in | 10-20 |
| Serverless (Vercel, AWS Lambda) | Prisma Accelerate or PgBouncer | 2-5 per instance |
| Edge runtime | Prisma Accelerate | N/A (managed) |
| Cloudflare Workers | Hyperdrive + driver adapter | Managed by Hyperdrive |

### Singleton Pattern for Serverless

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

In serverless, module-level variables persist across warm invocations. The singleton prevents creating a new PrismaClient (and opening new connections) on every warm request. The `globalForPrisma` pattern avoids Next.js HMR creating multiple clients in development.

## Deployment Checklist

1. **Set `DATABASE_URL` to the pooled/proxy URL** for runtime queries.
2. **Set `DIRECT_DATABASE_URL` to the direct database URL** for migrations.
3. **Run `prisma generate` in the build step** to create the client.
4. **Run `prisma migrate deploy` before the application starts** to apply pending migrations.
5. **Set `connection_limit` appropriate for the platform** (2-5 for serverless, 10-20 for servers).
6. **Enable query logging in staging** to detect N+1 queries before they reach production.
7. **Test with production-like data volumes** because edge latency and connection limits behave differently under load.
