# Coroutine Patterns

## Structured Concurrency

```kotlin
// coroutineScope — parallel decomposition with automatic cancellation
suspend fun loadDashboard(userId: String): Dashboard = coroutineScope {
    val profile = async { userService.getProfile(userId) }
    val orders = async { orderService.getRecent(userId) }
    val notifications = async { notificationService.getUnread(userId) }

    Dashboard(
        profile = profile.await(),
        orders = orders.await(),
        notifications = notifications.await(),
    )
    // If any async fails, all others are cancelled automatically
}

// supervisorScope — child failures don't cancel siblings
suspend fun processBatch(items: List<Item>) = supervisorScope {
    items.map { item ->
        async {
            try {
                processItem(item)
            } catch (e: Exception) {
                logger.error("Failed to process ${item.id}", e)
                null // continue with other items
            }
        }
    }.awaitAll().filterNotNull()
}
```

## Scope Ownership

```kotlin
// Android ViewModel — scope tied to ViewModel lifecycle
class OrderViewModel(
    private val orderRepo: OrderRepository,
) : ViewModel() {

    private val _state = MutableStateFlow<OrderState>(OrderState.Loading)
    val state: StateFlow<OrderState> = _state.asStateFlow()

    fun loadOrders() {
        viewModelScope.launch {
            _state.value = OrderState.Loading
            try {
                val orders = orderRepo.getAll()
                _state.value = OrderState.Success(orders)
            } catch (e: Exception) {
                _state.value = OrderState.Error(e.message ?: "Unknown error")
            }
        }
    }
}

// Server — custom scope with supervisor
class OrderProcessor(
    private val dispatcher: CoroutineDispatcher = Dispatchers.IO,
) : AutoCloseable {
    private val scope = CoroutineScope(SupervisorJob() + dispatcher)

    fun processAsync(order: Order) {
        scope.launch {
            // process order
        }
    }

    override fun close() {
        scope.cancel() // cancel all children on shutdown
    }
}
```

## Dispatcher Selection

```kotlin
// Dispatchers.Main — UI updates (Android only)
// Dispatchers.IO — blocking I/O (network, disk, database)
// Dispatchers.Default — CPU-intensive work (sorting, parsing)
// Dispatchers.Unconfined — runs in caller's thread (testing only)

suspend fun fetchAndParse(url: String): ParsedData {
    val raw = withContext(Dispatchers.IO) {
        httpClient.get(url).bodyAsText() // blocking I/O
    }
    return withContext(Dispatchers.Default) {
        parser.parse(raw) // CPU-intensive
    }
}

// limitedParallelism — bound concurrency
val dbDispatcher = Dispatchers.IO.limitedParallelism(4) // max 4 DB connections

suspend fun queryDatabase(query: String): List<Row> =
    withContext(dbDispatcher) {
        database.execute(query)
    }
```

## Cancellation

```kotlin
// Cooperative cancellation — check isActive in loops
suspend fun processLargeFile(file: File) = withContext(Dispatchers.IO) {
    file.bufferedReader().useLines { lines ->
        for (line in lines) {
            ensureActive() // throws CancellationException if cancelled
            processLine(line)
        }
    }
}

// withTimeout for time-bounded operations
suspend fun fetchWithTimeout(url: String): Response =
    withTimeout(5.seconds) {
        httpClient.get(url)
    }

// withTimeoutOrNull returns null instead of throwing
suspend fun fetchOptional(url: String): Response? =
    withTimeoutOrNull(3.seconds) {
        httpClient.get(url)
    }

// Never catch CancellationException (silently)
// BAD
try {
    suspendingWork()
} catch (e: Exception) { // catches CancellationException!
    log.error("Failed", e)
}

// GOOD
try {
    suspendingWork()
} catch (e: CancellationException) {
    throw e // re-throw cancellation
} catch (e: Exception) {
    log.error("Failed", e)
}

// Or use runCatching carefully
```

## Exception Handling

```kotlin
// CoroutineExceptionHandler at scope boundary
val handler = CoroutineExceptionHandler { _, exception ->
    logger.error("Uncaught coroutine exception", exception)
    metrics.recordError(exception)
}

val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO + handler)

// Per-launch error handling
scope.launch {
    try {
        riskyOperation()
    } catch (e: BusinessException) {
        handleBusinessError(e)
    }
    // CancellationException propagates normally
}
```

## Mutex and Semaphore

```kotlin
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.Semaphore
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.sync.withPermit

// Mutex for coroutine-safe critical sections
class AtomicCounter {
    private val mutex = Mutex()
    private var count = 0

    suspend fun increment() = mutex.withLock { count++ }
    suspend fun get() = mutex.withLock { count }
}

// Semaphore for bounded concurrent access
val rateLimiter = Semaphore(10) // max 10 concurrent requests

suspend fun callApi(request: Request): Response =
    rateLimiter.withPermit {
        httpClient.execute(request)
    }
```
