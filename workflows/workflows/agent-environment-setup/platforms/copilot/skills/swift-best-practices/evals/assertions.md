# Swift Best Practices — Eval Assertions

## Eval 1: Actor-Based Service Design

Tests whether the agent produces correct Swift 6 actor-based architecture for a network service.

### Assertions

1. **uses-actor-for-shared-state** — The service uses `actor` (not `class` with manual locks or DispatchQueue) for managing mutable shared state. Actors provide compiler-enforced isolation. Look for `actor NetworkService` or similar declaration with mutable properties inside the actor body.

2. **protocol-based-interface** — A protocol (e.g., `protocol UserProfileService`) defines the async throwing contract. The actor conforms to this protocol. This enables dependency injection in consumers and allows test doubles without subclassing. Reject code that exposes the concrete actor type directly to consumers.

3. **cancellation-propagation** — The code demonstrates cancellation awareness: either `Task.isCancelled` checks in loops, `try Task.checkCancellation()` calls, or `withThrowingTaskGroup` usage where child tasks are automatically cancelled when the group scope exits. Reject code that ignores cancellation entirely.

4. **typed-throws-and-sendable** — Error handling uses a specific error enum (e.g., `enum NetworkError: Error`) and typed throws syntax (`throws(NetworkError)`) if targeting Swift 6.0+. All types passed across actor isolation boundaries (parameters and return types of actor methods) conform to `Sendable`. Reject code using untyped `throws` with `NSError` or stringly-typed errors.

5. **async-stream-or-sequence** — All asynchronous patterns use `async`/`await`, `AsyncSequence`, or `AsyncStream`. No completion handlers, no `DispatchQueue.global().async`, no callback-based patterns in new code. Legacy patterns indicate the agent is not following Swift 6 idioms.

---

## Eval 2: SwiftUI State Management Migration

Tests whether the agent correctly migrates from ObservableObject to @Observable with proper SwiftUI data flow.

### Assertions

1. **observable-macro-adoption** — The cart model uses `@Observable class Cart` instead of `class Cart: ObservableObject`. Properties are plain `var` stored properties, not annotated with `@Published`. The `@Observable` macro automatically tracks access and mutations. Reject code that mixes `@Observable` with `@Published`.

2. **state-and-environment-usage** — The view uses `@State` to own a local `@Observable` object, or receives shared state through `@Environment`. It does NOT use `@StateObject` or `@ObservedObject`, which are the old ObservableObject-era property wrappers. Accept `@Bindable` for creating bindings from `@Observable` properties.

3. **pure-view-bodies** — The `var body: some View` computed property contains only view declarations. Side effects like saving to disk, network calls, or logging are in `.task { }` modifiers, `.onChange` modifiers, or explicit action closures (e.g., `Button("Save") { cart.save() }`). Reject code that performs I/O directly in the body computation.

4. **parent-child-data-flow** — Data flows downward through initializer parameters or `@Environment`. Child views that need two-way binding use `@Bindable var cart: Cart` to create `$cart.propertyName` bindings. Reject code where child views independently fetch or create their own state objects.

5. **value-types-and-immutability** — Individual cart items (e.g., `CartItem`) are modeled as `struct` with value semantics. The `Cart` container is a class (required for `@Observable`) but its contents prefer value types. This ensures items are `Sendable` by default and safe to pass between views without reference-counting overhead.
