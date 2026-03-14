# Example: Migrating a Spring Boot Service to Virtual Threads

## Scenario

An order service makes 3 blocking HTTP calls per request to fetch product details, inventory status, and pricing from downstream microservices. The current implementation uses a `ThreadPoolTaskExecutor` with 200 platform threads that saturates under peak load.

## Before (Platform Threads)

```java
@Service
public class OrderEnrichmentService {

    private final RestTemplate restTemplate;
    private final ExecutorService executor = Executors.newFixedThreadPool(200);

    public EnrichedOrder enrich(String orderId) throws Exception {
        Order order = orderRepository.findById(orderId).orElseThrow();

        Future<Product> productFuture = executor.submit(() ->
            restTemplate.getForObject("/products/" + order.productId(), Product.class));
        Future<Inventory> inventoryFuture = executor.submit(() ->
            restTemplate.getForObject("/inventory/" + order.productId(), Inventory.class));
        Future<Pricing> pricingFuture = executor.submit(() ->
            restTemplate.getForObject("/pricing/" + order.productId(), Pricing.class));

        return new EnrichedOrder(order, productFuture.get(), inventoryFuture.get(), pricingFuture.get());
    }
}
```

## After (Virtual Threads + Structured Concurrency)

### application.properties

```properties
# Spring Boot 3.2+ virtual thread support
spring.threads.virtual.enabled=true
```

### OrderEnrichmentService.java

```java
@Service
public class OrderEnrichmentService {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    // Inject dependencies -- no thread pool configuration needed
    public OrderEnrichmentService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(2))
            .build();
    }

    public EnrichedOrder enrich(String orderId) throws Exception {
        Order order = orderRepository.findById(orderId).orElseThrow();
        String productId = order.productId();

        // Structured concurrency: all 3 calls run in parallel on virtual threads.
        // If any fails, the others are automatically cancelled.
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {

            Subtask<Product> productTask = scope.fork(() ->
                fetchJson("/products/" + productId, Product.class));
            Subtask<Inventory> inventoryTask = scope.fork(() ->
                fetchJson("/inventory/" + productId, Inventory.class));
            Subtask<Pricing> pricingTask = scope.fork(() ->
                fetchJson("/pricing/" + productId, Pricing.class));

            scope.join();            // Wait for all tasks
            scope.throwIfFailed();   // Propagate the first failure

            return new EnrichedOrder(
                order,
                productTask.get(),
                inventoryTask.get(),
                pricingTask.get()
            );
        }
    }

    private <T> T fetchJson(String path, Class<T> type) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://internal-api.example.com" + path))
            .timeout(Duration.ofSeconds(3))
            .GET()
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() >= 400) {
            throw new ServiceCallException(path, response.statusCode());
        }

        return objectMapper.readValue(response.body(), type);
    }
}
```

### Removing synchronized (carrier pinning fix)

```java
// BEFORE: synchronized pins the virtual thread to its carrier
public class RateLimiter {
    private int tokens;

    public synchronized boolean tryAcquire() {
        if (tokens > 0) { tokens--; return true; }
        return false;
    }
}

// AFTER: ReentrantLock does not pin the carrier thread
public class RateLimiter {
    private final ReentrantLock lock = new ReentrantLock();
    private int tokens;

    public boolean tryAcquire() {
        lock.lock();
        try {
            if (tokens > 0) { tokens--; return true; }
            return false;
        } finally {
            lock.unlock();
        }
    }
}
```

## Key Decisions

1. **`spring.threads.virtual.enabled=true`** makes Spring Boot use virtual threads for request handling, eliminating the 200-thread bottleneck.
2. **`StructuredTaskScope.ShutdownOnFailure`** runs all 3 downstream calls in parallel and cancels siblings if one fails. No manual `Future` management.
3. **`scope.join()` + `scope.throwIfFailed()`** is the required two-step pattern. Omitting either causes bugs (silent failures or orphaned tasks).
4. **`ReentrantLock` replaces `synchronized`** to avoid carrier thread pinning, which would block other virtual threads sharing that carrier.
5. **`HttpClient` replaces `RestTemplate`** because `HttpClient` works naturally with virtual threads (its `send()` method blocks the virtual thread, not the carrier).
6. **Per-request timeouts** via `HttpRequest.Builder.timeout()` prevent one slow downstream from holding resources indefinitely.
