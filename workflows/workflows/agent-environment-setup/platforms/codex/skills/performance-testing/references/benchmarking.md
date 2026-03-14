# Benchmarking

## Microbenchmark Design

Microbenchmarks measure the performance of small, isolated code units: a function, an algorithm, or a data structure operation. They complement load tests by providing precise measurements at the code level.

### Principles

1. **Measure one thing** -- Each benchmark should isolate a single operation. Mixing operations makes it impossible to attribute performance changes.

2. **Warm up before measuring** -- Run the code path several times before recording measurements. Warm-up eliminates JIT compilation, cache population, and initialization noise.

3. **Use enough iterations** -- A single measurement is an anecdote. Run thousands of iterations to produce statistically meaningful results.

4. **Prevent dead code elimination** -- Compilers and runtimes may optimize away code whose result is unused. Consume the benchmark result to prevent elimination.

5. **Control for system noise** -- Close other applications, disable power management, and use a dedicated machine or CI runner for benchmarks.

## Framework-Specific Benchmarking

### JavaScript (Vitest bench / Benchmark.js)

```typescript
// vitest.bench.ts
import { bench, describe } from 'vitest';

describe('Array search', () => {
  const data = Array.from({ length: 10000 }, (_, i) => i);
  const target = 9999;

  bench('Array.indexOf', () => {
    data.indexOf(target);
  });

  bench('Array.find', () => {
    data.find(x => x === target);
  });

  bench('Set.has', () => {
    const set = new Set(data);
    set.has(target);
  });
});
```

```bash
npx vitest bench
```

### Python (pytest-benchmark)

```python
# test_benchmark.py
import pytest

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

def fibonacci_memo(n, memo={}):
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fibonacci_memo(n - 1) + fibonacci_memo(n - 2)
    return memo[n]

def test_fibonacci_naive(benchmark):
    result = benchmark(fibonacci, 20)
    assert result == 6765

def test_fibonacci_memoized(benchmark):
    result = benchmark(fibonacci_memo, 20)
    assert result == 6765
```

```bash
pytest test_benchmark.py --benchmark-min-rounds=100
```

### Go (testing.B)

```go
func BenchmarkFibonacci(b *testing.B) {
    for i := 0; i < b.N; i++ {
        fibonacci(20)
    }
}

func BenchmarkFibonacciMemo(b *testing.B) {
    for i := 0; i < b.N; i++ {
        fibonacciMemo(20)
    }
}
```

```bash
go test -bench=. -benchmem -count=5 ./...
```

### Rust (criterion)

```rust
use criterion::{criterion_group, criterion_main, Criterion};

fn fibonacci(n: u64) -> u64 {
    match n {
        0 | 1 => n,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

fn bench_fibonacci(c: &mut Criterion) {
    c.bench_function("fibonacci 20", |b| b.iter(|| fibonacci(20)));
}

criterion_group!(benches, bench_fibonacci);
criterion_main!(benches);
```

## Statistical Rigor

### Multiple Runs

Never draw conclusions from a single benchmark run. Run at least 5 iterations and examine the distribution:

```
Run 1: 142ms
Run 2: 138ms
Run 3: 145ms
Run 4: 139ms
Run 5: 141ms
Mean: 141ms, StdDev: 2.7ms
```

### Detecting Significant Differences

A 2% improvement might be noise. A 20% improvement is likely real. Use these guidelines:

| Difference | Confidence | Action |
|-----------|------------|--------|
| < 5% | Low (likely noise) | Run more iterations, control environment |
| 5-15% | Medium | Run 10+ iterations, compute confidence interval |
| > 15% | High | Likely a real change, verify with different inputs |

### Coefficient of Variation (CV)

CV = (StdDev / Mean) * 100. If CV > 5%, the measurement is noisy. Reduce noise before comparing.

```
Benchmark A: Mean=100ms, StdDev=2ms  -> CV=2% (stable, trustworthy)
Benchmark B: Mean=100ms, StdDev=15ms -> CV=15% (noisy, unreliable)
```

## Benchmark Result Interpretation

### Operations Per Second vs. Time Per Operation

Both are useful but serve different audiences:

- **ops/sec** is intuitive for throughput: "This function can execute 10,000 times per second."
- **time/op** is intuitive for latency: "Each call takes 0.1ms."

### Memory Allocation

Track allocations alongside time. A faster function that allocates more memory may cause GC pressure:

```
BenchmarkOldParser   5000 ops   300 allocs/op   48KB/op
BenchmarkNewParser   8000 ops   50 allocs/op    12KB/op
```

The new parser is 1.6x faster AND allocates 75% less memory.

## Avoiding Benchmark Pitfalls

### Dead Code Elimination

```go
// BAD: compiler may eliminate the call since result is unused
func BenchmarkBad(b *testing.B) {
    for i := 0; i < b.N; i++ {
        fibonacci(20)  // Result discarded
    }
}

// GOOD: consume the result
var result int
func BenchmarkGood(b *testing.B) {
    var r int
    for i := 0; i < b.N; i++ {
        r = fibonacci(20)
    }
    result = r  // Prevent elimination
}
```

### Caching Effects

If the benchmark processes the same input repeatedly, caches warm up and hide real-world performance:

```python
# BAD: same input every iteration (cached)
def test_parse(benchmark):
    benchmark(parse_json, SAME_STRING)

# BETTER: vary inputs
def test_parse(benchmark):
    inputs = [generate_random_json() for _ in range(1000)]
    benchmark(lambda: [parse_json(i) for i in inputs])
```

### GC Interference

In garbage-collected languages, GC can run during measurements:

```go
// Reset timer after GC to exclude GC from measurement
func BenchmarkWithGC(b *testing.B) {
    runtime.GC()
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        // benchmark code
    }
}
```

## Storing and Comparing Results

### JSON Output for CI

```bash
# Go
go test -bench=. -benchmem -count=5 -json > bench_results.json

# Python
pytest --benchmark-json=bench_results.json

# JavaScript
vitest bench --reporter=json > bench_results.json
```

### Comparison Tools

```bash
# Go: benchstat (official)
go install golang.org/x/perf/cmd/benchstat@latest
benchstat old.txt new.txt

# Output:
# name        old time/op  new time/op  delta
# Parser-8    1.25ms       0.85ms       -32.0% (p=0.001)
```

### Tracking Over Time

Store benchmark results as CI artifacts and plot trends. A graph showing p95 latency per commit immediately reveals when regressions were introduced.
