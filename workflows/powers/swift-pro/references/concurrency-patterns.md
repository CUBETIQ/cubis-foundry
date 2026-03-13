# Concurrency Patterns

## Actor design

### Choosing between actor types

| Pattern               | Use when                                                               |
| --------------------- | ---------------------------------------------------------------------- |
| `actor`               | Mutable state needs thread-safe access from multiple callers.          |
| `@MainActor`          | State or methods are bound to the UI thread.                           |
| Custom `@globalActor` | A subsystem needs serial execution (database, file I/O).               |
| No actor              | The type is immutable or only accessed from a single isolation domain. |

### Actor reentrancy

```swift
actor ImageCache {
    private var cache: [URL: Image] = [:]
    private var inFlight: [URL: Task<Image, Error>] = [:]

    func image(for url: URL) async throws -> Image {
        if let cached = cache[url] { return cached }

        // Coalesce concurrent requests for the same URL
        if let existing = inFlight[url] {
            return try await existing.value
        }

        let task = Task {
            try await downloadImage(url)
        }
        inFlight[url] = task

        let image = try await task.value  // suspension point — state may change
        cache[url] = image
        inFlight[url] = nil
        return image
    }
}
```

- Actor methods can suspend and resume. State may change between suspension points.
- Guard against reentrancy by checking state again after `await` calls.
- Use `inFlight` dictionaries to coalesce duplicate concurrent requests.

## TaskGroup patterns

### Bounded concurrency with TaskGroup

```swift
func processAll(_ items: [Item], concurrency: Int = 10) async throws {
    try await withThrowingTaskGroup(of: Void.self) { group in
        var iterator = items.makeIterator()

        // Seed the group with initial concurrent tasks
        for _ in 0..<min(concurrency, items.count) {
            if let item = iterator.next() {
                group.addTask { try await process(item) }
            }
        }

        // As each task completes, add the next one
        for try await _ in group {
            if let item = iterator.next() {
                group.addTask { try await process(item) }
            }
        }
    }
}
```

### Collecting ordered results

```swift
func fetchAll(ids: [Int]) async throws -> [User] {
    try await withThrowingTaskGroup(of: (Int, User).self) { group in
        for (index, id) in ids.enumerated() {
            group.addTask { (index, try await fetchUser(id)) }
        }

        var results = Array<User?>(repeating: nil, count: ids.count)
        for try await (index, user) in group {
            results[index] = user
        }
        return results.compactMap { $0 }
    }
}
```

- TaskGroup results arrive in completion order, not submission order.
- Use index-based collection when order matters.

## AsyncSequence and AsyncStream

### Building custom AsyncSequence

```swift
struct TickSequence: AsyncSequence {
    typealias Element = Date
    let interval: TimeInterval

    struct AsyncIterator: AsyncIteratorProtocol {
        let interval: TimeInterval
        mutating func next() async -> Date? {
            try? await Task.sleep(for: .seconds(interval))
            return Task.isCancelled ? nil : Date()
        }
    }

    func makeAsyncIterator() -> AsyncIterator {
        AsyncIterator(interval: interval)
    }
}

for await tick in TickSequence(interval: 1.0) {
    print("Tick: \(tick)")
}
```

### AsyncStream with backpressure

```swift
let (stream, continuation) = AsyncStream.makeStream(of: Event.self, bufferingPolicy: .bufferingNewest(10))

// Producer
continuation.yield(.userAction("tap"))
continuation.finish()

// Consumer
for await event in stream {
    await handle(event)
}
```

- Use `.bufferingNewest(n)` to drop old events under backpressure.
- Use `.bufferingOldest(n)` to drop new events (queue semantics).
- Always call `continuation.finish()` when the source completes.
- Set `continuation.onTermination` to clean up resources when the consumer stops.

## MainActor patterns

### Annotation strategies

```swift
// Annotate the entire class for UI-bound types
@MainActor
class ViewModel: ObservableObject {
    @Published var items: [Item] = []

    func load() async {
        let data = await fetchFromNetwork()  // suspends, runs off-main
        items = data  // back on MainActor
    }

    // Opt out for non-UI work
    nonisolated func computeHash() -> String {
        // runs on caller's isolation domain
    }
}
```

- Prefer class-level `@MainActor` for view models and UI controllers.
- Use method-level `@MainActor` for specific entry points in otherwise non-UI types.
- Use `nonisolated` to opt specific methods out of the class-level annotation.
- Never use `DispatchQueue.main.async` in new code — use `@MainActor` instead.
