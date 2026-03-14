# Coroutines Reference

## Structured Concurrency Fundamentals

Every coroutine must be launched in a `CoroutineScope` that defines its lifetime. When the scope is cancelled, all child coroutines are cancelled.

### Scope Hierarchy

```kotlin
// viewModelScope (Android) -- cancelled when ViewModel is cleared
class OrderViewModel : ViewModel() {
    fun loadOrders() {
        viewModelScope.launch {
            val orders = repository.fetchOrders()
            _state.value = orders
        }
    }
}

// lifecycleScope (Android) -- cancelled when lifecycle is destroyed
class OrderFragment : Fragment() {
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.state.collect { state -> render(state) }
        }
    }
}

// Custom scope for server-side components
class OrderProcessor : AutoCloseable {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    fun processAsync(order: Order) {
        scope.launch { process(order) }
    }

    override fun close() {
        scope.cancel() // Cancels all child coroutines
    }
}
```

### coroutineScope vs supervisorScope

```kotlin
// coroutineScope: child failure cancels ALL siblings
suspend fun fetchAllOrFail(): Pair<User, List<Order>> = coroutineScope {
    val user = async { userService.getUser(userId) }
    val orders = async { orderService.getOrders(userId) }
    // If either fails, both are cancelled
    user.await() to orders.await()
}

// supervisorScope: child failure does NOT cancel siblings
suspend fun fetchWithPartialResults(): UserProfile = supervisorScope {
    val user = async { userService.getUser(userId) }
    val orders = async {
        try { orderService.getOrders(userId) }
        catch (e: Exception) { emptyList() }  // Graceful degradation
    }
    val prefs = async {
        try { prefsService.getPrefs(userId) }
        catch (e: Exception) { Preferences.defaults() }
    }
    UserProfile(user.await(), orders.await(), prefs.await())
}
```

## Dispatcher Selection

```kotlin
// Dispatchers.Main -- UI thread (Android/Compose Desktop)
withContext(Dispatchers.Main) {
    textView.text = "Updated"
}

// Dispatchers.IO -- blocking I/O (network, disk, JDBC)
// Backed by a thread pool that grows up to 64 threads
withContext(Dispatchers.IO) {
    val data = File("data.json").readText()
    database.query("SELECT * FROM users")
}

// Dispatchers.Default -- CPU-intensive work
// Thread count = number of CPU cores
withContext(Dispatchers.Default) {
    val sorted = largeList.sortedBy { it.score }
    val compressed = compress(payload)
}

// limitedParallelism -- constrained concurrency
val dbDispatcher = Dispatchers.IO.limitedParallelism(10)  // Max 10 DB connections
withContext(dbDispatcher) {
    database.query(sql)
}

// Dispatchers.Unconfined -- resumes in caller's thread (testing only)
// Do not use in production code
```

## Cancellation

### Cooperative Cancellation

```kotlin
// Coroutines are cancelled cooperatively -- they must check for cancellation
suspend fun processItems(items: List<Item>) {
    for (item in items) {
        ensureActive()  // Throws CancellationException if cancelled
        process(item)
    }
}

// Alternative: check isActive
suspend fun processItems(items: List<Item>) = coroutineScope {
    for (item in items) {
        if (!isActive) break
        process(item)
    }
}
```

### Timeout

```kotlin
// withTimeout: throws TimeoutCancellationException
val result = withTimeout(5_000) {
    fetchDataFromApi()
}

// withTimeoutOrNull: returns null instead of throwing
val result = withTimeoutOrNull(5_000) {
    fetchDataFromApi()
} ?: defaultValue
```

### Cleanup in Finally

```kotlin
suspend fun processWithCleanup() {
    val resource = acquireResource()
    try {
        // ... work ...
    } finally {
        // Cleanup must complete even if the coroutine is cancelled
        withContext(NonCancellable) {
            resource.release()  // This runs even during cancellation
        }
    }
}
```

### Never Catch CancellationException

```kotlin
// BAD: swallows cancellation
try {
    fetchData()
} catch (e: Exception) {
    log.error("Failed", e)  // CancellationException is caught here!
    return default
}

// GOOD: rethrow CancellationException
try {
    fetchData()
} catch (e: CancellationException) {
    throw e  // Let cancellation propagate
} catch (e: Exception) {
    log.error("Failed", e)
    return default
}

// GOOD: use runCatching carefully
val result = runCatching { fetchData() }
    .onFailure { if (it is CancellationException) throw it }
    .getOrDefault(default)
```

## Concurrency Patterns

### Parallel Map with Limited Concurrency

```kotlin
suspend fun <T, R> Iterable<T>.parallelMap(
    concurrency: Int = 10,
    transform: suspend (T) -> R,
): List<R> = coroutineScope {
    val semaphore = Semaphore(concurrency)
    map { item ->
        async {
            semaphore.withPermit {
                transform(item)
            }
        }
    }.awaitAll()
}

// Usage
val results = urls.parallelMap(concurrency = 5) { url ->
    httpClient.get(url).body<Response>()
}
```

### Fan-Out / Fan-In with Channels

```kotlin
suspend fun processWithWorkers(items: List<Item>, workerCount: Int = 4) = coroutineScope {
    val channel = Channel<Item>(capacity = Channel.BUFFERED)

    // Fan-out: distribute items to workers
    launch {
        for (item in items) { channel.send(item) }
        channel.close()
    }

    // Fan-in: collect results from workers
    val results = (1..workerCount).map {
        async {
            buildList {
                for (item in channel) {
                    add(processItem(item))
                }
            }
        }
    }.awaitAll().flatten()

    results
}
```

### Mutex for Shared Mutable State

```kotlin
class SafeCounter {
    private val mutex = Mutex()
    private var count = 0

    suspend fun increment() {
        mutex.withLock { count++ }
    }

    suspend fun get(): Int = mutex.withLock { count }
}
```

## Exception Handling

### CoroutineExceptionHandler

```kotlin
// Install at the top-level scope for uncaught exceptions
val handler = CoroutineExceptionHandler { _, exception ->
    log.error("Uncaught coroutine exception", exception)
    metrics.increment("coroutine.uncaught_exception")
}

val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default + handler)

// The handler only catches exceptions from launch, not async.
// async exceptions are delivered when you call await().
```

### Structured Error Propagation

```kotlin
sealed interface ServiceResult<out T> {
    data class Success<T>(val data: T) : ServiceResult<T>
    data class Failure(val error: ServiceError) : ServiceResult<Nothing>
}

sealed interface ServiceError {
    data class NotFound(val id: String) : ServiceError
    data class Timeout(val duration: Duration) : ServiceError
    data class Unavailable(val service: String, val cause: Throwable) : ServiceError
}

suspend fun fetchUser(id: String): ServiceResult<User> {
    return try {
        val user = withTimeout(5_000) {
            withContext(Dispatchers.IO) { userRepository.findById(id) }
        }
        if (user != null) ServiceResult.Success(user)
        else ServiceResult.Failure(ServiceError.NotFound(id))
    } catch (e: CancellationException) {
        throw e
    } catch (e: TimeoutCancellationException) {
        ServiceResult.Failure(ServiceError.Timeout(5.seconds))
    } catch (e: Exception) {
        ServiceResult.Failure(ServiceError.Unavailable("user-service", e))
    }
}
```

## Debug Tooling

```bash
# Enable coroutine debug mode for creation stack traces
java -Dkotlinx.coroutines.debug MyApp

# Coroutine names appear in thread dumps:
# "coroutine#42":StandaloneCoroutine{Active}@7c3df174

# Name coroutines for better debugging
launch(CoroutineName("order-processor")) {
    processOrders()
}
```
