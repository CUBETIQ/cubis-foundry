# Protocol and Generics

## Protocol design principles

### Minimal protocol requirements

```swift
// Good — focused contract
protocol Identifiable {
    associatedtype ID: Hashable
    var id: ID { get }
}

// Bad — too many requirements force unnecessary implementations
protocol DataSource {
    func count() -> Int
    func item(at: Int) -> Any
    func add(_ item: Any)       // not all data sources are mutable
    func remove(at: Int)        // not all data sources support removal
}
```

- Define the smallest set of requirements that captures the abstraction.
- Split large protocols into composable pieces (`Readable`, `Writable` instead of `ReadWriteStore`).
- Use protocol extensions for default implementations of non-essential behavior.

### Protocol composition

```swift
typealias UserStore = Identifiable & Codable & Sendable

func save<T: Identifiable & Encodable>(_ item: T) throws {
    let data = try JSONEncoder().encode(item)
    try storage.write(data, forKey: "\(T.ID.self):\(item.id)")
}
```

- Use `&` composition to combine protocols at use sites instead of creating combined protocols.
- Use `typealias` for frequently used compositions.

## Opaque types (`some`)

```swift
// Return type is known to the compiler, hidden from callers
func makeParser() -> some Parser {
    JSONParser()  // concrete type is fixed
}

// In SwiftUI — the canonical use case
var body: some View {
    VStack {
        Text("Hello")
        Button("Tap") { action() }
    }
}
```

- `some Protocol` preserves type identity — the compiler tracks the concrete type at compile time.
- Zero runtime overhead compared to existentials.
- Cannot return different concrete types from different code paths.
- Use `some` in return types and stored properties when the caller doesn't need to know the concrete type.

## Existential types (`any`)

```swift
// Dynamic dispatch — concrete type resolved at runtime
var repositories: [any Repository] = [
    PostgresRepository(),
    InMemoryRepository(),
]

func process(repo: any Repository) {
    // uses dynamic dispatch
}
```

- `any Protocol` has boxing overhead: heap allocation for the existential container.
- Required when you need heterogeneous collections of protocol-conforming types.
- Required when the concrete type varies at runtime.
- Cannot use protocols with `Self` requirements or associated types directly as `any` (use type erasure or constrained generics).

### Opening existentials

```swift
func processAny(_ item: any Identifiable) {
    // Swift 5.7+ can "open" existentials into generics
    process(item)  // calls the generic version below
}

func process<T: Identifiable>(_ item: T) {
    print(item.id)
}
```

## Associated types

```swift
protocol Collection {
    associatedtype Element
    associatedtype Index: Comparable

    var startIndex: Index { get }
    var endIndex: Index { get }
    subscript(position: Index) -> Element { get }
}
```

- Use associated types when the protocol needs to express relationships between types.
- Add constraints to associated types (`associatedtype Element: Sendable`) to propagate requirements.
- Use `where` clauses for complex constraints:

```swift
extension Collection where Element: Equatable {
    func contains(_ element: Element) -> Bool {
        // ...
    }
}
```

## Generic constraint patterns

### Constrained extensions

```swift
extension Array where Element: Numeric {
    var sum: Element {
        reduce(.zero, +)
    }
}

extension Sequence where Element: Hashable {
    var unique: [Element] {
        var seen = Set<Element>()
        return filter { seen.insert($0).inserted }
    }
}
```

### Generic type with constraints

```swift
struct Cache<Key: Hashable & Sendable, Value: Sendable> {
    private var storage: [Key: Value] = [:]

    mutating func set(_ value: Value, forKey key: Key) {
        storage[key] = value
    }

    func get(_ key: Key) -> Value? {
        storage[key]
    }
}
```

### Primary associated types (Swift 5.7+)

```swift
protocol Repository<Model> {
    associatedtype Model: Identifiable

    func find(id: Model.ID) async throws -> Model?
    func save(_ model: Model) async throws
}

// Use in constrained contexts without full generic signatures
func processRepo(_ repo: some Repository<User>) async throws {
    let user = try await repo.find(id: userID)
}
```

- Primary associated types simplify common generic usage with `some Protocol<ConcreteType>` syntax.
- Reduces the need for manual type erasure wrappers.
