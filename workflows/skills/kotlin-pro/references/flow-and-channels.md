# Flow and Channels

## StateFlow for Observable State

```kotlin
class SearchViewModel(
    private val searchRepo: SearchRepository,
) : ViewModel() {

    private val _query = MutableStateFlow("")
    val query: StateFlow<String> = _query.asStateFlow()

    val results: StateFlow<List<SearchResult>> = _query
        .debounce(300) // wait 300ms after last keystroke
        .filter { it.length >= 2 } // minimum query length
        .distinctUntilChanged()
        .flatMapLatest { query ->
            flow {
                emit(emptyList()) // clear while loading
                emit(searchRepo.search(query))
            }
        }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000), // stop 5s after last collector
            initialValue = emptyList(),
        )

    fun onQueryChanged(text: String) {
        _query.value = text
    }
}
```

## SharedFlow for Events

```kotlin
// SharedFlow for one-shot events (navigation, snackbar, toast)
class EventBus {
    private val _events = MutableSharedFlow<AppEvent>(
        replay = 0, // no replay — events are consumed once
        extraBufferCapacity = 64,
        onBufferOverflow = BufferOverflow.DROP_OLDEST,
    )
    val events: SharedFlow<AppEvent> = _events.asSharedFlow()

    suspend fun emit(event: AppEvent) = _events.emit(event)
}

// Collect in UI
lifecycleScope.launch {
    repeatOnLifecycle(Lifecycle.State.STARTED) {
        eventBus.events.collect { event ->
            when (event) {
                is ShowSnackbar -> showSnackbar(event.message)
                is NavigateTo -> navigator.navigate(event.route)
            }
        }
    }
}
```

## Flow Operators

```kotlin
// combine — merge multiple state sources
val uiState: StateFlow<UiState> = combine(
    userFlow,
    settingsFlow,
    notificationsFlow,
) { user, settings, notifications ->
    UiState(user, settings, notifications)
}.stateIn(scope, SharingStarted.WhileSubscribed(), UiState.Loading)

// flatMapLatest — switch to new upstream on each emission
val searchResults = searchQuery
    .flatMapLatest { query ->
        if (query.isBlank()) flowOf(emptyList())
        else repository.search(query) // cancels previous search
    }

// map, filter, transform
val activeUsers = userFlow
    .map { users -> users.filter { it.isActive } }
    .distinctUntilChanged()

// onEach for side effects (logging, analytics)
val trackedFlow = dataFlow
    .onEach { data -> analytics.trackView(data.id) }
    .catch { e -> logger.error("Flow error", e) }
```

## Backpressure Strategies

```kotlin
// buffer — decouple producer and consumer speed
sensorReadings
    .buffer(capacity = 64, onBufferOverflow = BufferOverflow.DROP_OLDEST)
    .collect { reading -> process(reading) }

// conflate — drop intermediate values, keep latest
priceUpdates
    .conflate() // skip intermediate prices if consumer is slow
    .collect { price -> updateDisplay(price) }

// collectLatest — cancel processing of old values
searchQuery
    .collectLatest { query ->
        // previous collection is cancelled when new query arrives
        val results = heavySearch(query)
        displayResults(results)
    }

// sample — emit at fixed intervals
mouseMoves
    .sample(16.milliseconds) // ~60fps
    .collect { pos -> updateCursor(pos) }
```

## Channel for Coroutine Communication

```kotlin
// Producer-consumer pattern
val channel = Channel<Task>(capacity = Channel.BUFFERED)

// Producer
launch {
    for (task in tasks) {
        channel.send(task)
    }
    channel.close()
}

// Multiple consumers (fan-out)
repeat(4) { workerId ->
    launch {
        for (task in channel) { // receives until closed
            processTask(workerId, task)
        }
    }
}

// Fan-in — multiple producers, single consumer
suspend fun mergeChannels(
    vararg sources: ReceiveChannel<Event>,
): ReceiveChannel<Event> = produce {
    sources.forEach { source ->
        launch {
            for (event in source) {
                send(event)
            }
        }
    }
}
```

## callbackFlow for Bridging Callbacks

```kotlin
// Convert callback-based API to Flow
fun locationUpdates(): Flow<Location> = callbackFlow {
    val listener = object : LocationListener {
        override fun onLocationChanged(location: Location) {
            trySend(location) // non-suspending send
        }
    }

    locationManager.requestUpdates(listener)

    awaitClose {
        locationManager.removeUpdates(listener) // cleanup on cancel
    }
}

// Usage
locationUpdates()
    .distinctUntilChanged()
    .collect { location ->
        updateMap(location)
    }
```

## Flow Testing

```kotlin
@Test
fun `search emits results after debounce`() = runTest {
    val repo = FakeSearchRepository()
    val viewModel = SearchViewModel(repo)

    viewModel.results.test { // Turbine library
        // Initial value
        assertEquals(emptyList(), awaitItem())

        // Type query
        viewModel.onQueryChanged("kot")
        advanceTimeBy(300) // skip debounce

        assertEquals(emptyList(), awaitItem()) // loading clear
        assertEquals(listOf("Kotlin"), awaitItem()) // results

        cancelAndIgnoreRemainingEvents()
    }
}
```
