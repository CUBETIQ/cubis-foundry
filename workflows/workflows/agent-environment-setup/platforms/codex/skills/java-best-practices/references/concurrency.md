# Concurrency Reference (Virtual Threads & Structured Concurrency)

## Virtual Threads (JDK 21)

Virtual threads are lightweight threads managed by the JVM, not the OS. They enable blocking-style code at massive scale without the memory cost of platform threads.

### Creating Virtual Threads

```java
// One-off virtual thread
Thread.startVirtualThread(() -> {
    var result = httpClient.send(request, BodyHandlers.ofString());
    process(result);
});

// Virtual thread executor -- preferred for production
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    Future<String> future = executor.submit(() -> fetchData(url));
    String result = future.get();
}

// Spring Boot 3.2+ auto-configuration
// application.properties:
// spring.threads.virtual.enabled=true
```

### Virtual Threads vs Platform Threads

| Aspect | Platform Threads | Virtual Threads |
| --- | --- | --- |
| Memory per thread | ~1MB stack | ~few KB |
| Max concurrent | Hundreds to low thousands | Millions |
| Scheduling | OS scheduler | JVM scheduler (ForkJoinPool) |
| Best for | CPU-bound work | Blocking I/O |
| Creation cost | Expensive (OS allocation) | Cheap (JVM allocation) |
| Pool needed? | Yes (ThreadPoolExecutor) | No (create per task) |

### Carrier Thread Pinning

Virtual threads are mounted on carrier threads (platform threads in the ForkJoinPool). Certain operations **pin** the virtual thread to its carrier, blocking other virtual threads:

```java
// BAD: synchronized pins the carrier thread
public class ConnectionPool {
    private final List<Connection> pool;

    public synchronized Connection acquire() {  // PINS!
        while (pool.isEmpty()) {
            wait();  // PINS the carrier while waiting
        }
        return pool.removeFirst();
    }
}

// GOOD: ReentrantLock does not pin
public class ConnectionPool {
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition available = lock.newCondition();
    private final Deque<Connection> pool;

    public Connection acquire() throws InterruptedException {
        lock.lock();
        try {
            while (pool.isEmpty()) {
                available.await();  // Virtual thread unmounts; carrier freed
            }
            return pool.removeFirst();
        } finally {
            lock.unlock();
        }
    }
}
```

### Detecting Pinning

```bash
# JVM flag to detect pinning at runtime
java -Djdk.tracePinnedThreads=short MyApp

# Output shows where pinning occurs:
# Thread[#37,VirtualThread[#42]/runnable@ForkJoinPool-1-worker-1]
#     java.base/java.lang.VirtualThread$VThreadContinuation.onPinned(VirtualThread.java:180)
#     com.example.ConnectionPool.acquire(ConnectionPool.java:15) <== monitors:1

# JFR events for pinning
jcmd <pid> JFR.start name=pinning settings=default
```

### Thread-Local Hazards

```java
// BAD: ThreadLocal accumulates data across millions of virtual threads
private static final ThreadLocal<ExpensiveObject> cache = new ThreadLocal<>();

// Virtual threads are cheap to create but each gets its own ThreadLocal storage.
// Millions of virtual threads = millions of ThreadLocal copies.

// GOOD: Use ScopedValue (JDK 21 preview) or pass context explicitly
private static final ScopedValue<RequestContext> CONTEXT = ScopedValue.newInstance();
```

## Structured Concurrency (JDK 21 Preview)

Structured concurrency ensures that the lifetime of concurrent tasks is bounded by their enclosing scope, similar to how structured programming bounds control flow.

### ShutdownOnFailure -- Fail-Fast

```java
// All tasks must succeed; cancel siblings on first failure
public record UserProfile(User user, List<Order> orders, Preferences prefs) {}

public UserProfile loadProfile(String userId) throws Exception {
    try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
        Subtask<User> userTask = scope.fork(() -> userService.findById(userId));
        Subtask<List<Order>> ordersTask = scope.fork(() -> orderService.findByUserId(userId));
        Subtask<Preferences> prefsTask = scope.fork(() -> prefsService.getPreferences(userId));

        scope.join();           // Wait for all tasks to complete
        scope.throwIfFailed();  // Throw the first exception if any failed

        return new UserProfile(
            userTask.get(),
            ordersTask.get(),
            prefsTask.get()
        );
    }
    // If userTask fails, ordersTask and prefsTask are cancelled automatically
}
```

### ShutdownOnSuccess -- First-Result Racing

```java
// Return the first successful result; cancel the rest
public String fetchFromMirror(String resourceId) throws Exception {
    try (var scope = new StructuredTaskScope.ShutdownOnSuccess<String>()) {
        scope.fork(() -> mirror1.fetch(resourceId));
        scope.fork(() -> mirror2.fetch(resourceId));
        scope.fork(() -> mirror3.fetch(resourceId));

        scope.join();
        return scope.result();  // First successful result
    }
    // As soon as one mirror responds, the other two are cancelled
}
```

### Custom Scope for Partial Results

```java
// Custom scope that collects results and tolerates individual failures
public class PartialResultScope<T> extends StructuredTaskScope<T> {
    private final ConcurrentLinkedQueue<T> results = new ConcurrentLinkedQueue<>();
    private final ConcurrentLinkedQueue<Throwable> errors = new ConcurrentLinkedQueue<>();

    @Override
    protected void handleComplete(Subtask<? extends T> subtask) {
        switch (subtask.state()) {
            case SUCCESS -> results.add(subtask.get());
            case FAILED -> errors.add(subtask.exception());
            case UNAVAILABLE -> { /* task was cancelled */ }
        }
    }

    public List<T> results() { return List.copyOf(results); }
    public List<Throwable> errors() { return List.copyOf(errors); }
}

// Usage
try (var scope = new PartialResultScope<EnrichmentData>()) {
    scope.fork(() -> enrichFromServiceA(userId));
    scope.fork(() -> enrichFromServiceB(userId));
    scope.fork(() -> enrichFromServiceC(userId));

    scope.join();

    var data = scope.results();   // Available results
    var failures = scope.errors(); // Logged for observability
    return new EnrichedUser(user, data, failures.isEmpty());
}
```

## Migration Guide: Thread Pool to Virtual Threads

### Step 1: Identify I/O-Bound Code

```java
// Look for: HTTP clients, JDBC calls, file I/O, message queue consumers
// These benefit from virtual threads.

// Skip: CPU-heavy computation, parallel streams, fork-join tasks
// These should stay on platform threads.
```

### Step 2: Replace Executors

```java
// Before
ExecutorService executor = Executors.newFixedThreadPool(200);

// After
ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
```

### Step 3: Audit synchronized Usage

```bash
# Find all synchronized blocks in the codebase
grep -rn "synchronized" --include="*.java" src/

# Each occurrence needs evaluation:
# - If it guards a quick, non-blocking operation: keep (low risk)
# - If it guards I/O or long operations: replace with ReentrantLock
```

### Step 4: Replace Thread.sleep with Structured Alternatives

```java
// Before (blocks the carrier thread)
Thread.sleep(1000);

// After (virtual thread unmounts during sleep -- this is fine)
// Thread.sleep DOES work correctly with virtual threads since JDK 21.
// No change needed for sleep specifically.
```

### Step 5: Monitor in Production

```bash
# Thread dump with virtual thread details
jcmd <pid> Thread.dump_to_file -format=json threads.json

# JFR recording for virtual thread events
jcmd <pid> JFR.start name=vthreads settings=default duration=60s filename=vthreads.jfr
```
