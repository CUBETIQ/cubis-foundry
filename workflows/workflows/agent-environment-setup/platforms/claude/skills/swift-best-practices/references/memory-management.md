# Memory Management Reference

## ARC Fundamentals

Swift uses Automatic Reference Counting (ARC) for class instances. Every strong reference increments the count. When the count reaches zero, the instance is deallocated. ARC is deterministic — deallocation happens immediately, not during a GC pause.

### Reference types and counting

| Reference type | Increments ARC count | Prevents deallocation | Use when |
| --- | --- | --- | --- |
| Strong (default) | Yes | Yes | Ownership — the holder needs the object to exist |
| `weak` | No | No | Optional back-reference; may become nil |
| `unowned` | No | No | Non-optional back-reference; guaranteed to outlive |

## Retain Cycle Prevention

### Closures capture semantics

Closures capture variables by reference by default. When a closure is stored by the object it references, a retain cycle forms.

```swift
// RETAIN CYCLE — closure captures self strongly, self owns closure
class NetworkManager {
    var onComplete: ((Data) -> Void)?

    func start() {
        fetchData { data in
            self.process(data)     // strong capture of self
            self.onComplete?(data) // self -> onComplete -> self
        }
    }
}

// FIX — weak capture
class NetworkManager {
    var onComplete: ((Data) -> Void)?

    func start() {
        fetchData { [weak self] data in
            guard let self else { return }
            self.process(data)
            self.onComplete?(data)
        }
    }
}
```

### When to use `weak` vs. `unowned`

| Use `weak` when | Use `unowned` when |
| --- | --- |
| The captured object may be deallocated first | The captured object is guaranteed to outlive the closure |
| Delegate patterns | Parent-child where child cannot exist without parent |
| Timer callbacks | Immediately-executed closures |
| Stored closures with indeterminate lifetime | Closures with shorter lifetime than the captured object |

```swift
// unowned is safe here: the closure cannot outlive self
class ViewController {
    lazy var titleLabel: UILabel = {
        let label = UILabel()
        label.text = self.title    // implicit strong capture — but lazy var is fine
        return label
    }()
}

// unowned is safe: handler is called and discarded before self could be deallocated
class Animator {
    func animate() {
        UIView.animate(withDuration: 0.3) { [unowned self] in
            self.view.alpha = 1.0
        }
    }
}
```

### Delegate pattern

```swift
protocol DataSourceDelegate: AnyObject {
    func dataSource(_ source: DataSource, didUpdate items: [Item])
}

class DataSource {
    weak var delegate: DataSourceDelegate?  // MUST be weak to break cycle

    func refresh() {
        // ... fetch data ...
        delegate?.dataSource(self, didUpdate: newItems)
    }
}
```

## Value Types vs. Reference Types

### Prefer structs for data

```swift
// GOOD — struct: no ARC overhead, Sendable by default, value semantics
struct OrderLine: Sendable {
    let productId: String
    let quantity: Int
    let unitPrice: Decimal
    var total: Decimal { unitPrice * Decimal(quantity) }
}

// AVOID — class for pure data: ARC overhead, reference semantics, not Sendable
class OrderLine {
    var productId: String
    var quantity: Int
    var unitPrice: Decimal
    // Every assignment, parameter pass, and collection insert increments refcount
}
```

### Copy-on-write for large value types

Swift collections (Array, Dictionary, Set, String) use copy-on-write internally. Custom value types with large storage should implement COW explicitly:

```swift
struct LargeBuffer {
    private final class Storage {
        var data: [UInt8]
        init(data: [UInt8]) { self.data = data }
    }

    private var storage: Storage

    init(size: Int) {
        storage = Storage(data: [UInt8](repeating: 0, count: size))
    }

    var data: [UInt8] {
        get { storage.data }
        set {
            // Copy only if multiple references exist
            if !isKnownUniquelyReferenced(&storage) {
                storage = Storage(data: newValue)
            } else {
                storage.data = newValue
            }
        }
    }
}
```

## Closure Lifetime and Escaping

### Non-escaping closures (default)

Non-escaping closures do not extend the lifetime of captured variables. They execute before the function returns.

```swift
func process(_ items: [Item], filter: (Item) -> Bool) -> [Item] {
    items.filter(filter) // filter is non-escaping, no retain cycle possible
}
```

### Escaping closures

Escaping closures can be stored and called later. They may create retain cycles.

```swift
func fetchData(completion: @escaping (Data) -> Void) {
    URLSession.shared.dataTask(with: url) { data, _, _ in
        if let data { completion(data) }
    }.resume()
}
```

### Sendable closures

Closures crossing isolation boundaries must be `@Sendable`, which restricts captures to Sendable types:

```swift
actor DataProcessor {
    func process(handler: @Sendable @escaping () -> Void) {
        Task {
            handler() // runs in a different isolation context
        }
    }
}
```

## Memory Leak Detection

### Instruments: Leaks and Allocations

1. Profile with **Leaks** instrument to detect cycles in real time.
2. Profile with **Allocations** to track persistent growth (phantom leaks).
3. Use **Memory Graph Debugger** (Xcode) for visual cycle identification.

### Defensive deallocation logging

```swift
class ViewController: UIViewController {
    deinit {
        #if DEBUG
        print("\(type(of: self)) deallocated")
        #endif
    }
}
```

### Common leak sources

| Source | Fix |
| --- | --- |
| Closure stored on self capturing self | `[weak self]` |
| Delegate stored as strong reference | `weak var delegate` |
| Timer retaining target | `Timer.scheduledTimer(withTimeInterval:repeats:block:)` with `[weak self]` |
| NotificationCenter observer | Remove observer in `deinit` or use token-based API |
| KVO observation without invalidation | Store `NSKeyValueObservation` token, cancel in `deinit` |
| Combine publisher subscriptions | Store in `Set<AnyCancellable>`, cleared on dealloc |
| SwiftUI strong ref in closure | Use `.task { }` which auto-cancels on disappear |

## Autorelease Pool

In tight loops creating many temporary objects (e.g., image processing), wrap iterations in `autoreleasepool`:

```swift
func processImages(_ urls: [URL]) {
    for url in urls {
        autoreleasepool {
            let image = loadImage(from: url)
            let processed = applyFilters(to: image)
            save(processed)
            // Temporary allocations are freed at the end of each iteration
        }
    }
}
```

## Actor Isolation and Memory

Actors do not have retain cycle issues with their own methods — actor methods are not closures. However, closures passed to actors can create cycles:

```swift
actor Coordinator {
    private var handler: (() -> Void)?

    // SAFE — no cycle, actor method is not a closure
    func process() { }

    // POTENTIAL CYCLE — if the closure captures something that references this actor
    func setHandler(_ h: @escaping () -> Void) {
        handler = h
    }
}
```

## Unsafe Memory (Advanced)

Use only when profiling proves ARC is a bottleneck:

```swift
// UnsafeBufferPointer for zero-copy iteration
func sum(of buffer: UnsafeBufferPointer<Int>) -> Int {
    buffer.reduce(0, +)
}

// ManagedBuffer for custom allocation strategies
final class PooledBuffer: ManagedBuffer<Int, UInt8> {
    static func create(capacity: Int) -> PooledBuffer {
        let buffer = self.create(minimumCapacity: capacity) { _ in capacity }
        return buffer as! PooledBuffer
    }
}
```

These are escape hatches. Prefer standard value types and ARC-managed classes for all normal code paths.
