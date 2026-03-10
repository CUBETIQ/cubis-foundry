# Performance and Profiling

## Profiling Workflow

1. **Measure first** — never optimize without profiling evidence.
2. **Identify hotspots** — focus on the 5% of code that takes 95% of time.
3. **Change one thing** — benchmark before and after each change.
4. **Verify correctness** — run tests after every optimization.

## Profiling Tools

```bash
# perf (Linux) — sampling profiler
perf record -g ./myapp          # record call graph
perf report                      # interactive analysis
perf stat ./myapp                # hardware counters summary

# Google Benchmark — microbenchmarks
# CMakeLists.txt
find_package(benchmark REQUIRED)
add_executable(bench bench.cpp)
target_link_libraries(bench benchmark::benchmark)

# VTune (Intel) — detailed CPU analysis
vtune -collect hotspots -- ./myapp
vtune -collect memory-access -- ./myapp

# Instruments (macOS)
xcrun xctrace record --instrument "Time Profiler" --launch ./myapp
```

## Google Benchmark Patterns

```cpp
#include <benchmark/benchmark.h>

static void BM_VectorPush(benchmark::State& state) {
    for (auto _ : state) {
        std::vector<int> v;
        for (int i = 0; i < state.range(0); ++i) {
            v.push_back(i);
        }
        benchmark::DoNotOptimize(v.data()); // prevent dead-code elimination
    }
    state.SetItemsProcessed(state.iterations() * state.range(0));
}
BENCHMARK(BM_VectorPush)->Range(8, 1 << 20);

static void BM_VectorReserved(benchmark::State& state) {
    for (auto _ : state) {
        std::vector<int> v;
        v.reserve(state.range(0)); // pre-allocate
        for (int i = 0; i < state.range(0); ++i) {
            v.push_back(i);
        }
        benchmark::DoNotOptimize(v.data());
    }
    state.SetItemsProcessed(state.iterations() * state.range(0));
}
BENCHMARK(BM_VectorReserved)->Range(8, 1 << 20);

BENCHMARK_MAIN();
```

## Cache-Friendly Data Layout

```cpp
// Array of Structs (AoS) — good when you access all fields together
struct Particle_AoS {
    float x, y, z;
    float vx, vy, vz;
    float mass;
};
std::vector<Particle_AoS> particles; // each particle contiguous

// Struct of Arrays (SoA) — good when you access one field across many elements
struct Particles_SoA {
    std::vector<float> x, y, z;
    std::vector<float> vx, vy, vz;
    std::vector<float> mass;
};
// Iterating over just x,y,z is cache-efficient — no vx,vy,vz,mass pollution

// When to use which:
// AoS: random access to individual particles, insertion/deletion
// SoA: SIMD operations on one field, physics simulation, GPU uploads
```

## Allocation Reduction

```cpp
// Avoid repeated heap allocations in hot paths
// BAD — allocates string each iteration
for (const auto& item : items) {
    std::string key = "prefix_" + item.name(); // allocation
    cache.lookup(key);
}

// GOOD — reuse string buffer
std::string key;
key.reserve(64);
for (const auto& item : items) {
    key = "prefix_";
    key += item.name(); // may reuse existing buffer
    cache.lookup(key);
}

// string_view to avoid copies
void process(std::string_view input) {  // no copy
    auto pos = input.find(':');
    auto key = input.substr(0, pos);    // no copy — just a view
    auto val = input.substr(pos + 1);
}

// Small Buffer Optimization (SBO) — many types use it
// std::string: typically 15-22 chars stored inline (no heap)
// std::function: small callables stored inline
// std::any: small types stored inline
// pmr allocators: customize allocation strategy

// Pre-allocate containers
std::vector<int> v;
v.reserve(expected_size); // avoids repeated reallocation
```

## Avoiding Virtual Dispatch in Hot Paths

```cpp
// Virtual dispatch: ~3-5ns per call (cache miss: ~100ns)
// For tight loops with millions of iterations, this matters

// std::variant + std::visit — static dispatch
using Shape = std::variant<Circle, Rectangle, Triangle>;

double total_area(const std::vector<Shape>& shapes) {
    double sum = 0;
    for (const auto& s : shapes) {
        sum += std::visit([](const auto& shape) {
            return shape.area(); // statically dispatched
        }, s);
    }
    return sum;
}

// CRTP for static polymorphism (see template-and-concepts-patterns.md)
```

## Compiler Hints

```cpp
// [[likely]] and [[unlikely]] for branch prediction hints
if (result == SUCCESS) [[likely]] {
    process(result);
} else [[unlikely]] {
    handle_error(result);
}

// [[assume]] (C++23) — optimizer hint
void process(int x) {
    [[assume(x > 0)]]; // optimizer can assume this is true
    // ... code that benefits from knowing x > 0
}

// Prefetch for known access patterns
for (size_t i = 0; i < n; ++i) {
    __builtin_prefetch(&data[i + 16], 0, 1); // prefetch ahead
    process(data[i]);
}
```

## Link-Time Optimization (LTO)

```bash
# Enable LTO
g++ -flto -O2 -o myapp *.cpp
clang++ -flto=thin -O2 -o myapp *.cpp  # thin LTO: faster build, similar gains

# CMake
set(CMAKE_INTERPROCEDURAL_OPTIMIZATION TRUE)
```

## Common Performance Anti-Patterns

| Anti-pattern                     | Cost                      | Fix                                          |
| -------------------------------- | ------------------------- | -------------------------------------------- |
| `std::map` for lookup            | O(log n) + cache misses   | `std::unordered_map` or sorted `std::vector` |
| `std::list` traversal            | Cache miss per node       | `std::vector` or `std::deque`                |
| `std::shared_ptr` in hot path    | Atomic ref-count per copy | `unique_ptr` or raw observer pointer         |
| String concatenation in loop     | O(n²) total allocations   | `std::string::reserve` + append              |
| `virtual` dispatch in tight loop | Vtable indirection        | `std::variant` + `visit` or CRTP             |
| Exceptions for control flow      | Stack unwinding cost      | Error codes or `expected<T, E>`              |
