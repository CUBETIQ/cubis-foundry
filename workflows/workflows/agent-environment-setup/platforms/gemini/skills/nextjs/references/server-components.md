# Next.js 15 Server Components Reference

## Overview

React Server Components (RSC) in Next.js 15 run exclusively on the server, producing HTML and a serialized component tree without shipping JavaScript to the client. They are the default in the App Router -- every component is a Server Component unless marked with `'use client'`.

## Server Component Fundamentals

### Async Components

Server Components can be `async` functions that directly `await` data.

```tsx
// app/dashboard/page.tsx -- Server Component by default
import { db } from '@/lib/db';

export default async function DashboardPage() {
  const stats = await db.analytics.getStats();
  const recentOrders = await db.orders.findRecent(10);

  return (
    <main>
      <StatsGrid stats={stats} />
      <OrderTable orders={recentOrders} />
    </main>
  );
}
```

### What Server Components Can Do

- Access the filesystem, databases, and internal APIs directly
- Use `async`/`await` at the component level
- Import server-only modules (Node.js APIs, ORMs, secret keys)
- Reduce client bundle size to zero for static UI

### What Server Components Cannot Do

- Use React hooks (`useState`, `useEffect`, `useRef`, etc.)
- Use browser APIs (`window`, `document`, `localStorage`)
- Add event handlers (`onClick`, `onChange`, etc.)
- Use Context providers or consumers

## Client/Server Boundary

### Marking Client Components

```tsx
'use client'; // This directive creates the boundary

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>;
}
```

### Boundary Rules

1. `'use client'` marks the entry point -- all modules imported by a Client Component are also client modules
2. Server Components can import and render Client Components
3. Client Components cannot import Server Components directly
4. Client Components can receive Server Components as `children` or other JSX props

### Passing Server Components to Client Components

```tsx
// layout.tsx (Server Component)
import { Sidebar } from './sidebar'; // Client Component
import { Navigation } from './navigation'; // Server Component

export default function Layout({ children }) {
  return (
    <Sidebar nav={<Navigation />}> {/* Server Component passed as prop */}
      {children}
    </Sidebar>
  );
}
```

```tsx
// sidebar.tsx
'use client';

export function Sidebar({ nav, children }: { nav: React.ReactNode; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="flex">
      <aside className={isOpen ? 'w-64' : 'w-0'}>
        {nav} {/* Rendered Server Component -- no client JS for this */}
      </aside>
      <main>{children}</main>
    </div>
  );
}
```

## Serialization Rules

Data passed from Server to Client Components must be serializable:

| Allowed | Not Allowed |
|---------|-------------|
| Strings, numbers, booleans | Functions (except Server Actions) |
| Arrays, plain objects | Class instances |
| `Date` objects | Symbols |
| `Map`, `Set` | DOM nodes |
| `FormData` | Streams |
| Server Action references | Closures |

## Request Deduplication

Next.js automatically deduplicates `fetch` calls with the same URL and options within a single render pass.

```tsx
// Both components fetch the same URL -- only one network request is made
async function Header() {
  const user = await fetch('/api/user').then(r => r.json());
  return <h1>Welcome, {user.name}</h1>;
}

async function Sidebar() {
  const user = await fetch('/api/user').then(r => r.json());
  return <nav>{user.role === 'admin' && <AdminLinks />}</nav>;
}
```

For non-fetch data sources (ORMs, SDKs), use React's `cache()`:

```tsx
import { cache } from 'react';
import { db } from '@/lib/db';

export const getUser = cache(async (id: string) => {
  return db.users.findById(id);
});
```

## The `server-only` Package

Prevent server code from accidentally being imported in Client Components:

```typescript
// lib/db.ts
import 'server-only';
import { PrismaClient } from '@prisma/client';

export const db = new PrismaClient();
```

If a Client Component imports this file, the build fails with a clear error instead of leaking secrets.

## Common Patterns

### Data Fetching Waterfall Prevention

```tsx
// Bad: Sequential fetches
async function Page() {
  const user = await getUser();     // 200ms
  const posts = await getPosts();   // 300ms -- waits for user
  // Total: 500ms
}

// Good: Parallel fetches
async function Page() {
  const [user, posts] = await Promise.all([
    getUser(),   // 200ms
    getPosts(),  // 300ms -- runs in parallel
  ]);
  // Total: 300ms
}
```

### Streaming with Suspense

```tsx
import { Suspense } from 'react';

export default function DashboardPage() {
  return (
    <main>
      <h1>Dashboard</h1>
      {/* Shell renders immediately */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsPanel /> {/* Streams in when data is ready */}
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <RecentOrders /> {/* Streams independently */}
      </Suspense>
    </main>
  );
}
```

## Common Pitfalls

1. **Importing a hook in a Server Component** -- Causes a build error; move the hook usage to a Client Component
2. **Passing non-serializable props** -- Functions, class instances, and closures cannot cross the server/client boundary
3. **Over-using `'use client'`** -- Pushes more code to the client; keep the boundary as low in the tree as possible
4. **Forgetting `server-only`** -- Without it, database clients and secrets silently leak into the client bundle
