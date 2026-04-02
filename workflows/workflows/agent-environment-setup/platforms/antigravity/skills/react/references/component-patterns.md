# React 19 Component Patterns Reference

## Overview

React 19 simplifies several component patterns: `ref` as a regular prop (no `forwardRef`), improved Error Boundaries, and the React Compiler for automatic memoization. This reference covers composition patterns, ref handling, performance optimization, and error boundaries.

## ref as a Regular Prop

React 19 supports `ref` as a standard prop on function components, eliminating the need for `forwardRef`.

### Before (React 18)

```tsx
const TextInput = forwardRef<HTMLInputElement, { label: string }>(
  function TextInput({ label }, ref) {
    return (
      <label>
        {label}
        <input ref={ref} />
      </label>
    );
  }
);
```

### After (React 19)

```tsx
function TextInput({ label, ref }: { label: string; ref?: React.Ref<HTMLInputElement> }) {
  return (
    <label>
      {label}
      <input ref={ref} />
    </label>
  );
}
```

### Ref Cleanup Functions

React 19 supports returning a cleanup function from ref callbacks:

```tsx
function VideoPlayer({ src }: { src: string }) {
  return (
    <video
      src={src}
      ref={(node) => {
        if (node) {
          node.play();
          return () => {
            node.pause(); // Cleanup when the element unmounts
          };
        }
      }}
    />
  );
}
```

## Composition Patterns

### Compound Components

```tsx
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = use(TabsContext);
  if (!ctx) throw new Error('Tabs.* must be used within <Tabs>');
  return ctx;
}

function Tabs({ defaultTab, children }: { defaultTab: string; children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext value={{ activeTab, setActiveTab }}>
      <div role="tablist">{children}</div>
    </TabsContext>
  );
}

function Tab({ id, children }: { id: string; children: React.ReactNode }) {
  const { activeTab, setActiveTab } = useTabsContext();
  return (
    <button
      role="tab"
      aria-selected={activeTab === id}
      onClick={() => setActiveTab(id)}
    >
      {children}
    </button>
  );
}

function Panel({ id, children }: { id: string; children: React.ReactNode }) {
  const { activeTab } = useTabsContext();
  if (activeTab !== id) return null;
  return <div role="tabpanel">{children}</div>;
}

// Attach sub-components
Tabs.Tab = Tab;
Tabs.Panel = Panel;
```

Usage:

```tsx
<Tabs defaultTab="profile">
  <Tabs.Tab id="profile">Profile</Tabs.Tab>
  <Tabs.Tab id="settings">Settings</Tabs.Tab>
  <Tabs.Panel id="profile"><ProfileForm /></Tabs.Panel>
  <Tabs.Panel id="settings"><SettingsForm /></Tabs.Panel>
</Tabs>
```

### Render Props (Still Useful)

```tsx
interface DataLoaderProps<T> {
  promise: Promise<T>;
  children: (data: T) => React.ReactNode;
}

function DataLoader<T>({ promise, children }: DataLoaderProps<T>) {
  const data = use(promise);
  return <>{children(data)}</>;
}

// Usage
<Suspense fallback={<Skeleton />}>
  <DataLoader promise={fetchUsers()}>
    {(users) => <UserList users={users} />}
  </DataLoader>
</Suspense>
```

### Polymorphic Components

```tsx
type PolymorphicProps<T extends React.ElementType> = {
  as?: T;
  children: React.ReactNode;
} & React.ComponentPropsWithoutRef<T>;

function Box<T extends React.ElementType = 'div'>({
  as,
  children,
  ...props
}: PolymorphicProps<T>) {
  const Component = as || 'div';
  return <Component {...props}>{children}</Component>;
}

// Usage
<Box as="section" className="container">{content}</Box>
<Box as="article" id="main">{content}</Box>
```

## Error Boundaries

### Class-Based Error Boundary

```tsx
'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  fallback: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, info: ErrorInfo) => void;
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      const { fallback } = this.props;
      if (typeof fallback === 'function') {
        return fallback(this.state.error, this.reset);
      }
      return fallback;
    }
    return this.props.children;
  }
}
```

### Using react-error-boundary (Recommended)

```tsx
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div role="alert">
      <h2>Something went wrong</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => { /* clear cache, refetch, etc. */ }}
      onError={(error, info) => { reportToSentry(error, info); }}
    >
      <Dashboard />
    </ErrorBoundary>
  );
}
```

## Performance Optimization

### React Compiler (Automatic Memoization)

React Compiler (previously React Forget) automatically memoizes components and hooks. When enabled, manual `React.memo`, `useMemo`, and `useCallback` are often unnecessary.

### Manual Memoization (When Needed)

Only optimize after profiling with React DevTools:

```tsx
import { memo, useMemo, useCallback } from 'react';

// Memoize a component when it receives the same props frequently
const ExpensiveList = memo(function ExpensiveList({ items }: { items: Item[] }) {
  return <ul>{items.map(item => <li key={item.id}>{item.name}</li>)}</ul>;
});

// Memoize an expensive computation
function Dashboard({ orders }: { orders: Order[] }) {
  const totalRevenue = useMemo(
    () => orders.reduce((sum, o) => sum + o.total, 0),
    [orders]
  );

  return <h2>Revenue: ${totalRevenue}</h2>;
}

// Memoize a callback passed to a memoized child
function Parent() {
  const handleClick = useCallback((id: string) => {
    // handle click
  }, []);

  return <MemoizedChild onClick={handleClick} />;
}
```

### When NOT to Memoize

- Components that always receive new props (memoization has overhead, no benefit)
- Simple components with minimal rendering cost
- When React Compiler is enabled (it does it for you)
- Components that always re-render due to context changes

## Custom Hooks

### Single Responsibility

```tsx
// Good: focused on one concern
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Good: composes other hooks
function useSearchResults(query: string) {
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!debouncedQuery) return setResults([]);

    setIsLoading(true);
    const controller = new AbortController();

    fetch(`/api/search?q=${debouncedQuery}`, { signal: controller.signal })
      .then(r => r.json())
      .then(setResults)
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [debouncedQuery]);

  return { results, isLoading };
}
```

## Context Performance

### Split Contexts by Update Frequency

```tsx
// Bad: one context for everything (all consumers re-render on any change)
const AppContext = createContext({ user: null, theme: 'light', locale: 'en' });

// Good: separate contexts
const UserContext = createContext<User | null>(null);
const ThemeContext = createContext<'light' | 'dark'>('light');
const LocaleContext = createContext<string>('en');
```

## Common Pitfalls

1. **Using `forwardRef` in new React 19 code** -- Just accept `ref` as a prop
2. **Memoizing without profiling** -- Adds complexity with no measurable benefit
3. **Missing Error Boundaries** -- One unhandled error crashes the entire app
4. **Prop drilling through many levels** -- Use Context or composition (children pattern) instead
5. **Giant context values** -- Split into separate contexts by update frequency to avoid unnecessary re-renders
