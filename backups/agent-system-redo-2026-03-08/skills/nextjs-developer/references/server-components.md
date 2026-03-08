# Server Components & Client Components

## Component Types Decision Tree

```
Does the component need...
  Browser APIs (window, document)?     → Client Component
  Event handlers (onClick, onChange)?   → Client Component
  React hooks (useState, useEffect)?   → Client Component
  None of the above?                   → Server Component (default)
```

## Server Components (Default)

Server Components run only on the server. They can:

- Fetch data directly (no API layer needed)
- Access backend resources (DB, filesystem)
- Keep sensitive data on server (tokens, keys)
- Reduce client bundle size

```tsx
// No directive needed — server by default
import { db } from "@/lib/db";

async function ProductList() {
  const products = await db.product.findMany();

  return (
    <ul>
      {products.map((product) => (
        <li key={product.id}>
          <h2>{product.name}</h2>
          <p>${product.price}</p>
          <AddToCartButton productId={product.id} /> {/* Client Component */}
        </li>
      ))}
    </ul>
  );
}
```

### Server Component Rules

- Cannot use hooks (`useState`, `useEffect`, etc.)
- Cannot use browser APIs
- Cannot use event handlers
- Cannot use Context providers (but can pass data to Client Components)
- CAN import and render Client Components
- CAN pass serializable props to Client Components

## Client Components

```tsx
"use client"; // Must be at the top of the file

import { useState, useTransition } from "react";

export function AddToCartButton({ productId }: { productId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    startTransition(async () => {
      await addToCart(productId);
    });
  };

  return (
    <button onClick={handleAdd} disabled={isPending}>
      {isPending ? "Adding..." : "Add to Cart"}
    </button>
  );
}
```

### Client Component Rules

- `'use client'` marks the boundary — all imports become client
- Keep `'use client'` as deep in the tree as possible (leaf components)
- Can render Server Components passed as `children` or props
- Cannot `import` a Server Component directly

## Composition Patterns

### Pattern: Server wrapper, Client leaf

```tsx
// Server Component — fetches data
async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      {/* Client Component only where interactivity is needed */}
      <PriceSelector variants={product.variants} />
      <AddToCartButton productId={product.id} />
    </div>
  );
}
```

### Pattern: Passing Server Components as children

```tsx
// Client Component
"use client";
export function Sidebar({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  return isOpen ? <aside>{children}</aside> : null;
}

// Server Component — passes server content through client
export default function Layout({ children }) {
  return (
    <Sidebar>
      <NavLinks /> {/* This is a Server Component rendered inside Client */}
    </Sidebar>
  );
}
```

### Pattern: Context with Server Components

```tsx
// providers.tsx — Client Component
"use client";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

// layout.tsx — Server Component
import { Providers } from "./providers";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## Streaming SSR & Suspense

### Loading UI with Suspense

```tsx
import { Suspense } from "react";

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      {/* Each section streams independently */}
      <Suspense fallback={<RevenueChartSkeleton />}>
        <RevenueChart />
      </Suspense>
      <Suspense fallback={<RecentOrdersSkeleton />}>
        <RecentOrders />
      </Suspense>
    </div>
  );
}
```

### Streaming with loading.tsx

```tsx
// app/dashboard/loading.tsx
// Automatically wraps page.tsx in Suspense
export default function Loading() {
  return <DashboardSkeleton />;
}
```

### Parallel Data Fetching

```tsx
// Fetch in parallel, not sequentially
async function Dashboard() {
  // ✅ Parallel — both start immediately
  const [revenue, orders] = await Promise.all([
    getRevenue(),
    getRecentOrders(),
  ]);

  return (
    <div>
      <RevenueChart data={revenue} />
      <OrderList orders={orders} />
    </div>
  );
}
```

## Partial Prerendering (PPR)

PPR combines static and dynamic content in a single route:

```tsx
// next.config.js
module.exports = {
  experimental: { ppr: true },
};

// Static shell renders immediately, dynamic parts stream in
export default function ProductPage({ params }) {
  return (
    <div>
      {/* Static — rendered at build time */}
      <ProductHeader />
      <ProductDescription />

      {/* Dynamic — streams in */}
      <Suspense fallback={<PriceSkeleton />}>
        <DynamicPrice productId={params.id} />
      </Suspense>
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews productId={params.id} />
      </Suspense>
    </div>
  );
}
```

## Common Mistakes

```tsx
// ❌ Don't import server-only code in client components
"use client";
import { db } from "@/lib/db"; // This will fail

// ❌ Don't use hooks in server components
async function Page() {
  const [state, setState] = useState(0); // Error
}

// ❌ Don't make everything a client component
("use client"); // Don't put this on layout.tsx or page.tsx unless needed

// ✅ Use 'server-only' package to prevent accidental client imports
import "server-only";
export async function getSecretData() {
  return process.env.SECRET_KEY;
}
```
