# Reactive Patterns

## When to Use WebFlux vs. Servlet

| Factor | WebFlux (Reactive) | Servlet (MVC) |
|--------|-------------------|---------------|
| I/O pattern | Non-blocking throughout | Blocking or virtual threads |
| Thread model | Small event loop pool (Netty) | Thread-per-request |
| Database | R2DBC, reactive MongoDB | JPA/JDBC (blocking) |
| HTTP client | WebClient | RestClient / RestTemplate |
| Security | SecurityWebFilterChain | SecurityFilterChain |
| Testing | WebTestClient | MockMvc |

**Rule: Do not mix blocking calls into a reactive pipeline.** A single `Thread.sleep()` or JDBC call in a reactive chain blocks a Netty event loop thread, degrading throughput for all requests. If you need blocking I/O, use servlet + virtual threads instead.

## Mono and Flux

```java
// Mono: 0 or 1 element
Mono<User> findById(String id);
Mono<Void> delete(String id);

// Flux: 0 to N elements
Flux<Product> findAll();
Flux<MetricEvent> streamMetrics();
```

### Creation

```java
Mono.just(value)                    // Wrap existing value
Mono.empty()                        // Empty signal
Mono.error(new NotFoundException()) // Error signal
Mono.defer(() -> ...)               // Lazy evaluation per subscriber
Mono.fromCallable(() -> blocking()) // Wrap blocking call (runs on scheduler)

Flux.just(a, b, c)                  // From varargs
Flux.fromIterable(list)             // From collection
Flux.interval(Duration.ofSeconds(1))// Tick every second
Flux.range(1, 10)                   // 1 through 10
Flux.concat(flux1, flux2)           // Sequential
Flux.merge(flux1, flux2)            // Interleaved
```

### Key Operators

```java
// Transform
flux.map(item -> transform(item))
flux.flatMap(item -> asyncOperation(item))  // Concurrency: 256 default
flux.flatMap(item -> asyncOp(item), 16)     // Limit concurrency

// Filter
flux.filter(item -> item.isActive())
flux.distinct()
flux.take(10)
flux.skip(5)

// Error handling
mono.onErrorResume(ex -> fallbackMono())
flux.onErrorContinue((ex, item) -> log.warn("Skipping {}", item))
mono.retry(3)
mono.retryWhen(Retry.backoff(3, Duration.ofSeconds(1)))

// Combine
Mono.zip(mono1, mono2, (a, b) -> new Combined(a, b))
Flux.zip(flux1, flux2).map(tuple -> merge(tuple.getT1(), tuple.getT2()))

// Side effects
flux.doOnNext(item -> log.debug("Processing {}", item))
flux.doOnError(ex -> log.error("Error", ex))
flux.doOnComplete(() -> log.info("Stream complete"))
```

## WebFlux Controller

```java
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public Flux<ProductResponse> listProducts() {
        return productService.findAll();
    }

    @GetMapping("/{id}")
    public Mono<ProductResponse> getProduct(@PathVariable String id) {
        return productService.findById(id)
            .switchIfEmpty(Mono.error(new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Product not found")));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ProductResponse> createProduct(@Valid @RequestBody Mono<ProductRequest> request) {
        return request.flatMap(productService::create);
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ProductEvent> streamProducts() {
        return productService.streamUpdates();
    }
}
```

## WebClient

### Configuration

```java
@Configuration
public class WebClientConfig {

    @Bean
    public WebClient webClient(WebClient.Builder builder) {
        return builder
            .baseUrl("https://api.example.com")
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .filter(ExchangeFilterFunctions.basicAuthentication("user", "pass"))
            .codecs(configurer -> configurer
                .defaultCodecs()
                .maxInMemorySize(16 * 1024 * 1024))  // 16MB buffer
            .build();
    }
}
```

### Usage Patterns

```java
@Service
public class ExternalApiService {

    private final WebClient webClient;

    public ExternalApiService(WebClient webClient) {
        this.webClient = webClient;
    }

    // GET with response mapping
    public Mono<ExternalData> fetchData(String id) {
        return webClient.get()
            .uri("/data/{id}", id)
            .retrieve()
            .bodyToMono(ExternalData.class)
            .timeout(Duration.ofSeconds(5))
            .onErrorResume(WebClientResponseException.NotFound.class,
                ex -> Mono.empty());
    }

    // POST with error handling
    public Mono<CreateResponse> createResource(CreateRequest request) {
        return webClient.post()
            .uri("/resources")
            .bodyValue(request)
            .retrieve()
            .onStatus(HttpStatusCode::is4xxClientError, response ->
                response.bodyToMono(ErrorResponse.class)
                    .flatMap(err -> Mono.error(new BusinessException(err.message()))))
            .bodyToMono(CreateResponse.class);
    }

    // Streaming response
    public Flux<Event> streamEvents() {
        return webClient.get()
            .uri("/events/stream")
            .accept(MediaType.TEXT_EVENT_STREAM)
            .retrieve()
            .bodyToFlux(Event.class);
    }
}
```

## R2DBC (Reactive Database)

### Configuration

```yaml
spring:
  r2dbc:
    url: r2dbc:postgresql://localhost:5432/mydb
    username: ${DB_USER}
    password: ${DB_PASSWORD}
    pool:
      initial-size: 5
      max-size: 20
      max-idle-time: 30m
```

### Repository

```java
public interface ProductRepository extends ReactiveCrudRepository<Product, Long> {

    Flux<Product> findByCategory(String category);

    @Query("SELECT * FROM products WHERE price BETWEEN :min AND :max ORDER BY name")
    Flux<Product> findByPriceRange(@Param("min") BigDecimal min, @Param("max") BigDecimal max);

    Mono<Long> countByActiveTrue();
}
```

### Entity (R2DBC uses @Table, not @Entity)

```java
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;
import org.springframework.data.relational.core.mapping.Column;

@Table("products")
public record Product(
    @Id Long id,
    String name,
    String sku,
    BigDecimal price,
    String category,
    boolean active,
    @Column("created_at") Instant createdAt
) {}
```

R2DBC does not support lazy loading or joins. Use `DatabaseClient` for complex queries or join in the service layer.

## Reactive Security

```java
@Configuration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .authorizeExchange(exchanges -> exchanges
                .pathMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                .pathMatchers("/api/admin/**").hasRole("ADMIN")
                .anyExchange().authenticated())
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
            .build();
    }

    @Bean
    public ReactiveJwtDecoder jwtDecoder() {
        return ReactiveJwtDecoders.fromIssuerLocation("https://auth.example.com/");
    }
}
```

### Accessing the Current User in Reactive Context

```java
@GetMapping("/profile")
public Mono<UserProfile> getProfile() {
    return ReactiveSecurityContextHolder.getContext()
        .map(SecurityContext::getAuthentication)
        .map(auth -> (Jwt) auth.getPrincipal())
        .flatMap(jwt -> userService.findById(jwt.getClaimAsString("sub")));
}
```

## Server-Sent Events

```java
@GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public Flux<ServerSentEvent<MetricEvent>> streamMetrics() {
    return metricsService.streamMetrics()
        .map(event -> ServerSentEvent.<MetricEvent>builder()
            .id(UUID.randomUUID().toString())
            .event("metric")
            .data(event)
            .retry(Duration.ofSeconds(5))
            .build());
}
```

## Testing Reactive Endpoints

```java
@WebFluxTest(ProductController.class)
class ProductControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    private ProductService productService;

    @Test
    @WithMockUser
    void streamProducts_returnsSSE() {
        when(productService.streamUpdates())
            .thenReturn(Flux.just(
                new ProductEvent("p-1", "CREATED"),
                new ProductEvent("p-2", "UPDATED")
            ));

        webTestClient.get()
            .uri("/api/products/stream")
            .accept(MediaType.TEXT_EVENT_STREAM)
            .exchange()
            .expectStatus().isOk()
            .expectHeader().contentTypeCompatibleWith(MediaType.TEXT_EVENT_STREAM)
            .expectBodyList(ProductEvent.class)
            .hasSize(2);
    }

    @Test
    @WithMockUser
    void getProduct_notFound_returns404() {
        when(productService.findById("nonexistent"))
            .thenReturn(Mono.empty());

        webTestClient.get()
            .uri("/api/products/nonexistent")
            .exchange()
            .expectStatus().isNotFound();
    }
}
```

## StepVerifier for Unit Testing Reactive Streams

```java
@Test
void streamMetrics_filtersZeroValues() {
    var service = new MetricsService(mockWebClient, mockRepository);

    StepVerifier.create(service.streamMetrics("cpu"))
        .expectNextMatches(event -> event.value() > 0)
        .expectNextMatches(event -> event.value() > 0)
        .thenCancel()
        .verify(Duration.ofSeconds(10));
}

@Test
void findById_notFound_returnsEmpty() {
    when(repository.findById("missing")).thenReturn(Mono.empty());

    StepVerifier.create(service.findById("missing"))
        .expectComplete()
        .verify();
}
```
