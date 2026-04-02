# Go Performance

## Profiling First

Never optimize without profiling. Go's built-in profiler (`pprof`) provides CPU, heap, goroutine, block, and mutex profiles.

## pprof Integration

### HTTP Server (Runtime Profiling)

```go
import _ "net/http/pprof"

func main() {
    // Debug server on a separate port
    go func() {
        log.Println(http.ListenAndServe("localhost:6060", nil))
    }()

    // ... main application ...
}
```

### Collecting Profiles

```bash
# CPU profile (30 seconds)
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# Heap profile (current allocations)
go tool pprof http://localhost:6060/debug/pprof/heap

# Goroutine profile (all goroutines)
go tool pprof http://localhost:6060/debug/pprof/goroutine

# Block profile (blocking operations)
go tool pprof http://localhost:6060/debug/pprof/block

# Mutex contention profile
go tool pprof http://localhost:6060/debug/pprof/mutex

# Interactive commands
(pprof) top 20          # Top 20 functions by CPU/memory
(pprof) list funcName   # Annotated source for a function
(pprof) web             # Open flame graph in browser
```

## Benchmarking

### Writing Benchmarks

```go
func BenchmarkProcessRecords(b *testing.B) {
    records := generateTestRecords(1000)

    b.ReportAllocs() // Report allocations per operation
    b.ResetTimer()   // Exclude setup from timing

    for i := 0; i < b.N; i++ {
        _ = processRecords(records)
    }
}

// Benchmark with different input sizes
func BenchmarkProcess(b *testing.B) {
    for _, size := range []int{10, 100, 1000, 10000} {
        b.Run(fmt.Sprintf("size=%d", size), func(b *testing.B) {
            data := generateData(size)
            b.ReportAllocs()
            b.ResetTimer()
            for i := 0; i < b.N; i++ {
                _ = process(data)
            }
        })
    }
}
```

### Comparing with benchstat

```bash
# Run benchmarks multiple times for statistical significance
go test -bench=. -benchmem -count=10 ./... > old.txt
# ... make changes ...
go test -bench=. -benchmem -count=10 ./... > new.txt

# Compare
benchstat old.txt new.txt
```

## Allocation Optimization

### Understanding Escape Analysis

```bash
# See which variables escape to the heap
go build -gcflags='-m -m' ./...
```

### Common Escape Patterns

```go
// ESCAPES: returned pointer forces heap allocation
func newUser(name string) *User {
    u := User{Name: name} // escapes to heap
    return &u
}

// STAYS ON STACK: value return
func newUser(name string) User {
    return User{Name: name} // stays on stack (if caller doesn't take address)
}

// ESCAPES: stored in interface
func process(item any) { ... }
func main() {
    x := 42
    process(x) // x escapes: interface boxing allocates
}
```

### Reducing Allocations

```go
// 1. Pre-allocate slices
items := make([]Item, 0, expectedSize)

// 2. Reuse buffers with sync.Pool
var bufPool = sync.Pool{
    New: func() any { return new(bytes.Buffer) },
}

func process(data []byte) string {
    buf := bufPool.Get().(*bytes.Buffer)
    defer func() {
        buf.Reset()
        bufPool.Put(buf)
    }()
    // use buf...
    return buf.String()
}

// 3. Use strings.Builder for string concatenation
var b strings.Builder
b.Grow(estimatedSize)
for _, s := range parts {
    b.WriteString(s)
}
result := b.String()

// 4. Avoid fmt.Sprintf in hot paths
// SLOW: allocates
key := fmt.Sprintf("user:%d", id)
// FASTER: strconv
key := "user:" + strconv.Itoa(id)

// 5. Use append instead of copy for byte slices
result := append(dst[:0], src...)
```

## String and Byte Optimizations

```go
// Unsafe but zero-allocation string <-> []byte conversion
// Use only when the string is not mutated and the lifetime is clear
import "unsafe"

func unsafeStringToBytes(s string) []byte {
    return unsafe.Slice(unsafe.StringData(s), len(s))
}

func unsafeBytesToString(b []byte) string {
    return unsafe.String(unsafe.SliceData(b), len(b))
}
```

**Warning**: Use only in proven hot paths. The standard conversion is safe and fast enough for most code.

## Concurrency Performance

### Mutex vs Channel Performance

| Operation | Cost | Use when |
| --- | --- | --- |
| `sync.Mutex` Lock/Unlock | ~15-25 ns uncontended | Protecting shared state |
| Channel send/receive | ~50-100 ns | Ownership transfer |
| `sync.RWMutex` RLock | ~10-15 ns uncontended | Read-heavy shared state |
| `atomic.Int64` Add/Load | ~5 ns | Counters, flags |

### Reducing Mutex Contention

```go
// PROBLEM: single mutex, high contention
type Cache struct {
    mu    sync.RWMutex
    items map[string]Item
}

// SOLUTION: sharded map reduces contention
type ShardedCache struct {
    shards [256]struct {
        mu    sync.RWMutex
        items map[string]Item
    }
}

func (c *ShardedCache) shard(key string) *struct {
    mu    sync.RWMutex
    items map[string]Item
} {
    h := fnv.New32a()
    h.Write([]byte(key))
    return &c.shards[h.Sum32()%256]
}
```

## JSON Performance

```go
// Standard library (correct, but allocates)
json.Unmarshal(data, &result)

// sonic (fastest, drop-in replacement)
import "github.com/bytedance/sonic"
sonic.Unmarshal(data, &result)

// encoding/json/v2 (upcoming in Go stdlib, faster than v1)
// Use jsontext.Decoder for streaming

// For known schemas, code generation is fastest:
// easyjson, ffjson generate optimized marshalers
```

## GC Tuning

```go
// Set GOGC (default 100 = GC when heap doubles)
// Higher = less frequent GC, more memory
// Lower = more frequent GC, less memory
runtime.SetGCPercent(200)  // GC when heap triples

// Memory limit (Go 1.19+)
runtime.SetMemoryLimit(512 << 20)  // 512 MB limit

// In practice, set via environment:
// GOGC=200
// GOMEMLIMIT=512MiB
```

### When to Tune GC

- **High allocation rate + low latency requirement**: increase GOGC to reduce GC frequency.
- **Memory-constrained environment**: set GOMEMLIMIT to prevent OOM kills.
- **Most applications**: leave defaults. Profile first, tune only if GC shows up in profiles.

## Compile-Time Optimization Flags

```bash
# Profile-guided optimization (Go 1.20+)
# Step 1: collect a CPU profile from production
go test -bench=. -cpuprofile=default.pgo ./...

# Step 2: rebuild with PGO
go build -pgo=default.pgo ./cmd/myservice
# ~2-7% performance improvement on average
```

## Checklist Before Optimizing

1. Is the code correct? Do not optimize broken code.
2. Is there a benchmark proving the hot path? `go test -bench=.`
3. Has pprof identified the bottleneck? `go tool pprof`
4. Will the optimization make the code harder to maintain?
5. Can the algorithm be improved before micro-optimizing?
6. Is the improvement statistically significant? `benchstat`
