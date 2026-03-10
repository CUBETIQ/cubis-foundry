# Virtual Threads Patterns

## When to Use Virtual Threads

Virtual threads (Project Loom) are lightweight threads managed by the JVM. They excel at blocking I/O workloads where the thread spends most of its time waiting.

```java
// Task-per-request server — ideal for virtual threads
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    ServerSocket server = new ServerSocket(8080);
    while (true) {
        Socket socket = server.accept();
        executor.submit(() -> handleRequest(socket));
    }
}

// Parallel I/O operations
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    List<Future<Response>> futures = urls.stream()
        .map(url -> executor.submit(() -> httpClient.send(url)))
        .toList();

    List<Response> responses = futures.stream()
        .map(f -> {
            try { return f.get(10, TimeUnit.SECONDS); }
            catch (Exception e) { throw new RuntimeException(e); }
        })
        .toList();
}
```

## Structured Concurrency (Preview)

```java
// StructuredTaskScope for coordinated subtasks
Response handleRequest(Request req) throws Exception {
    try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
        Subtask<User> userTask = scope.fork(() -> fetchUser(req.userId()));
        Subtask<List<Order>> ordersTask = scope.fork(() -> fetchOrders(req.userId()));

        scope.join();           // wait for both
        scope.throwIfFailed();  // propagate first failure

        return new Response(userTask.get(), ordersTask.get());
    }
}

// ShutdownOnSuccess — return first successful result
String fetchFromAnyMirror(List<String> mirrors) throws Exception {
    try (var scope = new StructuredTaskScope.ShutdownOnSuccess<String>()) {
        for (String mirror : mirrors) {
            scope.fork(() -> download(mirror));
        }
        scope.join();
        return scope.result();
    }
}
```

## Carrier Thread Pinning

Virtual threads run on carrier (platform) threads. Certain operations "pin" the virtual thread to its carrier, preventing other virtual threads from using that carrier.

```java
// BAD — synchronized pins the carrier thread
synchronized (lock) {
    database.query(sql); // blocking I/O while pinned = carrier starvation
}

// GOOD — ReentrantLock does not pin
private final ReentrantLock lock = new ReentrantLock();

void safeQuery(String sql) {
    lock.lock();
    try {
        database.query(sql); // virtual thread can unmount during I/O
    } finally {
        lock.unlock();
    }
}

// Detect pinning in tests/staging
// JVM flag: -Djdk.tracePinnedThreads=full
// This prints stack traces when a virtual thread is pinned
```

## Thread-Local Alternatives

Virtual threads are cheap — thousands may exist simultaneously. Thread-local variables consume memory per virtual thread.

```java
// BAD — thread-local wastes memory across thousands of virtual threads
private static final ThreadLocal<SimpleDateFormat> formatter =
    ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd"));

// GOOD — use scoped values (Preview) for request-scoped data
private static final ScopedValue<RequestContext> CONTEXT = ScopedValue.newInstance();

void handleRequest(Request req) {
    ScopedValue.runWhere(CONTEXT, new RequestContext(req.traceId()), () -> {
        processRequest(); // CONTEXT.get() available in all called methods
    });
}

// GOOD — use immutable thread-safe formatters
private static final DateTimeFormatter FORMATTER =
    DateTimeFormatter.ofPattern("yyyy-MM-dd");
```

## Migration Checklist

When migrating from platform threads to virtual threads:

1. Replace `Executors.newFixedThreadPool(N)` with `Executors.newVirtualThreadPerTaskExecutor()`.
2. Replace `synchronized` blocks around I/O with `ReentrantLock`.
3. Audit thread-local usage — remove or replace with scoped values.
4. Remove thread-pool sizing tuning — virtual threads do not need pool size limits.
5. Keep semaphores for resource bounding (database connections, API rate limits).
6. Run with `-Djdk.tracePinnedThreads=full` to identify remaining pinning.
7. Verify that native libraries called via JNI do not hold monitors during blocking.
