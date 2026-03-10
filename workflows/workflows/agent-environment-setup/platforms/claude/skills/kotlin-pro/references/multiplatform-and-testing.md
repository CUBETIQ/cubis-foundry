# Multiplatform and Testing

## Kotlin Multiplatform Project Structure

```
shared/
├── build.gradle.kts
├── src/
│   ├── commonMain/kotlin/        # Shared logic
│   │   └── com/example/
│   │       ├── domain/
│   │       │   └── User.kt
│   │       ├── repository/
│   │       │   └── UserRepository.kt
│   │       └── platform/
│   │           └── Platform.kt   # expect declarations
│   ├── commonTest/kotlin/        # Shared tests
│   │   └── UserRepositoryTest.kt
│   ├── androidMain/kotlin/       # Android implementations
│   │   └── com/example/platform/
│   │       └── Platform.android.kt
│   ├── iosMain/kotlin/           # iOS implementations
│   │   └── com/example/platform/
│   │       └── Platform.ios.kt
│   └── jvmMain/kotlin/           # JVM implementations
│       └── com/example/platform/
│           └── Platform.jvm.kt
```

## Expect/Actual Declarations

```kotlin
// commonMain — expect declaration
expect class PlatformLogger() {
    fun log(level: LogLevel, message: String)
}

expect fun currentTimeMillis(): Long

// androidMain — actual implementation
actual class PlatformLogger {
    actual fun log(level: LogLevel, message: String) {
        android.util.Log.println(level.toAndroidPriority(), "App", message)
    }
}

actual fun currentTimeMillis(): Long = System.currentTimeMillis()

// iosMain — actual implementation
actual class PlatformLogger {
    actual fun log(level: LogLevel, message: String) {
        NSLog("[$level] $message")
    }
}

actual fun currentTimeMillis(): Long =
    (NSDate().timeIntervalSince1970 * 1000).toLong()
```

## Cross-Platform Serialization

```kotlin
// kotlinx.serialization — works on all targets
@Serializable
data class User(
    val id: Long,
    val name: String,
    val email: String,
    @SerialName("created_at")
    @Serializable(with = InstantSerializer::class)
    val createdAt: Instant,
)

// JSON configuration
val json = Json {
    ignoreUnknownKeys = true
    isLenient = false
    encodeDefaults = false
    prettyPrint = false
}

val user = json.decodeFromString<User>(jsonString)
val jsonString = json.encodeToString(user)
```

## Coroutine Testing with runTest

```kotlin
import kotlinx.coroutines.test.*

class OrderServiceTest {

    private val testDispatcher = StandardTestDispatcher()
    private val testScope = TestScope(testDispatcher)

    @Test
    fun `getOrder returns order from repository`() = testScope.runTest {
        // Arrange
        val repo = FakeOrderRepository(
            orders = listOf(Order(id = 1, product = "Widget"))
        )
        val service = OrderService(repo, testDispatcher)

        // Act
        val result = service.getOrder(1)

        // Assert
        assertEquals("Widget", result.product)
    }

    @Test
    fun `loadDashboard runs queries in parallel`() = testScope.runTest {
        val repo = SlowFakeRepository(delayMs = 1000)
        val service = DashboardService(repo, testDispatcher)

        val start = currentTime
        service.loadDashboard("user-1")
        val elapsed = currentTime - start

        // Parallel execution: should take ~1000ms, not ~3000ms
        assertTrue(elapsed < 2000, "Expected parallel execution, took $elapsed ms")
    }

    @Test
    fun `timeout cancels operation`() = testScope.runTest {
        val service = SlowService(testDispatcher)

        assertFailsWith<TimeoutCancellationException> {
            withTimeout(1000) {
                service.slowOperation() // takes 5000ms
            }
        }
    }
}
```

## Flow Testing with Turbine

```kotlin
import app.cash.turbine.test

class SearchViewModelTest {

    @Test
    fun `search emits loading then results`() = runTest {
        val viewModel = SearchViewModel(FakeSearchRepo())

        viewModel.state.test {
            // Initial state
            assertEquals(SearchState.Idle, awaitItem())

            // Trigger search
            viewModel.search("kotlin")

            assertEquals(SearchState.Loading, awaitItem())
            val result = awaitItem()
            assertIs<SearchState.Success>(result)
            assertTrue(result.items.isNotEmpty())

            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `debounce skips intermediate queries`() = runTest {
        val repo = FakeSearchRepo()
        val viewModel = SearchViewModel(repo)

        viewModel.state.test {
            awaitItem() // idle

            // Rapid typing
            viewModel.search("k")
            viewModel.search("ko")
            viewModel.search("kot")

            advanceTimeBy(300) // debounce duration

            // Should only search for "kot", not "k" or "ko"
            assertEquals(SearchState.Loading, awaitItem())
            val result = awaitItem()
            assertIs<SearchState.Success>(result)
            assertEquals(1, repo.searchCount) // only one API call

            cancelAndIgnoreRemainingEvents()
        }
    }
}
```

## Test Fakes and Stubs

```kotlin
// Prefer fakes over mocking frameworks for Kotlin
class FakeOrderRepository : OrderRepository {
    private val orders = mutableListOf<Order>()
    var saveCount = 0; private set

    override suspend fun findById(id: Long): Order? =
        orders.find { it.id == id }

    override suspend fun save(order: Order) {
        orders.add(order)
        saveCount++
    }

    // Test helper
    fun seed(vararg seedOrders: Order) {
        orders.addAll(seedOrders)
    }
}

// Use MockK when fakes are impractical
val mockClient = mockk<HttpClient> {
    coEvery { get(any()) } returns Response(200, "OK")
}

coVerify(exactly = 1) { mockClient.get("https://api.example.com/users") }
```

## Static Analysis

```kotlin
// detekt — Kotlin static analysis
// detekt.yml
complexity:
  LongMethod:
    threshold: 30
  ComplexCondition:
    threshold: 4

style:
  ForbiddenComment:
    values: ["TODO", "FIXME", "HACK"]
  MaxLineLength:
    maxLineLength: 120

coroutines:
  GlobalCoroutineUsage:
    active: true
  SuspendFunWithCoroutineScopeReceiver:
    active: true

// Run: ./gradlew detekt
// ktlint for formatting: ./gradlew ktlintCheck
```
