# Bottleneck Analysis

## Systematic Bottleneck Identification

A bottleneck is the single constraint that limits overall system throughput. Optimizing anything other than the current bottleneck yields no improvement (Goldratt's Theory of Constraints applied to software).

## The USE Method

For every resource (CPU, memory, disk, network), check:

- **U**tilization: What percentage of the resource is being used?
- **S**aturation: Is there a queue of work waiting for this resource?
- **E**rrors: Are there errors related to this resource?

### Applying USE to Common Resources

| Resource | Utilization Check | Saturation Check | Error Check |
|----------|------------------|------------------|-------------|
| CPU | `top`, `htop`, `mpstat` | Run queue length (`vmstat r` column) | Machine check exceptions (dmesg) |
| Memory | `free -m`, process RSS | Swap usage, OOM kills | Allocation failures in logs |
| Disk | `iostat -x` (%util) | `iostat` avgqu-sz, await | `dmesg` for I/O errors |
| Network | `iftop`, interface bytes/sec | TCP retransmits, connection backlog | Dropped packets, refused connections |
| Connection Pool | Active/total connections | Threads waiting for connection | Timeout errors in app logs |
| Thread Pool | Active/total threads | Thread pool queue length | Rejected task exceptions |

## Common Bottleneck Patterns

### Database Query Bottleneck

**Symptoms:**
- Application CPU is low.
- Database CPU is high.
- Response times increase with concurrent users.

**Diagnosis:**
```sql
-- PostgreSQL: find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Find missing indexes
SELECT schemaname, tablename, seq_scan, idx_scan
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan
ORDER BY seq_scan DESC;
```

**Common fixes:**
- Add missing indexes.
- Optimize query structure (avoid N+1, use joins).
- Add caching layer for read-heavy queries.
- Increase connection pool size (if connections are the limit).

### Connection Pool Exhaustion

**Symptoms:**
- Errors: "Cannot acquire connection from pool" or timeout errors.
- Response times increase sharply at a specific load level.
- Database shows few active queries despite pool being full.

**Diagnosis:**
```
Pool size: 10
Active connections: 10
Waiting requests: 47
Average query time: 50ms
Average wait time: 2000ms  <- Bottleneck here
```

**Common fixes:**
- Increase pool size (up to database max_connections limit).
- Reduce query execution time (indexes, query optimization).
- Add connection pool metrics to monitoring.
- Implement circuit breaker for failing downstream services holding connections.

### Memory Pressure / GC Thrashing

**Symptoms:**
- High GC pause times (Node.js: > 100ms, Java: > 200ms).
- CPU spikes correlating with GC activity.
- Application throughput drops periodically.

**Diagnosis:**
```bash
# Node.js: GC tracing
node --trace-gc app.js
# Output: Scavenge 5.2 ms, Mark-sweep 145.3 ms

# Java: GC logging
java -Xlog:gc*:file=gc.log -jar app.jar
```

**Common fixes:**
- Reduce allocation rate (reuse objects, avoid unnecessary copies).
- Increase heap size (if memory is available).
- Switch to a lower-pause GC algorithm (ZGC, Shenandoah for Java).
- Fix memory leaks that force frequent full GC.

### Network Latency Bottleneck

**Symptoms:**
- Application and database CPU both low.
- High response times correlating with network metrics.
- Timeout errors from downstream service calls.

**Diagnosis:**
```bash
# Measure round-trip time
ping downstream-service.internal

# Check TCP connection time
curl -w "connect: %{time_connect}s, ttfb: %{time_starttransfer}s, total: %{time_total}s" \
  http://downstream-service/api/health

# Check for retransmits
ss -ti | grep retrans
```

**Common fixes:**
- Move services closer (same region, same availability zone).
- Implement connection keep-alive to avoid TCP handshake overhead.
- Add caching to reduce downstream calls.
- Batch multiple small requests into one.

### Lock Contention

**Symptoms:**
- CPU utilization is moderate but not saturated.
- Throughput does not scale with additional threads.
- Thread dumps show many threads waiting on the same lock.

**Diagnosis:**
```bash
# Java: thread dump
jstack <PID> | grep -A 5 "BLOCKED"

# Go: goroutine profile
curl http://localhost:6060/debug/pprof/mutex

# Node.js: not applicable (single-threaded) -- check event loop delay instead
```

**Common fixes:**
- Reduce critical section size (do less work under the lock).
- Use fine-grained locks instead of coarse-grained.
- Switch to lock-free data structures (ConcurrentHashMap, atomic operations).
- Use read-write locks when reads vastly outnumber writes.

## Bottleneck Resolution Framework

### Step 1: Measure

Establish baseline metrics for all resources and application-level SLOs.

### Step 2: Identify

Apply the USE method to each resource. The bottleneck is the resource that is saturated or erroring.

### Step 3: Hypothesize

Form a specific theory about why this resource is the bottleneck.

### Step 4: Experiment

Change one thing (increase pool size, add index, optimize query) and measure the effect.

### Step 5: Verify

After resolving one bottleneck, the system will speed up until hitting the next bottleneck. Repeat the process.

```
Iteration 1: Database queries are slow (missing index)
  -> Add index -> Throughput: 100 rps -> 300 rps

Iteration 2: Connection pool exhausted at 300 rps
  -> Increase pool size 10 -> 30 -> Throughput: 300 -> 500 rps

Iteration 3: CPU saturated at 500 rps
  -> Horizontal scaling (add instance) -> Throughput: 500 -> 900 rps
```

## Monitoring for Bottleneck Detection

### Essential Dashboards

| Dashboard | Metrics | Alert Threshold |
|-----------|---------|----------------|
| Application | p50/p95/p99 latency, throughput, error rate | p95 > SLO, error rate > 1% |
| Database | Query time, connections, lock waits | Query time > 100ms, pool > 80% |
| Infrastructure | CPU, memory, disk I/O, network | CPU > 80%, memory > 90% |
| JVM/Runtime | GC pause time, heap usage, thread count | GC pause > 200ms |

### Correlation is Key

A single metric in isolation is not diagnostic. Correlate across layers:

```
Spike in API latency at 14:23
  + Database query time spike at 14:23
  + Database CPU at 95% at 14:23
  + No application CPU increase
  = Bottleneck is in the database
```

Without correlation, you might wrongly blame the application layer.

## Amdahl's Law

The maximum speedup from optimizing one part of a system is limited by the proportion of time that part represents:

```
If a function takes 30% of total time:
  Speedup from optimizing only that function:
  Best case (instant): 1 / (1 - 0.3) = 1.43x (43% faster)

If a function takes 80% of total time:
  Best case (instant): 1 / (1 - 0.8) = 5x
```

Prioritize optimizing the component that dominates execution time. A 2x improvement on a 5% component yields only 2.5% overall improvement.
