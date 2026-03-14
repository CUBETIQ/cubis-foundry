# Profiling

## Why Profile Before Optimizing

Profiling identifies where a program actually spends its time and resources. Without profiling, developers rely on intuition, which is wrong more often than right. The 90/10 rule applies: 90% of execution time is spent in 10% of the code. Profiling finds that 10%.

## Profiling Types

### CPU Profiling

Measures which functions consume the most CPU time.

**When to use:** Application response time is high but I/O metrics (disk, network) show no saturation. CPU utilization is elevated.

#### Node.js CPU Profiling

```bash
# Built-in V8 profiler
node --prof app.js
node --prof-process isolate-*.log > profile.txt

# Chrome DevTools profiler
node --inspect app.js
# Open chrome://inspect, go to Performance tab, click Record

# Clinic.js (flamegraph)
npx clinic flame -- node app.js
```

#### Python CPU Profiling

```python
# cProfile (standard library)
import cProfile

cProfile.run('main()', 'output.prof')

# Read the profile
import pstats
stats = pstats.Stats('output.prof')
stats.sort_stats('cumulative')
stats.print_stats(20)  # Top 20 functions

# py-spy (sampling profiler, no code changes needed)
# pip install py-spy
# py-spy top --pid <PID>
# py-spy record -o profile.svg --pid <PID>
```

#### Go CPU Profiling

```go
import "runtime/pprof"

f, _ := os.Create("cpu.prof")
pprof.StartCPUProfile(f)
defer pprof.StopCPUProfile()

// Or with net/http/pprof for running servers:
import _ "net/http/pprof"
// Access at http://localhost:6060/debug/pprof/
```

```bash
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30
# (pprof) top 20
# (pprof) web  # Opens flamegraph in browser
```

### Memory Profiling

Measures memory allocation patterns and identifies leaks.

**When to use:** Memory usage grows over time (leak), garbage collection pauses are long, or out-of-memory errors occur.

#### Node.js Memory Profiling

```bash
# Heap snapshot
node --inspect app.js
# Chrome DevTools -> Memory tab -> Take heap snapshot

# Track allocations over time
node --inspect app.js
# Chrome DevTools -> Memory tab -> Allocation instrumentation on timeline

# Clinic.js heap profiler
npx clinic heapprofile -- node app.js
```

#### Python Memory Profiling

```python
# memory_profiler (line-by-line memory usage)
from memory_profiler import profile

@profile
def process_data():
    data = [i ** 2 for i in range(1_000_000)]
    filtered = [x for x in data if x % 2 == 0]
    return sum(filtered)

# tracemalloc (standard library)
import tracemalloc

tracemalloc.start()
# ... run code ...
snapshot = tracemalloc.take_snapshot()
stats = snapshot.statistics('lineno')
for stat in stats[:10]:
    print(stat)
```

### I/O Profiling

Measures time spent waiting for disk, network, or database operations.

**When to use:** CPU utilization is low but response times are high. The application is I/O bound.

```bash
# Linux: strace for system call analysis
strace -c -p <PID>  # Summary of syscall time
strace -e trace=network -p <PID>  # Network calls only

# Node.js: Clinic.js Doctor (identifies I/O bottlenecks)
npx clinic doctor -- node app.js
```

## Flame Graphs

Flame graphs are the most effective visualization for CPU profiles. Each bar represents a function. Width indicates time spent. The y-axis shows the call stack.

### Reading a Flame Graph

```
|--------- main() ---------|
|---- processRequest() ----|
|-- parseJSON() --|-- queryDB() --|
                  |-- serialize() -|
```

- **Wide bars** at the top: these functions (and their children) consume the most time.
- **Wide bars** at the bottom (leaf functions): these functions themselves are slow.
- **Narrow bars**: fast functions, not worth optimizing.

### Generating Flame Graphs

```bash
# Node.js
npx clinic flame -- node app.js
# Opens interactive flamegraph in browser

# Python
py-spy record -o profile.svg --pid <PID>
# Opens as SVG in browser

# Go
go tool pprof -http=:8080 cpu.prof
# Navigate to Flame Graph view

# Linux (any language)
perf record -g -p <PID> -- sleep 30
perf script | stackcollapse-perf.pl | flamegraph.pl > profile.svg
```

## Profiling Workflow

### Step 1: Establish the Question

What specific performance problem are you investigating?

- "Why does the /api/search endpoint take 2 seconds?"
- "Why does memory grow by 100MB per hour?"
- "Why does CPU spike to 100% during batch processing?"

### Step 2: Choose the Right Profiler

| Symptom | Profiler Type | Tool |
|---------|--------------|------|
| High CPU usage | CPU profiler | clinic flame, py-spy, pprof |
| Growing memory | Memory profiler | Chrome DevTools, tracemalloc, pprof |
| Slow despite low CPU | I/O profiler | clinic doctor, strace |
| Long GC pauses | GC profiler | --trace-gc (Node), gc module (Python) |

### Step 3: Profile Under Realistic Load

Profile with production-like traffic, data volumes, and concurrency. Profiling an idle system reveals nothing useful.

```bash
# Start the application
node app.js &

# In another terminal, generate load
k6 run load-test.js

# In a third terminal, capture the profile
npx clinic flame --autocannon [ /api/endpoint -c 50 -d 30 ]
```

### Step 4: Identify the Hotspot

Look for functions that:
- Appear in the widest flame graph bars.
- Show up in the top 10 by cumulative time.
- Are called unexpectedly many times.
- Allocate unexpectedly large amounts of memory.

### Step 5: Optimize and Verify

Make one change, re-profile, and compare. Verify the hotspot is resolved and no new one appeared.

## Continuous Profiling

For production systems, use always-on profilers with minimal overhead:

| Tool | Language | Overhead |
|------|----------|----------|
| Pyroscope | Multi-language | ~2% CPU |
| Datadog Continuous Profiler | Multi-language | ~1-2% CPU |
| Google Cloud Profiler | Go, Java, Python, Node | ~1% CPU |
| Parca | Multi-language (eBPF) | < 1% CPU |

Continuous profiling captures production behavior that cannot be reproduced in test environments. It enables comparing profiles across deployments to detect regressions.

## Common Profiling Mistakes

| Mistake | Impact | Fix |
|---------|--------|-----|
| Profiling in development only | Development behavior differs from production | Profile under production-like load |
| Profiling without load | Idle profiles show startup code, not hot paths | Generate realistic concurrent traffic |
| Optimizing before profiling | Wasting time on non-bottleneck code | Always profile first, then optimize |
| Ignoring allocation patterns | Memory pressure causes GC pauses that appear as CPU | Profile both CPU and memory |
| One-time profiling only | Performance characteristics change with new code | Profile regularly, especially after major changes |
