# Performance and Profiling

## Profiling Workflow

1. **Reproduce** — identify the slow path with real workload or representative benchmark.
2. **Profile** — CPU time, memory allocations, or GC pressure depending on the symptom.
3. **Identify hotspot** — focus on the top contributor, not scattered micro-optimizations.
4. **Change one thing** — benchmark before and after.
5. **Verify correctness** — run tests after every optimization.

## CPU Profiling with Stackprof

```ruby
# Gemfile
gem "stackprof", group: [:development, :test]

# Sample CPU usage
StackProf.run(mode: :cpu, out: "tmp/stackprof-cpu.dump") do
  perform_expensive_operation
end

# View results
# stackprof tmp/stackprof-cpu.dump --text
# stackprof tmp/stackprof-cpu.dump --method 'OrderService#calculate'
# stackprof tmp/stackprof-cpu.dump --flamegraph > tmp/flamegraph.json

# Wall-clock profiling (includes I/O wait time)
StackProf.run(mode: :wall, interval: 1000) do
  fetch_external_data
end

# Object allocation profiling
StackProf.run(mode: :object) do
  process_batch(items)
end
```

## Memory Profiling

```ruby
# Gemfile
gem "memory_profiler", group: [:development, :test]

# Profile memory allocations
report = MemoryProfiler.report do
  100.times { build_response(data) }
end

report.pretty_print
# Shows: allocated memory by gem, file, location, class
# Retained memory (memory that survived GC)

# Derailed benchmarks for Rails boot and request memory
# gem "derailed_benchmarks"
# bundle exec derailed bundle:mem      # memory at boot
# bundle exec derailed exec perf:mem   # memory per request
```

## Benchmarking

```ruby
require "benchmark/ips"

Benchmark.ips do |x|
  data = (1..1000).to_a

  x.report("each + push") do
    result = []
    data.each { |i| result.push(i * 2) }
  end

  x.report("map") do
    data.map { |i| i * 2 }
  end

  x.report("map with _1") do
    data.map { _1 * 2 }
  end

  x.compare!
end
```

## YJIT (Ruby 3.2+)

```bash
# Enable YJIT at startup — significant performance improvement
ruby --yjit app.rb

# Or via environment variable
RUBY_YJIT_ENABLE=1 bundle exec rails server

# YJIT stats (development)
ruby --yjit-stats app.rb
# Shows: compiled methods, inline cache hits, code size

# In Puma/Unicorn config
# YJIT is enabled by default in Ruby 3.3+ for processes with enough memory
```

```ruby
# Check YJIT status at runtime
RubyVM::YJIT.enabled?  # => true/false
RubyVM::YJIT.stats     # hash of compilation stats
```

## GC Tuning

```bash
# Environment variables for GC tuning
RUBY_GC_HEAP_INIT_SLOTS=600000      # initial heap size (reduce GC early in boot)
RUBY_GC_HEAP_FREE_SLOTS_MIN_RATIO=0.20
RUBY_GC_HEAP_FREE_SLOTS_MAX_RATIO=0.40

# Malloc-based GC tuning
RUBY_GC_MALLOC_LIMIT=128000000       # 128MB before major GC
RUBY_GC_OLDMALLOC_LIMIT=128000000
```

```ruby
# Monitor GC in production
GC.stat
# => { count: 42, heap_allocated_pages: 150, total_allocated_objects: 5000000, ... }

# Disable GC during critical sections (use sparingly)
GC.disable
critical_operation
GC.enable
GC.start  # trigger GC at convenient point
```

## String Optimization

```ruby
# frozen_string_literal: true

# Frozen strings are deduplicated — one object for identical literals
greeting = "hello"  # same object every time this line runs

# String interpolation creates new strings — cache when reused
# BAD — new string every iteration
items.each do |item|
  cache_key = "item:#{item.id}:data"  # new string each time
  cache.get(cache_key)
end

# BETTER — use frozen format
FORMAT = "item:%d:data"
items.each do |item|
  cache_key = format(FORMAT, item.id)
  cache.get(cache_key)
end

# Use symbols for hash keys — deduplicated by runtime
# GOOD: { name: "Alice" }
# BAD:  { "name" => "Alice" }  # string key allocated each time
```

## Enumerable Patterns

```ruby
# Prefer Enumerable methods over manual loops

# Lazy evaluation for large collections
File.open("huge.csv").each_line
  .lazy
  .reject { _1.start_with?("#") }
  .map { _1.strip.split(",") }
  .select { |cols| cols[2].to_i > 100 }
  .first(10)

# each_with_object for building results
totals = orders.each_with_object(Hash.new(0)) do |order, sums|
  sums[order.category] += order.total
end

# chunk/slice for batch processing
large_dataset.each_slice(1000) do |batch|
  Model.insert_all(batch.map(&:attributes))
end

# tally for counting
["a", "b", "a", "c", "b", "a"].tally
# => {"a" => 3, "b" => 2, "c" => 1}

# filter_map — map + compact in one pass
users.filter_map { |u| u.email if u.active? }
```

## Caching

```ruby
# Memoization — instance-level caching
def expensive_result
  @expensive_result ||= compute_expensive_thing
end

# Memoize nil/false safely
def nullable_result
  return @nullable_result if defined?(@nullable_result)
  @nullable_result = potentially_nil_computation
end

# Application-level caching
Rails.cache.fetch("user:#{id}:profile", expires_in: 1.hour) do
  UserProfile.new(user).compute
end

# Cache key fingerprinting
def cache_key
  [self.class.name, id, updated_at.to_i].join("/")
end
```

## Common Anti-Patterns

| Anti-pattern                   | Impact                      | Fix                                      |
| ------------------------------ | --------------------------- | ---------------------------------------- |
| N+1 queries                    | O(n) DB calls per list      | `includes` / `preload` / `eager_load`    |
| String concatenation in loop   | O(n²) allocations           | `StringIO` or `Array#join`               |
| `OpenStruct` for data          | 10x slower than Struct/Data | `Data.define` or `Struct`                |
| `method_missing` without cache | Method lookup on every call | Define methods dynamically on first call |
| Loading entire table           | Memory exhaustion           | `find_each` / `in_batches`               |
| No connection pooling          | Exhausted connections       | Configure pool size in database.yml      |
