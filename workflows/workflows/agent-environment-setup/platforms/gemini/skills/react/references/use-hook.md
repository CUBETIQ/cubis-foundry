# React 19 use() Hook Reference

## Overview

The `use()` hook is a new React 19 API that reads the value of a resource -- either a Promise or a Context. Unlike other hooks, `use()` can be called conditionally and inside loops. It integrates with Suspense for loading states and Error Boundaries for error handling.

## Reading Promises

### Basic Usage

```tsx
'use client';

import { use } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise); // Suspends until the promise resolves

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

### Suspense Integration

`use()` suspends the component tree to the nearest `<Suspense>` boundary while the promise is pending.

```tsx
import { Suspense } from 'react';

function UserPage({ userId }: { userId: string }) {
  const userPromise = fetchUser(userId); // Create the promise here

  return (
    <Suspense fallback={<UserSkeleton />}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}
```

**Key rule**: Create the promise in the parent and pass it down. Do NOT create the promise inside the component that calls `use()`, or you will create a new promise on every render, causing an infinite suspend loop.

### Error Handling

Rejected promises throw to the nearest Error Boundary.

```tsx
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  const dataPromise = fetchData();

  return (
    <ErrorBoundary fallback={<ErrorMessage />}>
      <Suspense fallback={<Loading />}>
        <DataDisplay dataPromise={dataPromise} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

## Reading Context

`use()` can read Context values, replacing `useContext()`. The advantage is that `use()` can be called conditionally.

```tsx
import { use, createContext } from 'react';

const ThemeContext = createContext<'light' | 'dark'>('light');

function ThemedButton({ overrideTheme }: { overrideTheme?: 'light' | 'dark' }) {
  // Conditional context reading -- not possible with useContext
  const theme = overrideTheme ?? use(ThemeContext);

  return (
    <button className={theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'}>
      Click me
    </button>
  );
}
```

## Conditional Calls

Unlike other hooks, `use()` can be called inside conditionals and loops.

```tsx
function Dashboard({ isAdmin, statsPromise }: {
  isAdmin: boolean;
  statsPromise: Promise<Stats>;
}) {
  if (isAdmin) {
    const stats = use(statsPromise); // Only reads the promise for admins
    return <AdminDashboard stats={stats} />;
  }

  return <UserDashboard />;
}
```

## Patterns

### Multiple Promises

```tsx
function OrderDetails({
  orderPromise,
  customerPromise,
}: {
  orderPromise: Promise<Order>;
  customerPromise: Promise<Customer>;
}) {
  const order = use(orderPromise);
  const customer = use(customerPromise);

  return (
    <div>
      <h2>Order #{order.id}</h2>
      <p>Customer: {customer.name}</p>
    </div>
  );
}

// Parent starts both fetches in parallel
function OrderPage({ orderId }: { orderId: string }) {
  const orderPromise = fetchOrder(orderId);
  const customerPromise = fetchCustomer(orderId);

  return (
    <Suspense fallback={<OrderSkeleton />}>
      <OrderDetails
        orderPromise={orderPromise}
        customerPromise={customerPromise}
      />
    </Suspense>
  );
}
```

### Nested Suspense for Progressive Loading

```tsx
function ProductPage({ id }: { id: string }) {
  const productPromise = fetchProduct(id);
  const reviewsPromise = fetchReviews(id);

  return (
    <div>
      <Suspense fallback={<ProductSkeleton />}>
        <ProductInfo productPromise={productPromise} />
      </Suspense>

      {/* Reviews can load independently, after the product info */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews reviewsPromise={reviewsPromise} />
      </Suspense>
    </div>
  );
}
```

## use() vs. useEffect + useState

| `use()` | `useEffect + useState` |
|---------|----------------------|
| Declarative -- reads a promise | Imperative -- manages loading/error/data state |
| Integrates with Suspense automatically | Requires manual loading state |
| Can be called conditionally | Cannot be called conditionally |
| Works with Server Components (promise creation) | Client-only |
| Zero boilerplate for loading/error UI | 5-10 lines of state management boilerplate |

## Rules

1. **Create promises in the parent** -- Never create a promise in the same component that `use()`s it
2. **Stable promise references** -- The promise must be the same reference across renders; wrap in `useMemo` if created in a Client Component
3. **Always wrap in Suspense** -- Without it, the suspend propagates to the root or crashes
4. **Always have an Error Boundary** -- Rejected promises throw; an Error Boundary catches and displays the error
5. **`use()` can be called conditionally** -- This is intentional and unlike all other hooks

## Common Pitfalls

1. **Creating the promise inside the component** -- Causes a new promise on every render, leading to infinite suspense
2. **Missing Suspense boundary** -- The component suspends to the root, unmounting the entire app
3. **Missing Error Boundary** -- A rejected promise crashes the component tree
4. **Unstable promise reference** -- Creating a new promise in a parent's render without memoization causes repeated suspense
