# React 19 Concurrent Features Reference

## Overview

Concurrent features allow React to prepare new UI in the background without blocking user interaction. React 19 builds on the concurrent rendering foundation with `useTransition`, `useDeferredValue`, Suspense for streaming, and selective hydration.

## useTransition

Marks a state update as non-urgent, allowing React to keep the UI responsive while processing expensive re-renders.

### Basic Usage

```tsx
'use client';

import { useState, useTransition } from 'react';

export function TabContainer() {
  const [tab, setTab] = useState('home');
  const [isPending, startTransition] = useTransition();

  function handleTabChange(nextTab: string) {
    startTransition(() => {
      setTab(nextTab); // Non-urgent -- React can interrupt this
    });
  }

  return (
    <div>
      <nav>
        {['home', 'posts', 'settings'].map(t => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={tab === t ? 'font-bold' : ''}
          >
            {t}
          </button>
        ))}
      </nav>

      {isPending && <div className="opacity-50">Loading...</div>}

      <TabContent tab={tab} />
    </div>
  );
}
```

### With Async Functions (React 19)

In React 19, `startTransition` accepts async functions:

```tsx
const [isPending, startTransition] = useTransition();

function handleSubmit() {
  startTransition(async () => {
    const result = await saveData(formData);
    setData(result); // State update after async work
  });
}
```

### When to Use

- Tab switches that render expensive content
- Navigation between views with heavy component trees
- Search results that re-render a large list
- Any update that should not block typing or clicking

## useDeferredValue

Defers a value to allow urgent updates (like typing) to render first.

```tsx
'use client';

import { useState, useDeferredValue } from 'react';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />

      <div className={isStale ? 'opacity-50' : ''}>
        <SearchResults query={deferredQuery} />
      </div>
    </div>
  );
}
```

### How It Works

1. User types "abc" -- `query` updates immediately on each keystroke
2. React renders the input with the new value (urgent update)
3. React defers `deferredQuery` -- starts re-rendering `SearchResults` in the background
4. If the user types another character before the deferred render completes, React abandons the stale render
5. `isStale` (`query !== deferredQuery`) can drive a visual indicator

### useDeferredValue vs. Debouncing

| useDeferredValue | Debouncing |
|-----------------|-----------|
| Interrupts rendering when new input arrives | Waits a fixed time regardless of device speed |
| Adapts to device performance | Same delay on fast and slow devices |
| Shows stale content with visual indicator | Shows nothing during the delay |
| No artificial delay | Fixed delay (200-500ms typical) |

## Suspense

### Data Fetching with Suspense

```tsx
import { Suspense } from 'react';

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Header />
      <Suspense fallback={<ContentSkeleton />}>
        <MainContent />
      </Suspense>
      <Suspense fallback={<SidebarSkeleton />}>
        <Sidebar />
      </Suspense>
    </Suspense>
  );
}
```

### Suspense Boundaries Design

Place Suspense boundaries at meaningful UI sections, not around every component:

```tsx
// Good: meaningful loading zones
<Suspense fallback={<DashboardSkeleton />}>
  <DashboardHeader />
  <DashboardStats />
</Suspense>
<Suspense fallback={<TableSkeleton />}>
  <DataTable />
</Suspense>

// Bad: too granular, visual thrashing
<Suspense fallback={<HeaderSkeleton />}>
  <DashboardHeader />
</Suspense>
<Suspense fallback={<StatsSkeleton />}>
  <DashboardStats />
</Suspense>
```

### Nested Suspense

Inner boundaries catch suspense before outer boundaries. This allows progressive disclosure:

```tsx
<Suspense fallback={<AppShell />}>
  <Layout>
    <Suspense fallback={<ContentSkeleton />}>
      <Content />
    </Suspense>
  </Layout>
</Suspense>
```

1. `<AppShell />` shows immediately
2. `<Layout>` renders when ready, replacing `<AppShell />`
3. `<ContentSkeleton />` shows inside the layout while content loads
4. `<Content />` streams in when its data resolves

## Selective Hydration

With Suspense and streaming SSR, React hydrates components in priority order:

1. Components the user is interacting with are hydrated first
2. Components in the viewport are hydrated next
3. Off-screen components are hydrated last

No configuration is needed -- wrapping in `<Suspense>` enables selective hydration automatically.

## Streaming SSR

In a framework like Next.js, Suspense enables streaming:

1. The server renders the shell (everything outside Suspense boundaries)
2. HTML is sent to the browser immediately
3. Each Suspense boundary streams its content as data resolves
4. The browser hydrates each chunk independently

```tsx
// The server sends the shell immediately
export default function Page() {
  return (
    <div>
      <h1>Dashboard</h1> {/* Sent immediately */}

      <Suspense fallback={<StatsSkeleton />}>
        <Stats /> {/* Streams when DB query completes */}
      </Suspense>

      <Suspense fallback={<ChartSkeleton />}>
        <Chart /> {/* Streams independently */}
      </Suspense>
    </div>
  );
}
```

## Transition vs. Deferred Value Decision Guide

| Use Case | Recommended |
|----------|------------|
| Tab switching | `useTransition` |
| Search input filtering | `useDeferredValue` |
| Form submission with loading | `useTransition` (async) |
| Filtering a large list as user types | `useDeferredValue` |
| Navigation between pages | `useTransition` |
| Debouncing a computed value | `useDeferredValue` |

## Common Pitfalls

1. **Wrapping urgent updates in transitions** -- Typing in an input should always be urgent; only wrap the downstream effect (list re-render) in a transition
2. **Too many Suspense boundaries** -- Creates a "popcorn" loading effect; group related content in a single boundary
3. **Not showing a stale indicator** -- When using `useDeferredValue`, show visual feedback (opacity, spinner) that the displayed content is stale
4. **Using transitions for animations** -- `useTransition` is for rendering priority, not CSS animations
5. **Suspending at the root** -- Without a Suspense boundary, the entire app unmounts; always provide boundaries
