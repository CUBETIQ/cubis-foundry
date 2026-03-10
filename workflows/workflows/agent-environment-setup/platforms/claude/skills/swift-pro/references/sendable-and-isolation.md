# Sendable and Isolation

## Sendable conformance checklist

| Type                                                      | Sendable?             | Notes                                             |
| --------------------------------------------------------- | --------------------- | ------------------------------------------------- |
| `struct` with all `Sendable` stored properties            | Automatic             | No annotation needed in most cases.               |
| `enum` with all `Sendable` associated values              | Automatic             | Including cases with no associated values.        |
| `actor`                                                   | Always `Sendable`     | Actors are `Sendable` by definition.              |
| `final class` with immutable `Sendable` stored properties | Explicit              | Must declare `: Sendable` conformance.            |
| `class` with mutable state and manual synchronization     | `@unchecked Sendable` | Requires manual audit of all access paths.        |
| `class` with no synchronization                           | Not Sendable          | Must be redesigned or isolated to a single actor. |

## Isolation boundaries

### Crossing isolation domains

```swift
actor DataStore {
    private var items: [Item] = []

    // Value types cross boundaries safely
    func snapshot() -> [Item] {
        items  // [Item] is Sendable if Item is Sendable
    }
}

// From non-isolated context:
let store = DataStore()
let items = await store.snapshot()  // crosses isolation boundary
```

### The `sending` parameter (Swift 6)

```swift
// Transfer ownership of a non-Sendable value into an actor
func process(_ item: sending Item) async {
    // item is now owned by this isolation domain
    // caller cannot use item after this call
}
```

- `sending` allows passing non-Sendable values across boundaries when ownership is transferred.
- The compiler enforces that the caller does not retain a reference after the call.
- Prefer `sending` over `@unchecked Sendable` when transferring ownership is the real intent.

## Auditing @unchecked Sendable

When marking a class `@unchecked Sendable`, verify:

1. **All mutable state** is protected by a lock, serial queue, or other synchronization mechanism.
2. **No stored property** is a non-Sendable reference type accessed without synchronization.
3. **No method** exposes internal mutable state by reference.
4. **Subclasses** (if any) cannot break the synchronization contract.

```swift
final class AtomicCounter: @unchecked Sendable {
    private let lock = NSLock()
    private var _value: Int = 0

    var value: Int {
        lock.lock()
        defer { lock.unlock() }
        return _value
    }

    func increment() {
        lock.lock()
        defer { lock.unlock() }
        _value += 1
    }
}
```

- Always use `final class` with `@unchecked Sendable` to prevent subclass violations.
- Prefer `OSAllocatedUnfairLock` (iOS 16+/macOS 13+) over `NSLock` for better performance.
- Document the synchronization strategy in a comment next to the conformance.

## Closure isolation

```swift
// @Sendable closure — can only capture Sendable values
func runDetached(_ work: @escaping @Sendable () async -> Void) {
    Task.detached { await work() }
}

// Non-Sendable capture will produce a compiler error
class ViewController {
    var state: [String] = []  // not Sendable

    func bad() {
        runDetached {
            self.state.append("oops")  // ERROR: captured non-Sendable self
        }
    }

    func good() {
        let snapshot = state  // copy to Sendable value
        runDetached { [snapshot] in
            print(snapshot)  // OK — snapshot is Sendable
        }
    }
}
```

- `@Sendable` closures enforce Sendable captures at compile time.
- Capture value copies or Sendable references in the capture list.
- Use `@MainActor in` closure syntax to isolate closures to the main actor.

## Migration strategy

1. Enable `-strict-concurrency=targeted` first to see warnings without breaking the build.
2. Fix `Sendable` conformance for types that cross boundaries (DTOs, config, events).
3. Escalate to `-strict-concurrency=complete` once targeted warnings are resolved.
4. Convert `@unchecked Sendable` uses to proper actors where feasible.
5. Use `sending` parameters to eliminate remaining `@unchecked Sendable` workarounds.
