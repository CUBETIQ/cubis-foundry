# Testing

## Test Slice Annotations

Spring Boot provides "slice" annotations that load only the relevant part of the application context, drastically reducing test startup time.

| Annotation | What It Loads | Use For |
|-----------|---------------|---------|
| `@WebMvcTest` | Controllers, filters, converters, security | REST controller tests with MockMvc |
| `@WebFluxTest` | Reactive controllers, WebFlux config | Reactive endpoint tests with WebTestClient |
| `@DataJpaTest` | JPA repos, Hibernate, DataSource | Repository and query tests |
| `@JsonTest` | Jackson ObjectMapper | JSON serialization/deserialization |
| `@SpringBootTest` | Full application context | Integration and E2E tests |

## @WebMvcTest

Tests a single controller with mocked service dependencies.

```java
@WebMvcTest(ProductController.class)
@Import(SecurityConfig.class)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductService productService;

    @Test
    void listProducts_returns200WithProducts() throws Exception {
        var product = new ProductResponse(1L, "Widget", "WDG-001", null,
            BigDecimal.valueOf(9.99), 100, Instant.now(), Instant.now());
        when(productService.findAll()).thenReturn(List.of(product));

        mockMvc.perform(get("/api/products")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$[0].name").value("Widget"))
            .andExpect(jsonPath("$[0].price").value(9.99));
    }

    @Test
    void createProduct_invalidBody_returns400() throws Exception {
        mockMvc.perform(post("/api/products")
                .with(jwt().jwt(j -> j.claim("roles", List.of("ADMIN"))))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name": "", "sku": "", "price": -1}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors").isNotEmpty());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createProduct_validBody_returns201() throws Exception {
        var response = new ProductResponse(1L, "Widget", "WDG-001", null,
            BigDecimal.valueOf(9.99), 100, Instant.now(), Instant.now());
        when(productService.create(any())).thenReturn(response);

        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name": "Widget", "sku": "WDG-001", "price": 9.99, "stockQuantity": 100}
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.name").value("Widget"));
    }
}
```

### MockMvc Cheat Sheet

```java
// GET with query params
mockMvc.perform(get("/api/products")
    .param("category", "electronics")
    .param("page", "0")
    .param("size", "20"))

// POST with JSON body
mockMvc.perform(post("/api/products")
    .contentType(MediaType.APPLICATION_JSON)
    .content(objectMapper.writeValueAsString(request)))

// With authentication
mockMvc.perform(get("/api/profile")
    .with(jwt().jwt(j -> j.claim("sub", "user-1"))))

// With mock user
mockMvc.perform(get("/api/admin").with(user("admin").roles("ADMIN")))

// Assert response
.andExpect(status().isOk())
.andExpect(header().string("X-Custom", "value"))
.andExpect(jsonPath("$.items", hasSize(3)))
.andExpect(jsonPath("$.total").isNumber())
.andExpect(content().string(containsString("Widget")))
```

## @DataJpaTest

Tests JPA repositories with a real database (H2 by default, or Testcontainers).

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class ProductRepositoryTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
        .withDatabaseName("testdb");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void findByNameContaining_returnsMatchingProducts() {
        entityManager.persist(new Product("Blue Widget", "BW-001", BigDecimal.TEN));
        entityManager.persist(new Product("Red Widget", "RW-001", BigDecimal.ONE));
        entityManager.persist(new Product("Green Gadget", "GG-001", BigDecimal.TEN));
        entityManager.flush();

        var results = productRepository.findByNameContainingIgnoreCase("widget");

        assertThat(results).hasSize(2);
        assertThat(results).extracting(Product::getName)
            .containsExactlyInAnyOrder("Blue Widget", "Red Widget");
    }

    @Test
    void derivedDeleteByStatus_removesMatchingEntities() {
        var product = entityManager.persist(new Product("Old", "OLD-001", BigDecimal.ZERO));
        product.setStatus("DISCONTINUED");
        entityManager.flush();

        productRepository.deleteByStatus("DISCONTINUED");
        entityManager.flush();
        entityManager.clear();

        assertThat(productRepository.findById(product.getId())).isEmpty();
    }
}
```

## @SpringBootTest

Loads the full application context. Use for integration tests that need multiple layers.

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class OrderIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @DynamicPropertySource
    static void configure(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void createAndRetrieveOrder() {
        var request = new OrderRequest("customer-1", List.of(
            new OrderItem("product-1", 2)
        ));

        var createResponse = restTemplate
            .withBasicAuth("admin", "password")
            .postForEntity("/api/orders", request, OrderResponse.class);

        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(createResponse.getBody().id()).isNotNull();

        var getResponse = restTemplate
            .withBasicAuth("admin", "password")
            .getForEntity("/api/orders/" + createResponse.getBody().id(), OrderResponse.class);

        assertThat(getResponse.getBody().status()).isEqualTo("PENDING");
    }
}
```

## WebTestClient for Reactive Tests

```java
@WebFluxTest(MetricsController.class)
@Import(SecurityConfig.class)
class MetricsControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    private MetricsService metricsService;

    @Test
    @WithMockUser
    void streamMetrics_returnsEventStream() {
        var event = new MetricEvent("cpu", 72.5, "percent", Instant.now());
        when(metricsService.streamMetrics("cpu")).thenReturn(Flux.just(event));

        webTestClient.get()
            .uri("/api/metrics/stream/cpu")
            .accept(MediaType.TEXT_EVENT_STREAM)
            .exchange()
            .expectStatus().isOk()
            .expectHeader().contentTypeCompatibleWith(MediaType.TEXT_EVENT_STREAM)
            .expectBodyList(MetricEvent.class)
            .hasSize(1);
    }

    @Test
    void streamMetrics_noAuth_returns401() {
        webTestClient.get()
            .uri("/api/metrics/stream/cpu")
            .exchange()
            .expectStatus().isUnauthorized();
    }
}
```

## Test Fixtures and Factories

```java
public class TestFixtures {

    public static Product product() {
        return product("Widget", "WDG-001", BigDecimal.TEN);
    }

    public static Product product(String name, String sku, BigDecimal price) {
        var product = new Product();
        product.setName(name);
        product.setSku(sku);
        product.setPrice(price);
        product.setStockQuantity(100);
        return product;
    }

    public static ProductRequest productRequest() {
        return new ProductRequest("Widget", "WDG-001", "A widget", BigDecimal.TEN, 100);
    }
}
```

## Common Testing Pitfalls

| Pitfall | Problem | Fix |
|---------|---------|-----|
| Missing `@Import(SecurityConfig.class)` | Security not applied in slice test | Import explicitly |
| Using H2 for PostgreSQL features | Tests pass, prod fails | Use Testcontainers |
| Missing `entityManager.flush()` | Changes not written to DB | Flush before assertions |
| `@MockBean` on wrong layer | Service mock doesn't apply | Match the bean the controller injects |
| No `@Transactional` rollback | Test data leaks between tests | `@DataJpaTest` auto-rolls back; `@SpringBootTest` needs explicit cleanup |
