# Testing Reference

## Coroutine Testing with runTest

### Basic runTest Usage

```kotlin
import kotlinx.coroutines.test.*
import kotlin.test.*

class UserServiceTest {

    @Test
    fun `fetches user by id`() = runTest {
        val repository = FakeUserRepository(listOf(testUser))
        val service = UserService(repository)

        val user = service.getUser("user-1")

        assertEquals("Alice", user.name)
    }
}
```

### Virtual Time Control

`runTest` provides virtual time -- `delay()` calls complete instantly unless you control advancement manually.

```kotlin
@Test
fun `retries on transient failure`() = runTest {
    var attempts = 0
    val service = RetryingService(
        fetcher = {
            attempts++
            if (attempts < 3) throw IOException("transient")
            "success"
        },
        retryDelay = 1_000  // 1 second between retries
    )

    val result = service.fetchWithRetry()

    assertEquals("success", result)
    assertEquals(3, attempts)
    // Virtual time: no actual 2 seconds waited
}
```

### TestDispatcher Selection

```kotlin
// StandardTestDispatcher: coroutines do NOT auto-advance.
// You control execution with advanceUntilIdle(), runCurrent(), etc.
@Test
fun `processes in order`() = runTest {
    val dispatcher = StandardTestDispatcher(testScheduler)
    val results = mutableListOf<Int>()

    launch(dispatcher) { results.add(1) }
    launch(dispatcher) { results.add(2) }

    advanceUntilIdle()  // Execute all pending coroutines
    assertEquals(listOf(1, 2), results)
}

// UnconfinedTestDispatcher: coroutines execute eagerly.
// Useful when you want immediate execution without manual advancement.
@Test
fun `emits initial state immediately`() = runTest {
    val dispatcher = UnconfinedTestDispatcher(testScheduler)
    val viewModel = OrderViewModel(dispatcher)

    assertEquals(OrderState.Loading, viewModel.state.value)
}
```

### Injecting Test Dispatchers

```kotlin
// Production code: accept dispatcher as a parameter
class OrderService(
    private val repository: OrderRepository,
    private val dispatcher: CoroutineDispatcher = Dispatchers.IO,
) {
    suspend fun getOrders(): List<Order> = withContext(dispatcher) {
        repository.findAll()
    }
}

// Test: inject test dispatcher
@Test
fun `returns orders from repository`() = runTest {
    val service = OrderService(
        repository = FakeOrderRepository(testOrders),
        dispatcher = UnconfinedTestDispatcher(testScheduler),
    )

    val orders = service.getOrders()

    assertEquals(3, orders.size)
}
```

## Flow Testing with Turbine

### Basic Flow Testing

```kotlin
import app.cash.turbine.test

@Test
fun `emits loading then data`() = runTest {
    val viewModel = OrderViewModel(fakeRepository)

    viewModel.state.test {
        assertEquals(OrderState.Loading, awaitItem())
        assertEquals(OrderState.Loaded(testOrders), awaitItem())
        cancelAndIgnoreRemainingEvents()
    }
}
```

### Testing Flow Errors

```kotlin
@Test
fun `emits error on repository failure`() = runTest {
    val failingRepo = FakeOrderRepository(error = IOException("network error"))
    val viewModel = OrderViewModel(failingRepo)

    viewModel.state.test {
        assertEquals(OrderState.Loading, awaitItem())

        val errorState = awaitItem()
        assertIs<OrderState.Error>(errorState)
        assertEquals("network error", errorState.message)

        cancelAndIgnoreRemainingEvents()
    }
}
```

### Testing Flow Completion

```kotlin
@Test
fun `completes after all items emitted`() = runTest {
    val flow = flowOf(1, 2, 3)

    flow.test {
        assertEquals(1, awaitItem())
        assertEquals(2, awaitItem())
        assertEquals(3, awaitItem())
        awaitComplete()  // Verify the flow completes
    }
}
```

### Testing SharedFlow Events

```kotlin
@Test
fun `emits navigation event on order click`() = runTest {
    val viewModel = OrderListViewModel()

    viewModel.navigationEvents.test {
        viewModel.onOrderClicked("order-1")

        val event = awaitItem()
        assertIs<NavigationEvent.GoToOrderDetail>(event)
        assertEquals("order-1", event.orderId)

        cancelAndIgnoreRemainingEvents()
    }
}
```

## Compose UI Testing

### Setup

```kotlin
// build.gradle.kts
dependencies {
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
```

### Basic Compose Test

```kotlin
class OrderListScreenTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun displaysOrderList() {
        val orders = listOf(
            Order("1", "Order #1", OrderStatus.PENDING),
            Order("2", "Order #2", OrderStatus.SHIPPED),
        )

        composeTestRule.setContent {
            OrderListScreen(orders = orders, onOrderClick = {})
        }

        composeTestRule.onNodeWithText("Order #1").assertIsDisplayed()
        composeTestRule.onNodeWithText("Order #2").assertIsDisplayed()
        composeTestRule.onNodeWithText("PENDING").assertIsDisplayed()
        composeTestRule.onNodeWithText("SHIPPED").assertIsDisplayed()
    }

    @Test
    fun clickOrderTriggersCallback() {
        var clickedId: String? = null
        val orders = listOf(Order("1", "Order #1", OrderStatus.PENDING))

        composeTestRule.setContent {
            OrderListScreen(orders = orders, onOrderClick = { clickedId = it })
        }

        composeTestRule.onNodeWithText("Order #1").performClick()
        assertEquals("1", clickedId)
    }
}
```

### Testing with Semantic Tags

```kotlin
// Production code: add test tags
@Composable
fun OrderCard(order: Order, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .testTag("order_card_${order.id}")
            .clickable(onClick = onClick)
    ) {
        Text(order.title)
        Text(
            text = order.status.label,
            modifier = Modifier.testTag("order_status_${order.id}")
        )
    }
}

// Test: find by test tag
composeTestRule
    .onNodeWithTag("order_card_1")
    .performClick()

composeTestRule
    .onNodeWithTag("order_status_1")
    .assertTextEquals("Pending")
```

## Test Fakes vs Mocks

### Prefer Fakes Over Mocks

```kotlin
// Fake: in-memory implementation of the repository interface
class FakeOrderRepository(
    private val orders: MutableList<Order> = mutableListOf(),
    private val error: Throwable? = null,
) : OrderRepository {

    override fun observeOrders(): Flow<List<Order>> {
        if (error != null) return flow { throw error }
        return MutableStateFlow(orders.toList())
    }

    override suspend fun save(order: Order) {
        orders.add(order)
    }

    override suspend fun findById(id: String): Order? {
        return orders.find { it.id == id }
    }
}

// Benefits over mockk/mockito:
// 1. Catches behavior changes in the interface
// 2. Reusable across many tests
// 3. No mock framework dependency
// 4. Works in commonTest (multiplatform)
```

## Test Organization

```
src/
  commonTest/kotlin/com/example/
    domain/                    # Pure logic tests (run everywhere)
      OrderStateTest.kt
      MoneyTest.kt
    usecase/                   # Use case tests with fakes
      CreateOrderUseCaseTest.kt
    data/
      repository/              # Repository tests with fakes
        OrderRepositoryTest.kt

  androidTest/kotlin/com/example/
    ui/                        # Compose UI tests (require Android)
      OrderListScreenTest.kt
    integration/               # Full integration tests
      OrderFlowTest.kt
```

### Test Naming Convention

```kotlin
// Use backtick names for readable test descriptions
@Test
fun `returns empty list when no orders exist`() = runTest { ... }

@Test
fun `throws UserNotFoundException for unknown user id`() = runTest { ... }

@Test
fun `retries up to 3 times on network failure`() = runTest { ... }
```
