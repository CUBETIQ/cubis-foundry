# React 19 Server Components Reference

## Overview

React Server Components (RSC) are components that run exclusively on the server. They produce HTML and a serialized component tree without shipping any JavaScript to the client. RSC requires a framework integration (like Next.js App Router) and is not available in client-only React SPAs.

## The RSC Model

### Server Components (Default)

Every component is a Server Component unless marked with `'use client'`. Server Components can:

- Be `async` functions that `await` data directly
- Access databases, filesystems, and secrets
- Import server-only modules
- Produce zero client-side JavaScript

```tsx
// Server Component -- no directive needed
import { db } from '@/lib/db';

export async function UserList() {
  const users = await db.users.findMany();

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name} ({user.email})</li>
      ))}
    </ul>
  );
}
```

### Client Components

Components that need interactivity, hooks, or browser APIs must be marked with `'use client'`.

```tsx
'use client';

import { useState } from 'react';

export function SearchInput({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState('');

  return (
    <input
      value={query}
      onChange={(e) => {
        setQuery(e.target.value);
        onSearch(e.target.value);
      }}
    />
  );
}
```

## Boundary Rules

### What Crosses the Boundary

Data passed from Server to Client Components must be serializable:

| Serializable | Not Serializable |
|-------------|-----------------|
| Strings, numbers, booleans, null | Functions (except Server Actions) |
| Plain objects, arrays | Class instances |
| Dates, Map, Set | Symbols, undefined |
| FormData, URLSearchParams | DOM nodes |
| Promises (for `use()`) | Closures, WeakMap, WeakRef |
| React elements (JSX) | Streams |
| Server Action references | |

### The Composition Pattern

Client Components cannot import Server Components, but they can receive them as `children` or other React node props.

```tsx
// Server Component (parent)
import { InteractivePanel } from './interactive-panel'; // Client Component
import { DataTable } from './data-table'; // Server Component

export function Dashboard() {
  return (
    <InteractivePanel>
      <DataTable /> {/* Server Component rendered by the server, passed as children */}
    </InteractivePanel>
  );
}
```

```tsx
// interactive-panel.tsx
'use client';

import { useState } from 'react';

export function InteractivePanel({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(true);
  return (
    <div>
      <button onClick={() => setIsExpanded(!isExpanded)}>Toggle</button>
      {isExpanded && children}
    </div>
  );
}
```

## Preventing Server Code Leaks

```typescript
// lib/server/db.ts
import 'server-only'; // Build error if imported in a Client Component

import { PrismaClient } from '@prisma/client';
export const db = new PrismaClient();
```

The `server-only` package is a build-time guard. Without it, server code (including database credentials) could silently end up in the client bundle.

## Async Components and Data Patterns

### Direct Data Access

```tsx
async function ProductPage({ id }: { id: string }) {
  const product = await db.products.findById(id);
  if (!product) return notFound();

  return <ProductDetail product={product} />;
}
```

### Parallel Data Fetching

```tsx
async function DashboardPage() {
  // Start all fetches simultaneously
  const [stats, orders, alerts] = await Promise.all([
    getStats(),
    getRecentOrders(),
    getAlerts(),
  ]);

  return (
    <>
      <StatsGrid stats={stats} />
      <OrderTable orders={orders} />
      <AlertBanner alerts={alerts} />
    </>
  );
}
```

### Streaming Independent Sections

```tsx
import { Suspense } from 'react';

export default function DashboardPage() {
  return (
    <>
      <Suspense fallback={<StatsSkeleton />}>
        <StatsPanel /> {/* Streams when ready */}
      </Suspense>
      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersPanel /> {/* Streams independently */}
      </Suspense>
    </>
  );
}
```

## Common Pitfalls

1. **Using hooks in Server Components** -- `useState`, `useEffect`, `useRef` etc. only work in Client Components
2. **Importing Client Components in Server Components and vice versa** -- Server Components can render Client Components, but Client Components cannot import Server Components
3. **Passing functions as props to Client Components** -- Only Server Action references can cross the boundary, not arbitrary functions
4. **Forgetting `server-only`** -- Without it, importing a database client in a Client Component silently bundles server code
5. **Over-using `'use client'`** -- Place the directive as deep in the tree as possible to maximize the server-rendered portion
