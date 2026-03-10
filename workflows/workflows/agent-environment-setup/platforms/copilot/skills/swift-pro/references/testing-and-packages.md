# Testing and Packages

## Swift Testing framework

### Basic test structure

```swift
import Testing

@Test("User creation sets default role")
func userCreationDefault() {
    let user = User(name: "Alice")
    #expect(user.role == .viewer)
}

@Test("Deposit increases balance")
func depositIncreasesBalance() async throws {
    let account = BankAccount(balance: 100)
    try await account.deposit(50)
    let balance = await account.balance
    #expect(balance == 150)
}
```

- Use `@Test` attribute with descriptive display names.
- Use `#expect` for assertions — clearer failure messages than XCTest.
- Use `#require` for preconditions that should abort the test on failure.

### Parameterized tests

```swift
@Test("Parse valid integers", arguments: [
    ("42", 42),
    ("-1", -1),
    ("0", 0),
])
func parseValid(input: String, expected: Int) throws {
    let result = try parse(input)
    #expect(result == expected)
}
```

- Use `arguments:` to run the same test logic across multiple inputs.
- Each argument combination runs as a separate test case with individual pass/fail.

### Test organization with suites

```swift
@Suite("User Repository")
struct UserRepositoryTests {
    let repo: MockUserRepository

    init() {
        repo = MockUserRepository()
    }

    @Test func findExistingUser() async throws {
        repo.seed(User(id: 1, name: "Alice"))
        let user = try await repo.find(id: 1)
        #expect(user?.name == "Alice")
    }

    @Test func findMissingReturnsNil() async throws {
        let user = try await repo.find(id: 999)
        #expect(user == nil)
    }
}
```

- `@Suite` groups related tests with shared setup in `init()`.
- Each test gets a fresh instance — no shared mutable state between tests.

### Testing async and actor code

```swift
@Test func actorStateUpdates() async {
    let cache = ImageCache()
    await cache.store(image, forKey: "logo")
    let retrieved = await cache.get("logo")
    #expect(retrieved != nil)
}

// Test expected errors
@Test func withdrawInsufficientFunds() async {
    let account = BankAccount(balance: 50)
    await #expect(throws: BankError.insufficientFunds) {
        try await account.withdraw(100)
    }
}
```

### Confirmation for event-driven behavior

```swift
@Test func notificationFired() async {
    await confirmation("User saved notification") { confirm in
        let observer = NotificationCenter.default.addObserver(
            forName: .userSaved, object: nil, queue: nil
        ) { _ in
            confirm()
        }
        await service.saveUser(user)
        NotificationCenter.default.removeObserver(observer)
    }
}
```

## Dependency injection for tests

### Protocol-based injection

```swift
protocol NetworkClient: Sendable {
    func data(from url: URL) async throws -> (Data, URLResponse)
}

// Production
struct URLSessionClient: NetworkClient {
    func data(from url: URL) async throws -> (Data, URLResponse) {
        try await URLSession.shared.data(from: url)
    }
}

// Test
struct MockNetworkClient: NetworkClient {
    var responses: [URL: (Data, URLResponse)] = [:]

    func data(from url: URL) async throws -> (Data, URLResponse) {
        guard let response = responses[url] else {
            throw URLError(.badURL)
        }
        return response
    }
}

// Injection
class UserService {
    private let network: NetworkClient

    init(network: NetworkClient = URLSessionClient()) {
        self.network = network
    }
}
```

- Inject dependencies through initializer parameters with production defaults.
- Keep mock types simple — only implement what the test needs.
- Avoid mocking frameworks unless the mock implementation becomes complex.

## Package.swift module organization

### Multi-target package

```swift
// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "MyApp",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [
        .library(name: "Domain", targets: ["Domain"]),
        .library(name: "Networking", targets: ["Networking"]),
    ],
    dependencies: [
        .package(url: "https://github.com/apple/swift-algorithms", from: "1.2.0"),
    ],
    targets: [
        // Core domain — no external dependencies
        .target(name: "Domain"),

        // Networking depends on Domain
        .target(name: "Networking", dependencies: ["Domain"]),

        // Tests
        .testTarget(name: "DomainTests", dependencies: ["Domain"]),
        .testTarget(name: "NetworkingTests", dependencies: [
            "Networking",
            .product(name: "Algorithms", package: "swift-algorithms"),
        ]),
    ]
)
```

### Package organization guidelines

- Keep `Domain` (models, protocols, business logic) as a standalone target with zero external dependencies.
- Put I/O, networking, and persistence in separate targets that depend on `Domain`.
- Use `@testable import` only in test targets.
- Pin dependency versions with `.upToNextMinor(from:)` for stability. Use `.upToNextMajor(from:)` only for well-trusted packages.
- Keep `Package.resolved` in version control for applications. Omit it for library packages.
- Use conditional compilation (`#if canImport(UIKit)`) for platform-specific code in multi-platform targets.
