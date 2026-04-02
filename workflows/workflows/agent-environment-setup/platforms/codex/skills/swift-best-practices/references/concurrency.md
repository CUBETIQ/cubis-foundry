# Swift Concurrency Reference

## Actor Design Patterns

### When to use actors

Use `actor` when a type holds mutable state that multiple tasks access concurrently. Actors serialize access automatically — no locks, no data races.

```swift
actor SessionStore {
    private var sessions: [String: Session] = [:]

    func store(_ session: Session, for token: String) {
        sessions[token] = session
    }

    func retrieve(for token: String) -> Session? {
        sessions[token]
    }

    func removeExpired(before date: Date) -> Int {
        let expired = sessions.filter { $0.value.expiresAt < date }
        for key in expired.keys { sessions[key] = nil }
        return expired.count
    }
}
```

### Actor reentrancy

Actor methods are reentrant by default — if you `await` inside an actor method, other calls can execute between suspension and resumption. This means state may change across an `await`.

```swift
actor Cache {
    private var entries: [String: Data] = [:]

    func fetchOrLoad(key: String, loader: () async throws -> Data) async throws -> Data {
        // Check cache before await
        if let cached = entries[key] { return cached }

        let data = try await loader()

        // Check again after await — another call may have populated it
        if let cached = entries[key] { return cached }
        entries[key] = data
        return data
    }
}
```

### Global actors

Use `@MainActor` at the type level for UI-bound classes. Use custom global actors for subsystem isolation.

```swift
@globalActor
actor DatabaseActor {
    static let shared = DatabaseActor()
}

@DatabaseActor
final class MigrationRunner {
    func runPendingMigrations() async throws {
        // Guaranteed to run on the DatabaseActor's executor
    }
}
```

## Structured Concurrency

### TaskGroup for parallel work

```swift
func fetchAllProfiles(ids: [UserID]) async throws -> [UserID: Profile] {
    try await withThrowingTaskGroup(
        of: (UserID, Profile).self,
        returning: [UserID: Profile].self
    ) { group in
        for id in ids {
            group.addTask {
                let profile = try await self.api.fetchProfile(id)
                return (id, profile)
            }
        }

        var results: [UserID: Profile] = [:]
        for try await (id, profile) in group {
            results[id] = profile
        }
        return results
    }
}
```

### Cancellation propagation

```swift
func processLargeDataset(_ items: [Item]) async throws {
    try await withThrowingTaskGroup(of: Void.self) { group in
        for item in items {
            // Check cancellation before starting new work
            try Task.checkCancellation()

            group.addTask {
                try await self.process(item)
            }

            // Limit concurrency to avoid overwhelming resources
            if group.isFull(maximumConcurrency: 10) {
                try await group.next()
            }
        }
    }
}
```

### Task lifecycle

| Construct | Cancellation | Lifetime | Use when |
| --- | --- | --- | --- |
| `Task { }` | Manual | Inherits actor isolation | Fire-and-forget from actor |
| `Task.detached { }` | Manual | No inherited context | Background work, different priority |
| `TaskGroup` | Auto on scope exit | Scoped to `with...` block | Parallel fan-out |
| `.task { }` modifier | Auto on view disappear | Tied to SwiftUI view | View lifecycle work |

## AsyncSequence and AsyncStream

### AsyncStream.makeStream factory (Swift 5.9+)

```swift
struct EventSource {
    static func events() -> (stream: AsyncStream<Event>, continuation: AsyncStream<Event>.Continuation) {
        AsyncStream<Event>.makeStream()
    }
}

// Usage: separate stream from continuation for cleaner architecture
let (stream, continuation) = EventSource.events()

// Producer side (e.g., in an actor)
continuation.yield(Event(type: .connected))

// Consumer side
for await event in stream {
    handleEvent(event)
}
```

### AsyncThrowingStream for fallible sequences

```swift
func databaseChanges(query: String) -> AsyncThrowingStream<Row, Error> {
    AsyncThrowingStream { continuation in
        let listener = database.listen(query) { result in
            switch result {
            case .success(let row):
                continuation.yield(row)
            case .failure(let error):
                continuation.finish(throwing: error)
            }
        }

        continuation.onTermination = { @Sendable _ in
            listener.cancel()
        }
    }
}
```

### Buffering strategy

```swift
// Back-pressure: oldest items dropped when buffer is full
let (stream, continuation) = AsyncStream<SensorReading>.makeStream(
    bufferingPolicy: .bufferingOldest(100)
)
```

## Sendable Safety Checklist

| Type | Sendable by default? | Action needed |
| --- | --- | --- |
| `struct` with all Sendable properties | Yes | None |
| `enum` with all Sendable payloads | Yes | None |
| `actor` | Yes | None |
| `final class` with `let` properties | No | Add `: Sendable` conformance |
| `class` with mutable state | No | Use `@unchecked Sendable` + document sync |
| Closure crossing isolation | No | Capture only Sendable values |

### The `sending` keyword (Swift 6)

```swift
// Transfer ownership of a non-Sendable value into another isolation domain
func process(sending item: NonSendableItem) async {
    // The compiler verifies the caller gives up access to `item`
}
```

## Common Anti-patterns

**Mixing DispatchQueue with async/await:**
```swift
// BAD — causes priority inversion and potential deadlocks
DispatchQueue.main.async {
    Task {
        await viewModel.load()
    }
}

// GOOD — use MainActor annotation
@MainActor func load() async { ... }
```

**Blocking actor with synchronous work:**
```swift
// BAD — blocks the actor's executor
actor Processor {
    func process(_ data: Data) -> Result {
        Thread.sleep(forTimeInterval: 5) // Blocks all other actor calls
        return heavyComputation(data)
    }
}

// GOOD — offload to detached task
actor Processor {
    func process(_ data: Data) async -> Result {
        await Task.detached(priority: .userInitiated) {
            heavyComputation(data)
        }.value
    }
}
```
