# GC and Allocation Patterns

## GC Collector Selection

| Collector          | Best for                                      | Tuning priority                            |
| ------------------ | --------------------------------------------- | ------------------------------------------ |
| **G1GC** (default) | General-purpose, balanced latency/throughput  | Pause time target (`-XX:MaxGCPauseMillis`) |
| **ZGC**            | Ultra-low latency (< 1ms pauses), large heaps | Heap size and allocation rate              |
| **Shenandoah**     | Low latency, OpenJDK-only                     | Similar to ZGC                             |
| **Parallel GC**    | Batch processing, throughput-first            | Throughput target (`-XX:GCTimeRatio`)      |

```bash
# G1GC with 200ms pause target
java -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -Xmx4g -jar app.jar

# ZGC for low-latency services
java -XX:+UseZGC -Xmx8g -jar app.jar

# GC logging for diagnostics
java -Xlog:gc*:file=gc.log:time,uptime,level,tags -jar app.jar
```

## Allocation Hotspot Patterns

The fastest allocation is the one that doesn't happen. Reduce allocation pressure in hot paths.

```java
// BAD — allocates new String on every call via concatenation
String buildKey(String prefix, long id) {
    return prefix + ":" + id; // creates StringBuilder, intermediate strings
}

// GOOD — use StringBuilder explicitly or format once
String buildKey(String prefix, long id) {
    return prefix.concat(":").concat(Long.toString(id));
}

// BAD — autoboxing in loops creates Integer objects
int sum = 0;
for (Object item : list) {
    sum += (Integer) item; // unboxing + potential boxing
}

// GOOD — use primitive streams
int sum = IntStream.range(0, list.size())
    .map(i -> ((Integer) list.get(i)).intValue())
    .sum();
```

## Escape Analysis

JVM escape analysis determines if an object can be allocated on the stack instead of the heap. Objects that "escape" the method (returned, stored in fields, passed to unknown methods) must be heap-allocated.

```java
// GOOD — Point does not escape, JVM may stack-allocate or scalar-replace
double distance(double x1, double y1, double x2, double y2) {
    var p = new Point(x2 - x1, y2 - y1); // may be eliminated by EA
    return Math.sqrt(p.x() * p.x() + p.y() * p.y());
}

// BAD — object escapes via return, cannot be stack-allocated
Point createDelta(double x1, double y1, double x2, double y2) {
    return new Point(x2 - x1, y2 - y1); // escapes — heap allocated
}

// Things that defeat escape analysis:
// - Returning the object
// - Storing in a field or collection
// - Passing to a non-inlined method
// - Synchronized blocks on the object (in some cases)
```

## Object Pooling — When Justified

Object pooling is rarely needed with modern GCs. Use it only for expensive-to-create resources:

```java
// JUSTIFIED — database connections, thread pools
HikariConfig config = new HikariConfig();
config.setMaximumPoolSize(20);
config.setMinimumIdle(5);
config.setConnectionTimeout(3000);
HikariDataSource pool = new HikariDataSource(config);

// NOT JUSTIFIED — simple objects
// DON'T pool Strings, DTOs, collections — GC handles them efficiently
```

## Memory Profiling Tools

```bash
# JFR recording (built into JDK, low overhead)
java -XX:StartFlightRecording=filename=recording.jfr,duration=60s -jar app.jar

# jcmd for runtime diagnostics without restart
jcmd <pid> GC.heap_info          # heap summary
jcmd <pid> GC.run                # trigger GC
jcmd <pid> VM.native_memory      # native memory tracker

# async-profiler for allocation profiling
./asprof -e alloc -d 30 -f alloc.html <pid>
```

## Common GC Problems and Fixes

| Symptom               | Likely cause                            | Fix                                                        |
| --------------------- | --------------------------------------- | ---------------------------------------------------------- |
| Frequent young-gen GC | High allocation rate in hot paths       | Reduce allocations, use primitives, pool expensive objects |
| Long full GC pauses   | Heap too small or too many live objects | Increase heap, switch to ZGC, find memory leaks            |
| Old-gen filling up    | Memory leak or large caches             | Heap dump analysis, fix leaks, bound cache sizes           |
| GC thrashing          | Heap nearly full, GC runs constantly    | Increase heap, reduce live object set                      |

```java
// Fix memory leak: unbounded cache
// BAD
private final Map<String, byte[]> cache = new HashMap<>();

// GOOD — bounded LRU cache
private final Map<String, byte[]> cache = new LinkedHashMap<>(100, 0.75f, true) {
    @Override
    protected boolean removeEldestEntry(Map.Entry<String, byte[]> eldest) {
        return size() > 1000;
    }
};

// BETTER — use Caffeine for production caches
Cache<String, byte[]> cache = Caffeine.newBuilder()
    .maximumSize(1000)
    .expireAfterWrite(Duration.ofMinutes(10))
    .recordStats()
    .build();
```

## String Optimization

```java
// String deduplication (G1GC and ZGC)
// JVM flag: -XX:+UseStringDeduplication
// Automatically deduplicates char[] backing arrays of identical strings

// Intern frequently repeated strings
String region = rawRegion.intern(); // shares single instance across JVM

// StringBuilder for loop concatenation
StringBuilder sb = new StringBuilder(estimatedSize);
for (String item : items) {
    if (!sb.isEmpty()) sb.append(", ");
    sb.append(item);
}
String result = sb.toString();

// String.format vs concatenation vs StringBuilder
// For hot paths: StringBuilder > concat > String.format
// For cold paths: readability wins — use whatever is clearest
```

## Heap Dump Analysis Workflow

1. Capture heap dump: `jcmd <pid> GC.heap_dump /tmp/heap.hprof`
2. Open in Eclipse MAT or VisualVM
3. Look at dominator tree — identifies objects retaining the most memory
4. Check leak suspects report — MAT auto-detects common leak patterns
5. Trace GC roots of suspicious objects to find the retention path
6. Fix the leak (usually: unbounded cache, listener not removed, static collection growing)
