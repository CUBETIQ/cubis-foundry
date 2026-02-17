# Data Fetching Patterns

## Fetch in Server Components

Server Components can fetch data directly without an API layer:

```tsx
// Direct database access
async function ProductList() {
  const products = await db.product.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return (
    <ul>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </ul>
  );
}

// External API
async function WeatherWidget({ city }: { city: string }) {
  const res = await fetch(`https://api.weather.com/v1/${city}`);
  if (!res.ok) throw new Error("Failed to fetch weather");
  const data = await res.json();
  return <div>{data.temperature}°C</div>;
}
```

## Caching Strategies

### Static Data (cached indefinitely)

```tsx
// Default behavior — cached at build time
const data = await fetch("https://api.example.com/data");

// Equivalent explicit form
const data = await fetch("https://api.example.com/data", {
  cache: "force-cache",
});
```

### Time-Based Revalidation (ISR)

```tsx
// Revalidate every 60 seconds
const data = await fetch("https://api.example.com/data", {
  next: { revalidate: 60 },
});

// Page-level revalidation
export const revalidate = 60; // seconds
```

### Dynamic Data (no cache)

```tsx
// Always fetch fresh
const data = await fetch("https://api.example.com/data", {
  cache: "no-store",
});

// Page-level dynamic
export const dynamic = "force-dynamic";
```

### Tag-Based Revalidation

```tsx
// Tag a fetch
const posts = await fetch('https://api.example.com/posts', {
  next: { tags: ['posts'] },
});

// Revalidate by tag (in a Server Action)
'use server';
import { revalidateTag } from 'next/cache';

export async function createPost() {
  await db.post.create({ ... });
  revalidateTag('posts'); // All fetches tagged 'posts' refetch
}
```

## Parallel vs Sequential Fetching

### Parallel (preferred)

```tsx
async function Dashboard() {
  // Both requests start simultaneously
  const [revenue, orders, customers] = await Promise.all([
    getRevenue(),
    getRecentOrders(),
    getCustomerCount(),
  ]);

  return (
    <div>
      <RevenueChart data={revenue} />
      <OrderList orders={orders} />
      <CustomerCount count={customers} />
    </div>
  );
}
```

### Sequential (when dependent)

```tsx
async function UserPosts({ userId }: { userId: string }) {
  // Must get user first to know their preferences
  const user = await getUser(userId);
  // Then fetch posts based on user preferences
  const posts = await getPosts({ category: user.preferredCategory });

  return <PostList posts={posts} />;
}
```

### Streaming with Suspense (best of both)

```tsx
import { Suspense } from "react";

export default function Dashboard() {
  return (
    <div>
      {/* Each section loads independently */}
      <Suspense fallback={<Skeleton />}>
        <Revenue />
      </Suspense>
      <Suspense fallback={<Skeleton />}>
        <RecentOrders />
      </Suspense>
      <Suspense fallback={<Skeleton />}>
        <TopProducts />
      </Suspense>
    </div>
  );
}
```

## Client-Side Fetching

### SWR

```tsx
"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function LivePrice({ productId }: { productId: string }) {
  const { data, error, isLoading } = useSWR(
    `/api/products/${productId}/price`,
    fetcher,
    { refreshInterval: 5000 }, // Poll every 5s
  );

  if (isLoading) return <PriceSkeleton />;
  if (error) return <span>Error loading price</span>;
  return <span>${data.price}</span>;
}
```

### React Query (TanStack Query)

```tsx
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function TodoList() {
  const queryClient = useQueryClient();

  const { data: todos, isLoading } = useQuery({
    queryKey: ["todos"],
    queryFn: () => fetch("/api/todos").then((r) => r.json()),
  });

  const mutation = useMutation({
    mutationFn: (newTodo: string) =>
      fetch("/api/todos", {
        method: "POST",
        body: JSON.stringify({ title: newTodo }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  if (isLoading) return <Loading />;
  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}
```

## When to Use What

| Scenario                       | Approach                                            |
| ------------------------------ | --------------------------------------------------- |
| Static content (blog, docs)    | Server Component + `force-cache`                    |
| Semi-static (product catalog)  | Server Component + `revalidate: 60`                 |
| User-specific data             | Server Component + `no-store` + auth check          |
| Real-time updates              | Client Component + SWR/React Query with polling     |
| Infinite scroll                | Client Component + React Query `useInfiniteQuery`   |
| Form submission result         | Server Action + `revalidatePath`/`revalidateTag`    |
| Dashboard with mixed freshness | Suspense boundaries with different cache strategies |

## Error Handling

```tsx
// error.tsx — automatic error boundary
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## Request Deduplication

Next.js automatically deduplicates `fetch` requests with the same URL and options during a single render pass:

```tsx
// Both components fetch the same URL — only ONE request is made
async function Header() {
  const user = await fetch("/api/user"); // Request 1
  return <nav>{user.name}</nav>;
}

async function Sidebar() {
  const user = await fetch("/api/user"); // Deduped — reuses Request 1
  return <aside>{user.avatar}</aside>;
}
```

For non-fetch data sources, use React `cache()`:

```tsx
import { cache } from "react";

export const getUser = cache(async (id: string) => {
  return await db.user.findUnique({ where: { id } });
});
```
