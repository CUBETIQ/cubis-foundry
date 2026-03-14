# Testing Reference (JUnit 5)

## JUnit 5 Core Patterns

### Basic Test Structure

```java
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

class OrderServiceTest {

    private OrderService service;
    private FakeOrderRepository repository;

    @BeforeEach
    void setUp() {
        repository = new FakeOrderRepository();
        service = new OrderService(repository);
    }

    @Test
    @DisplayName("creates order with valid items")
    void createsOrderWithValidItems() {
        var items = List.of(new OrderItem("SKU-1", 2), new OrderItem("SKU-2", 1));

        var order = service.createOrder("user-1", items);

        assertAll(
            () -> assertNotNull(order.id()),
            () -> assertEquals("user-1", order.userId()),
            () -> assertEquals(2, order.items().size()),
            () -> assertEquals(OrderStatus.PENDING, order.status())
        );
    }

    @Test
    @DisplayName("rejects empty order")
    void rejectsEmptyOrder() {
        var exception = assertThrows(
            InvalidOrderException.class,
            () -> service.createOrder("user-1", List.of())
        );
        assertEquals("Order must contain at least one item", exception.getMessage());
    }
}
```

### Nested Test Classes

```java
class PaymentServiceTest {

    @Nested
    @DisplayName("when payment is pending")
    class WhenPending {

        private Payment pending;

        @BeforeEach
        void setUp() {
            pending = Payment.pending("pay-1", Money.of(100, "USD"));
        }

        @Test
        void canBeAuthorized() {
            var authorized = service.authorize(pending, "AUTH-001");
            assertInstanceOf(Payment.Authorized.class, authorized);
        }

        @Test
        void cannotBeRefunded() {
            assertThrows(InvalidTransitionException.class,
                () -> service.refund(pending, Money.of(50, "USD"), "changed mind"));
        }
    }

    @Nested
    @DisplayName("when payment is authorized")
    class WhenAuthorized {
        // Tests specific to the authorized state
    }
}
```

## Parameterized Tests

### CsvSource for Simple Data

```java
@ParameterizedTest
@CsvSource({
    "100.00, USD, $100.00",
    "1234.56, EUR, EUR1,234.56",
    "0.01, GBP, GBP0.01",
})
void formatsMoneyCorrectly(BigDecimal amount, String currency, String expected) {
    var money = new Money(amount, currency);
    assertEquals(expected, money.format());
}
```

### MethodSource for Complex Data

```java
@ParameterizedTest
@MethodSource("invalidTransitions")
void rejectsInvalidStateTransitions(PaymentState from, String action) {
    assertThrows(InvalidTransitionException.class,
        () -> PaymentTransitions.apply(from, action));
}

static Stream<Arguments> invalidTransitions() {
    return Stream.of(
        Arguments.of(Payment.declined("p1", BigDecimal.TEN, "D01", "fraud"), "capture"),
        Arguments.of(Payment.cancelled("p1", BigDecimal.TEN, "admin", Instant.now()), "authorize"),
        Arguments.of(Payment.pending("p1", BigDecimal.TEN, Instant.now()), "refund")
    );
}
```

### EnumSource for Exhaustive State Testing

```java
@ParameterizedTest
@EnumSource(OrderStatus.class)
void everyStatusHasDisplayLabel(OrderStatus status) {
    assertNotNull(status.displayLabel());
    assertFalse(status.displayLabel().isBlank());
}
```

## Testcontainers for Integration Tests

```java
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
class UserRepositoryIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("test")
        .withUsername("test")
        .withPassword("test");

    private UserRepository repository;

    @BeforeEach
    void setUp() {
        var dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(postgres.getJdbcUrl());
        dataSource.setUsername(postgres.getUsername());
        dataSource.setPassword(postgres.getPassword());

        repository = new JdbcUserRepository(dataSource);
        repository.migrate(); // Apply schema
    }

    @Test
    void savesAndRetrievesUser() {
        var user = new User("user-1", "Alice", "alice@example.com");
        repository.save(user);

        var found = repository.findById("user-1");

        assertTrue(found.isPresent());
        assertEquals("Alice", found.get().name());
    }

    @Test
    void returnsEmptyForMissingUser() {
        var found = repository.findById("nonexistent");
        assertTrue(found.isEmpty());
    }
}
```

## Testing Sealed Hierarchies Exhaustively

```java
class ShapeTest {

    // Verify every permitted subtype is handled
    @ParameterizedTest
    @MethodSource("allShapes")
    void areaIsPositiveForAllShapes(Shape shape) {
        double area = Shapes.area(shape);
        assertTrue(area > 0, "Area should be positive for " + shape);
    }

    static Stream<Shape> allShapes() {
        return Stream.of(
            new Circle(5.0),
            new Rectangle(3.0, 4.0),
            new Triangle(6.0, 8.0)
        );
    }

    // If a new Shape subtype is added and not included here,
    // the test still compiles but coverage drops -- pair with
    // exhaustive switch in production code for compile-time safety.
}
```

## Testing Virtual Threads

```java
@Test
void handlesHighConcurrencyWithVirtualThreads() throws Exception {
    var service = new OrderService(new FakeRepository());
    int concurrency = 10_000;

    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        var futures = IntStream.range(0, concurrency)
            .mapToObj(i -> executor.submit(() -> service.process("order-" + i)))
            .toList();

        var results = futures.stream()
            .map(f -> {
                try { return f.get(5, TimeUnit.SECONDS); }
                catch (Exception e) { throw new RuntimeException(e); }
            })
            .toList();

        assertEquals(concurrency, results.size());
        assertTrue(results.stream().allMatch(r -> r.status() == Status.COMPLETED));
    }
}
```

## Testing Structured Concurrency

```java
@Test
void cancelsSubtasksOnFailure() throws Exception {
    var callCount = new AtomicInteger(0);

    try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
        scope.fork(() -> { callCount.incrementAndGet(); throw new RuntimeException("fail"); });
        scope.fork(() -> { Thread.sleep(5_000); callCount.incrementAndGet(); return "slow"; });

        scope.join();

        assertThrows(ExecutionException.class, scope::throwIfFailed);
        // The slow task should have been cancelled before completing
        assertEquals(1, callCount.get());
    }
}
```

## Test Organization

```
src/
  main/java/com/example/
    domain/          # Records, sealed types, value objects
    service/         # Business logic
    infrastructure/  # Database, HTTP clients
    api/             # Controllers, DTOs
  test/java/com/example/
    domain/          # Unit tests (fast, no I/O)
    service/         # Unit tests with fakes
    infrastructure/  # Integration tests with Testcontainers
    api/             # API tests with MockMvc or WebTestClient
```

**Convention**: Test class name mirrors the production class. `OrderService` -> `OrderServiceTest`. Nested classes group by scenario, not by method.
