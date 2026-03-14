# Example 01: User Profile with use() Hook and Suspense

## Scenario

Build a React 19 user profile component that reads a data promise with the `use()` hook, wrapped in Suspense for loading states and an Error Boundary for failure handling.

## Prompt

> Create a React 19 UserProfile component that receives a user data promise as a prop, reads it with the use() hook, and displays name, email, and avatar. Wrap it in Suspense with a skeleton fallback and an ErrorBoundary. Type all props with TypeScript.

## Expected Output

### `types.ts`

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}
```

### `user-profile.tsx`

```tsx
'use client';

import { use } from 'react';
import type { User } from './types';

interface UserProfileProps {
  userPromise: Promise<User>;
}

export function UserProfile({ userPromise }: UserProfileProps) {
  const user = use(userPromise);

  return (
    <div className="flex items-center gap-4 p-6 rounded-lg border">
      <img
        src={user.avatarUrl}
        alt={`${user.name}'s avatar`}
        className="w-16 h-16 rounded-full"
      />
      <div>
        <h2 className="text-xl font-semibold">{user.name}</h2>
        <p className="text-gray-500">{user.email}</p>
      </div>
    </div>
  );
}
```

### `user-profile-skeleton.tsx`

```tsx
export function UserProfileSkeleton() {
  return (
    <div className="flex items-center gap-4 p-6 rounded-lg border animate-pulse">
      <div className="w-16 h-16 rounded-full bg-gray-200" />
      <div className="space-y-2">
        <div className="h-5 w-32 bg-gray-200 rounded" />
        <div className="h-4 w-48 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
```

### `error-boundary.tsx`

```tsx
'use client';

import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  fallback: (error: Error, retry: () => void) => ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  retry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return this.props.fallback(this.state.error, this.retry);
    }
    return this.props.children;
  }
}
```

### `user-page.tsx`

```tsx
import { Suspense } from 'react';
import { UserProfile } from './user-profile';
import { UserProfileSkeleton } from './user-profile-skeleton';
import { ErrorBoundary } from './error-boundary';

async function fetchUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error('Failed to load user profile');
  return res.json();
}

export function UserPage({ userId }: { userId: string }) {
  // Create the promise at the parent level -- do NOT await it
  const userPromise = fetchUser(userId);

  return (
    <ErrorBoundary
      fallback={(error, retry) => (
        <div className="p-6 border border-red-200 rounded-lg text-center">
          <p className="text-red-600">{error.message}</p>
          <button
            onClick={retry}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
          >
            Retry
          </button>
        </div>
      )}
    >
      <Suspense fallback={<UserProfileSkeleton />}>
        <UserProfile userPromise={userPromise} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

## Key Patterns Demonstrated

1. **`use()` for promise reading** -- The `UserProfile` component calls `use(userPromise)` to synchronously read the resolved value. React suspends rendering until the promise settles, eliminating the need for `useEffect` + `useState` loading patterns.

2. **Promise creation at the parent** -- The promise is created in `UserPage` (the parent) and passed as a prop. This starts the fetch immediately rather than waiting for the child to mount, avoiding request waterfalls.

3. **Suspense boundary with skeleton** -- `<Suspense fallback={<UserProfileSkeleton />}>` defines the loading UI. The skeleton renders during fetch and is replaced when data arrives.

4. **Error Boundary with retry** -- The class-based Error Boundary catches rejected promises from `use()`. The retry callback resets the error state, allowing the user to re-attempt the fetch.

5. **TypeScript interfaces throughout** -- `User`, `UserProfileProps`, `ErrorBoundaryProps`, and `ErrorBoundaryState` are all explicitly typed, providing compile-time safety and self-documenting component APIs.
