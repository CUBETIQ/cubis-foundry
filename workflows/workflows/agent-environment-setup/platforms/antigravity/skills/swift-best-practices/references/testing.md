# Swift Testing Reference

## Swift Testing Framework (Swift 6+)

### Basic test structure

```swift
import Testing

@Test("User creation sets default role")
func userCreationDefaultRole() {
    let user = User(name: "Alice", email: "alice@example.com")

    #expect(user.role == .member)
    #expect(user.isActive)
    #expect(user.createdAt <= Date.now)
}
```

### Parameterized tests

```swift
@Test("Email validation", arguments: [
    ("alice@example.com", true),
    ("bob@test.org", true),
    ("invalid", false),
    ("@no-local.com", false),
    ("no-domain@", false),
    ("", false),
])
func emailValidation(email: String, isValid: Bool) {
    let result = EmailValidator.validate(email)
    #expect(result.isValid == isValid, "Expected \(email) to be \(isValid ? "valid" : "invalid")")
}
```

### Async tests

```swift
@Test("Profile fetch returns cached result on second call")
func profileCachingBehavior() async throws {
    let mockNetwork = MockNetworkClient()
    mockNetwork.responses[profileURL] = .success((profileData, okResponse))

    let service = ProfileService(network: mockNetwork)

    let first = try await service.fetchProfile(id: "123")
    let second = try await service.fetchProfile(id: "123")

    #expect(first == second)
    #expect(mockNetwork.requestCount == 1, "Second call should hit cache")
}
```

### Test suites with shared setup

```swift
@Suite("Order Processing")
struct OrderProcessingTests {
    let repository: MockOrderRepository
    let service: OrderService

    init() {
        repository = MockOrderRepository()
        service = OrderService(repository: repository)
    }

    @Test("Creating order assigns unique ID")
    func createOrderAssignsId() async throws {
        let order = try await service.createOrder(
            items: [.init(productId: "P1", quantity: 2)]
        )
        #expect(!order.id.isEmpty)
    }

    @Test("Cancelling shipped order throws")
    func cancelShippedOrderThrows() async {
        repository.stubOrder = Order(id: "1", status: .shipped)

        await #expect(throws: OrderError.cannotCancel) {
            try await service.cancelOrder(id: "1")
        }
    }
}
```

### Confirmation for callback verification

```swift
@Test("Delegate is notified on completion")
func delegateNotification() async {
    await confirmation("delegate called") { confirm in
        let processor = DataProcessor()
        processor.onComplete = { _ in
            confirm()
        }
        await processor.process(testData)
    }
}
```

## Testing Actor-Isolated Code

### Awaiting actor methods in tests

```swift
@Test("Session store saves and retrieves")
func sessionStoreRoundTrip() async {
    let store = SessionStore()
    let session = Session(userId: "user1", token: "abc")

    await store.store(session, for: "token1")
    let retrieved = await store.retrieve(for: "token1")

    #expect(retrieved?.userId == "user1")
}
```

### Testing @MainActor code

```swift
@Test("ViewModel updates on main actor")
@MainActor
func viewModelUpdate() async {
    let viewModel = HomeViewModel(service: MockHomeService())

    await viewModel.loadData()

    #expect(viewModel.items.count > 0)
    #expect(!viewModel.isLoading)
}
```

## Dependency Injection for Testing

### Protocol-based injection

```swift
protocol TimeProvider: Sendable {
    var now: Date { get }
}

struct SystemTimeProvider: TimeProvider {
    var now: Date { Date() }
}

struct FixedTimeProvider: TimeProvider {
    let fixedDate: Date
    var now: Date { fixedDate }
}

// In production
let service = ExpirationChecker(time: SystemTimeProvider())

// In tests
let fixedTime = Date(timeIntervalSince1970: 1_700_000_000)
let service = ExpirationChecker(time: FixedTimeProvider(fixedDate: fixedTime))
```

### Environment-based injection for SwiftUI

```swift
// Define environment key
struct ImageServiceKey: EnvironmentKey {
    static let defaultValue: any ImageService = CachedImageService()
}

extension EnvironmentValues {
    var imageService: any ImageService {
        get { self[ImageServiceKey.self] }
        set { self[ImageServiceKey.self] = newValue }
    }
}

// Override in tests/previews
#Preview {
    GalleryView()
        .environment(\.imageService, MockImageService())
}
```

## Testing Patterns

### Arrange-Act-Assert

```swift
@Test("Discount applies to eligible orders")
func discountApplication() {
    // Arrange
    let order = Order(
        items: [OrderItem(price: Money(amount: 10000, currency: .usd))],
        customerTier: .premium
    )
    let calculator = DiscountCalculator()

    // Act
    let discounted = calculator.apply(to: order)

    // Assert
    #expect(discounted.total.amount == 9000, "Premium customers get 10% off")
}
```

### Testing error cases

```swift
@Test("Withdrawal from empty account throws InsufficientFunds")
func withdrawalFromEmptyAccount() async {
    let account = BankAccount(balance: Money(amount: 0, currency: .usd))

    await #expect(throws: BankError.insufficientFunds(available: 0, requested: 5000)) {
        try await account.withdraw(Money(amount: 5000, currency: .usd))
    }
}
```

### Testing async sequences

```swift
@Test("Event stream delivers ordered events")
func eventStreamOrdering() async {
    let (stream, continuation) = AsyncStream<Event>.makeStream()

    continuation.yield(.started)
    continuation.yield(.processing)
    continuation.yield(.completed)
    continuation.finish()

    var collected: [Event] = []
    for await event in stream {
        collected.append(event)
    }

    #expect(collected == [.started, .processing, .completed])
}
```

## XCTest Compatibility

Use XCTest for existing test targets. Do not mix XCTest and Swift Testing in the same target.

| Feature | Swift Testing | XCTest |
| --- | --- | --- |
| Test declaration | `@Test func` | `func testXxx()` |
| Assertion | `#expect(condition)` | `XCTAssert(condition)` |
| Async support | Native `async` | `async` (Xcode 13.2+) |
| Parameterized | `arguments:` parameter | Manual loop or override |
| Suite setup | `init()` | `setUp()` / `tearDown()` |
| Throws testing | `#expect(throws:)` | `XCTAssertThrowsError` |

## Test Organization

```
Tests/
├── UnitTests/
│   ├── Models/
│   │   └── OrderTests.swift
│   ├── Services/
│   │   └── PaymentServiceTests.swift
│   └── Mocks/
│       ├── MockNetworkClient.swift
│       └── MockRepository.swift
├── IntegrationTests/
│   └── APIIntegrationTests.swift
└── Helpers/
    ├── TestFixtures.swift
    └── FixedTimeProvider.swift
```

### Package.swift test target

```swift
.testTarget(
    name: "AppTests",
    dependencies: ["App"],
    path: "Tests/UnitTests"
),
```
