# Modern Java Testing

## JUnit 5 Fundamentals

```java
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

class UserServiceTest {

    private UserService service;
    private UserRepository mockRepo;

    @BeforeEach
    void setUp() {
        mockRepo = mock(UserRepository.class);
        service = new UserService(mockRepo);
    }

    @Test
    @DisplayName("creates user with valid email")
    void createsUserWithValidEmail() {
        var request = new CreateUserRequest("alice", "alice@example.com");
        when(mockRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        User result = service.createUser(request);

        assertAll(
            () -> assertEquals("alice", result.name()),
            () -> assertEquals("alice@example.com", result.email()),
            () -> assertNotNull(result.id())
        );
        verify(mockRepo).save(any(User.class));
    }

    @Test
    @DisplayName("rejects duplicate email")
    void rejectsDuplicateEmail() {
        when(mockRepo.existsByEmail("taken@example.com")).thenReturn(true);

        assertThrows(DuplicateEmailException.class, () ->
            service.createUser(new CreateUserRequest("bob", "taken@example.com"))
        );
    }
}
```

## Parameterized Tests

```java
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.*;

class EmailValidatorTest {

    @ParameterizedTest
    @ValueSource(strings = {"user@example.com", "a@b.co", "user+tag@domain.org"})
    void acceptsValidEmails(String email) {
        assertTrue(EmailValidator.isValid(email));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"nope", "@missing.com", "spaces in@here.com"})
    void rejectsInvalidEmails(String email) {
        assertFalse(EmailValidator.isValid(email));
    }

    // CSV source for input/output pairs
    @ParameterizedTest
    @CsvSource({
        "100, USD, $100.00",
        "1500, EUR, €1,500.00",
        "0, GBP, £0.00"
    })
    void formatsMoneyCorrectly(int amount, String currency, String expected) {
        assertEquals(expected, MoneyFormatter.format(amount, currency));
    }

    // Method source for complex test data
    @ParameterizedTest
    @MethodSource("orderScenarios")
    void calculatesShipping(Order order, BigDecimal expectedShipping) {
        assertEquals(expectedShipping, shippingService.calculate(order));
    }

    static Stream<Arguments> orderScenarios() {
        return Stream.of(
            Arguments.of(orderWithTotal(50), new BigDecimal("5.99")),
            Arguments.of(orderWithTotal(100), BigDecimal.ZERO), // free shipping
            Arguments.of(internationalOrder(), new BigDecimal("15.00"))
        );
    }
}
```

## Testcontainers for Integration Tests

```java
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
class UserRepositoryIT {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
        .withDatabaseName("testdb")
        .withInitScript("schema.sql");

    private UserRepository repository;

    @BeforeEach
    void setUp() {
        var dataSource = createDataSource(
            postgres.getJdbcUrl(),
            postgres.getUsername(),
            postgres.getPassword()
        );
        repository = new UserRepository(dataSource);
    }

    @Test
    void persistsAndRetrievesUser() {
        var user = new User("alice", "alice@example.com");
        repository.save(user);

        Optional<User> found = repository.findByEmail("alice@example.com");
        assertTrue(found.isPresent());
        assertEquals("alice", found.get().name());
    }

    @Test
    void returnsEmptyForMissingUser() {
        assertTrue(repository.findByEmail("nobody@example.com").isEmpty());
    }
}
```

## Test Architecture Layers

| Layer           | Tests                                     | Tools                                     | Speed           |
| --------------- | ----------------------------------------- | ----------------------------------------- | --------------- |
| **Unit**        | Business logic, domain models, validators | JUnit 5, Mockito                          | Milliseconds    |
| **Integration** | Repository, external API clients          | Testcontainers, WireMock                  | Seconds         |
| **Slice**       | Controller endpoints, serialization       | Spring `@WebMvcTest`, `@DataJpaTest`      | Seconds         |
| **End-to-end**  | Full application flow                     | `@SpringBootTest`, Testcontainers compose | Tens of seconds |

```java
// UNIT — fast, no I/O
@Test void calculatesDiscount() {
    var order = new Order(List.of(item(100), item(50)));
    assertEquals(new BigDecimal("15.00"), discountService.calculate(order));
}

// SLICE — tests only the web layer
@WebMvcTest(UserController.class)
class UserControllerTest {
    @Autowired MockMvc mvc;
    @MockBean UserService userService;

    @Test void returnsUser() throws Exception {
        when(userService.findById(1L)).thenReturn(Optional.of(testUser()));

        mvc.perform(get("/users/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("alice"));
    }
}
```

## Assertion Best Practices

```java
// assertAll groups related assertions — reports all failures, not just the first
assertAll("user properties",
    () -> assertEquals("alice", user.name()),
    () -> assertEquals("alice@example.com", user.email()),
    () -> assertTrue(user.isActive())
);

// AssertJ for fluent, readable assertions
import static org.assertj.core.api.Assertions.*;

assertThat(users)
    .hasSize(3)
    .extracting(User::name)
    .containsExactlyInAnyOrder("alice", "bob", "charlie");

assertThat(result)
    .isNotNull()
    .satisfies(r -> {
        assertThat(r.status()).isEqualTo(200);
        assertThat(r.body()).contains("success");
    });

// Exception assertions with AssertJ
assertThatThrownBy(() -> service.deleteAdmin())
    .isInstanceOf(ForbiddenException.class)
    .hasMessageContaining("cannot delete admin");
```

## Test Naming and Organization

```java
// Nested tests for grouping scenarios
@Nested
@DisplayName("when user is authenticated")
class WhenAuthenticated {
    @BeforeEach void login() { auth.login(testUser); }

    @Test @DisplayName("can view profile")
    void canViewProfile() { ... }

    @Test @DisplayName("can update settings")
    void canUpdateSettings() { ... }

    @Nested
    @DisplayName("and is an admin")
    class AndIsAdmin {
        @Test @DisplayName("can delete other users")
        void canDeleteOtherUsers() { ... }
    }
}

@Nested
@DisplayName("when user is anonymous")
class WhenAnonymous {
    @Test @DisplayName("is redirected to login")
    void redirectsToLogin() { ... }
}
```

## Virtual Threads in Tests

```java
// Test virtual-thread-based code with real virtual threads
@Test
void handlesVirtualThreadConcurrency() throws Exception {
    var service = new OrderService(testRepo);
    int concurrency = 1000;
    var latch = new CountDownLatch(concurrency);
    var errors = new ConcurrentLinkedQueue<Throwable>();

    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < concurrency; i++) {
            int orderId = i;
            executor.submit(() -> {
                try {
                    service.processOrder(orderId);
                } catch (Throwable t) {
                    errors.add(t);
                } finally {
                    latch.countDown();
                }
            });
        }
        assertTrue(latch.await(30, TimeUnit.SECONDS));
    }

    assertTrue(errors.isEmpty(), "Errors: " + errors);
}
```
