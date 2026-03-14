# Protocol-Oriented Design Reference

## Protocol Design Principles

### Minimal protocol requirements

Protocols should describe the minimum capability a conforming type must provide. Clients should not be forced to implement methods they do not need.

```swift
// GOOD — focused, composable protocols
protocol Identifiable {
    associatedtype ID: Hashable
    var id: ID { get }
}

protocol Persistable {
    func save(to store: any DataStore) async throws
}

protocol Fetchable {
    static func fetch(id: String, from store: any DataStore) async throws -> Self
}

// BAD — fat protocol forcing unused implementations
protocol CRUDEntity {
    func create() async throws
    func read() async throws -> Self
    func update() async throws
    func delete() async throws
    func validate() throws
    func serialize() -> Data
}
```

### Protocol extensions for default behavior

```swift
protocol Loggable {
    var logDescription: String { get }
}

extension Loggable where Self: CustomStringConvertible {
    var logDescription: String { description }
}

extension Loggable {
    func log(level: LogLevel = .info) {
        Logger.shared.log(level: level, message: logDescription)
    }
}
```

## Opaque Types vs. Existentials

### `some Protocol` — opaque return types

Use `some` when you want to hide the concrete type but the compiler still knows the specific type at compile time. This enables optimizations and preserves associated type information.

```swift
protocol Shape {
    func area() -> Double
}

struct ShapeFactory {
    // Caller doesn't know the concrete type, but it's fixed per call site
    func makeDefault() -> some Shape {
        Circle(radius: 10)
    }

    // Multiple opaque return types can differ
    func makeForSize(_ size: Size) -> some Shape {
        if size.width == size.height {
            return Circle(radius: size.width / 2)
        }
        return Rectangle(width: size.width, height: size.height)
    }
    // ERROR: ^^^ This won't compile because both branches must return the same concrete type

    // Correct: use `any Shape` when the concrete type varies
    func makeForSize(_ size: Size) -> any Shape {
        if size.width == size.height {
            return Circle(radius: size.width / 2)
        }
        return Rectangle(width: size.width, height: size.height)
    }
}
```

### `any Protocol` — existential types

Use `any` when you need heterogeneous collections or runtime polymorphism. Existentials have runtime overhead (heap allocation, dynamic dispatch).

```swift
// Heterogeneous collection requires `any`
let shapes: [any Shape] = [Circle(radius: 5), Rectangle(width: 10, height: 20)]

// Dynamic dispatch through existential
func totalArea(of shapes: [any Shape]) -> Double {
    shapes.reduce(0) { $0 + $1.area() }
}
```

### Performance comparison

| Feature | `some Protocol` | `any Protocol` |
| --- | --- | --- |
| Dispatch | Static (inlined) | Dynamic (vtable) |
| Allocation | Stack (usually) | Heap (for large types) |
| Associated types | Preserved | Erased |
| Collections | Homogeneous only | Heterogeneous OK |
| Use when | Single concrete type | Multiple concrete types |

## Associated Types and Generics

### Protocol with associated type

```swift
protocol Repository {
    associatedtype Entity: Identifiable
    associatedtype Failure: Error

    func findById(_ id: Entity.ID) async throws(Failure) -> Entity?
    func save(_ entity: Entity) async throws(Failure)
    func delete(_ entity: Entity) async throws(Failure)
}

// Concrete implementation fixes the associated types
struct UserRepository: Repository {
    typealias Entity = User
    typealias Failure = DatabaseError

    func findById(_ id: User.ID) async throws(DatabaseError) -> User? { ... }
    func save(_ user: User) async throws(DatabaseError) { ... }
    func delete(_ user: User) async throws(DatabaseError) { ... }
}
```

### Generic constraints

```swift
// Constrain generic parameter to protocol
func merge<S: Sequence>(_ sequences: S...) -> [S.Element] where S.Element: Comparable {
    sequences.flatMap { $0 }.sorted()
}

// Primary associated type (Swift 5.7+) for cleaner syntax
protocol Cache<Key, Value> {
    associatedtype Key: Hashable
    associatedtype Value

    func get(_ key: Key) async -> Value?
    func set(_ key: Key, value: Value) async
}

// Use primary associated types in generics
func preloadCache<C: Cache<String, Data>>(_ cache: C, keys: [String]) async { ... }
```

## Dependency Injection via Protocols

### Constructor injection pattern

```swift
protocol NetworkClient: Sendable {
    func fetch(_ request: URLRequest) async throws -> (Data, URLResponse)
}

extension URLSession: NetworkClient {
    func fetch(_ request: URLRequest) async throws -> (Data, URLResponse) {
        try await data(for: request)
    }
}

// Service depends on protocol, not concrete URLSession
actor ProfileService {
    private let network: any NetworkClient
    private let cache: any Cache<String, Profile>

    init(network: any NetworkClient, cache: any Cache<String, Profile>) {
        self.network = network
        self.cache = cache
    }
}
```

### Test double creation

```swift
final class MockNetworkClient: NetworkClient, @unchecked Sendable {
    var responses: [URL: Result<(Data, URLResponse), Error>] = [:]

    func fetch(_ request: URLRequest) async throws -> (Data, URLResponse) {
        guard let url = request.url, let result = responses[url] else {
            throw URLError(.badURL)
        }
        return try result.get()
    }
}
```

## Protocol Composition

```swift
// Compose protocols for specific requirements
typealias PersistableUser = User & Identifiable & Persistable & Sendable

// Use composition in function signatures
func sync<T: Identifiable & Persistable & Sendable>(_ entities: [T]) async throws {
    for entity in entities {
        try await entity.save(to: remoteStore)
    }
}
```

## Protocol Witness Pattern (Advanced)

When protocol conformance is too rigid (single conformance per type), use a struct that holds closures:

```swift
struct Validator<Value> {
    let validate: (Value) -> [ValidationError]

    static func nonEmpty(for keyPath: KeyPath<Value, String>) -> Validator {
        Validator { value in
            value[keyPath: keyPath].isEmpty
                ? [ValidationError(message: "Must not be empty")]
                : []
        }
    }

    func combined(with other: Validator) -> Validator {
        Validator { value in
            self.validate(value) + other.validate(value)
        }
    }
}
```

## When NOT to Use Protocols

- **Single implementation** — if there is only one conforming type and no testing seam is needed, a concrete type is simpler.
- **Value type behavior** — prefer generic constraints over protocol existentials for value types to preserve stack allocation.
- **Trivial getters** — a protocol with only `var name: String { get }` adds indirection without architectural value. Pass the string directly.
