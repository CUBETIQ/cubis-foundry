# Swift Concurrency and Protocols

## Actor design

### When to use actors

```swift
actor BankAccount {
    private var balance: Decimal

    init(initialBalance: Decimal) {
        self.balance = initialBalance
    }

    func deposit(_ amount: Decimal) {
        balance += amount
    }

    func withdraw(_ amount: Decimal) throws -> Decimal {
        guard balance >= amount else {
            throw BankError.insufficientFunds
        }
        balance -= amount
        return amount
    }

    // nonisolated for properties that don't need isolation
    nonisolated var description: String { "BankAccount" }
}
```

- Use `actor` when mutable state needs thread-safe access from multiple callers.
- Actor methods are implicitly `async` when called from outside the actor.
- Use `nonisolated` for computed properties or methods that don't access mutable state.
- Keep actor methods fast — long-running work blocks other callers waiting for the actor.

### Global actors

```swift
@globalActor
actor DatabaseActor {
    static let shared = DatabaseActor()
}

@DatabaseActor
class DatabaseManager {
    func query(_ sql: String) async throws -> [Row] { /* ... */ }
}
```

- Use `@MainActor` for all UI-bound code. Never dispatch to main queue manually.
- Create custom global actors for subsystems that need serial execution (database, file system).
- Annotate classes, methods, or properties — not entire modules.

## Sendable conformance

### Value types (automatic Sendable)

```swift
// Automatically Sendable — all stored properties are Sendable
struct UserDTO: Sendable {
    let id: UUID
    let name: String
    let email: String
}

// Enums with Sendable associated values are Sendable
enum Result<Success: Sendable, Failure: Error>: Sendable {
    case success(Success)
    case failure(Failure)
}
```

### Reference types (manual Sendable)

```swift
// Must prove thread safety manually
final class ThreadSafeCache: @unchecked Sendable {
    private let lock = NSLock()
    private var storage: [String: Any] = [:]

    func get(_ key: String) -> Any? {
        lock.lock()
        defer { lock.unlock() }
        return storage[key]
    }
}
```

- `@unchecked Sendable` requires manual audit — the compiler trusts your claim.
- Prefer actors over `@unchecked Sendable` classes when possible.
- Use `sending` parameter modifier (Swift 6) to transfer ownership without requiring `Sendable`.

### Closure Sendable rules

```swift
// Closure must capture only Sendable values
func runOnBackground(_ work: @Sendable () async -> Void) {
    Task { await work() }
}

// Capture list with Sendable values only
let name = "Alice" // String is Sendable
runOnBackground { [name] in
    print(name) // OK — captured Sendable value
}
```

## Structured concurrency

### TaskGroup

```swift
func fetchAllUsers(ids: [Int]) async throws -> [User] {
    try await withThrowingTaskGroup(of: User.self) { group in
        for id in ids {
            group.addTask {
                try await api.fetchUser(id: id)
            }
        }
        var users: [User] = []
        for try await user in group {
            users.append(user)
        }
        return users
    }
}
```

- Use `TaskGroup` for fan-out/fan-in patterns. Child tasks are automatically cancelled if the group scope exits.
- `withThrowingTaskGroup` propagates the first error and cancels remaining child tasks.

### Task cancellation

```swift
func processItems(_ items: [Item]) async throws {
    for item in items {
        // Check cancellation before each unit of work
        try Task.checkCancellation()
        await process(item)
    }
}

// Or check without throwing
if Task.isCancelled {
    // Clean up and return partial results
    return partialResults
}
```

- Always check `Task.isCancelled` or call `Task.checkCancellation()` in loops.
- Cancellation is cooperative — tasks are not killed automatically.
- Clean up resources in cancellation paths (close files, cancel network requests).

### AsyncSequence and AsyncStream

```swift
// Producing async events
func events() -> AsyncStream<Event> {
    AsyncStream { continuation in
        let observer = NotificationCenter.default.addObserver(...) { notification in
            continuation.yield(Event(from: notification))
        }
        continuation.onTermination = { _ in
            NotificationCenter.default.removeObserver(observer)
        }
    }
}

// Consuming
for await event in events() {
    handle(event)
}
```

## Protocol-oriented architecture

### Protocol as capability contract

```swift
protocol UserRepository {
    func find(id: UUID) async throws -> User?
    func save(_ user: User) async throws
    func delete(id: UUID) async throws
}

// Concrete implementation is internal
struct PostgresUserRepository: UserRepository {
    func find(id: UUID) async throws -> User? { /* ... */ }
    func save(_ user: User) async throws { /* ... */ }
    func delete(id: UUID) async throws { /* ... */ }
}
```

### Protocol extensions for defaults

```swift
protocol Cacheable: Identifiable {
    var cacheKey: String { get }
    var ttl: TimeInterval { get }
}

extension Cacheable {
    var cacheKey: String { "\(Self.self):\(id)" }
    var ttl: TimeInterval { 300 } // 5 minutes default
}
```

- Use extensions for sensible defaults. Keep required methods minimal.

### Opaque vs existential types

```swift
// Opaque: compiler knows the concrete type (zero-cost)
func makeUser() -> some UserRepository {
    PostgresUserRepository()
}

// Existential: runtime type erasure (has boxing overhead)
func getRepository() -> any UserRepository {
    condition ? PostgresUserRepository() : InMemoryUserRepository()
}
```

| Feature                | `some Protocol`                | `any Protocol`                     |
| ---------------------- | ------------------------------ | ---------------------------------- |
| Performance            | Zero-cost (static dispatch)    | Boxing overhead (dynamic dispatch) |
| Can vary return type   | No — always same concrete type | Yes — different types allowed      |
| Use as stored property | Only in generic context        | Yes, directly                      |

- Prefer `some` by default. Use `any` only when you need heterogeneous collections or dynamic type selection.
- Use `any Protocol` in function parameters when multiple concrete types must be accepted.

## Testing with protocols

```swift
@Test
func testUserCreation() async throws {
    let repo = MockUserRepository()
    let service = UserService(repository: repo)

    let user = try await service.createUser(name: "Alice")

    #expect(user.name == "Alice")
    #expect(repo.savedUsers.count == 1)
}

struct MockUserRepository: UserRepository {
    var savedUsers: [User] = []

    mutating func save(_ user: User) async throws {
        savedUsers.append(user)
    }
    // ...
}
```

- Inject protocols, test with mocks. Never test against real databases in unit tests.
- Use Swift Testing `@Test` and `#expect` for new test targets.
- Use `confirmation()` for testing actor-isolated code that emits events.
