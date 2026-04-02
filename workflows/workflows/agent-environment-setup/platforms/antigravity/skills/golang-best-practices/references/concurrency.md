# Go Concurrency Patterns

## Core Mental Model

Go concurrency is based on two primitives:
- **Channels** for ownership transfer (one goroutine sends, another receives).
- **Sync primitives** (`Mutex`, `RWMutex`, `atomic`) for shared state.

Choose channels when data flows in one direction. Choose mutexes when multiple goroutines read/write the same struct.

## errgroup for Coordinated Fan-Out

`errgroup.Group` replaces manual `sync.WaitGroup` + error channels.

```go
import "golang.org/x/sync/errgroup"

func FetchAll(ctx context.Context, urls []string) ([]Response, error) {
    g, gctx := errgroup.WithContext(ctx)
    responses := make([]Response, len(urls))

    for i, url := range urls {
        i, url := i, url // capture loop variables
        g.Go(func() error {
            resp, err := fetch(gctx, url)
            if err != nil {
                return fmt.Errorf("fetch %s: %w", url, err)
            }
            responses[i] = resp // safe: each goroutine writes to its own index
            return nil
        })
    }

    if err := g.Wait(); err != nil {
        return nil, err
    }
    return responses, nil
}
```

### Key behaviors

- `errgroup.WithContext` returns a derived context that is cancelled when any goroutine returns a non-nil error.
- `g.Wait()` blocks until all goroutines finish and returns the first error.
- Sibling goroutines should check `gctx.Done()` to exit early when a sibling fails.

### Concurrency Limiting

```go
g, gctx := errgroup.WithContext(ctx)
g.SetLimit(10) // At most 10 goroutines run concurrently

for _, task := range tasks {
    task := task
    g.Go(func() error {
        return process(gctx, task)
    })
}
```

## Context Propagation and Cancellation

### Context Hierarchy

```
Background (root)
  └── WithTimeout (overall request: 30s)
       ├── WithTimeout (database query: 5s)
       └── WithTimeout (external API: 10s)
```

### Pattern: Cancellation in Loops

```go
func worker(ctx context.Context, jobs <-chan Job) error {
    for {
        select {
        case <-ctx.Done():
            return ctx.Err()
        case job, ok := <-jobs:
            if !ok {
                return nil // channel closed
            }
            if err := process(ctx, job); err != nil {
                return fmt.Errorf("process job %d: %w", job.ID, err)
            }
        }
    }
}
```

### Pattern: Timeout with Fallback

```go
func fetchWithFallback(ctx context.Context, primary, fallback string) ([]byte, error) {
    ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
    defer cancel()

    data, err := fetch(ctx, primary)
    if err == nil {
        return data, nil
    }

    // Primary failed or timed out — try fallback with remaining deadline
    return fetch(ctx, fallback)
}
```

## Channel Patterns

### Fan-Out, Fan-In

```go
func fanOutFanIn(ctx context.Context, input <-chan int, workers int) <-chan int {
    // Fan-out: distribute to workers
    channels := make([]<-chan int, workers)
    for i := 0; i < workers; i++ {
        channels[i] = processStream(ctx, input)
    }

    // Fan-in: merge results
    out := make(chan int)
    var wg sync.WaitGroup
    for _, ch := range channels {
        wg.Add(1)
        ch := ch
        go func() {
            defer wg.Done()
            for v := range ch {
                select {
                case out <- v:
                case <-ctx.Done():
                    return
                }
            }
        }()
    }

    go func() {
        wg.Wait()
        close(out)
    }()

    return out
}
```

### Pipeline

```go
func generate(ctx context.Context, nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for _, n := range nums {
            select {
            case out <- n:
            case <-ctx.Done():
                return
            }
        }
    }()
    return out
}

func square(ctx context.Context, in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for n := range in {
            select {
            case out <- n * n:
            case <-ctx.Done():
                return
            }
        }
    }()
    return out
}

// Usage
ctx, cancel := context.WithCancel(context.Background())
defer cancel()
for v := range square(ctx, generate(ctx, 1, 2, 3, 4)) {
    fmt.Println(v)
}
```

### Rate Limiter with Token Bucket

```go
func rateLimited(ctx context.Context, jobs <-chan Job, rps int) <-chan Result {
    out := make(chan Result)
    limiter := time.NewTicker(time.Second / time.Duration(rps))

    go func() {
        defer close(out)
        defer limiter.Stop()
        for job := range jobs {
            select {
            case <-limiter.C:
                result := process(job)
                select {
                case out <- result:
                case <-ctx.Done():
                    return
                }
            case <-ctx.Done():
                return
            }
        }
    }()

    return out
}
```

## Mutex Patterns

### Protecting Shared State

```go
type SafeMap[K comparable, V any] struct {
    mu sync.RWMutex
    m  map[K]V
}

func (s *SafeMap[K, V]) Get(key K) (V, bool) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    v, ok := s.m[key]
    return v, ok
}

func (s *SafeMap[K, V]) Set(key K, value V) {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.m[key] = value
}
```

### When to Use sync.Map

- High contention with disjoint key sets (each goroutine accesses different keys).
- Append-only maps that grow but rarely update.
- Do NOT use for general-purpose maps — `sync.RWMutex` + `map` is usually faster.

## Goroutine Leak Detection

### Using goleak in Tests

```go
import "go.uber.org/goleak"

func TestMain(m *testing.M) {
    goleak.VerifyTestMain(m)
}

func TestWorker(t *testing.T) {
    defer goleak.VerifyNone(t)
    // ... test code ...
}
```

### Common Leak Patterns

```go
// LEAK: goroutine blocks forever on unbuffered channel
go func() {
    ch <- result // nobody reads from ch
}()

// LEAK: goroutine blocks on context that is never cancelled
go func() {
    <-ctx.Done() // ctx has no deadline or cancel function
}()

// FIX: always provide a cancellation path
ctx, cancel := context.WithCancel(parentCtx)
defer cancel()
go func() {
    select {
    case ch <- result:
    case <-ctx.Done():
    }
}()
```

## iter.Seq / iter.Seq2 (Go 1.23+)

Range-over-function iterators replace callback-based iteration.

```go
// Define an iterator
func Filtered[T any](s []T, predicate func(T) bool) iter.Seq[T] {
    return func(yield func(T) bool) {
        for _, v := range s {
            if predicate(v) {
                if !yield(v) {
                    return
                }
            }
        }
    }
}

// Use with range
for v := range Filtered(items, func(i Item) bool { return i.Active }) {
    process(v)
}
```
